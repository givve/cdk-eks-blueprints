"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var SSMAgentAddOn_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SSMAgentAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const cluster_providers_1 = require("../../cluster-providers");
const utils = require("../../utils");
let SSMAgentAddOn = SSMAgentAddOn_1 = class SSMAgentAddOn {
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const nodeGroups = (0, cluster_providers_1.assertEC2NodeGroup)(clusterInfo, SSMAgentAddOn_1.name);
        // Add AWS Managed Policy for SSM
        nodeGroups.forEach(nodeGroup => nodeGroup.role.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')));
        // Apply manifest.
        // See APG Pattern https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/install-ssm-agent-on-amazon-eks-worker-nodes-by-using-kubernetes-daemonset.html
        const appLabel = { app: "ssm-installer" };
        const daemonSet = {
            apiVersion: "apps/v1",
            kind: "DaemonSet",
            metadata: {
                name: "ssm-installer",
                namespace: "kube-system"
            },
            spec: {
                selector: { matchLabels: appLabel },
                updateStrategy: { type: "RollingUpdate" },
                template: {
                    metadata: { labels: appLabel },
                    spec: {
                        containers: [
                            {
                                name: "pause",
                                image: "gcr.io/google_containers/pause",
                                resources: {
                                    limits: {
                                        cpu: "100m",
                                        memory: "128Mi",
                                    },
                                    requests: {
                                        cpu: "100m",
                                        memory: "128Mi",
                                    },
                                }
                            }
                        ],
                        initContainers: [
                            {
                                image: "public.ecr.aws/amazon-ssm-agent/amazon-ssm-agent:3.2.2222.0",
                                imagePullPolicy: "Always",
                                name: "ssm-install",
                                securityContext: {
                                    allowPrivilegeEscalation: true
                                },
                                volumeMounts: [
                                    {
                                        mountPath: "/etc/cron.d",
                                        name: "cronfile"
                                    }
                                ],
                                resources: {
                                    limits: {
                                        cpu: "100m",
                                        memory: "256Mi",
                                    },
                                    requests: {
                                        cpu: "100m",
                                        memory: "256Mi",
                                    },
                                },
                                terminationMessagePath: "/dev/termination.log",
                                terminationMessagePolicy: "File",
                            }
                        ],
                        volumes: [
                            {
                                name: "cronfile",
                                hostPath: {
                                    path: "/etc/cron.d",
                                    type: "DirectoryOrCreate"
                                }
                            }
                        ],
                        dnsPolicy: "ClusterFirst",
                        restartPolicy: "Always",
                        schedulerName: "default-scheduler",
                        terminationGracePeriodSeconds: 30
                    }
                }
            }
        };
        new aws_eks_1.KubernetesManifest(cluster.stack, "ssm-agent", {
            cluster,
            manifest: [daemonSet]
        });
    }
};
exports.SSMAgentAddOn = SSMAgentAddOn;
__decorate([
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.NOT_SUPPORTED)
], SSMAgentAddOn.prototype, "deploy", null);
exports.SSMAgentAddOn = SSMAgentAddOn = SSMAgentAddOn_1 = __decorate([
    utils.supportsX86
], SSMAgentAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3NzbS1hZ2VudC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsaURBQXlEO0FBQ3pELGlEQUFvRDtBQUNwRCwrREFBNkQ7QUFFN0QscUNBQXFDO0FBRzlCLElBQU0sYUFBYSxxQkFBbkIsTUFBTSxhQUFhO0lBRXRCLE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLE1BQU0sVUFBVSxHQUFHLElBQUEsc0NBQWtCLEVBQUMsV0FBVyxFQUFFLGVBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUV2RSxpQ0FBaUM7UUFDakMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsRUFBRSxDQUMzQixTQUFTLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsOEJBQThCLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFFN0csa0JBQWtCO1FBQ2xCLG9LQUFvSztRQUNwSyxNQUFNLFFBQVEsR0FBRyxFQUFFLEdBQUcsRUFBRSxlQUFlLEVBQUUsQ0FBQztRQUUxQyxNQUFNLFNBQVMsR0FBRztZQUNkLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLElBQUksRUFBRSxXQUFXO1lBQ2pCLFFBQVEsRUFBRTtnQkFDTixJQUFJLEVBQUUsZUFBZTtnQkFDckIsU0FBUyxFQUFFLGFBQWE7YUFDM0I7WUFDRCxJQUFJLEVBQUU7Z0JBQ0YsUUFBUSxFQUFFLEVBQUUsV0FBVyxFQUFFLFFBQVEsRUFBRTtnQkFDbkMsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLGVBQWUsRUFBRTtnQkFDekMsUUFBUSxFQUFFO29CQUNOLFFBQVEsRUFBRSxFQUFFLE1BQU0sRUFBRSxRQUFRLEVBQUU7b0JBQzlCLElBQUksRUFBRTt3QkFDRixVQUFVLEVBQUU7NEJBQ1I7Z0NBQ0ksSUFBSSxFQUFFLE9BQU87Z0NBQ2IsS0FBSyxFQUFFLGdDQUFnQztnQ0FDdkMsU0FBUyxFQUFFO29DQUNQLE1BQU0sRUFBRTt3Q0FDSixHQUFHLEVBQUUsTUFBTTt3Q0FDWCxNQUFNLEVBQUUsT0FBTztxQ0FDbEI7b0NBQ0QsUUFBUSxFQUFFO3dDQUNOLEdBQUcsRUFBRSxNQUFNO3dDQUNYLE1BQU0sRUFBRSxPQUFPO3FDQUNsQjtpQ0FDSjs2QkFDSjt5QkFDSjt3QkFDRCxjQUFjLEVBQUU7NEJBQ1o7Z0NBQ0ksS0FBSyxFQUFFLDZEQUE2RDtnQ0FDcEUsZUFBZSxFQUFFLFFBQVE7Z0NBQ3pCLElBQUksRUFBRSxhQUFhO2dDQUNuQixlQUFlLEVBQUU7b0NBQ2Isd0JBQXdCLEVBQUUsSUFBSTtpQ0FDakM7Z0NBQ0QsWUFBWSxFQUFFO29DQUNWO3dDQUNJLFNBQVMsRUFBRSxhQUFhO3dDQUN4QixJQUFJLEVBQUUsVUFBVTtxQ0FDbkI7aUNBQ0o7Z0NBQ0QsU0FBUyxFQUFFO29DQUNQLE1BQU0sRUFBRTt3Q0FDSixHQUFHLEVBQUUsTUFBTTt3Q0FDWCxNQUFNLEVBQUUsT0FBTztxQ0FDbEI7b0NBQ0QsUUFBUSxFQUFFO3dDQUNOLEdBQUcsRUFBRSxNQUFNO3dDQUNYLE1BQU0sRUFBRSxPQUFPO3FDQUNsQjtpQ0FDSjtnQ0FDRCxzQkFBc0IsRUFBRSxzQkFBc0I7Z0NBQzlDLHdCQUF3QixFQUFFLE1BQU07NkJBQ25DO3lCQUNKO3dCQUNELE9BQU8sRUFBRTs0QkFDTDtnQ0FDSSxJQUFJLEVBQUUsVUFBVTtnQ0FDaEIsUUFBUSxFQUFFO29DQUNOLElBQUksRUFBRSxhQUFhO29DQUNuQixJQUFJLEVBQUUsbUJBQW1CO2lDQUM1Qjs2QkFDSjt5QkFDSjt3QkFDRCxTQUFTLEVBQUUsY0FBYzt3QkFDekIsYUFBYSxFQUFFLFFBQVE7d0JBQ3ZCLGFBQWEsRUFBRSxtQkFBbUI7d0JBQ2xDLDZCQUE2QixFQUFFLEVBQUU7cUJBQ3BDO2lCQUNKO2FBQ0o7U0FDSixDQUFDO1FBRUYsSUFBSSw0QkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLFdBQVcsRUFBRTtZQUMvQyxPQUFPO1lBQ1AsUUFBUSxFQUFFLENBQUMsU0FBUyxDQUFDO1NBQ3hCLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFBO0FBOUZZLHNDQUFhO0FBRXRCO0lBREMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxhQUFhLENBQUM7MkNBNEZyRTt3QkE3RlEsYUFBYTtJQUR6QixLQUFLLENBQUMsV0FBVztHQUNMLGFBQWEsQ0E4RnpCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgS3ViZXJuZXRlc01hbmlmZXN0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IGFzc2VydEVDMk5vZGVHcm91cCB9IGZyb20gXCIuLi8uLi9jbHVzdGVyLXByb3ZpZGVyc1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVyQWRkT24sIENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuXHJcbkB1dGlscy5zdXBwb3J0c1g4NlxyXG5leHBvcnQgY2xhc3MgU1NNQWdlbnRBZGRPbiBpbXBsZW1lbnRzIENsdXN0ZXJBZGRPbiB7XHJcbiAgICBAdXRpbHMuY29uZmxpY3RzV2l0aEF1dG9Nb2RlKHV0aWxzLkF1dG9Nb2RlQ29uZmxpY3RUeXBlLk5PVF9TVVBQT1JURUQpXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICAgICAgY29uc3Qgbm9kZUdyb3VwcyA9IGFzc2VydEVDMk5vZGVHcm91cChjbHVzdGVySW5mbywgU1NNQWdlbnRBZGRPbi5uYW1lKTtcclxuXHJcbiAgICAgICAgLy8gQWRkIEFXUyBNYW5hZ2VkIFBvbGljeSBmb3IgU1NNXHJcbiAgICAgICAgbm9kZUdyb3Vwcy5mb3JFYWNoKG5vZGVHcm91cCA9PiBcclxuICAgICAgICAgICAgbm9kZUdyb3VwLnJvbGUuYWRkTWFuYWdlZFBvbGljeShNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQW1hem9uU1NNTWFuYWdlZEluc3RhbmNlQ29yZScpKSk7XHJcblxyXG4gICAgICAgIC8vIEFwcGx5IG1hbmlmZXN0LlxyXG4gICAgICAgIC8vIFNlZSBBUEcgUGF0dGVybiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vcHJlc2NyaXB0aXZlLWd1aWRhbmNlL2xhdGVzdC9wYXR0ZXJucy9pbnN0YWxsLXNzbS1hZ2VudC1vbi1hbWF6b24tZWtzLXdvcmtlci1ub2Rlcy1ieS11c2luZy1rdWJlcm5ldGVzLWRhZW1vbnNldC5odG1sXHJcbiAgICAgICAgY29uc3QgYXBwTGFiZWwgPSB7IGFwcDogXCJzc20taW5zdGFsbGVyXCIgfTtcclxuXHJcbiAgICAgICAgY29uc3QgZGFlbW9uU2V0ID0ge1xyXG4gICAgICAgICAgICBhcGlWZXJzaW9uOiBcImFwcHMvdjFcIixcclxuICAgICAgICAgICAga2luZDogXCJEYWVtb25TZXRcIixcclxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwic3NtLWluc3RhbGxlclwiLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBcImt1YmUtc3lzdGVtXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgc2VsZWN0b3I6IHsgbWF0Y2hMYWJlbHM6IGFwcExhYmVsIH0sXHJcbiAgICAgICAgICAgICAgICB1cGRhdGVTdHJhdGVneTogeyB0eXBlOiBcIlJvbGxpbmdVcGRhdGVcIiB9LFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YTogeyBsYWJlbHM6IGFwcExhYmVsIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb250YWluZXJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJwYXVzZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGltYWdlOiBcImdjci5pby9nb29nbGVfY29udGFpbmVycy9wYXVzZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc291cmNlczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsaW1pdHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNwdTogXCIxMDBtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW1vcnk6IFwiMTI4TWlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNwdTogXCIxMDBtXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtZW1vcnk6IFwiMTI4TWlcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGluaXRDb250YWluZXJzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IFwicHVibGljLmVjci5hd3MvYW1hem9uLXNzbS1hZ2VudC9hbWF6b24tc3NtLWFnZW50OjMuMi4yMjIyLjBcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpbWFnZVB1bGxQb2xpY3k6IFwiQWx3YXlzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJzc20taW5zdGFsbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5Q29udGV4dDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhbGxvd1ByaXZpbGVnZUVzY2FsYXRpb246IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZvbHVtZU1vdW50czogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3VudFBhdGg6IFwiL2V0Yy9jcm9uLmRcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY3JvbmZpbGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvdXJjZXM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbGltaXRzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHU6IFwiMTAwbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtb3J5OiBcIjI1Nk1pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjcHU6IFwiMTAwbVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbWVtb3J5OiBcIjI1Nk1pXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0ZXJtaW5hdGlvbk1lc3NhZ2VQYXRoOiBcIi9kZXYvdGVybWluYXRpb24ubG9nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVybWluYXRpb25NZXNzYWdlUG9saWN5OiBcIkZpbGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdm9sdW1lczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiY3JvbmZpbGVcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0UGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRoOiBcIi9ldGMvY3Jvbi5kXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiRGlyZWN0b3J5T3JDcmVhdGVcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgZG5zUG9saWN5OiBcIkNsdXN0ZXJGaXJzdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0YXJ0UG9saWN5OiBcIkFsd2F5c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBzY2hlZHVsZXJOYW1lOiBcImRlZmF1bHQtc2NoZWR1bGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlcm1pbmF0aW9uR3JhY2VQZXJpb2RTZWNvbmRzOiAzMFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIG5ldyBLdWJlcm5ldGVzTWFuaWZlc3QoY2x1c3Rlci5zdGFjaywgXCJzc20tYWdlbnRcIiwge1xyXG4gICAgICAgICAgICBjbHVzdGVyLFxyXG4gICAgICAgICAgICBtYW5pZmVzdDogW2RhZW1vblNldF1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxufVxyXG4iXX0=