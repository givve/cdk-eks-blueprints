"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericClusterProviderV2 = exports.ClusterBuilderV2 = exports.defaultOptionsv2 = exports.GenericClusterPropsV2Constraints = exports.ComputeConfigConstraints = void 0;
exports.clusterBuilderv2 = clusterBuilderv2;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const autoscaling = require("aws-cdk-lib/aws-autoscaling");
const ec2 = require("aws-cdk-lib/aws-ec2");
const eks = require("@aws-cdk/aws-eks-v2-alpha");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const spi_1 = require("../spi");
const utils = require("../utils");
const constants = require("./constants");
const assert = require("assert");
const generic_cluster_provider_1 = require("./generic-cluster-provider");
const semver = require("semver");
function clusterBuilderv2() {
    return new ClusterBuilderV2();
}
class ComputeConfigConstraints {
    nodePools = new utils.ArrayConstraint(0, 2);
}
exports.ComputeConfigConstraints = ComputeConfigConstraints;
class GenericClusterPropsV2Constraints {
    /**
     * managedNodeGroups per cluster have a soft limit of 30 managed node groups per EKS cluster, and as little as 0. But we multiply that
     * by a factor of 5 to 150 in case of situations of a hard limit request being accepted, and as a result the limit would be raised.
     * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
     */
    managedNodeGroups = new utils.ArrayConstraint(0, 150);
    /**
     * autoscalingNodeGroups per cluster have a soft limit of 500 autoscaling node groups per EKS cluster, and as little as 0. But we multiply that
     * by a factor of 5 to 2500 in case of situations of a hard limit request being accepted, and as a result the limit would be raised.
     * https://docs.aws.amazon.com/autoscaling/ec2/userguide/ec2-auto-scaling-quotas.html
     */
    autoscalingNodeGroups = new utils.ArrayConstraint(0, 5000);
}
exports.GenericClusterPropsV2Constraints = GenericClusterPropsV2Constraints;
exports.defaultOptionsv2 = {};
class ClusterBuilderV2 {
    props = {};
    privateCluster = false;
    managedNodeGroups = [];
    autoscalingNodeGroups = [];
    compute;
    fargateProfiles = {};
    constructor() {
        this.props = { ...this.props };
    }
    withCommonOptions(options) {
        this.props = { ...this.props, ...options };
        return this;
    }
    managedNodeGroup(...nodeGroups) {
        this.managedNodeGroups = this.managedNodeGroups.concat(nodeGroups);
        return this;
    }
    autoscalingGroup(...nodeGroups) {
        this.autoscalingNodeGroups = this.autoscalingNodeGroups.concat(nodeGroups);
        return this;
    }
    computeConfig(config) {
        this.compute = config;
        return this;
    }
    fargateProfile(name, options) {
        this.fargateProfiles[name] = options;
        return this;
    }
    version(version) {
        this.props = { ...this.props, version };
        return this;
    }
    build() {
        return new GenericClusterProviderV2({
            ...this.props,
            privateCluster: this.privateCluster,
            managedNodeGroups: this.managedNodeGroups,
            autoscalingNodeGroups: this.autoscalingNodeGroups,
            compute: this.compute,
            fargateProfiles: this.fargateProfiles,
        });
    }
}
exports.ClusterBuilderV2 = ClusterBuilderV2;
/**
 * Cluster provider implementation that supports multiple node groups.
 */
