"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IstioCniAddon = void 0;
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
const istio_base_1 = require("./istio-base");
const defaultProps = {
    name: 'istio-cni',
    release: 'cni',
    namespace: 'istio-system',
    chart: 'cni',
    version: istio_base_1.ISTIO_VERSION,
    repository: 'https://istio-release.storage.googleapis.com/charts',
    values: {},
    createNamespace: false
};
let IstioCniAddon = class IstioCniAddon extends helm_addon_1.HelmAddOn {
    constructor(props) {
        super({ ...defaultProps, ...props });
    }
    deploy(clusterInfo) {
        const chart = this.addHelmChart(clusterInfo, this.props.values);
        return Promise.resolve(chart);
    }
};
exports.IstioCniAddon = IstioCniAddon;
__decorate([
    (0, utils_1.dependable)('IstioBaseAddOn', 'IstioControlPlaneAddOn')
], IstioCniAddon.prototype, "deploy", null);
exports.IstioCniAddon = IstioCniAddon = __decorate([
    utils_1.supportsALL
], IstioCniAddon);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXN0aW8tY25pLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkZG9ucy9pc3Rpby1hZGRvbnMvaXN0aW8tY25pLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUVBLDhDQUE4RTtBQUM5RSx1Q0FBc0Q7QUFDdEQsNkNBQTZDO0FBWTdDLE1BQU0sWUFBWSxHQUF3QztJQUN0RCxJQUFJLEVBQUUsV0FBVztJQUNqQixPQUFPLEVBQUUsS0FBSztJQUNkLFNBQVMsRUFBRSxjQUFjO0lBQ3pCLEtBQUssRUFBRSxLQUFLO0lBQ1osT0FBTyxFQUFFLDBCQUFhO0lBQ3RCLFVBQVUsRUFBRSxxREFBcUQ7SUFDakUsTUFBTSxFQUFFLEVBQUU7SUFDVixlQUFlLEVBQUUsS0FBSztDQUN6QixDQUFDO0FBR0ssSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYyxTQUFRLHNCQUFTO0lBRXhDLFlBQVksS0FBMEI7UUFDbEMsS0FBSyxDQUFDLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDO0lBQ3pDLENBQUM7SUFHRCxNQUFNLENBQUMsV0FBd0I7UUFFM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUNoRSxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDbEMsQ0FBQztDQUNKLENBQUE7QUFaWSxzQ0FBYTtBQU90QjtJQURDLElBQUEsa0JBQVUsRUFBQyxnQkFBZ0IsRUFBQyx3QkFBd0IsQ0FBQzsyQ0FLckQ7d0JBWFEsYUFBYTtJQUR6QixtQkFBVztHQUNDLGFBQWEsQ0FZekIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uUHJvcHMsIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IGRlcGVuZGFibGUsIHN1cHBvcnRzQUxMIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5pbXBvcnQgeyBJU1RJT19WRVJTSU9OIH0gZnJvbSAnLi9pc3Rpby1iYXNlJztcclxuXHJcbi8qKlxyXG4gKiBVc2VyIHByb3ZpZGVkIG9wdGlvbiBmb3IgdGhlIEhlbG0gQ2hhcnRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgSXN0aW9DbmlBZGRvblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogVG8gQ3JlYXRlIE5hbWVzcGFjZSB1c2luZyBDREtcclxuICAgICAqLyAgICBcclxuICAgIGNyZWF0ZU5hbWVzcGFjZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wczogSGVsbUFkZE9uUHJvcHMgJiBJc3Rpb0NuaUFkZG9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiAnaXN0aW8tY25pJyxcclxuICAgIHJlbGVhc2U6ICdjbmknLFxyXG4gICAgbmFtZXNwYWNlOiAnaXN0aW8tc3lzdGVtJyxcclxuICAgIGNoYXJ0OiAnY25pJyxcclxuICAgIHZlcnNpb246IElTVElPX1ZFUlNJT04sXHJcbiAgICByZXBvc2l0b3J5OiAnaHR0cHM6Ly9pc3Rpby1yZWxlYXNlLnN0b3JhZ2UuZ29vZ2xlYXBpcy5jb20vY2hhcnRzJyxcclxuICAgIHZhbHVlczoge30sIFxyXG4gICAgY3JlYXRlTmFtZXNwYWNlOiBmYWxzZVxyXG59O1xyXG5cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBJc3Rpb0NuaUFkZG9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IElzdGlvQ25pQWRkb25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsgLi4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9KTtcclxuICAgIH1cclxuXHJcbiAgICBAZGVwZW5kYWJsZSgnSXN0aW9CYXNlQWRkT24nLCdJc3Rpb0NvbnRyb2xQbGFuZUFkZE9uJylcclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiB2b2lkIHwgUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICBcclxuICAgICAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB0aGlzLnByb3BzLnZhbHVlcyk7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgICB9XHJcbn0iXX0=