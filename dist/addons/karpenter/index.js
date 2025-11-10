"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarpenterAddOn = void 0;
const assert = require("assert");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const iam = require("aws-cdk-lib/aws-iam");
const sqs = require("aws-cdk-lib/aws-sqs");
const semver = require("semver");
const ts_deepmerge_1 = require("ts-deepmerge");
const md5 = require("ts-md5");
const utils = require("../../utils");
const helm_addon_1 = require("../helm-addon");
const iam_1 = require("./iam");
const types_1 = require("./types");
__exportStar(require("./types"), exports);
__exportStar(require("./karpenter-v1"), exports);
class versionMap {
    static versionMap = new Map([
        [aws_eks_1.KubernetesVersion.V1_33.version, '1.5.0'],
        [aws_eks_1.KubernetesVersion.V1_32.version, '1.2.0'],
        [aws_eks_1.KubernetesVersion.V1_31.version, '0.37.5'],
        [aws_eks_1.KubernetesVersion.V1_30.version, '0.37.5'],
        [aws_eks_1.KubernetesVersion.V1_29.version, '0.34.0'],
        [aws_eks_1.KubernetesVersion.V1_28.version, '0.31.0'],
        [aws_eks_1.KubernetesVersion.V1_27.version, '0.28.0'],
        [aws_eks_1.KubernetesVersion.V1_26.version, '0.28.0'],
        [aws_eks_1.KubernetesVersion.V1_25.version, '0.25.0'],
        [aws_eks_1.KubernetesVersion.V1_24.version, '0.21.0'],
        [aws_eks_1.KubernetesVersion.V1_23.version, '0.21.0'],
    ]);
    static has(version) {
        return this.versionMap.has(version.version);
    }
    static get(version) {
        return this.versionMap.get(version.version);
    }
}
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: types_1.KARPENTER,
    namespace: "kube-system",
    version: '1.2.1',
    chart: types_1.KARPENTER,
    release: types_1.KARPENTER,
    repository: 'oci://public.ecr.aws/karpenter/karpenter',
};
/**
 * Implementation of the Karpenter add-on.
 * @deprecated use KarpenterV1AddOn moving forward
 */
