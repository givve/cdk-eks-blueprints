"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KubeviousAddOn = void 0;
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: "kubevious",
    namespace: "kubevious",
    chart: "kubevious",
    version: "1.2.2",
    release: "kubevious",
    repository: "https://helm.kubevious.io",
    values: {},
    ingressEnabled: false,
    kubeviousServiceType: "ClusterIP",
};
/**
 * Main class to instantiate the Helm chart
 */
let KubeviousAddOn = class KubeviousAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        let values = populateValues(this.options);
        const chart = this.addHelmChart(clusterInfo, values);
        return Promise.resolve(chart);
    }
};
exports.KubeviousAddOn = KubeviousAddOn;
exports.KubeviousAddOn = KubeviousAddOn = __decorate([
    utils_1.supportsX86
], KubeviousAddOn);
/**
 * populateValues populates the appropriate values used to customize the Helm chart
 * @param helmOptions User provided values to customize the chart
 */
function populateValues(helmOptions) {
    const values = helmOptions.values ?? {};
    (0, utils_1.setPath)(values, "ingress.enabled", helmOptions.ingressEnabled);
    (0, utils_1.setPath)(values, "ui.service.type", helmOptions.kubeviousServiceType);
    // Generate a random password for MySQL DB root user
    (0, utils_1.setPath)(values, "mysql.generate_passwords", true);
    return values;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2t1YmV2aW91cy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSw4Q0FBOEU7QUFFOUUsdUNBQW1EO0FBcUJuRDs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUF5QztJQUN2RCxJQUFJLEVBQUUsV0FBVztJQUNqQixTQUFTLEVBQUUsV0FBVztJQUN0QixLQUFLLEVBQUUsV0FBVztJQUNsQixPQUFPLEVBQUUsT0FBTztJQUNoQixPQUFPLEVBQUUsV0FBVztJQUNwQixVQUFVLEVBQUcsMkJBQTJCO0lBQ3hDLE1BQU0sRUFBRSxFQUFFO0lBRVYsY0FBYyxFQUFFLEtBQUs7SUFDckIsb0JBQW9CLEVBQUUsV0FBVztDQUNwQyxDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLGNBQWMsR0FBcEIsTUFBTSxjQUFlLFNBQVEsc0JBQVM7SUFFaEMsT0FBTyxDQUFzQjtJQUV0QyxZQUFZLEtBQTJCO1FBQ25DLEtBQUssQ0FBQyxFQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUE0QixDQUFDO0lBQ3JELENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFDM0IsSUFBSSxNQUFNLEdBQVcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNsRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVyRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztDQUNKLENBQUE7QUFmWSx3Q0FBYzt5QkFBZCxjQUFjO0lBRDFCLG1CQUFXO0dBQ0MsY0FBYyxDQWUxQjtBQUVEOzs7R0FHRztBQUNILFNBQVMsY0FBYyxDQUFDLFdBQWdDO0lBQ3BELE1BQU0sTUFBTSxHQUFHLFdBQVcsQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO0lBRXhDLElBQUEsZUFBTyxFQUFDLE1BQU0sRUFBRSxpQkFBaUIsRUFBRyxXQUFXLENBQUMsY0FBYyxDQUFDLENBQUM7SUFDaEUsSUFBQSxlQUFPLEVBQUMsTUFBTSxFQUFFLGlCQUFpQixFQUFHLFdBQVcsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0lBQ3RFLG9EQUFvRDtJQUNwRCxJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUcsSUFBSSxDQUFDLENBQUM7SUFFbkQsT0FBTyxNQUFNLENBQUM7QUFDbEIsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uVXNlclByb3BzLCBIZWxtQWRkT25Qcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IHNldFBhdGgsIHN1cHBvcnRzWDg2IH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG5cclxuLyoqXHJcbiAqIFVzZXIgcHJvdmlkZWQgb3B0aW9ucyBmb3IgdGhlIEhlbG0gQ2hhcnRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgS3ViZXZpb3VzQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICAqIFZlcnNpb24gb2YgdGhlIGhlbG0gY2hhcnQgdG8gZGVwbG95XHJcbiAgICAgKi9cclxuICAgIHZlcnNpb24/OiBzdHJpbmcsXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSBhbiBpbmdyZXNzIGZvciBhY2Nlc3MgdG8gS3ViZXZpb3VzXHJcbiAgICAgKi9cclxuICAgIGluZ3Jlc3NFbmFibGVkPzogYm9vbGVhbixcclxuICAgIC8qKlxyXG4gICAgICogVHlwZSBvZiBzZXJ2aWNlIHRvIGV4cG9zZSBLdWJldmlvdXMgVUlcclxuICAgICAqL1xyXG4gICAga3ViZXZpb3VzU2VydmljZVR5cGU/OiBzdHJpbmcsXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHByb3BzIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzOiBIZWxtQWRkT25Qcm9wcyAmIEt1YmV2aW91c0FkZE9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiBcImt1YmV2aW91c1wiLFxyXG4gICAgbmFtZXNwYWNlOiBcImt1YmV2aW91c1wiLFxyXG4gICAgY2hhcnQ6IFwia3ViZXZpb3VzXCIsXHJcbiAgICB2ZXJzaW9uOiBcIjEuMi4yXCIsXHJcbiAgICByZWxlYXNlOiBcImt1YmV2aW91c1wiLFxyXG4gICAgcmVwb3NpdG9yeTogIFwiaHR0cHM6Ly9oZWxtLmt1YmV2aW91cy5pb1wiLFxyXG4gICAgdmFsdWVzOiB7fSxcclxuXHJcbiAgICBpbmdyZXNzRW5hYmxlZDogZmFsc2UsXHJcbiAgICBrdWJldmlvdXNTZXJ2aWNlVHlwZTogXCJDbHVzdGVySVBcIixcclxufTtcclxuXHJcbi8qKlxyXG4gKiBNYWluIGNsYXNzIHRvIGluc3RhbnRpYXRlIHRoZSBIZWxtIGNoYXJ0XHJcbiAqL1xyXG5Ac3VwcG9ydHNYODZcclxuZXhwb3J0IGNsYXNzIEt1YmV2aW91c0FkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgICByZWFkb25seSBvcHRpb25zOiBLdWJldmlvdXNBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogS3ViZXZpb3VzQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzfSk7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcyBhcyBLdWJldmlvdXNBZGRPblByb3BzO1xyXG4gICAgfVxyXG5cclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGxldCB2YWx1ZXM6IFZhbHVlcyA9IHBvcHVsYXRlVmFsdWVzKHRoaXMub3B0aW9ucyk7XHJcbiAgICAgICAgY29uc3QgY2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBwb3B1bGF0ZVZhbHVlcyBwb3B1bGF0ZXMgdGhlIGFwcHJvcHJpYXRlIHZhbHVlcyB1c2VkIHRvIGN1c3RvbWl6ZSB0aGUgSGVsbSBjaGFydFxyXG4gKiBAcGFyYW0gaGVsbU9wdGlvbnMgVXNlciBwcm92aWRlZCB2YWx1ZXMgdG8gY3VzdG9taXplIHRoZSBjaGFydFxyXG4gKi9cclxuZnVuY3Rpb24gcG9wdWxhdGVWYWx1ZXMoaGVsbU9wdGlvbnM6IEt1YmV2aW91c0FkZE9uUHJvcHMpOiBWYWx1ZXMge1xyXG4gICAgY29uc3QgdmFsdWVzID0gaGVsbU9wdGlvbnMudmFsdWVzID8/IHt9O1xyXG5cclxuICAgIHNldFBhdGgodmFsdWVzLCBcImluZ3Jlc3MuZW5hYmxlZFwiLCAgaGVsbU9wdGlvbnMuaW5ncmVzc0VuYWJsZWQpO1xyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwidWkuc2VydmljZS50eXBlXCIsICBoZWxtT3B0aW9ucy5rdWJldmlvdXNTZXJ2aWNlVHlwZSk7XHJcbiAgICAvLyBHZW5lcmF0ZSBhIHJhbmRvbSBwYXNzd29yZCBmb3IgTXlTUUwgREIgcm9vdCB1c2VyXHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJteXNxbC5nZW5lcmF0ZV9wYXNzd29yZHNcIiwgIHRydWUpO1xyXG5cclxuICAgIHJldHVybiB2YWx1ZXM7XHJcbn1cclxuIl19