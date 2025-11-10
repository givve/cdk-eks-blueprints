"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GenericClusterProvider = exports.ClusterBuilder = exports.defaultOptions = exports.GenericClusterPropsConstraints = exports.FargateProfileConstraints = exports.AutoscalingNodeGroupConstraints = exports.ManagedNodeGroupConstraints = void 0;
exports.clusterBuilder = clusterBuilder;
exports.selectKubectlLayer = selectKubectlLayer;
const lambda_layer_kubectl_v25_1 = require("@aws-cdk/lambda-layer-kubectl-v25");
const lambda_layer_kubectl_v26_1 = require("@aws-cdk/lambda-layer-kubectl-v26");
const lambda_layer_kubectl_v27_1 = require("@aws-cdk/lambda-layer-kubectl-v27");
const lambda_layer_kubectl_v28_1 = require("@aws-cdk/lambda-layer-kubectl-v28");
const lambda_layer_kubectl_v29_1 = require("@aws-cdk/lambda-layer-kubectl-v29");
const lambda_layer_kubectl_v30_1 = require("@aws-cdk/lambda-layer-kubectl-v30");
const lambda_layer_kubectl_v31_1 = require("@aws-cdk/lambda-layer-kubectl-v31");
const lambda_layer_kubectl_v32_1 = require("@aws-cdk/lambda-layer-kubectl-v32");
const lambda_layer_kubectl_v33_1 = require("@aws-cdk/lambda-layer-kubectl-v33");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const autoscaling = require("aws-cdk-lib/aws-autoscaling");
const ec2 = require("aws-cdk-lib/aws-ec2");
const eks = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const spi_1 = require("../spi");
const utils = require("../utils");
const constants = require("./constants");
const assert = require("assert");
function clusterBuilder() {
    return new ClusterBuilder();
}
/**
 * Function that contains logic to map the correct kunbectl layer based on the passed in version.
 * @param scope in whch the kubectl layer must be created
 * @param version EKS version
 * @returns ILayerVersion or undefined
 */
