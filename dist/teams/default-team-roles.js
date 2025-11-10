"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DefaultTeamRoles = void 0;
class DefaultTeamRoles {
    createManifest(namespace) {
        return [
            {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRole",
                metadata: {
                    name: `${namespace}-team-cluster-role`
                },
                rules: [
                    {
                        apiGroups: [
                            ""
                        ],
                        resources: [
                            "nodes",
                            "namespaces"
                        ],
                        verbs: [
                            "get",
                            "list"
                        ]
                    }
                ]
            },
            {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRoleBinding",
                metadata: {
                    name: `${namespace}-team-cluster-role-binding`
                },
                subjects: [
                    {
                        kind: "Group",
                        name: `${namespace}-team-group`,
                        apiGroup: "rbac.authorization.k8s.io"
                    }
                ],
                roleRef: {
                    kind: "ClusterRole",
                    name: `${namespace}-team-cluster-role`,
                    apiGroup: "rbac.authorization.k8s.io"
                }
            },
            {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "Role",
                metadata: {
                    namespace: namespace,
                    name: `${namespace}-team-role`
                },
                rules: [
                    {
                        apiGroups: [
                            ""
                        ],
                        resources: [
                            "pods"
                        ],
                        verbs: [
                            "get",
                            "list"
                        ]
                    },
                    {
                        apiGroups: [
                            "apps"
                        ],
                        resources: [
                            "deployments",
                            "daemonsets",
                            "statefulsets",
                            "replicasets"
                        ],
                        verbs: [
                            "get",
                            "list"
                        ]
                    },
                    {
                        apiGroups: [
                            "batch"
                        ],
                        resources: [
                            "jobs"
                        ],
                        verbs: [
                            "get",
                            "list"
                        ]
                    }
                ]
            },
            {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "RoleBinding",
                metadata: {
                    name: `${namespace}-team-role-binding`,
                    namespace: namespace
                },
                subjects: [
                    {
                        kind: "Group",
                        name: `${namespace}-team-group`,
                        apiGroup: "rbac.authorization.k8s.io"
                    }
                ],
                roleRef: {
                    kind: "Role",
                    name: `${namespace}-team-role`,
                    apiGroup: "rbac.authorization.k8s.io"
                }
            }
        ];
    }
}
exports.DefaultTeamRoles = DefaultTeamRoles;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGVmYXVsdC10ZWFtLXJvbGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3RlYW1zL2RlZmF1bHQtdGVhbS1yb2xlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxNQUFhLGdCQUFnQjtJQUV6QixjQUFjLENBQUMsU0FBaUI7UUFDNUIsT0FBTztZQUNIO2dCQUNJLFVBQVUsRUFBRSw4QkFBOEI7Z0JBQzFDLElBQUksRUFBRSxhQUFhO2dCQUNuQixRQUFRLEVBQUU7b0JBQ04sSUFBSSxFQUFFLEdBQUcsU0FBUyxvQkFBb0I7aUJBQ3pDO2dCQUNELEtBQUssRUFBRTtvQkFDSDt3QkFDSSxTQUFTLEVBQUU7NEJBQ1AsRUFBRTt5QkFDTDt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsT0FBTzs0QkFDUCxZQUFZO3lCQUNmO3dCQUNELEtBQUssRUFBRTs0QkFDSCxLQUFLOzRCQUNMLE1BQU07eUJBQ1Q7cUJBQ0o7aUJBQ0o7YUFDSjtZQUNEO2dCQUNJLFVBQVUsRUFBRSw4QkFBOEI7Z0JBQzFDLElBQUksRUFBRSxvQkFBb0I7Z0JBQzFCLFFBQVEsRUFBRTtvQkFDTixJQUFJLEVBQUUsR0FBRyxTQUFTLDRCQUE0QjtpQkFDakQ7Z0JBQ0QsUUFBUSxFQUFFO29CQUNOO3dCQUNJLElBQUksRUFBRSxPQUFPO3dCQUNiLElBQUksRUFBRSxHQUFHLFNBQVMsYUFBYTt3QkFDL0IsUUFBUSxFQUFFLDJCQUEyQjtxQkFDeEM7aUJBQ0o7Z0JBQ0QsT0FBTyxFQUFFO29CQUNMLElBQUksRUFBRSxhQUFhO29CQUNuQixJQUFJLEVBQUUsR0FBRyxTQUFTLG9CQUFvQjtvQkFDdEMsUUFBUSxFQUFFLDJCQUEyQjtpQkFDeEM7YUFDSjtZQUNEO2dCQUNJLFVBQVUsRUFBRSw4QkFBOEI7Z0JBQzFDLElBQUksRUFBRSxNQUFNO2dCQUNaLFFBQVEsRUFBRTtvQkFDTixTQUFTLEVBQUUsU0FBUztvQkFDcEIsSUFBSSxFQUFFLEdBQUcsU0FBUyxZQUFZO2lCQUNqQztnQkFDRCxLQUFLLEVBQUU7b0JBQ0g7d0JBQ0ksU0FBUyxFQUFFOzRCQUNQLEVBQUU7eUJBQ0w7d0JBQ0QsU0FBUyxFQUFFOzRCQUNQLE1BQU07eUJBQ1Q7d0JBQ0QsS0FBSyxFQUFFOzRCQUNILEtBQUs7NEJBQ0wsTUFBTTt5QkFDVDtxQkFDSjtvQkFDRDt3QkFDSSxTQUFTLEVBQUU7NEJBQ1AsTUFBTTt5QkFDVDt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsYUFBYTs0QkFDYixZQUFZOzRCQUNaLGNBQWM7NEJBQ2QsYUFBYTt5QkFDaEI7d0JBQ0QsS0FBSyxFQUFFOzRCQUNILEtBQUs7NEJBQ0wsTUFBTTt5QkFDVDtxQkFDSjtvQkFDRDt3QkFDSSxTQUFTLEVBQUU7NEJBQ1AsT0FBTzt5QkFDVjt3QkFDRCxTQUFTLEVBQUU7NEJBQ1AsTUFBTTt5QkFDVDt3QkFDRCxLQUFLLEVBQUU7NEJBQ0gsS0FBSzs0QkFDTCxNQUFNO3lCQUNUO3FCQUNKO2lCQUNKO2FBQ0o7WUFDRDtnQkFDSSxVQUFVLEVBQUUsOEJBQThCO2dCQUMxQyxJQUFJLEVBQUUsYUFBYTtnQkFDbkIsUUFBUSxFQUFFO29CQUNOLElBQUksRUFBRSxHQUFHLFNBQVMsb0JBQW9CO29CQUN0QyxTQUFTLEVBQUUsU0FBUztpQkFDdkI7Z0JBQ0QsUUFBUSxFQUFFO29CQUNOO3dCQUNJLElBQUksRUFBRSxPQUFPO3dCQUNiLElBQUksRUFBRSxHQUFHLFNBQVMsYUFBYTt3QkFDL0IsUUFBUSxFQUFFLDJCQUEyQjtxQkFDeEM7aUJBQ0o7Z0JBQ0QsT0FBTyxFQUFFO29CQUNMLElBQUksRUFBRSxNQUFNO29CQUNaLElBQUksRUFBRSxHQUFHLFNBQVMsWUFBWTtvQkFDOUIsUUFBUSxFQUFFLDJCQUEyQjtpQkFDeEM7YUFDSjtTQUNKLENBQUM7SUFFTixDQUFDO0NBQ0o7QUFySEQsNENBcUhDIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGNsYXNzIERlZmF1bHRUZWFtUm9sZXMge1xyXG5cclxuICAgIGNyZWF0ZU1hbmlmZXN0KG5hbWVzcGFjZTogc3RyaW5nKTogUmVjb3JkPHN0cmluZywgYW55PltdIHtcclxuICAgICAgICByZXR1cm4gW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiBcInJiYWMuYXV0aG9yaXphdGlvbi5rOHMuaW8vdjFcIixcclxuICAgICAgICAgICAgICAgIGtpbmQ6IFwiQ2x1c3RlclJvbGVcIixcclxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYCR7bmFtZXNwYWNlfS10ZWFtLWNsdXN0ZXItcm9sZWBcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBydWxlczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpR3JvdXBzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcIlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJub2Rlc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJuYW1lc3BhY2VzXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmVyYnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiZ2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxpc3RcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiBcInJiYWMuYXV0aG9yaXphdGlvbi5rOHMuaW8vdjFcIixcclxuICAgICAgICAgICAgICAgIGtpbmQ6IFwiQ2x1c3RlclJvbGVCaW5kaW5nXCIsXHJcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGAke25hbWVzcGFjZX0tdGVhbS1jbHVzdGVyLXJvbGUtYmluZGluZ2BcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBzdWJqZWN0czogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAga2luZDogXCJHcm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBgJHtuYW1lc3BhY2V9LXRlYW0tZ3JvdXBgLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcGlHcm91cDogXCJyYmFjLmF1dGhvcml6YXRpb24uazhzLmlvXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgcm9sZVJlZjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGtpbmQ6IFwiQ2x1c3RlclJvbGVcIixcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBgJHtuYW1lc3BhY2V9LXRlYW0tY2x1c3Rlci1yb2xlYCxcclxuICAgICAgICAgICAgICAgICAgICBhcGlHcm91cDogXCJyYmFjLmF1dGhvcml6YXRpb24uazhzLmlvXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYXBpVmVyc2lvbjogXCJyYmFjLmF1dGhvcml6YXRpb24uazhzLmlvL3YxXCIsXHJcbiAgICAgICAgICAgICAgICBraW5kOiBcIlJvbGVcIixcclxuICAgICAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogYCR7bmFtZXNwYWNlfS10ZWFtLXJvbGVgXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcnVsZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFwaUdyb3VwczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwicG9kc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsaXN0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcGlHcm91cHM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYXBwc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkZXBsb3ltZW50c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJkYWVtb25zZXRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcInN0YXRlZnVsc2V0c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJyZXBsaWNhc2V0c1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsaXN0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBhcGlHcm91cHM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiYmF0Y2hcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwiam9ic1wiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZlcmJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImdldFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJsaXN0XCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgYXBpVmVyc2lvbjogXCJyYmFjLmF1dGhvcml6YXRpb24uazhzLmlvL3YxXCIsXHJcbiAgICAgICAgICAgICAgICBraW5kOiBcIlJvbGVCaW5kaW5nXCIsXHJcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IGAke25hbWVzcGFjZX0tdGVhbS1yb2xlLWJpbmRpbmdgLFxyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3ViamVjdHM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGtpbmQ6IFwiR3JvdXBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogYCR7bmFtZXNwYWNlfS10ZWFtLWdyb3VwYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBpR3JvdXA6IFwicmJhYy5hdXRob3JpemF0aW9uLms4cy5pb1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIHJvbGVSZWY6IHtcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBcIlJvbGVcIixcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiBgJHtuYW1lc3BhY2V9LXRlYW0tcm9sZWAsXHJcbiAgICAgICAgICAgICAgICAgICAgYXBpR3JvdXA6IFwicmJhYy5hdXRob3JpemF0aW9uLms4cy5pb1wiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdO1xyXG5cclxuICAgIH1cclxufSJdfQ==