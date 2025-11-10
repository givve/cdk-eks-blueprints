"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdotCollectorPolicyDocument = getAdotCollectorPolicyDocument;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
function getAdotCollectorPolicyDocument() {
    return aws_iam_1.PolicyDocument.fromJson({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "aps:RemoteWrite"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "cloudwatch:PutMetricData",
                    "ec2:DescribeVolumes",
                    "ec2:DescribeTags",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams",
                    "logs:DescribeLogGroups",
                    "logs:CreateLogStream",
                    "logs:CreateLogGroup"
                ],
                "Resource": "*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "ssm:GetParameter"
                ],
                "Resource": "arn:aws:ssm:*:*:parameter/AmazonCloudWatch-*"
            },
            {
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords",
                    "xray:GetSamplingRules",
                    "xray:GetSamplingTargets",
                    "xray:GetSamplingStatisticSummaries"
                ],
                "Resource": [
                    "*"
                ]
            }
        ]
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvYWRvdC9pYW0tcG9saWN5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsd0VBK0NDO0FBakRELGlEQUFxRDtBQUVyRCxTQUFnQiw4QkFBOEI7SUFDMUMsT0FBTyx3QkFBYyxDQUFDLFFBQVEsQ0FBQztRQUN2QixTQUFTLEVBQUUsWUFBWTtRQUN2QixXQUFXLEVBQUU7WUFDVDtnQkFDSSxRQUFRLEVBQUUsT0FBTztnQkFDakIsUUFBUSxFQUFFO29CQUNOLGlCQUFpQjtpQkFDcEI7Z0JBQ0QsVUFBVSxFQUFFLEdBQUc7YUFDbEI7WUFDRDtnQkFDSSxRQUFRLEVBQUUsT0FBTztnQkFDakIsUUFBUSxFQUFFO29CQUNOLDBCQUEwQjtvQkFDMUIscUJBQXFCO29CQUNyQixrQkFBa0I7b0JBQ2xCLG1CQUFtQjtvQkFDbkIseUJBQXlCO29CQUN6Qix3QkFBd0I7b0JBQ3hCLHNCQUFzQjtvQkFDdEIscUJBQXFCO2lCQUN4QjtnQkFDRCxVQUFVLEVBQUUsR0FBRzthQUNsQjtZQUNEO2dCQUNJLFFBQVEsRUFBRSxPQUFPO2dCQUNqQixRQUFRLEVBQUU7b0JBQ04sa0JBQWtCO2lCQUNyQjtnQkFDRCxVQUFVLEVBQUUsOENBQThDO2FBQzdEO1lBQ0Q7Z0JBQ0ksUUFBUSxFQUFFLE9BQU87Z0JBQ2pCLFFBQVEsRUFBRTtvQkFDTix1QkFBdUI7b0JBQ3ZCLDBCQUEwQjtvQkFDMUIsdUJBQXVCO29CQUN2Qix5QkFBeUI7b0JBQ3pCLG9DQUFvQztpQkFDdkM7Z0JBQ0QsVUFBVSxFQUFFO29CQUNSLEdBQUc7aUJBQ047YUFDSjtTQUNKO0tBQ1IsQ0FBQyxDQUFDO0FBQ1AsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFBvbGljeURvY3VtZW50IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRBZG90Q29sbGVjdG9yUG9saWN5RG9jdW1lbnQoKSA6IFBvbGljeURvY3VtZW50IHtcclxuICAgIHJldHVybiBQb2xpY3lEb2N1bWVudC5mcm9tSnNvbih7XHJcbiAgICAgICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICAgICAgXCJTdGF0ZW1lbnRcIjogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiYXBzOlJlbW90ZVdyaXRlXCJcclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJjbG91ZHdhdGNoOlB1dE1ldHJpY0RhdGFcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVWb2x1bWVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiZWMyOkRlc2NyaWJlVGFnc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcImxvZ3M6UHV0TG9nRXZlbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nczpEZXNjcmliZUxvZ1N0cmVhbXNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nR3JvdXBzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dTdHJlYW1cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCJcclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzc206R2V0UGFyYW1ldGVyXCJcclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCJhcm46YXdzOnNzbToqOio6cGFyYW1ldGVyL0FtYXpvbkNsb3VkV2F0Y2gtKlwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieHJheTpQdXRUcmFjZVNlZ21lbnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieHJheTpQdXRUZWxlbWV0cnlSZWNvcmRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieHJheTpHZXRTYW1wbGluZ1J1bGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwieHJheTpHZXRTYW1wbGluZ1RhcmdldHNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJ4cmF5OkdldFNhbXBsaW5nU3RhdGlzdGljU3VtbWFyaWVzXCJcclxuICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIipcIlxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgfSk7XHJcbn1cclxuIl19