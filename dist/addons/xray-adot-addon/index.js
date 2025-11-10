"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrayAdotAddOn = void 0;
const utils_1 = require("../../utils");
const adot_1 = require("../adot");
const kubectl_provider_1 = require("../helm-addon/kubectl-provider");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    deploymentMode: "deployment" /* xrayDeploymentMode.DEPLOYMENT */,
    name: 'adot-collector-xray',
    namespace: 'default'
};
/**
 * Implementation of XRAY ADOT add-on for EKS Blueprints. Installs ADOT Collector.
 */
let XrayAdotAddOn = class XrayAdotAddOn {
    xrayAddOnProps;
    constructor(props) {
        this.xrayAddOnProps = { ...defaultProps, ...props };
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let doc;
        // Applying manifest for configuring ADOT Collector for Xray.
        doc = (0, utils_1.readYamlDocument)(__dirname + '/collector-config-xray.ytpl');
        const manifest = doc.split("---").map(e => (0, utils_1.loadYaml)(e));
        const values = {
            awsRegion: cluster.stack.region,
            deploymentMode: this.xrayAddOnProps.deploymentMode,
            namespace: this.xrayAddOnProps.namespace
        };
        const manifestDeployment = {
            name: this.xrayAddOnProps.name,
            namespace: this.xrayAddOnProps.namespace,
            manifest,
            values
        };
        const kubectlProvider = new kubectl_provider_1.KubectlProvider(clusterInfo);
        const statement = kubectlProvider.addManifest(manifestDeployment);
        return Promise.resolve(statement);
    }
};
exports.XrayAdotAddOn = XrayAdotAddOn;
__decorate([
    (0, utils_1.dependable)(adot_1.AdotCollectorAddOn.name)
], XrayAdotAddOn.prototype, "deploy", null);
exports.XrayAdotAddOn = XrayAdotAddOn = __decorate([
    utils_1.supportsALL
], XrayAdotAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3hyYXktYWRvdC1hZGRvbi9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSx1Q0FBa0Y7QUFDbEYsa0NBQTZDO0FBRTdDLHFFQUFxRjtBQW9DckY7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBRztJQUNqQixjQUFjLGtEQUErQjtJQUM3QyxJQUFJLEVBQUUscUJBQXFCO0lBQzNCLFNBQVMsRUFBRSxTQUFTO0NBQ3ZCLENBQUM7QUFFRjs7R0FFRztBQUVJLElBQU0sYUFBYSxHQUFuQixNQUFNLGFBQWE7SUFFYixjQUFjLENBQXFCO0lBQzVDLFlBQVksS0FBMEI7UUFDbEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUM7SUFDeEQsQ0FBQztJQUdELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLElBQUksR0FBVyxDQUFDO1FBRWhCLDZEQUE2RDtRQUM3RCxHQUFHLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxTQUFTLEdBQUUsNkJBQTZCLENBQUMsQ0FBQztRQUVqRSxNQUFNLFFBQVEsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsZ0JBQVEsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3hELE1BQU0sTUFBTSxHQUFXO1lBQ25CLFNBQVMsRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU07WUFDL0IsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsY0FBYztZQUNsRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTO1NBQzFDLENBQUM7UUFFRixNQUFNLGtCQUFrQixHQUF1QjtZQUM1QyxJQUFJLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFLO1lBQy9CLFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVU7WUFDekMsUUFBUTtZQUNSLE1BQU07U0FDVCxDQUFDO1FBRUYsTUFBTSxlQUFlLEdBQUcsSUFBSSxrQ0FBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQ3pELE1BQU0sU0FBUyxHQUFHLGVBQWUsQ0FBQyxXQUFXLENBQUMsa0JBQWtCLENBQUMsQ0FBQztRQUNsRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNKLENBQUE7QUFqQ1ksc0NBQWE7QUFRdEI7SUFEQyxJQUFBLGtCQUFVLEVBQUMseUJBQWtCLENBQUMsSUFBSSxDQUFDOzJDQXlCbkM7d0JBaENRLGFBQWE7SUFEekIsbUJBQVc7R0FDQyxhQUFhLENBaUN6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENsdXN0ZXJBZGRPbiwgQ2x1c3RlckluZm8sIFZhbHVlcyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgZGVwZW5kYWJsZSwgbG9hZFlhbWwsIHJlYWRZYW1sRG9jdW1lbnQsIHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IEFkb3RDb2xsZWN0b3JBZGRPbiB9IGZyb20gXCIuLi9hZG90XCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5pbXBvcnQgeyBLdWJlY3RsUHJvdmlkZXIsIE1hbmlmZXN0RGVwbG95bWVudCB9IGZyb20gXCIuLi9oZWxtLWFkZG9uL2t1YmVjdGwtcHJvdmlkZXJcIjtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIFhSQVkgQURPVCBhZGQtb24gZGVwbG95cyBhbiBBV1MgRGlzdHJvIGZvciBPcGVuVGVsZW1ldHJ5IChBRE9UKSBDb2xsZWN0b3IgZm9yIFgtUmF5IHdoaWNoIHJlY2VpdmVzIHRyYWNlcyBmcm9tIHRoZSBcclxuICogYXBwbGljYXRpb24gYW5kIHNlbmRzIHRoZSBzYW1lIHRvIFgtUmF5IGNvbnNvbGUuIFlvdSBjYW4gY2hhbmdlIHRoZSBtb2RlIHRvIERhZW1vbnNldCwgU3RhdGVmdWxTZXQsIFxyXG4gKiBhbmQgU2lkZWNhciBkZXBlbmRpbmcgb24geW91ciBkZXBsb3ltZW50IHN0cmF0ZWd5LlxyXG4gKi9cclxuXHJcbi8qKlxyXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIGFkZC1vbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgWHJheUFkb3RBZGRPblByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogTW9kZXMgc3VwcG9ydGVkIDogYGRlcGxveW1lbnRgLCBgZGFlbW9uc2V0YCwgYHN0YXRlZnVsU2V0YCwgYW5kIGBzaWRlY2FyYFxyXG4gICAgICogQGRlZmF1bHQgZGVwbG95bWVudFxyXG4gICAgICovXHJcbiAgICBkZXBsb3ltZW50TW9kZT86IHhyYXlEZXBsb3ltZW50TW9kZTtcclxuICAgIC8qKlxyXG4gICAgICogTmFtZXNwYWNlIHRvIGRlcGxveSB0aGUgQURPVCBDb2xsZWN0b3IgZm9yIFhSYXkuXHJcbiAgICAgKiBAZGVmYXVsdCBkZWZhdWx0XHJcbiAgICAgKi9cclxuICAgIG5hbWVzcGFjZT86IHN0cmluZztcclxuICAgIC8qKlxyXG4gICAgICogTmFtZSBmb3IgZGVwbG95bWVudCBvZiB0aGUgQURPVCBDb2xsZWN0b3IgZm9yIFhSYXkuXHJcbiAgICAgKiBAZGVmYXVsdCAnYWRvdC1jb2xsZWN0b3IteHJheSdcclxuICAgICAqL1xyXG4gICAgbmFtZT86IHN0cmluZztcclxufVxyXG5cclxuZXhwb3J0IGNvbnN0IGVudW0geHJheURlcGxveW1lbnRNb2RlIHtcclxuICAgIERFUExPWU1FTlQgPSAnZGVwbG95bWVudCcsXHJcbiAgICBEQUVNT05TRVQgPSAnZGFlbW9uc2V0JyxcclxuICAgIFNUQVRFRlVMU0VUID0gJ3N0YXRlZnVsc2V0JyxcclxuICAgIFNJREVDQVIgPSAnc2lkZWNhcidcclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHRzIG9wdGlvbnMgZm9yIHRoZSBhZGQtb25cclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIGRlcGxveW1lbnRNb2RlOiB4cmF5RGVwbG95bWVudE1vZGUuREVQTE9ZTUVOVCxcclxuICAgIG5hbWU6ICdhZG90LWNvbGxlY3Rvci14cmF5JyxcclxuICAgIG5hbWVzcGFjZTogJ2RlZmF1bHQnXHJcbn07XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50YXRpb24gb2YgWFJBWSBBRE9UIGFkZC1vbiBmb3IgRUtTIEJsdWVwcmludHMuIEluc3RhbGxzIEFET1QgQ29sbGVjdG9yLlxyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBYcmF5QWRvdEFkZE9uIGltcGxlbWVudHMgQ2x1c3RlckFkZE9uIHtcclxuXHJcbiAgICByZWFkb25seSB4cmF5QWRkT25Qcm9wczogWHJheUFkb3RBZGRPblByb3BzO1xyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBYcmF5QWRvdEFkZE9uUHJvcHMpIHtcclxuICAgICAgICB0aGlzLnhyYXlBZGRPblByb3BzID0geyAuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzIH07XHJcbiAgICB9XHJcblxyXG4gICAgQGRlcGVuZGFibGUoQWRvdENvbGxlY3RvckFkZE9uLm5hbWUpXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICBsZXQgZG9jOiBzdHJpbmc7XHJcblxyXG4gICAgICAgIC8vIEFwcGx5aW5nIG1hbmlmZXN0IGZvciBjb25maWd1cmluZyBBRE9UIENvbGxlY3RvciBmb3IgWHJheS5cclxuICAgICAgICBkb2MgPSByZWFkWWFtbERvY3VtZW50KF9fZGlybmFtZSArJy9jb2xsZWN0b3ItY29uZmlnLXhyYXkueXRwbCcpO1xyXG5cclxuICAgICAgICBjb25zdCBtYW5pZmVzdCA9IGRvYy5zcGxpdChcIi0tLVwiKS5tYXAoZSA9PiBsb2FkWWFtbChlKSk7XHJcbiAgICAgICAgY29uc3QgdmFsdWVzOiBWYWx1ZXMgPSB7XHJcbiAgICAgICAgICAgIGF3c1JlZ2lvbjogY2x1c3Rlci5zdGFjay5yZWdpb24sXHJcbiAgICAgICAgICAgIGRlcGxveW1lbnRNb2RlOiB0aGlzLnhyYXlBZGRPblByb3BzLmRlcGxveW1lbnRNb2RlLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IHRoaXMueHJheUFkZE9uUHJvcHMubmFtZXNwYWNlXHJcbiAgICAgICAgIH07XHJcbiAgICAgICAgIFxyXG4gICAgICAgICBjb25zdCBtYW5pZmVzdERlcGxveW1lbnQ6IE1hbmlmZXN0RGVwbG95bWVudCA9IHtcclxuICAgICAgICAgICAgbmFtZTogdGhpcy54cmF5QWRkT25Qcm9wcy5uYW1lISxcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiB0aGlzLnhyYXlBZGRPblByb3BzLm5hbWVzcGFjZSEsXHJcbiAgICAgICAgICAgIG1hbmlmZXN0LFxyXG4gICAgICAgICAgICB2YWx1ZXNcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBrdWJlY3RsUHJvdmlkZXIgPSBuZXcgS3ViZWN0bFByb3ZpZGVyKGNsdXN0ZXJJbmZvKTtcclxuICAgICAgICBjb25zdCBzdGF0ZW1lbnQgPSBrdWJlY3RsUHJvdmlkZXIuYWRkTWFuaWZlc3QobWFuaWZlc3REZXBsb3ltZW50KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHN0YXRlbWVudCk7XHJcbiAgICB9XHJcbn0iXX0=