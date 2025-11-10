"use strict";
// https://www.gateway-api-controller.eks.aws.dev/latest/guides/deploy/#setup
// https://raw.githubusercontent.com/aws/aws-application-networking-k8s/main/files/controller-installation/recommended-inline-policy.json
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVpcLatticeControllerPolicy = getVpcLatticeControllerPolicy;
const iam = require("aws-cdk-lib/aws-iam");
function getVpcLatticeControllerPolicy() {
    const vpcLatticePolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
            'vpc-lattice:*',
            'ec2:DescribeVpcs',
            'ec2:DescribeSubnets',
            'ec2:DescribeTags',
            'ec2:DescribeSecurityGroups',
            'logs:CreateLogDelivery',
            'logs:GetLogDelivery',
            'logs:DescribeLogGroups',
            'logs:PutResourcePolicy',
            'logs:DescribeResourcePolicies',
            'logs:UpdateLogDelivery',
            'logs:DeleteLogDelivery',
            'logs:ListLogDeliveries',
            'tag:GetResources',
            'firehose:TagDeliveryStream',
            's3:GetBucketPolicy',
            's3:PutBucketPolicy'
        ],
        resources: ['*']
    });
    const vpcLatticeServiceLinkedRole = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:CreateServiceLinkedRole'],
        resources: ['arn:aws:iam::*:role/aws-service-role/vpc-lattice.amazonaws.com/AWSServiceRoleForVpcLattice'],
        conditions: {
            StringLike: {
                'iam:AWSServiceName': 'vpc-lattice.amazonaws.com'
            }
        }
    });
    const logsServiceLinkedRole = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['iam:CreateServiceLinkedRole'],
        resources: ['arn:aws:iam::*:role/aws-service-role/delivery.logs.amazonaws.com/AWSServiceRoleForLogDelivery'],
        conditions: {
            StringLike: {
                'iam:AWSServiceName': 'delivery.logs.amazonaws.com'
            }
        }
    });
    return [
        vpcLatticePolicy,
        vpcLatticeServiceLinkedRole,
        logsServiceLinkedRole
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvYXdzLWdhdGV3YXktYXBpLWNvbnRyb2xsZXIvaWFtLXBvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsNkVBQTZFO0FBQzdFLHlJQUF5STs7QUFJekksc0VBb0RDO0FBdERELDJDQUEyQztBQUUzQyxTQUFnQiw2QkFBNkI7SUFDekMsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7UUFDN0MsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztRQUN4QixPQUFPLEVBQUU7WUFDTCxlQUFlO1lBQ2Ysa0JBQWtCO1lBQ2xCLHFCQUFxQjtZQUNyQixrQkFBa0I7WUFDbEIsNEJBQTRCO1lBQzVCLHdCQUF3QjtZQUN4QixxQkFBcUI7WUFDckIsd0JBQXdCO1lBQ3hCLHdCQUF3QjtZQUN4QiwrQkFBK0I7WUFDL0Isd0JBQXdCO1lBQ3hCLHdCQUF3QjtZQUN4Qix3QkFBd0I7WUFDeEIsa0JBQWtCO1lBQ2xCLDRCQUE0QjtZQUM1QixvQkFBb0I7WUFDcEIsb0JBQW9CO1NBQ3ZCO1FBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO0tBQ25CLENBQUMsQ0FBQztJQUVILE1BQU0sMkJBQTJCLEdBQUcsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1FBQ3hELE1BQU0sRUFBRSxHQUFHLENBQUMsTUFBTSxDQUFDLEtBQUs7UUFDeEIsT0FBTyxFQUFFLENBQUMsNkJBQTZCLENBQUM7UUFDeEMsU0FBUyxFQUFFLENBQUMsNEZBQTRGLENBQUM7UUFDekcsVUFBVSxFQUFFO1lBQ1IsVUFBVSxFQUFFO2dCQUNSLG9CQUFvQixFQUFFLDJCQUEyQjthQUNwRDtTQUNKO0tBQ0osQ0FBQyxDQUFDO0lBRUgsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7UUFDbEQsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztRQUN4QixPQUFPLEVBQUUsQ0FBQyw2QkFBNkIsQ0FBQztRQUN4QyxTQUFTLEVBQUUsQ0FBQywrRkFBK0YsQ0FBQztRQUM1RyxVQUFVLEVBQUU7WUFDUixVQUFVLEVBQUU7Z0JBQ1Isb0JBQW9CLEVBQUUsNkJBQTZCO2FBQ3REO1NBQ0o7S0FDSixDQUFDLENBQUM7SUFFSCxPQUFPO1FBQ0gsZ0JBQWdCO1FBQ2hCLDJCQUEyQjtRQUMzQixxQkFBcUI7S0FDeEIsQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyIvLyBodHRwczovL3d3dy5nYXRld2F5LWFwaS1jb250cm9sbGVyLmVrcy5hd3MuZGV2L2xhdGVzdC9ndWlkZXMvZGVwbG95LyNzZXR1cFxyXG4vLyBodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYXdzL2F3cy1hcHBsaWNhdGlvbi1uZXR3b3JraW5nLWs4cy9tYWluL2ZpbGVzL2NvbnRyb2xsZXItaW5zdGFsbGF0aW9uL3JlY29tbWVuZGVkLWlubGluZS1wb2xpY3kuanNvblxyXG5cclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGdldFZwY0xhdHRpY2VDb250cm9sbGVyUG9saWN5KCk6IGlhbS5Qb2xpY3lTdGF0ZW1lbnRbXSB7XHJcbiAgICBjb25zdCB2cGNMYXR0aWNlUG9saWN5ID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICBhY3Rpb25zOiBbXHJcbiAgICAgICAgICAgICd2cGMtbGF0dGljZToqJyxcclxuICAgICAgICAgICAgJ2VjMjpEZXNjcmliZVZwY3MnLFxyXG4gICAgICAgICAgICAnZWMyOkRlc2NyaWJlU3VibmV0cycsXHJcbiAgICAgICAgICAgICdlYzI6RGVzY3JpYmVUYWdzJyxcclxuICAgICAgICAgICAgJ2VjMjpEZXNjcmliZVNlY3VyaXR5R3JvdXBzJyxcclxuICAgICAgICAgICAgJ2xvZ3M6Q3JlYXRlTG9nRGVsaXZlcnknLFxyXG4gICAgICAgICAgICAnbG9nczpHZXRMb2dEZWxpdmVyeScsXHJcbiAgICAgICAgICAgICdsb2dzOkRlc2NyaWJlTG9nR3JvdXBzJyxcclxuICAgICAgICAgICAgJ2xvZ3M6UHV0UmVzb3VyY2VQb2xpY3knLFxyXG4gICAgICAgICAgICAnbG9nczpEZXNjcmliZVJlc291cmNlUG9saWNpZXMnLFxyXG4gICAgICAgICAgICAnbG9nczpVcGRhdGVMb2dEZWxpdmVyeScsXHJcbiAgICAgICAgICAgICdsb2dzOkRlbGV0ZUxvZ0RlbGl2ZXJ5JyxcclxuICAgICAgICAgICAgJ2xvZ3M6TGlzdExvZ0RlbGl2ZXJpZXMnLFxyXG4gICAgICAgICAgICAndGFnOkdldFJlc291cmNlcycsXHJcbiAgICAgICAgICAgICdmaXJlaG9zZTpUYWdEZWxpdmVyeVN0cmVhbScsXHJcbiAgICAgICAgICAgICdzMzpHZXRCdWNrZXRQb2xpY3knLFxyXG4gICAgICAgICAgICAnczM6UHV0QnVja2V0UG9saWN5J1xyXG4gICAgICAgIF0sXHJcbiAgICAgICAgcmVzb3VyY2VzOiBbJyonXVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3QgdnBjTGF0dGljZVNlcnZpY2VMaW5rZWRSb2xlID0gbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICBhY3Rpb25zOiBbJ2lhbTpDcmVhdGVTZXJ2aWNlTGlua2VkUm9sZSddLFxyXG4gICAgICAgIHJlc291cmNlczogWydhcm46YXdzOmlhbTo6Kjpyb2xlL2F3cy1zZXJ2aWNlLXJvbGUvdnBjLWxhdHRpY2UuYW1hem9uYXdzLmNvbS9BV1NTZXJ2aWNlUm9sZUZvclZwY0xhdHRpY2UnXSxcclxuICAgICAgICBjb25kaXRpb25zOiB7XHJcbiAgICAgICAgICAgIFN0cmluZ0xpa2U6IHtcclxuICAgICAgICAgICAgICAgICdpYW06QVdTU2VydmljZU5hbWUnOiAndnBjLWxhdHRpY2UuYW1hem9uYXdzLmNvbSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IGxvZ3NTZXJ2aWNlTGlua2VkUm9sZSA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXHJcbiAgICAgICAgYWN0aW9uczogWydpYW06Q3JlYXRlU2VydmljZUxpbmtlZFJvbGUnXSxcclxuICAgICAgICByZXNvdXJjZXM6IFsnYXJuOmF3czppYW06Oio6cm9sZS9hd3Mtc2VydmljZS1yb2xlL2RlbGl2ZXJ5LmxvZ3MuYW1hem9uYXdzLmNvbS9BV1NTZXJ2aWNlUm9sZUZvckxvZ0RlbGl2ZXJ5J10sXHJcbiAgICAgICAgY29uZGl0aW9uczoge1xyXG4gICAgICAgICAgICBTdHJpbmdMaWtlOiB7XHJcbiAgICAgICAgICAgICAgICAnaWFtOkFXU1NlcnZpY2VOYW1lJzogJ2RlbGl2ZXJ5LmxvZ3MuYW1hem9uYXdzLmNvbSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBbXHJcbiAgICAgICAgdnBjTGF0dGljZVBvbGljeSxcclxuICAgICAgICB2cGNMYXR0aWNlU2VydmljZUxpbmtlZFJvbGUsXHJcbiAgICAgICAgbG9nc1NlcnZpY2VMaW5rZWRSb2xlXHJcbiAgICBdO1xyXG59Il19