"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuronMonitorManifest = void 0;
class NeuronMonitorManifest {
    constructor() { }
    generate(namespace, imageTag, port) {
        const deamonSetManifest = {
            apiVersion: "apps/v1",
            kind: "DaemonSet",
            metadata: {
                name: "neuron-monitor",
                namespace: namespace,
                labels: {
                    app: "neuron-monitor",
                    role: "master"
                }
            },
            spec: {
                selector: {
                    matchLabels: {
                        app: "neuron-monitor",
                        role: "master"
                    }
                },
                template: {
                    metadata: {
                        labels: {
                            app: "neuron-monitor",
                            role: "master"
                        }
                    },
                    spec: {
                        containers: [{
                                name: "app",
                                image: `public.ecr.aws/g4h4h0b5/neuron-monitor:${imageTag}`,
                                command: ["/bin/sh"],
                                args: ["-c", `neuron-monitor | neuron-monitor-prometheus.py --port ${port}`],
                                ports: [{
                                        name: "prom-node-exp",
                                        containerPort: port,
                                        hostPort: port
                                    }],
                                volumeMounts: [{
                                        name: "dev",
                                        mountPath: "/dev"
                                    }],
                                securityContext: {
                                    privileged: true
                                }
                            }],
                        tolerations: [{
                                key: "aws.amazon.com/neuron",
                                operator: "Exists",
                                effect: "NoSchedule"
                            }],
                        affinity: {
                            nodeAffinity: {
                                requiredDuringSchedulingIgnoredDuringExecution: {
                                    nodeSelectorTerms: [{
                                            matchExpressions: [{
                                                    key: "node.kubernetes.io/instance-type",
                                                    operator: "In",
                                                    values: [
                                                        "inf1.xlarge", "inf1.2xlarge", "inf1.6xlarge", "inf1.24xlarge",
                                                        "inf2.xlarge", "inf2.4xlarge", "inf2.8xlarge", "inf2.24xlarge", "inf2.48xlarge",
                                                        "trn1.2xlarge", "trn1.32xlarge", "trn1n.32xlarge"
                                                    ]
                                                }]
                                        }]
                                }
                            }
                        },
                        volumes: [{
                                name: "dev",
                                hostPath: {
                                    path: "/dev"
                                }
                            }],
                        restartPolicy: "Always"
                    }
                }
            }
        };
        const serviceManifest = {
            apiVersion: "v1",
            kind: "Service",
            metadata: {
                annotations: {
                    "prometheus.io/scrape": "true",
                    "prometheus.io/app-metrics": "true",
                    "prometheus.io/port": port.toString()
                },
                name: "neuron-monitor",
                namespace: namespace,
                labels: {
                    app: "neuron-monitor"
                }
            },
            spec: {
                clusterIP: "None",
                ports: [{
                        name: "neuron-monitor",
                        port: port,
                        protocol: "TCP"
                    }],
                selector: {
                    app: "neuron-monitor"
                },
                type: "ClusterIP"
            }
        };
        const manifest = [deamonSetManifest, serviceManifest];
        return manifest;
    }
}
exports.NeuronMonitorManifest = NeuronMonitorManifest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV1cm9uLW1vbml0b3ItY3VzdG9taXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvbmV1cm9uL25ldXJvbi1tb25pdG9yLWN1c3RvbWl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsTUFBYSxxQkFBcUI7SUFFOUIsZ0JBQWUsQ0FBQztJQUVULFFBQVEsQ0FBQyxTQUFpQixFQUFFLFFBQWdCLEVBQUUsSUFBWTtRQUU3RCxNQUFNLGlCQUFpQixHQUFHO1lBQ3RCLFVBQVUsRUFBRSxTQUFTO1lBQ3JCLElBQUksRUFBRSxXQUFXO1lBQ2pCLFFBQVEsRUFBRTtnQkFDTixJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixTQUFTLEVBQUUsU0FBUztnQkFDcEIsTUFBTSxFQUFFO29CQUNKLEdBQUcsRUFBRSxnQkFBZ0I7b0JBQ3JCLElBQUksRUFBRSxRQUFRO2lCQUNqQjthQUNKO1lBQ0QsSUFBSSxFQUFFO2dCQUNGLFFBQVEsRUFBRTtvQkFDTixXQUFXLEVBQUU7d0JBQ1QsR0FBRyxFQUFFLGdCQUFnQjt3QkFDckIsSUFBSSxFQUFFLFFBQVE7cUJBQ2pCO2lCQUNKO2dCQUNELFFBQVEsRUFBRTtvQkFDTixRQUFRLEVBQUU7d0JBQ04sTUFBTSxFQUFFOzRCQUNKLEdBQUcsRUFBRSxnQkFBZ0I7NEJBQ3JCLElBQUksRUFBRSxRQUFRO3lCQUNqQjtxQkFDSjtvQkFDRCxJQUFJLEVBQUU7d0JBQ0YsVUFBVSxFQUFFLENBQUM7Z0NBQ1QsSUFBSSxFQUFFLEtBQUs7Z0NBQ1gsS0FBSyxFQUFFLDBDQUEwQyxRQUFRLEVBQUU7Z0NBQzNELE9BQU8sRUFBRSxDQUFDLFNBQVMsQ0FBQztnQ0FDcEIsSUFBSSxFQUFFLENBQUMsSUFBSSxFQUFFLHdEQUF3RCxJQUFJLEVBQUUsQ0FBQztnQ0FDNUUsS0FBSyxFQUFFLENBQUM7d0NBQ0osSUFBSSxFQUFFLGVBQWU7d0NBQ3JCLGFBQWEsRUFBRSxJQUFJO3dDQUNuQixRQUFRLEVBQUUsSUFBSTtxQ0FDakIsQ0FBQztnQ0FDRixZQUFZLEVBQUUsQ0FBQzt3Q0FDWCxJQUFJLEVBQUUsS0FBSzt3Q0FDWCxTQUFTLEVBQUUsTUFBTTtxQ0FDcEIsQ0FBQztnQ0FDRixlQUFlLEVBQUU7b0NBQ2IsVUFBVSxFQUFFLElBQUk7aUNBQ25COzZCQUNKLENBQUM7d0JBQ0YsV0FBVyxFQUFFLENBQUM7Z0NBQ1YsR0FBRyxFQUFFLHVCQUF1QjtnQ0FDNUIsUUFBUSxFQUFFLFFBQVE7Z0NBQ2xCLE1BQU0sRUFBRSxZQUFZOzZCQUN2QixDQUFDO3dCQUNGLFFBQVEsRUFBRTs0QkFDTixZQUFZLEVBQUU7Z0NBQ1YsOENBQThDLEVBQUU7b0NBQzVDLGlCQUFpQixFQUFFLENBQUM7NENBQ2hCLGdCQUFnQixFQUFFLENBQUM7b0RBQ2YsR0FBRyxFQUFFLGtDQUFrQztvREFDdkMsUUFBUSxFQUFFLElBQUk7b0RBQ2QsTUFBTSxFQUFFO3dEQUNKLGFBQWEsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGVBQWU7d0RBQzlELGFBQWEsRUFBRSxjQUFjLEVBQUUsY0FBYyxFQUFFLGVBQWUsRUFBRSxlQUFlO3dEQUMvRSxjQUFjLEVBQUUsZUFBZSxFQUFFLGdCQUFnQjtxREFDcEQ7aURBQ0osQ0FBQzt5Q0FDTCxDQUFDO2lDQUNMOzZCQUNKO3lCQUNKO3dCQUNELE9BQU8sRUFBRSxDQUFDO2dDQUNOLElBQUksRUFBRSxLQUFLO2dDQUNYLFFBQVEsRUFBRTtvQ0FDTixJQUFJLEVBQUUsTUFBTTtpQ0FDZjs2QkFDSixDQUFDO3dCQUNGLGFBQWEsRUFBRSxRQUFRO3FCQUMxQjtpQkFDSjthQUNKO1NBQ0osQ0FBQztRQUVGLE1BQU0sZUFBZSxHQUFHO1lBQ3BCLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLElBQUksRUFBRSxTQUFTO1lBQ2YsUUFBUSxFQUFFO2dCQUNOLFdBQVcsRUFBRTtvQkFDVCxzQkFBc0IsRUFBRSxNQUFNO29CQUM5QiwyQkFBMkIsRUFBRSxNQUFNO29CQUNuQyxvQkFBb0IsRUFBRSxJQUFJLENBQUMsUUFBUSxFQUFFO2lCQUN4QztnQkFDRCxJQUFJLEVBQUUsZ0JBQWdCO2dCQUN0QixTQUFTLEVBQUUsU0FBUztnQkFDcEIsTUFBTSxFQUFFO29CQUNKLEdBQUcsRUFBRSxnQkFBZ0I7aUJBQ3hCO2FBQ0o7WUFDRCxJQUFJLEVBQUU7Z0JBQ0YsU0FBUyxFQUFFLE1BQU07Z0JBQ2pCLEtBQUssRUFBRSxDQUFDO3dCQUNKLElBQUksRUFBRSxnQkFBZ0I7d0JBQ3RCLElBQUksRUFBRSxJQUFJO3dCQUNWLFFBQVEsRUFBRSxLQUFLO3FCQUNsQixDQUFDO2dCQUNGLFFBQVEsRUFBRTtvQkFDTixHQUFHLEVBQUUsZ0JBQWdCO2lCQUN4QjtnQkFDRCxJQUFJLEVBQUUsV0FBVzthQUNwQjtTQUNKLENBQUM7UUFFRixNQUFNLFFBQVEsR0FBRyxDQUFDLGlCQUFpQixFQUFFLGVBQWUsQ0FBQyxDQUFDO1FBQ3RELE9BQU8sUUFBUSxDQUFDO0lBQ3BCLENBQUM7Q0FDSjtBQXBIRCxzREFvSEMiLCJzb3VyY2VzQ29udGVudCI6WyJcclxuZXhwb3J0IGNsYXNzIE5ldXJvbk1vbml0b3JNYW5pZmVzdCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IoKSB7fVxyXG5cclxuICAgIHB1YmxpYyBnZW5lcmF0ZShuYW1lc3BhY2U6IHN0cmluZywgaW1hZ2VUYWc6IHN0cmluZywgcG9ydDogbnVtYmVyKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgZGVhbW9uU2V0TWFuaWZlc3QgPSB7XHJcbiAgICAgICAgICAgIGFwaVZlcnNpb246IFwiYXBwcy92MVwiLFxyXG4gICAgICAgICAgICBraW5kOiBcIkRhZW1vblNldFwiLFxyXG4gICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJuZXVyb24tbW9uaXRvclwiLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2UsXHJcbiAgICAgICAgICAgICAgICBsYWJlbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICBhcHA6IFwibmV1cm9uLW1vbml0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICByb2xlOiBcIm1hc3RlclwiXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgbWF0Y2hMYWJlbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgYXBwOiBcIm5ldXJvbi1tb25pdG9yXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHJvbGU6IFwibWFzdGVyXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgdGVtcGxhdGU6IHtcclxuICAgICAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGFwcDogXCJuZXVyb24tbW9uaXRvclwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcm9sZTogXCJtYXN0ZXJcIlxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBzcGVjOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRhaW5lcnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiBcImFwcFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW1hZ2U6IGBwdWJsaWMuZWNyLmF3cy9nNGg0aDBiNS9uZXVyb24tbW9uaXRvcjoke2ltYWdlVGFnfWAsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kOiBbXCIvYmluL3NoXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYXJnczogW1wiLWNcIiwgYG5ldXJvbi1tb25pdG9yIHwgbmV1cm9uLW1vbml0b3ItcHJvbWV0aGV1cy5weSAtLXBvcnQgJHtwb3J0fWBdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcG9ydHM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJwcm9tLW5vZGUtZXhwXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29udGFpbmVyUG9ydDogcG9ydCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0UG9ydDogcG9ydFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2b2x1bWVNb3VudHM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJkZXZcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBtb3VudFBhdGg6IFwiL2RldlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlY3VyaXR5Q29udGV4dDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByaXZpbGVnZWQ6IHRydWVcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvbGVyYXRpb25zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBcImF3cy5hbWF6b24uY29tL25ldXJvblwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IFwiRXhpc3RzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlZmZlY3Q6IFwiTm9TY2hlZHVsZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBhZmZpbml0eToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbm9kZUFmZmluaXR5OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWlyZWREdXJpbmdTY2hlZHVsaW5nSWdub3JlZER1cmluZ0V4ZWN1dGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlU2VsZWN0b3JUZXJtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoRXhwcmVzc2lvbnM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAga2V5OiBcIm5vZGUua3ViZXJuZXRlcy5pby9pbnN0YW5jZS10eXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgb3BlcmF0b3I6IFwiSW5cIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpbmYxLnhsYXJnZVwiLCBcImluZjEuMnhsYXJnZVwiLCBcImluZjEuNnhsYXJnZVwiLCBcImluZjEuMjR4bGFyZ2VcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXCJpbmYyLnhsYXJnZVwiLCBcImluZjIuNHhsYXJnZVwiLCBcImluZjIuOHhsYXJnZVwiLCBcImluZjIuMjR4bGFyZ2VcIiwgXCJpbmYyLjQ4eGxhcmdlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFwidHJuMS4yeGxhcmdlXCIsIFwidHJuMS4zMnhsYXJnZVwiLCBcInRybjFuLjMyeGxhcmdlXCJcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdm9sdW1lczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiZGV2XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0UGF0aDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhdGg6IFwiL2RldlwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICByZXN0YXJ0UG9saWN5OiBcIkFsd2F5c1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBzZXJ2aWNlTWFuaWZlc3QgPSB7XHJcbiAgICAgICAgICAgIGFwaVZlcnNpb246IFwidjFcIixcclxuICAgICAgICAgICAga2luZDogXCJTZXJ2aWNlXCIsXHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvbWV0aGV1cy5pby9zY3JhcGVcIjogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJwcm9tZXRoZXVzLmlvL2FwcC1tZXRyaWNzXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwicHJvbWV0aGV1cy5pby9wb3J0XCI6IHBvcnQudG9TdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwibmV1cm9uLW1vbml0b3JcIixcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlLFxyXG4gICAgICAgICAgICAgICAgbGFiZWxzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwOiBcIm5ldXJvbi1tb25pdG9yXCJcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgY2x1c3RlcklQOiBcIk5vbmVcIixcclxuICAgICAgICAgICAgICAgIHBvcnRzOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwibmV1cm9uLW1vbml0b3JcIixcclxuICAgICAgICAgICAgICAgICAgICBwb3J0OiBwb3J0LFxyXG4gICAgICAgICAgICAgICAgICAgIHByb3RvY29sOiBcIlRDUFwiXHJcbiAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgIHNlbGVjdG9yOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgYXBwOiBcIm5ldXJvbi1tb25pdG9yXCJcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIkNsdXN0ZXJJUFwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IG1hbmlmZXN0ID0gW2RlYW1vblNldE1hbmlmZXN0LCBzZXJ2aWNlTWFuaWZlc3RdO1xyXG4gICAgICAgIHJldHVybiBtYW5pZmVzdDtcclxuICAgIH1cclxufVxyXG4iXX0=