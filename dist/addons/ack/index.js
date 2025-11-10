"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AckAddOn = void 0;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const ts_deepmerge_1 = require("ts-deepmerge");
require("reflect-metadata");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
const serviceMappings_1 = require("./serviceMappings");
__exportStar(require("./serviceMappings"), exports);
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    namespace: "ack-system",
    values: {},
    createNamespace: true,
    serviceName: serviceMappings_1.AckServiceName.IAM,
    id: "iam-ack"
};
/**
 * Main class to instantiate the Helm chart
 */
let AckAddOn = class AckAddOn extends helm_addon_1.HelmAddOn {
    options;
    id;
    constructor(props) {
        super(populateDefaults(defaultProps, props));
        this.options = this.props;
        this.id = this.options.id;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const sa = cluster.addServiceAccount(`${this.options.chart}-sa`, {
            namespace: this.options.namespace,
            name: this.options.saName,
        });
        let values = populateValues(this.options, cluster.stack.region);
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        if (this.options.createNamespace == true) {
            // Let CDK Create the Namespace
            const namespace = (0, utils_1.createNamespace)(this.options.namespace, cluster);
            sa.node.addDependency(namespace);
        }
        if (this.options.managedPolicyName) {
            sa.role.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName(this.options.managedPolicyName));
        }
        if (this.options.inlinePolicyStatements && this.options.inlinePolicyStatements.length > 0) {
            sa.role.attachInlinePolicy(new aws_iam_1.Policy(cluster.stack, `${this.options.chart}-inline-policy`, {
                statements: this.options.inlinePolicyStatements
            }));
        }
        const chart = this.addHelmChart(clusterInfo, values);
        chart.node.addDependency(sa);
        return Promise.resolve(chart);
    }
};
exports.AckAddOn = AckAddOn;
exports.AckAddOn = AckAddOn = __decorate([
    Reflect.metadata("ordered", true),
    utils_1.supportsX86
], AckAddOn);
/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions, awsRegion) {
    const values = helmOptions.values ?? {};
    (0, utils_1.setPath)(values, "aws.region", awsRegion);
    (0, utils_1.setPath)(values, "serviceAccount.create", false);
    (0, utils_1.setPath)(values, "serviceAccount.name", helmOptions.saName);
    return values;
}
/**
 * populate parameters passed or the default values from service Mappings.
 */
