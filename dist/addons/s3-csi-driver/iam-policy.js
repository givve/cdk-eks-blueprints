"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getS3DriverPolicyStatements = getS3DriverPolicyStatements;
const iam = require("aws-cdk-lib/aws-iam");
/**
 * IAM policy to grant access to S3 buckets and, optionally, KMS keys
 * https://github.com/awslabs/mountpoint-s3/blob/main/doc/CONFIGURATION.md#iam-permissions
 */
function getS3DriverPolicyStatements(bucketNames, kmsArns) {
    const arns = bucketNames.map((name) => `arn:aws:s3:::${name}`);
    const bucketPolicy = [
        new iam.PolicyStatement({
            sid: 'S3MountpointFullBucketAccess',
            actions: [
                "s3:ListBucket"
            ],
            resources: arns
        }),
        new iam.PolicyStatement({
            sid: 'S3MountpointFullObjectAccess',
            actions: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:AbortMultipartUpload",
                "s3:DeleteObject"
            ],
            resources: arns.map((arn) => `${arn}/*`)
        }),
    ];
    const kmsPolicy = kmsArns.length > 0 ? [
        new iam.PolicyStatement({
            sid: "S3MountpointKmsAccess",
            actions: [
                "kms:Decrypt",
                "kms:GenerateDataKey"
            ],
            resources: kmsArns
        })
    ] : [];
    return [...bucketPolicy, ...kmsPolicy];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvczMtY3NpLWRyaXZlci9pYW0tcG9saWN5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBTUEsa0VBZ0NDO0FBdENELDJDQUEyQztBQUUzQzs7O0dBR0c7QUFDSCxTQUFnQiwyQkFBMkIsQ0FBQyxXQUFxQixFQUFFLE9BQWlCO0lBQ2hGLE1BQU0sSUFBSSxHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixJQUFJLEVBQUUsQ0FBQyxDQUFDO0lBQy9ELE1BQU0sWUFBWSxHQUFHO1FBQ2pCLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixHQUFHLEVBQUUsOEJBQThCO1lBQ25DLE9BQU8sRUFBRTtnQkFDTCxlQUFlO2FBQ2xCO1lBQ0QsU0FBUyxFQUFFLElBQUk7U0FDbEIsQ0FBQztRQUNGLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQztZQUNwQixHQUFHLEVBQUUsOEJBQThCO1lBQ25DLE9BQU8sRUFBRTtnQkFDTCxjQUFjO2dCQUNkLGNBQWM7Z0JBQ2QseUJBQXlCO2dCQUN6QixpQkFBaUI7YUFDcEI7WUFDRCxTQUFTLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztTQUMzQyxDQUFDO0tBQ0wsQ0FBQztJQUNGLE1BQU0sU0FBUyxHQUFHLE9BQU8sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7WUFDcEIsR0FBRyxFQUFFLHVCQUF1QjtZQUM1QixPQUFPLEVBQUU7Z0JBQ0wsYUFBYTtnQkFDYixxQkFBcUI7YUFDeEI7WUFDRCxTQUFTLEVBQUUsT0FBTztTQUNyQixDQUFDO0tBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0lBRWIsT0FBTyxDQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsU0FBUyxDQUFDLENBQUM7QUFDM0MsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuXHJcbi8qKlxyXG4gKiBJQU0gcG9saWN5IHRvIGdyYW50IGFjY2VzcyB0byBTMyBidWNrZXRzIGFuZCwgb3B0aW9uYWxseSwgS01TIGtleXNcclxuICogaHR0cHM6Ly9naXRodWIuY29tL2F3c2xhYnMvbW91bnRwb2ludC1zMy9ibG9iL21haW4vZG9jL0NPTkZJR1VSQVRJT04ubWQjaWFtLXBlcm1pc3Npb25zXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UzNEcml2ZXJQb2xpY3lTdGF0ZW1lbnRzKGJ1Y2tldE5hbWVzOiBzdHJpbmdbXSwga21zQXJuczogc3RyaW5nW10pOiBpYW0uUG9saWN5U3RhdGVtZW50W10ge1xyXG4gICAgY29uc3QgYXJucyA9IGJ1Y2tldE5hbWVzLm1hcCgobmFtZSkgPT4gYGFybjphd3M6czM6Ojoke25hbWV9YCk7XHJcbiAgICBjb25zdCBidWNrZXRQb2xpY3kgPSBbXHJcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICBzaWQ6ICdTM01vdW50cG9pbnRGdWxsQnVja2V0QWNjZXNzJyxcclxuICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgcmVzb3VyY2VzOiBhcm5zXHJcbiAgICAgICAgfSksXHJcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICBzaWQ6ICdTM01vdW50cG9pbnRGdWxsT2JqZWN0QWNjZXNzJyxcclxuICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcclxuICAgICAgICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICBcInMzOkFib3J0TXVsdGlwYXJ0VXBsb2FkXCIsXHJcbiAgICAgICAgICAgICAgICBcInMzOkRlbGV0ZU9iamVjdFwiXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJlc291cmNlczogYXJucy5tYXAoKGFybikgPT4gYCR7YXJufS8qYClcclxuICAgICAgICB9KSxcclxuICAgIF07XHJcbiAgICBjb25zdCBrbXNQb2xpY3kgPSBrbXNBcm5zLmxlbmd0aCA+IDAgPyBbXHJcbiAgICAgICAgbmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICBzaWQ6IFwiUzNNb3VudHBvaW50S21zQWNjZXNzXCIsXHJcbiAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgIFwia21zOkRlY3J5cHRcIixcclxuICAgICAgICAgICAgICAgIFwia21zOkdlbmVyYXRlRGF0YUtleVwiXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJlc291cmNlczoga21zQXJuc1xyXG4gICAgICAgIH0pXSA6IFtdO1xyXG5cclxuICAgIHJldHVybiBbLi4uYnVja2V0UG9saWN5LCAuLi5rbXNQb2xpY3ldO1xyXG59XHJcbiJdfQ==