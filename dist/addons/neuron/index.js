"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuronMonitorAddOn = exports.NeuronDevicePluginAddOn = void 0;
const kubectl_provider_1 = require("../helm-addon/kubectl-provider");
const yaml_utils_1 = require("../../utils/yaml-utils");
const utils_1 = require("../../utils");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const neuron_monitor_customization_1 = require("./neuron-monitor-customization");
const PLUGIN_URL = "https://raw.githubusercontent.com/aws-neuron/aws-neuron-sdk/master/src/k8/k8s-neuron-device-plugin.yml";
const RBAC_URL = "https://raw.githubusercontent.com/aws-neuron/aws-neuron-sdk/master/src/k8/k8s-neuron-device-plugin-rbac.yml";
class NeuronDevicePluginAddOn {
    deploy(clusterInfo) {
        const kubectlProvider = new kubectl_provider_1.KubectlProvider(clusterInfo);
        // Read in YAML docs
        const rbac = (0, yaml_utils_1.loadExternalYaml)(RBAC_URL);
        const rbacManifest = {
            name: "neuron-rbac-manifest",
            namespace: "",
            manifest: rbac,
            values: {}
        };
        const plugin = (0, yaml_utils_1.loadExternalYaml)(PLUGIN_URL);
        const pluginManifest = {
            name: "neuron-plugin-manifest",
            namespace: "kube-system",
            manifest: plugin,
            values: {}
        };
        const rbacStatement = kubectlProvider.addManifest(rbacManifest);
        const pluginStatement = kubectlProvider.addManifest(pluginManifest);
        // Plugin dependency on the RBAC manifest
        pluginStatement.node.addDependency(rbacStatement);
        return Promise.resolve(pluginStatement);
    }
}
exports.NeuronDevicePluginAddOn = NeuronDevicePluginAddOn;
const defaultProps = {
    namespace: "kube-system",
    imageTag: "1.0.0",
    port: 9010
};
class NeuronMonitorAddOn {
    options;
    constructor(props) {
        this.options = { ...defaultProps, ...props };
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const manifest = new neuron_monitor_customization_1.NeuronMonitorManifest().generate(this.options.namespace, this.options.imageTag, this.options.port);
        const neuronMonitorManifest = new aws_eks_1.KubernetesManifest(cluster.stack, "neuron-monitor-manifest", {
            cluster,
            manifest: manifest,
            overwrite: true
        });
        if (this.options.createNamespace === true) {
            // Let CDK Create the Namespace
            const namespace = (0, utils_1.createNamespace)(this.options.namespace, cluster);
            neuronMonitorManifest.node.addDependency(namespace);
        }
        return Promise.resolve(neuronMonitorManifest);
    }
}
exports.NeuronMonitorAddOn = NeuronMonitorAddOn;
__decorate([
    (0, utils_1.dependable)(NeuronDevicePluginAddOn.name)
], NeuronMonitorAddOn.prototype, "deploy", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL25ldXJvbi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQSxxRUFBcUY7QUFDckYsdURBQTBEO0FBQzFELHVDQUEwRDtBQUMxRCxpREFBeUQ7QUFDekQsaUZBQXVFO0FBRXZFLE1BQU0sVUFBVSxHQUFHLHdHQUF3RyxDQUFDO0FBQzVILE1BQU0sUUFBUSxHQUFHLDZHQUE2RyxDQUFDO0FBRS9ILE1BQWEsdUJBQXVCO0lBQ2hDLE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLGVBQWUsR0FBRyxJQUFJLGtDQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFekQsb0JBQW9CO1FBQ3BCLE1BQU0sSUFBSSxHQUFHLElBQUEsNkJBQWdCLEVBQUMsUUFBUSxDQUFDLENBQUM7UUFDeEMsTUFBTSxZQUFZLEdBQXVCO1lBQ3JDLElBQUksRUFBRSxzQkFBc0I7WUFDNUIsU0FBUyxFQUFFLEVBQUU7WUFDYixRQUFRLEVBQUUsSUFBSTtZQUNkLE1BQU0sRUFBRSxFQUFFO1NBQ2IsQ0FBQztRQUVGLE1BQU0sTUFBTSxHQUFHLElBQUEsNkJBQWdCLEVBQUMsVUFBVSxDQUFDLENBQUM7UUFDNUMsTUFBTSxjQUFjLEdBQXVCO1lBQ3ZDLElBQUksRUFBRSx3QkFBd0I7WUFDOUIsU0FBUyxFQUFFLGFBQWE7WUFDeEIsUUFBUSxFQUFFLE1BQU07WUFDaEIsTUFBTSxFQUFFLEVBQUU7U0FDYixDQUFDO1FBRUYsTUFBTSxhQUFhLEdBQUcsZUFBZSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUNoRSxNQUFNLGVBQWUsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXBFLHlDQUF5QztRQUN6QyxlQUFlLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUVsRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNKO0FBN0JELDBEQTZCQztBQXdCRCxNQUFNLFlBQVksR0FBNEI7SUFDMUMsU0FBUyxFQUFFLGFBQWE7SUFDeEIsUUFBUSxFQUFFLE9BQU87SUFDakIsSUFBSSxFQUFFLElBQUk7Q0FDYixDQUFDO0FBR0YsTUFBYSxrQkFBa0I7SUFFbEIsT0FBTyxDQUEwQjtJQUUxQyxZQUFZLEtBQStCO1FBQ3ZDLElBQUksQ0FBQyxPQUFPLEdBQUcsRUFBQyxHQUFHLFlBQVksRUFBRSxHQUFHLEtBQUssRUFBQyxDQUFDO0lBQy9DLENBQUM7SUFHRCxNQUFNLENBQUMsV0FBd0I7UUFFM0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUVwQyxNQUFNLFFBQVEsR0FBRyxJQUFJLG9EQUFxQixFQUFFLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsUUFBUyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSyxDQUFDLENBQUM7UUFFM0gsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLDRCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUseUJBQXlCLEVBQUU7WUFDM0YsT0FBTztZQUNQLFFBQVEsRUFBRSxRQUFRO1lBQ2xCLFNBQVMsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQztRQUVILElBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlLEtBQUssSUFBSSxFQUFDLENBQUM7WUFDdEMsK0JBQStCO1lBQy9CLE1BQU0sU0FBUyxHQUFHLElBQUEsdUJBQWUsRUFBQyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVUsRUFBRyxPQUFPLENBQUMsQ0FBQztZQUNyRSxxQkFBcUIsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELENBQUM7UUFFSCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMscUJBQXFCLENBQUMsQ0FBQztJQUVsRCxDQUFDO0NBQ0o7QUE5QkQsZ0RBOEJDO0FBckJHO0lBREMsSUFBQSxrQkFBVSxFQUFDLHVCQUF1QixDQUFDLElBQUksQ0FBQztnREFxQnhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckFkZE9uLCBDbHVzdGVySW5mbyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgS3ViZWN0bFByb3ZpZGVyLCBNYW5pZmVzdERlcGxveW1lbnQgfSBmcm9tIFwiLi4vaGVsbS1hZGRvbi9rdWJlY3RsLXByb3ZpZGVyXCI7XHJcbmltcG9ydCB7IGxvYWRFeHRlcm5hbFlhbWwgfSBmcm9tIFwiLi4vLi4vdXRpbHMveWFtbC11dGlsc1wiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UsIGRlcGVuZGFibGUgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgS3ViZXJuZXRlc01hbmlmZXN0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgTmV1cm9uTW9uaXRvck1hbmlmZXN0IH0gZnJvbSBcIi4vbmV1cm9uLW1vbml0b3ItY3VzdG9taXphdGlvblwiO1xyXG5cclxuY29uc3QgUExVR0lOX1VSTCA9IFwiaHR0cHM6Ly9yYXcuZ2l0aHVidXNlcmNvbnRlbnQuY29tL2F3cy1uZXVyb24vYXdzLW5ldXJvbi1zZGsvbWFzdGVyL3NyYy9rOC9rOHMtbmV1cm9uLWRldmljZS1wbHVnaW4ueW1sXCI7XHJcbmNvbnN0IFJCQUNfVVJMID0gXCJodHRwczovL3Jhdy5naXRodWJ1c2VyY29udGVudC5jb20vYXdzLW5ldXJvbi9hd3MtbmV1cm9uLXNkay9tYXN0ZXIvc3JjL2s4L2s4cy1uZXVyb24tZGV2aWNlLXBsdWdpbi1yYmFjLnltbFwiO1xyXG5cclxuZXhwb3J0IGNsYXNzIE5ldXJvbkRldmljZVBsdWdpbkFkZE9uIGltcGxlbWVudHMgQ2x1c3RlckFkZE9uIHtcclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGNvbnN0IGt1YmVjdGxQcm92aWRlciA9IG5ldyBLdWJlY3RsUHJvdmlkZXIoY2x1c3RlckluZm8pO1xyXG5cclxuICAgICAgICAvLyBSZWFkIGluIFlBTUwgZG9jc1xyXG4gICAgICAgIGNvbnN0IHJiYWMgPSBsb2FkRXh0ZXJuYWxZYW1sKFJCQUNfVVJMKTtcclxuICAgICAgICBjb25zdCByYmFjTWFuaWZlc3Q6IE1hbmlmZXN0RGVwbG95bWVudCA9IHtcclxuICAgICAgICAgICAgbmFtZTogXCJuZXVyb24tcmJhYy1tYW5pZmVzdFwiLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IFwiXCIsXHJcbiAgICAgICAgICAgIG1hbmlmZXN0OiByYmFjLFxyXG4gICAgICAgICAgICB2YWx1ZXM6IHt9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgcGx1Z2luID0gbG9hZEV4dGVybmFsWWFtbChQTFVHSU5fVVJMKTtcclxuICAgICAgICBjb25zdCBwbHVnaW5NYW5pZmVzdDogTWFuaWZlc3REZXBsb3ltZW50ID0ge1xyXG4gICAgICAgICAgICBuYW1lOiBcIm5ldXJvbi1wbHVnaW4tbWFuaWZlc3RcIixcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiBcImt1YmUtc3lzdGVtXCIsXHJcbiAgICAgICAgICAgIG1hbmlmZXN0OiBwbHVnaW4sXHJcbiAgICAgICAgICAgIHZhbHVlczoge31cclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCByYmFjU3RhdGVtZW50ID0ga3ViZWN0bFByb3ZpZGVyLmFkZE1hbmlmZXN0KHJiYWNNYW5pZmVzdCk7XHJcbiAgICAgICAgY29uc3QgcGx1Z2luU3RhdGVtZW50ID0ga3ViZWN0bFByb3ZpZGVyLmFkZE1hbmlmZXN0KHBsdWdpbk1hbmlmZXN0KTtcclxuXHJcbiAgICAgICAgLy8gUGx1Z2luIGRlcGVuZGVuY3kgb24gdGhlIFJCQUMgbWFuaWZlc3RcclxuICAgICAgICBwbHVnaW5TdGF0ZW1lbnQubm9kZS5hZGREZXBlbmRlbmN5KHJiYWNTdGF0ZW1lbnQpO1xyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHBsdWdpblN0YXRlbWVudCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmV4cG9ydCBpbnRlcmZhY2UgTmV1cm9uTW9uaXRvckFkZE9uUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgdGFnIG9mIHRoZSBOZXVyb24gTW9uaXRvciBhcHBsaWNhdGlvbidzIERvY2tlciBpbWFnZS5cclxuICAgICAqIEBkZWZhdWx0ICdsYXRlc3QnXHJcbiAgICAgKi9cclxuICAgIGltYWdlVGFnPzogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiBOZXVyb24gQXBwbGljYXRpb24ncyBuYW1lc3BhY2VcclxuICAgICAqIEBkZWZhdWx0ICdrdWJlLXN5c3RlbSdcclxuICAgICAqL1xyXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nO1xyXG4gICAgIC8qKlxyXG4gICAgICogQXBwbGljYXRpb24ncyBwb3J0XHJcbiAgICAgKiBAZGVmYXVsdCA5MDEwXHJcbiAgICAgKi9cclxuICAgICBwb3J0PzogbnVtYmVyO1xyXG4gICAgIC8qKlxyXG4gICAgICogVG8gQ3JlYXRlIE5hbWVzcGFjZSB1c2luZyBDREsuIFRoaXMgc2hvdWxkIGJlIGRvbmUgb25seSBmb3IgdGhlIGZpcnN0IHRpbWUuXHJcbiAgICAgKi8gICAgXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuO1xyXG59XHJcblxyXG5jb25zdCBkZWZhdWx0UHJvcHM6IE5ldXJvbk1vbml0b3JBZGRPblByb3BzID0ge1xyXG4gICAgbmFtZXNwYWNlOiBcImt1YmUtc3lzdGVtXCIsXHJcbiAgICBpbWFnZVRhZzogXCIxLjAuMFwiLFxyXG4gICAgcG9ydDogOTAxMFxyXG59O1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBOZXVyb25Nb25pdG9yQWRkT24gaW1wbGVtZW50cyBDbHVzdGVyQWRkT24ge1xyXG5cclxuICAgIHJlYWRvbmx5IG9wdGlvbnM6IE5ldXJvbk1vbml0b3JBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogTmV1cm9uTW9uaXRvckFkZE9uUHJvcHMpe1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHsuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzfTtcclxuICAgIH1cclxuXHJcbiAgICBAZGVwZW5kYWJsZShOZXVyb25EZXZpY2VQbHVnaW5BZGRPbi5uYW1lKVxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PntcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuXHJcbiAgICAgICAgY29uc3QgbWFuaWZlc3QgPSBuZXcgTmV1cm9uTW9uaXRvck1hbmlmZXN0KCkuZ2VuZXJhdGUodGhpcy5vcHRpb25zLm5hbWVzcGFjZSEsIHRoaXMub3B0aW9ucy5pbWFnZVRhZyEsIHRoaXMub3B0aW9ucy5wb3J0ISk7XHJcblxyXG4gICAgICAgIGNvbnN0IG5ldXJvbk1vbml0b3JNYW5pZmVzdCA9IG5ldyBLdWJlcm5ldGVzTWFuaWZlc3QoY2x1c3Rlci5zdGFjaywgXCJuZXVyb24tbW9uaXRvci1tYW5pZmVzdFwiLCB7XHJcbiAgICAgICAgICAgIGNsdXN0ZXIsXHJcbiAgICAgICAgICAgIG1hbmlmZXN0OiBtYW5pZmVzdCxcclxuICAgICAgICAgICAgb3ZlcndyaXRlOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmKHRoaXMub3B0aW9ucy5jcmVhdGVOYW1lc3BhY2UgPT09IHRydWUpe1xyXG4gICAgICAgICAgICAvLyBMZXQgQ0RLIENyZWF0ZSB0aGUgTmFtZXNwYWNlXHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IGNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISAsIGNsdXN0ZXIpO1xyXG4gICAgICAgICAgICBuZXVyb25Nb25pdG9yTWFuaWZlc3Qubm9kZS5hZGREZXBlbmRlbmN5KG5hbWVzcGFjZSk7XHJcbiAgICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobmV1cm9uTW9uaXRvck1hbmlmZXN0KTtcclxuXHJcbiAgICB9XHJcbn1cclxuIl19