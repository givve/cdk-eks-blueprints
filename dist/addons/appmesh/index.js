"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppMeshAddOn = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const ts_deepmerge_1 = require("ts-deepmerge");
const cluster_providers_1 = require("../../cluster-providers");
const namespace_utils_1 = require("../../utils/namespace-utils");
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    enableTracing: false,
    tracingProvider: "x-ray",
    name: "appmesh-controller",
    namespace: "appmesh-system",
    chart: "appmesh-controller",
    version: "1.13.1",
    release: "appmesh-release",
    repository: "https://aws.github.io/eks-charts"
};
let AppMeshAddOn = class AppMeshAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        // App Mesh service account.
        const opts = { name: 'appmesh-controller', namespace: "appmesh-system" };
        const sa = cluster.addServiceAccount('appmesh-controller', opts);
        // Cloud Map Full Access policy.
        const cloudMapPolicy = aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AWSCloudMapFullAccess");
        sa.role.addManagedPolicy(cloudMapPolicy);
        // App Mesh Full Access policy.
        const appMeshPolicy = aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AWSAppMeshFullAccess");
        sa.role.addManagedPolicy(appMeshPolicy);
        if (this.options.enableTracing && this.options.tracingProvider === "x-ray") {
            const xrayPolicy = aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName("AWSXRayDaemonWriteAccess");
            const nodeGroups = (0, cluster_providers_1.assertEC2NodeGroup)(clusterInfo, "App Mesh X-Ray integration");
            nodeGroups.forEach(ng => ng.role.addManagedPolicy(xrayPolicy));
        }
        // App Mesh Namespace
        const namespace = (0, namespace_utils_1.createNamespace)('appmesh-system', cluster);
        sa.node.addDependency(namespace);
        let values = {
            region: cluster.stack.region,
            serviceAccount: {
                create: false,
                name: 'appmesh-controller'
            },
            tracing: {
                enabled: this.options.enableTracing,
                provider: this.options.tracingProvider,
                address: this.options.tracingAddress,
                port: this.options.tracingPort
            }
        };
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values);
        chart.node.addDependency(sa);
        return Promise.resolve(chart);
    }
};
exports.AppMeshAddOn = AppMeshAddOn;
exports.AppMeshAddOn = AppMeshAddOn = __decorate([
    utils_1.supportsX86
], AppMeshAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2FwcG1lc2gvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaURBQW9EO0FBRXBELCtDQUFxQztBQUNyQywrREFBNkQ7QUFFN0QsaUVBQThEO0FBQzlELDhDQUE4RDtBQUM5RCx1Q0FBMEM7QUErQjFDOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUc7SUFDakIsYUFBYSxFQUFFLEtBQUs7SUFDcEIsZUFBZSxFQUFFLE9BQU87SUFDeEIsSUFBSSxFQUFFLG9CQUFvQjtJQUMxQixTQUFTLEVBQUUsZ0JBQWdCO0lBQzNCLEtBQUssRUFBRSxvQkFBb0I7SUFDM0IsT0FBTyxFQUFFLFFBQVE7SUFDakIsT0FBTyxFQUFFLGlCQUFpQjtJQUMxQixVQUFVLEVBQUUsa0NBQWtDO0NBQ2pELENBQUM7QUFHSyxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsc0JBQVM7SUFFOUIsT0FBTyxDQUFvQjtJQUVwQyxZQUFZLEtBQXlCO1FBQ2pDLEtBQUssQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVRLE1BQU0sQ0FBQyxXQUF3QjtRQUVwQyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBRXBDLDRCQUE0QjtRQUM1QixNQUFNLElBQUksR0FBRyxFQUFFLElBQUksRUFBRSxvQkFBb0IsRUFBRSxTQUFTLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztRQUN6RSxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsb0JBQW9CLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFakUsZ0NBQWdDO1FBQ2hDLE1BQU0sY0FBYyxHQUFHLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsdUJBQXVCLENBQUMsQ0FBQztRQUN2RixFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRXpDLCtCQUErQjtRQUMvQixNQUFNLGFBQWEsR0FBRyx1QkFBYSxDQUFDLHdCQUF3QixDQUFDLHNCQUFzQixDQUFDLENBQUM7UUFDckYsRUFBRSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxhQUFhLENBQUMsQ0FBQztRQUV4QyxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxLQUFLLE9BQU8sRUFBRSxDQUFDO1lBQ3pFLE1BQU0sVUFBVSxHQUFHLHVCQUFhLENBQUMsd0JBQXdCLENBQUMsMEJBQTBCLENBQUMsQ0FBQztZQUN0RixNQUFNLFVBQVUsR0FBRyxJQUFBLHNDQUFrQixFQUFDLFdBQVcsRUFBRSw0QkFBNEIsQ0FBQyxDQUFDO1lBQ2pGLFVBQVUsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUVELHFCQUFxQjtRQUNyQixNQUFNLFNBQVMsR0FBRyxJQUFBLGlDQUFlLEVBQUMsZ0JBQWdCLEVBQUUsT0FBTyxDQUFDLENBQUM7UUFDN0QsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFFakMsSUFBSSxNQUFNLEdBQVc7WUFDakIsTUFBTSxFQUFFLE9BQU8sQ0FBQyxLQUFLLENBQUMsTUFBTTtZQUM1QixjQUFjLEVBQUU7Z0JBQ1osTUFBTSxFQUFFLEtBQUs7Z0JBQ2IsSUFBSSxFQUFFLG9CQUFvQjthQUM3QjtZQUNELE9BQU8sRUFBRTtnQkFDTCxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxhQUFhO2dCQUNuQyxRQUFRLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxlQUFlO2dCQUN0QyxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjO2dCQUNwQyxJQUFJLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXO2FBQ2pDO1NBQ0osQ0FBQztRQUVGLE1BQU0sR0FBRyxJQUFBLG9CQUFLLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRWhELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzdCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0NBQ0osQ0FBQTtBQXZEWSxvQ0FBWTt1QkFBWixZQUFZO0lBRHhCLG1CQUFXO0dBQ0MsWUFBWSxDQXVEeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBNYW5hZ2VkUG9saWN5IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IGFzc2VydEVDMk5vZGVHcm91cCB9IGZyb20gXCIuLi8uLi9jbHVzdGVyLXByb3ZpZGVyc1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UgfSBmcm9tIFwiLi4vLi4vdXRpbHMvbmFtZXNwYWNlLXV0aWxzXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uVXNlclByb3BzIH0gZnJvbSBcIi4uL2hlbG0tYWRkb25cIjtcclxuaW1wb3J0IHsgc3VwcG9ydHNYODYgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgYWRkLW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBBcHBNZXNoQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICAqIElmIHNldCB0byB0cnVlLCB3aWxsIGVuYWJsZSB0cmFjaW5nIHRocm91Z2ggQXBwIE1lc2ggc2lkZWNhcnMsIHN1Y2ggYXMgWC1SYXkgZGlzdHJpYnV0ZWQgdHJhY2luZy5cclxuICAgICAqIE5vdGU6IHN1cHBvcnQgZm9yIFgtUmF5IHRyYWNpbmcgZG9lcyBub3QgZGVwZW5kIG9uIHRoZSBYUmF5IERhZW1vbiBBZGRPbiBpbnN0YWxsZWQuXHJcbiAgICAgKi9cclxuICAgIGVuYWJsZVRyYWNpbmc/OiBib29sZWFuLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVHJhY2luZyBwcm92aWRlci4gU3VwcG9ydGVkIHZhbHVlcyBhcmUgeC1yYXksIGphZWdlciwgZGF0YWRvZ1xyXG4gICAgICovXHJcbiAgICB0cmFjaW5nUHJvdmlkZXI/OiBcIngtcmF5XCIgfCBcImphZWdlclwiIHwgXCJkYXRhZG9nXCJcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVzZWQgZm9yIERhdGFkb2cgb3IgSmFlZ2VyIHRyYWNpbmcuIEV4YW1wbGUgdmFsdWVzOiBkYXRhZG9nLmFwcG1lc2gtc3lzdGVtLiBcclxuICAgICAqIFJlZmVyIHRvIGh0dHBzOi8vYXdzLmdpdGh1Yi5pby9hd3MtYXBwLW1lc2gtY29udHJvbGxlci1mb3ItazhzL2d1aWRlL3RyYWNpbmcvIGZvciBtb3JlIGluZm9ybWF0aW9uLlxyXG4gICAgICogSWdub3JlZCBmb3IgWC1SYXkuXHJcbiAgICAgKi9cclxuICAgIHRyYWNpbmdBZGRyZXNzPzogc3RyaW5nLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSmFlZ2VyIG9yIERhdGFkb2cgYWdlbnQgcG9ydCAoaWdub3JlZCBmb3IgWC1SYXkpXHJcbiAgICAgKi9cclxuICAgIHRyYWNpbmdQb3J0Pzogc3RyaW5nXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0cyBvcHRpb25zIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XHJcbiAgICBlbmFibGVUcmFjaW5nOiBmYWxzZSxcclxuICAgIHRyYWNpbmdQcm92aWRlcjogXCJ4LXJheVwiLFxyXG4gICAgbmFtZTogXCJhcHBtZXNoLWNvbnRyb2xsZXJcIixcclxuICAgIG5hbWVzcGFjZTogXCJhcHBtZXNoLXN5c3RlbVwiLFxyXG4gICAgY2hhcnQ6IFwiYXBwbWVzaC1jb250cm9sbGVyXCIsXHJcbiAgICB2ZXJzaW9uOiBcIjEuMTMuMVwiLFxyXG4gICAgcmVsZWFzZTogXCJhcHBtZXNoLXJlbGVhc2VcIixcclxuICAgIHJlcG9zaXRvcnk6IFwiaHR0cHM6Ly9hd3MuZ2l0aHViLmlvL2Vrcy1jaGFydHNcIlxyXG59O1xyXG5cclxuQHN1cHBvcnRzWDg2XHJcbmV4cG9ydCBjbGFzcyBBcHBNZXNoQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICAgIHJlYWRvbmx5IG9wdGlvbnM6IEFwcE1lc2hBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQXBwTWVzaEFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7IC4uLmRlZmF1bHRQcm9wcywgLi4ucHJvcHMgfSk7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcztcclxuICAgIH1cclxuXHJcbiAgICBvdmVycmlkZSBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuXHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcblxyXG4gICAgICAgIC8vIEFwcCBNZXNoIHNlcnZpY2UgYWNjb3VudC5cclxuICAgICAgICBjb25zdCBvcHRzID0geyBuYW1lOiAnYXBwbWVzaC1jb250cm9sbGVyJywgbmFtZXNwYWNlOiBcImFwcG1lc2gtc3lzdGVtXCIgfTtcclxuICAgICAgICBjb25zdCBzYSA9IGNsdXN0ZXIuYWRkU2VydmljZUFjY291bnQoJ2FwcG1lc2gtY29udHJvbGxlcicsIG9wdHMpO1xyXG5cclxuICAgICAgICAvLyBDbG91ZCBNYXAgRnVsbCBBY2Nlc3MgcG9saWN5LlxyXG4gICAgICAgIGNvbnN0IGNsb3VkTWFwUG9saWN5ID0gTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBV1NDbG91ZE1hcEZ1bGxBY2Nlc3NcIik7XHJcbiAgICAgICAgc2Eucm9sZS5hZGRNYW5hZ2VkUG9saWN5KGNsb3VkTWFwUG9saWN5KTtcclxuXHJcbiAgICAgICAgLy8gQXBwIE1lc2ggRnVsbCBBY2Nlc3MgcG9saWN5LlxyXG4gICAgICAgIGNvbnN0IGFwcE1lc2hQb2xpY3kgPSBNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZShcIkFXU0FwcE1lc2hGdWxsQWNjZXNzXCIpO1xyXG4gICAgICAgIHNhLnJvbGUuYWRkTWFuYWdlZFBvbGljeShhcHBNZXNoUG9saWN5KTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5lbmFibGVUcmFjaW5nICYmIHRoaXMub3B0aW9ucy50cmFjaW5nUHJvdmlkZXIgPT09IFwieC1yYXlcIikge1xyXG4gICAgICAgICAgICBjb25zdCB4cmF5UG9saWN5ID0gTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoXCJBV1NYUmF5RGFlbW9uV3JpdGVBY2Nlc3NcIik7XHJcbiAgICAgICAgICAgIGNvbnN0IG5vZGVHcm91cHMgPSBhc3NlcnRFQzJOb2RlR3JvdXAoY2x1c3RlckluZm8sIFwiQXBwIE1lc2ggWC1SYXkgaW50ZWdyYXRpb25cIik7XHJcbiAgICAgICAgICAgIG5vZGVHcm91cHMuZm9yRWFjaChuZyA9PiBuZy5yb2xlLmFkZE1hbmFnZWRQb2xpY3koeHJheVBvbGljeSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQXBwIE1lc2ggTmFtZXNwYWNlXHJcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlKCdhcHBtZXNoLXN5c3RlbScsIGNsdXN0ZXIpO1xyXG4gICAgICAgIHNhLm5vZGUuYWRkRGVwZW5kZW5jeShuYW1lc3BhY2UpO1xyXG5cclxuICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSB7XHJcbiAgICAgICAgICAgIHJlZ2lvbjogY2x1c3Rlci5zdGFjay5yZWdpb24sXHJcbiAgICAgICAgICAgIHNlcnZpY2VBY2NvdW50OiB7XHJcbiAgICAgICAgICAgICAgICBjcmVhdGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2FwcG1lc2gtY29udHJvbGxlcidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdHJhY2luZzoge1xyXG4gICAgICAgICAgICAgICAgZW5hYmxlZDogdGhpcy5vcHRpb25zLmVuYWJsZVRyYWNpbmcsXHJcbiAgICAgICAgICAgICAgICBwcm92aWRlcjogdGhpcy5vcHRpb25zLnRyYWNpbmdQcm92aWRlcixcclxuICAgICAgICAgICAgICAgIGFkZHJlc3M6IHRoaXMub3B0aW9ucy50cmFjaW5nQWRkcmVzcyxcclxuICAgICAgICAgICAgICAgIHBvcnQ6IHRoaXMub3B0aW9ucy50cmFjaW5nUG9ydFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgY2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzKTtcclxuICAgICAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gICAgfVxyXG59Il19