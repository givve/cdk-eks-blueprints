"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrafanaOperatorAddon = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: 'grafana-operator',
    chart: 'oci://ghcr.io/grafana/helm-charts/grafana-operator',
    namespace: 'grafana-operator',
    release: 'grafana-operator',
    version: 'v5.19.0',
    values: {},
    createNamespace: true
};
/**
 * Main class to instantiate the Helm chart
 */
let GrafanaOperatorAddon = class GrafanaOperatorAddon extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = this.options.values ?? {};
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
exports.GrafanaOperatorAddon = GrafanaOperatorAddon;
exports.GrafanaOperatorAddon = GrafanaOperatorAddon = __decorate([
    utils_1.supportsALL
], GrafanaOperatorAddon);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2dyYWZhbmEtb3BlcmF0b3IvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQ0EsK0NBQXFDO0FBRXJDLHVDQUEyRDtBQUMzRCw4Q0FBOEU7QUFXOUU7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBK0M7SUFDL0QsSUFBSSxFQUFFLGtCQUFrQjtJQUN4QixLQUFLLEVBQUUsb0RBQW9EO0lBQzNELFNBQVMsRUFBRSxrQkFBa0I7SUFDN0IsT0FBTyxFQUFFLGtCQUFrQjtJQUMzQixPQUFPLEVBQUUsU0FBUztJQUNsQixNQUFNLEVBQUUsRUFBRTtJQUNWLGVBQWUsRUFBRSxJQUFJO0NBQ3RCLENBQUM7QUFFRjs7R0FFRztBQUVJLElBQU0sb0JBQW9CLEdBQTFCLE1BQU0sb0JBQXFCLFNBQVEsc0JBQVM7SUFFeEMsT0FBTyxDQUE0QjtJQUU1QyxZQUFZLEtBQWlDO1FBQzNDLEtBQUssQ0FBQyxFQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFrQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFDN0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxJQUFJLE1BQU0sR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDL0MsTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFckQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUMsQ0FBQztZQUN4QywrQkFBK0I7WUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBVSxFQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQ3JFLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGLENBQUE7QUF0Qlksb0RBQW9COytCQUFwQixvQkFBb0I7SUFEaEMsbUJBQVc7R0FDQyxvQkFBb0IsQ0FzQmhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcInRzLWRlZXBtZXJnZVwiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UsIHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uUHJvcHMsIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbi8qKlxyXG4gKiBVc2VyIHByb3ZpZGVkIG9wdGlvbnMgZm9yIHRoZSBIZWxtIENoYXJ0XHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEdyYWZhbmFPcGVyYXRvckFkZG9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gIC8qKlxyXG4gICAqIFRvIENyZWF0ZSBOYW1lc3BhY2UgdXNpbmcgQ0RLXHJcbiAgICovICAgIFxyXG4gIGNyZWF0ZU5hbWVzcGFjZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHByb3BzIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzOiBIZWxtQWRkT25Qcm9wcyAmIEdyYWZhbmFPcGVyYXRvckFkZG9uUHJvcHMgPSB7XHJcbiAgbmFtZTogJ2dyYWZhbmEtb3BlcmF0b3InLFxyXG4gIGNoYXJ0OiAnb2NpOi8vZ2hjci5pby9ncmFmYW5hL2hlbG0tY2hhcnRzL2dyYWZhbmEtb3BlcmF0b3InLFxyXG4gIG5hbWVzcGFjZTogJ2dyYWZhbmEtb3BlcmF0b3InLFxyXG4gIHJlbGVhc2U6ICdncmFmYW5hLW9wZXJhdG9yJyxcclxuICB2ZXJzaW9uOiAndjUuMTkuMCcsXHJcbiAgdmFsdWVzOiB7fSwgXHJcbiAgY3JlYXRlTmFtZXNwYWNlOiB0cnVlXHJcbn07XHJcblxyXG4vKipcclxuICogTWFpbiBjbGFzcyB0byBpbnN0YW50aWF0ZSB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBHcmFmYW5hT3BlcmF0b3JBZGRvbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gIHJlYWRvbmx5IG9wdGlvbnM6IEdyYWZhbmFPcGVyYXRvckFkZG9uUHJvcHM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzPzogR3JhZmFuYU9wZXJhdG9yQWRkb25Qcm9wcykge1xyXG4gICAgc3VwZXIoey4uLmRlZmF1bHRQcm9wcywgLi4ucHJvcHN9KTtcclxuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgR3JhZmFuYU9wZXJhdG9yQWRkb25Qcm9wcztcclxuICB9XHJcblxyXG4gIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSB0aGlzLm9wdGlvbnMudmFsdWVzID8/IHt9O1xyXG4gICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcbiAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB2YWx1ZXMpO1xyXG5cclxuICAgIGlmKCB0aGlzLm9wdGlvbnMuY3JlYXRlTmFtZXNwYWNlID09IHRydWUpe1xyXG4gICAgICAvLyBMZXQgQ0RLIENyZWF0ZSB0aGUgTmFtZXNwYWNlXHJcbiAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IGNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISAsIGNsdXN0ZXIpO1xyXG4gICAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3kobmFtZXNwYWNlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gIH1cclxufVxyXG4iXX0=