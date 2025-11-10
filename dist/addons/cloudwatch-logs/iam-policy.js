"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCloudWatchLogsPolicyDocument = getCloudWatchLogsPolicyDocument;
function getCloudWatchLogsPolicyDocument() {
    const result = [
        {
            "Effect": "Allow",
            "Action": [
                "ec2:DescribeVolumes",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:DescribeLogStreams",
                "logs:DescribeLogGroups",
                "logs:CreateLogStream",
                "logs:CreateLogGroup",
                "logs:PutRetentionPolicy",
                "logs:DeleteRetentionPolicy"
            ],
            "Resource": "*"
        }
    ];
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvY2xvdWR3YXRjaC1sb2dzL2lhbS1wb2xpY3kudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFNQSwwRUFtQkM7QUFuQkQsU0FBZ0IsK0JBQStCO0lBQzNDLE1BQU0sTUFBTSxHQUFnQjtRQUN4QjtZQUNJLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLFFBQVEsRUFBRTtnQkFDTixxQkFBcUI7Z0JBQ3JCLGtCQUFrQjtnQkFDbEIsbUJBQW1CO2dCQUNuQix5QkFBeUI7Z0JBQ3pCLHdCQUF3QjtnQkFDeEIsc0JBQXNCO2dCQUN0QixxQkFBcUI7Z0JBQ3JCLHlCQUF5QjtnQkFDekIsNEJBQTRCO2FBQy9CO1lBQ0QsVUFBVSxFQUFFLEdBQUc7U0FDbEI7S0FDSixDQUFDO0lBQ0YsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImludGVyZmFjZSBTdGF0ZW1lbnQge1xyXG4gICAgRWZmZWN0OiBzdHJpbmc7XHJcbiAgICBBY3Rpb246IHN0cmluZyB8IHN0cmluZ1tdO1xyXG4gICAgUmVzb3VyY2U6IHN0cmluZyB8IHN0cmluZ1tdO1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2xvdWRXYXRjaExvZ3NQb2xpY3lEb2N1bWVudCgpIDogU3RhdGVtZW50W10ge1xyXG4gICAgY29uc3QgcmVzdWx0OiBTdGF0ZW1lbnRbXSA9IFtcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVWb2x1bWVzXCIsXHJcbiAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZVRhZ3NcIixcclxuICAgICAgICAgICAgICAgIFwibG9nczpQdXRMb2dFdmVudHNcIixcclxuICAgICAgICAgICAgICAgIFwibG9nczpEZXNjcmliZUxvZ1N0cmVhbXNcIixcclxuICAgICAgICAgICAgICAgIFwibG9nczpEZXNjcmliZUxvZ0dyb3Vwc1wiLFxyXG4gICAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiLFxyXG4gICAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCIsXHJcbiAgICAgICAgICAgICAgICBcImxvZ3M6UHV0UmV0ZW50aW9uUG9saWN5XCIsXHJcbiAgICAgICAgICAgICAgICBcImxvZ3M6RGVsZXRlUmV0ZW50aW9uUG9saWN5XCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIipcIlxyXG4gICAgICAgIH1cclxuICAgIF07XHJcbiAgICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbiJdfQ==