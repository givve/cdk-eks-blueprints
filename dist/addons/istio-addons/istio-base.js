"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IstioBaseAddOn = exports.ISTIO_VERSION = void 0;
const helm_addon_1 = require("../helm-addon");
const namespace_utils_1 = require("../../utils/namespace-utils");
const ts_deepmerge_1 = require("ts-deepmerge");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const utils_1 = require("../../utils");
exports.ISTIO_VERSION = "1.27.1";
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: "istio-base",
    release: "istio-base",
    namespace: "istio-system",
    chart: "base",
    version: exports.ISTIO_VERSION,
    repository: "https://istio-release.storage.googleapis.com/charts"
};
let IstioBaseAddOn = class IstioBaseAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        // Istio Namespace
        const namespace = (0, namespace_utils_1.createNamespace)('istio-system', cluster);
        let values = {
            global: {
                istiod: {
                    enableAnalysis: this.options.enableAnalysis
                },
                configValidation: this.options.configValidation,
                externalIstiod: this.options.externalIstiod,
                base: {
                    enableIstioConfigCRDs: this.options.enableIstioConfigCRDs
                }
            }
        };
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values, undefined, true, aws_cdk_lib_1.Duration.seconds(60));
        chart.node.addDependency(namespace);
        return Promise.resolve(chart);
    }
};
exports.IstioBaseAddOn = IstioBaseAddOn;
exports.IstioBaseAddOn = IstioBaseAddOn = __decorate([
    utils_1.supportsALL
], IstioBaseAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXN0aW8tYmFzZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvaXN0aW8tYWRkb25zL2lzdGlvLWJhc2UudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsOENBQThEO0FBRzlELGlFQUE4RDtBQUM5RCwrQ0FBcUM7QUFDckMsNkNBQXVDO0FBQ3ZDLHVDQUEwQztBQUU3QixRQUFBLGFBQWEsR0FBRyxRQUFRLENBQUM7QUE0Q3RDOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUc7SUFDakIsSUFBSSxFQUFFLFlBQVk7SUFDbEIsT0FBTyxFQUFFLFlBQVk7SUFDckIsU0FBUyxFQUFFLGNBQWM7SUFDekIsS0FBSyxFQUFFLE1BQU07SUFDYixPQUFPLEVBQUUscUJBQWE7SUFDdEIsVUFBVSxFQUFFLHFEQUFxRDtDQUNwRSxDQUFDO0FBR0ssSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFTO0lBRWhDLE9BQU8sQ0FBc0I7SUFFdEMsWUFBWSxLQUEyQjtRQUNuQyxLQUFLLENBQUMsRUFBRSxHQUFHLFlBQVksRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDckMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQzlCLENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFFM0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUVwQyxrQkFBa0I7UUFDbEIsTUFBTSxTQUFTLEdBQUcsSUFBQSxpQ0FBZSxFQUFDLGNBQWMsRUFBRSxPQUFPLENBQUMsQ0FBQztRQUUzRCxJQUFJLE1BQU0sR0FBVztZQUNqQixNQUFNLEVBQUU7Z0JBQ0osTUFBTSxFQUFFO29CQUNKLGNBQWMsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGNBQWM7aUJBQzlDO2dCQUNELGdCQUFnQixFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCO2dCQUMvQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxjQUFjO2dCQUMzQyxJQUFJLEVBQUU7b0JBQ0YscUJBQXFCLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxxQkFBcUI7aUJBQzVEO2FBQ0o7U0FDSixDQUFDO1FBRUYsTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsc0JBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztRQUM1RixLQUFLLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUVwQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztDQUNKLENBQUE7QUFuQ1ksd0NBQWM7eUJBQWQsY0FBYztJQUQxQixtQkFBVztHQUNDLGNBQWMsQ0FtQzFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tIFwiLi4vaGVsbS1hZGRvblwiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UgfSBmcm9tIFwiLi4vLi4vdXRpbHMvbmFtZXNwYWNlLXV0aWxzXCI7XHJcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcInRzLWRlZXBtZXJnZVwiO1xyXG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBzdXBwb3J0c0FMTCB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xyXG5cclxuZXhwb3J0IGNvbnN0IElTVElPX1ZFUlNJT04gPSBcIjEuMjcuMVwiO1xyXG5cclxuLyoqXHJcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGFkZC1vbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXN0aW9CYXNlQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICogRW5hYmxlIGlzdGlvY3RsIGFuYWx5c2lzIHdoaWNoIHByb3ZpZGVzIHJpY2ggYW5hbHlzaXMgb2YgSXN0aW8gY29uZmlndXJhdGlvbiBzdGF0ZSBpbiBvcmRlciB0byBpZGVudGl0eSBpbnZhbGlkIG9yIHN1Ym9wdGltYWwgY29uZmlndXJhdGlvbnMuXHJcbiAgICAqIEBkZWZhdWx0IGZhbHNlXHJcbiAgICAqL1xyXG4gICAgZW5hYmxlQW5hbHlzaXM/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiAgRW5hYmxlIHRoZSBpc3RpbyBiYXNlIGNvbmZpZyB2YWxpZGF0aW9uLlxyXG4gICAgKiBAZGVmYXVsdCB0cnVlXHJcbiAgICAqL1xyXG4gICAgY29uZmlnVmFsaWRhdGlvbj86IGJvb2xlYW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAqICBJZiB0aGlzIGlzIHNldCB0byB0cnVlLCBvbmUgSXN0aW9kIHdpbGwgY29udHJvbCByZW1vdGUgY2x1c3RlcnMgaW5jbHVkaW5nIENBLlxyXG4gICAgKiBAZGVmYXVsdCBmYWxzZVxyXG4gICAgKi9cclxuICAgIGV4dGVybmFsSXN0aW9kPzogYm9vbGVhbjtcclxuXHJcbiAgICAvKipcclxuICAgICogVGhlIGFkZHJlc3Mgb3IgaG9zdG5hbWUgb2YgdGhlIHJlbW90ZSBwaWxvdFxyXG4gICAgKiBAZGVmYXVsdCBudWxsXHJcbiAgICAqL1xyXG4gICAgcmVtb3RlUGlsb3RBZGRyZXNzPzogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgKiBWYWxpZGF0aW9uIHdlYmhvb2sgY29uZmlndXJhdGlvbiB1cmxcclxuICAgICogRm9yIGV4YW1wbGU6IGh0dHBzOi8vJHJlbW90ZVBpbG90QWRkcmVzczoxNTAxNy92YWxpZGF0ZVxyXG4gICAgKiBAZGVmYXVsdCBudWxsXHJcbiAgICAqL1xyXG4gICAgdmFsaWRhdGlvblVSTD86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICogRm9yIGlzdGlvY3RsIHVzYWdlIHRvIGRpc2FibGUgaXN0aW8gY29uZmlnIGNyZHMgaW4gYmFzZS5cclxuICAgICogQGRlZmF1bHQgdHJ1ZVxyXG4gICAgKi9cclxuICAgIGVuYWJsZUlzdGlvQ29uZmlnQ1JEcz86IGJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0cyBvcHRpb25zIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XHJcbiAgICBuYW1lOiBcImlzdGlvLWJhc2VcIixcclxuICAgIHJlbGVhc2U6IFwiaXN0aW8tYmFzZVwiLFxyXG4gICAgbmFtZXNwYWNlOiBcImlzdGlvLXN5c3RlbVwiLFxyXG4gICAgY2hhcnQ6IFwiYmFzZVwiLFxyXG4gICAgdmVyc2lvbjogSVNUSU9fVkVSU0lPTixcclxuICAgIHJlcG9zaXRvcnk6IFwiaHR0cHM6Ly9pc3Rpby1yZWxlYXNlLnN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vY2hhcnRzXCJcclxufTtcclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgSXN0aW9CYXNlQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICAgIHJlYWRvbmx5IG9wdGlvbnM6IElzdGlvQmFzZUFkZE9uUHJvcHM7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBJc3Rpb0Jhc2VBZGRPblByb3BzKSB7XHJcbiAgICAgICAgc3VwZXIoeyAuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzIH0pO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHM7XHJcbiAgICB9XHJcblxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG5cclxuICAgICAgICAvLyBJc3RpbyBOYW1lc3BhY2VcclxuICAgICAgICBjb25zdCBuYW1lc3BhY2UgPSBjcmVhdGVOYW1lc3BhY2UoJ2lzdGlvLXN5c3RlbScsIGNsdXN0ZXIpO1xyXG5cclxuICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSB7XHJcbiAgICAgICAgICAgIGdsb2JhbDoge1xyXG4gICAgICAgICAgICAgICAgaXN0aW9kOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgZW5hYmxlQW5hbHlzaXM6IHRoaXMub3B0aW9ucy5lbmFibGVBbmFseXNpc1xyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIGNvbmZpZ1ZhbGlkYXRpb246IHRoaXMub3B0aW9ucy5jb25maWdWYWxpZGF0aW9uLFxyXG4gICAgICAgICAgICAgICAgZXh0ZXJuYWxJc3Rpb2Q6IHRoaXMub3B0aW9ucy5leHRlcm5hbElzdGlvZCxcclxuICAgICAgICAgICAgICAgIGJhc2U6IHtcclxuICAgICAgICAgICAgICAgICAgICBlbmFibGVJc3Rpb0NvbmZpZ0NSRHM6IHRoaXMub3B0aW9ucy5lbmFibGVJc3Rpb0NvbmZpZ0NSRHNcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIHZhbHVlcyA9IG1lcmdlKHZhbHVlcywgdGhpcy5wcm9wcy52YWx1ZXMgPz8ge30pO1xyXG4gICAgICAgIGNvbnN0IGNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcywgdW5kZWZpbmVkLCB0cnVlLCBEdXJhdGlvbi5zZWNvbmRzKDYwKSk7XHJcbiAgICAgICAgY2hhcnQubm9kZS5hZGREZXBlbmRlbmN5KG5hbWVzcGFjZSk7XHJcblxyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==