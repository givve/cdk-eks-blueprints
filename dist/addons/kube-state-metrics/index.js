"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KubeStateMetricsAddOn = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: "kube-state-metrics",
    namespace: "kube-system",
    chart: "kube-state-metrics",
    version: "6.3.0",
    release: "kube-state-metrics",
    repository: "https://prometheus-community.github.io/helm-charts",
    values: {},
    createNamespace: true
};
/**
 * Main class to instantiate the Helm chart
 */
let KubeStateMetricsAddOn = class KubeStateMetricsAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = populateValues(this.options);
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values);
        if (this.options.createNamespace == true) {
            // Let CDK Create the Namespace
            const namespace = (0, utils_1.createNamespace)(this.options.namespace, cluster);
            chart.node.addDependency(namespace);
        }
        return Promise.resolve(chart);
    }
};
exports.KubeStateMetricsAddOn = KubeStateMetricsAddOn;
exports.KubeStateMetricsAddOn = KubeStateMetricsAddOn = __decorate([
    utils_1.supportsALL
], KubeStateMetricsAddOn);
/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions) {
    const values = helmOptions.values ?? {};
    return values;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2t1YmUtc3RhdGUtbWV0cmljcy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQSwrQ0FBcUM7QUFFckMsdUNBQTJEO0FBQzNELDhDQUE4RTtBQVc5RTs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFnRDtJQUNoRSxJQUFJLEVBQUUsb0JBQW9CO0lBQzFCLFNBQVMsRUFBRSxhQUFhO0lBQ3hCLEtBQUssRUFBRSxvQkFBb0I7SUFDM0IsT0FBTyxFQUFFLE9BQU87SUFDaEIsT0FBTyxFQUFFLG9CQUFvQjtJQUM3QixVQUFVLEVBQUcsb0RBQW9EO0lBQ2pFLE1BQU0sRUFBRSxFQUFFO0lBQ1YsZUFBZSxFQUFFLElBQUk7Q0FFdEIsQ0FBQztBQUVGOztHQUVHO0FBRUksSUFBTSxxQkFBcUIsR0FBM0IsTUFBTSxxQkFBc0IsU0FBUSxzQkFBUztJQUV6QyxPQUFPLENBQTZCO0lBRTdDLFlBQVksS0FBa0M7UUFDNUMsS0FBSyxDQUFDLEVBQUMsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQW1DLENBQUM7SUFDMUQsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3QjtRQUM3QixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLElBQUksTUFBTSxHQUFXLGNBQWMsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDbEQsTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUUsQ0FBQztZQUN2QywrQkFBK0I7WUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBVSxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3BFLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3hDLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGLENBQUE7QUFyQlksc0RBQXFCO2dDQUFyQixxQkFBcUI7SUFEakMsbUJBQVc7R0FDQyxxQkFBcUIsQ0FxQmpDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjLENBQUMsV0FBdUM7SUFDN0QsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7SUFDeEMsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGxpYi9jZXJ0bWFuYWdlcl9hZGRvbi50c1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IGNyZWF0ZU5hbWVzcGFjZSwgc3VwcG9ydHNBTEwgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Qcm9wcywgSGVsbUFkZE9uVXNlclByb3BzIH0gZnJvbSBcIi4uL2hlbG0tYWRkb25cIjtcclxuLyoqXHJcbiAqIFVzZXIgcHJvdmlkZWQgb3B0aW9uIGZvciB0aGUgSGVsbSBDaGFydFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBLdWJlU3RhdGVNZXRyaWNzQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICAqIFRvIENyZWF0ZSBOYW1lc3BhY2UgdXNpbmcgQ0RLXHJcbiAgICAgKi8gICAgXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuO1xyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBwcm9wcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgdGhlIEhlbG0gY2hhcnRcclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wczogSGVsbUFkZE9uUHJvcHMgJiBLdWJlU3RhdGVNZXRyaWNzQWRkT25Qcm9wcyA9IHtcclxuICBuYW1lOiBcImt1YmUtc3RhdGUtbWV0cmljc1wiLFxyXG4gIG5hbWVzcGFjZTogXCJrdWJlLXN5c3RlbVwiLFxyXG4gIGNoYXJ0OiBcImt1YmUtc3RhdGUtbWV0cmljc1wiLFxyXG4gIHZlcnNpb246IFwiNi4zLjBcIixcclxuICByZWxlYXNlOiBcImt1YmUtc3RhdGUtbWV0cmljc1wiLFxyXG4gIHJlcG9zaXRvcnk6ICBcImh0dHBzOi8vcHJvbWV0aGV1cy1jb21tdW5pdHkuZ2l0aHViLmlvL2hlbG0tY2hhcnRzXCIsXHJcbiAgdmFsdWVzOiB7fSxcclxuICBjcmVhdGVOYW1lc3BhY2U6IHRydWVcclxuXHJcbn07XHJcblxyXG4vKipcclxuICogTWFpbiBjbGFzcyB0byBpbnN0YW50aWF0ZSB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBLdWJlU3RhdGVNZXRyaWNzQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICByZWFkb25seSBvcHRpb25zOiBLdWJlU3RhdGVNZXRyaWNzQWRkT25Qcm9wcztcclxuXHJcbiAgY29uc3RydWN0b3IocHJvcHM/OiBLdWJlU3RhdGVNZXRyaWNzQWRkT25Qcm9wcykge1xyXG4gICAgc3VwZXIoey4uLmRlZmF1bHRQcm9wcywgLi4ucHJvcHN9KTtcclxuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgS3ViZVN0YXRlTWV0cmljc0FkZE9uUHJvcHM7XHJcbiAgfVxyXG5cclxuICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG4gICAgbGV0IHZhbHVlczogVmFsdWVzID0gcG9wdWxhdGVWYWx1ZXModGhpcy5vcHRpb25zKTtcclxuICAgIHZhbHVlcyA9IG1lcmdlKHZhbHVlcywgdGhpcy5wcm9wcy52YWx1ZXMgPz8ge30pO1xyXG4gICAgY29uc3QgY2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzKTtcclxuICAgIGlmICh0aGlzLm9wdGlvbnMuY3JlYXRlTmFtZXNwYWNlID09IHRydWUpIHtcclxuICAgICAgICAvLyBMZXQgQ0RLIENyZWF0ZSB0aGUgTmFtZXNwYWNlXHJcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlKHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhLCBjbHVzdGVyKTtcclxuICAgICAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3kobmFtZXNwYWNlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIHBvcHVsYXRlVmFsdWVzIHBvcHVsYXRlcyB0aGUgYXBwcm9wcmlhdGUgdmFsdWVzIHVzZWQgdG8gY3VzdG9taXplIHRoZSBIZWxtIGNoYXJ0XHJcbiAqIEBwYXJhbSBoZWxtT3B0aW9ucyBVc2VyIHByb3ZpZGVkIHZhbHVlcyB0byBjdXN0b21pemUgdGhlIGNoYXJ0XHJcbiAqL1xyXG5mdW5jdGlvbiBwb3B1bGF0ZVZhbHVlcyhoZWxtT3B0aW9uczogS3ViZVN0YXRlTWV0cmljc0FkZE9uUHJvcHMpOiBWYWx1ZXMge1xyXG4gIGNvbnN0IHZhbHVlcyA9IGhlbG1PcHRpb25zLnZhbHVlcyA/PyB7fTtcclxuICByZXR1cm4gdmFsdWVzO1xyXG59XHJcbiJdfQ==