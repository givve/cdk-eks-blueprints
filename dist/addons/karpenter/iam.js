"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarpenterControllerPolicyV1 = exports.KarpenterControllerPolicyBeta = exports.KarpenterControllerPolicy = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
// IAM Policy for Alpha CRD Karpenter addons
exports.KarpenterControllerPolicy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                // Write Operations
                "ec2:CreateLaunchTemplate",
                "ec2:CreateFleet",
                "ec2:RunInstances",
                "ec2:CreateTags",
                "ec2:TerminateInstances",
                "ec2:DeleteLaunchTemplate",
                // Read Operations
                "ec2:DescribeLaunchTemplates",
                "ec2:DescribeInstances",
                "ec2:DescribeSecurityGroups",
                "ec2:DescribeSubnets",
                "ec2:DescribeImages",
                "ec2:DescribeInstanceTypes",
                "ec2:DescribeInstanceTypeOfferings",
                "ec2:DescribeAvailabilityZones",
                "ec2:DescribeSpotPriceHistory",
                "ssm:GetParameter",
                "pricing:GetProducts",
            ],
            "Resource": "*"
        }
    ]
};
// IAM Policy for Beta CRD Karpenter addons
const KarpenterControllerPolicyBeta = (cluster, partition, region) => {
    const condition1 = new aws_cdk_lib_1.CfnJson(cluster.stack, 'condition-owned-request-tag', {
        value: {
            [`aws:RequestTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned"
        },
    });
    const condition2 = new aws_cdk_lib_1.CfnJson(cluster.stack, 'condition-owned-resource-tag', {
        value: {
            [`aws:ResourceTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned"
        },
    });
    const condition3 = new aws_cdk_lib_1.CfnJson(cluster.stack, 'condition-owned-request-tag-topology', {
        value: {
            [`aws:RequestTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned",
            "aws:RequestTag/topology.kubernetes.io/region": `${region}`
        },
    });
    const condition4 = new aws_cdk_lib_1.CfnJson(cluster.stack, 'condition-request-resource-tags', {
        value: {
            [`aws:ResourceTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned",
            [`aws:RequestTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned",
            "aws:ResourceTag/topology.kubernetes.io/region": `${region}`,
            "aws:RequestTag/topology.kubernetes.io/region": `${region}`
        }
    });
    const condition5 = new aws_cdk_lib_1.CfnJson(cluster.stack, 'condition-owned-resource-tag-topology', {
        value: {
            [`aws:ResourceTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned",
            "aws:ResourceTag/topology.kubernetes.io/region": `${region}`
        }
    });
    const condition6 = new aws_cdk_lib_1.CfnJson(cluster.stack, 'condition-owned-cluster-tag-ec2-actions', {
        value: {
            [`aws:RequestTag/kubernetes.io/cluster/${cluster.clusterName}`]: "owned",
            "ec2:CreateAction": ["RunInstances", "CreateFleet", "CreateLaunchTemplate"]
        },
    });
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "AllowScopedEC2InstanceActions",
                "Effect": "Allow",
                "Resource": [
                    `arn:${partition}:ec2:${region}::image/*`,
                    `arn:${partition}:ec2:${region}::snapshot/*`,
                    `arn:${partition}:ec2:${region}:*:spot-instances-request/*`,
                    `arn:${partition}:ec2:${region}:*:security-group/*`,
                    `arn:${partition}:ec2:${region}:*:subnet/*`,
                    `arn:${partition}:ec2:${region}:*:launch-template/*`
                ],
                "Action": [
                    "ec2:RunInstances",
                    "ec2:CreateFleet"
                ]
            },
            {
                "Sid": "AllowScopedEC2InstanceActionsWithTags",
                "Effect": "Allow",
                "Resource": [
                    `arn:${partition}:ec2:${region}:*:fleet/*`,
                    `arn:${partition}:ec2:${region}:*:instance/*`,
                    `arn:${partition}:ec2:${region}:*:volume/*`,
                    `arn:${partition}:ec2:${region}:*:network-interface/*`,
                    `arn:${partition}:ec2:${region}:*:launch-template/*`,
                    `arn:${partition}:ec2:${region}:*:spot-instances-request/*`
                ],
                "Action": [
                    "ec2:RunInstances",
                    "ec2:CreateFleet",
                    "ec2:CreateLaunchTemplate"
                ],
                "Condition": {
                    "StringEquals": condition1,
                    "StringLike": {
                        "aws:RequestTag/karpenter.sh/nodepool": "*"
                    }
                },
            },
            {
                "Sid": "AllowScopedResourceCreationTagging",
                "Effect": "Allow",
                "Resource": [
                    `arn:${partition}:ec2:${region}:*:fleet/*`,
                    `arn:${partition}:ec2:${region}:*:instance/*`,
                    `arn:${partition}:ec2:${region}:*:volume/*`,
                    `arn:${partition}:ec2:${region}:*:network-interface/*`,
                    `arn:${partition}:ec2:${region}:*:launch-template/*`,
                    `arn:${partition}:ec2:${region}:*:spot-instances-request/*`
                ],
                "Action": "ec2:CreateTags",
                "Condition": {
                    "StringEquals": condition6,
                    "StringLike": {
                        "aws:RequestTag/karpenter.sh/nodepool": "*"
                    }
                }
            },
            {
                "Sid": "AllowScopedResourceTagging",
                "Effect": "Allow",
                "Resource": `arn:${partition}:ec2:${region}:*:instance/*`,
                "Action": "ec2:CreateTags",
                "Condition": {
                    "StringEquals": condition2,
                    "StringLike": {
                        "aws:ResourceTag/karpenter.sh/nodepool": "*"
                    },
                    "ForAllValues:StringEquals": {
                        "aws:TagKeys": [
                            "karpenter.sh/nodeclaim",
                            "Name"
                        ]
                    }
                }
            },
            {
                "Sid": "AllowScopedDeletion",
                "Effect": "Allow",
                "Resource": [
                    `arn:${partition}:ec2:${region}:*:instance/*`,
                    `arn:${partition}:ec2:${region}:*:launch-template/*`
                ],
                "Action": [
                    "ec2:TerminateInstances",
                    "ec2:DeleteLaunchTemplate"
                ],
                "Condition": {
                    "StringEquals": condition2,
                    "StringLike": {
                        "aws:ResourceTag/karpenter.sh/nodepool": "*"
                    }
                }
            },
            {
                "Sid": "AllowRegionalReadActions",
                "Effect": "Allow",
                "Resource": "*",
                "Action": [
                    "ec2:DescribeAvailabilityZones",
                    "ec2:DescribeImages",
                    "ec2:DescribeInstances",
                    "ec2:DescribeInstanceTypeOfferings",
                    "ec2:DescribeInstanceTypes",
                    "ec2:DescribeLaunchTemplates",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeSpotPriceHistory",
                    "ec2:DescribeSubnets"
                ],
                "Condition": {
                    "StringEquals": {
                        "aws:RequestedRegion": `${region}`
                    }
                }
            },
            {
                "Sid": "AllowSSMReadActions",
                "Effect": "Allow",
                "Resource": `arn:${partition}:ssm:${region}::parameter/aws/service/*`,
                "Action": "ssm:GetParameter"
            },
            {
                "Sid": "AllowPricingReadActions",
                "Effect": "Allow",
                "Resource": "*",
                "Action": "pricing:GetProducts"
            },
            {
                "Sid": "AllowScopedInstanceProfileCreationActions",
                "Effect": "Allow",
                "Resource": "*",
                "Action": [
                    "iam:CreateInstanceProfile"
                ],
                "Condition": {
                    "StringEquals": condition3,
                    "StringLike": {
                        "aws:RequestTag/karpenter.k8s.aws/ec2nodeclass": "*"
                    }
                }
            },
            {
                "Sid": "AllowScopedInstanceProfileTagActions",
                "Effect": "Allow",
                "Resource": "*",
                "Action": [
                    "iam:TagInstanceProfile"
                ],
                "Condition": {
                    "StringEquals": condition4,
                    "StringLike": {
                        "aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass": "*",
                        "aws:RequestTag/karpenter.k8s.aws/ec2nodeclass": "*"
                    }
                }
            },
            {
                "Sid": "AllowScopedInstanceProfileActions",
                "Effect": "Allow",
                "Resource": "*",
                "Action": [
                    "iam:AddRoleToInstanceProfile",
                    "iam:RemoveRoleFromInstanceProfile",
                    "iam:DeleteInstanceProfile"
                ],
                "Condition": {
                    "StringEquals": condition5,
                    "StringLike": {
                        "aws:ResourceTag/karpenter.k8s.aws/ec2nodeclass": "*"
                    }
                }
            },
            {
                "Sid": "AllowInstanceProfileReadActions",
                "Effect": "Allow",
                "Resource": "*",
                "Action": [
                    "iam:GetInstanceProfile",
                    "iam:ListInstanceProfiles"
                ]
            },
            {
                "Sid": "AllowAPIServerEndpointDiscovery",
                "Effect": "Allow",
                "Resource": `${cluster.clusterArn}`,
                "Action": "eks:DescribeCluster"
            }
        ]
    };
};
exports.KarpenterControllerPolicyBeta = KarpenterControllerPolicyBeta;
exports.KarpenterControllerPolicyV1 = exports.KarpenterControllerPolicyBeta;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkZG9ucy9rYXJwZW50ZXIvaWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUFzQztBQUd0Qyw0Q0FBNEM7QUFDL0IsUUFBQSx5QkFBeUIsR0FBRztJQUNyQyxTQUFTLEVBQUUsWUFBWTtJQUN2QixXQUFXLEVBQUU7UUFDVDtZQUNJLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLFFBQVEsRUFBRTtnQkFDVixtQkFBbUI7Z0JBQ2YsMEJBQTBCO2dCQUMxQixpQkFBaUI7Z0JBQ2pCLGtCQUFrQjtnQkFDbEIsZ0JBQWdCO2dCQUNoQix3QkFBd0I7Z0JBQ3hCLDBCQUEwQjtnQkFDOUIsa0JBQWtCO2dCQUNkLDZCQUE2QjtnQkFDN0IsdUJBQXVCO2dCQUN2Qiw0QkFBNEI7Z0JBQzVCLHFCQUFxQjtnQkFDckIsb0JBQW9CO2dCQUNwQiwyQkFBMkI7Z0JBQzNCLG1DQUFtQztnQkFDbkMsK0JBQStCO2dCQUMvQiw4QkFBOEI7Z0JBQzlCLGtCQUFrQjtnQkFDbEIscUJBQXFCO2FBQ3hCO1lBQ0QsVUFBVSxFQUFFLEdBQUc7U0FDbEI7S0FDSjtDQUNKLENBQUM7QUFFRiwyQ0FBMkM7QUFDcEMsTUFBTSw2QkFBNkIsR0FBRyxDQUFDLE9BQWdCLEVBQUUsU0FBaUIsRUFBRSxNQUFjLEVBQUUsRUFBRTtJQUNqRyxNQUFNLFVBQVUsR0FBRyxJQUFJLHFCQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSw2QkFBNkIsRUFBRTtRQUN6RSxLQUFLLEVBQUU7WUFDSCxDQUFDLHdDQUF3QyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsRUFBRSxPQUFPO1NBQzNFO0tBQ0osQ0FBQyxDQUFDO0lBQ0gsTUFBTSxVQUFVLEdBQUcsSUFBSSxxQkFBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsOEJBQThCLEVBQUU7UUFDMUUsS0FBSyxFQUFFO1lBQ0gsQ0FBQyx5Q0FBeUMsT0FBTyxD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LCtDQUErQyxFQUFFLEdBQUc7cUJBQ3ZEO2lCQUNKO2FBQ0o7WUFDRDtnQkFDSSxLQUFLLEVBQUUsbUNBQW1DO2dCQUMxQyxRQUFRLEVBQUUsT0FBTztnQkFDakIsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsUUFBUSxFQUFFO29CQUNOLDhCQUE4QjtvQkFDOUIsbUNBQW1DO29CQUNuQywyQkFBMkI7aUJBQzlCO2dCQUNELFdBQVcsRUFBRTtvQkFDVCxjQUFjLEVBQUUsVUFBVTtvQkFDMUIsWUFBWSxFQUFFO3dCQUNWLGdEQUFnRCxFQUFFLEdBQUc7cUJBQ3hEO2lCQUNKO2FBQ0o7WUFDRDtnQkFDSSxLQUFLLEVBQUUsaUNBQWlDO2dCQUN4QyxRQUFRLEVBQUUsT0FBTztnQkFDakIsVUFBVSxFQUFFLEdBQUc7Z0JBQ2YsUUFBUSxFQUFFO29CQUNOLHdCQUF3QjtvQkFDeEIsMEJBQTBCO2lCQUM3QjthQUNKO1lBQ0Q7Z0JBQ0ksS0FBSyxFQUFFLGlDQUFpQztnQkFDeEMsUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFVBQVUsRUFBRSxHQUFHLE9BQU8sQ0FBQyxVQUFVLEVBQUU7Z0JBQ25DLFFBQVEsRUFBRSxxQkFBcUI7YUFDbEM7U0FDSjtLQUNKLENBQUM7QUFDTixDQUFDLENBQUM7QUF2T1csUUFBQSw2QkFBNkIsaUNBdU94QztBQUVXLFFBQUEsMkJBQTJCLEdBQUcscUNBQTZCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDZm5Kc29uIH0gZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCB7IENsdXN0ZXIgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5cclxuLy8gSUFNIFBvbGljeSBmb3IgQWxwaGEgQ1JEIEthcnBlbnRlciBhZGRvbnNcclxuZXhwb3J0IGNvbnN0IEthcnBlbnRlckNvbnRyb2xsZXJQb2xpY3kgPSB7XHJcbiAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXHJcbiAgICBcIlN0YXRlbWVudFwiOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgLy8gV3JpdGUgT3BlcmF0aW9uc1xyXG4gICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlTGF1bmNoVGVtcGxhdGVcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkNyZWF0ZUZsZWV0XCIsXHJcbiAgICAgICAgICAgICAgICBcImVjMjpSdW5JbnN0YW5jZXNcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkNyZWF0ZVRhZ3NcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOlRlcm1pbmF0ZUluc3RhbmNlc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJlYzI6RGVsZXRlTGF1bmNoVGVtcGxhdGVcIixcclxuICAgICAgICAgICAgLy8gUmVhZCBPcGVyYXRpb25zXHJcbiAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUxhdW5jaFRlbXBsYXRlc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVJbnN0YW5jZXNcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlU2VjdXJpdHlHcm91cHNcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlU3VibmV0c1wiLFxyXG4gICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVJbWFnZXNcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlSW5zdGFuY2VUeXBlc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVJbnN0YW5jZVR5cGVPZmZlcmluZ3NcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlQXZhaWxhYmlsaXR5Wm9uZXNcIixcclxuICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlU3BvdFByaWNlSGlzdG9yeVwiLFxyXG4gICAgICAgICAgICAgICAgXCJzc206R2V0UGFyYW1ldGVyXCIsXHJcbiAgICAgICAgICAgICAgICBcInByaWNpbmc6R2V0UHJvZHVjdHNcIixcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxyXG4gICAgICAgIH1cclxuICAgIF1cclxufTtcclxuXHJcbi8vIElBTSBQb2xpY3kgZm9yIEJldGEgQ1JEIEthcnBlbnRlciBhZGRvbnNcclxuZXhwb3J0IGNvbnN0IEthcnBlbnRlckNvbnRyb2xsZXJQb2xpY3lCZXRhID0gKGNsdXN0ZXI6IENsdXN0ZXIsIHBhcnRpdGlvbjogc3RyaW5nLCByZWdpb246IHN0cmluZykgPT4ge1xyXG4gICAgY29uc3QgY29uZGl0aW9uMSA9IG5ldyBDZm5Kc29uKGNsdXN0ZXIuc3RhY2ssICdjb25kaXRpb24tb3duZWQtcmVxdWVzdC10YWcnLCB7XHJcbiAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgW2Bhd3M6UmVxdWVzdFRhZy9rdWJlcm5ldGVzLmlvL2NsdXN0ZXIvJHtjbHVzdGVyLmNsdXN0ZXJOYW1lfWBdOiBcIm93bmVkXCJcclxuICAgICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBjb25kaXRpb24yID0gbmV3IENmbkpzb24oY2x1c3Rlci5zdGFjaywgJ2NvbmRpdGlvbi1vd25lZC1yZXNvdXJjZS10YWcnLCB7XHJcbiAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgW2Bhd3M6UmVzb3VyY2VUYWcva3ViZXJuZXRlcy5pby9jbHVzdGVyLyR7Y2x1c3Rlci5jbHVzdGVyTmFtZX1gXTogXCJvd25lZFwiXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG4gICAgY29uc3QgY29uZGl0aW9uMyA9IG5ldyBDZm5Kc29uKGNsdXN0ZXIuc3RhY2ssICdjb25kaXRpb24tb3duZWQtcmVxdWVzdC10YWctdG9wb2xvZ3knLCB7XHJcbiAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgW2Bhd3M6UmVxdWVzdFRhZy9rdWJlcm5ldGVzLmlvL2NsdXN0ZXIvJHtjbHVzdGVyLmNsdXN0ZXJOYW1lfWBdOiBcIm93bmVkXCIsXHJcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RUYWcvdG9wb2xvZ3kua3ViZXJuZXRlcy5pby9yZWdpb25cIjogYCR7cmVnaW9ufWBcclxuICAgICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBjb25kaXRpb240ID0gbmV3IENmbkpzb24oY2x1c3Rlci5zdGFjaywgJ2NvbmRpdGlvbi1yZXF1ZXN0LXJlc291cmNlLXRhZ3MnLCB7XHJcbiAgICAgICAgdmFsdWU6IHtcclxuICAgICAgICAgICAgW2Bhd3M6UmVzb3VyY2VUYWcva3ViZXJuZXRlcy5pby9jbHVzdGVyLyR7Y2x1c3Rlci5jbHVzdGVyTmFtZX1gXTogXCJvd25lZFwiLFxyXG4gICAgICAgICAgICBbYGF3czpSZXF1ZXN0VGFnL2t1YmVybmV0ZXMuaW8vY2x1c3Rlci8ke2NsdXN0ZXIuY2x1c3Rlck5hbWV9YF06IFwib3duZWRcIixcclxuICAgICAgICAgICAgXCJhd3M6UmVzb3VyY2VUYWcvdG9wb2xvZ3kua3ViZXJuZXRlcy5pby9yZWdpb25cIjogYCR7cmVnaW9ufWAsXHJcbiAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RUYWcvdG9wb2xvZ3kua3ViZXJuZXRlcy5pby9yZWdpb25cIjogYCR7cmVnaW9ufWBcclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuICAgIGNvbnN0IGNvbmRpdGlvbjUgPSBuZXcgQ2ZuSnNvbihjbHVzdGVyLnN0YWNrLCAnY29uZGl0aW9uLW93bmVkLXJlc291cmNlLXRhZy10b3BvbG9neScsIHtcclxuICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICBbYGF3czpSZXNvdXJjZVRhZy9rdWJlcm5ldGVzLmlvL2NsdXN0ZXIvJHtjbHVzdGVyLmNsdXN0ZXJOYW1lfWBdOiBcIm93bmVkXCIsXHJcbiAgICAgICAgICAgIFwiYXdzOlJlc291cmNlVGFnL3RvcG9sb2d5Lmt1YmVybmV0ZXMuaW8vcmVnaW9uXCI6IGAke3JlZ2lvbn1gXHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcbiAgICBjb25zdCBjb25kaXRpb242ID0gbmV3IENmbkpzb24oY2x1c3Rlci5zdGFjaywgJ2NvbmRpdGlvbi1vd25lZC1jbHVzdGVyLXRhZy1lYzItYWN0aW9ucycsIHtcclxuICAgICAgICB2YWx1ZToge1xyXG4gICAgICAgICAgICBbYGF3czpSZXF1ZXN0VGFnL2t1YmVybmV0ZXMuaW8vY2x1c3Rlci8ke2NsdXN0ZXIuY2x1c3Rlck5hbWV9YF06IFwib3duZWRcIixcclxuICAgICAgICAgICAgXCJlYzI6Q3JlYXRlQWN0aW9uXCI6IFtcIlJ1bkluc3RhbmNlc1wiLCBcIkNyZWF0ZUZsZWV0XCIsIFwiQ3JlYXRlTGF1bmNoVGVtcGxhdGVcIl1cclxuICAgICAgICB9LFxyXG4gICAgfSk7XHJcbiAgICBcclxuXHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICBcIlN0YXRlbWVudFwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiU2lkXCI6IFwiQWxsb3dTY29wZWRFQzJJbnN0YW5jZUFjdGlvbnNcIixcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06OmltYWdlLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06OnNuYXBzaG90LypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjpzcG90LWluc3RhbmNlcy1yZXF1ZXN0LypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjpzZWN1cml0eS1ncm91cC8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6c3VibmV0LypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjpsYXVuY2gtdGVtcGxhdGUvKmBcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6UnVuSW5zdGFuY2VzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlRmxlZXRcIlxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIlNpZFwiOiBcIkFsbG93U2NvcGVkRUMySW5zdGFuY2VBY3Rpb25zV2l0aFRhZ3NcIixcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjpmbGVldC8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6aW5zdGFuY2UvKmAsXHJcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3BhcnRpdGlvbn06ZWMyOiR7cmVnaW9ufToqOnZvbHVtZS8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6bmV0d29yay1pbnRlcmZhY2UvKmAsXHJcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3BhcnRpdGlvbn06ZWMyOiR7cmVnaW9ufToqOmxhdW5jaC10ZW1wbGF0ZS8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6c3BvdC1pbnN0YW5jZXMtcmVxdWVzdC8qYFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpSdW5JbnN0YW5jZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpDcmVhdGVGbGVldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkNyZWF0ZUxhdW5jaFRlbXBsYXRlXCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdFcXVhbHNcIjogY29uZGl0aW9uMSxcclxuICAgICAgICAgICAgICAgICAgICBcIlN0cmluZ0xpa2VcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpSZXF1ZXN0VGFnL2thcnBlbnRlci5zaC9ub2RlcG9vbFwiOiBcIipcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiU2lkXCI6IFwiQWxsb3dTY29wZWRSZXNvdXJjZUNyZWF0aW9uVGFnZ2luZ1wiLFxyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3BhcnRpdGlvbn06ZWMyOiR7cmVnaW9ufToqOmZsZWV0LypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjppbnN0YW5jZS8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6dm9sdW1lLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjpuZXR3b3JrLWludGVyZmFjZS8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6bGF1bmNoLXRlbXBsYXRlLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVjMjoke3JlZ2lvbn06KjpzcG90LWluc3RhbmNlcy1yZXF1ZXN0LypgXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogXCJlYzI6Q3JlYXRlVGFnc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJDb25kaXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IGNvbmRpdGlvbjYsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVxdWVzdFRhZy9rYXJwZW50ZXIuc2gvbm9kZXBvb2xcIjogXCIqXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiU2lkXCI6IFwiQWxsb3dTY29wZWRSZXNvdXJjZVRhZ2dpbmdcIixcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogYGFybjoke3BhcnRpdGlvbn06ZWMyOiR7cmVnaW9ufToqOmluc3RhbmNlLypgLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogXCJlYzI6Q3JlYXRlVGFnc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJDb25kaXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IGNvbmRpdGlvbjIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVzb3VyY2VUYWcva2FycGVudGVyLnNoL25vZGVwb29sXCI6IFwiKlwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBcIkZvckFsbFZhbHVlczpTdHJpbmdFcXVhbHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpUYWdLZXlzXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwia2FycGVudGVyLnNoL25vZGVjbGFpbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJOYW1lXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJTaWRcIjogXCJBbGxvd1Njb3BlZERlbGV0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplYzI6JHtyZWdpb259Oio6aW5zdGFuY2UvKmAsXHJcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3BhcnRpdGlvbn06ZWMyOiR7cmVnaW9ufToqOmxhdW5jaC10ZW1wbGF0ZS8qYFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpUZXJtaW5hdGVJbnN0YW5jZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZWxldGVMYXVuY2hUZW1wbGF0ZVwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJDb25kaXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IGNvbmRpdGlvbjIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVzb3VyY2VUYWcva2FycGVudGVyLnNoL25vZGVwb29sXCI6IFwiKlwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIlNpZFwiOiBcIkFsbG93UmVnaW9uYWxSZWFkQWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUF2YWlsYWJpbGl0eVpvbmVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVJbWFnZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUluc3RhbmNlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlSW5zdGFuY2VUeXBlT2ZmZXJpbmdzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVJbnN0YW5jZVR5cGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVMYXVuY2hUZW1wbGF0ZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZVNlY3VyaXR5R3JvdXBzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVTcG90UHJpY2VIaXN0b3J5XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVTdWJuZXRzXCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdFcXVhbHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpSZXF1ZXN0ZWRSZWdpb25cIjogYCR7cmVnaW9ufWBcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiU2lkXCI6IFwiQWxsb3dTU01SZWFkQWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBgYXJuOiR7cGFydGl0aW9ufTpzc206JHtyZWdpb259OjpwYXJhbWV0ZXIvYXdzL3NlcnZpY2UvKmAsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBcInNzbTpHZXRQYXJhbWV0ZXJcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIlNpZFwiOiBcIkFsbG93UHJpY2luZ1JlYWRBY3Rpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogXCJwcmljaW5nOkdldFByb2R1Y3RzXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJTaWRcIjogXCJBbGxvd1Njb3BlZEluc3RhbmNlUHJvZmlsZUNyZWF0aW9uQWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImlhbTpDcmVhdGVJbnN0YW5jZVByb2ZpbGVcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIlN0cmluZ0VxdWFsc1wiOiBjb25kaXRpb24zLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RUYWcva2FycGVudGVyLms4cy5hd3MvZWMybm9kZWNsYXNzXCI6IFwiKlwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIlNpZFwiOiBcIkFsbG93U2NvcGVkSW5zdGFuY2VQcm9maWxlVGFnQWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImlhbTpUYWdJbnN0YW5jZVByb2ZpbGVcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIlN0cmluZ0VxdWFsc1wiOiBjb25kaXRpb240LFxyXG4gICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nTGlrZVwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXdzOlJlc291cmNlVGFnL2thcnBlbnRlci5rOHMuYXdzL2VjMm5vZGVjbGFzc1wiOiBcIipcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVxdWVzdFRhZy9rYXJwZW50ZXIuazhzLmF3cy9lYzJub2RlY2xhc3NcIjogXCIqXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiU2lkXCI6IFwiQWxsb3dTY29wZWRJbnN0YW5jZVByb2ZpbGVBY3Rpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiaWFtOkFkZFJvbGVUb0luc3RhbmNlUHJvZmlsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWFtOlJlbW92ZVJvbGVGcm9tSW5zdGFuY2VQcm9maWxlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpYW06RGVsZXRlSW5zdGFuY2VQcm9maWxlXCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdFcXVhbHNcIjogY29uZGl0aW9uNSxcclxuICAgICAgICAgICAgICAgICAgICBcIlN0cmluZ0xpa2VcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpSZXNvdXJjZVRhZy9rYXJwZW50ZXIuazhzLmF3cy9lYzJub2RlY2xhc3NcIjogXCIqXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiU2lkXCI6IFwiQWxsb3dJbnN0YW5jZVByb2ZpbGVSZWFkQWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImlhbTpHZXRJbnN0YW5jZVByb2ZpbGVcIiwgXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpYW06TGlzdEluc3RhbmNlUHJvZmlsZXNcIlxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIlNpZFwiOiBcIkFsbG93QVBJU2VydmVyRW5kcG9pbnREaXNjb3ZlcnlcIixcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogYCR7Y2x1c3Rlci5jbHVzdGVyQXJufWAsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBcImVrczpEZXNjcmliZUNsdXN0ZXJcIlxyXG4gICAgICAgICAgICB9ICAgIFxyXG4gICAgICAgIF1cclxuICAgIH07XHJcbn07XHJcblxyXG5leHBvcnQgY29uc3QgS2FycGVudGVyQ29udHJvbGxlclBvbGljeVYxID0gS2FycGVudGVyQ29udHJvbGxlclBvbGljeUJldGE7XHJcbiJdfQ==