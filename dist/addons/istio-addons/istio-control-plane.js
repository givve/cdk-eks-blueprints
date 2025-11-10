"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IstioControlPlaneAddOn = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
const istio_base_1 = require("./istio-base");
const defaultProps = {
    name: "istiod",
    release: "istiod",
    namespace: "istio-system",
    chart: "istiod",
    version: istio_base_1.ISTIO_VERSION,
    repository: "https://istio-release.storage.googleapis.com/charts"
};
let IstioControlPlaneAddOn = class IstioControlPlaneAddOn extends helm_addon_1.HelmAddOn {
    constructor(props) {
        super({ ...defaultProps, ...props });
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = {
            awsRegion: cluster.stack.region,
        };
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values);
        return Promise.resolve(chart);
    }
};
exports.IstioControlPlaneAddOn = IstioControlPlaneAddOn;
__decorate([
    (0, utils_1.dependable)('IstioBaseAddOn')
], IstioControlPlaneAddOn.prototype, "deploy", null);
exports.IstioControlPlaneAddOn = IstioControlPlaneAddOn = __decorate([
    utils_1.supportsALL
], IstioControlPlaneAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXN0aW8tY29udHJvbC1wbGFuZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvaXN0aW8tYWRkb25zL2lzdGlvLWNvbnRyb2wtcGxhbmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsK0NBQXFDO0FBRXJDLDhDQUE4RDtBQUM5RCx1Q0FBc0Q7QUFFdEQsNkNBQTZDO0FBTTdDLE1BQU0sWUFBWSxHQUFHO0lBQ2pCLElBQUksRUFBRSxRQUFRO0lBQ2QsT0FBTyxFQUFFLFFBQVE7SUFDakIsU0FBUyxFQUFFLGNBQWM7SUFDekIsS0FBSyxFQUFFLFFBQVE7SUFDZixPQUFPLEVBQUUsMEJBQWE7SUFDdEIsVUFBVSxFQUFFLHFEQUFxRDtDQUNwRSxDQUFDO0FBR0ssSUFBTSxzQkFBc0IsR0FBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBUztJQUVqRCxZQUFZLEtBQW1DO1FBQzNDLEtBQUssQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBR0QsTUFBTSxDQUFDLFdBQXdCO1FBRTNCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFFcEMsSUFBSSxNQUFNLEdBQWlCO1lBQ3ZCLFNBQVMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU07U0FDbEMsQ0FBQztRQUVGLE1BQU0sR0FBRyxJQUFBLG9CQUFLLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRWhELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQ3JELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0NBQ0osQ0FBQTtBQXBCWSx3REFBc0I7QUFPL0I7SUFEQyxJQUFBLGtCQUFVLEVBQUMsZ0JBQWdCLENBQUM7b0RBYTVCO2lDQW5CUSxzQkFBc0I7SUFEbEMsbUJBQVc7R0FDQyxzQkFBc0IsQ0FvQmxDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IGRlcGVuZGFibGUsIHN1cHBvcnRzQUxMIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5pbXBvcnQgeyBWYWx1ZXNTY2hlbWEgfSBmcm9tIFwiLi9pc3Rpby1jb250cm9sLXBsYW5lLXZhbHVlc1wiO1xyXG5pbXBvcnQgeyBJU1RJT19WRVJTSU9OIH0gZnJvbSBcIi4vaXN0aW8tYmFzZVwiO1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBJc3Rpb0NvbnRyb2xQbGFuZUFkZE9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgdmFsdWVzPzogVmFsdWVzU2NoZW1hXHJcbn1cclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIG5hbWU6IFwiaXN0aW9kXCIsXHJcbiAgICByZWxlYXNlOiBcImlzdGlvZFwiLFxyXG4gICAgbmFtZXNwYWNlOiBcImlzdGlvLXN5c3RlbVwiLFxyXG4gICAgY2hhcnQ6IFwiaXN0aW9kXCIsXHJcbiAgICB2ZXJzaW9uOiBJU1RJT19WRVJTSU9OLFxyXG4gICAgcmVwb3NpdG9yeTogXCJodHRwczovL2lzdGlvLXJlbGVhc2Uuc3RvcmFnZS5nb29nbGVhcGlzLmNvbS9jaGFydHNcIlxyXG59O1xyXG5cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBJc3Rpb0NvbnRyb2xQbGFuZUFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IElzdGlvQ29udHJvbFBsYW5lQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsgLi4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBAZGVwZW5kYWJsZSgnSXN0aW9CYXNlQWRkT24nKVxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcblxyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG5cclxuICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZXNTY2hlbWEgPSB7XHJcbiAgICAgICAgICAgIGF3c1JlZ2lvbjogY2x1c3Rlci5zdGFjay5yZWdpb24sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcyk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==