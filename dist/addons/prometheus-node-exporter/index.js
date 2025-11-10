"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrometheusNodeExporterAddOn = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: "prometheus-node-exporter",
    namespace: "prometheus-node-exporter",
    chart: "prometheus-node-exporter",
    version: "4.48.0",
    release: "prometheus-node-exporter",
    repository: "https://prometheus-community.github.io/helm-charts",
    values: {},
    createNamespace: true
};
/**
 * Main class to instantiate the Helm chart
 */
let PrometheusNodeExporterAddOn = class PrometheusNodeExporterAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = populateValues(this.options);
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        if (this.options.createNamespace == true) {
            // Let CDK Create the Namespace
            const namespace = (0, utils_1.createNamespace)(this.options.namespace, cluster);
            const chart = this.addHelmChart(clusterInfo, values);
            chart.node.addDependency(namespace);
            return Promise.resolve(chart);
        }
        else {
            //Namespace is already created
            const chart = this.addHelmChart(clusterInfo, values);
            return Promise.resolve(chart);
        }
    }
};
exports.PrometheusNodeExporterAddOn = PrometheusNodeExporterAddOn;
exports.PrometheusNodeExporterAddOn = PrometheusNodeExporterAddOn = __decorate([
    utils_1.supportsALL
], PrometheusNodeExporterAddOn);
/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions) {
    const values = helmOptions.values ?? {};
    return values;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3Byb21ldGhldXMtbm9kZS1leHBvcnRlci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQSwrQ0FBcUM7QUFFckMsdUNBQTJEO0FBQzNELDhDQUE4RTtBQVc5RTs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFzRDtJQUN0RSxJQUFJLEVBQUUsMEJBQTBCO0lBQ2hDLFNBQVMsRUFBRSwwQkFBMEI7SUFDckMsS0FBSyxFQUFFLDBCQUEwQjtJQUNqQyxPQUFPLEVBQUUsUUFBUTtJQUNqQixPQUFPLEVBQUUsMEJBQTBCO0lBQ25DLFVBQVUsRUFBRyxvREFBb0Q7SUFDakUsTUFBTSxFQUFFLEVBQUU7SUFDVixlQUFlLEVBQUUsSUFBSTtDQUV0QixDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLDJCQUEyQixHQUFqQyxNQUFNLDJCQUE0QixTQUFRLHNCQUFTO0lBRS9DLE9BQU8sQ0FBbUM7SUFFbkQsWUFBWSxLQUF3QztRQUNsRCxLQUFLLENBQUMsRUFBQyxHQUFHLFlBQVksRUFBRSxHQUFHLEtBQUssRUFBQyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBeUMsQ0FBQztJQUNoRSxDQUFDO0lBRUQsTUFBTSxDQUFDLFdBQXdCO1FBQzdCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDcEMsSUFBSSxNQUFNLEdBQVcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsRCxNQUFNLEdBQUcsSUFBQSxvQkFBSyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVoRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksRUFBQyxDQUFDO1lBQ3hDLCtCQUErQjtZQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFVLEVBQUcsT0FBTyxDQUFDLENBQUM7WUFDckUsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDckQsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRWhDLENBQUM7YUFBTSxDQUFDO1lBQ04sOEJBQThCO1lBQzlCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3JELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNoQyxDQUFDO0lBRUgsQ0FBQztDQUNGLENBQUE7QUE1Qlksa0VBQTJCO3NDQUEzQiwyQkFBMkI7SUFEdkMsbUJBQVc7R0FDQywyQkFBMkIsQ0E0QnZDO0FBRUQ7OztHQUdHO0FBQ0gsU0FBUyxjQUFjLENBQUMsV0FBNkM7SUFDbkUsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7SUFDeEMsT0FBTyxNQUFNLENBQUM7QUFDaEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIGxpYi9jZXJ0bWFuYWdlcl9hZGRvbi50c1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IGNyZWF0ZU5hbWVzcGFjZSwgc3VwcG9ydHNBTEwgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Qcm9wcywgSGVsbUFkZE9uVXNlclByb3BzIH0gZnJvbSBcIi4uL2hlbG0tYWRkb25cIjtcclxuLyoqXHJcbiAqIFVzZXIgcHJvdmlkZWQgb3B0aW9uIGZvciB0aGUgSGVsbSBDaGFydFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBQcm9tZXRoZXVzTm9kZUV4cG9ydGVyQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICAqIFRvIENyZWF0ZSBOYW1lc3BhY2UgdXNpbmcgQ0RLXHJcbiAgICAgKi8gICAgXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuO1xyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBwcm9wcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgdGhlIEhlbG0gY2hhcnRcclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wczogSGVsbUFkZE9uUHJvcHMgJiBQcm9tZXRoZXVzTm9kZUV4cG9ydGVyQWRkT25Qcm9wcyA9IHtcclxuICBuYW1lOiBcInByb21ldGhldXMtbm9kZS1leHBvcnRlclwiLFxyXG4gIG5hbWVzcGFjZTogXCJwcm9tZXRoZXVzLW5vZGUtZXhwb3J0ZXJcIixcclxuICBjaGFydDogXCJwcm9tZXRoZXVzLW5vZGUtZXhwb3J0ZXJcIixcclxuICB2ZXJzaW9uOiBcIjQuNDguMFwiLFxyXG4gIHJlbGVhc2U6IFwicHJvbWV0aGV1cy1ub2RlLWV4cG9ydGVyXCIsXHJcbiAgcmVwb3NpdG9yeTogIFwiaHR0cHM6Ly9wcm9tZXRoZXVzLWNvbW11bml0eS5naXRodWIuaW8vaGVsbS1jaGFydHNcIixcclxuICB2YWx1ZXM6IHt9LFxyXG4gIGNyZWF0ZU5hbWVzcGFjZTogdHJ1ZVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWluIGNsYXNzIHRvIGluc3RhbnRpYXRlIHRoZSBIZWxtIGNoYXJ0XHJcbiAqL1xyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIFByb21ldGhldXNOb2RlRXhwb3J0ZXJBZGRPbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gIHJlYWRvbmx5IG9wdGlvbnM6IFByb21ldGhldXNOb2RlRXhwb3J0ZXJBZGRPblByb3BzO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wcz86IFByb21ldGhldXNOb2RlRXhwb3J0ZXJBZGRPblByb3BzKSB7XHJcbiAgICBzdXBlcih7Li4uZGVmYXVsdFByb3BzLCAuLi5wcm9wc30pO1xyXG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcyBhcyBQcm9tZXRoZXVzTm9kZUV4cG9ydGVyQWRkT25Qcm9wcztcclxuICB9XHJcblxyXG4gIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSBwb3B1bGF0ZVZhbHVlcyh0aGlzLm9wdGlvbnMpO1xyXG4gICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcblxyXG4gICAgaWYoIHRoaXMub3B0aW9ucy5jcmVhdGVOYW1lc3BhY2UgPT0gdHJ1ZSl7XHJcbiAgICAgIC8vIExldCBDREsgQ3JlYXRlIHRoZSBOYW1lc3BhY2VcclxuICAgICAgY29uc3QgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlKHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhICwgY2x1c3Rlcik7XHJcbiAgICAgIGNvbnN0IGNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcyk7XHJcbiAgICAgIGNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShuYW1lc3BhY2UpO1xyXG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNoYXJ0KTtcclxuXHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAvL05hbWVzcGFjZSBpcyBhbHJlYWR5IGNyZWF0ZWRcclxuICAgICAgY29uc3QgY2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzKTtcclxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgICB9XHJcbiAgICBcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBwb3B1bGF0ZVZhbHVlcyBwb3B1bGF0ZXMgdGhlIGFwcHJvcHJpYXRlIHZhbHVlcyB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgSGVsbSBjaGFydFxyXG4gKiBAcGFyYW0gaGVsbU9wdGlvbnMgVXNlciBwcm92aWRlZCB2YWx1ZXMgdG8gY3VzdG9taXplIHRoZSBjaGFydFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdWxhdGVWYWx1ZXMoaGVsbU9wdGlvbnM6IFByb21ldGhldXNOb2RlRXhwb3J0ZXJBZGRPblByb3BzKTogVmFsdWVzIHtcclxuICBjb25zdCB2YWx1ZXMgPSBoZWxtT3B0aW9ucy52YWx1ZXMgPz8ge307XHJcbiAgcmV0dXJuIHZhbHVlcztcclxufVxyXG4iXX0=