"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsLoadbalancerControllerIamPolicy = void 0;
const AwsLoadbalancerControllerIamPolicy = (partition) => {
    return {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": "iam:CreateServiceLinkedRole",
                "Resource": "*",
                "Condition": {
                    "StringEquals": {
                        "iam:AWSServiceName": "elasticloadbalancing.amazonaws.com"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:DescribeAccountAttributes",
                    "ec2:DescribeAddresses",
                    "ec2:DescribeAvailabilityZones",
                    "ec2:DescribeInternetGateways",
                    "ec2:DescribeVpcs",
                    "ec2:DescribeVpcPeeringConnections",
                    "ec2:DescribeSubnets",
                    "ec2:DescribeSecurityGroups",
                    "ec2:DescribeInstances",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DescribeTags",
                    "ec2:GetCoipPoolUsage",
                    "ec2:DescribeCoipPools",
                    "ec2:GetSecurityGroupsForVpc",
                    "ec2:DescribeIpamPools",
                    "ec2:DescribeRouteTables",
                    "elasticloadbalancing:DescribeLoadBalancers",
                    "elasticloadbalancing:DescribeLoadBalancerAttributes",
                    "elasticloadbalancing:DescribeListeners",
                    "elasticloadbalancing:DescribeListenerCertificates",
                    "elasticloadbalancing:DescribeSSLPolicies",
                    "elasticloadbalancing:DescribeRules",
                    "elasticloadbalancing:DescribeTargetGroups",
                    "elasticloadbalancing:DescribeTargetGroupAttributes",
                    "elasticloadbalancing:DescribeTargetHealth",
                    "elasticloadbalancing:DescribeTags",
                    "elasticloadbalancing:DescribeTrustStores",
                    "elasticloadbalancing:DescribeListenerAttributes",
                    "elasticloadbalancing:DescribeCapacityReservation"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "cognito-idp:DescribeUserPoolClient",
                    "acm:ListCertificates",
                    "acm:DescribeCertificate",
                    "iam:ListServerCertificates",
                    "iam:GetServerCertificate",
                    "waf-regional:GetWebACL",
                    "waf-regional:GetWebACLForResource",
                    "waf-regional:AssociateWebACL",
                    "waf-regional:DisassociateWebACL",
                    "wafv2:GetWebACL",
                    "wafv2:GetWebACLForResource",
                    "wafv2:AssociateWebACL",
                    "wafv2:DisassociateWebACL",
                    "shield:GetSubscriptionState",
                    "shield:DescribeProtection",
                    "shield:CreateProtection",
                    "shield:DeleteProtection"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateSecurityGroup"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateTags"
                ],
                "Resource": `arn:${partition}:ec2:*:*:security-group/*`,
                "Condition": {
                    "StringEquals": {
                        "ec2:CreateAction": "CreateSecurityGroup"
                    },
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateTags",
                    "ec2:DeleteTags"
                ],
                "Resource": `arn:${partition}:ec2:*:*:security-group/*`,
                "Condition": {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:AuthorizeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:DeleteSecurityGroup"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:CreateListener",
                    "elasticloadbalancing:DeleteListener",
                    "elasticloadbalancing:CreateRule",
                    "elasticloadbalancing:DeleteRule"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                "Resource": [
                    `arn:${partition}:elasticloadbalancing:*:*:targetgroup/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:loadbalancer/net/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:loadbalancer/app/*/*`
                ],
                "Condition": {
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "true",
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:RemoveTags"
                ],
                "Resource": [
                    `arn:${partition}:elasticloadbalancing:*:*:listener/net/*/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:listener/app/*/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:listener-rule/net/*/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:listener-rule/app/*/*/*`
                ]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:ModifyLoadBalancerAttributes",
                    "elasticloadbalancing:SetIpAddressType",
                    "elasticloadbalancing:SetSecurityGroups",
                    "elasticloadbalancing:SetSubnets",
                    "elasticloadbalancing:DeleteLoadBalancer",
                    "elasticloadbalancing:ModifyTargetGroup",
                    "elasticloadbalancing:ModifyTargetGroupAttributes",
                    "elasticloadbalancing:DeleteTargetGroup",
                    "elasticloadbalancing:ModifyListenerAttributes",
                    "elasticloadbalancing:ModifyCapacityReservation",
                    "elasticloadbalancing:ModifyIpPools"
                ],
                "Resource": "*",
                "Condition": {
                    "Null": {
                        "aws:ResourceTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:AddTags"
                ],
                "Resource": [
                    `arn:${partition}:elasticloadbalancing:*:*:targetgroup/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:loadbalancer/net/*/*`,
                    `arn:${partition}:elasticloadbalancing:*:*:loadbalancer/app/*/*`
                ],
                "Condition": {
                    "StringEquals": {
                        "elasticloadbalancing:CreateAction": [
                            "CreateTargetGroup",
                            "CreateLoadBalancer"
                        ]
                    },
                    "Null": {
                        "aws:RequestTag/elbv2.k8s.aws/cluster": "false"
                    }
                }
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:RegisterTargets",
                    "elasticloadbalancing:DeregisterTargets"
                ],
                "Resource": `arn:${partition}:elasticloadbalancing:*:*:targetgroup/*/*`
            },
            {
                "Effect": "Allow",
                "Action": [
                    "elasticloadbalancing:SetWebAcl",
                    "elasticloadbalancing:ModifyListener",
                    "elasticloadbalancing:AddListenerCertificates",
                    "elasticloadbalancing:RemoveListenerCertificates",
                    "elasticloadbalancing:ModifyRule",
                    "elasticloadbalancing:SetRulePriorities"
                ],
                "Resource": "*"
            }
        ]
    };
};
exports.AwsLoadbalancerControllerIamPolicy = AwsLoadbalancerControllerIamPolicy;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvYXdzLWxvYWRiYWxhbmNlci1jb250cm9sbGVyL2lhbS1wb2xpY3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQU8sTUFBTSxrQ0FBa0MsR0FBRyxDQUFDLFNBQWlCLEVBQUUsRUFBRTtJQUNwRSxPQUFPO1FBQ0gsU0FBUyxFQUFFLFlBQVk7UUFDdkIsV0FBVyxFQUFFO1lBQ1Q7Z0JBQ0ksUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFFBQVEsRUFBRSw2QkFBNkI7Z0JBQ3ZDLFVBQVUsRUFBRSxHQUFHO2dCQUNmLFdBQVcsRUFBRTtvQkFDVCxjQUFjLEVBQUU7d0JBQ1osb0JBQW9CLEVBQUUsb0NBQW9DO3FCQUM3RDtpQkFDSjthQUNKO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFFBQVEsRUFBRTtvQkFDTiwrQkFBK0I7b0JBQy9CLHVCQUF1QjtvQkFDdkIsK0JBQStCO29CQUMvQiw4QkFBOEI7b0JBQzlCLGtCQUFrQjtvQkFDbEIsbUNBQW1DO29CQUNuQyxxQkFBcUI7b0JBQ3JCLDRCQUE0QjtvQkFDNUIsdUJBQXVCO29CQUN2QiwrQkFBK0I7b0JBQy9CLGtCQUFrQjtvQkFDbEIsc0JBQXNCO29CQUN0Qix1QkFBdUI7b0JBQ3ZCLDZCQUE2QjtvQkFDN0IsdUJBQXVCO29CQUN2Qix5QkFBeUI7b0JBQ3pCLDRDQUE0QztvQkFDNUMscURBQXFEO29CQUNyRCx3Q0FBd0M7b0JBQ3hDLG1EQUFtRDtvQkFDbkQsMENBQTBDO29CQUMxQyxvQ0FBb0M7b0JBQ3BDLDJDQUEyQztvQkFDM0Msb0RBQW9EO29CQUNwRCwyQ0FBMkM7b0JBQzNDLG1DQUFtQztvQkFDbkMsMENBQTBDO29CQUMxQyxpREFBaUQ7b0JBQ2pELGtEQUFrRDtpQkFDckQ7Z0JBQ0QsVUFBVSxFQUFFLEdBQUc7YUFDbEI7WUFDRDtnQkFDSSxRQUFRLEVBQUUsT0FBTztn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d0NBQXdDO2lCQUMzQztnQkFDRCxVQUFVLEVBQUUsR0FBRzthQUNsQjtTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUMsQ0FBQztBQTFQVyxRQUFBLGtDQUFrQyxzQ0EwUDdDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNvbnN0IEF3c0xvYWRiYWxhbmNlckNvbnRyb2xsZXJJYW1Qb2xpY3kgPSAocGFydGl0aW9uOiBzdHJpbmcpID0+IHtcclxuICAgIHJldHVybiB7XHJcbiAgICAgICAgXCJWZXJzaW9uXCI6IFwiMjAxMi0xMC0xN1wiLFxyXG4gICAgICAgIFwiU3RhdGVtZW50XCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogXCJpYW06Q3JlYXRlU2VydmljZUxpbmtlZFJvbGVcIixcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCIsXHJcbiAgICAgICAgICAgICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJTdHJpbmdFcXVhbHNcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImlhbTpBV1NTZXJ2aWNlTmFtZVwiOiBcImVsYXN0aWNsb2FkYmFsYW5jaW5nLmFtYXpvbmF3cy5jb21cIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlQWNjb3VudEF0dHJpYnV0ZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUFkZHJlc3Nlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlQXZhaWxhYmlsaXR5Wm9uZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUludGVybmV0R2F0ZXdheXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZVZwY3NcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZVZwY1BlZXJpbmdDb25uZWN0aW9uc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlU3VibmV0c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlU2VjdXJpdHlHcm91cHNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUluc3RhbmNlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlTmV0d29ya0ludGVyZmFjZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZVRhZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpHZXRDb2lwUG9vbFVzYWdlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVDb2lwUG9vbHNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpHZXRTZWN1cml0eUdyb3Vwc0ZvclZwY1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlSXBhbVBvb2xzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVSb3V0ZVRhYmxlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVzY3JpYmVMb2FkQmFsYW5jZXJzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZUxvYWRCYWxhbmNlckF0dHJpYnV0ZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlTGlzdGVuZXJzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZUxpc3RlbmVyQ2VydGlmaWNhdGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZVNTTFBvbGljaWVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZVJ1bGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZVRhcmdldEdyb3Vwc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVzY3JpYmVUYXJnZXRHcm91cEF0dHJpYnV0ZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVGFyZ2V0SGVhbHRoXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZVRhZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlVHJ1c3RTdG9yZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkRlc2NyaWJlTGlzdGVuZXJBdHRyaWJ1dGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZXNjcmliZUNhcGFjaXR5UmVzZXJ2YXRpb25cIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiY29nbml0by1pZHA6RGVzY3JpYmVVc2VyUG9vbENsaWVudFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiYWNtOkxpc3RDZXJ0aWZpY2F0ZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImFjbTpEZXNjcmliZUNlcnRpZmljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJpYW06TGlzdFNlcnZlckNlcnRpZmljYXRlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiaWFtOkdldFNlcnZlckNlcnRpZmljYXRlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3YWYtcmVnaW9uYWw6R2V0V2ViQUNMXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJ3YWYtcmVnaW9uYWw6R2V0V2ViQUNMRm9yUmVzb3VyY2VcIixcclxuICAgICAgICAgICAgICAgICAgICBcIndhZi1yZWdpb25hbDpBc3NvY2lhdGVXZWJBQ0xcIixcclxuICAgICAgICAgICAgICAgICAgICBcIndhZi1yZWdpb25hbDpEaXNhc3NvY2lhdGVXZWJBQ0xcIixcclxuICAgICAgICAgICAgICAgICAgICBcIndhZnYyOkdldFdlYkFDTFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwid2FmdjI6R2V0V2ViQUNMRm9yUmVzb3VyY2VcIixcclxuICAgICAgICAgICAgICAgICAgICBcIndhZnYyOkFzc29jaWF0ZVdlYkFDTFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwid2FmdjI6RGlzYXNzb2NpYXRlV2ViQUNMXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzaGllbGQ6R2V0U3Vic2NyaXB0aW9uU3RhdGVcIixcclxuICAgICAgICAgICAgICAgICAgICBcInNoaWVsZDpEZXNjcmliZVByb3RlY3Rpb25cIixcclxuICAgICAgICAgICAgICAgICAgICBcInNoaWVsZDpDcmVhdGVQcm90ZWN0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzaGllbGQ6RGVsZXRlUHJvdGVjdGlvblwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6QXV0aG9yaXplU2VjdXJpdHlHcm91cEluZ3Jlc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzc1wiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlU2VjdXJpdHlHcm91cFwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlVGFnc1wiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBgYXJuOiR7cGFydGl0aW9ufTplYzI6KjoqOnNlY3VyaXR5LWdyb3VwLypgLFxyXG4gICAgICAgICAgICAgICAgXCJDb25kaXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiU3RyaW5nRXF1YWxzXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlQWN0aW9uXCI6IFwiQ3JlYXRlU2VjdXJpdHlHcm91cFwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBcIk51bGxcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpSZXF1ZXN0VGFnL2VsYnYyLms4cy5hd3MvY2x1c3RlclwiOiBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpDcmVhdGVUYWdzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVsZXRlVGFnc1wiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBgYXJuOiR7cGFydGl0aW9ufTplYzI6KjoqOnNlY3VyaXR5LWdyb3VwLypgLFxyXG4gICAgICAgICAgICAgICAgXCJDb25kaXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiTnVsbFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXdzOlJlcXVlc3RUYWcvZWxidjIuazhzLmF3cy9jbHVzdGVyXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpSZXNvdXJjZVRhZy9lbGJ2Mi5rOHMuYXdzL2NsdXN0ZXJcIjogXCJmYWxzZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlYzI6QXV0aG9yaXplU2VjdXJpdHlHcm91cEluZ3Jlc3NcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlbGV0ZVNlY3VyaXR5R3JvdXBcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCIsXHJcbiAgICAgICAgICAgICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJOdWxsXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVzb3VyY2VUYWcvZWxidjIuazhzLmF3cy9jbHVzdGVyXCI6IFwiZmFsc2VcIlxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6Q3JlYXRlTG9hZEJhbGFuY2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpDcmVhdGVUYXJnZXRHcm91cFwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIixcclxuICAgICAgICAgICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIk51bGxcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImF3czpSZXF1ZXN0VGFnL2VsYnYyLms4cy5hd3MvY2x1c3RlclwiOiBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkNyZWF0ZUxpc3RlbmVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZWxldGVMaXN0ZW5lclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6Q3JlYXRlUnVsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVsZXRlUnVsZVwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpBZGRUYWdzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpSZW1vdmVUYWdzXCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplbGFzdGljbG9hZGJhbGFuY2luZzoqOio6dGFyZ2V0Z3JvdXAvKi8qYCxcclxuICAgICAgICAgICAgICAgICAgICBgYXJuOiR7cGFydGl0aW9ufTplbGFzdGljbG9hZGJhbGFuY2luZzoqOio6bG9hZGJhbGFuY2VyL25ldC8qLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6Kjpsb2FkYmFsYW5jZXIvYXBwLyovKmBcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJOdWxsXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVxdWVzdFRhZy9lbGJ2Mi5rOHMuYXdzL2NsdXN0ZXJcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXdzOlJlc291cmNlVGFnL2VsYnYyLms4cy5hd3MvY2x1c3RlclwiOiBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkFkZFRhZ3NcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOlJlbW92ZVRhZ3NcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6KjpsaXN0ZW5lci9uZXQvKi8qLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6KjpsaXN0ZW5lci9hcHAvKi8qLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6KjpsaXN0ZW5lci1ydWxlL25ldC8qLyovKmAsXHJcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3BhcnRpdGlvbn06ZWxhc3RpY2xvYWRiYWxhbmNpbmc6KjoqOmxpc3RlbmVyLXJ1bGUvYXBwLyovKi8qYFxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpNb2RpZnlMb2FkQmFsYW5jZXJBdHRyaWJ1dGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpTZXRJcEFkZHJlc3NUeXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpTZXRTZWN1cml0eUdyb3Vwc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6U2V0U3VibmV0c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6RGVsZXRlTG9hZEJhbGFuY2VyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpNb2RpZnlUYXJnZXRHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6TW9kaWZ5VGFyZ2V0R3JvdXBBdHRyaWJ1dGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpEZWxldGVUYXJnZXRHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6TW9kaWZ5TGlzdGVuZXJBdHRyaWJ1dGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpNb2RpZnlDYXBhY2l0eVJlc2VydmF0aW9uXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpNb2RpZnlJcFBvb2xzXCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiLFxyXG4gICAgICAgICAgICAgICAgXCJDb25kaXRpb25cIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiTnVsbFwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXdzOlJlc291cmNlVGFnL2VsYnYyLms4cy5hd3MvY2x1c3RlclwiOiBcImZhbHNlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkFkZFRhZ3NcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6Kjp0YXJnZXRncm91cC8qLypgLFxyXG4gICAgICAgICAgICAgICAgICAgIGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6Kjpsb2FkYmFsYW5jZXIvbmV0LyovKmAsXHJcbiAgICAgICAgICAgICAgICAgICAgYGFybjoke3BhcnRpdGlvbn06ZWxhc3RpY2xvYWRiYWxhbmNpbmc6KjoqOmxvYWRiYWxhbmNlci9hcHAvKi8qYFxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiQ29uZGl0aW9uXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICBcIlN0cmluZ0VxdWFsc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6Q3JlYXRlQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ3JlYXRlVGFyZ2V0R3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiQ3JlYXRlTG9hZEJhbGFuY2VyXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXCJOdWxsXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJhd3M6UmVxdWVzdFRhZy9lbGJ2Mi5rOHMuYXdzL2NsdXN0ZXJcIjogXCJmYWxzZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpSZWdpc3RlclRhcmdldHNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkRlcmVnaXN0ZXJUYXJnZXRzXCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IGBhcm46JHtwYXJ0aXRpb259OmVsYXN0aWNsb2FkYmFsYW5jaW5nOio6Kjp0YXJnZXRncm91cC8qLypgXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOlNldFdlYkFjbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6TW9kaWZ5TGlzdGVuZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVsYXN0aWNsb2FkYmFsYW5jaW5nOkFkZExpc3RlbmVyQ2VydGlmaWNhdGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJlbGFzdGljbG9hZGJhbGFuY2luZzpSZW1vdmVMaXN0ZW5lckNlcnRpZmljYXRlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6TW9kaWZ5UnVsZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWxhc3RpY2xvYWRiYWxhbmNpbmc6U2V0UnVsZVByaW9yaXRpZXNcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH07XHJcbn07Il19