function selectKubectlLayer(scope, version) {
    switch (version.version) {
        case "1.25":
            return new lambda_layer_kubectl_v25_1.KubectlV25Layer(scope, "kubectllayer25");
        case "1.26":
            return new lambda_layer_kubectl_v26_1.KubectlV26Layer(scope, "kubectllayer26");
        case "1.27":
            return new lambda_layer_kubectl_v27_1.KubectlV27Layer(scope, "kubectllayer27");
        case "1.28":
            return new lambda_layer_kubectl_v28_1.KubectlV28Layer(scope, "kubectllayer28");
        case "1.29":
            return new lambda_layer_kubectl_v29_1.KubectlV29Layer(scope, "kubectllayer29");
        case "1.30":
            return new lambda_layer_kubectl_v30_1.KubectlV30Layer(scope, "kubectllayer30");
        case "1.31":
            return new lambda_layer_kubectl_v31_1.KubectlV31Layer(scope, "kubectllayer30");
        case "1.32":
            return new lambda_layer_kubectl_v32_1.KubectlV32Layer(scope, "kubectllayer32");
        case "1.33":
            return new lambda_layer_kubectl_v33_1.KubectlV33Layer(scope, "kubectllayer33");
    }
    const minor = version.version.split('.')[1];
    if (minor && parseInt(minor, 10) > 31) {
        return new lambda_layer_kubectl_v30_1.KubectlV30Layer(scope, "kubectllayer31"); // for all versions above 1.30 use 1.30 kubectl (unless explicitly supported in CDK)
    }
    return undefined;
}
class ManagedNodeGroupConstraints {
    /**
     * id can be no less than 1 character long, and no greater than 63 characters long due to DNS system limitations.
     * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
     */
    id = new utils.StringConstraint(1, 63);
    /**
    * nodes per node group has a soft limit of 450 nodes, and as little as 0. But we multiply that by a factor of 5 to 2250 in case
    * of situations of a hard limit request being accepted, and as a result the limit would be raised
    * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
    */
    minSize = new utils.NumberConstraint(0, 2250);
    /**
     * nodes per node group has a soft limit of 450 nodes, and as little as 0. But we multiply that by a factor of 5 to 2250 in case
     * of situations of a hard limit request being accepted, and as a result the limit would be raised
     * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
     */
    maxSize = new utils.NumberConstraint(0, 2250);
    /**
     * Nodes per node group has a soft limit of 450 nodes, and as little as 0. But we multiply that by a factor of 5 to 2250 in case
     * of situations of a hard limit request being accepted, and as a result the limit would be raised
     * https://docs.aws.amazon.com/eks/latest/userguide/service-quotas.html
     */
    desiredSize = new utils.NumberConstraint(0, 2250);
    /**
     * amiReleaseVersion can be no less than 1 character long, and no greater than 1024 characters long.
     * https://docs.aws.amazon.com/imagebuilder/latest/APIReference/API_Ami.html
     */
    amiReleaseVersion = new utils.StringConstraint(1, 1024);
}
exports.ManagedNodeGroupConstraints = ManagedNodeGroupConstraints;
class AutoscalingNodeGroupConstraints {
    /**
    * id can be no less than 1 character long, and no greater than 63 characters long due to DNS system limitations.
    * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
    */
    id = new utils.StringConstraint(1, 63);
    /**
    * Allowed range is 0 to 5000 inclusive.
    * https://kubernetes.io/docs/setup/best-practices/cluster-large/
    */
    minSize = new utils.NumberConstraint(0, 5000);
    /**
    * Allowed range is 0 to 5000 inclusive.
    * https://kubernetes.io/docs/setup/best-practices/cluster-large/
    */
    maxSize = new utils.NumberConstraint(0, 5000);
    /**
    * Allowed range is 0 to 5000 inclusive.
    * https://kubernetes.io/docs/setup/best-practices/cluster-large/
    */
    desiredSize = new utils.NumberConstraint(0, 5000);
}
exports.AutoscalingNodeGroupConstraints = AutoscalingNodeGroupConstraints;
class FargateProfileConstraints {
    /**
    * fargateProfileNames can be no less than 1 character long, and no greater than 63 characters long due to DNS system limitations.
    * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
    */
    fargateProfileName = new utils.StringConstraint(1, 63);
}
exports.FargateProfileConstraints = FargateProfileConstraints;
class GenericClusterPropsConstraints {
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
exports.GenericClusterPropsConstraints = GenericClusterPropsConstraints;
exports.defaultOptions = {};
class ClusterBuilder {
    props = {};
    privateCluster = false;
    managedNodeGroups = [];
    autoscalingNodeGroups = [];
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
    fargateProfile(name, options) {
        this.fargateProfiles[name] = options;
        return this;
    }
    version(version) {
        this.props = { ...this.props, version };
        return this;
    }
    build() {
        return new GenericClusterProvider({
            ...this.props,
            privateCluster: this.privateCluster,
            managedNodeGroups: this.managedNodeGroups,
            autoscalingNodeGroups: this.autoscalingNodeGroups,
            fargateProfiles: this.fargateProfiles
        });
    }
}
exports.ClusterBuilder = ClusterBuilder;
/**
 * Cluster provider implementation that supports multiple node groups.
 */
class GenericClusterProvider {
    props;
    constructor(props) {
        this.props = props;
        this.validateInput(props);
        assert(!(props.managedNodeGroups && props.managedNodeGroups.length > 0
            && props.autoscalingNodeGroups && props.autoscalingNodeGroups.length > 0), "Mixing managed and autoscaling node groups is not supported. Please file a request on GitHub to add this support if needed.");
    }
    /**
     * @override
     */
    createCluster(scope, vpc, secretsEncryptionKey, kubernetesVersion, clusterLogging, ipFamily) {
        const id = scope.node.id;
        // Props for the cluster.
        const clusterName = this.props.clusterName ?? id;
        const outputClusterName = true;
        if (!kubernetesVersion && !this.props.version) {
            throw new Error("Version was not specified by cluster builder or in cluster provider props, must be specified in one of these");
        }
        const version = kubernetesVersion || this.props.version || eks.KubernetesVersion.V1_30;
        const privateCluster = this.props.privateCluster ?? utils.booleanFromContext(scope, constants.PRIVATE_CLUSTER, false);
        const isolatedCluster = this.props.isolatedCluster ?? utils.booleanFromContext(scope, constants.ISOLATED_CLUSTER, false);
        const endpointAccess = (privateCluster === true) ? eks.EndpointAccess.PRIVATE : eks.EndpointAccess.PUBLIC_AND_PRIVATE;
        const vpcSubnets = this.props.vpcSubnets ?? (isolatedCluster === true ? [{ subnetType: ec2.SubnetType.PRIVATE_ISOLATED }] : privateCluster === true ? [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }] : undefined);
        const mastersRole = this.props.mastersRole ?? new aws_iam_1.Role(scope, `${clusterName}-AccessRole`, {
            assumedBy: new aws_iam_1.AccountRootPrincipal()
        });
        const kubectlLayer = this.getKubectlLayer(scope, version);
        const tags = this.props.tags;
        const defaultOptions = {
            vpc,
            secretsEncryptionKey,
            clusterName,
            clusterLogging,
            outputClusterName,
            version,
            vpcSubnets,
            endpointAccess,
            kubectlLayer,
            tags,
            mastersRole,
            defaultCapacity: 0, // we want to manage capacity ourselves
            defaultCapacityType: eks.DefaultCapacityType.NODEGROUP
        };
        const isolatedOptions = isolatedCluster ? {
            placeClusterHandlerInVpc: true,
            clusterHandlerEnvironment: { AWS_STS_REGIONAL_ENDPOINTS: "regional" },
            kubectlEnvironment: { AWS_STS_REGIONAL_ENDPOINTS: "regional" },
        } : {};
        const clusterOptions = { ...defaultOptions, ...isolatedOptions, ...this.props, version, ipFamily };
        // Create an EKS Cluster
        const cluster = this.internalCreateCluster(scope, id, clusterOptions);
        cluster.node.addDependency(vpc);
        const nodeGroups = [];
        this.props.managedNodeGroups?.forEach(n => {
            const nodeGroup = this.addManagedNodeGroup(cluster, n);
            nodeGroups.push(nodeGroup);
        });
        const autoscalingGroups = [];
        this.props.autoscalingNodeGroups?.forEach(n => {
            const autoscalingGroup = this.addAutoScalingGroup(cluster, n);
            autoscalingGroups.push(autoscalingGroup);
        });
        const fargateProfiles = Object.entries(this.props.fargateProfiles ?? {});
        const fargateConstructs = [];
        fargateProfiles?.forEach(([key, options]) => fargateConstructs.push(this.addFargateProfile(cluster, key, options)));
        return new spi_1.ClusterInfo(cluster, version, nodeGroups, autoscalingGroups, false, fargateConstructs);
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
        return selectKubectlLayer(scope, version);
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
        const instanceType = nodeGroup.instanceType ?? (typeof instanceTypeContext === 'string' ? new ec2.InstanceType(instanceTypeContext) : instanceTypeContext);
        const minSize = nodeGroup.minSize ?? utils.valueFromContext(cluster, constants.MIN_SIZE_KEY, constants.DEFAULT_NG_MINSIZE);
        const maxSize = nodeGroup.maxSize ?? utils.valueFromContext(cluster, constants.MAX_SIZE_KEY, constants.DEFAULT_NG_MAXSIZE);
        const desiredSize = nodeGroup.desiredSize ?? utils.valueFromContext(cluster, constants.DESIRED_SIZE_KEY, minSize);
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
            }
        });
    }
    /**
     * Adds a fargate profile to the cluster
     */
    addFargateProfile(cluster, name, profileOptions) {
        return cluster.addFargateProfile(name, profileOptions);
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
        const instanceTypes = nodeGroup.instanceTypes ?? ([typeof instanceTypeContext === 'string' ? new ec2.InstanceType(instanceTypeContext) : instanceTypeContext]);
        const amiType = nodeGroup.amiType ?? constants.DEFAULT_AMI;
        const minSize = nodeGroup.minSize ?? utils.valueFromContext(cluster, constants.MIN_SIZE_KEY, constants.DEFAULT_NG_MINSIZE);
        const maxSize = nodeGroup.maxSize ?? utils.valueFromContext(cluster, constants.MAX_SIZE_KEY, constants.DEFAULT_NG_MAXSIZE);
        const desiredSize = nodeGroup.desiredSize ?? utils.valueFromContext(cluster, constants.DESIRED_SIZE_KEY, minSize);
        // Create a managed node group.
        const nodegroupOptions = {
            ...nodeGroup,
            ...{
                nodegroupName: nodeGroup.nodegroupName ?? nodeGroup.id,
                capacityType,
                instanceTypes,
                amiType,
                minSize,
                maxSize,
                desiredSize,
                releaseVersion,
                subnets: nodeGroup.nodeGroupSubnets
            }
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
            utils.setPath(nodegroupOptions, "launchTemplateSpec", {
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
        const result = cluster.addNodegroupCapacity(nodeGroup.id + "-ng", nodegroupOptions);
        if (nodeGroup.enableSsmPermissions) {
            result.role.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'));
        }
        return result;
    }
    validateInput(props) {
        utils.validateConstraints(new GenericClusterPropsConstraints, GenericClusterProvider.name, props);
        if (props.managedNodeGroups != undefined)
            utils.validateConstraints(new ManagedNodeGroupConstraints, "ManagedNodeGroup", ...props.managedNodeGroups);
        if (props.autoscalingNodeGroups != undefined)
            utils.validateConstraints(new AutoscalingNodeGroupConstraints, "AutoscalingNodeGroups", ...props.autoscalingNodeGroups);
        if (props.fargateProfiles != undefined)
            utils.validateConstraints(new FargateProfileConstraints, "FargateProfiles", ...Object.values(props.fargateProfiles));
    }
}
exports.GenericClusterProvider = GenericClusterProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2VuZXJpYy1jbHVzdGVyLXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL2NsdXN0ZXItcHJvdmlkZXJzL2dlbmVyaWMtY2x1c3Rlci1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUEwQkEsd0NBRUM7QUFRRCxnREE2QkM7QUFoRUQsZ0ZBQW9FO0FBQ3BFLGdGQUFvRTtBQUNwRSxnRkFBb0U7QUFDcEUsZ0ZBQW9FO0FBQ3BFLGdGQUFvRTtBQUNwRSxnRkFBb0U7QUFDcEUsZ0ZBQW9FO0FBQ3BFLGdGQUFvRTtBQUNwRSxnRkFBb0U7QUFFcEUsNkNBQW1DO0FBQ25DLDJEQUEyRDtBQUMzRCwyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzNDLGlEQUFnRjtBQUloRixnQ0FBc0Q7QUFDdEQsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUV6QyxpQ0FBa0M7QUFHbEMsU0FBZ0IsY0FBYztJQUMxQixPQUFPLElBQUksY0FBYyxFQUFFLENBQUM7QUFDaEMsQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0Isa0JBQWtCLENBQUMsS0FBZ0IsRUFBRSxPQUE4QjtJQUMvRSxRQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUNyQixLQUFLLE1BQU07WUFDUCxPQUFPLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RCxLQUFLLE1BQU07WUFDUCxPQUFPLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RCxLQUFLLE1BQU07WUFDUCxPQUFPLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RCxLQUFLLE1BQU07WUFDUCxPQUFPLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUN4RCxLQUFLLE1BQU07WUFDUCxPQUFPLElBQUksMENBQWUsQ0FBQyxLQUFLLEVBQUUsZ0JB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QUEyQixFQUFFLGtCQUFrQixFQUFFLEdBQUcsS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDL0csSUFBSSxLQUFLLENBQUMscUJBQXFCLElBQUksU0FBUztZQUN4QyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSwrQkFBK0IsRUFBRSx1QkFBdUIsRUFBRSxHQUFHLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO1FBQzVILElBQUksS0FBSyxDQUFDLGVBQXNCLElBQUksU0FBUztZQUN6QyxLQUFLLENBQUMsbUJBQW1CLENBQUMsSUFBSSx5QkFBeUIsRUFBRSxpQkFBaUIsRUFBRSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQXNCLENBQUMsQ0FBQyxDQUFDO0lBQ3BJLENBQUM7Q0FDSjtBQTNORCx3REEyTkMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuaW1wb3J0IHsgS3ViZWN0bFYyNUxheWVyIH0gZnJvbSBcIkBhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYyNVwiO1xyXG5pbXBvcnQgeyBLdWJlY3RsVjI2TGF5ZXIgfSBmcm9tIFwiQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjI2XCI7XHJcbmltcG9ydCB7IEt1YmVjdGxWMjdMYXllciB9IGZyb20gXCJAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MjdcIjtcclxuaW1wb3J0IHsgS3ViZWN0bFYyOExheWVyIH0gZnJvbSBcIkBhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYyOFwiO1xyXG5pbXBvcnQgeyBLdWJlY3RsVjI5TGF5ZXIgfSBmcm9tIFwiQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjI5XCI7XHJcbmltcG9ydCB7IEt1YmVjdGxWMzBMYXllciB9IGZyb20gXCJAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MzBcIjtcclxuaW1wb3J0IHsgS3ViZWN0bFYzMUxheWVyIH0gZnJvbSBcIkBhd3MtY2RrL2xhbWJkYS1sYXllci1rdWJlY3RsLXYzMVwiO1xyXG5pbXBvcnQgeyBLdWJlY3RsVjMyTGF5ZXIgfSBmcm9tIFwiQGF3cy1jZGsvbGFtYmRhLWxheWVyLWt1YmVjdGwtdjMyXCI7XHJcbmltcG9ydCB7IEt1YmVjdGxWMzNMYXllciB9IGZyb20gXCJAYXdzLWNkay9sYW1iZGEtbGF5ZXIta3ViZWN0bC12MzNcIjtcclxuXHJcbmltcG9ydCB7IFRhZ3MgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0ICogYXMgYXV0b3NjYWxpbmcgZnJvbSAnYXdzLWNkay1saWIvYXdzLWF1dG9zY2FsaW5nJztcclxuaW1wb3J0ICogYXMgZWMyIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWMyXCI7XHJcbmltcG9ydCAqIGFzIGVrcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgeyBBY2NvdW50Um9vdFByaW5jaXBhbCwgTWFuYWdlZFBvbGljeSwgUm9sZSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IElLZXkgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWttc1wiO1xyXG5pbXBvcnQgeyBJTGF5ZXJWZXJzaW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1sYW1iZGFcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8sIENsdXN0ZXJQcm92aWRlciB9IGZyb20gXCIuLi9zcGlcIjtcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcIi4uL3V0aWxzXCI7XHJcbmltcG9ydCAqIGFzIGNvbnN0YW50cyBmcm9tICcuL2NvbnN0YW50cyc7XHJcbmltcG9ydCB7IEF1dG9zY2FsaW5nTm9kZUdyb3VwLCBNYW5hZ2VkTm9kZUdyb3VwIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuaW1wb3J0IGFzc2VydCA9IHJlcXVpcmUoJ2Fzc2VydCcpO1xyXG5cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjbHVzdGVyQnVpbGRlcigpIHtcclxuICAgIHJldHVybiBuZXcgQ2x1c3RlckJ1aWxkZXIoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEZ1bmN0aW9uIHRoYXQgY29udGFpbnMgbG9naWMgdG8gbWFwIHRoZSBjb3JyZWN0IGt1bmJlY3RsIGxheWVyIGJhc2VkIG9uIHRoZSBwYXNzZWQgaW4gdmVyc2lvbi5cclxuICogQHBhcmFtIHNjb3BlIGluIHdoY2ggdGhlIGt1YmVjdGwgbGF5ZXIgbXVzdCBiZSBjcmVhdGVkXHJcbiAqIEBwYXJhbSB2ZXJzaW9uIEVLUyB2ZXJzaW9uXHJcbiAqIEByZXR1cm5zIElMYXllclZlcnNpb24gb3IgdW5kZWZpbmVkXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gc2VsZWN0S3ViZWN0bExheWVyKHNjb3BlOiBDb25zdHJ1Y3QsIHZlcnNpb246IGVrcy5LdWJlcm5ldGVzVmVyc2lvbik6IElMYXllclZlcnNpb24gfCB1bmRlZmluZWQge1xyXG4gICAgc3dpdGNoKHZlcnNpb24udmVyc2lvbikge1xyXG4gICAgICAgIGNhc2UgXCIxLjI1XCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYyNUxheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjI1XCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjI2XCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYyNkxheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjI2XCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjI3XCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYyN0xheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjI3XCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjI4XCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYyOExheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjI4XCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjI5XCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYyOUxheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjI5XCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjMwXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYzMExheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjMwXCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjMxXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYzMUxheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjMwXCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjMyXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYzMkxheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjMyXCIpO1xyXG4gICAgICAgIGNhc2UgXCIxLjMzXCI6XHJcbiAgICAgICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYzM0xheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjMzXCIpO1xyXG5cclxuICAgIH1cclxuXHJcbiAgICBjb25zdCBtaW5vciA9IHZlcnNpb24udmVyc2lvbi5zcGxpdCgnLicpWzFdO1xyXG5cclxuICAgIGlmKG1pbm9yICYmIHBhcnNlSW50KG1pbm9yLCAxMCkgPiAzMSkge1xyXG4gICAgICAgIHJldHVybiBuZXcgS3ViZWN0bFYzMExheWVyKHNjb3BlLCBcImt1YmVjdGxsYXllcjMxXCIpOyAvLyBmb3IgYWxsIHZlcnNpb25zIGFib3ZlIDEuMzAgdXNlIDEuMzAga3ViZWN0bCAodW5sZXNzIGV4cGxpY2l0bHkgc3VwcG9ydGVkIGluIENESylcclxuICAgIH1cclxuICAgIHJldHVybiB1bmRlZmluZWQ7XHJcbn1cclxuLyoqXHJcbiAqIFByb3BlcnRpZXMgZm9yIHRoZSBnZW5lcmljIGNsdXN0ZXIgcHJvdmlkZXIsIGNvbnRhaW5pbmcgZGVmaW5pdGlvbnMgb2YgbWFuYWdlZCBub2RlIGdyb3VwcyxcclxuICogYXV0by1zY2FsaW5nIGdyb3VwcywgZmFyZ2F0ZSBwcm9maWxlcy5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgR2VuZXJpY0NsdXN0ZXJQcm92aWRlclByb3BzIGV4dGVuZHMgUGFydGlhbDxla3MuQ2x1c3Rlck9wdGlvbnM+IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFdoZXRoZXIgY2x1c3RlciBoYXMgaW50ZXJuZXQgYWNjZXNzLlxyXG4gICAgICovXHJcbiAgICBpc29sYXRlZENsdXN0ZXI/OiBib29sZWFuLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hldGhlciBBUEkgc2VydmVyIGlzIHByaXZhdGUuXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGVDbHVzdGVyPzogYm9vbGVhbixcclxuXHJcbiAgICAvKipcclxuICAgICAqIEFycmF5IG9mIG1hbmFnZWQgbm9kZSBncm91cHMuXHJcbiAgICAgKi9cclxuICAgIG1hbmFnZWROb2RlR3JvdXBzPzogTWFuYWdlZE5vZGVHcm91cFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogQXJyYXkgb2YgYXV0b3NjYWxpbmcgbm9kZSBncm91cHMuXHJcbiAgICAgKi9cclxuICAgIGF1dG9zY2FsaW5nTm9kZUdyb3Vwcz86IEF1dG9zY2FsaW5nTm9kZUdyb3VwW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBGYXJnYXRlIHByb2ZpbGVzXHJcbiAgICAgKi9cclxuICAgIGZhcmdhdGVQcm9maWxlcz86IHtcclxuICAgICAgICBba2V5OiBzdHJpbmddOiBla3MuRmFyZ2F0ZVByb2ZpbGVPcHRpb25zO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGFncyBmb3IgdGhlIGNsdXN0ZXJcclxuICAgICAqL1xyXG4gICAgdGFncz86IHtcclxuICAgICAgICBba2V5OiBzdHJpbmddOiBzdHJpbmc7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBNYW5hZ2VkTm9kZUdyb3VwQ29uc3RyYWludHMgaW1wbGVtZW50cyB1dGlscy5Db25zdHJhaW50c1R5cGU8TWFuYWdlZE5vZGVHcm91cD4ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBpZCBjYW4gYmUgbm8gbGVzcyB0aGFuIDEgY2hhcmFjdGVyIGxvbmcsIGFuZCBubyBncmVhdGVyIHRoYW4gNjMgY2hhcmFjdGVycyBsb25nIGR1ZSB0byBETlMgc3lzdGVtIGxpbWl0YXRpb25zLlxyXG4gICAgICogaHR0cHM6Ly9rdWJlcm5ldGVzLmlvL2RvY3MvY29uY2VwdHMvb3ZlcnZpZXcvd29ya2luZy13aXRoLW9iamVjdHMvbmFtZXMvXHJcbiAgICAgKi9cclxuICAgIGlkID0gbmV3IHV0aWxzLlN0cmluZ0NvbnN0cmFpbnQoMSwgNjMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBub2RlcyBwZXIgbm9kZSBncm91cCBoYXMgYSBzb2Z0IGxpbWl0IG9mIDQ1MCBub2RlcywgYW5kIGFzIGxpdHRsZSBhcyAwLiBCdXQgd2UgbXVsdGlwbHkgdGhhdCBieSBhIGZhY3RvciBvZiA1IHRvIDIyNTAgaW4gY2FzZVxyXG4gICAgKiBvZiBzaXR1YXRpb25zIG9mIGEgaGFyZCBsaW1pdCByZXF1ZXN0IGJlaW5nIGFjY2VwdGVkLCBhbmQgYXMgYSByZXN1bHQgdGhlIGxpbWl0IHdvdWxkIGJlIHJhaXNlZFxyXG4gICAgKiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvc2VydmljZS1xdW90YXMuaHRtbFxyXG4gICAgKi9cclxuICAgIG1pblNpemUgPSBuZXcgdXRpbHMuTnVtYmVyQ29uc3RyYWludCgwLCAyMjUwKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIG5vZGVzIHBlciBub2RlIGdyb3VwIGhhcyBhIHNvZnQgbGltaXQgb2YgNDUwIG5vZGVzLCBhbmQgYXMgbGl0dGxlIGFzIDAuIEJ1dCB3ZSBtdWx0aXBseSB0aGF0IGJ5IGEgZmFjdG9yIG9mIDUgdG8gMjI1MCBpbiBjYXNlXHJcbiAgICAgKiBvZiBzaXR1YXRpb25zIG9mIGEgaGFyZCBsaW1pdCByZXF1ZXN0IGJlaW5nIGFjY2VwdGVkLCBhbmQgYXMgYSByZXN1bHQgdGhlIGxpbWl0IHdvdWxkIGJlIHJhaXNlZFxyXG4gICAgICogaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL3NlcnZpY2UtcXVvdGFzLmh0bWxcclxuICAgICAqL1xyXG4gICAgbWF4U2l6ZSA9IG5ldyB1dGlscy5OdW1iZXJDb25zdHJhaW50KDAsIDIyNTApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTm9kZXMgcGVyIG5vZGUgZ3JvdXAgaGFzIGEgc29mdCBsaW1pdCBvZiA0NTAgbm9kZXMsIGFuZCBhcyBsaXR0bGUgYXMgMC4gQnV0IHdlIG11bHRpcGx5IHRoYXQgYnkgYSBmYWN0b3Igb2YgNSB0byAyMjUwIGluIGNhc2VcclxuICAgICAqIG9mIHNpdHVhdGlvbnMgb2YgYSBoYXJkIGxpbWl0IHJlcXVlc3QgYmVpbmcgYWNjZXB0ZWQsIGFuZCBhcyBhIHJlc3VsdCB0aGUgbGltaXQgd291bGQgYmUgcmFpc2VkXHJcbiAgICAgKiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvc2VydmljZS1xdW90YXMuaHRtbFxyXG4gICAgICovXHJcbiAgICBkZXNpcmVkU2l6ZSA9IG5ldyB1dGlscy5OdW1iZXJDb25zdHJhaW50KDAsIDIyNTApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogYW1pUmVsZWFzZVZlcnNpb24gY2FuIGJlIG5vIGxlc3MgdGhhbiAxIGNoYXJhY3RlciBsb25nLCBhbmQgbm8gZ3JlYXRlciB0aGFuIDEwMjQgY2hhcmFjdGVycyBsb25nLlxyXG4gICAgICogaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2ltYWdlYnVpbGRlci9sYXRlc3QvQVBJUmVmZXJlbmNlL0FQSV9BbWkuaHRtbFxyXG4gICAgICovXHJcbiAgICBhbWlSZWxlYXNlVmVyc2lvbiA9IG5ldyB1dGlscy5TdHJpbmdDb25zdHJhaW50KDEsIDEwMjQpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgQXV0b3NjYWxpbmdOb2RlR3JvdXBDb25zdHJhaW50cyBpbXBsZW1lbnRzIHV0aWxzLkNvbnN0cmFpbnRzVHlwZTxBdXRvc2NhbGluZ05vZGVHcm91cD4ge1xyXG4gICAgLyoqXHJcbiAgICAqIGlkIGNhbiBiZSBubyBsZXNzIHRoYW4gMSBjaGFyYWN0ZXIgbG9uZywgYW5kIG5vIGdyZWF0ZXIgdGhhbiA2MyBjaGFyYWN0ZXJzIGxvbmcgZHVlIHRvIEROUyBzeXN0ZW0gbGltaXRhdGlvbnMuXHJcbiAgICAqIGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL2NvbmNlcHRzL292ZXJ2aWV3L3dvcmtpbmctd2l0aC1vYmplY3RzL25hbWVzL1xyXG4gICAgKi9cclxuICAgIGlkID0gbmV3IHV0aWxzLlN0cmluZ0NvbnN0cmFpbnQoMSwgNjMpO1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBBbGxvd2VkIHJhbmdlIGlzIDAgdG8gNTAwMCBpbmNsdXNpdmUuXHJcbiAgICAqIGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL3NldHVwL2Jlc3QtcHJhY3RpY2VzL2NsdXN0ZXItbGFyZ2UvXHJcbiAgICAqL1xyXG4gICAgbWluU2l6ZSA9IG5ldyB1dGlscy5OdW1iZXJDb25zdHJhaW50KDAsIDUwMDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBBbGxvd2VkIHJhbmdlIGlzIDAgdG8gNTAwMCBpbmNsdXNpdmUuXHJcbiAgICAqIGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL3NldHVwL2Jlc3QtcHJhY3RpY2VzL2NsdXN0ZXItbGFyZ2UvXHJcbiAgICAqL1xyXG4gICAgbWF4U2l6ZSA9IG5ldyB1dGlscy5OdW1iZXJDb25zdHJhaW50KDAsIDUwMDApO1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBBbGxvd2VkIHJhbmdlIGlzIDAgdG8gNTAwMCBpbmNsdXNpdmUuXHJcbiAgICAqIGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL3NldHVwL2Jlc3QtcHJhY3RpY2VzL2NsdXN0ZXItbGFyZ2UvXHJcbiAgICAqL1xyXG4gICAgZGVzaXJlZFNpemUgPSBuZXcgdXRpbHMuTnVtYmVyQ29uc3RyYWludCgwLCA1MDAwKTtcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIEZhcmdhdGVQcm9maWxlQ29uc3RyYWludHMgaW1wbGVtZW50cyB1dGlscy5Db25zdHJhaW50c1R5cGU8ZWtzLkZhcmdhdGVQcm9maWxlT3B0aW9ucz4ge1xyXG4gICAgLyoqXHJcbiAgICAqIGZhcmdhdGVQcm9maWxlTmFtZXMgY2FuIGJlIG5vIGxlc3MgdGhhbiAxIGNoYXJhY3RlciBsb25nLCBhbmQgbm8gZ3JlYXRlciB0aGFuIDYzIGNoYXJhY3RlcnMgbG9uZyBkdWUgdG8gRE5TIHN5c3RlbSBsaW1pdGF0aW9ucy5cclxuICAgICogaHR0cHM6Ly9rdWJlcm5ldGVzLmlvL2RvY3MvY29uY2VwdHMvb3ZlcnZpZXcvd29ya2luZy13aXRoLW9iamVjdHMvbmFtZXMvXHJcbiAgICAqL1xyXG4gICAgZmFyZ2F0ZVByb2ZpbGVOYW1lID0gbmV3IHV0aWxzLlN0cmluZ0NvbnN0cmFpbnQoMSwgNjMpO1xyXG59XHJcblxyXG5leHBvcnQgY2xhc3MgR2VuZXJpY0NsdXN0ZXJQcm9wc0NvbnN0cmFpbnRzIGltcGxlbWVudHMgdXRpbHMuQ29uc3RyYWludHNUeXBlPEdlbmVyaWNDbHVzdGVyUHJvdmlkZXJQcm9wcz4ge1xyXG4gICAgLyoqXHJcbiAgICAqIG1hbmFnZWROb2RlR3JvdXBzIHBlciBjbHVzdGVyIGhhdmUgYSBzb2Z0IGxpbWl0IG9mIDMwIG1hbmFnZWQgbm9kZSBncm91cHMgcGVyIEVLUyBjbHVzdGVyLCBhbmQgYXMgbGl0dGxlIGFzIDAuIEJ1dCB3ZSBtdWx0aXBseSB0aGF0XHJcbiAgICAqIGJ5IGEgZmFjdG9yIG9mIDUgdG8gMTUwIGluIGNhc2Ugb2Ygc2l0dWF0aW9ucyBvZiBhIGhhcmQgbGltaXQgcmVxdWVzdCBiZWluZyBhY2NlcHRlZCwgYW5kIGFzIGEgcmVzdWx0IHRoZSBsaW1pdCB3b3VsZCBiZSByYWlzZWQuXHJcbiAgICAqIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9zZXJ2aWNlLXF1b3Rhcy5odG1sXHJcbiAgICAqL1xyXG4gICAgbWFuYWdlZE5vZGVHcm91cHMgPSBuZXcgdXRpbHMuQXJyYXlDb25zdHJhaW50KDAsIDE1MCk7XHJcbiAgICAvKipcclxuICAgICogYXV0b3NjYWxpbmdOb2RlR3JvdXBzIHBlciBjbHVzdGVyIGhhdmUgYSBzb2Z0IGxpbWl0IG9mIDUwMCBhdXRvc2NhbGluZyBub2RlIGdyb3VwcyBwZXIgRUtTIGNsdXN0ZXIsIGFuZCBhcyBsaXR0bGUgYXMgMC4gQnV0IHdlIG11bHRpcGx5IHRoYXRcclxuICAgICogYnkgYSBmYWN0b3Igb2YgNSB0byAyNTAwIGluIGNhc2Ugb2Ygc2l0dWF0aW9ucyBvZiBhIGhhcmQgbGltaXQgcmVxdWVzdCBiZWluZyBhY2NlcHRlZCwgYW5kIGFzIGEgcmVzdWx0IHRoZSBsaW1pdCB3b3VsZCBiZSByYWlzZWQuXHJcbiAgICAqIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9hdXRvc2NhbGluZy9lYzIvdXNlcmd1aWRlL2VjMi1hdXRvLXNjYWxpbmctcXVvdGFzLmh0bWxcclxuICAgICovXHJcbiAgICBhdXRvc2NhbGluZ05vZGVHcm91cHMgPSBuZXcgdXRpbHMuQXJyYXlDb25zdHJhaW50KDAsIDUwMDApO1xyXG59XHJcblxyXG5leHBvcnQgY29uc3QgZGVmYXVsdE9wdGlvbnMgPSB7XHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgQ2x1c3RlckJ1aWxkZXIge1xyXG5cclxuICAgIHByaXZhdGUgcHJvcHM6IFBhcnRpYWw8R2VuZXJpY0NsdXN0ZXJQcm92aWRlclByb3BzPiA9IHt9O1xyXG4gICAgcHJpdmF0ZSBwcml2YXRlQ2x1c3RlciA9IGZhbHNlO1xyXG4gICAgcHJpdmF0ZSBtYW5hZ2VkTm9kZUdyb3VwczogTWFuYWdlZE5vZGVHcm91cFtdID0gW107XHJcbiAgICBwcml2YXRlIGF1dG9zY2FsaW5nTm9kZUdyb3VwczogQXV0b3NjYWxpbmdOb2RlR3JvdXBbXSA9IFtdO1xyXG4gICAgcHJpdmF0ZSBmYXJnYXRlUHJvZmlsZXM6IHtcclxuICAgICAgICBba2V5OiBzdHJpbmddOiBla3MuRmFyZ2F0ZVByb2ZpbGVPcHRpb25zO1xyXG4gICAgfSA9IHt9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMgfTtcclxuICAgIH1cclxuXHJcbiAgICB3aXRoQ29tbW9uT3B0aW9ucyhvcHRpb25zOiBQYXJ0aWFsPGVrcy5DbHVzdGVyT3B0aW9ucz4pOiB0aGlzIHtcclxuICAgICAgICB0aGlzLnByb3BzID0geyAuLi50aGlzLnByb3BzLCAuLi5vcHRpb25zIH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgbWFuYWdlZE5vZGVHcm91cCguLi5ub2RlR3JvdXBzOiBNYW5hZ2VkTm9kZUdyb3VwW10pOiB0aGlzIHtcclxuICAgICAgICB0aGlzLm1hbmFnZWROb2RlR3JvdXBzID0gdGhpcy5tYW5hZ2VkTm9kZUdyb3Vwcy5jb25jYXQobm9kZUdyb3Vwcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgYXV0b3NjYWxpbmdHcm91cCguLi5ub2RlR3JvdXBzOiBBdXRvc2NhbGluZ05vZGVHcm91cFtdKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5hdXRvc2NhbGluZ05vZGVHcm91cHMgPSB0aGlzLmF1dG9zY2FsaW5nTm9kZUdyb3Vwcy5jb25jYXQobm9kZUdyb3Vwcyk7XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgZmFyZ2F0ZVByb2ZpbGUobmFtZTogc3RyaW5nLCBvcHRpb25zOiBla3MuRmFyZ2F0ZVByb2ZpbGVPcHRpb25zKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5mYXJnYXRlUHJvZmlsZXNbbmFtZV0gPSBvcHRpb25zO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHZlcnNpb24odmVyc2lvbjogZWtzLkt1YmVybmV0ZXNWZXJzaW9uKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5wcm9wcyA9IHsgLi4udGhpcy5wcm9wcywgdmVyc2lvbiB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIGJ1aWxkKCkge1xyXG4gICAgICAgIHJldHVybiBuZXcgR2VuZXJpY0NsdXN0ZXJQcm92aWRlcih7XHJcbiAgICAgICAgICAgIC4uLnRoaXMucHJvcHMsXHJcbiAgICAgICAgICAgIHByaXZhdGVDbHVzdGVyOiB0aGlzLnByaXZhdGVDbHVzdGVyLFxyXG4gICAgICAgICAgICBtYW5hZ2VkTm9kZUdyb3VwczogdGhpcy5tYW5hZ2VkTm9kZUdyb3VwcyxcclxuICAgICAgICAgICAgYXV0b3NjYWxpbmdOb2RlR3JvdXBzOiB0aGlzLmF1dG9zY2FsaW5nTm9kZUdyb3VwcyxcclxuICAgICAgICAgICAgZmFyZ2F0ZVByb2ZpbGVzOiB0aGlzLmZhcmdhdGVQcm9maWxlc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogQ2x1c3RlciBwcm92aWRlciBpbXBsZW1lbnRhdGlvbiB0aGF0IHN1cHBvcnRzIG11bHRpcGxlIG5vZGUgZ3JvdXBzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEdlbmVyaWNDbHVzdGVyUHJvdmlkZXIgaW1wbGVtZW50cyBDbHVzdGVyUHJvdmlkZXIge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHByb3BzOiBHZW5lcmljQ2x1c3RlclByb3ZpZGVyUHJvcHMpIHtcclxuXHJcbiAgICAgICAgdGhpcy52YWxpZGF0ZUlucHV0KHByb3BzKTtcclxuXHJcbiAgICAgICAgYXNzZXJ0KCEocHJvcHMubWFuYWdlZE5vZGVHcm91cHMgJiYgcHJvcHMubWFuYWdlZE5vZGVHcm91cHMubGVuZ3RoID4gMFxyXG4gICAgICAgICAgICAmJiBwcm9wcy5hdXRvc2NhbGluZ05vZGVHcm91cHMgJiYgcHJvcHMuYXV0b3NjYWxpbmdOb2RlR3JvdXBzLmxlbmd0aCA+IDApLFxyXG4gICAgICAgICAgICBcIk1peGluZyBtYW5hZ2VkIGFuZCBhdXRvc2NhbGluZyBub2RlIGdyb3VwcyBpcyBub3Qgc3VwcG9ydGVkLiBQbGVhc2UgZmlsZSBhIHJlcXVlc3Qgb24gR2l0SHViIHRvIGFkZCB0aGlzIHN1cHBvcnQgaWYgbmVlZGVkLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBvdmVycmlkZVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVDbHVzdGVyKHNjb3BlOiBDb25zdHJ1Y3QsIHZwYzogZWMyLklWcGMsIHNlY3JldHNFbmNyeXB0aW9uS2V5PzogSUtleSwga3ViZXJuZXRlc1ZlcnNpb24/OiBla3MuS3ViZXJuZXRlc1ZlcnNpb24sIGNsdXN0ZXJMb2dnaW5nPzogZWtzLkNsdXN0ZXJMb2dnaW5nVHlwZXNbXSwgaXBGYW1pbHk/OiBla3MuSXBGYW1pbHkpOiBDbHVzdGVySW5mbyB7XHJcbiAgICAgICAgY29uc3QgaWQgPSBzY29wZS5ub2RlLmlkO1xyXG5cclxuICAgICAgICAvLyBQcm9wcyBmb3IgdGhlIGNsdXN0ZXIuXHJcbiAgICAgICAgY29uc3QgY2x1c3Rlck5hbWUgPSB0aGlzLnByb3BzLmNsdXN0ZXJOYW1lID8/IGlkO1xyXG4gICAgICAgIGNvbnN0IG91dHB1dENsdXN0ZXJOYW1lID0gdHJ1ZTtcclxuICAgICAgICBpZiAoIWt1YmVybmV0ZXNWZXJzaW9uICYmICF0aGlzLnByb3BzLnZlcnNpb24pIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVmVyc2lvbiB3YXMgbm90IHNwZWNpZmllZCBieSBjbHVzdGVyIGJ1aWxkZXIgb3IgaW4gY2x1c3RlciBwcm92aWRlciBwcm9wcywgbXVzdCBiZSBzcGVjaWZpZWQgaW4gb25lIG9mIHRoZXNlXCIpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCB2ZXJzaW9uOiBla3MuS3ViZXJuZXRlc1ZlcnNpb24gPSBrdWJlcm5ldGVzVmVyc2lvbiB8fCB0aGlzLnByb3BzLnZlcnNpb24gfHwgZWtzLkt1YmVybmV0ZXNWZXJzaW9uLlYxXzMwO1xyXG5cclxuICAgICAgICBjb25zdCBwcml2YXRlQ2x1c3RlciA6IGJvb2xlYW4gPSB0aGlzLnByb3BzLnByaXZhdGVDbHVzdGVyID8/IHV0aWxzLmJvb2xlYW5Gcm9tQ29udGV4dChzY29wZSwgY29uc3RhbnRzLlBSSVZBVEVfQ0xVU1RFUiwgZmFsc2UpO1xyXG4gICAgICAgIGNvbnN0IGlzb2xhdGVkQ2x1c3RlciA9IHRoaXMucHJvcHMuaXNvbGF0ZWRDbHVzdGVyID8/IHV0aWxzLmJvb2xlYW5Gcm9tQ29udGV4dChzY29wZSwgY29uc3RhbnRzLklTT0xBVEVEX0NMVVNURVIsIGZhbHNlKTtcclxuXHJcbiAgICAgICAgY29uc3QgZW5kcG9pbnRBY2Nlc3MgPSAocHJpdmF0ZUNsdXN0ZXIgPT09IHRydWUpID8gZWtzLkVuZHBvaW50QWNjZXNzLlBSSVZBVEUgOiBla3MuRW5kcG9pbnRBY2Nlc3MuUFVCTElDX0FORF9QUklWQVRFO1xyXG4gICAgICAgIGNvbnN0IHZwY1N1Ym5ldHMgPSB0aGlzLnByb3BzLnZwY1N1Ym5ldHMgPz8gKGlzb2xhdGVkQ2x1c3RlciA9PT0gdHJ1ZSA/IFt7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfSVNPTEFURUQgfV0gOiBwcml2YXRlQ2x1c3RlciA9PT0gdHJ1ZSA/IFt7IHN1Ym5ldFR5cGU6IGVjMi5TdWJuZXRUeXBlLlBSSVZBVEVfV0lUSF9FR1JFU1MgfV0gOiB1bmRlZmluZWQpO1xyXG4gICAgICAgIGNvbnN0IG1hc3RlcnNSb2xlID0gdGhpcy5wcm9wcy5tYXN0ZXJzUm9sZSA/PyBuZXcgUm9sZShzY29wZSwgYCR7Y2x1c3Rlck5hbWV9LUFjY2Vzc1JvbGVgLCB7XHJcbiAgICAgICAgICAgIGFzc3VtZWRCeTogbmV3IEFjY291bnRSb290UHJpbmNpcGFsKClcclxuICAgICAgICB9KTtcclxuXHJcblxyXG4gICAgICAgIGNvbnN0IGt1YmVjdGxMYXllciA9IHRoaXMuZ2V0S3ViZWN0bExheWVyKHNjb3BlLCB2ZXJzaW9uKTtcclxuICAgICAgICBjb25zdCB0YWdzID0gdGhpcy5wcm9wcy50YWdzO1xyXG5cclxuICAgICAgICBjb25zdCBkZWZhdWx0T3B0aW9uczogUGFydGlhbDxla3MuQ2x1c3RlclByb3BzPiA9IHtcclxuICAgICAgICAgICAgdnBjLFxyXG4gICAgICAgICAgICBzZWNyZXRzRW5jcnlwdGlvbktleSxcclxuICAgICAgICAgICAgY2x1c3Rlck5hbWUsXHJcbiAgICAgICAgICAgIGNsdXN0ZXJMb2dnaW5nLFxyXG4gICAgICAgICAgICBvdXRwdXRDbHVzdGVyTmFtZSxcclxuICAgICAgICAgICAgdmVyc2lvbixcclxuICAgICAgICAgICAgdnBjU3VibmV0cyxcclxuICAgICAgICAgICAgZW5kcG9pbnRBY2Nlc3MsXHJcbiAgICAgICAgICAgIGt1YmVjdGxMYXllcixcclxuICAgICAgICAgICAgdGFncyxcclxuICAgICAgICAgICAgbWFzdGVyc1JvbGUsXHJcbiAgICAgICAgICAgIGRlZmF1bHRDYXBhY2l0eTogMCwgLy8gd2Ugd2FudCB0byBtYW5hZ2UgY2FwYWNpdHkgb3Vyc2VsdmVzXHJcbiAgICAgICAgICAgIGRlZmF1bHRDYXBhY2l0eVR5cGU6IGVrcy5EZWZhdWx0Q2FwYWNpdHlUeXBlLk5PREVHUk9VUFxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGlzb2xhdGVkT3B0aW9uczogUGFydGlhbDxla3MuQ2x1c3RlclByb3BzPiA9IGlzb2xhdGVkQ2x1c3RlciA/IHtcclxuICAgICAgICAgICAgcGxhY2VDbHVzdGVySGFuZGxlckluVnBjOiB0cnVlLFxyXG4gICAgICAgICAgICBjbHVzdGVySGFuZGxlckVudmlyb25tZW50OiB7IEFXU19TVFNfUkVHSU9OQUxfRU5EUE9JTlRTOiBcInJlZ2lvbmFsXCIgfSxcclxuICAgICAgICAgICAga3ViZWN0bEVudmlyb25tZW50OiB7IEFXU19TVFNfUkVHSU9OQUxfRU5EUE9JTlRTOiBcInJlZ2lvbmFsXCIgfSxcclxuICAgICAgICB9IDoge307XHJcblxyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXJPcHRpb25zID0geyAuLi5kZWZhdWx0T3B0aW9ucywgLi4uaXNvbGF0ZWRPcHRpb25zLCAuLi50aGlzLnByb3BzLCB2ZXJzaW9uLCBpcEZhbWlseSB9O1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgYW4gRUtTIENsdXN0ZXJcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gdGhpcy5pbnRlcm5hbENyZWF0ZUNsdXN0ZXIoc2NvcGUsIGlkLCBjbHVzdGVyT3B0aW9ucyk7XHJcbiAgICAgICAgY2x1c3Rlci5ub2RlLmFkZERlcGVuZGVuY3kodnBjKTtcclxuXHJcbiAgICAgICAgY29uc3Qgbm9kZUdyb3VwczogZWtzLk5vZGVncm91cFtdID0gW107XHJcblxyXG4gICAgICAgIHRoaXMucHJvcHMubWFuYWdlZE5vZGVHcm91cHM/LmZvckVhY2gobiA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVHcm91cCA9IHRoaXMuYWRkTWFuYWdlZE5vZGVHcm91cChjbHVzdGVyIGFzIGVrcy5DbHVzdGVyLCBuKTtcclxuICAgICAgICAgICAgbm9kZUdyb3Vwcy5wdXNoKG5vZGVHcm91cCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGF1dG9zY2FsaW5nR3JvdXBzOiBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwW10gPSBbXTtcclxuICAgICAgICB0aGlzLnByb3BzLmF1dG9zY2FsaW5nTm9kZUdyb3Vwcz8uZm9yRWFjaChuID0+IHtcclxuICAgICAgICAgICAgY29uc3QgYXV0b3NjYWxpbmdHcm91cCA9IHRoaXMuYWRkQXV0b1NjYWxpbmdHcm91cChjbHVzdGVyIGFzIGVrcy5DbHVzdGVyLCBuKTtcclxuICAgICAgICAgICAgYXV0b3NjYWxpbmdHcm91cHMucHVzaChhdXRvc2NhbGluZ0dyb3VwKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3QgZmFyZ2F0ZVByb2ZpbGVzID0gT2JqZWN0LmVudHJpZXModGhpcy5wcm9wcy5mYXJnYXRlUHJvZmlsZXMgPz8ge30pO1xyXG4gICAgICAgIGNvbnN0IGZhcmdhdGVDb25zdHJ1Y3RzOiBla3MuRmFyZ2F0ZVByb2ZpbGVbXSA9IFtdO1xyXG4gICAgICAgIGZhcmdhdGVQcm9maWxlcz8uZm9yRWFjaCgoW2tleSwgb3B0aW9uc10pID0+IGZhcmdhdGVDb25zdHJ1Y3RzLnB1c2godGhpcy5hZGRGYXJnYXRlUHJvZmlsZShjbHVzdGVyIGFzIGVrcy5DbHVzdGVyLCBrZXksIG9wdGlvbnMpKSk7XHJcblxyXG4gICAgICAgIHJldHVybiBuZXcgQ2x1c3RlckluZm8oY2x1c3RlciwgdmVyc2lvbiwgbm9kZUdyb3VwcywgYXV0b3NjYWxpbmdHcm91cHMsIGZhbHNlLCBmYXJnYXRlQ29uc3RydWN0cyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUZW1wbGF0ZSBtZXRob2QgdGhhdCBtYXkgYmUgb3ZlcnJpZGRlbiBieSBzdWJjbGFzc2VzIHRvIGNyZWF0ZSBhIHNwZWNpZmljIGNsdXN0ZXIgZmxhdm9yIChlLmcuIEZhcmdhdGVDbHVzdGVyIHZzIGVrcy5DbHVzdGVyKVxyXG4gICAgICogQHBhcmFtIHNjb3BlXHJcbiAgICAgKiBAcGFyYW0gaWRcclxuICAgICAqIEBwYXJhbSBjbHVzdGVyT3B0aW9uc1xyXG4gICAgICogQHJldHVybnNcclxuICAgICAqL1xyXG4gICAgcHJvdGVjdGVkIGludGVybmFsQ3JlYXRlQ2x1c3RlcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCBjbHVzdGVyT3B0aW9uczogYW55KTogZWtzLkNsdXN0ZXIge1xyXG4gICAgICAgIHJldHVybiBuZXcgZWtzLkNsdXN0ZXIoc2NvcGUsIGlkLCBjbHVzdGVyT3B0aW9ucyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDYW4gYmUgb3ZlcnJpZGRlbiB0byBwcm92aWRlIGEgY3VzdG9tIGt1YmVjdGwgbGF5ZXIuXHJcbiAgICAgKiBAcGFyYW0gc2NvcGVcclxuICAgICAqIEBwYXJhbSB2ZXJzaW9uXHJcbiAgICAgKiBAcmV0dXJuc1xyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgZ2V0S3ViZWN0bExheWVyKHNjb3BlOiBDb25zdHJ1Y3QsIHZlcnNpb246IGVrcy5LdWJlcm5ldGVzVmVyc2lvbik6IElMYXllclZlcnNpb24gfCB1bmRlZmluZWQge1xyXG4gICAgICAgIHJldHVybiBzZWxlY3RLdWJlY3RsTGF5ZXIoc2NvcGUsIHZlcnNpb24pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhbiBhdXRvc2NhbGluZyBncm91cCB0byB0aGUgY2x1c3Rlci5cclxuICAgICAqIEBwYXJhbSBjbHVzdGVyXHJcbiAgICAgKiBAcGFyYW0gbm9kZUdyb3VwXHJcbiAgICAgKiBAcmV0dXJuc1xyXG4gICAgICovXHJcbiAgICBhZGRBdXRvU2NhbGluZ0dyb3VwKGNsdXN0ZXI6IGVrcy5DbHVzdGVyLCBub2RlR3JvdXA6IEF1dG9zY2FsaW5nTm9kZUdyb3VwKTogYXV0b3NjYWxpbmcuQXV0b1NjYWxpbmdHcm91cCB7XHJcbiAgICAgICAgY29uc3QgbWFjaGluZUltYWdlVHlwZSA9IG5vZGVHcm91cC5tYWNoaW5lSW1hZ2VUeXBlID8/IGVrcy5NYWNoaW5lSW1hZ2VUeXBlLkFNQVpPTl9MSU5VWF8yO1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlVHlwZUNvbnRleHQgPSB1dGlscy52YWx1ZUZyb21Db250ZXh0KGNsdXN0ZXIsIGNvbnN0YW50cy5JTlNUQU5DRV9UWVBFX0tFWSwgY29uc3RhbnRzLkRFRkFVTFRfSU5TVEFOQ0VfVFlQRSk7XHJcbiAgICAgICAgY29uc3QgaW5zdGFuY2VUeXBlID0gbm9kZUdyb3VwLmluc3RhbmNlVHlwZSA/PyAodHlwZW9mIGluc3RhbmNlVHlwZUNvbnRleHQgPT09ICdzdHJpbmcnID8gbmV3IGVjMi5JbnN0YW5jZVR5cGUoaW5zdGFuY2VUeXBlQ29udGV4dCkgOiBpbnN0YW5jZVR5cGVDb250ZXh0KTtcclxuICAgICAgICBjb25zdCBtaW5TaXplID0gbm9kZUdyb3VwLm1pblNpemUgPz8gdXRpbHMudmFsdWVGcm9tQ29udGV4dChjbHVzdGVyLCBjb25zdGFudHMuTUlOX1NJWkVfS0VZLCBjb25zdGFudHMuREVGQVVMVF9OR19NSU5TSVpFKTtcclxuICAgICAgICBjb25zdCBtYXhTaXplID0gbm9kZUdyb3VwLm1heFNpemUgPz8gdXRpbHMudmFsdWVGcm9tQ29udGV4dChjbHVzdGVyLCBjb25zdGFudHMuTUFYX1NJWkVfS0VZLCBjb25zdGFudHMuREVGQVVMVF9OR19NQVhTSVpFKTtcclxuICAgICAgICBjb25zdCBkZXNpcmVkU2l6ZSA9IG5vZGVHcm91cC5kZXNpcmVkU2l6ZSA/PyB1dGlscy52YWx1ZUZyb21Db250ZXh0KGNsdXN0ZXIsIGNvbnN0YW50cy5ERVNJUkVEX1NJWkVfS0VZLCBtaW5TaXplKTtcclxuICAgICAgICBjb25zdCB1cGRhdGVQb2xpY3kgPSBub2RlR3JvdXAudXBkYXRlUG9saWN5ID8/IGF1dG9zY2FsaW5nLlVwZGF0ZVBvbGljeS5yb2xsaW5nVXBkYXRlKCk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBhbiBhdXRvc2NhbGluZyBncm91cFxyXG4gICAgICAgIHJldHVybiBjbHVzdGVyLmFkZEF1dG9TY2FsaW5nR3JvdXBDYXBhY2l0eShub2RlR3JvdXAuaWQsIHtcclxuICAgICAgICAgICAgLi4ubm9kZUdyb3VwLFxyXG4gICAgICAgICAgICAuLi4ge1xyXG4gICAgICAgICAgICAgICAgYXV0b1NjYWxpbmdHcm91cE5hbWU6IG5vZGVHcm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZSA/PyBub2RlR3JvdXAuaWQsXHJcbiAgICAgICAgICAgICAgICBtYWNoaW5lSW1hZ2VUeXBlLFxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VUeXBlLFxyXG4gICAgICAgICAgICAgICAgbWluQ2FwYWNpdHk6IG1pblNpemUsXHJcbiAgICAgICAgICAgICAgICBtYXhDYXBhY2l0eTogbWF4U2l6ZSxcclxuICAgICAgICAgICAgICAgIGRlc2lyZWRDYXBhY2l0eTogZGVzaXJlZFNpemUsXHJcbiAgICAgICAgICAgICAgICB1cGRhdGVQb2xpY3ksXHJcbiAgICAgICAgICAgICAgICB2cGNTdWJuZXRzOiBub2RlR3JvdXAubm9kZUdyb3VwU3VibmV0cyxcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIGZhcmdhdGUgcHJvZmlsZSB0byB0aGUgY2x1c3RlclxyXG4gICAgICovXHJcbiAgICBhZGRGYXJnYXRlUHJvZmlsZShjbHVzdGVyOiBla3MuQ2x1c3RlciwgbmFtZTogc3RyaW5nLCBwcm9maWxlT3B0aW9uczogZWtzLkZhcmdhdGVQcm9maWxlT3B0aW9ucyk6IGVrcy5GYXJnYXRlUHJvZmlsZSB7XHJcbiAgICAgICAgcmV0dXJuIGNsdXN0ZXIuYWRkRmFyZ2F0ZVByb2ZpbGUobmFtZSwgcHJvZmlsZU9wdGlvbnMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkcyBhIG1hbmFnZWQgbm9kZSBncm91cCB0byB0aGUgY2x1c3Rlci5cclxuICAgICAqIEBwYXJhbSBjbHVzdGVyXHJcbiAgICAgKiBAcGFyYW0gbm9kZUdyb3VwXHJcbiAgICAgKiBAcmV0dXJuc1xyXG4gICAgICovXHJcbiAgICBhZGRNYW5hZ2VkTm9kZUdyb3VwKGNsdXN0ZXI6IGVrcy5DbHVzdGVyLCBub2RlR3JvdXA6IE1hbmFnZWROb2RlR3JvdXApOiBla3MuTm9kZWdyb3VwIHtcclxuICAgICAgICBjb25zdCBjYXBhY2l0eVR5cGUgPSBub2RlR3JvdXAubm9kZUdyb3VwQ2FwYWNpdHlUeXBlO1xyXG4gICAgICAgIGNvbnN0IHJlbGVhc2VWZXJzaW9uID0gbm9kZUdyb3VwLmFtaVJlbGVhc2VWZXJzaW9uO1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlVHlwZUNvbnRleHQgPSB1dGlscy52YWx1ZUZyb21Db250ZXh0KGNsdXN0ZXIsIGNvbnN0YW50cy5JTlNUQU5DRV9UWVBFX0tFWSwgY29uc3RhbnRzLkRFRkFVTFRfSU5TVEFOQ0VfVFlQRSk7XHJcbiAgICAgICAgY29uc3QgaW5zdGFuY2VUeXBlcyA9IG5vZGVHcm91cC5pbnN0YW5jZVR5cGVzID8/IChbdHlwZW9mIGluc3RhbmNlVHlwZUNvbnRleHQgPT09ICdzdHJpbmcnID8gbmV3IGVjMi5JbnN0YW5jZVR5cGUoaW5zdGFuY2VUeXBlQ29udGV4dCkgOiBpbnN0YW5jZVR5cGVDb250ZXh0XSk7XHJcbiAgICAgICAgY29uc3QgYW1pVHlwZSA9IG5vZGVHcm91cC5hbWlUeXBlID8/IGNvbnN0YW50cy5ERUZBVUxUX0FNSTtcclxuICAgICAgICBjb25zdCBtaW5TaXplID0gbm9kZUdyb3VwLm1pblNpemUgPz8gdXRpbHMudmFsdWVGcm9tQ29udGV4dChjbHVzdGVyLCBjb25zdGFudHMuTUlOX1NJWkVfS0VZLCBjb25zdGFudHMuREVGQVVMVF9OR19NSU5TSVpFKTtcclxuICAgICAgICBjb25zdCBtYXhTaXplID0gbm9kZUdyb3VwLm1heFNpemUgPz8gdXRpbHMudmFsdWVGcm9tQ29udGV4dChjbHVzdGVyLCBjb25zdGFudHMuTUFYX1NJWkVfS0VZLCBjb25zdGFudHMuREVGQVVMVF9OR19NQVhTSVpFKTtcclxuICAgICAgICBjb25zdCBkZXNpcmVkU2l6ZSA9IG5vZGVHcm91cC5kZXNpcmVkU2l6ZSA/PyB1dGlscy52YWx1ZUZyb21Db250ZXh0KGNsdXN0ZXIsIGNvbnN0YW50cy5ERVNJUkVEX1NJWkVfS0VZLCBtaW5TaXplKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGEgbWFuYWdlZCBub2RlIGdyb3VwLlxyXG4gICAgICAgIGNvbnN0IG5vZGVncm91cE9wdGlvbnM6IHV0aWxzLldyaXRlYWJsZTxla3MuTm9kZWdyb3VwT3B0aW9ucz4gPSB7XHJcbiAgICAgICAgICAgIC4uLm5vZGVHcm91cCxcclxuICAgICAgICAgICAgLi4ue1xyXG4gICAgICAgICAgICAgICAgbm9kZWdyb3VwTmFtZTogbm9kZUdyb3VwLm5vZGVncm91cE5hbWUgPz8gbm9kZUdyb3VwLmlkLFxyXG4gICAgICAgICAgICAgICAgY2FwYWNpdHlUeXBlLFxyXG4gICAgICAgICAgICAgICAgaW5zdGFuY2VUeXBlcyxcclxuICAgICAgICAgICAgICAgIGFtaVR5cGUsXHJcbiAgICAgICAgICAgICAgICBtaW5TaXplLFxyXG4gICAgICAgICAgICAgICAgbWF4U2l6ZSxcclxuICAgICAgICAgICAgICAgIGRlc2lyZWRTaXplLFxyXG4gICAgICAgICAgICAgICAgcmVsZWFzZVZlcnNpb24sXHJcbiAgICAgICAgICAgICAgICBzdWJuZXRzOiBub2RlR3JvdXAubm9kZUdyb3VwU3VibmV0c1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZSkge1xyXG4gICAgICAgICAgICAvLyBDcmVhdGUgbGF1bmNoIHRlbXBsYXRlIHdpdGggcHJvdmlkZWQgbGF1bmNoIHRlbXBsYXRlIHByb3BlcnRpZXNcclxuICAgICAgICAgICAgY29uc3QgbHQgPSBuZXcgZWMyLkxhdW5jaFRlbXBsYXRlKGNsdXN0ZXIsIGAke25vZGVHcm91cC5pZH0tbHRgLCB7XHJcbiAgICAgICAgICAgICAgICBibG9ja0RldmljZXM6IG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZS5ibG9ja0RldmljZXMsXHJcbiAgICAgICAgICAgICAgICBtYWNoaW5lSW1hZ2U6IG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZT8ubWFjaGluZUltYWdlLFxyXG4gICAgICAgICAgICAgICAgc2VjdXJpdHlHcm91cDogbm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlLnNlY3VyaXR5R3JvdXAsXHJcbiAgICAgICAgICAgICAgICB1c2VyRGF0YTogbm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlPy51c2VyRGF0YSxcclxuICAgICAgICAgICAgICAgIHJlcXVpcmVJbWRzdjI6IG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZT8ucmVxdWlyZUltZHN2MixcclxuICAgICAgICAgICAgICAgIGh0dHBQdXRSZXNwb25zZUhvcExpbWl0OiBub2RlR3JvdXAubGF1bmNoVGVtcGxhdGU/Lmh0dHBQdXRSZXNwb25zZUhvcExpbWl0LFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgdXRpbHMuc2V0UGF0aChub2RlZ3JvdXBPcHRpb25zLCBcImxhdW5jaFRlbXBsYXRlU3BlY1wiLCB7XHJcbiAgICAgICAgICAgICAgICBpZDogbHQubGF1bmNoVGVtcGxhdGVJZCEsXHJcbiAgICAgICAgICAgICAgICB2ZXJzaW9uOiBsdC5sYXRlc3RWZXJzaW9uTnVtYmVyLFxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgY29uc3QgdGFncyA9IE9iamVjdC5lbnRyaWVzKG5vZGVHcm91cC5sYXVuY2hUZW1wbGF0ZS50YWdzID8/IHt9KTtcclxuICAgICAgICAgICAgdGFncy5mb3JFYWNoKChba2V5LCBvcHRpb25zXSkgPT4gVGFncy5vZihsdCkuYWRkKGtleSwgb3B0aW9ucykpO1xyXG4gICAgICAgICAgICBpZiAobm9kZUdyb3VwLmxhdW5jaFRlbXBsYXRlPy5tYWNoaW5lSW1hZ2UpIHtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlZ3JvdXBPcHRpb25zLmFtaVR5cGU7XHJcbiAgICAgICAgICAgICAgICBkZWxldGUgbm9kZWdyb3VwT3B0aW9ucy5yZWxlYXNlVmVyc2lvbjtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBub2RlR3JvdXAuYW1pUmVsZWFzZVZlcnNpb247XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IGNsdXN0ZXIuYWRkTm9kZWdyb3VwQ2FwYWNpdHkobm9kZUdyb3VwLmlkICsgXCItbmdcIiwgbm9kZWdyb3VwT3B0aW9ucyk7XHJcblxyXG4gICAgICAgIGlmIChub2RlR3JvdXAuZW5hYmxlU3NtUGVybWlzc2lvbnMpIHtcclxuICAgICAgICAgICAgcmVzdWx0LnJvbGUuYWRkTWFuYWdlZFBvbGljeShNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZScpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZUlucHV0KHByb3BzOiBHZW5lcmljQ2x1c3RlclByb3ZpZGVyUHJvcHMpIHtcclxuXHJcbiAgICAgICAgdXRpbHMudmFsaWRhdGVDb25zdHJhaW50cyhuZXcgR2VuZXJpY0NsdXN0ZXJQcm9wc0NvbnN0cmFpbnRzLCBHZW5lcmljQ2x1c3RlclByb3ZpZGVyLm5hbWUsIHByb3BzKTtcclxuICAgICAgICBpZiAocHJvcHMubWFuYWdlZE5vZGVHcm91cHMgIT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB1dGlscy52YWxpZGF0ZUNvbnN0cmFpbnRzKG5ldyBNYW5hZ2VkTm9kZUdyb3VwQ29uc3RyYWludHMsIFwiTWFuYWdlZE5vZGVHcm91cFwiLCAuLi5wcm9wcy5tYW5hZ2VkTm9kZUdyb3Vwcyk7XHJcbiAgICAgICAgaWYgKHByb3BzLmF1dG9zY2FsaW5nTm9kZUdyb3VwcyAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHV0aWxzLnZhbGlkYXRlQ29uc3RyYWludHMobmV3IEF1dG9zY2FsaW5nTm9kZUdyb3VwQ29uc3RyYWludHMsIFwiQXV0b3NjYWxpbmdOb2RlR3JvdXBzXCIsIC4uLnByb3BzLmF1dG9zY2FsaW5nTm9kZUdyb3Vwcyk7XHJcbiAgICAgICAgaWYgKHByb3BzLmZhcmdhdGVQcm9maWxlcyBhcyBhbnkgIT0gdW5kZWZpbmVkKVxyXG4gICAgICAgICAgICB1dGlscy52YWxpZGF0ZUNvbnN0cmFpbnRzKG5ldyBGYXJnYXRlUHJvZmlsZUNvbnN0cmFpbnRzLCBcIkZhcmdhdGVQcm9maWxlc1wiLCAuLi5PYmplY3QudmFsdWVzKHByb3BzLmZhcmdhdGVQcm9maWxlcyBhcyBhbnkpKTtcclxuICAgIH1cclxufVxyXG4iXX0=