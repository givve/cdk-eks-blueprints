"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarpenterV1AddOn = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const iam = require("aws-cdk-lib/aws-iam");
const sqs = require("aws-cdk-lib/aws-sqs");
const ts_deepmerge_1 = require("ts-deepmerge");
const utils = require("../../utils");
const semver = require("semver");
const assert = require("assert");
const helm_addon_1 = require("../helm-addon");
const iam_1 = require("./iam");
const types_1 = require("./types");
const md5 = require("ts-md5");
const defaultProps = {
    name: types_1.KARPENTER,
    namespace: "kube-system",
    version: "1.7.1",
    chart: types_1.KARPENTER,
    release: types_1.KARPENTER,
    repository: "oci://public.ecr.aws/karpenter/karpenter",
};
/**
 * Implementation of the Karpenter add-on
 */
let KarpenterV1AddOn = class KarpenterV1AddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        assert(clusterInfo.cluster instanceof aws_eks_1.Cluster, "KarpenterAddOn cannot be used with imported clusters as it requires changes to the cluster authentication.");
        assert(semver.gte(this.options.version, "0.32.0"), `Karpenter interruption handling requires version >= 0.32.0. Current version: ${this.props.version}`);
        assert(semver.gte(semver.coerce(clusterInfo.version.version), "1.29.0", true), `Cluster version must be >= 1.29 for Karpenter interruption handling. Current version: ${clusterInfo.version.version}`);
        const cluster = clusterInfo.cluster;
        const endpoint = cluster.clusterEndpoint;
        const name = cluster.clusterName;
        const partition = cluster.stack.partition;
        const stackName = cluster.stack.stackName;
        const region = cluster.stack.region;
        let values = this.options.values ?? {};
        const interruption = this.options.interruptionHandling || false;
        const podIdentity = this.options.podIdentity || false;
        // NodePool variables
        const labels = this.options.nodePoolSpec?.labels || {};
        const annotations = this.options.nodePoolSpec?.annotations || {};
        const taints = this.options.nodePoolSpec?.taints || [];
        const startupTaints = this.options.nodePoolSpec?.startupTaints || [];
        const requirements = this.options.nodePoolSpec?.requirements || [];
        const disruption = this.options.nodePoolSpec?.disruption || null;
        const limits = this.options.nodePoolSpec?.limits || null;
        const weight = this.options.nodePoolSpec?.weight || null;
        // NodeClass variables
        const subnetSelectorTerms = this.options.ec2NodeClassSpec?.subnetSelectorTerms;
        const sgSelectorTerms = this.options.ec2NodeClassSpec?.securityGroupSelectorTerms;
        const amiFamily = this.options.ec2NodeClassSpec?.amiFamily;
        const amiSelectorTerms = this.options.ec2NodeClassSpec?.amiSelectorTerms;
        const instanceStorePolicy = this.options.ec2NodeClassSpec?.instanceStorePolicy || undefined;
        const userData = this.options.ec2NodeClassSpec?.userData || "";
        const instanceProf = this.options.ec2NodeClassSpec?.instanceProfile;
        const tags = this.options.ec2NodeClassSpec?.tags || {};
        const metadataOptions = this.options.ec2NodeClassSpec?.metadataOptions || {
            httpEndpoint: "enabled",
            httpProtocolIPv6: "disabled",
            httpPutResponseHopLimit: 2,
            httpTokens: "required",
        };
        if (cluster.ipFamily == aws_eks_1.IpFamily.IP_V6) {
            metadataOptions.httpProtocolIPv6 = "enabled";
        }
        const blockDeviceMappings = this.options.ec2NodeClassSpec?.blockDeviceMappings || [];
        const detailedMonitoring = this.options.ec2NodeClassSpec?.detailedMonitoring || false;
        // Set up the node role and instance profile
        const [karpenterNodeRole] = this.setUpNodeRole(cluster, stackName, region);
        // Create the controller policy
        let karpenterPolicyDocument;
        karpenterPolicyDocument = iam.PolicyDocument.fromJson((0, iam_1.KarpenterControllerPolicyV1)(cluster, partition, region));
        karpenterPolicyDocument.addStatements(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ["iam:PassRole"],
            resources: [`${karpenterNodeRole.roleArn}`],
        }));
        // Support for Native spot interruption
        if (interruption) {
            // Add policy to the node role to allow access to the Interruption Queue
            const interruptionQueueStatement = this.createInterruptionQueue(cluster, stackName);
            karpenterPolicyDocument.addStatements(interruptionQueueStatement);
        }
        // Create Namespace
        const ns = utils.createNamespace(this.options.namespace, cluster, true, true);
        let sa;
        let saAnnotation;
        if (podIdentity) {
            sa = utils.podIdentityAssociation(cluster, types_1.RELEASE, this.options.namespace, karpenterPolicyDocument);
            saAnnotation = {};
        }
        else {
            sa = utils.createServiceAccount(cluster, types_1.RELEASE, this.options.namespace, karpenterPolicyDocument);
            saAnnotation = { "eks.amazonaws.com/role-arn": sa.role.roleArn };
        }
        sa.node.addDependency(ns);
        // Create global helm values based on v1beta1 migration as shown below:
        // https://karpenter.sh/v0.32/upgrading/v1beta1-migration/#helm-values
        let globalSettings = { clusterName: name, clusterEndpoint: endpoint };
        globalSettings = (0, ts_deepmerge_1.merge)(globalSettings, { interruptionQueue: interruption ? stackName : "" });
        utils.setPath(values, "settings", (0, ts_deepmerge_1.merge)(globalSettings, values?.settings ?? {}));
        // Let Helm create the service account if using pod identity
        const saValues = {
            serviceAccount: { create: podIdentity, name: types_1.RELEASE, annotations: saAnnotation },
        };
        values = (0, ts_deepmerge_1.merge)(values, saValues);
        // Install HelmChart using user defined value or default of 5 minutes.
        const helmChartTimeout = this.options.helmChartTimeout || aws_cdk_lib_1.Duration.minutes(5);
        const karpenterChart = this.addHelmChart(clusterInfo, values, false, true, helmChartTimeout);
        karpenterChart.node.addDependency(sa);
        if (clusterInfo.nodeGroups) {
            clusterInfo.nodeGroups.forEach((n) => karpenterChart.node.addDependency(n));
        }
        // Deploy Provisioner (Alpha) or NodePool (Beta) CRD based on the Karpenter Version
        if (this.options.nodePoolSpec) {
            const pool = {
                apiVersion: "karpenter.sh/v1",
                kind: "NodePool",
                metadata: { name: "default-nodepool" },
                spec: {
                    template: {
                        metadata: { labels: labels, annotations: annotations },
                        spec: {
                            nodeClassRef: {
                                name: "default-ec2nodeclass",
                                group: "karpenter.k8s.aws",
                                kind: "EC2NodeClass"
                            },
                            taints: taints,
                            startupTaints: startupTaints,
                            requirements: this.convert(requirements),
                            expireAfter: this.options.nodePoolSpec?.expireAfter
                        },
                    },
                    disruption: disruption,
                    limits: limits,
                    weight: weight,
                },
            };
            const poolManifest = cluster.addManifest("default-pool", pool);
            poolManifest.node.addDependency(karpenterChart);
            // Deploy AWSNodeTemplate (Alpha) or EC2NodeClass (Beta) CRD based on the Karpenter Version
            if (this.options.ec2NodeClassSpec) {
                let ec2Node;
                ec2Node = {
                    apiVersion: "karpenter.k8s.aws/v1",
                    kind: "EC2NodeClass",
                    metadata: { name: "default-ec2nodeclass" },
                    spec: {
                        amiFamily: amiFamily,
                        subnetSelectorTerms: subnetSelectorTerms,
                        securityGroupSelectorTerms: sgSelectorTerms,
                        amiSelectorTerms: amiSelectorTerms ? amiSelectorTerms : [],
                        userData: userData,
                        tags: tags,
                        metadataOptions: metadataOptions,
                        blockDeviceMappings: blockDeviceMappings,
                        detailedMonitoring: detailedMonitoring,
                    },
                };
                // Provide custom Instance Profile to replace role if provided, else use the role created with the addon
                if (instanceProf) {
                    ec2Node = (0, ts_deepmerge_1.merge)(ec2Node, { spec: { instanceProfile: instanceProf } });
                }
                else {
                    ec2Node = (0, ts_deepmerge_1.merge)(ec2Node, { spec: { role: karpenterNodeRole.roleName } });
                }
                // Instance Store Policy added for v0.34.0 and up
                if (instanceStorePolicy) {
                    ec2Node = (0, ts_deepmerge_1.merge)(ec2Node, { spec: { instanceStorePolicy: instanceStorePolicy } });
                }
                const nodeManifest = cluster.addManifest("default-node-template", ec2Node);
                nodeManifest.node.addDependency(karpenterChart);
                poolManifest.node.addDependency(nodeManifest);
            }
        }
        return Promise.resolve(karpenterChart);
    }
    /**
     * Helper function to convert a key-pair values (with an operator)
     * of spec configurations to appropriate json format for addManifest function
     * @param reqs
     * @returns newReqs
     * */
    convert(reqs) {
        const newReqs = [];
        for (let req of reqs) {
            const key = req["key"];
            const op = req["operator"];
            const val = req["values"];
            const requirement = { key: key, operator: op, values: val };
            newReqs.push(requirement);
        }
        return newReqs;
    }
    /**
     * Helper function to set up the Karpenter Node Role and Instance Profile
     * Outputs to CloudFormation and map the role to the aws-auth ConfigMap
     * @param cluster EKS Cluster
     * @param stackName Name of the stack
     * @param region Region of the stack
     * @returns [karpenterNodeRole, karpenterInstanceProfile]
     */
    setUpNodeRole(cluster, stackName, region) {
        // Set up Node Role
        const karpenterNodeRole = new iam.Role(cluster, "karpenter-node-role", {
            assumedBy: new iam.ServicePrincipal(`ec2.${cluster.stack.urlSuffix}`),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"),
                iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
            ],
            //roleName: `KarpenterNodeRole-${name}` // let role name to be generated as unique
        });
        // Attach ipv6 related policies based on cluster IPFamily
        if (cluster.ipFamily === aws_eks_1.IpFamily.IP_V6) {
            const nodeIpv6Policy = new iam.Policy(cluster, "karpenter-node-Ipv6-Policy", {
                document: utils.getEKSNodeIpv6PolicyDocument(),
            });
            karpenterNodeRole.attachInlinePolicy(nodeIpv6Policy);
        }
        // Set up Instance Profile
        const instanceProfileName = md5.Md5.hashStr(stackName + region);
        const karpenterInstanceProfile = new iam.CfnInstanceProfile(cluster, "karpenter-instance-profile", {
            roles: [karpenterNodeRole.roleName],
            instanceProfileName: `KarpenterNodeInstanceProfile-${instanceProfileName}`,
            path: "/",
        });
        karpenterInstanceProfile.node.addDependency(karpenterNodeRole);
        const clusterId = aws_cdk_lib_1.Names.uniqueId(cluster);
        //Cfn output for Node Role in case of needing to add additional policies
        new aws_cdk_lib_1.CfnOutput(cluster.stack, "Karpenter Instance Node Role", {
            value: karpenterNodeRole.roleName,
            description: "Karpenter add-on Node Role name",
            exportName: clusterId + "KarpenterNodeRoleName",
        });
        //Cfn output for Instance Profile for creating additional provisioners
        new aws_cdk_lib_1.CfnOutput(cluster.stack, "Karpenter Instance Profile name", {
            value: karpenterInstanceProfile ? karpenterInstanceProfile.instanceProfileName : "none",
            description: "Karpenter add-on Instance Profile name",
            exportName: clusterId + "KarpenterInstanceProfileName",
        });
        // Map Node Role to aws-auth
        cluster.awsAuth.addRoleMapping(karpenterNodeRole, {
            groups: ["system:bootstrappers", "system:nodes"],
            username: "system:node:{{EC2PrivateDNSName}}",
        });
        return [karpenterNodeRole, karpenterInstanceProfile];
    }
    createInterruptionQueue(cluster, stackName) {
        // Create Interruption Queue
        const queue = new sqs.Queue(cluster.stack, "karpenter-queue", {
            queueName: stackName,
            retentionPeriod: aws_cdk_lib_1.Duration.seconds(300),
        });
        queue.addToResourcePolicy(new iam.PolicyStatement({
            sid: "EC2InterruptionPolicy",
            effect: iam.Effect.ALLOW,
            principals: [
                new iam.ServicePrincipal("sqs.amazonaws.com"),
                new iam.ServicePrincipal("events.amazonaws.com"),
            ],
            actions: ["sqs:SendMessage"],
            resources: [`${queue.queueArn}`],
        }));
        // Add Interruption Rules
        new aws_events_1.Rule(cluster.stack, "schedule-change-rule", {
            eventPattern: { source: ["aws.health"], detailType: ["AWS Health Event"] },
        }).addTarget(new aws_events_targets_1.SqsQueue(queue));
        new aws_events_1.Rule(cluster.stack, "spot-interruption-rule", {
            eventPattern: { source: ["aws.ec2"], detailType: ["EC2 Spot Instance Interruption Warning"] },
        }).addTarget(new aws_events_targets_1.SqsQueue(queue));
        new aws_events_1.Rule(cluster.stack, "rebalance-rule", {
            eventPattern: { source: ["aws.ec2"], detailType: ["EC2 Instance Rebalance Recommendation"] },
        }).addTarget(new aws_events_targets_1.SqsQueue(queue));
        new aws_events_1.Rule(cluster.stack, "inst-state-change-rule", {
            eventPattern: { source: ["aws.ec2"], detailType: ["C2 Instance State-change Notification"] },
        }).addTarget(new aws_events_targets_1.SqsQueue(queue));
        // Create and return the interruption queue policy statement
        return new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "sqs:DeleteMessage",
                "sqs:GetQueueUrl",
                "sqs:GetQueueAttributes",
                "sqs:ReceiveMessage",
            ],
            resources: [`${queue.queueArn}`],
        });
    }
};
exports.KarpenterV1AddOn = KarpenterV1AddOn;
__decorate([
    utils.conflictsWith("ClusterAutoScalerAddOn"),
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.ALREADY_INSTALLED)
], KarpenterV1AddOn.prototype, "deploy", null);
exports.KarpenterV1AddOn = KarpenterV1AddOn = __decorate([
    utils.supportsALL
], KarpenterV1AddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia2FycGVudGVyLXYxLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkZG9ucy9rYXJwZW50ZXIva2FycGVudGVyLXYxLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUFBLDZDQUF5RDtBQUN6RCx1REFBOEM7QUFDOUMsdUVBQTBEO0FBQzFELGlEQUF3RDtBQUN4RCwyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBRTNDLCtDQUFxQztBQUNyQyxxQ0FBcUM7QUFFckMsaUNBQWlDO0FBQ2pDLGlDQUFpQztBQUNqQyw4Q0FBOEU7QUFDOUUsK0JBQW9EO0FBQ3BELG1DQUFpRjtBQUNqRiw4QkFBOEI7QUFFOUIsTUFBTSxZQUFZLEdBQW1CO0lBQ2pDLElBQUksRUFBRSxpQkFBUztJQUNmLFNBQVMsRUFBRSxhQUFhO0lBQ3hCLE9BQU8sRUFBRSxPQUFPO0lBQ2hCLEtBQUssRUFBRSxpQkFBUztJQUNoQixPQUFPLEVBQUUsaUJBQVM7SUFDbEIsVUFBVSxFQUFFLDBDQUEwQztDQUN6RCxDQUFDO0FBMkNGOztHQUVHO0FBRUksSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBUztJQUNsQyxPQUFPLENBQXdCO0lBRXhDLFlBQVksS0FBNkI7UUFDckMsS0FBSyxDQUFDLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBSUQsTUFBTSxDQUFDLFdBQXdCO1FBQzNCLE1BQU0sQ0FDRixXQUFXLENBQUMsT0FBTyxZQUFZLGlCQUFPLEVBQ3RDLDRHQUE0RyxDQUMvRyxDQUFDO1FBQ0YsTUFBTSxDQUNGLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFRLEVBQUUsUUFBUSxDQUFDLEVBQzNDLGdGQUFnRixJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8s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QUFDO0lBQ1AsQ0FBQztDQUNKLENBQUE7QUFqV1ksNENBQWdCO0FBVXpCO0lBRkMsS0FBSyxDQUFDLGFBQWEsQ0FBQyx3QkFBd0IsQ0FBQztJQUM3QyxLQUFLLENBQUMscUJBQXFCLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDLGlCQUFpQixDQUFDOzhDQTZNekU7MkJBdE5RLGdCQUFnQjtJQUQ1QixLQUFLLENBQUMsV0FBVztHQUNMLGdCQUFnQixDQWlXNUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBEdXJhdGlvbiwgTmFtZXMsIENmbk91dHB1dCB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBSdWxlIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1ldmVudHNcIjtcclxuaW1wb3J0IHsgU3FzUXVldWUgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzXCI7XHJcbmltcG9ydCB7IENsdXN0ZXIsIElwRmFtaWx5IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCAqIGFzIHNxcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLXNxc1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJ0cy1kZWVwbWVyZ2VcIjtcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSBcInNlbXZlclwiO1xyXG5pbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblByb3BzLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tIFwiLi4vaGVsbS1hZGRvblwiO1xyXG5pbXBvcnQgeyBLYXJwZW50ZXJDb250cm9sbGVyUG9saWN5VjEgfSBmcm9tIFwiLi9pYW1cIjtcclxuaW1wb3J0IHsgRWMyTm9kZUNsYXNzVjFTcGVjLCBOb2RlUG9vbFYxU3BlYywgS0FSUEVOVEVSLCBSRUxFQVNFIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuaW1wb3J0ICogYXMgbWQ1IGZyb20gXCJ0cy1tZDVcIjtcclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wczogSGVsbUFkZE9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiBLQVJQRU5URVIsXHJcbiAgICBuYW1lc3BhY2U6IFwia3ViZS1zeXN0ZW1cIixcclxuICAgIHZlcnNpb246IFwiMS43LjFcIixcclxuICAgIGNoYXJ0OiBLQVJQRU5URVIsXHJcbiAgICByZWxlYXNlOiBLQVJQRU5URVIsXHJcbiAgICByZXBvc2l0b3J5OiBcIm9jaTovL3B1YmxpYy5lY3IuYXdzL2thcnBlbnRlci9rYXJwZW50ZXJcIixcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBhZGQtb25cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgS2FycGVudGVyVjFBZGRPblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBpcyB0aGUgdG9wIGxldmVsIG5vZGVwb29sIHNwZWNpZmljYXRpb24uIE5vZGVwb29scyBsYXVuY2ggbm9kZXMgaW4gcmVzcG9uc2UgdG8gcG9kcyB0aGF0IGFyZSB1bnNjaGVkdWxhYmxlLlxyXG4gICAgICogQSBzaW5nbGUgbm9kZXBvb2wgaXMgY2FwYWJsZSBvZiBtYW5hZ2luZyBhIGRpdmVyc2Ugc2V0IG9mIG5vZGVzLlxyXG4gICAgICogTm9kZSBwcm9wZXJ0aWVzIGFyZSBkZXRlcm1pbmVkIGZyb20gYSBjb21iaW5hdGlvbiBvZiBub2RlcG9vbCBhbmQgcG9kIHNjaGVkdWxpbmcgY29uc3RyYWludHMuXHJcbiAgICAgKi9cclxuICAgIG5vZGVQb29sU3BlYz86IE5vZGVQb29sVjFTcGVjO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBpcyB0aGUgdG9wIGxldmVsIHNwZWMgZm9yIHRoZSBBV1MgS2FycGVudGVyIFByb3ZpZGVyXHJcbiAgICAgKiBJdCBjb250YWlucyBjb25maWd1cmF0aW9uIG5lY2Vzc2FyeSB0byBsYXVuY2ggaW5zdGFuY2VzIGluIEFXUy5cclxuICAgICAqL1xyXG4gICAgZWMyTm9kZUNsYXNzU3BlYz86IEVjMk5vZGVDbGFzc1YxU3BlYztcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZsYWcgZm9yIGVuYWJsaW5nIEthcnBlbnRlcidzIG5hdGl2ZSBpbnRlcnJ1cHRpb24gaGFuZGxpbmdcclxuICAgICAqL1xyXG4gICAgaW50ZXJydXB0aW9uSGFuZGxpbmc/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGltZW91dCBkdXJhdGlvbiB3aGlsZSBpbnN0YWxsaW5nIGthcnBlbnRlciBoZWxtIGNoYXJ0IHVzaW5nIGFkZEhlbG1DaGFydCBBUElcclxuICAgICAqL1xyXG4gICAgaGVsbUNoYXJ0VGltZW91dD86IER1cmF0aW9uO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVXNlIFBvZCBJZGVudGl0eS5cclxuICAgICAqIFRvIHVzZSBFS1MgUG9kIElkZW50aXRpZXNcclxuICAgICAqICAtIFRoZSBjbHVzdGVyIG11c3QgaGF2ZSBLdWJlcm5ldGVzIHZlcnNpb24gMS4yNCBvciBsYXRlclxyXG4gICAgICogIC0gS2FycGVudGVyIFBvZHMgbXVzdCBiZSBhc3NpZ25lZCB0byBMaW51eCBBbWF6b24gRUMyIGluc3RhbmNlc1xyXG4gICAgICogIC0gS2FycGVudGVyIHZlcnNpb24gc3VwcG9ydHMgUG9kIElkZW50aXR5ICh2MC4zNS4wIG9yIGxhdGVyKSBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL3BvZC1pZGVudGl0eS5odG1sXHJcbiAgICAgKlxyXG4gICAgICogQHNlZSBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvcG9kLWlkZW50aXR5Lmh0bWxcclxuICAgICAqXHJcbiAgICAgKiBAZGVmYXVsdCBmYWxzZVxyXG4gICAgICovXHJcbiAgICBwb2RJZGVudGl0eT86IGJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgS2FycGVudGVyIGFkZC1vblxyXG4gKi9cclxuQHV0aWxzLnN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBLYXJwZW50ZXJWMUFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuICAgIHJlYWRvbmx5IG9wdGlvbnM6IEthcnBlbnRlclYxQWRkT25Qcm9wcztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IEthcnBlbnRlclYxQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsgLi4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzO1xyXG4gICAgfVxyXG5cclxuICAgIEB1dGlscy5jb25mbGljdHNXaXRoKFwiQ2x1c3RlckF1dG9TY2FsZXJBZGRPblwiKVxyXG4gICAgQHV0aWxzLmNvbmZsaWN0c1dpdGhBdXRvTW9kZSh1dGlscy5BdXRvTW9kZUNvbmZsaWN0VHlwZS5BTFJFQURZX0lOU1RBTExFRClcclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGFzc2VydChcclxuICAgICAgICAgICAgY2x1c3RlckluZm8uY2x1c3RlciBpbnN0YW5jZW9mIENsdXN0ZXIsXHJcbiAgICAgICAgICAgIFwiS2FycGVudGVyQWRkT24gY2Fubm90IGJlIHVzZWQgd2l0aCBpbXBvcnRlZCBjbHVzdGVycyBhcyBpdCByZXF1aXJlcyBjaGFuZ2VzIHRvIHRoZSBjbHVzdGVyIGF1dGhlbnRpY2F0aW9uLlwiXHJcbiAgICAgICAgKTtcclxuICAgICAgICBhc3NlcnQoXHJcbiAgICAgICAgICAgIHNlbXZlci5ndGUodGhpcy5vcHRpb25zLnZlcnNpb24hLCBcIjAuMzIuMFwiKSxcclxuICAgICAgICAgICAgYEthcnBlbnRlciBpbnRlcnJ1cHRpb24gaGFuZGxpbmcgcmVxdWlyZXMgdmVyc2lvbiA+PSAwLjMyLjAuIEN1cnJlbnQgdmVyc2lvbjogJHt0aGlzLnByb3BzLnZlcnNpb259YFxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIGFzc2VydChcclxuICAgICAgICAgICAgc2VtdmVyLmd0ZShzZW12ZXIuY29lcmNlKGNsdXN0ZXJJbmZvLnZlcnNpb24udmVyc2lvbikhLCBcIjEuMjkuMFwiLCB0cnVlKSxcclxuICAgICAgICAgICAgYENsdXN0ZXIgdmVyc2lvbiBtdXN0IGJlID49IDEuMjkgZm9yIEthcnBlbnRlciBpbnRlcnJ1cHRpb24gaGFuZGxpbmcuIEN1cnJlbnQgdmVyc2lvbjogJHtjbHVzdGVySW5mby52ZXJzaW9uLnZlcnNpb259YFxyXG4gICAgICAgICk7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlcjogQ2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICAgICAgY29uc3QgZW5kcG9pbnQgPSBjbHVzdGVyLmNsdXN0ZXJFbmRwb2ludDtcclxuICAgICAgICBjb25zdCBuYW1lID0gY2x1c3Rlci5jbHVzdGVyTmFtZTtcclxuICAgICAgICBjb25zdCBwYXJ0aXRpb24gPSBjbHVzdGVyLnN0YWNrLnBhcnRpdGlvbjtcclxuXHJcbiAgICAgICAgY29uc3Qgc3RhY2tOYW1lID0gY2x1c3Rlci5zdGFjay5zdGFja05hbWU7XHJcbiAgICAgICAgY29uc3QgcmVnaW9uID0gY2x1c3Rlci5zdGFjay5yZWdpb247XHJcblxyXG4gICAgICAgIGxldCB2YWx1ZXMgPSB0aGlzLm9wdGlvbnMudmFsdWVzID8/IHt9O1xyXG5cclxuICAgICAgICBjb25zdCBpbnRlcnJ1cHRpb24gPSB0aGlzLm9wdGlvbnMuaW50ZXJydXB0aW9uSGFuZGxpbmcgfHwgZmFsc2U7XHJcbiAgICAgICAgY29uc3QgcG9kSWRlbnRpdHkgPSB0aGlzLm9wdGlvbnMucG9kSWRlbnRpdHkgfHwgZmFsc2U7XHJcblxyXG4gICAgICAgIC8vIE5vZGVQb29sIHZhcmlhYmxlc1xyXG4gICAgICAgIGNvbnN0IGxhYmVscyA9IHRoaXMub3B0aW9ucy5ub2RlUG9vbFNwZWM/LmxhYmVscyB8fCB7fTtcclxuICAgICAgICBjb25zdCBhbm5vdGF0aW9ucyA9IHRoaXMub3B0aW9ucy5ub2RlUG9vbFNwZWM/LmFubm90YXRpb25zIHx8IHt9O1xyXG4gICAgICAgIGNvbnN0IHRhaW50cyA9IHRoaXMub3B0aW9ucy5ub2RlUG9vbFNwZWM/LnRhaW50cyB8fCBbXTtcclxuICAgICAgICBjb25zdCBzdGFydHVwVGFpbnRzID0gdGhpcy5vcHRpb25zLm5vZGVQb29sU3BlYz8uc3RhcnR1cFRhaW50cyB8fCBbXTtcclxuICAgICAgICBjb25zdCByZXF1aXJlbWVudHMgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy5yZXF1aXJlbWVudHMgfHwgW107XHJcbiAgICAgICAgY29uc3QgZGlzcnVwdGlvbiA9IHRoaXMub3B0aW9ucy5ub2RlUG9vbFNwZWM/LmRpc3J1cHRpb24gfHwgbnVsbDtcclxuICAgICAgICBjb25zdCBsaW1pdHMgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy5saW1pdHMgfHwgbnVsbDtcclxuICAgICAgICBjb25zdCB3ZWlnaHQgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy53ZWlnaHQgfHwgbnVsbDtcclxuXHJcbiAgICAgICAgLy8gTm9kZUNsYXNzIHZhcmlhYmxlc1xyXG5cclxuICAgICAgICBjb25zdCBzdWJuZXRTZWxlY3RvclRlcm1zID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LnN1Ym5ldFNlbGVjdG9yVGVybXM7XHJcbiAgICAgICAgY29uc3Qgc2dTZWxlY3RvclRlcm1zID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LnNlY3VyaXR5R3JvdXBTZWxlY3RvclRlcm1zO1xyXG4gICAgICAgIGNvbnN0IGFtaUZhbWlseSA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy5hbWlGYW1pbHk7XHJcblxyXG4gICAgICAgIGNvbnN0IGFtaVNlbGVjdG9yVGVybXMgPSB0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYz8uYW1pU2VsZWN0b3JUZXJtcztcclxuICAgICAgICBjb25zdCBpbnN0YW5jZVN0b3JlUG9saWN5ID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/Lmluc3RhbmNlU3RvcmVQb2xpY3kgfHwgdW5kZWZpbmVkO1xyXG4gICAgICAgIGNvbnN0IHVzZXJEYXRhID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LnVzZXJEYXRhIHx8IFwiXCI7XHJcbiAgICAgICAgY29uc3QgaW5zdGFuY2VQcm9mID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/Lmluc3RhbmNlUHJvZmlsZTtcclxuICAgICAgICBjb25zdCB0YWdzID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LnRhZ3MgfHwge307XHJcbiAgICAgICAgY29uc3QgbWV0YWRhdGFPcHRpb25zID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/Lm1ldGFkYXRhT3B0aW9ucyB8fCB7XHJcbiAgICAgICAgICAgIGh0dHBFbmRwb2ludDogXCJlbmFibGVkXCIsXHJcbiAgICAgICAgICAgIGh0dHBQcm90b2NvbElQdjY6IFwiZGlzYWJsZWRcIixcclxuICAgICAgICAgICAgaHR0cFB1dFJlc3BvbnNlSG9wTGltaXQ6IDIsXHJcbiAgICAgICAgICAgIGh0dHBUb2tlbnM6IFwicmVxdWlyZWRcIixcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAoY2x1c3Rlci5pcEZhbWlseSA9PSBJcEZhbWlseS5JUF9WNikge1xyXG4gICAgICAgICAgICBtZXRhZGF0YU9wdGlvbnMuaHR0cFByb3RvY29sSVB2NiA9IFwiZW5hYmxlZFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBibG9ja0RldmljZU1hcHBpbmdzID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LmJsb2NrRGV2aWNlTWFwcGluZ3MgfHwgW107XHJcbiAgICAgICAgY29uc3QgZGV0YWlsZWRNb25pdG9yaW5nID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LmRldGFpbGVkTW9uaXRvcmluZyB8fCBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gU2V0IHVwIHRoZSBub2RlIHJvbGUgYW5kIGluc3RhbmNlIHByb2ZpbGVcclxuICAgICAgICBjb25zdCBba2FycGVudGVyTm9kZVJvbGVdID0gdGhpcy5zZXRVcE5vZGVSb2xlKGNsdXN0ZXIsIHN0YWNrTmFtZSwgcmVnaW9uKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sbGVyIHBvbGljeVxyXG4gICAgICAgIGxldCBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudDtcclxuXHJcbiAgICAgICAga2FycGVudGVyUG9saWN5RG9jdW1lbnQgPSBpYW0uUG9saWN5RG9jdW1lbnQuZnJvbUpzb24oXHJcbiAgICAgICAgICAgIEthcnBlbnRlckNvbnRyb2xsZXJQb2xpY3lWMShjbHVzdGVyLCBwYXJ0aXRpb24sIHJlZ2lvbilcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudC5hZGRTdGF0ZW1lbnRzKFxyXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXCJpYW06UGFzc1JvbGVcIl0sXHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtgJHtrYXJwZW50ZXJOb2RlUm9sZS5yb2xlQXJufWBdLFxyXG4gICAgICAgICAgICB9KVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIFN1cHBvcnQgZm9yIE5hdGl2ZSBzcG90IGludGVycnVwdGlvblxyXG4gICAgICAgIGlmIChpbnRlcnJ1cHRpb24pIHtcclxuICAgICAgICAgICAgLy8gQWRkIHBvbGljeSB0byB0aGUgbm9kZSByb2xlIHRvIGFsbG93IGFjY2VzcyB0byB0aGUgSW50ZXJydXB0aW9uIFF1ZXVlXHJcbiAgICAgICAgICAgIGNvbnN0IGludGVycnVwdGlvblF1ZXVlU3RhdGVtZW50ID0gdGhpcy5jcmVhdGVJbnRlcnJ1cHRpb25RdWV1ZShjbHVzdGVyLCBzdGFja05hbWUpO1xyXG4gICAgICAgICAgICBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudC5hZGRTdGF0ZW1lbnRzKGludGVycnVwdGlvblF1ZXVlU3RhdGVtZW50KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBOYW1lc3BhY2VcclxuICAgICAgICBjb25zdCBucyA9IHV0aWxzLmNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISwgY2x1c3RlciwgdHJ1ZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGxldCBzYTogYW55O1xyXG4gICAgICAgIGxldCBzYUFubm90YXRpb246IGFueTtcclxuICAgICAgICBpZiAocG9kSWRlbnRpdHkpIHtcclxuICAgICAgICAgICAgc2EgPSB1dGlscy5wb2RJZGVudGl0eUFzc29jaWF0aW9uKFxyXG4gICAgICAgICAgICAgICAgY2x1c3RlcixcclxuICAgICAgICAgICAgICAgIFJFTEVBU0UsXHJcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMubmFtZXNwYWNlISxcclxuICAgICAgICAgICAgICAgIGthcnBlbnRlclBvbGljeURvY3VtZW50XHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgICAgIHNhQW5ub3RhdGlvbiA9IHt9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHNhID0gdXRpbHMuY3JlYXRlU2VydmljZUFjY291bnQoXHJcbiAgICAgICAgICAgICAgICBjbHVzdGVyLFxyXG4gICAgICAgICAgICAgICAgUkVMRUFTRSxcclxuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhLFxyXG4gICAgICAgICAgICAgICAga2FycGVudGVyUG9saWN5RG9jdW1lbnRcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICAgICAgc2FBbm5vdGF0aW9uID0geyBcImVrcy5hbWF6b25hd3MuY29tL3JvbGUtYXJuXCI6IHNhLnJvbGUucm9sZUFybiB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBzYS5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgZ2xvYmFsIGhlbG0gdmFsdWVzIGJhc2VkIG9uIHYxYmV0YTEgbWlncmF0aW9uIGFzIHNob3duIGJlbG93OlxyXG4gICAgICAgIC8vIGh0dHBzOi8va2FycGVudGVyLnNoL3YwLjMyL3VwZ3JhZGluZy92MWJldGExLW1pZ3JhdGlvbi8jaGVsbS12YWx1ZXNcclxuICAgICAgICBsZXQgZ2xvYmFsU2V0dGluZ3MgPSB7IGNsdXN0ZXJOYW1lOiBuYW1lLCBjbHVzdGVyRW5kcG9pbnQ6IGVuZHBvaW50IH07XHJcblxyXG4gICAgICAgIGdsb2JhbFNldHRpbmdzID0gbWVyZ2UoZ2xvYmFsU2V0dGluZ3MsIHsgaW50ZXJydXB0aW9uUXVldWU6IGludGVycnVwdGlvbiA/IHN0YWNrTmFtZSA6IFwiXCIgfSk7XHJcblxyXG4gICAgICAgIHV0aWxzLnNldFBhdGgodmFsdWVzLCBcInNldHRpbmdzXCIsIG1lcmdlKGdsb2JhbFNldHRpbmdzLCB2YWx1ZXM/LnNldHRpbmdzID8/IHt9KSk7XHJcblxyXG4gICAgICAgIC8vIExldCBIZWxtIGNyZWF0ZSB0aGUgc2VydmljZSBhY2NvdW50IGlmIHVzaW5nIHBvZCBpZGVudGl0eVxyXG4gICAgICAgIGNvbnN0IHNhVmFsdWVzID0ge1xyXG4gICAgICAgICAgICBzZXJ2aWNlQWNjb3VudDogeyBjcmVhdGU6IHBvZElkZW50aXR5LCBuYW1lOiBSRUxFQVNFLCBhbm5vdGF0aW9uczogc2FBbm5vdGF0aW9uIH0sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCBzYVZhbHVlcyk7XHJcbiAgICAgICAgLy8gSW5zdGFsbCBIZWxtQ2hhcnQgdXNpbmcgdXNlciBkZWZpbmVkIHZhbHVlIG9yIGRlZmF1bHQgb2YgNSBtaW51dGVzLlxyXG4gICAgICAgIGNvbnN0IGhlbG1DaGFydFRpbWVvdXQgPSB0aGlzLm9wdGlvbnMuaGVsbUNoYXJ0VGltZW91dCB8fCBEdXJhdGlvbi5taW51dGVzKDUpO1xyXG4gICAgICAgIGNvbnN0IGthcnBlbnRlckNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcywgZmFsc2UsIHRydWUsIGhlbG1DaGFydFRpbWVvdXQpO1xyXG5cclxuICAgICAgICBrYXJwZW50ZXJDaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG5cclxuICAgICAgICBpZiAoY2x1c3RlckluZm8ubm9kZUdyb3Vwcykge1xyXG4gICAgICAgICAgICBjbHVzdGVySW5mby5ub2RlR3JvdXBzLmZvckVhY2goKG4pID0+IGthcnBlbnRlckNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShuKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBEZXBsb3kgUHJvdmlzaW9uZXIgKEFscGhhKSBvciBOb2RlUG9vbCAoQmV0YSkgQ1JEIGJhc2VkIG9uIHRoZSBLYXJwZW50ZXIgVmVyc2lvblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHBvb2wgPSB7XHJcbiAgICAgICAgICAgICAgYXBpVmVyc2lvbjogXCJrYXJwZW50ZXIuc2gvdjFcIixcclxuICAgICAgICAgICAgICBraW5kOiBcIk5vZGVQb29sXCIsXHJcbiAgICAgICAgICAgICAgbWV0YWRhdGE6IHtuYW1lOiBcImRlZmF1bHQtbm9kZXBvb2xcIn0sXHJcbiAgICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtsYWJlbHM6IGxhYmVscywgYW5ub3RhdGlvbnM6IGFubm90YXRpb25zfSxcclxuICAgICAgICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgICAgIG5vZGVDbGFzc1JlZjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImRlZmF1bHQtZWMybm9kZWNsYXNzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGdyb3VwOiBcImthcnBlbnRlci5rOHMuYXdzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IFwiRUMyTm9kZUNsYXNzXCJcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHRhaW50czogdGFpbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgIHN0YXJ0dXBUYWludHM6IHN0YXJ0dXBUYWludHMsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzOiB0aGlzLmNvbnZlcnQocmVxdWlyZW1lbnRzKSxcclxuICAgICAgICAgICAgICAgICAgICBleHBpcmVBZnRlcjogdGhpcy5vcHRpb25zLm5vZGVQb29sU3BlYz8uZXhwaXJlQWZ0ZXJcclxuICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBkaXNydXB0aW9uOiBkaXNydXB0aW9uLFxyXG4gICAgICAgICAgICAgICAgbGltaXRzOiBsaW1pdHMsXHJcbiAgICAgICAgICAgICAgICB3ZWlnaHQ6IHdlaWdodCxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgY29uc3QgcG9vbE1hbmlmZXN0ID0gY2x1c3Rlci5hZGRNYW5pZmVzdChcImRlZmF1bHQtcG9vbFwiLCBwb29sKTtcclxuICAgICAgICAgICAgcG9vbE1hbmlmZXN0Lm5vZGUuYWRkRGVwZW5kZW5jeShrYXJwZW50ZXJDaGFydCk7XHJcblxyXG4gICAgICAgICAgICAvLyBEZXBsb3kgQVdTTm9kZVRlbXBsYXRlIChBbHBoYSkgb3IgRUMyTm9kZUNsYXNzIChCZXRhKSBDUkQgYmFzZWQgb24gdGhlIEthcnBlbnRlciBWZXJzaW9uXHJcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGVjMk5vZGU7XHJcblxyXG4gICAgICAgICAgICAgICAgZWMyTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiBcImthcnBlbnRlci5rOHMuYXdzL3YxXCIsXHJcbiAgICAgICAgICAgICAgICAgICAga2luZDogXCJFQzJOb2RlQ2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyBuYW1lOiBcImRlZmF1bHQtZWMybm9kZWNsYXNzXCIgfSxcclxuICAgICAgICAgICAgICAgICAgICBzcGVjOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFtaUZhbWlseTogYW1pRmFtaWx5LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzdWJuZXRTZWxlY3RvclRlcm1zOiBzdWJuZXRTZWxlY3RvclRlcm1zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwU2VsZWN0b3JUZXJtczogc2dTZWxlY3RvclRlcm1zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhbWlTZWxlY3RvclRlcm1zOiBhbWlTZWxlY3RvclRlcm1zID8gYW1pU2VsZWN0b3JUZXJtcyA6IFtdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YTogdXNlckRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3M6IHRhZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhT3B0aW9uczogbWV0YWRhdGFPcHRpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja0RldmljZU1hcHBpbmdzOiBibG9ja0RldmljZU1hcHBpbmdzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxlZE1vbml0b3Jpbmc6IGRldGFpbGVkTW9uaXRvcmluZyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLyBQcm92aWRlIGN1c3RvbSBJbnN0YW5jZSBQcm9maWxlIHRvIHJlcGxhY2Ugcm9sZSBpZiBwcm92aWRlZCwgZWxzZSB1c2UgdGhlIHJvbGUgY3JlYXRlZCB3aXRoIHRoZSBhZGRvblxyXG4gICAgICAgICAgICAgICAgaWYgKGluc3RhbmNlUHJvZikge1xyXG4gICAgICAgICAgICAgICAgICAgIGVjMk5vZGUgPSBtZXJnZShlYzJOb2RlLCB7IHNwZWM6IHsgaW5zdGFuY2VQcm9maWxlOiBpbnN0YW5jZVByb2YgfSB9KTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWMyTm9kZSA9IG1lcmdlKGVjMk5vZGUsIHsgc3BlYzogeyByb2xlOiBrYXJwZW50ZXJOb2RlUm9sZS5yb2xlTmFtZSB9IH0pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vIEluc3RhbmNlIFN0b3JlIFBvbGljeSBhZGRlZCBmb3IgdjAuMzQuMCBhbmQgdXBcclxuICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZVN0b3JlUG9saWN5KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWMyTm9kZSA9IG1lcmdlKGVjMk5vZGUsIHsgc3BlYzogeyBpbnN0YW5jZVN0b3JlUG9saWN5OiBpbnN0YW5jZVN0b3JlUG9saWN5IH0gfSk7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZU1hbmlmZXN0ID0gY2x1c3Rlci5hZGRNYW5pZmVzdChcImRlZmF1bHQtbm9kZS10ZW1wbGF0ZVwiLCBlYzJOb2RlKTtcclxuICAgICAgICAgICAgICAgIG5vZGVNYW5pZmVzdC5ub2RlLmFkZERlcGVuZGVuY3koa2FycGVudGVyQ2hhcnQpO1xyXG4gICAgICAgICAgICAgICAgcG9vbE1hbmlmZXN0Lm5vZGUuYWRkRGVwZW5kZW5jeShub2RlTWFuaWZlc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGthcnBlbnRlckNoYXJ0KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjb252ZXJ0IGEga2V5LXBhaXIgdmFsdWVzICh3aXRoIGFuIG9wZXJhdG9yKVxyXG4gICAgICogb2Ygc3BlYyBjb25maWd1cmF0aW9ucyB0byBhcHByb3ByaWF0ZSBqc29uIGZvcm1hdCBmb3IgYWRkTWFuaWZlc3QgZnVuY3Rpb25cclxuICAgICAqIEBwYXJhbSByZXFzXHJcbiAgICAgKiBAcmV0dXJucyBuZXdSZXFzXHJcbiAgICAgKiAqL1xyXG4gICAgcHJvdGVjdGVkIGNvbnZlcnQocmVxczogeyBrZXk6IHN0cmluZzsgb3BlcmF0b3I6IHN0cmluZzsgdmFsdWVzOiBzdHJpbmdbXSB9W10pOiBhbnlbXSB7XHJcbiAgICAgICAgY29uc3QgbmV3UmVxcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IHJlcSBvZiByZXFzKSB7XHJcbiAgICAgICAgICAgIGNvbnN0IGtleSA9IHJlcVtcImtleVwiXTtcclxuICAgICAgICAgICAgY29uc3Qgb3AgPSByZXFbXCJvcGVyYXRvclwiXTtcclxuICAgICAgICAgICAgY29uc3QgdmFsID0gcmVxW1widmFsdWVzXCJdO1xyXG4gICAgICAgICAgICBjb25zdCByZXF1aXJlbWVudCA9IHsga2V5OiBrZXksIG9wZXJhdG9yOiBvcCwgdmFsdWVzOiB2YWwgfTtcclxuICAgICAgICAgICAgbmV3UmVxcy5wdXNoKHJlcXVpcmVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIG5ld1JlcXM7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24gdG8gc2V0IHVwIHRoZSBLYXJwZW50ZXIgTm9kZSBSb2xlIGFuZCBJbnN0YW5jZSBQcm9maWxlXHJcbiAgICAgKiBPdXRwdXRzIHRvIENsb3VkRm9ybWF0aW9uIGFuZCBtYXAgdGhlIHJvbGUgdG8gdGhlIGF3cy1hdXRoIENvbmZpZ01hcFxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXIgRUtTIENsdXN0ZXJcclxuICAgICAqIEBwYXJhbSBzdGFja05hbWUgTmFtZSBvZiB0aGUgc3RhY2tcclxuICAgICAqIEBwYXJhbSByZWdpb24gUmVnaW9uIG9mIHRoZSBzdGFja1xyXG4gICAgICogQHJldHVybnMgW2thcnBlbnRlck5vZGVSb2xlLCBrYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGVdXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgc2V0VXBOb2RlUm9sZShcclxuICAgICAgICBjbHVzdGVyOiBDbHVzdGVyLFxyXG4gICAgICAgIHN0YWNrTmFtZTogc3RyaW5nLFxyXG4gICAgICAgIHJlZ2lvbjogc3RyaW5nXHJcbiAgICApOiBbaWFtLlJvbGUsIGlhbS5DZm5JbnN0YW5jZVByb2ZpbGVdIHtcclxuICAgICAgICAvLyBTZXQgdXAgTm9kZSBSb2xlXHJcbiAgICAgICAgY29uc3Qga2FycGVudGVyTm9kZVJvbGUgPSBuZXcgaWFtLlJvbGUoY2x1c3RlciwgXCJrYXJwZW50ZXItbm9kZS1yb2xlXCIsIHtcclxuICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoYGVjMi4ke2NsdXN0ZXIuc3RhY2sudXJsU3VmZml4fWApLFxyXG4gICAgICAgICAgICBtYW5hZ2VkUG9saWNpZXM6IFtcclxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFtYXpvbkVLU1dvcmtlck5vZGVQb2xpY3lcIiksXHJcbiAgICAgICAgICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBbWF6b25FS1NfQ05JX1BvbGljeVwiKSxcclxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFtYXpvbkVDMkNvbnRhaW5lclJlZ2lzdHJ5UmVhZE9ubHlcIiksXHJcbiAgICAgICAgICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBbWF6b25TU01NYW5hZ2VkSW5zdGFuY2VDb3JlXCIpLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAvL3JvbGVOYW1lOiBgS2FycGVudGVyTm9kZVJvbGUtJHtuYW1lfWAgLy8gbGV0IHJvbGUgbmFtZSB0byBiZSBnZW5lcmF0ZWQgYXMgdW5pcXVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEF0dGFjaCBpcHY2IHJlbGF0ZWQgcG9saWNpZXMgYmFzZWQgb24gY2x1c3RlciBJUEZhbWlseVxyXG4gICAgICAgIGlmIChjbHVzdGVyLmlwRmFtaWx5ID09PSBJcEZhbWlseS5JUF9WNikge1xyXG4gICAgICAgICAgICBjb25zdCBub2RlSXB2NlBvbGljeSA9IG5ldyBpYW0uUG9saWN5KGNsdXN0ZXIsIFwia2FycGVudGVyLW5vZGUtSXB2Ni1Qb2xpY3lcIiwge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQ6IHV0aWxzLmdldEVLU05vZGVJcHY2UG9saWN5RG9jdW1lbnQoKSxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGthcnBlbnRlck5vZGVSb2xlLmF0dGFjaElubGluZVBvbGljeShub2RlSXB2NlBvbGljeSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBTZXQgdXAgSW5zdGFuY2UgUHJvZmlsZVxyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlUHJvZmlsZU5hbWUgPSBtZDUuTWQ1Lmhhc2hTdHIoc3RhY2tOYW1lICsgcmVnaW9uKTtcclxuICAgICAgICBjb25zdCBrYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGUgPSBuZXcgaWFtLkNmbkluc3RhbmNlUHJvZmlsZShcclxuICAgICAgICAgICAgY2x1c3RlcixcclxuICAgICAgICAgICAgXCJrYXJwZW50ZXItaW5zdGFuY2UtcHJvZmlsZVwiLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICByb2xlczogW2thcnBlbnRlck5vZGVSb2xlLnJvbGVOYW1lXSxcclxuICAgICAgICAgICAgICAgIGluc3RhbmNlUHJvZmlsZU5hbWU6IGBLYXJwZW50ZXJOb2RlSW5zdGFuY2VQcm9maWxlLSR7aW5zdGFuY2VQcm9maWxlTmFtZX1gLFxyXG4gICAgICAgICAgICAgICAgcGF0aDogXCIvXCIsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIGthcnBlbnRlckluc3RhbmNlUHJvZmlsZS5ub2RlLmFkZERlcGVuZGVuY3koa2FycGVudGVyTm9kZVJvbGUpO1xyXG5cclxuICAgICAgICBjb25zdCBjbHVzdGVySWQgPSBOYW1lcy51bmlxdWVJZChjbHVzdGVyKTtcclxuXHJcbiAgICAgICAgLy9DZm4gb3V0cHV0IGZvciBOb2RlIFJvbGUgaW4gY2FzZSBvZiBuZWVkaW5nIHRvIGFkZCBhZGRpdGlvbmFsIHBvbGljaWVzXHJcbiAgICAgICAgbmV3IENmbk91dHB1dChjbHVzdGVyLnN0YWNrLCBcIkthcnBlbnRlciBJbnN0YW5jZSBOb2RlIFJvbGVcIiwge1xyXG4gICAgICAgICAgICB2YWx1ZToga2FycGVudGVyTm9kZVJvbGUucm9sZU5hbWUsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkthcnBlbnRlciBhZGQtb24gTm9kZSBSb2xlIG5hbWVcIixcclxuICAgICAgICAgICAgZXhwb3J0TmFtZTogY2x1c3RlcklkICsgXCJLYXJwZW50ZXJOb2RlUm9sZU5hbWVcIixcclxuICAgICAgICB9KTtcclxuICAgICAgICAvL0NmbiBvdXRwdXQgZm9yIEluc3RhbmNlIFByb2ZpbGUgZm9yIGNyZWF0aW5nIGFkZGl0aW9uYWwgcHJvdmlzaW9uZXJzXHJcbiAgICAgICAgbmV3IENmbk91dHB1dChjbHVzdGVyLnN0YWNrLCBcIkthcnBlbnRlciBJbnN0YW5jZSBQcm9maWxlIG5hbWVcIiwge1xyXG4gICAgICAgICAgICB2YWx1ZToga2FycGVudGVySW5zdGFuY2VQcm9maWxlID8ga2FycGVudGVySW5zdGFuY2VQcm9maWxlLmluc3RhbmNlUHJvZmlsZU5hbWUhIDogXCJub25lXCIsXHJcbiAgICAgICAgICAgIGRlc2NyaXB0aW9uOiBcIkthcnBlbnRlciBhZGQtb24gSW5zdGFuY2UgUHJvZmlsZSBuYW1lXCIsXHJcbiAgICAgICAgICAgIGV4cG9ydE5hbWU6IGNsdXN0ZXJJZCArIFwiS2FycGVudGVySW5zdGFuY2VQcm9maWxlTmFtZVwiLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBNYXAgTm9kZSBSb2xlIHRvIGF3cy1hdXRoXHJcbiAgICAgICAgY2x1c3Rlci5hd3NBdXRoLmFkZFJvbGVNYXBwaW5nKGthcnBlbnRlck5vZGVSb2xlLCB7XHJcbiAgICAgICAgICAgIGdyb3VwczogW1wic3lzdGVtOmJvb3RzdHJhcHBlcnNcIiwgXCJzeXN0ZW06bm9kZXNcIl0sXHJcbiAgICAgICAgICAgIHVzZXJuYW1lOiBcInN5c3RlbTpub2RlOnt7RUMyUHJpdmF0ZUROU05hbWV9fVwiLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gW2thcnBlbnRlck5vZGVSb2xlLCBrYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGVdO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgY3JlYXRlSW50ZXJydXB0aW9uUXVldWUoY2x1c3RlcjogQ2x1c3Rlciwgc3RhY2tOYW1lOiBzdHJpbmcpOiBpYW0uUG9saWN5U3RhdGVtZW50IHtcclxuICAgICAgICAvLyBDcmVhdGUgSW50ZXJydXB0aW9uIFF1ZXVlXHJcbiAgICAgICAgY29uc3QgcXVldWUgPSBuZXcgc3FzLlF1ZXVlKGNsdXN0ZXIuc3RhY2ssIFwia2FycGVudGVyLXF1ZXVlXCIsIHtcclxuICAgICAgICAgICAgcXVldWVOYW1lOiBzdGFja05hbWUsXHJcbiAgICAgICAgICAgIHJldGVudGlvblBlcmlvZDogRHVyYXRpb24uc2Vjb25kcygzMDApLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBxdWV1ZS5hZGRUb1Jlc291cmNlUG9saWN5KFxyXG4gICAgICAgICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICAgICAgICBzaWQ6IFwiRUMySW50ZXJydXB0aW9uUG9saWN5XCIsXHJcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgICAgICBwcmluY2lwYWxzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKFwic3FzLmFtYXpvbmF3cy5jb21cIiksXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKFwiZXZlbnRzLmFtYXpvbmF3cy5jb21cIiksXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uczogW1wic3FzOlNlbmRNZXNzYWdlXCJdLFxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYCR7cXVldWUucXVldWVBcm59YF0sXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIEludGVycnVwdGlvbiBSdWxlc1xyXG4gICAgICAgIG5ldyBSdWxlKGNsdXN0ZXIuc3RhY2ssIFwic2NoZWR1bGUtY2hhbmdlLXJ1bGVcIiwge1xyXG4gICAgICAgICAgICBldmVudFBhdHRlcm46IHsgc291cmNlOiBbXCJhd3MuaGVhbHRoXCJdLCBkZXRhaWxUeXBlOiBbXCJBV1MgSGVhbHRoIEV2ZW50XCJdIH0sXHJcbiAgICAgICAgfSkuYWRkVGFyZ2V0KG5ldyBTcXNRdWV1ZShxdWV1ZSkpO1xyXG5cclxuICAgICAgICBuZXcgUnVsZShjbHVzdGVyLnN0YWNrLCBcInNwb3QtaW50ZXJydXB0aW9uLXJ1bGVcIiwge1xyXG4gICAgICAgICAgICBldmVudFBhdHRlcm46IHsgc291cmNlOiBbXCJhd3MuZWMyXCJdLCBkZXRhaWxUeXBlOiBbXCJFQzIgU3BvdCBJbnN0YW5jZSBJbnRlcnJ1cHRpb24gV2FybmluZ1wiXSB9LFxyXG4gICAgICAgIH0pLmFkZFRhcmdldChuZXcgU3FzUXVldWUocXVldWUpKTtcclxuXHJcbiAgICAgICAgbmV3IFJ1bGUoY2x1c3Rlci5zdGFjaywgXCJyZWJhbGFuY2UtcnVsZVwiLCB7XHJcbiAgICAgICAgICAgIGV2ZW50UGF0dGVybjogeyBzb3VyY2U6IFtcImF3cy5lYzJcIl0sIGRldGFpbFR5cGU6IFtcIkVDMiBJbnN0YW5jZSBSZWJhbGFuY2UgUmVjb21tZW5kYXRpb25cIl0gfSxcclxuICAgICAgICB9KS5hZGRUYXJnZXQobmV3IFNxc1F1ZXVlKHF1ZXVlKSk7XHJcblxyXG4gICAgICAgIG5ldyBSdWxlKGNsdXN0ZXIuc3RhY2ssIFwiaW5zdC1zdGF0ZS1jaGFuZ2UtcnVsZVwiLCB7XHJcbiAgICAgICAgICAgIGV2ZW50UGF0dGVybjogeyBzb3VyY2U6IFtcImF3cy5lYzJcIl0sIGRldGFpbFR5cGU6IFtcIkMyIEluc3RhbmNlIFN0YXRlLWNoYW5nZSBOb3RpZmljYXRpb25cIl0gfSxcclxuICAgICAgICB9KS5hZGRUYXJnZXQobmV3IFNxc1F1ZXVlKHF1ZXVlKSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBhbmQgcmV0dXJuIHRoZSBpbnRlcnJ1cHRpb24gcXVldWUgcG9saWN5IHN0YXRlbWVudFxyXG4gICAgICAgIHJldHVybiBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgXCJzcXM6RGVsZXRlTWVzc2FnZVwiLFxyXG4gICAgICAgICAgICAgICAgXCJzcXM6R2V0UXVldWVVcmxcIixcclxuICAgICAgICAgICAgICAgIFwic3FzOkdldFF1ZXVlQXR0cmlidXRlc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJzcXM6UmVjZWl2ZU1lc3NhZ2VcIixcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgcmVzb3VyY2VzOiBbYCR7cXVldWUucXVldWVBcm59YF0sXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19