class GenericClusterProviderV2 {
    props;
    constructor(props) {
        this.props = props;
        this.validateInput(props);
        const computeTypesEnabled = [
            props.managedNodeGroups && props.managedNodeGroups.length > 0,
            props.autoscalingNodeGroups && props.autoscalingNodeGroups.length > 0,
            props.compute != undefined,
        ].filter(Boolean).length;
        // Assert that only one compute type is enabled
        assert(computeTypesEnabled <= 1, 'Only one compute type can be enabled: managed node groups, autoscaling node groups, or automode configuration.  Mixing these is not supported. Please file a request on GitHub to add this support if needed.');
    }
    /**
     * @override
     */
    createCluster(scope, vpc, secretsEncryptionKey, kubernetesVersion, clusterLogging, ipFamily) {
        const id = scope.node.id;
        // Props for the cluster.
        const clusterName = this.props.clusterName ?? id;
        if (!kubernetesVersion && !this.props.version) {
            throw new Error('Version was not specified by cluster builder or in cluster provider props, must be specified in one of these');
        }
        const version = kubernetesVersion || this.props.version || eks.KubernetesVersion.V1_30;
        let privateCluster = this.props.privateCluster ??
            utils.valueFromContext(scope, constants.PRIVATE_CLUSTER, false);
        privateCluster = privateCluster ? privateCluster === 'true' : false;
        let isolatedCluster = this.props.isolatedCluster ??
            utils.valueFromContext(scope, constants.ISOLATED_CLUSTER, false);
        isolatedCluster = isolatedCluster ? isolatedCluster === 'true' : false;
        const endpointAccess = privateCluster === true
            ? eks.EndpointAccess.PRIVATE
            : eks.EndpointAccess.PUBLIC_AND_PRIVATE;
        const vpcSubnets = this.props.vpcSubnets ??
            (isolatedCluster === true
                ? [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }]
                : privateCluster === true
                    ? [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
                    : undefined);
        const mastersRole = this.props.mastersRole ??
            new aws_iam_1.Role(scope, `${clusterName}-AccessRole`, {
                assumedBy: new aws_iam_1.AccountRootPrincipal(),
            });
        const kubectlLayer = this.getKubectlLayer(scope, version);
        const kubectlProviderOptions = kubectlLayer && { kubectlLayer };
        const tags = this.props.tags;
        const defaults = {
            vpc,
            secretsEncryptionKey,
            clusterName,
            clusterLogging,
            version,
            vpcSubnets,
            endpointAccess,
            kubectlProviderOptions,
            tags,
            mastersRole,
            defaultCapacityType: eks.DefaultCapacityType.AUTOMODE,
        };
        // merge (props override defaults)
        const clusterOptions = {
            ...defaults,
            ...this.props,
            version,
            ipFamily,
        };
        // If using NODEGROUP capacity and user wants to suppress the default MNG,
        // set defaultCapacity = 0 so CDK does not create the implicit default nodegroup.
        const capType = (clusterOptions.defaultCapacityType ??
            eks.DefaultCapacityType.AUTOMODE);
        if (capType === eks.DefaultCapacityType.NODEGROUP &&
            this.props.suppressDefaultNodegroup) {
            if (clusterOptions.defaultCapacity === undefined) {
                clusterOptions.defaultCapacity = 0;
            }
            // ensure no default instance type sneaks in
            if (clusterOptions.defaultCapacityInstance !== undefined) {
                delete clusterOptions.defaultCapacityInstance;
            }
        }
        // Create an EKS Cluster
        const cluster = this.internalCreateCluster(scope, id, clusterOptions);
        cluster.node.addDependency(vpc);
        const nodeGroups = [];
        this.props.managedNodeGroups?.forEach((n) => {
            const nodeGroup = this.addManagedNodeGroup(cluster, n);
            nodeGroups.push(nodeGroup);
        });
        const autoscalingGroups = [];
        this.props.autoscalingNodeGroups?.forEach((n) => {
            const autoscalingGroup = this.addAutoScalingGroup(cluster, n);
            autoscalingGroups.push(autoscalingGroup);
        });
        const autoMode = clusterOptions.defaultCapacityType != undefined &&
            clusterOptions.defaultCapacityType ==
                eks.DefaultCapacityType.AUTOMODE;
        if (autoMode && semver.lt(semver.coerce(version.version), '1.29.0')) {
            throw new Error('EKS Auto Mode is only supported for cluster versions of 1.29 or higher.');
        }
        const fargateProfiles = Object.entries(this.props.fargateProfiles ?? {});
        const fargateConstructs = [];
        fargateProfiles?.forEach(([key, options]) => fargateConstructs.push(this.addFargateProfile(cluster, key, options)));
        const nodePools = Object.entries(this.props.compute?.extraNodePools ?? {});
        const nodePoolConstructs = [];
        nodePools.forEach(([key, options]) => nodePoolConstructs.push(this.addNodePool(cluster, key, options)));
        return new spi_1.ClusterInfo(cluster, version, nodeGroups, autoscalingGroups, autoMode, fargateConstructs, cluster, nodeGroups);
    }
    /**
     * Template method that may be overridden by subclasses to create a specific cluster flavor (e.g. FargateCluster vs eks.Cluster)
     * @param scope
     * @param id
     * @param clusterOptions
     * @returns
     */
    internalCreateCluster(scope, id, clusterOptions) {
        return new eks.Cluster(scope, id, clusterOptions);
    }
    /**
     * Can be overridden to provide a custom kubectl layer.
     * @param scope
     * @param version
     * @returns
     */
    getKubectlLayer(scope, version) {
        return (0, generic_cluster_provider_1.selectKubectlLayer)(scope, version);
    }
    /**
     * Adds an autoscaling group to the cluster.
     * @param cluster
     * @param nodeGroup
     * @returns
     */
    addAutoScalingGroup(cluster, nodeGroup) {
        const machineImageType = nodeGroup.machineImageType ?? eks.MachineImageType.AMAZON_LINUX_2;
        const instanceTypeContext = utils.valueFromContext(cluster, constants.INSTANCE_TYPE_KEY, constants.DEFAULT_INSTANCE_TYPE);
        const instanceType = nodeGroup.instanceType ??
            (typeof instanceTypeContext === 'string'
                ? new ec2.InstanceType(instanceTypeContext)
                : instanceTypeContext);
        const minSize = nodeGroup.minSize ??
            utils.valueFromContext(cluster, constants.MIN_SIZE_KEY, constants.DEFAULT_NG_MINSIZE);
        const maxSize = nodeGroup.maxSize ??
            utils.valueFromContext(cluster, constants.MAX_SIZE_KEY, constants.DEFAULT_NG_MAXSIZE);
        const desiredSize = nodeGroup.desiredSize ??
            utils.valueFromContext(cluster, constants.DESIRED_SIZE_KEY, minSize);
        const updatePolicy = nodeGroup.updatePolicy ?? autoscaling.UpdatePolicy.rollingUpdate();
        // Create an autoscaling group
        return cluster.addAutoScalingGroupCapacity(nodeGroup.id, {
            ...nodeGroup,
            ...{
                autoScalingGroupName: nodeGroup.autoScalingGroupName ?? nodeGroup.id,
                machineImageType,
                instanceType,
                minCapacity: minSize,
                maxCapacity: maxSize,
                desiredCapacity: desiredSize,
                updatePolicy,
                vpcSubnets: nodeGroup.nodeGroupSubnets,
            },
        });
    }
    /**
     * Adds a fargate profile to the cluster
     */
    addFargateProfile(cluster, name, profileOptions) {
        return cluster.addFargateProfile(name, profileOptions);
    }
    /**
     * Add a node pool to the cluster
     */
    addNodePool(cluster, name, pool) {
        const labels = pool.labels || {};
        const annotations = pool.annotations || {};
        const taints = pool.taints || [];
        const startupTaints = pool.startupTaints || [];
        const requirements = pool.requirements || [];
        const disruption = pool.disruption || null;
        const limits = pool.limits || null;
        const weight = pool.weight || null;
        const poolManifest = {
            apiVersion: 'karpenter.sh/v1',
            kind: 'NodePool',
            metadata: { name: name },
            spec: {
                template: {
                    metadata: { labels: labels, annotations: annotations },
                    spec: {
                        nodeClassRef: {
                            name: 'default',
                            group: 'eks.amazonaws.com',
                            kind: 'NodeClass',
                        },
                        taints: taints,
                        startupTaints: startupTaints,
                        requirements: utils.convertKeyPair(requirements),
                        expireAfter: pool.expireAfter,
                    },
                },
                disruption: disruption,
                limits: limits,
                weight: weight,
            },
        };
        return cluster.addManifest(name, poolManifest);
    }
    /**
     * Adds a managed node group to the cluster.
     * @param cluster
     * @param nodeGroup
     * @returns
     */
    addManagedNodeGroup(cluster, nodeGroup) {
        const capacityType = nodeGroup.nodeGroupCapacityType;
        const releaseVersion = nodeGroup.amiReleaseVersion;
        const instanceTypeContext = utils.valueFromContext(cluster, constants.INSTANCE_TYPE_KEY, constants.DEFAULT_INSTANCE_TYPE);
        const instanceTypes = nodeGroup.instanceTypes ?? [
            typeof instanceTypeContext === 'string'
                ? new ec2.InstanceType(instanceTypeContext)
                : instanceTypeContext,
        ];
        const minSize = nodeGroup.minSize ??
            utils.valueFromContext(cluster, constants.MIN_SIZE_KEY, constants.DEFAULT_NG_MINSIZE);
        const maxSize = nodeGroup.maxSize ??
            utils.valueFromContext(cluster, constants.MAX_SIZE_KEY, constants.DEFAULT_NG_MAXSIZE);
        const desiredSize = nodeGroup.desiredSize ??
            utils.valueFromContext(cluster, constants.DESIRED_SIZE_KEY, minSize);
        // Create a managed node group.
        const nodegroupOptions = {
            ...nodeGroup,
            amiType: nodeGroup.amiType,
            ...{
                nodegroupName: nodeGroup.nodegroupName ?? nodeGroup.id,
                capacityType,
                instanceTypes,
                minSize,
                maxSize,
                desiredSize,
                releaseVersion,
                subnets: nodeGroup.nodeGroupSubnets,
            },
        };
        if (nodeGroup.launchTemplate) {
            // Create launch template with provided launch template properties
            const lt = new ec2.LaunchTemplate(cluster, `${nodeGroup.id}-lt`, {
                blockDevices: nodeGroup.launchTemplate.blockDevices,
                machineImage: nodeGroup.launchTemplate?.machineImage,
                securityGroup: nodeGroup.launchTemplate.securityGroup,
                userData: nodeGroup.launchTemplate?.userData,
                requireImdsv2: nodeGroup.launchTemplate?.requireImdsv2,
                httpPutResponseHopLimit: nodeGroup.launchTemplate?.httpPutResponseHopLimit,
            });
            utils.setPath(nodegroupOptions, 'launchTemplateSpec', {
                id: lt.launchTemplateId,
                version: lt.latestVersionNumber,
            });
            const tags = Object.entries(nodeGroup.launchTemplate.tags ?? {});
            tags.forEach(([key, options]) => aws_cdk_lib_1.Tags.of(lt).add(key, options));
            if (nodeGroup.launchTemplate?.machineImage) {
                delete nodegroupOptions.amiType;
                delete nodegroupOptions.releaseVersion;
                delete nodeGroup.amiReleaseVersion;
            }
        }
        const result = cluster.addNodegroupCapacity(nodeGroup.id + '-ng', nodegroupOptions);
        if (nodeGroup.enableSsmPermissions) {
            result.role.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        }
        return result;
    }
    validateInput(props) {
        utils.validateConstraints(new GenericClusterPropsV2Constraints(), GenericClusterProviderV2.name, props);
        if (props.managedNodeGroups != undefined)
            utils.validateConstraints(new generic_cluster_provider_1.ManagedNodeGroupConstraints(), 'ManagedNodeGroup', ...props.managedNodeGroups);
        if (props.autoscalingNodeGroups != undefined)
            utils.validateConstraints(new generic_cluster_provider_1.AutoscalingNodeGroupConstraints(), 'AutoscalingNodeGroups', ...props.autoscalingNodeGroups);
        if (props.compute != undefined)
            utils.validateConstraints(new ComputeConfigConstraints(), 'ComputeConfigConstraints', props.compute);
        if (props.fargateProfiles != undefined)
            utils.validateConstraints(new generic_cluster_provider_1.FargateProfileConstraints(), 'FargateProfiles', ...Object.values(props.fargateProfiles));
    }
}
exports.GenericClusterProviderV2 = GenericClusterProviderV2;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJpYy1jbHVzdGVyLXByb3ZpZGVyLXYyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NsdXN0ZXItcHJvdmlkZXJzL2dlbmVyaWMtY2x1c3Rlci1wcm92aWRlci12Mi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUF1QkEsNENBRUM7QUF6QkQsNkNBQW1DO0FBQ25DLDJEQUEyRDtBQUMzRCwyQ0FBMkM7QUFDM0MsaURBQWlEO0FBRWpELGlEQUFnRjtBQUloRixnQ0FBc0Q7QUFDdEQsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUV6QyxpQ0FBa0M7QUFDbEMseUVBS29DO0FBRXBDLGlDQUFpQztBQUVqQyxTQUFnQixnQkFBZ0I7SUFDOUIsT0FBTyxJQUFJLGdCQUFnQixFQUFFLENBQUM7QUFDaEMsQ0FBQztBQWdFRCxNQUFhLHdCQUF3QjtJQUduQyxTQUFTLEdBQUcsSUFBSSxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztDQUM3QztBQUpELDREQUlDO0FBRUQsTUFBYSxnQ0FBZ0M7SUFHM0M7Ozs7T0FJRztJQUNILGlCQUFpQixHQUFHLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDdEQ7Ozs7T0FJRztJQUNILHFCQUFxQixHQUFHLElBQUksS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDNUQ7QUFmRCw0RUFlQztBQUVZLFFBQUEsZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0FBRW5DLE1BQWEsZ0JBQWdCO0lBQ25CLEtBQUssR0FBMkMsRUFBRSxDQUFDO0lBQ25ELGNBQWMsR0FBRyxLQUFLLENBQUM7SUFDdkIsaUJBQWlCLEdBQXVCLEVBQUUsQ0FBQztJQUMzQyxxQkFBcUIsR0FBMkIsRUFBRSxDQUFDO0lBQ25ELE9BQU8sQ0FBZ0I7SUFDdkIsZUFBZSxHQUVuQixFQUFFLENBQUM7SUFFUDtRQUNFLElB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YUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUYWdzIH0gZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xyXG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XHJcbmltcG9ydCAqIGFzIGVrcyBmcm9tICdAYXdzLWNkay9hd3MtZWtzLXYyLWFscGhhJztcclxuaW1wb3J0ICogYXMgZWtzdjEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVrcyc7XHJcbmltcG9ydCB7IEFjY291bnRSb290UHJpbmNpcGFsLCBNYW5hZ2VkUG9saWN5LCBSb2xlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcbmltcG9ydCB7IElLZXkgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mta21zJztcclxuaW1wb3J0IHsgSUxheWVyVmVyc2lvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8sIENsdXN0ZXJQcm92aWRlciB9IGZyb20gJy4uL3NwaSc7XHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gJy4uL3V0aWxzJztcclxuaW1wb3J0ICogYXMgY29uc3RhbnRzIGZyb20gJy4vY29uc3RhbnRzJztcclxuaW1wb3J0IHsgQXV0b3NjYWxpbmdOb2RlR3JvdXAsIE1hbmFnZWROb2RlR3JvdXAgfSBmcm9tICcuL3R5cGVzJztcclxuaW1wb3J0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xyXG5pbXBvcnQge1xyXG4gIHNlbGVjdEt1YmVjdGxMYXllcixcclxuICBBdXRvc2NhbGluZ05vZGVHcm91cENvbnN0cmFpbnRzLFxyXG4gIEZhcmdhdGVQcm9maWxlQ29uc3RyYWludHMsXHJcbiAgTWFuYWdlZE5vZGVHcm91cENvbnN0cmFpbnRzLFxyXG59IGZyb20gJy4vZ2VuZXJpYy1jbHVzdGVyLXByb3ZpZGVyJztcclxuaW1wb3J0IHsgTm9kZVBvb2xWMVNwZWMgfSBmcm9tICcuLi9hZGRvbnMva2FycGVudGVyL3R5cGVzJztcclxuaW1wb3J0ICogYXMgc2VtdmVyIGZyb20gJ3NlbXZlcic7XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gY2x1c3RlckJ1aWxkZXJ2MigpIHtcclxuICByZXR1cm4gbmV3IENsdXN0ZXJCdWlsZGVyVjIoKTtcclxufVxyXG5cclxuZXhwb3J0IGludGVyZmFjZSBDb21wdXRlQ29uZmlnIGV4dGVuZHMgZWtzLkNvbXB1dGVDb25maWcge1xyXG4gIC8qKlxyXG4gICAqIEV4dHJhIG5vZGUgcG9vbHMgdG8gYmUgYWRkZWQgdG8gdGhlIEF1dG8gTW9kZSBDbHVzdGVyXHJcbiAgICovXHJcbiAgZXh0cmFOb2RlUG9vbHM/OiB7XHJcbiAgICBba2V5OiBzdHJpbmddOiBOb2RlUG9vbFYxU3BlYztcclxuICB9O1xyXG59XHJcblxyXG4vKipcclxuICogUHJvcGVydGllcyBmb3IgdGhlIGdlbmVyaWMgY2x1c3RlciBwcm92aWRlciwgY29udGFpbmluZyBkZWZpbml0aW9ucyBvZiBtYW5hZ2VkIG5vZGUgZ3JvdXBzLFxyXG4gKiBhdXRvLXNjYWxpbmcgZ3JvdXBzLCBmYXJnYXRlIHByb2ZpbGVzLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBHZW5lcmljQ2x1c3RlclByb3ZpZGVyVjJQcm9wc1xyXG4gIGV4dGVuZHMgUGFydGlhbDxla3MuQ2x1c3RlclByb3BzPiB7XHJcbiAgLyoqXHJcbiAgICogV2hldGhlciBjbHVzdGVyIGhhcyBpbnRlcm5ldCBhY2Nlc3MuXHJcbiAgICovXHJcbiAgaXNvbGF0ZWRDbHVzdGVyPzogYm9vbGVhbjtcclxuXHJcbiAgLyoqXHJcbiAgICogV2hldGhlciBBUEkgc2VydmVyIGlzIHByaXZhdGUuXHJcbiAgICovXHJcbiAgcHJpdmF0ZUNsdXN0ZXI/OiBib29sZWFuO1xyXG5cclxuICAvKipcclxuICAgKiBBcnJheSBvZiBtYW5hZ2VkIG5vZGUgZ3JvdXBzLlxyXG4gICAqL1xyXG4gIG1hbmFnZWROb2RlR3JvdXBzPzogTWFuYWdlZE5vZGVHcm91cFtdO1xyXG5cclxuICAvKipcclxuICAgKiBBcnJheSBvZiBhdXRvc2NhbGluZyBub2RlIGdyb3Vwcy5cclxuICAgKi9cclxuICBhdXRvc2NhbGluZ05vZGVHcm91cHM/OiBBdXRvc2NhbGluZ05vZGVHcm91cFtdO1xyXG5cclxuICAvKipcclxuICAgKiBFS1MgQXV0b21vZGUgY29tcHV0ZSBjb25maWdcclxuICAgKi9cclxuICBjb21wdXRlPzogQ29tcHV0ZUNvbmZpZztcclxuXHJcbiAgLyoqXHJcbiAgICogRmFyZ2F0ZSBwcm9maWxlc1xyXG4gICAqL1xyXG4gIGZhcmdhdGVQcm9maWxlcz86IHtcclxuICAgIFtrZXk6IHN0cmluZ106IGVrcy5GYXJnYXRlUHJvZmlsZU9wdGlvbnM7XHJcbiAgfTtcclxuXHJcbiAgLyoqXHJcbiAgICogVGFncyBmb3IgdGhlIGNsdXN0ZXJcclxuICAgKi9cclxuICB0YWdzPzoge1xyXG4gICAgW2tleTogc3RyaW5nXTogc3RyaW5nO1xyXG4gIH07XHJcblxyXG4gIC8qKlxyXG4gICAqIFN1cHByZXNzIHRoZSBkZWZhdWx0IG1hbmFnZWQgbm9kZSBncm91cCB3aGVuIHVzaW5nIERlZmF1bHRDYXBhY2l0eVR5cGUuTk9ERUdST1VQLlxyXG4gICAqIElmIHRydWUsIHRoZSBwcm92aWRlciBzZXRzIENsdXN0ZXJQcm9wcy5kZWZhdWx0Q2FwYWNpdHkgPSAwIHNvIG5vIGRlZmF1bHQgTkcgaXMgY3JlYXRlZC5cclxuICAgKiBEZWZhdWx0OiBmYWxzZVxyXG4gICAqL1xyXG4gIHN1cHByZXNzRGVmYXVsdE5vZGVncm91cD86IGJvb2xlYW47XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBDb21wdXRlQ29uZmlnQ29uc3RyYWludHNcclxuICBpbXBsZW1lbnRzIHV0aWxzLkNvbnN0cmFpbnRzVHlwZTxDb21wdXRlQ29uZmlnPlxyXG57XHJcbiAgbm9kZVBvb2xzID0gbmV3IHV0aWxzLkFycmF5Q29uc3RyYWludCgwLCAyKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEdlbmVyaWNDbHVzdGVyUHJvcHNWMkNvbnN0cmFpbnRzXHJcbiAgaW1wbGVtZW50cyB1dGlscy5Db25zdHJhaW50c1R5cGU8R2VuZXJpY0NsdXN0ZXJQcm92aWRlclYyUHJvcHM+XHJcbntcclxuICAvKipcclxuICAgKiBtYW5hZ2VkTm9kZUdyb3VwcyBwZXIgY2x1c3RlciBoYXZlIGEgc29mdCBsaW1pdCBvZiAzMCBtYW5hZ2VkIG5vZGUgZ3JvdXBzIHBlciBFS1MgY2x1c3RlciwgYW5kIGFzIGxpdHRsZSBhcyAwLiBCdXQgd2UgbXVsdGlwbHkgdGhhdFxyXG4gICAqIGJ5IGEgZmFjdG9yIG9mIDUgdG8gMTUwIGluIGNhc2Ugb2Ygc2l0dWF0aW9ucyBvZiBhIGhhcmQgbGltaXQgcmVxdWVzdCBiZWluZyBhY2NlcHRlZCwgYW5kIGFzIGEgcmVzdWx0IHRoZSBsaW1pdCB3b3VsZCBiZSByYWlzZWQuXHJcbiAgICogaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL3NlcnZpY2UtcXVvdGFzLmh0bWxcclxuICAgKi9cclxuICBtYW5hZ2VkTm9kZUdyb3VwcyA9IG5ldyB1dGlscy5BcnJheUNvbnN0cmFpbnQoMCwgMTUwKTtcclxuICAvKipcclxuICAgKiBhdXRvc2NhbGluZ05vZGVHcm91cHMgcGVyIGNsdXN0ZXIgaGF2ZSBhIHNvZnQgbGltaXQgb2YgNTAwIGF1dG9zY2FsaW5nIG5vZGUgZ3JvdXBzIHBlciBFS1MgY2x1c3RlciwgYW5kIGFzIGxpdHRsZSBhcyAwLiBCdXQgd2UgbXVsdGlwbHkgdGhhdFxyXG4gICAqIGJ5IGEgZmFjdG9yIG9mIDUgdG8gMjUwMCBpbiBjYXNlIG9mIHNpdHVhdGlvbnMgb2YgYSBoYXJkIGxpbWl0IHJlcXVlc3QgYmVpbmcgYWNjZXB0ZWQsIGFuZCBhcyBhIHJlc3VsdCB0aGUgbGltaXQgd291bGQgYmUgcmFpc2VkLlxyXG4gICAqIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9hdXRvc2NhbGluZy9lYzIvdXNlcmd1aWRlL2VjMi1hdXRvLXNjYWxpbmctcXVvdGFzLmh0bWxcclxuICAgKi9cclxuICBhdXRvc2NhbGluZ05vZGVHcm91cHMgPSBuZXcgdXRpbHMuQXJyYXlDb25zdHJhaW50KDAsIDUwMDApO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZGVmYXVsdE9wdGlvbnN2MiA9IHt9O1xyXG5cclxuZXhwb3J0IGNsYXNzIENsdXN0ZXJCdWlsZGVyVjIge1xyXG4gIHByaXZhdGUgcHJvcHM6IFBhcnRpYWw8R2VuZXJpY0NsdXN0ZXJQcm92aWRlclYyUHJvcHM+ID0ge307XHJcbiAgcHJpdmF0ZSBwcml2YXRlQ2x1c3RlciA9IGZhbHNlO1xyXG4gIHByaXZhdGUgbWFuYWdlZE5vZGVHcm91cHM6IE1hbmFnZWROb2RlR3JvdXBbXSA9IFtdO1xyXG4gIHByaXZhdGUgYXV0b3NjYWxpbmdOb2RlR3JvdXBzOiBBdXRvc2NhbGluZ05vZGVHcm91cFtdID0gW107XHJcbiAgcHJpdmF0ZSBjb21wdXRlOiBDb21wdXRlQ29uZmlnO1xyXG4gIHByaXZhdGUgZmFyZ2F0ZVByb2ZpbGVzOiB7XHJcbiAgICBba2V5OiBzdHJpbmddOiBla3MuRmFyZ2F0ZVByb2ZpbGVPcHRpb25zO1xyXG4gIH0gPSB7fTtcclxuXHJcbiAgY29uc3RydWN0b3IoKSB7XHJcbiAgICB0aGlzLnByb3BzID0geyAuLi50aGlzLnByb3BzIH07XHJcbiAgfVxyXG5cclxuICB3aXRoQ29tbW9uT3B0aW9ucyhvcHRpb25zOiBQYXJ0aWFsPGVrcy5DbHVzdGVyUHJvcHM+KTogdGhpcyB7XHJcbiAgICB0aGlzLnByb3BzID0geyAuLi50aGlzLnByb3BzLCAuLi5vcHRpb25zIH07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIG1hbmFnZWROb2RlR3JvdXAoLi4ubm9kZUdyb3VwczogTWFuYWdlZE5vZGVHcm91cFtdKTogdGhpcyB7XHJcbiAgICB0aGlzLm1hbmFnZWROb2RlR3JvdXBzID0gdGhpcy5tYW5hZ2VkTm9kZUdyb3Vwcy5jb25jYXQobm9kZUdyb3Vwcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIGF1dG9zY2FsaW5nR3JvdXAoLi4ubm9kZUdyb3VwczogQXV0b3NjYWxpbmdOb2RlR3JvdXBbXSk6IHRoaXMge1xyXG4gICAgdGhpcy5hdXRvc2NhbGluZ05vZGVHcm91cHMgPSB0aGlzLmF1dG9zY2FsaW5nTm9kZUdyb3Vwcy5jb25jYXQobm9kZUdyb3Vwcyk7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIGNvbXB1dGVDb25maWcoY29uZmlnOiBDb21wdXRlQ29uZmlnKTogdGhpcyB7XHJcbiAgICB0aGlzLmNvbXB1dGUgPSBjb25maWc7XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIGZhcmdhdGVQcm9maWxlKG5hbWU6IHN0cmluZywgb3B0aW9uczogZWtzLkZhcmdhdGVQcm9maWxlT3B0aW9ucyk6IHRoaXMge1xyXG4gICAgdGhpcy5mYXJnYXRlUHJvZmlsZXNbbmFtZV0gPSBvcHRpb25zO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICB2ZXJzaW9uKHZlcnNpb246IGVrcy5LdWJlcm5ldGVzVmVyc2lvbik6IHRoaXMge1xyXG4gICAgdGhpcy5wcm9wcyA9IHsgLi4udGhpcy5wcm9wcywgdmVyc2lvbiB9O1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICBidWlsZCgpIHtcclxuICAgIHJldHVybiBuZXcgR2VuZXJpY0NsdXN0ZXJQcm92aWRlclYyKHtcclxuICAgICAgLi4udGhpcy5wcm9wcyxcclxuICAgICAgcHJpdmF0ZUNsdXN0ZXI6IHRoaXMucHJpdmF0ZUNsdXN0ZXIsXHJcbiAgICAgIG1hbmFnZWROb2RlR3JvdXBzOiB0aGlzLm1hbmFnZWROb2RlR3JvdXBzLFxyXG4gICAgICBhdXRvc2NhbGluZ05vZGVHcm91cHM6IHRoaXMuYXV0b3NjYWxpbmdOb2RlR3JvdXBzLFxyXG4gICAgICBjb21wdXRlOiB0aGlzLmNvbXB1dGUsXHJcbiAgICAgIGZhcmdhdGVQcm9maWxlczogdGhpcy5mYXJnYXRlUHJvZmlsZXMsXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDbHVzdGVyIHByb3ZpZGVyIGltcGxlbWVudGF0aW9uIHRoYXQgc3VwcG9ydHMgbXVsdGlwbGUgbm9kZSBncm91cHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR2VuZXJpY0NsdXN0ZXJQcm92aWRlclYyIGltcGxlbWVudHMgQ2x1c3RlclByb3ZpZGVyIHtcclxuICBjb25zdHJ1Y3RvcihyZWFkb25seSBwcm9wczogR2VuZXJpY0NsdXN0ZXJQcm92aWRlclYyUHJvcHMpIHtcclxuICAgIHRoaXMudmFsaWRhdGVJbnB1dChwcm9wcyk7XHJcblxyXG4gICAgY29uc3QgY29tcHV0ZVR5cGVzRW5hYmxlZCA9IFtcclxuICAgICAgcHJvcHMubWFuYWdlZE5vZGVHcm91cHMgJiYgcHJvcHMubWFuYWdlZE5vZGVHcm91cHMubGVuZ3RoID4gMCxcclxuICAgICAgcHJvcHMuYXV0b3NjYWxpbmdOb2RlR3JvdXBzICYmIHByb3BzLmF1dG9zY2FsaW5nTm9kZUdyb3Vwcy5sZW5ndGggPiAwLFxyXG4gICAgICBwcm9wcy5jb21wdXRlICE9IHVuZGVmaW5lZCxcclxuICAgIF0uZmlsdGVyKEJvb2xlYW4pLmxlbmd0aDtcclxuXHJcbiAgICAvLyBBc3NlcnQgdGhhdCBvbmx5IG9uZSBjb21wdXRlIHR5cGUgaXMgZW5hYmxlZFxyXG4gICAgYXNzZXJ0KFxyXG4gICAgICBjb21wdXRlVHlwZXNFbmFibGVkIDw9IDEsXHJcbiAgICAgICdPbmx5IG9uZSBjb21wdXRlIHR5cGUgY2FuIGJlIGVuYWJsZWQ6IG1hbmFnZWQgbm9kZSBncm91cHMsIGF1dG9zY2FsaW5nIG5vZGUgZ3JvdXBzLCBvciBhdXRvbW9kZSBjb25maWd1cmF0aW9uLiAgTWl4aW5nIHRoZXNlIGlzIG5vdCBzdXBwb3J0ZWQuIFBsZWFzZSBmaWxlIGEgcmVxdWVzdCBvbiBHaXRIdWIgdG8gYWRkIHRoaXMgc3VwcG9ydCBpZiBuZWVkZWQuJ1xyXG4gICAgKTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEBvdmVycmlkZVxyXG4gICAqL1xyXG4gIGNyZWF0ZUNsdXN0ZXIoXHJcbiAgICBzY29wZTogQ29uc3RydWN0LFxyXG4gICAgdnBjOiBlYzIuSVZwYyxcclxuICAgIHNlY3JldHNFbmNyeXB0aW9uS2V5PzogSUtleSxcclxuICAgIGt1YmVybmV0ZXNWZXJzaW9uPzogZWtzLkt1YmVybmV0ZXNWZXJzaW9uLFxyXG4gICAgY2x1c3RlckxvZ2dpbmc/OiBla3MuQ2x1c3RlckxvZ2dpbmdUeXBlc1tdLFxyXG4gICAgaXBGYW1pbHk/OiBla3MuSXBGYW1pbHlcclxuICApOiBDbHVzdGVySW5mbyB7XHJcbiAgICBjb25zdCBpZCA9IHNjb3BlLm5vZGUuaWQ7XHJcblxyXG4gICAgLy8gUHJvcHMgZm9yIHRoZSBjbHVzdGVyLlxyXG4gICAgY29uc3QgY2x1c3Rlck5hbWUgPSB0aGlzLnByb3BzLmNsdXN0ZXJOYW1lID8/IGlkO1xyXG4gICAgaWYgKCFrdWJlcm5ldGVzVmVyc2lvbiAmJiAhdGhpcy5wcm9wcy52ZXJzaW9uKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAnVmVyc2lvbiB3YXMgbm90IHNwZWNpZmllZCBieSBjbHVzdGVyIGJ1aWxkZXIgb3IgaW4gY2x1c3RlciBwcm92aWRlciBwcm9wcywgbXVzdCBiZSBzcGVjaWZpZWQgaW4gb25lIG9mIHRoZXNlJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgY29uc3QgdmVyc2lvbjogZWtzLkt1YmVybmV0ZXNWZXJzaW9uID1cclxuICAgICAga3ViZXJuZXRlc1ZlcnNpb24gfHwgdGhpcy5wcm9wcy52ZXJzaW9uIHx8IGVrcy5LdWJlcm5ldGVzVmVyc2lvbi5WMV8zMDtcclxuXHJcbiAgICBsZXQgcHJpdmF0ZUNsdXN0ZXIgPVxyXG4gICAgICB0aGlzLnByb3BzLnByaXZhdGVDbHVzdGVyID8/XHJcbiAgICAgIHV0aWxzLnZhbHVlRnJvbUNvbnRleHQoc2NvcGUsIGNvbnN0YW50cy5QUklWQVRFX0NMVVNURVIsIGZhbHNlKTtcclxuICAgIHByaXZhdGVDbHVzdGVyID0gcHJpdmF0ZUNsdXN0ZXIgPyBwcml2YXRlQ2x1c3RlciA9PT0gJ3RydWUnIDogZmFsc2U7XHJcbiAgICBsZXQgaXNvbGF0ZWRDbHVzdGVyID1cclxuICAgICAgdGhpcy5wcm9wcy5pc29sYXRlZENsdXN0ZXIgPz9cclxuICAgICAgdXRpbHMudmFsdWVGcm9tQ29udGV4dChzY29wZSwgY29uc3RhbnRzLklTT0xBVEVEX0NMVVNURVIsIGZhbHNlKTtcclxuICAgIGlzb2xhdGVkQ2x1c3RlciA9IGlzb2xhdGVkQ2x1c3RlciA/IGlzb2xhdGVkQ2x1c3RlciA9PT0gJ3RydWUnIDogZmFsc2U7XHJcblxyXG4gICAgY29uc3QgZW5kcG9pbnRBY2Nlc3MgPVxyXG4gICAgICBwcml2YXRlQ2x1c3RlciA9PT0gdHJ1ZVxyXG4gICAgICAgID8gZWtzLkVuZHBvaW50QWNjZXNzLlBSSVZBVEVcclxuICAgICAgICA6IGVrcy5FbmRwb2ludEFjY2Vzcy5QVUJMSUNfQU5EX1BSSVZBVEU7XHJcbiAgICBjb25zdCB2cGNTdWJuZXRzID1cclxuICAgICAgdGhpcy5wcm9wcy52cGNTdWJuZXRzID8/XHJcbiAgICAgIChpc29sYXRlZENsdXN0ZXIgPT09IHRydWVcclxuICAgICAgICA/IFt7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQgfV1cclxuICAgICAgICA6IHByaXZhdGVDbHVzdGVyID09PSB0cnVlXHJcbiAgICAgICAgPyBbeyBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX1dJVEhfRUdSRVNTIH1dXHJcbiAgICAgICAgOiB1bmRlZmluZWQpO1xyXG4gICAgY29uc3QgbWFzdGVyc1JvbGUgPVxyXG4gICAgICB0aGlzLnByb3BzLm1hc3RlcnNSb2xlID8/XHJcbiAgICAgIG5ldyBSb2xlKHNjb3BlLCBgJHtjbHVzdGVyTmFtZX0tQWNjZXNzUm9sZWAsIHtcclxuICAgICAgICBhc3N1bWVkQnk6IG5ldyBBY2NvdW50Um9vdFByaW5jaXBhbCgpLFxyXG4gICAgICB9KTtcclxuXHJcbiAgICBjb25zdCBrdWJlY3RsTGF5ZXIgPSB0aGlzLmdldEt1YmVjdGxMYXllcihzY29wZSwgdmVyc2lvbik7XHJcbiAgICBjb25zdCBrdWJlY3RsUHJvdmlkZXJPcHRpb25zID0ga3ViZWN0bExheWVyICYmIHsga3ViZWN0bExheWVyIH07XHJcbiAgICBjb25zdCB0YWdzID0gdGhpcy5wcm9wcy50YWdzO1xyXG5cclxuICAgIGNvbnN0IGRlZmF1bHRzOiBQYXJ0aWFsPGVrcy5DbHVzdGVyUHJvcHM+ID0ge1xyXG4gICAgICB2cGMsXHJcbiAgICAgIHNlY3JldHNFbmNyeXB0aW9uS2V5LFxyXG4gICAgICBjbHVzdGVyTmFtZSxcclxuICAgICAgY2x1c3RlckxvZ2dpbmcsXHJcbiAgICAgIHZlcnNpb24sXHJcbiAgICAgIHZwY1N1Ym5ldHMsXHJcbiAgICAgIGVuZHBvaW50QWNjZXNzLFxyXG4gICAgICBrdWJlY3RsUHJvdmlkZXJPcHRpb25zLFxyXG4gICAgICB0YWdzLFxyXG4gICAgICBtYXN0ZXJzUm9sZSxcclxuICAgICAgZGVmYXVsdENhcGFjaXR5VHlwZTogZWtzLkRlZmF1bHRDYXBhY2l0eVR5cGUuQVVUT01PREUsXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIG1lcmdlIChwcm9wcyBvdmVycmlkZSBkZWZhdWx0cylcclxuICAgIGNvbnN0IGNsdXN0ZXJPcHRpb25zOiBQYXJ0aWFsPGVrcy5DbHVzdGVyUHJvcHM+ID0ge1xyXG4gICAgICAuLi5kZWZhdWx0cyxcclxuICAgICAgLi4udGhpcy5wcm9wcyxcclxuICAgICAgdmVyc2lvbixcclxuICAgICAgaXBGYW1pbHksXHJcbiAgICB9O1xyXG5cclxuICAgIC8vIElmIHVzaW5nIE5PREVHUk9VUCBjYXBhY2l0eSBhbmQgdXNlciB3YW50cyB0byBzdXBwcmVzcyB0aGUgZGVmYXVsdCBNTkcsXHJcbiAgICAvLyBzZXQgZGVmYXVsdENhcGFjaXR5ID0gMCBzbyBDREsgZG9lcyBub3QgY3JlYXRlIHRoZSBpbXBsaWNpdCBkZWZhdWx0IG5vZGVncm91cC5cclxuICAgIGNvbnN0IGNhcFR5cGUgPSAoY2x1c3Rlck9wdGlvbnMuZGVmYXVsdENhcGFjaXR5VHlwZSA/P1xyXG4gICAgICBla3MuRGVmYXVsdENhcGFjaXR5VHlwZS5BVVRPTU9ERSkgYXMgZWtzLkRlZmF1bHRDYXBhY2l0eVR5cGU7XHJcblxyXG4gICAgaWYgKFxyXG4gICAgICBjYXBUeXBlID09PSBla3MuRGVmYXVsdENhcGFjaXR5VHlwZS5OT0RFR1JPVVAgJiZcclxuICAgICAgdGhpcy5wcm9wcy5zdXBwcmVzc0RlZmF1bHROb2RlZ3JvdXBcclxuICAgICkge1xyXG4gICAgICBpZiAoKGNsdXN0ZXJPcHRpb25zIGFzIGFueSkuZGVmYXVsdENhcGFjaXR5ID09PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAoY2x1c3Rlck9wdGlvbnMgYXMgYW55KS5kZWZhdWx0Q2FwYWNpdHkgPSAwO1xyXG4gICAgICB9XHJcbiAgICAgIC8vIGVuc3VyZSBubyBkZWZhdWx0IGluc3RhbmNlIHR5cGUgc25lYWtzIGluXHJcbiAgICAgIGlmICgoY2x1c3Rlck9wdGlvbnMgYXMgYW55KS5kZWZhdWx0Q2FwYWNpdHlJbnN0YW5jZSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgZGVsZXRlIChjbHVzdGVyT3B0aW9ucyBhcyBhbnkpLmRlZmF1bHRDYXBhY2l0eUluc3RhbmNlO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgLy8gQ3JlYXRlIGFuIEVLUyBDbHVzdGVyXHJcbiAgICBjb25zdCBjbHVzdGVyID0gdGhpcy5pbnRlcm5hbENyZWF0ZUNsdXN0ZXIoc2NvcGUsIGlkLCBjbHVzdGVyT3B0aW9ucyk7XHJcbiAgICBjbHVzdGVyLm5vZGUuYWRkRGVwZW5kZW5jeSh2cGMpO1xyXG5cclxuICAgIGNvbnN0IG5vZGVHcm91cHM6IChla3MuTm9kZWdyb3VwIHwgZWtzdjEuTm9kZWdyb3VwKVtdID0gW107XHJcblxyXG4gICAgdGhpcy5wcm9wcy5tYW5hZ2VkTm9kZUdyb3Vwcz8uZm9yRWFjaCgobikgPT4ge1xyXG4gICAgICBjb25zdCBub2RlR3JvdXAgPSB0aGlzLmFkZE1hbmFnZWROb2RlR3JvdXAoY2x1c3RlciBhcyBla3MuQ2x1c3Rlciwgbik7XHJcbiAgICAgIG5vZGVHcm91cHMucHVzaChub2RlR3JvdXApO1xyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgYXV0b3NjYWxpbmdHcm91cHM6IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXBbXSA9IFtdO1xyXG4gICAgdGhpcy5wcm9wcy5hdXRvc2NhbGluZ05vZGVHcm91cHM/LmZvckVhY2goKG4pID0+IHtcclxuICAgICAgY29uc3QgYXV0b3NjYWxpbmdHcm91cCA9IHRoaXMuYWRkQXV0b1NjYWxpbmdHcm91cChcclxuICAgICAgICBjbHVzdGVyIGFzIGVrcy5DbHVzdGVyLFxyXG4gICAgICAgIG5cclxuICAgICAgKTtcclxuICAgICAgYXV0b3NjYWxpbmdHcm91cHMucHVzaChhdXRvc2NhbGluZ0dyb3VwKTtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGF1dG9Nb2RlID1cclxuICAgICAgY2x1c3Rlck9wdGlvbnMuZGVmYXVsdENhcGFjaXR5VHlwZSAhPSB1bmRlZmluZWQgJiZcclxuICAgICAgKGNsdXN0ZXJPcHRpb25zLmRlZmF1bHRDYXBhY2l0eVR5cGUgYXMgZWtzLkRlZmF1bHRDYXBhY2l0eVR5cGUpID09XHJcbiAgICAgICAgZWtzLkRlZmF1bHRDYXBhY2l0eVR5cGUuQVVUT01PREU7XHJcbiAgICBpZiAoYXV0b01vZGUgJiYgc2VtdmVyLmx0KHNlbXZlci5jb2VyY2UodmVyc2lvbi52ZXJzaW9uKSEsICcxLjI5LjAnKSkge1xyXG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXHJcbiAgICAgICAgJ0VLUyBBdXRvIE1vZGUgaXMgb25seSBzdXBwb3J0ZWQgZm9yIGNsdXN0ZXIgdmVyc2lvbnMgb2YgMS4yOSBvciBoaWdoZXIuJ1xyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGNvbnN0IGZhcmdhdGVQcm9maWxlcyA9IE9iamVjdC5lbnRyaWVzKHRoaXMucHJvcHMuZmFyZ2F0ZVByb2ZpbGVzID8/IHt9KTtcclxuICAgIGNvbnN0IGZhcmdhdGVDb25zdHJ1Y3RzOiBla3MuRmFyZ2F0ZVByb2ZpbGVbXSA9IFtdO1xyXG4gICAgZmFyZ2F0ZVByb2ZpbGVzPy5mb3JFYWNoKChba2V5LCBvcHRpb25zXSkgPT5cclxuICAgICAgZmFyZ2F0ZUNvbnN0cnVjdHMucHVzaChcclxuICAgICAgICB0aGlzLmFkZEZhcmdhdGVQcm9maWxlKGNsdXN0ZXIgYXMgZWtzLkNsdXN0ZXIsIGtleSwgb3B0aW9ucylcclxuICAgICAgKVxyXG4gICAgKTtcclxuXHJcbiAgICBjb25zdCBub2RlUG9vbHMgPSBPYmplY3QuZW50cmllcyh0aGlzLnByb3BzLmNvbXB1dGU/LmV4dHJhTm9kZVBvb2xzID8/IHt9KTtcclxuICAgIGNvbnN0IG5vZGVQb29sQ29uc3RydWN0czogZWtzLkt1YmVybmV0ZXNNYW5pZmVzdFtdID0gW107XHJcbiAgICBub2RlUG9vbHMuZm9yRWFjaCgoW2tleSwgb3B0aW9uc10pID0+XHJcbiAgICAgIG5vZGVQb29sQ29uc3RydWN0cy5wdXNoKFxyXG4gICAgICAgIHRoaXMuYWRkTm9kZVBvb2woY2x1c3RlciBhcyBla3MuQ2x1c3Rlciwga2V5LCBvcHRpb25zKVxyXG4gICAgICApXHJcbiAgICApO1xyXG5cclxuICAgIHJldHVybiBuZXcgQ2x1c3RlckluZm8oXHJcbiAgICAgIGNsdXN0ZXIgYXMgZWtzdjEuQ2x1c3RlcixcclxuICAgICAgdmVyc2lvbixcclxuICAgICAgbm9kZUdyb3VwcyBhcyBla3N2MS5Ob2RlZ3JvdXBbXSxcclxuICAgICAgYXV0b3NjYWxpbmdHcm91cHMsXHJcbiAgICAgIGF1dG9Nb2RlLFxyXG4gICAgICBmYXJnYXRlQ29uc3RydWN0cyxcclxuICAgICAgY2x1c3RlciBhcyBla3MuQ2x1c3RlcixcclxuICAgICAgbm9kZUdyb3VwcyBhcyBla3MuTm9kZWdyb3VwW11cclxuICAgICk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBUZW1wbGF0ZSBtZXRob2QgdGhhdCBtYXkgYmUgb3ZlcnJpZGRlbiBieSBzdWJjbGFzc2VzIHRvIGNyZWF0ZSBhIHNwZWNpZmljIGNsdXN0ZXIgZmxhdm9yIChlLmcuIEZhcmdhdGVDbHVzdGVyIHZzIGVrcy5DbHVzdGVyKVxyXG4gICAqIEBwYXJhbSBzY29wZVxyXG4gICAqIEBwYXJhbSBpZFxyXG4gICAqIEBwYXJhbSBjbHVzdGVyT3B0aW9uc1xyXG4gICAqIEByZXR1cm5zXHJcbiAgICovXHJcbiAgcHJvdGVjdGVkIGludGVybmFsQ3JlYXRlQ2x1c3RlcihcclxuICAgIHNjb3BlOiBDb25zdHJ1Y3QsXHJcbiAgICBpZDogc3RyaW5nLFxyXG4gICAgY2x1c3Rlck9wdGlvbnM6IGFueVxyXG4gICk6IGVrcy5DbHVzdGVyIHwgZWtzdjEuQ2x1c3RlciB7XHJcbiAgICByZXR1cm4gbmV3IGVrcy5DbHVzdGVyKHNjb3BlLCBpZCwgY2x1c3Rlck9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ2FuIGJlIG92ZXJyaWRkZW4gdG8gcHJvdmlkZSBhIGN1c3RvbSBrdWJlY3RsIGxheWVyLlxyXG4gICAqIEBwYXJhbSBzY29wZVxyXG4gICAqIEBwYXJhbSB2ZXJzaW9uXHJcbiAgICogQHJldHVybnNcclxuICAgKi9cclxuICBwcm90ZWN0ZWQgZ2V0S3ViZWN0bExheWVyKFxyXG4gICAgc2NvcGU6IENvbnN0cnVjdCxcclxuICAgIHZlcnNpb246IGVrcy5LdWJlcm5ldGVzVmVyc2lvblxyXG4gICk6IElMYXllclZlcnNpb24gfCB1bmRlZmluZWQge1xyXG4gICAgcmV0dXJuIHNlbGVjdEt1YmVjdGxMYXllcihzY29wZSwgdmVyc2lvbik7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBBZGRzIGFuIGF1dG9zY2FsaW5nIGdyb3VwIHRvIHRoZSBjbHVzdGVyLlxyXG4gICAqIEBwYXJhbSBjbHVzdGVyXHJcbiAgICogQHBhcmFtIG5vZGVHcm91cFxyXG4gICAqIEByZXR1cm5zXHJcbiAgICovXHJcbiAgYWRkQXV0b1NjYWxpbmdHcm91cChcclxuICAgIGNsdXN0ZXI6IGVrcy5DbHVzdGVyLFxyXG4gICAgbm9kZUdyb3VwOiBBdXRvc2NhbGluZ05vZGVHcm91cFxyXG4gICk6IGF1dG9zY2FsaW5nLkF1dG9TY2FsaW5nR3JvdXAge1xyXG4gICAgY29uc3QgbWFjaGluZUltYWdlVHlwZSA9XHJcbiAgICAgIG5vZGVHcm91cC5tYWNoaW5lSW1hZ2VUeXBlID8/IGVrcy5NYWNoaW5lSW1hZ2VUeXBlLkFNQVpPTl9MSU5VWF8yO1xyXG4gICAgY29uc3QgaW5zdGFuY2VUeXBlQ29udGV4dCA9IHV0aWxzLnZhbHVlRnJvbUNvbnRleHQoXHJcbiAgICAgIGNsdXN0ZXIsXHJcbiAgICAgIGNvbnN0YW50cy5JTlNUQU5DRV9UWVBFX0tFWSxcclxuICAgICAgY29uc3RhbnRzLkRFRkFVTFRfSU5TVEFOQ0VfVFlQRVxyXG4gICAgKTtcclxuICAgIGNvbnN0IGluc3RhbmNlVHlwZSA9XHJcbiAgICAgIG5vZGVHcm91cC5pbnN0YW5jZVR5cGUgPz9cclxuICAgICAgKHR5cGVvZiBpbnN0YW5jZVR5cGVDb250ZXh0ID09PSAnc3RyaW5nJ1xyXG4gICAgICAgID8gbmV3IGVjMi5JbnN0YW5jZVR5cGUoaW5zdGFuY2VUeXBlQ29udGV4dClcclxuICAgICAgICA6IGluc3RhbmNlVHlwZUNvbnRleHQpO1xyXG4gICAgY29uc3QgbWluU2l6ZSA9XHJcbiAgICAgIG5vZGVHcm91cC5taW5TaXplID8/XHJcbiAgICAgIHV0aWxzLnZhbHVlRnJvbUNvbnRleHQoXHJcbiAgICAgICAgY2x1c3RlcixcclxuICAgICAgICBjb25zdGFudHMuTUlOX1NJWkVfS0VZLFxyXG4gICAgICAgIGNvbnN0YW50cy5ERUZBVUxUX05HX01JTlNJWkVcclxuICAgICAgKTtcclxuICAgIGNvbnN0IG1heFNpemUgPVxyXG4gICAgICBub2RlR3JvdXAubWF4U2l6ZSA/P1xyXG4gICAgICB1dGlscy52YWx1ZUZyb21Db250ZXh0KFxyXG4gICAgICAgIGNsdXN0ZXIsXHJcbiAgICAgICAgY29uc3RhbnRzLk1BWF9TSVpFX0tFWSxcclxuICAgICAgICBjb25zdGFudHMuREVGQVVMVF9OR19NQVhTSVpFXHJcbiAgICAgICk7XHJcbiAgICBjb25zdCBkZXNpcmVkU2l6ZSA9XHJcbiAgICAgIG5vZGVHcm91cC5kZXNpcmVkU2l6ZSA/P1xyXG4gICAgICB1dGlscy52YWx1ZUZyb21Db250ZXh0KGNsdXN0ZXIsIGNvbnN0YW50cy5ERVNJUkVEX1NJWkVfS0VZLCBtaW5TaXplKTtcclxuICAgIGNvbnN0IHVwZGF0ZVBvbGljeSA9XHJcbiAgICAgIG5vZGVHcm91cC51cGRhdGVQb2xpY3kgPz8gYXV0b3NjYWxpbmcuVXBkYXRlUG9saWN5LnJvbGxpbmdVcGRhdGUoKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYW4gYXV0b3NjYWxpbmcgZ3JvdXBcclxuICAgIHJldHVybiBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eShub2RlR3JvdXAuaWQsIHtcclxuICAgICAgLi4ubm9kZUdyb3VwLFxyXG4gICAgICAuLi57XHJcbiAgICAgICAgYXV0b1NjYWxpbmdHcm91cE5hbWU6IG5vZGVHcm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZSA/PyBub2RlR3JvdXAuaWQsXHJcbiAgICAgICAgbWFjaGluZUltYWdlVHlwZSxcclxuICAgICAgICBpbnN0YW5jZVR5cGUsXHJcbiAgICAgICAgbWluQ2FwYWNpdHk6IG1pblNpemUsXHJcbiAgICAgICAgbWF4Q2FwYWNpdHk6IG1heFNpemUsXHJcbiAgICAgICAgZGVzaXJlZENhcGFjaXR5OiBkZXNpcmVkU2l6ZSxcclxuICAgICAgICB1cGRhdGVQb2xpY3ksXHJcbiAgICAgICAgdnBjU3VibmV0czogbm9kZUdyb3VwLm5vZGVHcm91cFN1Ym5ldHMsXHJcbiAgICAgIH0sXHJcbiAgICB9KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEFkZHMgYSBmYXJnYXRlIHByb2ZpbGUgdG8gdGhlIGNsdXN0ZXJcclxuICAgKi9cclxuICBhZGRGYXJnYXRlUHJvZmlsZShcclxuICAgIGNsdXN0ZXI6IGVrcy5DbHVzdGVyLFxyXG4gICAgbmFtZTogc3RyaW5nLFxyXG4gICAgcHJvZmlsZU9wdGlvbnM6IGVrcy5GYXJnYXRlUHJvZmlsZU9wdGlvbnNcclxuICApOiBla3MuRmFyZ2F0ZVByb2ZpbGUge1xyXG4gICAgcmV0dXJuIGNsdXN0ZXIuYWRkRmFyZ2F0ZVByb2ZpbGUobmFtZSwgcHJvZmlsZU9wdGlvbnMpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkIGEgbm9kZSBwb29sIHRvIHRoZSBjbHVzdGVyXHJcbiAgICovXHJcbiAgYWRkTm9kZVBvb2woY2x1c3RlcjogZWtzLkNsdXN0ZXIsIG5hbWU6IHN0cmluZywgcG9vbDogTm9kZVBvb2xWMVNwZWMpIHtcclxuICAgIGNvbnN0IGxhYmVscyA9IHBvb2wubGFiZWxzIHx8IHt9O1xyXG4gICAgY29uc3QgYW5ub3RhdGlvbnMgPSBwb29sLmFubm90YXRpb25zIHx8IHt9O1xyXG4gICAgY29uc3QgdGFpbnRzID0gcG9vbC50YWludHMgfHwgW107XHJcbiAgICBjb25zdCBzdGFydHVwVGFpbnRzID0gcG9vbC5zdGFydHVwVGFpbnRzIHx8IFtdO1xyXG4gICAgY29uc3QgcmVxdWlyZW1lbnRzID0gcG9vbC5yZXF1aXJlbWVudHMgfHwgW107XHJcbiAgICBjb25zdCBkaXNydXB0aW9uID0gcG9vbC5kaXNydXB0aW9uIHx8IG51bGw7XHJcbiAgICBjb25zdCBsaW1pdHMgPSBwb29sLmxpbWl0cyB8fCBudWxsO1xyXG4gICAgY29uc3Qgd2VpZ2h0ID0gcG9vbC53ZWlnaHQgfHwgbnVsbDtcclxuICAgIGNvbnN0IHBvb2xNYW5pZmVzdCA9IHtcclxuICAgICAgYXBpVmVyc2lvbjogJ2thcnBlbnRlci5zaC92MScsXHJcbiAgICAgIGtpbmQ6ICdOb2RlUG9vbCcsXHJcbiAgICAgIG1ldGFkYXRhOiB7IG5hbWU6IG5hbWUgfSxcclxuICAgICAgc3BlYzoge1xyXG4gICAgICAgIHRlbXBsYXRlOiB7XHJcbiAgICAgICAgICBtZXRhZGF0YTogeyBsYWJlbHM6IGxhYmVscywgYW5ub3RhdGlvbnM6IGFubm90YXRpb25zIH0sXHJcbiAgICAgICAgICBzcGVjOiB7XHJcbiAgICAgICAgICAgIG5vZGVDbGFzc1JlZjoge1xyXG4gICAgICAgICAgICAgIG5hbWU6ICdkZWZhdWx0JyxcclxuICAgICAgICAgICAgICBncm91cDogJ2Vrcy5hbWF6b25hd3MuY29tJyxcclxuICAgICAgICAgICAgICBraW5kOiAnTm9kZUNsYXNzJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdGFpbnRzOiB0YWludHMsXHJcbiAgICAgICAgICAgIHN0YXJ0dXBUYWludHM6IHN0YXJ0dXBUYWludHMsXHJcbiAgICAgICAgICAgIHJlcXVpcmVtZW50czogdXRpbHMuY29udmVydEtleVBhaXIocmVxdWlyZW1lbnRzKSxcclxuICAgICAgICAgICAgZXhwaXJlQWZ0ZXI6IHBvb2wuZXhwaXJlQWZ0ZXIsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgZGlzcnVwdGlvbjogZGlzcnVwdGlvbixcclxuICAgICAgICBsaW1pdHM6IGxpbWl0cyxcclxuICAgICAgICB3ZWlnaHQ6IHdlaWdodCxcclxuICAgICAgfSxcclxuICAgIH07XHJcbiAgICByZXR1cm4gY2x1c3Rlci5hZGRNYW5pZmVzdChuYW1lLCBwb29sTWFuaWZlc3QpO1xyXG4gIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQWRkcyBhIG1hbmFnZWQgbm9kZSBncm91cCB0byB0aGUgY2x1c3Rlci5cclxuICAgKiBAcGFyYW0gY2x1c3RlclxyXG4gICAqIEBwYXJhbSBub2RlR3JvdXBcclxuICAgKiBAcmV0dXJuc1xyXG4gICAqL1xyXG4gIGFkZE1hbmFnZWROb2RlR3JvdXAoXHJcbiAgICBjbHVzdGVyOiBla3MuQ2x1c3RlcixcclxuICAgIG5vZGVHcm91cDogTWFuYWdlZE5vZGVHcm91cFxyXG4gICk6IGVrcy5Ob2RlZ3JvdXAge1xyXG4gICAgY29uc3QgY2FwYWNpdHlUeXBlID0gbm9kZUdyb3VwLm5vZGVHcm91cENhcGFjaXR5VHlwZTtcclxuICAgIGNvbnN0IHJlbGVhc2VWZXJzaW9uID0gbm9kZUdyb3VwLmFtaVJlbGVhc2VWZXJzaW9uO1xyXG4gICAgY29uc3QgaW5zdGFuY2VUeXBlQ29udGV4dCA9IHV0aWxzLnZhbHVlRnJvbUNvbnRleHQoXHJcbiAgICAgIGNsdXN0ZXIsXHJcbiAgICAgIGNvbnN0YW50cy5JTlNUQU5DRV9UWVBFX0tFWSxcclxuICAgICAgY29uc3RhbnRzLkRFRkFVTFRfSU5TVEFOQ0VfVFlQRVxyXG4gICAgKTtcclxuICAgIGNvbnN0IGluc3RhbmNlVHlwZXMgPSBub2RlR3JvdXAuaW5zdGFuY2VUeXBlcyA/PyBbXHJcbiAgICAgIHR5cGVvZiBpbnN0YW5jZVR5cGVDb250ZXh0ID09PSAnc3RyaW5nJ1xyXG4gICAgICAgID8gbmV3IGVjMi5JbnN0YW5jZVR5cGUoaW5zdGFuY2VUeXBlQ29udGV4dClcclxuICAgICAgICA6IGluc3RhbmNlVHlwZUNvbnRleHQsXHJcbiAgICBdO1xyXG4gICAgY29uc3QgbWluU2l6ZSA9XHJcbiAgICAgIG5vZGVHcm91cC5taW5TaXplID8/XHJcbiAgICAgIHV0aWxzLnZhbHVlRnJvbUNvbnRleHQoXHJcbiAgICAgICAgY2x1c3RlcixcclxuICAgICAgICBjb25zdGFudHMuTUlOX1NJWkVfS0VZLFxyXG4gICAgICAgIGNvbnN0YW50cy5ERUZBVUxUX05HX01JTlNJWkVcclxuICAgICAgKTtcclxuICAgIGNvbnN0IG1heFNpemUgPVxyXG4gICAgICBub2RlR3JvdXAubWF4U2l6ZSA/P1xyXG4gICAgICB1dGlscy52YWx1ZUZyb21Db250ZXh0KFxyXG4gICAgICAgIGNsdXN0ZXIsXHJcbiAgICAgICAgY29uc3RhbnRzLk1BWF9TSVpFX0tFWSxcclxuICAgICAgICBjb25zdGFudHMuREVGQVVMVF9OR19NQVhTSVpFXHJcbiAgICAgICk7XHJcbiAgICBjb25zdCBkZXNpcmVkU2l6ZSA9XHJcbiAgICAgIG5vZGVHcm91cC5kZXNpcmVkU2l6ZSA/P1xyXG4gICAgICB1dGlscy52YWx1ZUZyb21Db250ZXh0KGNsdXN0ZXIsIGNvbnN0YW50cy5ERVNJUkVEX1NJWkVfS0VZLCBtaW5TaXplKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgYSBtYW5hZ2VkIG5vZGUgZ3JvdXAuXHJcbiAgICBjb25zdCBub2RlZ3JvdXBPcHRpb25zOiB1dGlscy5Xcml0ZWFibGU8ZWtzLk5vZGVncm91cE9wdGlvbnM+ID0ge1xyXG4gICAgICAuLi5ub2RlR3JvdXAsXHJcbiAgICAgIGFtaVR5cGU6IG5vZGVHcm91cC5hbWlUeXBlIGFzIGVrcy5Ob2RlZ3JvdXBBbWlUeXBlLFxyXG4gICAgICAuLi57XHJcbiAgICAgICAgbm9kZWdyb3VwTmFtZTogbm9kZUdyb3VwLm5vZGVncm91cE5hbWUgPz8gbm9kZUdyb3VwLmlkLFxyXG4gICAgICAgIGNhcGFjaXR5VHlwZSxcclxuICAgICAgICBpbnN0YW5jZVR5cGVzLFxyXG4gICAgICAgIG1pblNpemUsXHJcbiAgICAgICAgbWF4U2l6ZSxcclxuICAgICAgICBkZXNpcmVkU2l6ZSxcclxuICAgICAgICByZWxlYXNlVmVyc2lvbixcclxuICAgICAgICBzdWJuZXRzOiBub2RlR3JvdXAubm9kZUdyb3VwU3VibmV0cyxcclxuICAgICAgfSxcclxuICAgIH07XHJcblxyXG4gICAgaWYgKG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZSkge1xyXG4gICAgICAvLyBDcmVhdGUgbGF1bmNoIHRlbXBsYXRlIHdpdGggcHJvdmlkZWQgbGF1bmNoIHRlbXBsYXRlIHByb3BlcnRpZXNcclxuICAgICAgY29uc3QgbHQgPSBuZXcgZWMyLkxhdW5jaFRlbXBsYXRlKGNsdXN0ZXIsIGAke25vZGVHcm91cC5pZH0tbHRgLCB7XHJcbiAgICAgICAgYmxvY2tEZXZpY2VzOiBub2RlR3JvdXAubGF1bmNoVGVtcGxhdGUuYmxvY2tEZXZpY2VzLFxyXG4gICAgICAgIG1hY2hpbmVJbWFnZTogbm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlPy5tYWNoaW5lSW1hZ2UsXHJcbiAgICAgICAgc2VjdXJpdHlHcm91cDogbm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlLnNlY3VyaXR5R3JvdXAsXHJcbiAgICAgICAgdXNlckRhdGE6IG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZT8udXNlckRhdGEsXHJcbiAgICAgICAgcmVxdWlyZUltZHN2Mjogbm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlPy5yZXF1aXJlSW1kc3YyLFxyXG4gICAgICAgIGh0dHBQdXRSZXNwb25zZUhvcExpbWl0OlxyXG4gICAgICAgICAgbm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlPy5odHRwUHV0UmVzcG9uc2VIb3BMaW1pdCxcclxuICAgICAgfSk7XHJcbiAgICAgIHV0aWxzLnNldFBhdGgobm9kZWdyb3VwT3B0aW9ucywgJ2xhdW5jaFRlbXBsYXRlU3BlYycsIHtcclxuICAgICAgICBpZDogbHQubGF1bmNoVGVtcGxhdGVJZCEsXHJcbiAgICAgICAgdmVyc2lvbjogbHQubGF0ZXN0VmVyc2lvbk51bWJlcixcclxuICAgICAgfSk7XHJcbiAgICAgIGNvbnN0IHRhZ3MgPSBPYmplY3QuZW50cmllcyhub2RlR3JvdXAubGF1bmNoVGVtcGxhdGUudGFncyA/PyB7fSk7XHJcbiAgICAgIHRhZ3MuZm9yRWFjaCgoW2tleSwgb3B0aW9uc10pID0+IFRhZ3Mub2YobHQpLmFkZChrZXksIG9wdGlvbnMpKTtcclxuICAgICAgaWYgKG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZT8ubWFjaGluZUltYWdlKSB7XHJcbiAgICAgICAgZGVsZXRlIG5vZGVncm91cE9wdGlvbnMuYW1pVHlwZTtcclxuICAgICAgICBkZWxldGUgbm9kZWdyb3VwT3B0aW9ucy5yZWxlYXNlVmVyc2lvbjtcclxuICAgICAgICBkZWxldGUgbm9kZUdyb3VwLmFtaVJlbGVhc2VWZXJzaW9uO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgcmVzdWx0ID0gY2x1c3Rlci5hZGROb2RlZ3JvdXBDYXBhY2l0eShcclxuICAgICAgbm9kZUdyb3VwLmlkICsgJy1uZycsXHJcbiAgICAgIG5vZGVncm91cE9wdGlvbnNcclxuICAgICk7XHJcblxyXG4gICAgaWYgKG5vZGVHcm91cC5lbmFibGVTc21QZXJtaXNzaW9ucykge1xyXG4gICAgICByZXN1bHQucm9sZS5hZGRNYW5hZ2VkUG9saWN5KFxyXG4gICAgICAgIE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKCdBbWF6b25TU01NYW5hZ2VkSW5zdGFuY2VDb3JlJylcclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG4gIH1cclxuXHJcbiAgcHJpdmF0ZSB2YWxpZGF0ZUlucHV0KHByb3BzOiBHZW5lcmljQ2x1c3RlclByb3ZpZGVyVjJQcm9wcykge1xyXG4gICAgdXRpbHMudmFsaWRhdGVDb25zdHJhaW50cyhcclxuICAgICAgbmV3IEdlbmVyaWNDbHVzdGVyUHJvcHNWMkNvbnN0cmFpbnRzKCksXHJcbiAgICAgIEdlbmVyaWNDbHVzdGVyUHJvdmlkZXJWMi5uYW1lLFxyXG4gICAgICBwcm9wc1xyXG4gICAgKTtcclxuICAgIGlmIChwcm9wcy5tYW5hZ2VkTm9kZUdyb3VwcyAhPSB1bmRlZmluZWQpXHJcbiAgICAgIHV0aWxzLnZhbGlkYXRlQ29uc3RyYWludHMoXHJcbiAgICAgICAgbmV3IE1hbmFnZWROb2RlR3JvdXBDb25zdHJhaW50cygpLFxyXG4gICAgICAgICdNYW5hZ2VkTm9kZUdyb3VwJyxcclxuICAgICAgICAuLi5wcm9wcy5tYW5hZ2VkTm9kZUdyb3Vwc1xyXG4gICAgICApO1xyXG4gICAgaWYgKHByb3BzLmF1dG9zY2FsaW5nTm9kZUdyb3VwcyAhPSB1bmRlZmluZWQpXHJcbiAgICAgIHV0aWxzLnZhbGlkYXRlQ29uc3RyYWludHMoXHJcbiAgICAgICAgbmV3IEF1dG9zY2FsaW5nTm9kZUdyb3VwQ29uc3RyYWludHMoKSxcclxuICAgICAgICAnQXV0b3NjYWxpbmdOb2RlR3JvdXBzJyxcclxuICAgICAgICAuLi5wcm9wcy5hdXRvc2NhbGluZ05vZGVHcm91cHNcclxuICAgICAgKTtcclxuICAgIGlmIChwcm9wcy5jb21wdXRlICE9IHVuZGVmaW5lZClcclxuICAgICAgdXRpbHMudmFsaWRhdGVDb25zdHJhaW50cyhcclxuICAgICAgICBuZXcgQ29tcHV0ZUNvbmZpZ0NvbnN0cmFpbnRzKCksXHJcbiAgICAgICAgJ0NvbXB1dGVDb25maWdDb25zdHJhaW50cycsXHJcbiAgICAgICAgcHJvcHMuY29tcHV0ZVxyXG4gICAgICApO1xyXG4gICAgaWYgKChwcm9wcy5mYXJnYXRlUHJvZmlsZXMgYXMgYW55KSAhPSB1bmRlZmluZWQpXHJcbiAgICAgIHV0aWxzLnZhbGlkYXRlQ29uc3RyYWludHMoXHJcbiAgICAgICAgbmV3IEZhcmdhdGVQcm9maWxlQ29uc3RyYWludHMoKSxcclxuICAgICAgICAnRmFyZ2F0ZVByb2ZpbGVzJyxcclxuICAgICAgICAuLi4oT2JqZWN0LnZhbHVlcyhcclxuICAgICAgICAgIHByb3BzLmZhcmdhdGVQcm9maWxlcyBhcyBhbnlcclxuICAgICAgICApIGFzIGVrcy5GYXJnYXRlUHJvZmlsZU9wdGlvbnNbXSlcclxuICAgICAgKTtcclxuICB9XHJcbn1cclxuIl19