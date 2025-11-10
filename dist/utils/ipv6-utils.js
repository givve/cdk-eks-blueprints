"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEKSNodeIpv6PolicyDocument = getEKSNodeIpv6PolicyDocument;
/*
** This policy is required for all the roles which are manging/creating the nodes in the cluster.
** So, we need it for both cluster node role and karpenter node role.
** Refer to: https://docs.aws.amazon.com/eks/latest/userguide/cni-iam-role.html#cni-iam-role-create-role
 */
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
function getEKSNodeIpv6PolicyDocument() {
    return aws_iam_1.PolicyDocument.fromJson({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:AssignIpv6Addresses",
                    "ec2:DescribeInstances",
                    "ec2:DescribeTags",
                    "ec2:DescribeNetworkInterfaces",
                    "ec2:DescribeInstanceTypes"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ec2:CreateTags"
                ],
                "Resource": [
                    "arn:aws:ec2:*:*:network-interface/*"
                ]
            }
        ]
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXB2Ni11dGlscy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi91dGlscy9pcHY2LXV0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBUUEsb0VBMEJDO0FBakNEOzs7O0dBSUc7QUFDSCxpREFBbUQ7QUFFbkQsU0FBZ0IsNEJBQTRCO0lBQ3hDLE9BQU8sd0JBQWMsQ0FBQyxRQUFRLENBQUM7UUFDM0IsU0FBUyxFQUFFLFlBQVk7UUFDdkIsV0FBVyxFQUFFO1lBQ1Q7Z0JBQ0ksUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFFBQVEsRUFBRTtvQkFDTix5QkFBeUI7b0JBQ3pCLHVCQUF1QjtvQkFDdkIsa0JBQWtCO29CQUNsQiwrQkFBK0I7b0JBQy9CLDJCQUEyQjtpQkFDOUI7Z0JBQ0QsVUFBVSxFQUFFLEdBQUc7YUFDbEI7WUFDRDtnQkFDSSxRQUFRLEVBQUUsT0FBTztnQkFDakIsUUFBUSxFQUFFO29CQUNOLGdCQUFnQjtpQkFDbkI7Z0JBQ0QsVUFBVSxFQUFFO29CQUNSLHFDQUFxQztpQkFDeEM7YUFDSjtTQUNKO0tBQ0osQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIlxyXG4vKlxyXG4qKiBUaGlzIHBvbGljeSBpcyByZXF1aXJlZCBmb3IgYWxsIHRoZSByb2xlcyB3aGljaCBhcmUgbWFuZ2luZy9jcmVhdGluZyB0aGUgbm9kZXMgaW4gdGhlIGNsdXN0ZXIuXHJcbioqIFNvLCB3ZSBuZWVkIGl0IGZvciBib3RoIGNsdXN0ZXIgbm9kZSByb2xlIGFuZCBrYXJwZW50ZXIgbm9kZSByb2xlLlxyXG4qKiBSZWZlciB0bzogaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2NuaS1pYW0tcm9sZS5odG1sI2NuaS1pYW0tcm9sZS1jcmVhdGUtcm9sZVxyXG4gKi9cclxuaW1wb3J0IHtQb2xpY3lEb2N1bWVudH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRFS1NOb2RlSXB2NlBvbGljeURvY3VtZW50KCk6IFBvbGljeURvY3VtZW50IHtcclxuICAgIHJldHVybiBQb2xpY3lEb2N1bWVudC5mcm9tSnNvbih7XHJcbiAgICAgICAgXCJWZXJzaW9uXCI6IFwiMjAxMi0xMC0xN1wiLFxyXG4gICAgICAgIFwiU3RhdGVtZW50XCI6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkFzc2lnbklwdjZBZGRyZXNzZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUluc3RhbmNlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlVGFnc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlTmV0d29ya0ludGVyZmFjZXNcIixcclxuICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZUluc3RhbmNlVHlwZXNcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiZWMyOkNyZWF0ZVRhZ3NcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIFwiYXJuOmF3czplYzI6KjoqOm5ldHdvcmstaW50ZXJmYWNlLypcIlxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcbn0iXX0=