let KarpenterAddOn = class KarpenterAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        assert(clusterInfo.cluster instanceof aws_eks_1.Cluster, "KarpenterAddOn cannot be used with imported clusters as it requires changes to the cluster authentication.");
        const cluster = clusterInfo.cluster;
        const endpoint = cluster.clusterEndpoint;
        const name = cluster.clusterName;
        const partition = cluster.stack.partition;
        const stackName = cluster.stack.stackName;
        const region = cluster.stack.region;
        let values = this.options.values ?? {};
        const version = this.options.version;
        const interruption = this.options.interruptionHandling || false;
        const installCRDs = this.options.installCRDs || false;
        const podIdentity = this.options.podIdentity || false;
        // NodePool variables
        const labels = this.options.nodePoolSpec?.labels || {};
        const annotations = this.options.nodePoolSpec?.annotations || {};
        const taints = this.options.nodePoolSpec?.taints || [];
        const startupTaints = this.options.nodePoolSpec?.startupTaints || [];
        const requirements = this.options.nodePoolSpec?.requirements || [];
        const consol = this.options.nodePoolSpec?.consolidation || null;
        const ttlSecondsAfterEmpty = this.options.nodePoolSpec?.ttlSecondsAfterEmpty || null;
        const ttlSecondsUntilExpired = this.options.nodePoolSpec?.ttlSecondsUntilExpired || null;
        const disruption = this.options.nodePoolSpec?.disruption || null;
        const limits = this.options.nodePoolSpec?.limits || null;
        const weight = this.options.nodePoolSpec?.weight || null;
        // NodeClass variables
        const subnetSelector = this.options.ec2NodeClassSpec?.subnetSelector;
        const sgSelector = this.options.ec2NodeClassSpec?.securityGroupSelector;
        const subnetSelectorTerms = this.options.ec2NodeClassSpec?.subnetSelectorTerms;
        const sgSelectorTerms = this.options.ec2NodeClassSpec?.securityGroupSelectorTerms;
        const amiFamily = this.options.ec2NodeClassSpec?.amiFamily;
        const amiSelector = this.options.ec2NodeClassSpec?.amiSelector || {};
        const amiSelectorTerms = this.options.ec2NodeClassSpec?.amiSelectorTerms;
        const instanceStorePolicy = this.options.ec2NodeClassSpec?.instanceStorePolicy || undefined;
        const userData = this.options.ec2NodeClassSpec?.userData || "";
        const instanceProf = this.options.ec2NodeClassSpec?.instanceProfile;
        const tags = this.options.ec2NodeClassSpec?.tags || {};
        const metadataOptions = this.options.ec2NodeClassSpec?.metadataOptions || {
            httpEndpoint: "enabled",
            httpProtocolIPv6: "disabled",
            httpPutResponseHopLimit: 2,
            httpTokens: "required"
        };
        if (cluster.ipFamily == aws_eks_1.IpFamily.IP_V6) {
            metadataOptions.httpProtocolIPv6 = "enabled";
        }
        const blockDeviceMappings = this.options.ec2NodeClassSpec?.blockDeviceMappings || [];
        const detailedMonitoring = this.options.ec2NodeClassSpec?.detailedMonitoring || false;
        // Check Kubernetes and Karpenter version compatibility for warning
        this.isCompatible(version, clusterInfo.version);
        // Version feature checks for errors
        this.versionFeatureChecksForError(clusterInfo, version, disruption, consol, ttlSecondsAfterEmpty, ttlSecondsUntilExpired, this.options.ec2NodeClassSpec, amiFamily);
        // Set up the node role and instance profile
        const [karpenterNodeRole, karpenterInstanceProfile] = this.setUpNodeRole(cluster, stackName, region);
        // Create the controller policy
        let karpenterPolicyDocument;
        if (semver.gte(version, "v0.32.0")) {
            karpenterPolicyDocument = iam.PolicyDocument.fromJson((0, iam_1.KarpenterControllerPolicyBeta)(cluster, partition, region));
        }
        else {
            karpenterPolicyDocument = iam.PolicyDocument.fromJson(iam_1.KarpenterControllerPolicy);
        }
        karpenterPolicyDocument.addStatements(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                "iam:PassRole",
            ],
            resources: [`${karpenterNodeRole.roleArn}`]
        }));
        // Support for Native spot interruption
        if (interruption) {
            // Create Interruption Queue
            const queue = new sqs.Queue(cluster.stack, 'karpenter-queue', {
                queueName: stackName,
                retentionPeriod: aws_cdk_lib_1.Duration.seconds(300),
            });
            queue.addToResourcePolicy(new iam.PolicyStatement({
                sid: 'EC2InterruptionPolicy',
                effect: iam.Effect.ALLOW,
                principals: [
                    new iam.ServicePrincipal('sqs.amazonaws.com'),
                    new iam.ServicePrincipal('events.amazonaws.com'),
                ],
                actions: [
                    "sqs:SendMessage"
                ],
                resources: [`${queue.queueArn}`]
            }));
            // Add Interruption Rules
            new aws_events_1.Rule(cluster.stack, 'schedule-change-rule', {
                eventPattern: {
                    source: ["aws.health"],
                    detailType: ['AWS Health Event']
                },
            }).addTarget(new aws_events_targets_1.SqsQueue(queue));
            new aws_events_1.Rule(cluster.stack, 'spot-interruption-rule', {
                eventPattern: {
                    source: ["aws.ec2"],
                    detailType: ['EC2 Spot Instance Interruption Warning']
                },
            }).addTarget(new aws_events_targets_1.SqsQueue(queue));
            new aws_events_1.Rule(cluster.stack, 'rebalance-rule', {
                eventPattern: {
                    source: ["aws.ec2"],
                    detailType: ['EC2 Instance Rebalance Recommendation']
                },
            }).addTarget(new aws_events_targets_1.SqsQueue(queue));
            new aws_events_1.Rule(cluster.stack, 'inst-state-change-rule', {
                eventPattern: {
                    source: ["aws.ec2"],
                    detailType: ['C2 Instance State-change Notification']
                },
            }).addTarget(new aws_events_targets_1.SqsQueue(queue));
            // Add policy to the node role to allow access to the Interruption Queue
            const interruptionQueueStatement = new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                    "sqs:DeleteMessage",
                    "sqs:GetQueueUrl",
                    "sqs:GetQueueAttributes",
                    "sqs:ReceiveMessage"
                ],
                resources: [`${queue.queueArn}`]
            });
            karpenterPolicyDocument.addStatements(interruptionQueueStatement);
        }
        // Create Namespace
        const ns = utils.createNamespace(this.options.namespace, cluster, true, true);
        let sa;
        let saAnnotation;
        if (podIdentity && semver.gte(`${clusterInfo.version.version}.0`, '1.24.0') && semver.gte(version, "v0.35.0")) {
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
        let globalSettings = {
            clusterName: name,
            clusterEndpoint: endpoint
        };
        if (semver.lt(version, '0.32.0')) {
            globalSettings = (0, ts_deepmerge_1.merge)(globalSettings, {
                defaultInstanceProfile: karpenterInstanceProfile.instanceProfileName,
                interruptionQueueName: interruption ? stackName : ""
            });
        }
        else {
            globalSettings = (0, ts_deepmerge_1.merge)(globalSettings, {
                interruptionQueue: interruption ? stackName : ""
            });
        }
        if (semver.lt(version, '0.32.0')) {
            utils.setPath(values, "settings.aws", (0, ts_deepmerge_1.merge)(globalSettings, values?.settings?.aws ?? {}));
        }
        else {
            utils.setPath(values, "settings", (0, ts_deepmerge_1.merge)(globalSettings, values?.settings ?? {}));
        }
        // Let Helm create the service account if using pod identity
        const saValues = {
            serviceAccount: {
                create: podIdentity,
                name: types_1.RELEASE,
                annotations: saAnnotation,
            }
        };
        values = (0, ts_deepmerge_1.merge)(values, saValues);
        // Install HelmChart using user defined value or default of 5 minutes.
        const helmChartTimeout = this.options.helmChartTimeout || aws_cdk_lib_1.Duration.minutes(5);
        const karpenterChart = this.addHelmChart(clusterInfo, values, false, true, helmChartTimeout);
        karpenterChart.node.addDependency(sa);
        if (clusterInfo.nodeGroups) {
            clusterInfo.nodeGroups.forEach(n => karpenterChart.node.addDependency(n));
        }
        if (semver.gte(version, "0.32.0") && installCRDs) {
            let _version = version;
            if (!version.startsWith('v')) {
                _version = `v${version}`;
            }
            const CRDs = [
                ["karpentersh-nodepool-beta1-crd", `https://raw.githubusercontent.com/aws/karpenter/${_version}/pkg/apis/crds/karpenter.sh_nodepools.yaml`],
                ["karpentersh-nodeclaims-beta1-crd", `https://raw.githubusercontent.com/aws/karpenter/${_version}/pkg/apis/crds/karpenter.sh_nodeclaims.yaml`],
                ["karpenterk8s-ec2nodeclasses-beta1-crd", `https://raw.githubusercontent.com/aws/karpenter/${_version}/pkg/apis/crds/karpenter.k8s.aws_ec2nodeclasses.yaml`],
            ];
            // loop over the CRD's and load the yaml and deploy the manifest
            for (const [crdName, crdUrl] of CRDs) {
                const crdManifest = utils.loadExternalYaml(crdUrl);
                const manifest = cluster.addManifest(crdName, crdManifest);
                // We want these installed before the karpenterChart, or helm will timeout waiting for it to stabilize
                karpenterChart.node.addDependency(manifest);
            }
        }
        // Deploy Provisioner (Alpha) or NodePool (Beta) CRD based on the Karpenter Version
        if (this.options.nodePoolSpec) {
            let pool;
            if (semver.gte(version, '0.32.0')) {
                pool = {
                    apiVersion: 'karpenter.sh/v1beta1',
                    kind: 'NodePool',
                    metadata: { name: 'default-nodepool' },
                    spec: {
                        template: {
                            metadata: {
                                labels: labels,
                                annotations: annotations,
                            },
                            spec: {
                                nodeClassRef: {
                                    name: "default-ec2nodeclass"
                                },
                                taints: taints,
                                startupTaints: startupTaints,
                                requirements: this.convert(requirements),
                            }
                        },
                        disruption: disruption,
                        limits: limits,
                        weight: weight,
                    },
                };
            }
            else {
                pool = {
                    apiVersion: 'karpenter.sh/v1alpha5',
                    kind: 'Provisioner',
                    metadata: { name: 'default-provisioner' },
                    spec: {
                        providerRef: {
                            name: "default-nodetemplate"
                        },
                        taints: taints,
                        startupTaints: startupTaints,
                        labels: labels,
                        annotations: annotations,
                        requirements: this.convert(requirements),
                        limits: {
                            resources: limits,
                        },
                        consolidation: consol,
                        ttlSecondsUntilExpired: ttlSecondsUntilExpired,
                        ttlSecondsAfterEmpty: ttlSecondsAfterEmpty,
                        weight: weight,
                    },
                };
            }
            const poolManifest = cluster.addManifest('default-pool', pool);
            poolManifest.node.addDependency(karpenterChart);
            // Deploy AWSNodeTemplate (Alpha) or EC2NodeClass (Beta) CRD based on the Karpenter Version
            if (this.options.ec2NodeClassSpec) {
                let ec2Node;
                if (semver.gte(version, '0.32.0')) {
                    ec2Node = {
                        apiVersion: "karpenter.k8s.aws/v1beta1",
                        kind: "EC2NodeClass",
                        metadata: {
                            name: "default-ec2nodeclass"
                        },
                        spec: {
                            amiFamily: amiFamily,
                            subnetSelectorTerms: subnetSelectorTerms,
                            securityGroupSelectorTerms: sgSelectorTerms,
                            amiSelectorTerms: amiSelectorTerms,
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
                    if (semver.gte(version, '0.34.0') && instanceStorePolicy) {
                        ec2Node = (0, ts_deepmerge_1.merge)(ec2Node, { spec: { instanceStorePolicy: instanceStorePolicy } });
                    }
                }
                else {
                    ec2Node = {
                        apiVersion: "karpenter.k8s.aws/v1alpha1",
                        kind: "AWSNodeTemplate",
                        metadata: {
                            name: "default-nodetemplate"
                        },
                        spec: {
                            subnetSelector: subnetSelector,
                            securityGroupSelector: sgSelector,
                            instanceProfile: instanceProf ? instanceProf : null,
                            amiFamily: amiFamily ? amiFamily : "AL2",
                            amiSelector: amiSelector,
                            tags: tags,
                            metadataOptions: metadataOptions,
                            blockDeviceMappings: blockDeviceMappings,
                            userData: userData,
                        },
                    };
                    // Add EC2 Detailed Monitoring for v0.22.0 and up
                    if (semver.gte(version, '0.22.0')) {
                        ec2Node = (0, ts_deepmerge_1.merge)(ec2Node, { spec: { detailedMonitoring: detailedMonitoring } });
                    }
                }
                const nodeManifest = cluster.addManifest('default-node-template', ec2Node);
                nodeManifest.node.addDependency(poolManifest);
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
            const key = req['key'];
            const op = req['operator'];
            const val = req['values'];
            const requirement = {
                "key": key,
                "operator": op,
                "values": val
            };
            newReqs.push(requirement);
        }
        return newReqs;
    }
    /**
     * Helper function to ensure right features are added as part of the configuration
     * for the right version of the add-on
     * @param clusterInfo
     * @param version version of the add-on
     * @param disruption disruption feature available with the Beta CRDs
     * @param consolidation consolidation setting available with the Alpha CRDs
     * @param ttlSecondsAfterEmpty ttlSecondsAfterEmpty setting
     * @param ttlSecondsUntilExpired ttlSecondsUntilExpired setting
     * @param ec2NodeClassSpec Node Class Spec
     * @param amiFamily AMI Family
     * @returns
     */
    versionFeatureChecksForError(clusterInfo, version, disruption, consolidation, ttlSecondsAfterEmpty, ttlSecondsUntilExpired, ec2NodeClassSpec, amiFamily) {
        // EC2 Detailed Monitoring is only available in versions 0.23.0 and above
        if (semver.lt(version, '0.23.0') && ec2NodeClassSpec) {
            assert(ec2NodeClassSpec["detailedMonitoring"] === undefined, "Detailed Monitoring is not available in this version of Karpenter. Please upgrade to at least 0.23.0.");
        }
        // Disruption budget should not exist for versions below 0.34.x
        if (semver.lt(version, '0.34.0')) {
            if (disruption) {
                assert(!disruption["budgets"], "You cannot set disruption budgets for this version of Karpenter. Please upgrade to 0.34.0 or higher.");
            }
        }
        // version check errors for v0.32.0 and up (beta CRDs)
        if (semver.gte(version, '0.32.0')) {
            // Consolidation features don't exist in beta CRDs
            assert(!consolidation && !ttlSecondsAfterEmpty && !ttlSecondsUntilExpired, 'Consolidation features are only available for previous versions of Karpenter.');
            // consolidateAfter cannot be set if policy is set to WhenUnderutilized
            if (disruption && disruption["consolidationPolicy"] == "WhenUnderutilized") {
                assert(!disruption["consolidateAfter"], 'You cannot set consolidateAfter value if the consolidation policy is set to Underutilized.');
            }
            // AMI Family, Security Group and Subnet terms must be provided, given EC2 NodeSpec
            if (ec2NodeClassSpec) {
                assert(amiFamily !== undefined, "Please provide the AMI Family for your EC2NodeClass.");
                assert(ec2NodeClassSpec["securityGroupSelectorTerms"] !== undefined, "Please provide SecurityGroupTerm for your EC2NodeClass.");
                assert(ec2NodeClassSpec["subnetSelectorTerms"] !== undefined, "Please provide subnetGroupTerm for your EC2NodeClass.");
            }
        }
        // version check errors for v0.31.x and down (alpha CRDs)
        // Includes checks for consolidation and disruption features
        if (semver.lt(version, '0.32.0')) {
            if (consolidation) {
                assert(!(consolidation.enabled && ttlSecondsAfterEmpty), 'Consolidation and ttlSecondsAfterEmpty must be mutually exclusive.');
            }
            assert(!disruption, 'Disruption configuration is only supported on versions v0.32.0 and later.');
            //Security Group and Subnet terms must be provided, given EC2 NodeSpec
            if (ec2NodeClassSpec) {
                assert(ec2NodeClassSpec["securityGroupSelector"] !== undefined, "Please provide SecurityGroupTerm for your AWSNodeTemplate.");
                assert(ec2NodeClassSpec["subnetSelector"] !== undefined, "Please provide subnetGroupTerm for your AWSNodeTemplate.");
            }
        }
        // We should block Node Termination Handler usage once Karpenter is leveraged
        assert(!clusterInfo.getProvisionedAddOn('AwsNodeTerminationHandlerAddOn'), 'Karpenter supports native interruption handling, so Node Termination Handler will not be necessary.');
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
        const karpenterNodeRole = new iam.Role(cluster, 'karpenter-node-role', {
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
            const nodeIpv6Policy = new iam.Policy(cluster, 'karpenter-node-Ipv6-Policy', {
                document: utils.getEKSNodeIpv6PolicyDocument()
            });
            karpenterNodeRole.attachInlinePolicy(nodeIpv6Policy);
        }
        // Set up Instance Profile
        const instanceProfileName = md5.Md5.hashStr(stackName + region);
        const karpenterInstanceProfile = new iam.CfnInstanceProfile(cluster, 'karpenter-instance-profile', {
            roles: [karpenterNodeRole.roleName],
            instanceProfileName: `KarpenterNodeInstanceProfile-${instanceProfileName}`,
            path: '/'
        });
        karpenterInstanceProfile.node.addDependency(karpenterNodeRole);
        const clusterId = aws_cdk_lib_1.Names.uniqueId(cluster);
        //Cfn output for Node Role in case of needing to add additional policies
        new aws_cdk_lib_1.CfnOutput(cluster.stack, 'Karpenter Instance Node Role', {
            value: karpenterNodeRole.roleName,
            description: "Karpenter add-on Node Role name",
            exportName: clusterId + "KarpenterNodeRoleName",
        });
        //Cfn output for Instance Profile for creating additional provisioners
        new aws_cdk_lib_1.CfnOutput(cluster.stack, 'Karpenter Instance Profile name', {
            value: karpenterInstanceProfile ? karpenterInstanceProfile.instanceProfileName : "none",
            description: "Karpenter add-on Instance Profile name",
            exportName: clusterId + "KarpenterInstanceProfileName",
        });
        // Map Node Role to aws-auth
        cluster.awsAuth.addRoleMapping(karpenterNodeRole, {
            groups: ['system:bootstrappers', 'system:nodes'],
            username: 'system:node:{{EC2PrivateDNSName}}'
        });
        return [karpenterNodeRole, karpenterInstanceProfile];
    }
    /**
     * Helper function to check whether:
     * 1. Supported Karpenter versions are implemented, and
     * 2. Supported Kubernetes versions are deployed on the cluster to use Karpenter
     * It will reject the addon if the cluster uses deprecated Kubernetes version, and
     * Warn users about issues if incompatible Karpenter version is used for a particular cluster
     * given its Kubernetes version
     * @param karpenterVersion Karpenter version to be deployed
     * @param kubeVersion Cluster's Kubernetes version
     */
    isCompatible(karpenterVersion, kubeVersion) {
        assert(versionMap.has(kubeVersion), 'Please upgrade your EKS Kubernetes version to start using Karpenter.');
        assert(semver.gte(karpenterVersion, '0.21.0'), 'Please use Karpenter version 0.21.0 or above.');
        const compatibleVersion = versionMap.get(kubeVersion);
        if (semver.gt(compatibleVersion, karpenterVersion)) {
            console.warn(`Please use minimum Karpenter version for this Kubernetes Version: ${compatibleVersion}, otherwise you will run into compatibility issues.`);
        }
    }
};
exports.KarpenterAddOn = KarpenterAddOn;
__decorate([
    utils.conflictsWith('ClusterAutoScalerAddOn'),
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.ALREADY_INSTALLED)
], KarpenterAddOn.prototype, "deploy", null);
exports.KarpenterAddOn = KarpenterAddOn = __decorate([
    utils.supportsALL
], KarpenterAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2thcnBlbnRlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlDQUFpQztBQUNqQyw2Q0FBeUQ7QUFDekQsaURBQTJFO0FBQzNFLHVEQUE4QztBQUM5Qyx1RUFBMEQ7QUFDMUQsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUUzQyxpQ0FBaUM7QUFDakMsK0NBQXFDO0FBQ3JDLDhCQUE4QjtBQUU5QixxQ0FBcUM7QUFFckMsOENBQThFO0FBQzlFLCtCQUFpRjtBQUNqRixtQ0FBNkU7QUFFN0UsMENBQXdCO0FBQ3hCLGlEQUErQjtBQUUvQixNQUFNLFVBQVU7SUFDSixNQUFNLENBQVUsVUFBVSxHQUF3QixJQUFJLEdBQUcsQ0FBQztRQUM5RCxDQUFDLDJCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDO1FBQzFDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUM7UUFDMUMsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUMzQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDO1FBQzNDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUM7UUFDM0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUMzQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssQ0FBQyxPQUFPLEVBQUUsUUFBUSxDQUFDO1FBQzNDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxDQUFDLE9BQU8sRUFBRSxRQUFRLENBQUM7UUFDM0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLENBQUMsT0FBTyxFQUFFLFFBQVEsQ0FBQztRQUMzQyxDQUFDLDJC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O1NBQ2hELENBQUMsQ0FBQztRQUVILE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSx3QkFBd0IsQ0FBQyxDQUFDO0lBQ3pELENBQUM7SUFFRDs7Ozs7Ozs7O09BU0c7SUFDSyxZQUFZLENBQUMsZ0JBQXdCLEVBQUUsV0FBOEI7UUFDekUsTUFBTSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQUUsc0VBQXNFLENBQUMsQ0FBQztRQUM1RyxNQUFNLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxnQkFBZ0IsRUFBRSxRQUFRLENBQUMsRUFBRSwrQ0FBK0MsQ0FBQyxDQUFDO1FBQ2hHLE1BQU0saUJBQWlCLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQyxXQUFXLENBQVcsQ0FBQztRQUNoRSxJQUFJLE1BQU0sQ0FBQyxFQUFFLENBQUMsaUJBQWlCLEVBQUUsZ0JBQWdCLENBQUMsRUFBRSxDQUFDO1lBQ2pELE9BQU8sQ0FBQyxJQUFJLENBQUMscUVBQXFFLGlCQUFpQixxREFBcUQsQ0FBQyxDQUFDO1FBQzlKLENBQUM7SUFDTCxDQUFDO0NBQ0osQ0FBQTtBQTVnQlksd0NBQWM7QUFXdkI7SUFGQyxLQUFLLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDO0lBQzdDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsaUJBQWlCLENBQUM7NENBeVZ6RTt5QkFuV1EsY0FBYztJQUQxQixLQUFLLENBQUMsV0FBVztHQUNMLGNBQWMsQ0E0Z0IxQiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XHJcbmltcG9ydCB7IENmbk91dHB1dCwgRHVyYXRpb24sIE5hbWVzIH0gZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgeyBDbHVzdGVyLCBLdWJlcm5ldGVzVmVyc2lvbiwgSXBGYW1pbHkgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWtzJztcclxuaW1wb3J0IHsgUnVsZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMnO1xyXG5pbXBvcnQgeyBTcXNRdWV1ZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1ldmVudHMtdGFyZ2V0cyc7XHJcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgc3FzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tICd0cy1kZWVwbWVyZ2UnO1xyXG5pbXBvcnQgKiBhcyBtZDUgZnJvbSAndHMtbWQ1JztcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi8uLi91dGlscyc7XHJcblxyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblByb3BzLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tICcuLi9oZWxtLWFkZG9uJztcclxuaW1wb3J0IHsgS2FycGVudGVyQ29udHJvbGxlclBvbGljeSwgS2FycGVudGVyQ29udHJvbGxlclBvbGljeUJldGEgfSBmcm9tICcuL2lhbSc7XHJcbmltcG9ydCB7IEVjMk5vZGVDbGFzc1NwZWMsIEtBUlBFTlRFUiwgTm9kZVBvb2xTcGVjLCBSRUxFQVNFIH0gZnJvbSBcIi4vdHlwZXNcIjtcclxuXHJcbmV4cG9ydCAqIGZyb20gXCIuL3R5cGVzXCI7XHJcbmV4cG9ydCAqIGZyb20gJy4va2FycGVudGVyLXYxJztcclxuXHJcbmNsYXNzIHZlcnNpb25NYXAge1xyXG4gICAgcHJpdmF0ZSBzdGF0aWMgcmVhZG9ubHkgdmVyc2lvbk1hcDogTWFwPHN0cmluZywgc3RyaW5nPiA9IG5ldyBNYXAoW1xyXG4gICAgICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMy52ZXJzaW9uLCAnMS41LjAnXSxcclxuICAgICAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzIudmVyc2lvbiwgJzEuMi4wJ10sXHJcbiAgICAgICAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzMxLnZlcnNpb24sICcwLjM3LjUnXSxcclxuICAgICAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzAudmVyc2lvbiwgJzAuMzcuNSddLFxyXG4gICAgICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yOS52ZXJzaW9uLCAnMC4zNC4wJ10sXHJcbiAgICAgICAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI4LnZlcnNpb24sICcwLjMxLjAnXSxcclxuICAgICAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjcudmVyc2lvbiwgJzAuMjguMCddLFxyXG4gICAgICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yNi52ZXJzaW9uLCAnMC4yOC4wJ10sXHJcbiAgICAgICAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI1LnZlcnNpb24sICcwLjI1LjAnXSxcclxuICAgICAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjQudmVyc2lvbiwgJzAuMjEuMCddLFxyXG4gICAgICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yMy52ZXJzaW9uLCAnMC4yMS4wJ10sXHJcbiAgICBdKTtcclxuICAgIHB1YmxpYyBzdGF0aWMgaGFzKHZlcnNpb246IEt1YmVybmV0ZXNWZXJzaW9uKSB7XHJcbiAgICAgIHJldHVybiB0aGlzLnZlcnNpb25NYXAuaGFzKHZlcnNpb24udmVyc2lvbik7XHJcbiAgICB9XHJcbiAgICBwdWJsaWMgc3RhdGljIGdldCh2ZXJzaW9uOiBLdWJlcm5ldGVzVmVyc2lvbikge1xyXG4gICAgICByZXR1cm4gdGhpcy52ZXJzaW9uTWFwLmdldCh2ZXJzaW9uLnZlcnNpb24pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbi8qKlxyXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBhZGQtb25cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgS2FycGVudGVyQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgaXMgdGhlIHRvcCBsZXZlbCBub2RlcG9vbCBzcGVjaWZpY2F0aW9uLiBOb2RlcG9vbHMgbGF1bmNoIG5vZGVzIGluIHJlc3BvbnNlIHRvIHBvZHMgdGhhdCBhcmUgdW5zY2hlZHVsYWJsZS5cclxuICAgICAqIEEgc2luZ2xlIG5vZGVwb29sIGlzIGNhcGFibGUgb2YgbWFuYWdpbmcgYSBkaXZlcnNlIHNldCBvZiBub2Rlcy5cclxuICAgICAqIE5vZGUgcHJvcGVydGllcyBhcmUgZGV0ZXJtaW5lZCBmcm9tIGEgY29tYmluYXRpb24gb2Ygbm9kZXBvb2wgYW5kIHBvZCBzY2hlZHVsaW5nIGNvbnN0cmFpbnRzLlxyXG4gICAgICovXHJcbiAgICBub2RlUG9vbFNwZWM/OiBOb2RlUG9vbFNwZWMsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGlzIHRoZSB0b3AgbGV2ZWwgc3BlYyBmb3IgdGhlIEFXUyBLYXJwZW50ZXIgUHJvdmlkZXJcclxuICAgICAqIEl0IGNvbnRhaW5zIGNvbmZpZ3VyYXRpb24gbmVjZXNzYXJ5IHRvIGxhdW5jaCBpbnN0YW5jZXMgaW4gQVdTLlxyXG4gICAgICovXHJcbiAgICBlYzJOb2RlQ2xhc3NTcGVjPzogRWMyTm9kZUNsYXNzU3BlYyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEZsYWcgZm9yIGVuYWJsaW5nIEthcnBlbnRlcidzIG5hdGl2ZSBpbnRlcnJ1cHRpb24gaGFuZGxpbmdcclxuICAgICAqL1xyXG4gICAgaW50ZXJydXB0aW9uSGFuZGxpbmc/OiBib29sZWFuLFxyXG5cclxuICAgIC8qXHJcbiAgICAqIEZsYWcgZm9yIG1hbmFnaW5nIGluc3RhbGwgb2YgS2FycGVudGVyJ3MgbmV3IENSRHMgYmV0d2VlbiB2ZXJzaW9uc1xyXG4gICAgKiBUaGlzIGlzIG9ubHkgbmVjZXNzYXJ5IGlmIHVwZ3JhZGluZyBmcm9tIGEgdmVyc2lvbiBwcmlvciB0byB2MC4zMi4wXHJcbiAgICAqIElmIG5vdCBwcm92aWRlZCwgZGVmYXVsdHMgdG8gdHJ1ZVxyXG4gICAgKiBJZiBzZXQgdG8gdHJ1ZSwgdGhlIGFkZC1vbiB3aWxsIG1hbmFnZSBpbnN0YWxsYXRpb24gb2YgdGhlIENSRHNcclxuICAgICovXHJcbiAgICBpbnN0YWxsQ1JEcz86IGJvb2xlYW4sXHJcbiAgICAvKipcclxuICAgICAqIFRpbWVvdXQgZHVyYXRpb24gd2hpbGUgaW5zdGFsbGluZyBrYXJwZW50ZXIgaGVsbSBjaGFydCB1c2luZyBhZGRIZWxtQ2hhcnQgQVBJXHJcbiAgICAgKi9cclxuICAgIGhlbG1DaGFydFRpbWVvdXQ/OiBEdXJhdGlvbixcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZSBQb2QgSWRlbnRpdHkuXHJcbiAgICAgKiBUbyB1c2UgRUtTIFBvZCBJZGVudGl0aWVzXHJcbiAgICAgKiAgLSBUaGUgY2x1c3RlciBtdXN0IGhhdmUgS3ViZXJuZXRlcyB2ZXJzaW9uIDEuMjQgb3IgbGF0ZXJcclxuICAgICAqICAtIEthcnBlbnRlciBQb2RzIG11c3QgYmUgYXNzaWduZWQgdG8gTGludXggQW1hem9uIEVDMiBpbnN0YW5jZXNcclxuICAgICAqICAtIEthcnBlbnRlciB2ZXJzaW9uIHN1cHBvcnRzIFBvZCBJZGVudGl0eSAodjAuMzUuMCBvciBsYXRlcikgc2VlIGh0dHBzOi8vZG9jcy5hd3MuYW1hem9uLmNvbS9la3MvbGF0ZXN0L3VzZXJndWlkZS9wb2QtaWRlbnRpdHkuaHRtbFxyXG4gICAgICpcclxuICAgICAqIEBzZWUgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL3BvZC1pZGVudGl0eS5odG1sXHJcbiAgICAgKlxyXG4gICAgICogQGRlZmF1bHQgZmFsc2VcclxuICAgICAqL1xyXG4gICAgcG9kSWRlbnRpdHk/OiBib29sZWFuLFxyXG59XHJcblxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHRzIG9wdGlvbnMgZm9yIHRoZSBhZGQtb25cclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wczogSGVsbUFkZE9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiBLQVJQRU5URVIsXHJcbiAgICBuYW1lc3BhY2U6IFwia3ViZS1zeXN0ZW1cIixcclxuICAgIHZlcnNpb246ICcxLjIuMScsXHJcbiAgICBjaGFydDogS0FSUEVOVEVSLFxyXG4gICAgcmVsZWFzZTogS0FSUEVOVEVSLFxyXG4gICAgcmVwb3NpdG9yeTogJ29jaTovL3B1YmxpYy5lY3IuYXdzL2thcnBlbnRlci9rYXJwZW50ZXInLFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBLYXJwZW50ZXIgYWRkLW9uLlxyXG4gKiBAZGVwcmVjYXRlZCB1c2UgS2FycGVudGVyVjFBZGRPbiBtb3ZpbmcgZm9yd2FyZFxyXG4gKi9cclxuQHV0aWxzLnN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBLYXJwZW50ZXJBZGRPbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gICAgcmVhZG9ubHkgb3B0aW9uczogS2FycGVudGVyQWRkT25Qcm9wcztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IEthcnBlbnRlckFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7Li4uZGVmYXVsdFByb3BzLCAuLi5wcm9wc30pO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHM7XHJcbiAgICB9XHJcblxyXG4gICAgQHV0aWxzLmNvbmZsaWN0c1dpdGgoJ0NsdXN0ZXJBdXRvU2NhbGVyQWRkT24nKVxyXG4gICAgQHV0aWxzLmNvbmZsaWN0c1dpdGhBdXRvTW9kZSh1dGlscy5BdXRvTW9kZUNvbmZsaWN0VHlwZS5BTFJFQURZX0lOU1RBTExFRClcclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGFzc2VydChjbHVzdGVySW5mby5jbHVzdGVyIGluc3RhbmNlb2YgQ2x1c3RlciwgXCJLYXJwZW50ZXJBZGRPbiBjYW5ub3QgYmUgdXNlZCB3aXRoIGltcG9ydGVkIGNsdXN0ZXJzIGFzIGl0IHJlcXVpcmVzIGNoYW5nZXMgdG8gdGhlIGNsdXN0ZXIgYXV0aGVudGljYXRpb24uXCIpO1xyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgOiBDbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICBjb25zdCBlbmRwb2ludCA9IGNsdXN0ZXIuY2x1c3RlckVuZHBvaW50O1xyXG4gICAgICAgIGNvbnN0IG5hbWUgPSBjbHVzdGVyLmNsdXN0ZXJOYW1lO1xyXG4gICAgICAgIGNvbnN0IHBhcnRpdGlvbiA9IGNsdXN0ZXIuc3RhY2sucGFydGl0aW9uO1xyXG5cclxuICAgICAgICBjb25zdCBzdGFja05hbWUgPSBjbHVzdGVyLnN0YWNrLnN0YWNrTmFtZTtcclxuICAgICAgICBjb25zdCByZWdpb24gPSBjbHVzdGVyLnN0YWNrLnJlZ2lvbjtcclxuXHJcbiAgICAgICAgbGV0IHZhbHVlcyA9IHRoaXMub3B0aW9ucy52YWx1ZXMgPz8ge307XHJcbiAgICAgICAgY29uc3QgdmVyc2lvbiA9IHRoaXMub3B0aW9ucy52ZXJzaW9uITtcclxuXHJcbiAgICAgICAgY29uc3QgaW50ZXJydXB0aW9uID0gdGhpcy5vcHRpb25zLmludGVycnVwdGlvbkhhbmRsaW5nIHx8IGZhbHNlO1xyXG4gICAgICAgIGNvbnN0IGluc3RhbGxDUkRzID0gdGhpcy5vcHRpb25zLmluc3RhbGxDUkRzIHx8IGZhbHNlO1xyXG5cclxuICAgICAgICBjb25zdCBwb2RJZGVudGl0eSA9IHRoaXMub3B0aW9ucy5wb2RJZGVudGl0eSB8fCBmYWxzZTtcclxuXHJcbiAgICAgICAgLy8gTm9kZVBvb2wgdmFyaWFibGVzXHJcbiAgICAgICAgY29uc3QgbGFiZWxzID0gdGhpcy5vcHRpb25zLm5vZGVQb29sU3BlYz8ubGFiZWxzIHx8IHt9O1xyXG4gICAgICAgIGNvbnN0IGFubm90YXRpb25zID0gdGhpcy5vcHRpb25zLm5vZGVQb29sU3BlYz8uYW5ub3RhdGlvbnMgfHwge307XHJcbiAgICAgICAgY29uc3QgdGFpbnRzID0gdGhpcy5vcHRpb25zLm5vZGVQb29sU3BlYz8udGFpbnRzIHx8IFtdO1xyXG4gICAgICAgIGNvbnN0IHN0YXJ0dXBUYWludHMgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy5zdGFydHVwVGFpbnRzIHx8IFtdO1xyXG4gICAgICAgIGNvbnN0IHJlcXVpcmVtZW50cyA9IHRoaXMub3B0aW9ucy5ub2RlUG9vbFNwZWM/LnJlcXVpcmVtZW50cyB8fCBbXTtcclxuICAgICAgICBjb25zdCBjb25zb2wgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy5jb25zb2xpZGF0aW9uIHx8IG51bGw7XHJcbiAgICAgICAgY29uc3QgdHRsU2Vjb25kc0FmdGVyRW1wdHkgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy50dGxTZWNvbmRzQWZ0ZXJFbXB0eSB8fCBudWxsO1xyXG4gICAgICAgIGNvbnN0IHR0bFNlY29uZHNVbnRpbEV4cGlyZWQgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy50dGxTZWNvbmRzVW50aWxFeHBpcmVkIHx8IG51bGw7XHJcbiAgICAgICAgY29uc3QgZGlzcnVwdGlvbiA9IHRoaXMub3B0aW9ucy5ub2RlUG9vbFNwZWM/LmRpc3J1cHRpb24gfHwgbnVsbDtcclxuICAgICAgICBjb25zdCBsaW1pdHMgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy5saW1pdHMgfHwgbnVsbDtcclxuICAgICAgICBjb25zdCB3ZWlnaHQgPSB0aGlzLm9wdGlvbnMubm9kZVBvb2xTcGVjPy53ZWlnaHQgfHwgbnVsbDtcclxuXHJcbiAgICAgICAgLy8gTm9kZUNsYXNzIHZhcmlhYmxlc1xyXG4gICAgICAgIGNvbnN0IHN1Ym5ldFNlbGVjdG9yID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LnN1Ym5ldFNlbGVjdG9yO1xyXG4gICAgICAgIGNvbnN0IHNnU2VsZWN0b3IgPSB0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYz8uc2VjdXJpdHlHcm91cFNlbGVjdG9yO1xyXG4gICAgICAgIGNvbnN0IHN1Ym5ldFNlbGVjdG9yVGVybXMgPSB0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYz8uc3VibmV0U2VsZWN0b3JUZXJtcztcclxuICAgICAgICBjb25zdCBzZ1NlbGVjdG9yVGVybXMgPSB0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYz8uc2VjdXJpdHlHcm91cFNlbGVjdG9yVGVybXM7XHJcbiAgICAgICAgY29uc3QgYW1pRmFtaWx5ID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LmFtaUZhbWlseTtcclxuICAgICAgICBjb25zdCBhbWlTZWxlY3RvciA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy5hbWlTZWxlY3RvciB8fCB7fTtcclxuICAgICAgICBjb25zdCBhbWlTZWxlY3RvclRlcm1zID0gdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWM/LmFtaVNlbGVjdG9yVGVybXM7XHJcbiAgICAgICAgY29uc3QgaW5zdGFuY2VTdG9yZVBvbGljeSA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy5pbnN0YW5jZVN0b3JlUG9saWN5IHx8IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCB1c2VyRGF0YSA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy51c2VyRGF0YSB8fCBcIlwiO1xyXG4gICAgICAgIGNvbnN0IGluc3RhbmNlUHJvZiA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy5pbnN0YW5jZVByb2ZpbGU7XHJcbiAgICAgICAgY29uc3QgdGFncyA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy50YWdzIHx8IHt9O1xyXG4gICAgICAgIGNvbnN0IG1ldGFkYXRhT3B0aW9ucyA9IHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjPy5tZXRhZGF0YU9wdGlvbnMgfHwge1xyXG4gICAgICAgICAgICBodHRwRW5kcG9pbnQ6IFwiZW5hYmxlZFwiLFxyXG4gICAgICAgICAgICBodHRwUHJvdG9jb2xJUHY2OiBcImRpc2FibGVkXCIsXHJcbiAgICAgICAgICAgIGh0dHBQdXRSZXNwb25zZUhvcExpbWl0OiAyLFxyXG4gICAgICAgICAgICBodHRwVG9rZW5zOiBcInJlcXVpcmVkXCJcclxuICAgICAgICB9O1xyXG4gICAgICAgIGlmIChjbHVzdGVyLmlwRmFtaWx5ID09IElwRmFtaWx5LklQX1Y2KSB7XHJcbiAgICAgICAgICAgIG1ldGFkYXRhT3B0aW9ucy5odHRwUHJvdG9jb2xJUHY2ID0gXCJlbmFibGVkXCI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IGJsb2NrRGV2aWNlTWFwcGluZ3MgPSB0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYz8uYmxvY2tEZXZpY2VNYXBwaW5ncyB8fCBbXTtcclxuICAgICAgICBjb25zdCBkZXRhaWxlZE1vbml0b3JpbmcgPSB0aGlzLm9wdGlvbnMuZWMyTm9kZUNsYXNzU3BlYz8uZGV0YWlsZWRNb25pdG9yaW5nIHx8IGZhbHNlO1xyXG5cclxuICAgICAgICAvLyBDaGVjayBLdWJlcm5ldGVzIGFuZCBLYXJwZW50ZXIgdmVyc2lvbiBjb21wYXRpYmlsaXR5IGZvciB3YXJuaW5nXHJcbiAgICAgICAgdGhpcy5pc0NvbXBhdGlibGUodmVyc2lvbiwgY2x1c3RlckluZm8udmVyc2lvbik7XHJcblxyXG4gICAgICAgIC8vIFZlcnNpb24gZmVhdHVyZSBjaGVja3MgZm9yIGVycm9yc1xyXG4gICAgICAgIHRoaXMudmVyc2lvbkZlYXR1cmVDaGVja3NGb3JFcnJvcihjbHVzdGVySW5mbywgdmVyc2lvbiwgZGlzcnVwdGlvbiwgY29uc29sLCB0dGxTZWNvbmRzQWZ0ZXJFbXB0eSwgdHRsU2Vjb25kc1VudGlsRXhwaXJlZCxcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLmVjMk5vZGVDbGFzc1NwZWMsIGFtaUZhbWlseSk7XHJcblxyXG4gICAgICAgIC8vIFNldCB1cCB0aGUgbm9kZSByb2xlIGFuZCBpbnN0YW5jZSBwcm9maWxlXHJcbiAgICAgICAgY29uc3QgW2thcnBlbnRlck5vZGVSb2xlLCBrYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGVdID0gdGhpcy5zZXRVcE5vZGVSb2xlKGNsdXN0ZXIsIHN0YWNrTmFtZSwgcmVnaW9uKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBjb250cm9sbGVyIHBvbGljeVxyXG4gICAgICAgIGxldCBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudDtcclxuICAgICAgICBpZiAoc2VtdmVyLmd0ZSh2ZXJzaW9uLCBcInYwLjMyLjBcIikpe1xyXG4gICAgICAgICAgICBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudCA9IGlhbS5Qb2xpY3lEb2N1bWVudC5mcm9tSnNvbihLYXJwZW50ZXJDb250cm9sbGVyUG9saWN5QmV0YShjbHVzdGVyLCBwYXJ0aXRpb24sIHJlZ2lvbikpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGthcnBlbnRlclBvbGljeURvY3VtZW50ID0gaWFtLlBvbGljeURvY3VtZW50LmZyb21Kc29uKEthcnBlbnRlckNvbnRyb2xsZXJQb2xpY3kpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudC5hZGRTdGF0ZW1lbnRzKG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgICAgICBcImlhbTpQYXNzUm9sZVwiLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtgJHtrYXJwZW50ZXJOb2RlUm9sZS5yb2xlQXJufWBdXHJcbiAgICAgICAgfSkpO1xyXG5cclxuICAgICAgICAvLyBTdXBwb3J0IGZvciBOYXRpdmUgc3BvdCBpbnRlcnJ1cHRpb25cclxuICAgICAgICBpZiAoaW50ZXJydXB0aW9uKXtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIEludGVycnVwdGlvbiBRdWV1ZVxyXG4gICAgICAgICAgICBjb25zdCBxdWV1ZSA9IG5ldyBzcXMuUXVldWUoY2x1c3Rlci5zdGFjaywgJ2thcnBlbnRlci1xdWV1ZScsIHtcclxuICAgICAgICAgICAgICAgIHF1ZXVlTmFtZTogc3RhY2tOYW1lLFxyXG4gICAgICAgICAgICAgICAgcmV0ZW50aW9uUGVyaW9kOiBEdXJhdGlvbi5zZWNvbmRzKDMwMCksXHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBxdWV1ZS5hZGRUb1Jlc291cmNlUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgICAgIHNpZDogJ0VDMkludGVycnVwdGlvblBvbGljeScsXHJcbiAgICAgICAgICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgICAgICBwcmluY2lwYWxzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdzcXMuYW1hem9uYXdzLmNvbScpLFxyXG4gICAgICAgICAgICAgICAgICAgIG5ldyBpYW0uU2VydmljZVByaW5jaXBhbCgnZXZlbnRzLmFtYXpvbmF3cy5jb20nKSxcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzcXM6U2VuZE1lc3NhZ2VcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW2Ake3F1ZXVlLnF1ZXVlQXJufWBdXHJcbiAgICAgICAgICAgIH0pKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBJbnRlcnJ1cHRpb24gUnVsZXNcclxuICAgICAgICAgICAgbmV3IFJ1bGUoY2x1c3Rlci5zdGFjaywgJ3NjaGVkdWxlLWNoYW5nZS1ydWxlJywge1xyXG4gICAgICAgICAgICAgICAgZXZlbnRQYXR0ZXJuOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc291cmNlOiBbXCJhd3MuaGVhbHRoXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgIGRldGFpbFR5cGU6IFsnQVdTIEhlYWx0aCBFdmVudCddXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9KS5hZGRUYXJnZXQobmV3IFNxc1F1ZXVlKHF1ZXVlKSk7XHJcblxyXG4gICAgICAgICAgICBuZXcgUnVsZShjbHVzdGVyLnN0YWNrLCAnc3BvdC1pbnRlcnJ1cHRpb24tcnVsZScsIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50UGF0dGVybjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogW1wiYXdzLmVjMlwiXSxcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxUeXBlOiBbJ0VDMiBTcG90IEluc3RhbmNlIEludGVycnVwdGlvbiBXYXJuaW5nJ11cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pLmFkZFRhcmdldChuZXcgU3FzUXVldWUocXVldWUpKTtcclxuXHJcbiAgICAgICAgICAgIG5ldyBSdWxlKGNsdXN0ZXIuc3RhY2ssICdyZWJhbGFuY2UtcnVsZScsIHtcclxuICAgICAgICAgICAgICAgIGV2ZW50UGF0dGVybjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHNvdXJjZTogW1wiYXdzLmVjMlwiXSxcclxuICAgICAgICAgICAgICAgICAgICBkZXRhaWxUeXBlOiBbJ0VDMiBJbnN0YW5jZSBSZWJhbGFuY2UgUmVjb21tZW5kYXRpb24nXVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSkuYWRkVGFyZ2V0KG5ldyBTcXNRdWV1ZShxdWV1ZSkpO1xyXG5cclxuICAgICAgICAgICAgbmV3IFJ1bGUoY2x1c3Rlci5zdGFjaywgJ2luc3Qtc3RhdGUtY2hhbmdlLXJ1bGUnLCB7XHJcbiAgICAgICAgICAgICAgICBldmVudFBhdHRlcm46IHtcclxuICAgICAgICAgICAgICAgICAgICBzb3VyY2U6IFtcImF3cy5lYzJcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgZGV0YWlsVHlwZTogWydDMiBJbnN0YW5jZSBTdGF0ZS1jaGFuZ2UgTm90aWZpY2F0aW9uJ11cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0pLmFkZFRhcmdldChuZXcgU3FzUXVldWUocXVldWUpKTtcclxuXHJcbiAgICAgICAgICAgIC8vIEFkZCBwb2xpY3kgdG8gdGhlIG5vZGUgcm9sZSB0byBhbGxvdyBhY2Nlc3MgdG8gdGhlIEludGVycnVwdGlvbiBRdWV1ZVxyXG4gICAgICAgICAgICBjb25zdCBpbnRlcnJ1cHRpb25RdWV1ZVN0YXRlbWVudCA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICBcInNxczpEZWxldGVNZXNzYWdlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzcXM6R2V0UXVldWVVcmxcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNxczpHZXRRdWV1ZUF0dHJpYnV0ZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNxczpSZWNlaXZlTWVzc2FnZVwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbYCR7cXVldWUucXVldWVBcm59YF1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIGthcnBlbnRlclBvbGljeURvY3VtZW50LmFkZFN0YXRlbWVudHMoaW50ZXJydXB0aW9uUXVldWVTdGF0ZW1lbnQpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIE5hbWVzcGFjZVxyXG4gICAgICAgIGNvbnN0IG5zID0gdXRpbHMuY3JlYXRlTmFtZXNwYWNlKHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhLCBjbHVzdGVyLCB0cnVlLCB0cnVlKTtcclxuXHJcbiAgICAgICAgbGV0IHNhOiBhbnk7XHJcbiAgICAgICAgbGV0IHNhQW5ub3RhdGlvbjogYW55O1xyXG4gICAgICAgIGlmIChwb2RJZGVudGl0eSAmJiBzZW12ZXIuZ3RlKGAke2NsdXN0ZXJJbmZvLnZlcnNpb24udmVyc2lvbn0uMGAsICcxLjI0LjAnKSAmJiBzZW12ZXIuZ3RlKHZlcnNpb24sIFwidjAuMzUuMFwiKSl7XHJcbiAgICAgICAgICBzYSA9IHV0aWxzLnBvZElkZW50aXR5QXNzb2NpYXRpb24oY2x1c3RlciwgUkVMRUFTRSwgdGhpcy5vcHRpb25zLm5hbWVzcGFjZSEsIGthcnBlbnRlclBvbGljeURvY3VtZW50KTtcclxuICAgICAgICAgIHNhQW5ub3RhdGlvbiA9IHt9O1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBzYSA9IHV0aWxzLmNyZWF0ZVNlcnZpY2VBY2NvdW50KGNsdXN0ZXIsIFJFTEVBU0UsIHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhLCBrYXJwZW50ZXJQb2xpY3lEb2N1bWVudCk7XHJcbiAgICAgICAgICBzYUFubm90YXRpb24gPSB7XCJla3MuYW1hem9uYXdzLmNvbS9yb2xlLWFyblwiOiBzYS5yb2xlLnJvbGVBcm59O1xyXG4gICAgICAgIH1cclxuICAgICAgICBzYS5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgZ2xvYmFsIGhlbG0gdmFsdWVzIGJhc2VkIG9uIHYxYmV0YTEgbWlncmF0aW9uIGFzIHNob3duIGJlbG93OlxyXG4gICAgICAgIC8vIGh0dHBzOi8va2FycGVudGVyLnNoL3YwLjMyL3VwZ3JhZGluZy92MWJldGExLW1pZ3JhdGlvbi8jaGVsbS12YWx1ZXNcclxuICAgICAgICBsZXQgZ2xvYmFsU2V0dGluZ3MgPSB7XHJcbiAgICAgICAgICAgIGNsdXN0ZXJOYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICBjbHVzdGVyRW5kcG9pbnQ6IGVuZHBvaW50XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKHNlbXZlci5sdCh2ZXJzaW9uLCAnMC4zMi4wJykpe1xyXG4gICAgICAgICAgICBnbG9iYWxTZXR0aW5ncyA9IG1lcmdlKGdsb2JhbFNldHRpbmdzLCB7XHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0SW5zdGFuY2VQcm9maWxlOiBrYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGUuaW5zdGFuY2VQcm9maWxlTmFtZSxcclxuICAgICAgICAgICAgICAgIGludGVycnVwdGlvblF1ZXVlTmFtZTogaW50ZXJydXB0aW9uID8gc3RhY2tOYW1lIDogXCJcIlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBnbG9iYWxTZXR0aW5ncyA9IG1lcmdlKGdsb2JhbFNldHRpbmdzLCB7XHJcbiAgICAgICAgICAgICAgICBpbnRlcnJ1cHRpb25RdWV1ZTogaW50ZXJydXB0aW9uID8gc3RhY2tOYW1lIDogXCJcIlxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZW12ZXIubHQodmVyc2lvbiwgJzAuMzIuMCcpKXtcclxuICAgICAgICAgICAgdXRpbHMuc2V0UGF0aCh2YWx1ZXMsIFwic2V0dGluZ3MuYXdzXCIsIG1lcmdlKGdsb2JhbFNldHRpbmdzLCB2YWx1ZXM/LnNldHRpbmdzPy5hd3MgPz8ge30pKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB1dGlscy5zZXRQYXRoKHZhbHVlcywgXCJzZXR0aW5nc1wiLCBtZXJnZShnbG9iYWxTZXR0aW5ncywgdmFsdWVzPy5zZXR0aW5ncyA/PyB7fSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gTGV0IEhlbG0gY3JlYXRlIHRoZSBzZXJ2aWNlIGFjY291bnQgaWYgdXNpbmcgcG9kIGlkZW50aXR5XHJcbiAgICAgICAgY29uc3Qgc2FWYWx1ZXMgPSB7XHJcbiAgICAgICAgICAgIHNlcnZpY2VBY2NvdW50OiB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGU6IHBvZElkZW50aXR5LFxyXG4gICAgICAgICAgICAgICAgbmFtZTogUkVMRUFTRSxcclxuICAgICAgICAgICAgICAgIGFubm90YXRpb25zOiBzYUFubm90YXRpb24sXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YWx1ZXMgPSBtZXJnZSh2YWx1ZXMsIHNhVmFsdWVzKTtcclxuICAgICAgICAvLyBJbnN0YWxsIEhlbG1DaGFydCB1c2luZyB1c2VyIGRlZmluZWQgdmFsdWUgb3IgZGVmYXVsdCBvZiA1IG1pbnV0ZXMuXHJcbiAgICAgICAgY29uc3QgaGVsbUNoYXJ0VGltZW91dCA9IHRoaXMub3B0aW9ucy5oZWxtQ2hhcnRUaW1lb3V0IHx8IER1cmF0aW9uLm1pbnV0ZXMoNSk7XHJcbiAgICAgICAgY29uc3Qga2FycGVudGVyQ2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzLCBmYWxzZSwgdHJ1ZSwgaGVsbUNoYXJ0VGltZW91dCk7XHJcblxyXG4gICAgICAgIGthcnBlbnRlckNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShzYSk7XHJcblxyXG4gICAgICAgIGlmKGNsdXN0ZXJJbmZvLm5vZGVHcm91cHMpIHtcclxuICAgICAgICAgICAgY2x1c3RlckluZm8ubm9kZUdyb3Vwcy5mb3JFYWNoKG4gPT4ga2FycGVudGVyQ2hhcnQubm9kZS5hZGREZXBlbmRlbmN5KG4pKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChzZW12ZXIuZ3RlKHZlcnNpb24sIFwiMC4zMi4wXCIpICYmIGluc3RhbGxDUkRzKXtcclxuICAgICAgICAgICAgbGV0IF92ZXJzaW9uID0gdmVyc2lvbjtcclxuICAgICAgICAgICAgaWYoIXZlcnNpb24uc3RhcnRzV2l0aCgndicpKSB7XHJcbiAgICAgICAgICAgICAgICBfdmVyc2lvbiA9IGB2JHt2ZXJzaW9ufWA7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGNvbnN0IENSRHMgPVtcclxuICAgICAgICAgICAgICAgIFsgXCJrYXJwZW50ZXJzaC1ub2RlcG9vbC1iZXRhMS1jcmRcIiwgYGh0dHBzOi8vcmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbS9hd3Mva2FycGVudGVyLyR7X3ZlcnNpb259L3BrZy9hcGlzL2NyZHMva2FycGVudGVyLnNoX25vZGVwb29scy55YW1sYCBdLFxyXG4gICAgICAgICAgICAgICAgWyBcImthcnBlbnRlcnNoLW5vZGVjbGFpbXMtYmV0YTEtY3JkXCIsIGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYXdzL2thcnBlbnRlci8ke192ZXJzaW9ufS9wa2cvYXBpcy9jcmRzL2thcnBlbnRlci5zaF9ub2RlY2xhaW1zLnlhbWxgXSxcclxuICAgICAgICAgICAgICAgIFsgXCJrYXJwZW50ZXJrOHMtZWMybm9kZWNsYXNzZXMtYmV0YTEtY3JkXCIsIGBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYXdzL2thcnBlbnRlci8ke192ZXJzaW9ufS9wa2cvYXBpcy9jcmRzL2thcnBlbnRlci5rOHMuYXdzX2VjMm5vZGVjbGFzc2VzLnlhbWxgXSxcclxuICAgICAgICAgICAgXTtcclxuXHJcbiAgICAgICAgICAgIC8vIGxvb3Agb3ZlciB0aGUgQ1JEJ3MgYW5kIGxvYWQgdGhlIHlhbWwgYW5kIGRlcGxveSB0aGUgbWFuaWZlc3RcclxuICAgICAgICAgICAgZm9yIChjb25zdCBbY3JkTmFtZSwgY3JkVXJsXSBvZiBDUkRzKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjcmRNYW5pZmVzdCA9IHV0aWxzLmxvYWRFeHRlcm5hbFlhbWwoY3JkVXJsKTtcclxuICAgICAgICAgICAgICAgIGNvbnN0IG1hbmlmZXN0ID0gY2x1c3Rlci5hZGRNYW5pZmVzdChjcmROYW1lLCBjcmRNYW5pZmVzdCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8gV2Ugd2FudCB0aGVzZSBpbnN0YWxsZWQgYmVmb3JlIHRoZSBrYXJwZW50ZXJDaGFydCwgb3IgaGVsbSB3aWxsIHRpbWVvdXQgd2FpdGluZyBmb3IgaXQgdG8gc3RhYmlsaXplXHJcbiAgICAgICAgICAgICAgICBrYXJwZW50ZXJDaGFydC5ub2RlLmFkZERlcGVuZGVuY3kobWFuaWZlc3QpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuXHJcbiAgICAgICAgLy8gRGVwbG95IFByb3Zpc2lvbmVyIChBbHBoYSkgb3IgTm9kZVBvb2wgKEJldGEpIENSRCBiYXNlZCBvbiB0aGUgS2FycGVudGVyIFZlcnNpb25cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLm5vZGVQb29sU3BlYyl7XHJcbiAgICAgICAgICAgIGxldCBwb29sO1xyXG4gICAgICAgICAgICBpZiAoc2VtdmVyLmd0ZSh2ZXJzaW9uLCAnMC4zMi4wJykpe1xyXG4gICAgICAgICAgICAgICAgcG9vbCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiAna2FycGVudGVyLnNoL3YxYmV0YTEnLFxyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6ICdOb2RlUG9vbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHsgbmFtZTogJ2RlZmF1bHQtbm9kZXBvb2wnIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZW1wbGF0ZToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsYWJlbHM6IGxhYmVscyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbm5vdGF0aW9uczogYW5ub3RhdGlvbnMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVDbGFzc1JlZjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImRlZmF1bHQtZWMybm9kZWNsYXNzXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhaW50czogdGFpbnRzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN0YXJ0dXBUYWludHM6IHN0YXJ0dXBUYWludHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzOiB0aGlzLmNvbnZlcnQocmVxdWlyZW1lbnRzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZGlzcnVwdGlvbjogZGlzcnVwdGlvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXRzOiBsaW1pdHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgcG9vbCA9IHtcclxuICAgICAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiAna2FycGVudGVyLnNoL3YxYWxwaGE1JyxcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiAnUHJvdmlzaW9uZXInLFxyXG4gICAgICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7IG5hbWU6ICdkZWZhdWx0LXByb3Zpc2lvbmVyJyB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgcHJvdmlkZXJSZWY6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVmYXVsdC1ub2RldGVtcGxhdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0YWludHM6IHRhaW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RhcnR1cFRhaW50czogc3RhcnR1cFRhaW50cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWxzOiBsYWJlbHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFubm90YXRpb25zOiBhbm5vdGF0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZW1lbnRzOiB0aGlzLmNvbnZlcnQocmVxdWlyZW1lbnRzKSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgbGltaXRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IGxpbWl0cyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29saWRhdGlvbjogY29uc29sLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0dGxTZWNvbmRzVW50aWxFeHBpcmVkOiB0dGxTZWNvbmRzVW50aWxFeHBpcmVkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0dGxTZWNvbmRzQWZ0ZXJFbXB0eTogdHRsU2Vjb25kc0FmdGVyRW1wdHksXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlaWdodDogd2VpZ2h0LFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGNvbnN0IHBvb2xNYW5pZmVzdCA9IGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ2RlZmF1bHQtcG9vbCcsIHBvb2wpO1xyXG4gICAgICAgICAgICBwb29sTWFuaWZlc3Qubm9kZS5hZGREZXBlbmRlbmN5KGthcnBlbnRlckNoYXJ0KTtcclxuXHJcbiAgICAgICAgICAgIC8vIERlcGxveSBBV1NOb2RlVGVtcGxhdGUgKEFscGhhKSBvciBFQzJOb2RlQ2xhc3MgKEJldGEpIENSRCBiYXNlZCBvbiB0aGUgS2FycGVudGVyIFZlcnNpb25cclxuICAgICAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5lYzJOb2RlQ2xhc3NTcGVjKXtcclxuICAgICAgICAgICAgICAgIGxldCBlYzJOb2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKHNlbXZlci5ndGUodmVyc2lvbiwgJzAuMzIuMCcpKXtcclxuICAgICAgICAgICAgICAgICAgICBlYzJOb2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiBcImthcnBlbnRlci5rOHMuYXdzL3YxYmV0YTFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogXCJFQzJOb2RlQ2xhc3NcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGVmYXVsdC1lYzJub2RlY2xhc3NcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzcGVjOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbWlGYW1pbHk6IGFtaUZhbWlseSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym5ldFNlbGVjdG9yVGVybXM6IHN1Ym5ldFNlbGVjdG9yVGVybXMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwU2VsZWN0b3JUZXJtczogc2dTZWxlY3RvclRlcm1zLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYW1pU2VsZWN0b3JUZXJtczogYW1pU2VsZWN0b3JUZXJtcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVzZXJEYXRhOiB1c2VyRGF0YSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3M6IHRhZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YU9wdGlvbnM6IG1ldGFkYXRhT3B0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrRGV2aWNlTWFwcGluZ3M6IGJsb2NrRGV2aWNlTWFwcGluZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkZXRhaWxlZE1vbml0b3Jpbmc6IGRldGFpbGVkTW9uaXRvcmluZyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBQcm92aWRlIGN1c3RvbSBJbnN0YW5jZSBQcm9maWxlIHRvIHJlcGxhY2Ugcm9sZSBpZiBwcm92aWRlZCwgZWxzZSB1c2UgdGhlIHJvbGUgY3JlYXRlZCB3aXRoIHRoZSBhZGRvblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChpbnN0YW5jZVByb2YpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWMyTm9kZSA9IG1lcmdlKGVjMk5vZGUsIHsgc3BlYzogeyBpbnN0YW5jZVByb2ZpbGU6IGluc3RhbmNlUHJvZiB9fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZWMyTm9kZSA9IG1lcmdlKGVjMk5vZGUsIHsgc3BlYzogeyByb2xlOiBrYXJwZW50ZXJOb2RlUm9sZS5yb2xlTmFtZSB9fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLyBJbnN0YW5jZSBTdG9yZSBQb2xpY3kgYWRkZWQgZm9yIHYwLjM0LjAgYW5kIHVwXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlbXZlci5ndGUodmVyc2lvbiwgJzAuMzQuMCcpICYmIGluc3RhbmNlU3RvcmVQb2xpY3kpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBlYzJOb2RlID0gbWVyZ2UoZWMyTm9kZSwgeyBzcGVjOiB7IGluc3RhbmNlU3RvcmVQb2xpY3k6IGluc3RhbmNlU3RvcmVQb2xpY3kgfX0pO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZWMyTm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpVmVyc2lvbjogXCJrYXJwZW50ZXIuazhzLmF3cy92MWFscGhhMVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBraW5kOiBcIkFXU05vZGVUZW1wbGF0ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJkZWZhdWx0LW5vZGV0ZW1wbGF0ZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHN1Ym5ldFNlbGVjdG9yOiBzdWJuZXRTZWxlY3RvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5R3JvdXBTZWxlY3Rvcjogc2dTZWxlY3RvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGluc3RhbmNlUHJvZmlsZTogaW5zdGFuY2VQcm9mID8gaW5zdGFuY2VQcm9mIDogbnVsbCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtaUZhbWlseTogYW1pRmFtaWx5ID8gYW1pRmFtaWx5IDogXCJBTDJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFtaVNlbGVjdG9yOiBhbWlTZWxlY3RvcixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhZ3M6IHRhZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YU9wdGlvbnM6IG1ldGFkYXRhT3B0aW9ucyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJsb2NrRGV2aWNlTWFwcGluZ3M6IGJsb2NrRGV2aWNlTWFwcGluZ3MsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1c2VyRGF0YTogdXNlckRhdGEsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gQWRkIEVDMiBEZXRhaWxlZCBNb25pdG9yaW5nIGZvciB2MC4yMi4wIGFuZCB1cFxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChzZW12ZXIuZ3RlKHZlcnNpb24sICcwLjIyLjAnKSl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGVjMk5vZGUgPSBtZXJnZShlYzJOb2RlLCB7IHNwZWM6IHsgZGV0YWlsZWRNb25pdG9yaW5nOiBkZXRhaWxlZE1vbml0b3Jpbmd9fSk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgY29uc3Qgbm9kZU1hbmlmZXN0ID0gY2x1c3Rlci5hZGRNYW5pZmVzdCgnZGVmYXVsdC1ub2RlLXRlbXBsYXRlJywgZWMyTm9kZSk7XHJcbiAgICAgICAgICAgICAgICBub2RlTWFuaWZlc3Qubm9kZS5hZGREZXBlbmRlbmN5KHBvb2xNYW5pZmVzdCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoa2FycGVudGVyQ2hhcnQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHRvIGNvbnZlcnQgYSBrZXktcGFpciB2YWx1ZXMgKHdpdGggYW4gb3BlcmF0b3IpXHJcbiAgICAgKiBvZiBzcGVjIGNvbmZpZ3VyYXRpb25zIHRvIGFwcHJvcHJpYXRlIGpzb24gZm9ybWF0IGZvciBhZGRNYW5pZmVzdCBmdW5jdGlvblxyXG4gICAgICogQHBhcmFtIHJlcXNcclxuICAgICAqIEByZXR1cm5zIG5ld1JlcXNcclxuICAgICAqICovXHJcbiAgICBwcm90ZWN0ZWQgY29udmVydChyZXFzOiB7a2V5OiBzdHJpbmcsIG9wZXJhdG9yOiBzdHJpbmcsIHZhbHVlczogc3RyaW5nW119W10pOiBhbnlbXSB7XHJcbiAgICAgICAgY29uc3QgbmV3UmVxcyA9IFtdO1xyXG4gICAgICAgIGZvciAobGV0IHJlcSBvZiByZXFzKXtcclxuICAgICAgICAgICAgY29uc3Qga2V5ID0gcmVxWydrZXknXTtcclxuICAgICAgICAgICAgY29uc3Qgb3AgPSByZXFbJ29wZXJhdG9yJ107XHJcbiAgICAgICAgICAgIGNvbnN0IHZhbCA9IHJlcVsndmFsdWVzJ107XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcXVpcmVtZW50ID0ge1xyXG4gICAgICAgICAgICAgICAgXCJrZXlcIjoga2V5LFxyXG4gICAgICAgICAgICAgICAgXCJvcGVyYXRvclwiOiBvcCxcclxuICAgICAgICAgICAgICAgIFwidmFsdWVzXCI6IHZhbFxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBuZXdSZXFzLnB1c2gocmVxdWlyZW1lbnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gbmV3UmVxcztcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBlbnN1cmUgcmlnaHQgZmVhdHVyZXMgYXJlIGFkZGVkIGFzIHBhcnQgb2YgdGhlIGNvbmZpZ3VyYXRpb25cclxuICAgICAqIGZvciB0aGUgcmlnaHQgdmVyc2lvbiBvZiB0aGUgYWRkLW9uXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm9cclxuICAgICAqIEBwYXJhbSB2ZXJzaW9uIHZlcnNpb24gb2YgdGhlIGFkZC1vblxyXG4gICAgICogQHBhcmFtIGRpc3J1cHRpb24gZGlzcnVwdGlvbiBmZWF0dXJlIGF2YWlsYWJsZSB3aXRoIHRoZSBCZXRhIENSRHNcclxuICAgICAqIEBwYXJhbSBjb25zb2xpZGF0aW9uIGNvbnNvbGlkYXRpb24gc2V0dGluZyBhdmFpbGFibGUgd2l0aCB0aGUgQWxwaGEgQ1JEc1xyXG4gICAgICogQHBhcmFtIHR0bFNlY29uZHNBZnRlckVtcHR5IHR0bFNlY29uZHNBZnRlckVtcHR5IHNldHRpbmdcclxuICAgICAqIEBwYXJhbSB0dGxTZWNvbmRzVW50aWxFeHBpcmVkIHR0bFNlY29uZHNVbnRpbEV4cGlyZWQgc2V0dGluZ1xyXG4gICAgICogQHBhcmFtIGVjMk5vZGVDbGFzc1NwZWMgTm9kZSBDbGFzcyBTcGVjXHJcbiAgICAgKiBAcGFyYW0gYW1pRmFtaWx5IEFNSSBGYW1pbHlcclxuICAgICAqIEByZXR1cm5zXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgdmVyc2lvbkZlYXR1cmVDaGVja3NGb3JFcnJvcihjbHVzdGVySW5mbzogQ2x1c3RlckluZm8sIHZlcnNpb246IHN0cmluZywgZGlzcnVwdGlvbjogYW55LCBjb25zb2xpZGF0aW9uOiBhbnksIHR0bFNlY29uZHNBZnRlckVtcHR5OiBhbnksIHR0bFNlY29uZHNVbnRpbEV4cGlyZWQ6IGFueSxcclxuICAgICAgICBlYzJOb2RlQ2xhc3NTcGVjOiBhbnksIGFtaUZhbWlseTogYW55KTogdm9pZCB7XHJcblxyXG4gICAgICAgIC8vIEVDMiBEZXRhaWxlZCBNb25pdG9yaW5nIGlzIG9ubHkgYXZhaWxhYmxlIGluIHZlcnNpb25zIDAuMjMuMCBhbmQgYWJvdmVcclxuICAgICAgICBpZiAoc2VtdmVyLmx0KHZlcnNpb24sICcwLjIzLjAnKSAmJiBlYzJOb2RlQ2xhc3NTcGVjKXtcclxuICAgICAgICAgICAgYXNzZXJ0KGVjMk5vZGVDbGFzc1NwZWNbXCJkZXRhaWxlZE1vbml0b3JpbmdcIl0gPT09IHVuZGVmaW5lZCwgXCJEZXRhaWxlZCBNb25pdG9yaW5nIGlzIG5vdCBhdmFpbGFibGUgaW4gdGhpcyB2ZXJzaW9uIG9mIEthcnBlbnRlci4gUGxlYXNlIHVwZ3JhZGUgdG8gYXQgbGVhc3QgMC4yMy4wLlwiKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIERpc3J1cHRpb24gYnVkZ2V0IHNob3VsZCBub3QgZXhpc3QgZm9yIHZlcnNpb25zIGJlbG93IDAuMzQueFxyXG4gICAgICAgIGlmIChzZW12ZXIubHQodmVyc2lvbiwgJzAuMzQuMCcpKXtcclxuICAgICAgICAgICAgaWYgKGRpc3J1cHRpb24pe1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0KCFkaXNydXB0aW9uW1wiYnVkZ2V0c1wiXSwgXCJZb3UgY2Fubm90IHNldCBkaXNydXB0aW9uIGJ1ZGdldHMgZm9yIHRoaXMgdmVyc2lvbiBvZiBLYXJwZW50ZXIuIFBsZWFzZSB1cGdyYWRlIHRvIDAuMzQuMCBvciBoaWdoZXIuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyB2ZXJzaW9uIGNoZWNrIGVycm9ycyBmb3IgdjAuMzIuMCBhbmQgdXAgKGJldGEgQ1JEcylcclxuICAgICAgICBpZiAoc2VtdmVyLmd0ZSh2ZXJzaW9uLCAnMC4zMi4wJykpe1xyXG4gICAgICAgICAgICAvLyBDb25zb2xpZGF0aW9uIGZlYXR1cmVzIGRvbid0IGV4aXN0IGluIGJldGEgQ1JEc1xyXG4gICAgICAgICAgICBhc3NlcnQoIWNvbnNvbGlkYXRpb24gJiYgIXR0bFNlY29uZHNBZnRlckVtcHR5ICYmICF0dGxTZWNvbmRzVW50aWxFeHBpcmVkLCAnQ29uc29saWRhdGlvbiBmZWF0dXJlcyBhcmUgb25seSBhdmFpbGFibGUgZm9yIHByZXZpb3VzIHZlcnNpb25zIG9mIEthcnBlbnRlci4nKTtcclxuXHJcbiAgICAgICAgICAgIC8vIGNvbnNvbGlkYXRlQWZ0ZXIgY2Fubm90IGJlIHNldCBpZiBwb2xpY3kgaXMgc2V0IHRvIFdoZW5VbmRlcnV0aWxpemVkXHJcbiAgICAgICAgICAgIGlmIChkaXNydXB0aW9uICYmIGRpc3J1cHRpb25bXCJjb25zb2xpZGF0aW9uUG9saWN5XCJdID09IFwiV2hlblVuZGVydXRpbGl6ZWRcIil7XHJcbiAgICAgICAgICAgICAgICBhc3NlcnQoIWRpc3J1cHRpb25bXCJjb25zb2xpZGF0ZUFmdGVyXCJdLCAnWW91IGNhbm5vdCBzZXQgY29uc29saWRhdGVBZnRlciB2YWx1ZSBpZiB0aGUgY29uc29saWRhdGlvbiBwb2xpY3kgaXMgc2V0IHRvIFVuZGVydXRpbGl6ZWQuJyk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vIEFNSSBGYW1pbHksIFNlY3VyaXR5IEdyb3VwIGFuZCBTdWJuZXQgdGVybXMgbXVzdCBiZSBwcm92aWRlZCwgZ2l2ZW4gRUMyIE5vZGVTcGVjXHJcbiAgICAgICAgICAgIGlmIChlYzJOb2RlQ2xhc3NTcGVjKXtcclxuICAgICAgICAgICAgICAgIGFzc2VydChhbWlGYW1pbHkgIT09IHVuZGVmaW5lZCwgXCJQbGVhc2UgcHJvdmlkZSB0aGUgQU1JIEZhbWlseSBmb3IgeW91ciBFQzJOb2RlQ2xhc3MuXCIpO1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0KGVjMk5vZGVDbGFzc1NwZWNbXCJzZWN1cml0eUdyb3VwU2VsZWN0b3JUZXJtc1wiXSAhPT0gdW5kZWZpbmVkLCBcIlBsZWFzZSBwcm92aWRlIFNlY3VyaXR5R3JvdXBUZXJtIGZvciB5b3VyIEVDMk5vZGVDbGFzcy5cIik7XHJcbiAgICAgICAgICAgICAgICBhc3NlcnQoZWMyTm9kZUNsYXNzU3BlY1tcInN1Ym5ldFNlbGVjdG9yVGVybXNcIl0gIT09IHVuZGVmaW5lZCwgXCJQbGVhc2UgcHJvdmlkZSBzdWJuZXRHcm91cFRlcm0gZm9yIHlvdXIgRUMyTm9kZUNsYXNzLlwiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gdmVyc2lvbiBjaGVjayBlcnJvcnMgZm9yIHYwLjMxLnggYW5kIGRvd24gKGFscGhhIENSRHMpXHJcbiAgICAgICAgLy8gSW5jbHVkZXMgY2hlY2tzIGZvciBjb25zb2xpZGF0aW9uIGFuZCBkaXNydXB0aW9uIGZlYXR1cmVzXHJcbiAgICAgICAgaWYgKHNlbXZlci5sdCh2ZXJzaW9uLCAnMC4zMi4wJykpe1xyXG4gICAgICAgICAgICBpZiAoY29uc29saWRhdGlvbil7XHJcbiAgICAgICAgICAgICAgICBhc3NlcnQoIShjb25zb2xpZGF0aW9uLmVuYWJsZWQgJiYgdHRsU2Vjb25kc0FmdGVyRW1wdHkpICwgJ0NvbnNvbGlkYXRpb24gYW5kIHR0bFNlY29uZHNBZnRlckVtcHR5IG11c3QgYmUgbXV0dWFsbHkgZXhjbHVzaXZlLicpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGFzc2VydCghZGlzcnVwdGlvbiwgJ0Rpc3J1cHRpb24gY29uZmlndXJhdGlvbiBpcyBvbmx5IHN1cHBvcnRlZCBvbiB2ZXJzaW9ucyB2MC4zMi4wIGFuZCBsYXRlci4nKTtcclxuXHJcbiAgICAgICAgICAgIC8vU2VjdXJpdHkgR3JvdXAgYW5kIFN1Ym5ldCB0ZXJtcyBtdXN0IGJlIHByb3ZpZGVkLCBnaXZlbiBFQzIgTm9kZVNwZWNcclxuICAgICAgICAgICAgaWYgKGVjMk5vZGVDbGFzc1NwZWMpe1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0KGVjMk5vZGVDbGFzc1NwZWNbXCJzZWN1cml0eUdyb3VwU2VsZWN0b3JcIl0gIT09IHVuZGVmaW5lZCwgXCJQbGVhc2UgcHJvdmlkZSBTZWN1cml0eUdyb3VwVGVybSBmb3IgeW91ciBBV1NOb2RlVGVtcGxhdGUuXCIpO1xyXG4gICAgICAgICAgICAgICAgYXNzZXJ0KGVjMk5vZGVDbGFzc1NwZWNbXCJzdWJuZXRTZWxlY3RvclwiXSAhPT0gdW5kZWZpbmVkLCBcIlBsZWFzZSBwcm92aWRlIHN1Ym5ldEdyb3VwVGVybSBmb3IgeW91ciBBV1NOb2RlVGVtcGxhdGUuXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBXZSBzaG91bGQgYmxvY2sgTm9kZSBUZXJtaW5hdGlvbiBIYW5kbGVyIHVzYWdlIG9uY2UgS2FycGVudGVyIGlzIGxldmVyYWdlZFxyXG4gICAgICAgICBhc3NlcnQoIWNsdXN0ZXJJbmZvLmdldFByb3Zpc2lvbmVkQWRkT24oJ0F3c05vZGVUZXJtaW5hdGlvbkhhbmRsZXJBZGRPbicpLCAnS2FycGVudGVyIHN1cHBvcnRzIG5hdGl2ZSBpbnRlcnJ1cHRpb24gaGFuZGxpbmcsIHNvIE5vZGUgVGVybWluYXRpb24gSGFuZGxlciB3aWxsIG5vdCBiZSBuZWNlc3NhcnkuJyk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGVscGVyIGZ1bmN0aW9uIHRvIHNldCB1cCB0aGUgS2FycGVudGVyIE5vZGUgUm9sZSBhbmQgSW5zdGFuY2UgUHJvZmlsZVxyXG4gICAgICogT3V0cHV0cyB0byBDbG91ZEZvcm1hdGlvbiBhbmQgbWFwIHRoZSByb2xlIHRvIHRoZSBhd3MtYXV0aCBDb25maWdNYXBcclxuICAgICAqIEBwYXJhbSBjbHVzdGVyIEVLUyBDbHVzdGVyXHJcbiAgICAgKiBAcGFyYW0gc3RhY2tOYW1lIE5hbWUgb2YgdGhlIHN0YWNrXHJcbiAgICAgKiBAcGFyYW0gcmVnaW9uIFJlZ2lvbiBvZiB0aGUgc3RhY2tcclxuICAgICAqIEByZXR1cm5zIFtrYXJwZW50ZXJOb2RlUm9sZSwga2FycGVudGVySW5zdGFuY2VQcm9maWxlXVxyXG4gICAgICovXHJcbiAgICBwcml2YXRlIHNldFVwTm9kZVJvbGUoY2x1c3RlcjogQ2x1c3Rlciwgc3RhY2tOYW1lOiBzdHJpbmcsIHJlZ2lvbjogc3RyaW5nKTogW2lhbS5Sb2xlLCBpYW0uQ2ZuSW5zdGFuY2VQcm9maWxlXSB7XHJcbiAgICAgICAgLy8gU2V0IHVwIE5vZGUgUm9sZVxyXG4gICAgICAgIGNvbnN0IGthcnBlbnRlck5vZGVSb2xlID0gbmV3IGlhbS5Sb2xlKGNsdXN0ZXIsICdrYXJwZW50ZXItbm9kZS1yb2xlJywge1xyXG4gICAgICAgICAgICBhc3N1bWVkQnk6IG5ldyBpYW0uU2VydmljZVByaW5jaXBhbChgZWMyLiR7Y2x1c3Rlci5zdGFjay51cmxTdWZmaXh9YCksXHJcbiAgICAgICAgICAgIG1hbmFnZWRQb2xpY2llczogW1xyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwiQW1hem9uRUtTV29ya2VyTm9kZVBvbGljeVwiKSxcclxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFtYXpvbkVLU19DTklfUG9saWN5XCIpLFxyXG4gICAgICAgICAgICAgICAgaWFtLk1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwiQW1hem9uRUMyQ29udGFpbmVyUmVnaXN0cnlSZWFkT25seVwiKSxcclxuICAgICAgICAgICAgICAgIGlhbS5NYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFtYXpvblNTTU1hbmFnZWRJbnN0YW5jZUNvcmVcIiksXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIC8vcm9sZU5hbWU6IGBLYXJwZW50ZXJOb2RlUm9sZS0ke25hbWV9YCAvLyBsZXQgcm9sZSBuYW1lIHRvIGJlIGdlbmVyYXRlZCBhcyB1bmlxdWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gQXR0YWNoIGlwdjYgcmVsYXRlZCBwb2xpY2llcyBiYXNlZCBvbiBjbHVzdGVyIElQRmFtaWx5XHJcbiAgICAgICAgaWYgKGNsdXN0ZXIuaXBGYW1pbHkgPT09IElwRmFtaWx5LklQX1Y2KXtcclxuICAgICAgICAgICAgY29uc3Qgbm9kZUlwdjZQb2xpY3kgPSBuZXcgaWFtLlBvbGljeShjbHVzdGVyLCAna2FycGVudGVyLW5vZGUtSXB2Ni1Qb2xpY3knLCB7XHJcbiAgICAgICAgICAgICAgICBkb2N1bWVudDogdXRpbHMuZ2V0RUtTTm9kZUlwdjZQb2xpY3lEb2N1bWVudCgpIH0pO1xyXG4gICAgICAgICAgICBrYXJwZW50ZXJOb2RlUm9sZS5hdHRhY2hJbmxpbmVQb2xpY3kobm9kZUlwdjZQb2xpY3kpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gU2V0IHVwIEluc3RhbmNlIFByb2ZpbGVcclxuICAgICAgICBjb25zdCBpbnN0YW5jZVByb2ZpbGVOYW1lID0gbWQ1Lk1kNS5oYXNoU3RyKHN0YWNrTmFtZStyZWdpb24pO1xyXG4gICAgICAgIGNvbnN0IGthcnBlbnRlckluc3RhbmNlUHJvZmlsZSA9IG5ldyBpYW0uQ2ZuSW5zdGFuY2VQcm9maWxlKGNsdXN0ZXIsICdrYXJwZW50ZXItaW5zdGFuY2UtcHJvZmlsZScsIHtcclxuICAgICAgICAgICAgcm9sZXM6IFtrYXJwZW50ZXJOb2RlUm9sZS5yb2xlTmFtZV0sXHJcbiAgICAgICAgICAgIGluc3RhbmNlUHJvZmlsZU5hbWU6IGBLYXJwZW50ZXJOb2RlSW5zdGFuY2VQcm9maWxlLSR7aW5zdGFuY2VQcm9maWxlTmFtZX1gLFxyXG4gICAgICAgICAgICBwYXRoOiAnLydcclxuICAgICAgICB9KTtcclxuICAgICAgICBrYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGUubm9kZS5hZGREZXBlbmRlbmN5KGthcnBlbnRlck5vZGVSb2xlKTtcclxuXHJcbiAgICAgICAgY29uc3QgY2x1c3RlcklkID0gTmFtZXMudW5pcXVlSWQoY2x1c3Rlcik7XHJcblxyXG4gICAgICAgIC8vQ2ZuIG91dHB1dCBmb3IgTm9kZSBSb2xlIGluIGNhc2Ugb2YgbmVlZGluZyB0byBhZGQgYWRkaXRpb25hbCBwb2xpY2llc1xyXG4gICAgICAgIG5ldyBDZm5PdXRwdXQoY2x1c3Rlci5zdGFjaywgJ0thcnBlbnRlciBJbnN0YW5jZSBOb2RlIFJvbGUnLCB7XHJcbiAgICAgICAgICAgIHZhbHVlOiBrYXJwZW50ZXJOb2RlUm9sZS5yb2xlTmFtZSxcclxuICAgICAgICAgICAgZGVzY3JpcHRpb246IFwiS2FycGVudGVyIGFkZC1vbiBOb2RlIFJvbGUgbmFtZVwiLFxyXG4gICAgICAgICAgICBleHBvcnROYW1lOiBjbHVzdGVySWQrXCJLYXJwZW50ZXJOb2RlUm9sZU5hbWVcIixcclxuICAgICAgICB9KTtcclxuICAgICAgICAvL0NmbiBvdXRwdXQgZm9yIEluc3RhbmNlIFByb2ZpbGUgZm9yIGNyZWF0aW5nIGFkZGl0aW9uYWwgcHJvdmlzaW9uZXJzXHJcbiAgICAgICAgbmV3IENmbk91dHB1dChjbHVzdGVyLnN0YWNrLCAnS2FycGVudGVyIEluc3RhbmNlIFByb2ZpbGUgbmFtZScsIHtcclxuICAgICAgICAgICAgdmFsdWU6IGthcnBlbnRlckluc3RhbmNlUHJvZmlsZSA/IGthcnBlbnRlckluc3RhbmNlUHJvZmlsZS5pbnN0YW5jZVByb2ZpbGVOYW1lISA6IFwibm9uZVwiLFxyXG4gICAgICAgICAgICBkZXNjcmlwdGlvbjogXCJLYXJwZW50ZXIgYWRkLW9uIEluc3RhbmNlIFByb2ZpbGUgbmFtZVwiLFxyXG4gICAgICAgICAgICBleHBvcnROYW1lOiBjbHVzdGVySWQrXCJLYXJwZW50ZXJJbnN0YW5jZVByb2ZpbGVOYW1lXCIsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIE1hcCBOb2RlIFJvbGUgdG8gYXdzLWF1dGhcclxuICAgICAgICBjbHVzdGVyLmF3c0F1dGguYWRkUm9sZU1hcHBpbmcoa2FycGVudGVyTm9kZVJvbGUsIHtcclxuICAgICAgICAgICAgZ3JvdXBzOiBbJ3N5c3RlbTpib290c3RyYXBwZXJzJywgJ3N5c3RlbTpub2RlcyddLFxyXG4gICAgICAgICAgICB1c2VybmFtZTogJ3N5c3RlbTpub2RlOnt7RUMyUHJpdmF0ZUROU05hbWV9fSdcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFtrYXJwZW50ZXJOb2RlUm9sZSwga2FycGVudGVySW5zdGFuY2VQcm9maWxlXTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEhlbHBlciBmdW5jdGlvbiB0byBjaGVjayB3aGV0aGVyOlxyXG4gICAgICogMS4gU3VwcG9ydGVkIEthcnBlbnRlciB2ZXJzaW9ucyBhcmUgaW1wbGVtZW50ZWQsIGFuZFxyXG4gICAgICogMi4gU3VwcG9ydGVkIEt1YmVybmV0ZXMgdmVyc2lvbnMgYXJlIGRlcGxveWVkIG9uIHRoZSBjbHVzdGVyIHRvIHVzZSBLYXJwZW50ZXJcclxuICAgICAqIEl0IHdpbGwgcmVqZWN0IHRoZSBhZGRvbiBpZiB0aGUgY2x1c3RlciB1c2VzIGRlcHJlY2F0ZWQgS3ViZXJuZXRlcyB2ZXJzaW9uLCBhbmRcclxuICAgICAqIFdhcm4gdXNlcnMgYWJvdXQgaXNzdWVzIGlmIGluY29tcGF0aWJsZSBLYXJwZW50ZXIgdmVyc2lvbiBpcyB1c2VkIGZvciBhIHBhcnRpY3VsYXIgY2x1c3RlclxyXG4gICAgICogZ2l2ZW4gaXRzIEt1YmVybmV0ZXMgdmVyc2lvblxyXG4gICAgICogQHBhcmFtIGthcnBlbnRlclZlcnNpb24gS2FycGVudGVyIHZlcnNpb24gdG8gYmUgZGVwbG95ZWRcclxuICAgICAqIEBwYXJhbSBrdWJlVmVyc2lvbiBDbHVzdGVyJ3MgS3ViZXJuZXRlcyB2ZXJzaW9uXHJcbiAgICAgKi9cclxuICAgIHByaXZhdGUgaXNDb21wYXRpYmxlKGthcnBlbnRlclZlcnNpb246IHN0cmluZywga3ViZVZlcnNpb246IEt1YmVybmV0ZXNWZXJzaW9uKTogdm9pZCB7XHJcbiAgICAgICAgYXNzZXJ0KHZlcnNpb25NYXAuaGFzKGt1YmVWZXJzaW9uKSwgJ1BsZWFzZSB1cGdyYWRlIHlvdXIgRUtTIEt1YmVybmV0ZXMgdmVyc2lvbiB0byBzdGFydCB1c2luZyBLYXJwZW50ZXIuJyk7XHJcbiAgICAgICAgYXNzZXJ0KHNlbXZlci5ndGUoa2FycGVudGVyVmVyc2lvbiwgJzAuMjEuMCcpLCAnUGxlYXNlIHVzZSBLYXJwZW50ZXIgdmVyc2lvbiAwLjIxLjAgb3IgYWJvdmUuJyk7XHJcbiAgICAgICAgY29uc3QgY29tcGF0aWJsZVZlcnNpb24gPSB2ZXJzaW9uTWFwLmdldChrdWJlVmVyc2lvbikgYXMgc3RyaW5nO1xyXG4gICAgICAgIGlmIChzZW12ZXIuZ3QoY29tcGF0aWJsZVZlcnNpb24sIGthcnBlbnRlclZlcnNpb24pKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgUGxlYXNlIHVzZSBtaW5pbXVtIEthcnBlbnRlciB2ZXJzaW9uIGZvciB0aGlzIEt1YmVybmV0ZXMgVmVyc2lvbjogJHtjb21wYXRpYmxlVmVyc2lvbn0sIG90aGVyd2lzZSB5b3Ugd2lsbCBydW4gaW50byBjb21wYXRpYmlsaXR5IGlzc3Vlcy5gKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuIl19