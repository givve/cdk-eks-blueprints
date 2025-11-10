"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IstioIngressGatewayAddon = void 0;
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
const istio_base_1 = require("./istio-base");
const defaultProps = {
    name: 'istio-ingressgateway',
    release: 'ingressgateway',
    namespace: 'istio-system',
    chart: 'gateway',
    version: istio_base_1.ISTIO_VERSION,
    repository: 'https://istio-release.storage.googleapis.com/charts',
    values: {},
    createNamespace: false
};
let IstioIngressGatewayAddon = class IstioIngressGatewayAddon extends helm_addon_1.HelmAddOn {
    constructor(props) {
        super({ ...defaultProps, ...props });
    }
    deploy(clusterInfo) {
        const chart = this.addHelmChart(clusterInfo, this.props.values);
        return Promise.resolve(chart);
    }
};
exports.IstioIngressGatewayAddon = IstioIngressGatewayAddon;
__decorate([
    (0, utils_1.dependable)('IstioBaseAddOn', 'IstioControlPlaneAddOn')
], IstioIngressGatewayAddon.prototype, "deploy", null);
exports.IstioIngressGatewayAddon = IstioIngressGatewayAddon = __decorate([
    utils_1.supportsALL
], IstioIngressGatewayAddon);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXN0aW8taW5ncmVzcy1nYXRld2F5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkZG9ucy9pc3Rpby1hZGRvbnMvaXN0aW8taW5ncmVzcy1nYXRld2F5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUVBLDhDQUE4RTtBQUM5RSx1Q0FBc0Q7QUFDdEQsNkNBQTZDO0FBWTdDLE1BQU0sWUFBWSxHQUFtRDtJQUNqRSxJQUFJLEVBQUUsc0JBQXNCO0lBQzVCLE9BQU8sRUFBRSxnQkFBZ0I7SUFDekIsU0FBUyxFQUFFLGNBQWM7SUFDekIsS0FBSyxFQUFFLFNBQVM7SUFDaEIsT0FBTyxFQUFFLDBCQUFhO0lBQ3RCLFVBQVUsRUFBRSxxREFBcUQ7SUFDakUsTUFBTSxFQUFFLEVBQUU7SUFDVixlQUFlLEVBQUUsS0FBSztDQUN6QixDQUFDO0FBR0ssSUFBTSx3QkFBd0IsR0FBOUIsTUFBTSx3QkFBeUIsU0FBUSxzQkFBUztJQUVuRCxZQUFZLEtBQXFDO1FBQzdDLEtBQUssQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN6QyxDQUFDO0lBR0QsTUFBTSxDQUFDLFdBQXdCO1FBRTNCLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDaEUsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Q0FDSixDQUFBO0FBWlksNERBQXdCO0FBT2pDO0lBREMsSUFBQSxrQkFBVSxFQUFDLGdCQUFnQixFQUFDLHdCQUF3QixDQUFDO3NEQUtyRDttQ0FYUSx3QkFBd0I7SUFEcEMsbUJBQVc7R0FDQyx3QkFBd0IsQ0FZcEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uUHJvcHMsIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IGRlcGVuZGFibGUsIHN1cHBvcnRzQUxMIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5pbXBvcnQgeyBJU1RJT19WRVJTSU9OIH0gZnJvbSAnLi9pc3Rpby1iYXNlJztcclxuXHJcbi8qKlxyXG4gKiBVc2VyIHByb3ZpZGVkIG9wdGlvbiBmb3IgdGhlIEhlbG0gQ2hhcnRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXN0aW9JbmdyZXNzR2F0ZXdheUFkZG9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUbyBDcmVhdGUgTmFtZXNwYWNlIHVzaW5nIENES1xyXG4gICAgICovICAgIFxyXG4gICAgY3JlYXRlTmFtZXNwYWNlPzogYm9vbGVhbjtcclxufVxyXG5cclxuY29uc3QgZGVmYXVsdFByb3BzOiBIZWxtQWRkT25Qcm9wcyAmIElzdGlvSW5ncmVzc0dhdGV3YXlBZGRvblByb3BzID0ge1xyXG4gICAgbmFtZTogJ2lzdGlvLWluZ3Jlc3NnYXRld2F5JyxcclxuICAgIHJlbGVhc2U6ICdpbmdyZXNzZ2F0ZXdheScsXHJcbiAgICBuYW1lc3BhY2U6ICdpc3Rpby1zeXN0ZW0nLFxyXG4gICAgY2hhcnQ6ICdnYXRld2F5JyxcclxuICAgIHZlcnNpb246IElTVElPX1ZFUlNJT04sXHJcbiAgICByZXBvc2l0b3J5OiAnaHR0cHM6Ly9pc3Rpby1yZWxlYXNlLnN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vY2hhcnRzJyxcclxuICAgIHZhbHVlczoge30sXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U6IGZhbHNlXHJcbn07XHJcblxyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIElzdGlvSW5ncmVzc0dhdGV3YXlBZGRvbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBJc3Rpb0luZ3Jlc3NHYXRld2F5QWRkb25Qcm9wcykgeyBcclxuICAgICAgICBzdXBlcih7IC4uLmRlZmF1bHRQcm9wcywgLi4ucHJvcHMgfSk7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIEBkZXBlbmRhYmxlKCdJc3Rpb0Jhc2VBZGRPbicsJ0lzdGlvQ29udHJvbFBsYW5lQWRkT24nKVxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQgfCBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG5cclxuICAgICAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB0aGlzLnByb3BzLnZhbHVlcyk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgICB9XHJcbn0iXX0=