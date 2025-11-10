"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerInsightsAddOn = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
const defaultProps = {
    name: "adot-exporter-for-eks-on-ec2",
    namespace: undefined, // the chart will choke if this value is set
    chart: "adot-exporter-for-eks-on-ec2",
    version: "0.22.0",
    release: "adot-eks-addon",
    repository: "https://aws-observability.github.io/aws-otel-helm-charts"
};
/**
 * @deprecated use CloudWatch Insights add-on instead
 */
let ContainerInsightsAddOn = class ContainerInsightsAddOn extends helm_addon_1.HelmAddOn {
    constructor(props) {
        super({ ...defaultProps, ...props });
    }
    /**
     * @override
     */
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const policy = aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy');
        // Create an adot-collector service account.
        const serviceAccountName = "adot-collector-sa";
        let serviceAccountNamespace;
        if (this.props.namespace) {
            serviceAccountNamespace = this.props.namespace;
        }
        else {
            serviceAccountNamespace = "amazon-metrics";
        }
        const ns = (0, utils_1.createNamespace)(serviceAccountNamespace, cluster, true);
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: serviceAccountNamespace,
        });
        // Apply Managed IAM policy to the service account.
        sa.role.addManagedPolicy(policy);
        sa.node.addDependency(ns);
        let values = {
            awsRegion: cluster.stack.region,
            clusterName: cluster.clusterName,
            serviceAccount: {
                create: false,
            },
            adotCollector: {
                daemonSet: {
                    createNamespace: false,
                    service: {
                        metrics: {
                            receivers: ["awscontainerinsightreceiver"],
                            exporters: ["awsemf"],
                        }
                    },
                    serviceAccount: {
                        create: false,
                    },
                    cwexporters: {
                        logStreamName: "EKSNode",
                    }
                }
            }
        };
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values, true, false);
        chart.node.addDependency(sa);
        return Promise.resolve(chart);
    }
};
exports.ContainerInsightsAddOn = ContainerInsightsAddOn;
__decorate([
    (0, utils_1.conflictsWith)("AdotCollectorAddOn")
], ContainerInsightsAddOn.prototype, "deploy", null);
exports.ContainerInsightsAddOn = ContainerInsightsAddOn = __decorate([
    utils_1.supportsALL
], ContainerInsightsAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2NvbnRhaW5lci1pbnNpZ2h0cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpREFBb0Q7QUFFcEQsK0NBQXFDO0FBRXJDLDhDQUE4RDtBQUU5RCx1Q0FBMEU7QUFTMUUsTUFBTSxZQUFZLEdBQUc7SUFDakIsSUFBSSxFQUFFLDhCQUE4QjtJQUNwQyxTQUFTLEVBQUUsU0FBUyxFQUFFLDRDQUE0QztJQUNsRSxLQUFLLEVBQUUsOEJBQThCO0lBQ3JDLE9BQU8sRUFBRSxRQUFRO0lBQ2pCLE9BQU8sRUFBRSxnQkFBZ0I7SUFDekIsVUFBVSxFQUFFLDBEQUEwRDtDQUN6RSxDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLHNCQUFzQixHQUE1QixNQUFNLHNCQUF1QixTQUFRLHNCQUFTO0lBRWpELFlBQVksS0FBa0M7UUFDMUMsS0FBSyxDQUFDLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFFRDs7T0FFRztJQUVILE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLE1BQU0sTUFBTSxHQUFHLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUVyRiw0Q0FBNEM7UUFDNUMsTUFBTSxrQkFBa0IsR0FBRyxtQkFBbUIsQ0FBQztRQUMvQyxJQUFJLHVCQUF1QixDQUFDO1FBRTVCLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQztZQUN2Qix1QkFBdUIsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFNBQVMsQ0FBQztRQUNuRCxDQUFDO2FBQ0ksQ0FBQztZQUNGLHVCQUF1QixHQUFHLGdCQUFnQixDQUFDO1FBQy9DLENBQUM7UUFFRCxNQUFNLEVBQUUsR0FBRyxJQUFBLHVCQUFlLEVBQUMsdUJBQXVCLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQ25FLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsRUFBRTtZQUNyRCxJQUFJLEVBQUUsa0JBQWtCO1lBQ3hCLFNBQVMsRUFBRSx1QkFBdUI7U0FDckMsQ0FBQyxDQUFDO1FBRUgsbURBQW1EO1FBQ25ELEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFMUIsSUFBSSxNQUFNLEdBQWlCO1lBQ3ZCLFNBQVMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDL0IsV0FBVyxFQUFFLE9BQU8sQ0FBQyxXQUFXO1lBQ2hDLGNBQWMsRUFBRTtnQkFDWixNQUFNLEVBQUUsS0FBSzthQUNoQjtZQUNELGFBQWEsRUFBRTtnQkFDWCxTQUFTLEVBQUU7b0JBQ1AsZUFBZSxFQUFFLEtBQUs7b0JBQ3RCLE9BQU8sRUFBRTt3QkFDTCxPQUFPLEVBQUU7NEJBQ0wsU0FBUyxFQUFFLENBQUMsNkJBQTZCLENBQUM7NEJBQzFDLFNBQVMsRUFBRSxDQUFDLFFBQVEsQ0FBQzt5QkFDeEI7cUJBQ0o7b0JBQ0QsY0FBYyxFQUFFO3dCQUNaLE1BQU0sRUFBRSxLQUFLO3FCQUNoQjtvQkFDRCxXQUFXLEVBQUU7d0JBQ1QsYUFBYSxFQUFFLFNBQVM7cUJBQzNCO2lCQUNKO2FBQ0o7U0FDSixDQUFDO1FBRUYsTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFFaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxLQUFLLENBQUMsQ0FBQztRQUNsRSxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztDQUNKLENBQUE7QUFsRVksd0RBQXNCO0FBVS9CO0lBREMsSUFBQSxxQkFBYSxFQUFDLG9CQUFvQixDQUFDO29EQXdEbkM7aUNBakVRLHNCQUFzQjtJQURsQyxtQkFBVztHQUNDLHNCQUFzQixDQWtFbEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNYW5hZ2VkUG9saWN5IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IFZhbHVlc1NjaGVtYSB9IGZyb20gXCIuL3ZhbHVlc1wiO1xyXG5pbXBvcnQgeyBjb25mbGljdHNXaXRoLCBjcmVhdGVOYW1lc3BhY2UsIHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG4vKipcclxuICogQGRlcHJlY2F0ZWQgdXNlIENsb3VkV2F0Y2ggSW5zaWdodHMgYWRkLW9uIGluc3RlYWRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ29udGFpbmVySW5zaWdodEFkZG9uUHJvcHMgZXh0ZW5kcyBPbWl0PEhlbG1BZGRPblVzZXJQcm9wcywgXCJuYW1lc3BhY2VcIj4ge1xyXG4gICAgdmFsdWVzPzogVmFsdWVzU2NoZW1hXHJcbn1cclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIG5hbWU6IFwiYWRvdC1leHBvcnRlci1mb3ItZWtzLW9uLWVjMlwiLFxyXG4gICAgbmFtZXNwYWNlOiB1bmRlZmluZWQsIC8vIHRoZSBjaGFydCB3aWxsIGNob2tlIGlmIHRoaXMgdmFsdWUgaXMgc2V0XHJcbiAgICBjaGFydDogXCJhZG90LWV4cG9ydGVyLWZvci1la3Mtb24tZWMyXCIsXHJcbiAgICB2ZXJzaW9uOiBcIjAuMjIuMFwiLFxyXG4gICAgcmVsZWFzZTogXCJhZG90LWVrcy1hZGRvblwiLFxyXG4gICAgcmVwb3NpdG9yeTogXCJodHRwczovL2F3cy1vYnNlcnZhYmlsaXR5LmdpdGh1Yi5pby9hd3Mtb3RlbC1oZWxtLWNoYXJ0c1wiXHJcbn07XHJcblxyXG4vKipcclxuICogQGRlcHJlY2F0ZWQgdXNlIENsb3VkV2F0Y2ggSW5zaWdodHMgYWRkLW9uIGluc3RlYWRcclxuICovXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgQ29udGFpbmVySW5zaWdodHNBZGRPbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBDb250YWluZXJJbnNpZ2h0QWRkb25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsgLi4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEBvdmVycmlkZVxyXG4gICAgICovXHJcbiAgICBAY29uZmxpY3RzV2l0aChcIkFkb3RDb2xsZWN0b3JBZGRPblwiKVxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7ICAgICAgICBcclxuICAgICAgICBjb25zdCBwb2xpY3kgPSBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQ2xvdWRXYXRjaEFnZW50U2VydmVyUG9saWN5Jyk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQ3JlYXRlIGFuIGFkb3QtY29sbGVjdG9yIHNlcnZpY2UgYWNjb3VudC5cclxuICAgICAgICBjb25zdCBzZXJ2aWNlQWNjb3VudE5hbWUgPSBcImFkb3QtY29sbGVjdG9yLXNhXCI7XHJcbiAgICAgICAgbGV0IHNlcnZpY2VBY2NvdW50TmFtZXNwYWNlO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5wcm9wcy5uYW1lc3BhY2UpIHtcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnROYW1lc3BhY2UgPSB0aGlzLnByb3BzLm5hbWVzcGFjZTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgIHNlcnZpY2VBY2NvdW50TmFtZXNwYWNlID0gXCJhbWF6b24tbWV0cmljc1wiO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3QgbnMgPSBjcmVhdGVOYW1lc3BhY2Uoc2VydmljZUFjY291bnROYW1lc3BhY2UsIGNsdXN0ZXIsIHRydWUpO1xyXG4gICAgICAgIGNvbnN0IHNhID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudChzZXJ2aWNlQWNjb3VudE5hbWUsIHtcclxuICAgICAgICAgICAgbmFtZTogc2VydmljZUFjY291bnROYW1lLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IHNlcnZpY2VBY2NvdW50TmFtZXNwYWNlLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBcHBseSBNYW5hZ2VkIElBTSBwb2xpY3kgdG8gdGhlIHNlcnZpY2UgYWNjb3VudC5cclxuICAgICAgICBzYS5yb2xlLmFkZE1hbmFnZWRQb2xpY3kocG9saWN5KTtcclxuICAgICAgICBzYS5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG5cclxuICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZXNTY2hlbWEgPSB7XHJcbiAgICAgICAgICAgIGF3c1JlZ2lvbjogY2x1c3Rlci5zdGFjay5yZWdpb24sXHJcbiAgICAgICAgICAgIGNsdXN0ZXJOYW1lOiBjbHVzdGVyLmNsdXN0ZXJOYW1lLFxyXG4gICAgICAgICAgICBzZXJ2aWNlQWNjb3VudDoge1xyXG4gICAgICAgICAgICAgICAgY3JlYXRlOiBmYWxzZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgYWRvdENvbGxlY3Rvcjoge1xyXG4gICAgICAgICAgICAgICAgZGFlbW9uU2V0OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlTmFtZXNwYWNlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1ldHJpY3M6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2VpdmVyczogW1wiYXdzY29udGFpbmVyaW5zaWdodHJlY2VpdmVyXCJdLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXhwb3J0ZXJzOiBbXCJhd3NlbWZcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHNlcnZpY2VBY2NvdW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICBjd2V4cG9ydGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2dTdHJlYW1OYW1lOiBcIkVLU05vZGVcIixcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YWx1ZXMgPSBtZXJnZSh2YWx1ZXMsIHRoaXMucHJvcHMudmFsdWVzID8/IHt9KTtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB2YWx1ZXMsIHRydWUsIGZhbHNlKTtcclxuICAgICAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==