function populateDefaults(defaultProps, props) {
    let tempProps = { ...props ?? {} }; // since props may be empty
    tempProps.id = tempProps.id ?? defaultProps.id;
    tempProps.serviceName = tempProps.serviceName ?? defaultProps.serviceName;
    tempProps.name = tempProps.name ?? serviceMappings_1.serviceMappings[tempProps.serviceName].chart;
    tempProps.namespace = tempProps.namespace ?? defaultProps.namespace;
    tempProps.chart = tempProps.chart ?? serviceMappings_1.serviceMappings[tempProps.serviceName]?.chart;
    tempProps.version = tempProps.version ?? serviceMappings_1.serviceMappings[tempProps.serviceName]?.version;
    const repositoryUrl = "oci://public.ecr.aws/aws-controllers-k8s";
    tempProps.release = tempProps.release ?? tempProps.chart;
    tempProps.repository = tempProps.repository ?? `${repositoryUrl}/${tempProps.name}`;
    tempProps.managedPolicyName = tempProps.managedPolicyName ?? serviceMappings_1.serviceMappings[tempProps.serviceName]?.managedPolicyName;
    tempProps.inlinePolicyStatements = tempProps.inlinePolicyStatements ?? serviceMappings_1.serviceMappings[tempProps.serviceName]?.inlinePolicyStatements;
    tempProps.createNamespace = tempProps.createNamespace ?? defaultProps.createNamespace;
    tempProps.saName = tempProps.saName ?? `${tempProps.chart}-sa`;
    return tempProps;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2Fjay9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUE2RTtBQUU3RSwrQ0FBcUM7QUFFckMsNEJBQTBCO0FBQzFCLHVDQUFvRTtBQUNwRSw4Q0FBOEU7QUFDOUUsdURBQW9FO0FBRXBFLG9EQUFrQztBQW1DbEM7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBa0I7SUFDbEMsU0FBUyxFQUFFLFlBQVk7SUFDdkIsTUFBTSxFQUFFLEVBQUU7SUFDVixlQUFlLEVBQUUsSUFBSTtJQUNyQixXQUFXLEVBQUUsZ0NBQWMsQ0FBQyxHQUFHO0lBQy9CLEVBQUUsRUFBRSxTQUFTO0NBQ2QsQ0FBQztBQUVGOztHQUVHO0FBR0ksSUFBTSxRQUFRLEdBQWQsTUFBTSxRQUFTLFNBQVEsc0JBQVM7SUFFNUIsT0FBTyxDQUFnQjtJQUN2QixFQUFFLENBQVc7SUFFdEIsWUFBWSxLQUFxQjtRQUMvQixLQUFLLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLEtBQUssQ0FBbUIsQ0FBQyxDQUFDO1FBQy9ELElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQXNCLENBQUM7UUFDM0MsSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztJQUM1QixDQUFDO0lBR0QsTUFBTSxDQUFDLFdBQXdCO1FBQzdCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFFcEMsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssRUFBRTtZQUMvRCxTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTO1lBQ2pDLElBQUksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07U0FDMUIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxNQUFNLEdBQVcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN2RSxNQUFNLEdBQUcsSUFBQSxvQkFBSyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVoRCxJQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksRUFBQyxDQUFDO1lBQ3ZDLCtCQUErQjtZQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFVLEVBQUcsT0FBTyxDQUFDLENBQUM7WUFDckUsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO1lBQ25DLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsdUJBQWEsQ0FBQyx3QkFBd0IsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNwRyxDQUFDO1FBQ0QsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsc0JBQXNCLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQzFGLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssZ0JBQWdCLEVBQUU7Z0JBQzFGLFVBQVUsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLHNCQUFzQjthQUNoRCxDQUFDLENBQUMsQ0FBQztRQUNOLENBQUM7UUFDRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUNyRCxLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUM3QixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGLENBQUE7QUF6Q1ksNEJBQVE7bUJBQVIsUUFBUTtJQUZwQixPQUFPLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUM7SUFDakMsbUJBQVc7R0FDQyxRQUFRLENBeUNwQjtBQUVEOzs7R0FHRztBQUNILFNBQVMsY0FBYyxDQUFDLFdBQTBCLEVBQUUsU0FBaUI7SUFDbkUsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7SUFDeEMsSUFBQSxlQUFPLEVBQUMsTUFBTSxFQUFFLFlBQVksRUFBRSxTQUFTLENBQUMsQ0FBQztJQUN6QyxJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUMsdUJBQXVCLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDL0MsSUFBQSxlQUFPLEVBQUMsTUFBTSxFQUFDLHFCQUFxQixFQUFFLFdBQVcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUMxRCxPQUFPLE1BQU0sQ0FBQztBQUNoQixDQUFDO0FBRUQ7O0dBRUc7QUFDSCxTQUFTLGdCQUFnQixDQUFDLFlBQTJCLEVBQUUsS0FBcUI7SUFDMUUsSUFBSSxTQUFTLEdBQTRCLEVBQUMsR0FBRyxLQUFLLElBQUksRUFBRSxFQUFDLENBQUMsQ0FBQywyQkFBMkI7SUFDdEYsU0FBUyxDQUFDLEVBQUUsR0FBRyxTQUFTLENBQUMsRUFBRSxJQUFJLFlBQVksQ0FBQyxFQUFFLENBQUM7SUFDL0MsU0FBUyxDQUFDLFdBQVcsR0FBRyxTQUFTLENBQUMsV0FBVyxJQUFJLFlBQVksQ0FBQyxXQUFXLENBQUM7SUFDMUUsU0FBUyxDQUFDLElBQUksR0FBRyxTQUFTLENBQUMsSUFBSSxJQUFJLGlDQUFlLENBQUMsU0FBUyxDQUFDLFdBQVksQ0FBRSxDQUFDLEtBQUssQ0FBQztJQUNsRixTQUFTLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQyxTQUFTLElBQUksWUFBWSxDQUFDLFNBQVMsQ0FBQztJQUNwRSxTQUFTLENBQUMsS0FBSyxHQUFHLFNBQVMsQ0FBQyxLQUFLLElBQUksaUNBQWUsQ0FBQyxTQUFTLENBQUMsV0FBWSxDQUFDLEVBQUUsS0FBSyxDQUFDO0lBQ3BGLFNBQVMsQ0FBQyxPQUFPLEdBQUcsU0FBUyxDQUFDLE9BQU8sSUFBSSxpQ0FBZSxDQUFDLFNBQVMsQ0FBQyxXQUFZLENBQUMsRUFBRSxPQUFPLENBQUM7SUFDMUYsTUFBTSxhQUFhLEdBQUcsMENBQTBDLENBQUM7SUFDakUsU0FBUyxDQUFDLE9BQU8sR0FBRyxTQUFTLENBQUMsT0FBTyxJQUFJLFNBQVMsQ0FBQyxLQUFLLENBQUM7SUFDekQsU0FBUyxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUMsVUFBVSxJQUFJLEdBQUcsYUFBYSxJQUFJLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztJQUNwRixTQUFTLENBQUMsaUJBQWlCLEdBQUcsU0FBUyxDQUFDLGlCQUFpQixJQUFJLGlDQUFlLENBQUMsU0FBUyxDQUFDLFdBQVksQ0FBQyxFQUFFLGlCQUFpQixDQUFDO0lBQ3hILFNBQVMsQ0FBQyxzQkFBc0IsR0FBRyxTQUFTLENBQUMsc0JBQXNCLElBQUksaUNBQWUsQ0FBQyxTQUFTLENBQUMsV0FBWSxDQUFDLEVBQUUsc0JBQXNCLENBQUM7SUFDdkksU0FBUyxDQUFDLGVBQWUsR0FBRyxTQUFTLENBQUMsZUFBZSxJQUFJLFlBQVksQ0FBQyxlQUFlLENBQUM7SUFDdEYsU0FBUyxDQUFDLE1BQU0sR0FBRyxTQUFTLENBQUMsTUFBTSxJQUFJLEdBQUcsU0FBUyxDQUFDLEtBQUssS0FBSyxDQUFDO0lBQy9ELE9BQU8sU0FBMEIsQ0FBQztBQUNwQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTWFuYWdlZFBvbGljeSwgUG9saWN5LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcInRzLWRlZXBtZXJnZVwiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgXCJyZWZsZWN0LW1ldGFkYXRhXCI7XHJcbmltcG9ydCB7IGNyZWF0ZU5hbWVzcGFjZSwgc2V0UGF0aCwgc3VwcG9ydHNYODYgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Qcm9wcywgSGVsbUFkZE9uVXNlclByb3BzIH0gZnJvbSBcIi4uL2hlbG0tYWRkb25cIjtcclxuaW1wb3J0IHsgQWNrU2VydmljZU5hbWUsIHNlcnZpY2VNYXBwaW5ncyB9IGZyb20gJy4vc2VydmljZU1hcHBpbmdzJztcclxuXHJcbmV4cG9ydCAqIGZyb20gXCIuL3NlcnZpY2VNYXBwaW5nc1wiO1xyXG5cclxuLyoqXHJcbiAqIFVzZXIgcHJvdmlkZWQgb3B0aW9uIGZvciB0aGUgSGVsbSBDaGFydFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBBY2tBZGRPblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogUmVxdWlyZWQgaWRlbnRpZmllZCwgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXJlbnQgc3RhY2sgc2NvcGUuXHJcbiAgICAgKi9cclxuICAgIGlkPzogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZhdWx0IFNlcnZpY2UgTmFtZVxyXG4gICAgICogQGRlZmF1bHQgaWFtXHJcbiAgICAgKi9cclxuICAgIHNlcnZpY2VOYW1lOiBBY2tTZXJ2aWNlTmFtZTtcclxuICAgIC8qKlxyXG4gICAgICogTWFuYWdlZCBJQU0gUG9saWN5IG9mIHRoZSBhY2sgY29udHJvbGxlclxyXG4gICAgICogQGRlZmF1bHQgSUFNRnVsbEFjY2Vzc1xyXG4gICAgICovXHJcbiAgICBtYW5hZ2VkUG9saWN5TmFtZT86IHN0cmluZztcclxuICAgIC8qKlxyXG4gICAgKiBJbmxpbmUgSUFNIFBvbGljeSBmb3IgdGhlIGFjayBjb250cm9sbGVyXHJcbiAgICAqIEBkZWZhdWx0IHVuZGVmaW5lZFxyXG4gICAgKi9cclxuICAgIGlubGluZVBvbGljeVN0YXRlbWVudHM/OiBQb2xpY3lTdGF0ZW1lbnRbXTtcclxuICAgIC8qKlxyXG4gICAgICogVG8gQ3JlYXRlIE5hbWVzcGFjZSB1c2luZyBDREsuIFRoaXMgc2hvdWxkIGJlIGRvbmUgb25seSBmb3IgdGhlIGZpcnN0IHRpbWUuXHJcbiAgICAgKi8gICAgXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuO1xyXG4gICAgLyoqXHJcbiAgICAgKiBUbyBjcmVhdGUgU2VydmljZSBBY2NvdW50XHJcbiAgICAgKi8gICAgXHJcbiAgICBzYU5hbWU/OiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHByb3BzIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzOiBBY2tBZGRPblByb3BzID0ge1xyXG4gIG5hbWVzcGFjZTogXCJhY2stc3lzdGVtXCIsXHJcbiAgdmFsdWVzOiB7fSxcclxuICBjcmVhdGVOYW1lc3BhY2U6IHRydWUsXHJcbiAgc2VydmljZU5hbWU6IEFja1NlcnZpY2VOYW1lLklBTSwgXHJcbiAgaWQ6IFwiaWFtLWFja1wiXHJcbn07XHJcblxyXG4vKipcclxuICogTWFpbiBjbGFzcyB0byBpbnN0YW50aWF0ZSB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuQFJlZmxlY3QubWV0YWRhdGEoXCJvcmRlcmVkXCIsIHRydWUpXHJcbkBzdXBwb3J0c1g4NlxyXG5leHBvcnQgY2xhc3MgQWNrQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICByZWFkb25seSBvcHRpb25zOiBBY2tBZGRPblByb3BzO1xyXG4gIHJlYWRvbmx5IGlkPyA6IHN0cmluZztcclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM/OiBBY2tBZGRPblByb3BzKSB7XHJcbiAgICBzdXBlcihwb3B1bGF0ZURlZmF1bHRzKGRlZmF1bHRQcm9wcywgcHJvcHMpIGFzIEhlbG1BZGRPblByb3BzKTtcclxuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgQWNrQWRkT25Qcm9wcztcclxuICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMuaWQ7XHJcbiAgfVxyXG5cclxuXHJcbiAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuXHJcbiAgICBjb25zdCBzYSA9IGNsdXN0ZXIuYWRkU2VydmljZUFjY291bnQoYCR7dGhpcy5vcHRpb25zLmNoYXJ0fS1zYWAsIHtcclxuICAgICAgbmFtZXNwYWNlOiB0aGlzLm9wdGlvbnMubmFtZXNwYWNlLFxyXG4gICAgICBuYW1lOiB0aGlzLm9wdGlvbnMuc2FOYW1lLFxyXG4gICAgfSk7XHJcblxyXG4gICAgbGV0IHZhbHVlczogVmFsdWVzID0gcG9wdWxhdGVWYWx1ZXModGhpcy5vcHRpb25zLGNsdXN0ZXIuc3RhY2sucmVnaW9uKTtcclxuICAgIHZhbHVlcyA9IG1lcmdlKHZhbHVlcywgdGhpcy5wcm9wcy52YWx1ZXMgPz8ge30pO1xyXG5cclxuICAgIGlmKHRoaXMub3B0aW9ucy5jcmVhdGVOYW1lc3BhY2UgPT0gdHJ1ZSl7XHJcbiAgICAgIC8vIExldCBDREsgQ3JlYXRlIHRoZSBOYW1lc3BhY2VcclxuICAgICAgY29uc3QgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlKHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhICwgY2x1c3Rlcik7XHJcbiAgICAgIHNhLm5vZGUuYWRkRGVwZW5kZW5jeShuYW1lc3BhY2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLm9wdGlvbnMubWFuYWdlZFBvbGljeU5hbWUpIHtcclxuICAgICAgc2Eucm9sZS5hZGRNYW5hZ2VkUG9saWN5KE1hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKHRoaXMub3B0aW9ucy5tYW5hZ2VkUG9saWN5TmFtZSEpKTtcclxuICAgIH1cclxuICAgIGlmICh0aGlzLm9wdGlvbnMuaW5saW5lUG9saWN5U3RhdGVtZW50cyAmJiB0aGlzLm9wdGlvbnMuaW5saW5lUG9saWN5U3RhdGVtZW50cy5sZW5ndGggPiAwKSB7XHJcbiAgICAgIHNhLnJvbGUuYXR0YWNoSW5saW5lUG9saWN5KG5ldyBQb2xpY3koY2x1c3Rlci5zdGFjaywgYCR7dGhpcy5vcHRpb25zLmNoYXJ0fS1pbmxpbmUtcG9saWN5YCwge1xyXG4gICAgICAgIHN0YXRlbWVudHM6IHRoaXMub3B0aW9ucy5pbmxpbmVQb2xpY3lTdGF0ZW1lbnRzXHJcbiAgICAgIH0pKTtcclxuICAgIH1cclxuICAgIGNvbnN0IGNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcyk7XHJcbiAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogcG9wdWxhdGVWYWx1ZXMgcG9wdWxhdGVzIHRoZSBhcHByb3ByaWF0ZSB2YWx1ZXMgdXNlZCB0byBjdXN0b21pemUgdGhlIEhlbG0gY2hhcnRcclxuICogQHBhcmFtIGhlbG1PcHRpb25zIFVzZXIgcHJvdmlkZWQgdmFsdWVzIHRvIGN1c3RvbWl6ZSB0aGUgY2hhcnRcclxuICovXHJcbmZ1bmN0aW9uIHBvcHVsYXRlVmFsdWVzKGhlbG1PcHRpb25zOiBBY2tBZGRPblByb3BzLCBhd3NSZWdpb246IHN0cmluZyk6IFZhbHVlcyB7XHJcbiAgY29uc3QgdmFsdWVzID0gaGVsbU9wdGlvbnMudmFsdWVzID8/IHt9O1xyXG4gIHNldFBhdGgodmFsdWVzLCBcImF3cy5yZWdpb25cIiwgYXdzUmVnaW9uKTtcclxuICBzZXRQYXRoKHZhbHVlcyxcInNlcnZpY2VBY2NvdW50LmNyZWF0ZVwiLCBmYWxzZSk7XHJcbiAgc2V0UGF0aCh2YWx1ZXMsXCJzZXJ2aWNlQWNjb3VudC5uYW1lXCIsIGhlbG1PcHRpb25zLnNhTmFtZSk7XHJcbiAgcmV0dXJuIHZhbHVlcztcclxufVxyXG5cclxuLyoqXHJcbiAqIHBvcHVsYXRlIHBhcmFtZXRlcnMgcGFzc2VkIG9yIHRoZSBkZWZhdWx0IHZhbHVlcyBmcm9tIHNlcnZpY2UgTWFwcGluZ3MuXHJcbiAqL1xyXG5mdW5jdGlvbiBwb3B1bGF0ZURlZmF1bHRzKGRlZmF1bHRQcm9wczogQWNrQWRkT25Qcm9wcywgcHJvcHM/OiBBY2tBZGRPblByb3BzKTogQWNrQWRkT25Qcm9wcyB7XHJcbiAgbGV0IHRlbXBQcm9wcyA6IFBhcnRpYWw8QWNrQWRkT25Qcm9wcz4gPSB7Li4ucHJvcHMgPz8ge319OyAvLyBzaW5jZSBwcm9wcyBtYXkgYmUgZW1wdHlcclxuICB0ZW1wUHJvcHMuaWQgPSB0ZW1wUHJvcHMuaWQgPz8gZGVmYXVsdFByb3BzLmlkO1xyXG4gIHRlbXBQcm9wcy5zZXJ2aWNlTmFtZSA9IHRlbXBQcm9wcy5zZXJ2aWNlTmFtZSA/PyBkZWZhdWx0UHJvcHMuc2VydmljZU5hbWU7XHJcbiAgdGVtcFByb3BzLm5hbWUgPSB0ZW1wUHJvcHMubmFtZSA/PyBzZXJ2aWNlTWFwcGluZ3NbdGVtcFByb3BzLnNlcnZpY2VOYW1lIV0hLmNoYXJ0O1xyXG4gIHRlbXBQcm9wcy5uYW1lc3BhY2UgPSB0ZW1wUHJvcHMubmFtZXNwYWNlID8/IGRlZmF1bHRQcm9wcy5uYW1lc3BhY2U7XHJcbiAgdGVtcFByb3BzLmNoYXJ0ID0gdGVtcFByb3BzLmNoYXJ0ID8/IHNlcnZpY2VNYXBwaW5nc1t0ZW1wUHJvcHMuc2VydmljZU5hbWUhXT8uY2hhcnQ7XHJcbiAgdGVtcFByb3BzLnZlcnNpb24gPSB0ZW1wUHJvcHMudmVyc2lvbiA/PyBzZXJ2aWNlTWFwcGluZ3NbdGVtcFByb3BzLnNlcnZpY2VOYW1lIV0/LnZlcnNpb247XHJcbiAgY29uc3QgcmVwb3NpdG9yeVVybCA9IFwib2NpOi8vcHVibGljLmVjci5hd3MvYXdzLWNvbnRyb2xsZXJzLWs4c1wiO1xyXG4gIHRlbXBQcm9wcy5yZWxlYXNlID0gdGVtcFByb3BzLnJlbGVhc2UgPz8gdGVtcFByb3BzLmNoYXJ0O1xyXG4gIHRlbXBQcm9wcy5yZXBvc2l0b3J5ID0gdGVtcFByb3BzLnJlcG9zaXRvcnkgPz8gYCR7cmVwb3NpdG9yeVVybH0vJHt0ZW1wUHJvcHMubmFtZX1gO1xyXG4gIHRlbXBQcm9wcy5tYW5hZ2VkUG9saWN5TmFtZSA9IHRlbXBQcm9wcy5tYW5hZ2VkUG9saWN5TmFtZSA/PyBzZXJ2aWNlTWFwcGluZ3NbdGVtcFByb3BzLnNlcnZpY2VOYW1lIV0/Lm1hbmFnZWRQb2xpY3lOYW1lO1xyXG4gIHRlbXBQcm9wcy5pbmxpbmVQb2xpY3lTdGF0ZW1lbnRzID0gdGVtcFByb3BzLmlubGluZVBvbGljeVN0YXRlbWVudHMgPz8gc2VydmljZU1hcHBpbmdzW3RlbXBQcm9wcy5zZXJ2aWNlTmFtZSFdPy5pbmxpbmVQb2xpY3lTdGF0ZW1lbnRzO1xyXG4gIHRlbXBQcm9wcy5jcmVhdGVOYW1lc3BhY2UgPSB0ZW1wUHJvcHMuY3JlYXRlTmFtZXNwYWNlID8/IGRlZmF1bHRQcm9wcy5jcmVhdGVOYW1lc3BhY2U7XHJcbiAgdGVtcFByb3BzLnNhTmFtZSA9IHRlbXBQcm9wcy5zYU5hbWUgPz8gYCR7dGVtcFByb3BzLmNoYXJ0fS1zYWA7XHJcbiAgcmV0dXJuIHRlbXBQcm9wcyBhcyBBY2tBZGRPblByb3BzO1xyXG59XHJcbiJdfQ==