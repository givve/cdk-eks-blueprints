"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEfsDriverPolicyStatements = getEfsDriverPolicyStatements;
function getEfsDriverPolicyStatements(kmsKeys) {
    const result = [
        {
            "Effect": "Allow",
            "Action": [
                "elasticfilesystem:DescribeAccessPoints",
                "elasticfilesystem:DescribeFileSystems",
                "elasticfilesystem:DescribeMountTargets",
                "ec2:DescribeAvailabilityZones"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "elasticfilesystem:CreateAccessPoint",
                "elasticfilesystem:TagResource",
            ],
            "Resource": "*",
            "Condition": {
                "StringLike": {
                    "aws:RequestTag/efs.csi.aws.com/cluster": "true"
                }
            }
        },
        {
            "Effect": "Allow",
            "Action": "elasticfilesystem:DeleteAccessPoint",
            "Resource": "*",
            "Condition": {
                "StringEquals": {
                    "aws:ResourceTag/efs.csi.aws.com/cluster": "true"
                }
            }
        }
    ];
    if (kmsKeys) {
        const kmsKeysArns = kmsKeys.map((k) => k.keyArn);
        const kmsPolicy = [
            {
                Effect: "Allow",
                Action: ["kms:CreateGrant", "kms:ListGrants", "kms:RevokeGrant"],
                Resource: kmsKeysArns,
                Condition: {
                    Bool: {
                        "kms:GrantIsForAWSResource": "true",
                    },
                },
            },
            {
                Effect: "Allow",
                Action: [
                    "kms:Encrypt",
                    "kms:Decrypt",
                    "kms:ReEncrypt*",
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey",
                ],
                Resource: kmsKeysArns,
            },
        ];
        result.push(...kmsPolicy);
    }
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvZWZzLWNzaS1kcml2ZXIvaWFtLXBvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWFBLG9FQWtFQztBQWxFRCxTQUFnQiw0QkFBNEIsQ0FDMUMsT0FBbUI7SUFFbkIsTUFBTSxNQUFNLEdBQWdCO1FBQzFCO1lBQ0UsUUFBUSxFQUFFLE9BQU87WUFDakIsUUFBUSxFQUFFO2dCQUNSLHdDQUF3QztnQkFDeEMsdUNBQXVDO2dCQUN2Qyx3Q0FBd0M7Z0JBQ3hDLCtCQUErQjthQUNoQztZQUNELFVBQVUsRUFBRSxHQUFHO1NBQ2hCO1FBQ0Q7WUFDRSxRQUFRLEVBQUUsT0FBTztZQUNqQixRQUFRLEVBQUU7Z0JBQ1IscUNBQXFDO2dCQUNyQywrQkFBK0I7YUFDaEM7WUFDRCxVQUFVLEVBQUUsR0FBRztZQUNmLFdBQVcsRUFBRTtnQkFDWCxZQUFZLEVBQUU7b0JBQ1osd0NBQXdDLEVBQUUsTUFBTTtpQkFDakQ7YUFDRjtTQUNGO1FBQ0Q7WUFDRSxRQUFRLEVBQUUsT0FBTztZQUNqQixRQUFRLEVBQUUscUNBQXFDO1lBQy9DLFVBQVUsRUFBRSxHQUFHO1lBQ2YsV0FBVyxFQUFFO2dCQUNYLGNBQWMsRUFBRTtvQkFDZCx5Q0FBeUMsRUFBRSxNQUFNO2lCQUNsRDthQUNGO1NBQ0Y7S0FDRixDQUFDO0lBQ0YsSUFBSSxPQUFPLEVBQUUsQ0FBQztRQUNaLE1BQU0sV0FBVyxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNqRCxNQUFNLFNBQVMsR0FBZ0I7WUFDN0I7Z0JBQ0UsTUFBTSxFQUFFLE9BQU87Z0JBQ2YsTUFBTSxFQUFFLENBQUMsaUJBQWlCLEVBQUUsZ0JBQWdCLEVBQUUsaUJBQWlCLENBQUM7Z0JBQ2hFLFFBQVEsRUFBRSxXQUFXO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1QsSUFBSSxFQUFFO3dCQUNKLDJCQUEyQixFQUFFLE1BQU07cUJBQ3BDO2lCQUNGO2FBQ0Y7WUFDRDtnQkFDRSxNQUFNLEVBQUUsT0FBTztnQkFDZixNQUFNLEVBQUU7b0JBQ04sYUFBYTtvQkFDYixhQUFhO29CQUNiLGdCQUFnQjtvQkFDaEIsc0JBQXNCO29CQUN0QixpQkFBaUI7aUJBQ2xCO2dCQUNELFFBQVEsRUFBRSxXQUFXO2FBQ3RCO1NBQ0YsQ0FBQztRQUNGLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxTQUFTLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBQ0QsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGttcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWttc1wiO1xyXG5cclxuaW50ZXJmYWNlIFN0YXRlbWVudCB7XHJcbiAgRWZmZWN0OiBzdHJpbmc7XHJcbiAgQWN0aW9uOiBzdHJpbmcgfCBzdHJpbmdbXTtcclxuICBSZXNvdXJjZTogc3RyaW5nIHwgc3RyaW5nW107XHJcbiAgQ29uZGl0aW9uPzoge1xyXG4gICAgU3RyaW5nRXF1YWxzPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmdbXSB8IHN0cmluZyB9O1xyXG4gICAgU3RyaW5nTGlrZT86IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH07XHJcbiAgICBCb29sPzogeyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfTtcclxuICB9O1xyXG59XHJcblxyXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWZzRHJpdmVyUG9saWN5U3RhdGVtZW50cyhcclxuICBrbXNLZXlzPzoga21zLktleVtdXHJcbik6IFN0YXRlbWVudFtdIHtcclxuICBjb25zdCByZXN1bHQ6IFN0YXRlbWVudFtdID0gW1xyXG4gICAge1xyXG4gICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICBcImVsYXN0aWNmaWxlc3lzdGVtOkRlc2NyaWJlQWNjZXNzUG9pbnRzXCIsXHJcbiAgICAgICAgXCJlbGFzdGljZmlsZXN5c3RlbTpEZXNjcmliZUZpbGVTeXN0ZW1zXCIsXHJcbiAgICAgICAgXCJlbGFzdGljZmlsZXN5c3RlbTpEZXNjcmliZU1vdW50VGFyZ2V0c1wiLFxyXG4gICAgICAgIFwiZWMyOkRlc2NyaWJlQXZhaWxhYmlsaXR5Wm9uZXNcIlxyXG4gICAgICBdLFxyXG4gICAgICBcIlJlc291cmNlXCI6IFwiKlwiXHJcbiAgICB9LFxyXG4gICAge1xyXG4gICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICBcImVsYXN0aWNmaWxlc3lzdGVtOkNyZWF0ZUFjY2Vzc1BvaW50XCIsXHJcbiAgICAgICAgXCJlbGFzdGljZmlsZXN5c3RlbTpUYWdSZXNvdXJjZVwiLFxyXG4gICAgICBdLFxyXG4gICAgICBcIlJlc291cmNlXCI6IFwiKlwiLFxyXG4gICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgXCJTdHJpbmdMaWtlXCI6IHtcclxuICAgICAgICAgIFwiYXdzOlJlcXVlc3RUYWcvZWZzLmNzaS5hd3MuY29tL2NsdXN0ZXJcIjogXCJ0cnVlXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICB7XHJcbiAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgXCJBY3Rpb25cIjogXCJlbGFzdGljZmlsZXN5c3RlbTpEZWxldGVBY2Nlc3NQb2ludFwiLFxyXG4gICAgICBcIlJlc291cmNlXCI6IFwiKlwiLFxyXG4gICAgICBcIkNvbmRpdGlvblwiOiB7XHJcbiAgICAgICAgXCJTdHJpbmdFcXVhbHNcIjoge1xyXG4gICAgICAgICAgXCJhd3M6UmVzb3VyY2VUYWcvZWZzLmNzaS5hd3MuY29tL2NsdXN0ZXJcIjogXCJ0cnVlXCJcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuICBdO1xyXG4gIGlmIChrbXNLZXlzKSB7XHJcbiAgICBjb25zdCBrbXNLZXlzQXJucyA9IGttc0tleXMubWFwKChrKSA9PiBrLmtleUFybik7XHJcbiAgICBjb25zdCBrbXNQb2xpY3k6IFN0YXRlbWVudFtdID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgRWZmZWN0OiBcIkFsbG93XCIsXHJcbiAgICAgICAgQWN0aW9uOiBbXCJrbXM6Q3JlYXRlR3JhbnRcIiwgXCJrbXM6TGlzdEdyYW50c1wiLCBcImttczpSZXZva2VHcmFudFwiXSxcclxuICAgICAgICBSZXNvdXJjZToga21zS2V5c0FybnMsXHJcbiAgICAgICAgQ29uZGl0aW9uOiB7XHJcbiAgICAgICAgICBCb29sOiB7XHJcbiAgICAgICAgICAgIFwia21zOkdyYW50SXNGb3JBV1NSZXNvdXJjZVwiOiBcInRydWVcIixcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIEVmZmVjdDogXCJBbGxvd1wiLFxyXG4gICAgICAgIEFjdGlvbjogW1xyXG4gICAgICAgICAgXCJrbXM6RW5jcnlwdFwiLFxyXG4gICAgICAgICAgXCJrbXM6RGVjcnlwdFwiLFxyXG4gICAgICAgICAgXCJrbXM6UmVFbmNyeXB0KlwiLFxyXG4gICAgICAgICAgXCJrbXM6R2VuZXJhdGVEYXRhS2V5KlwiLFxyXG4gICAgICAgICAgXCJrbXM6RGVzY3JpYmVLZXlcIixcclxuICAgICAgICBdLFxyXG4gICAgICAgIFJlc291cmNlOiBrbXNLZXlzQXJucyxcclxuICAgICAgfSxcclxuICAgIF07XHJcbiAgICByZXN1bHQucHVzaCguLi5rbXNQb2xpY3kpO1xyXG4gIH1cclxuICByZXR1cm4gcmVzdWx0O1xyXG59XHJcbiJdfQ==