"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpaGatekeeperAddOn = void 0;
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Defaults options for the gatekeeper add-on
 */
const defaultProps = {
    name: 'gatekeeper',
    release: 'blueprints-addon-opa-gatekeeper',
    namespace: 'gatekeeper-system',
    chart: 'gatekeeper',
    repository: "https://open-policy-agent.github.io/gatekeeper/charts",
    version: '3.20.1'
};
let OpaGatekeeperAddOn = class OpaGatekeeperAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(_clusterInfo) {
        return;
    }
    postDeploy(clusterInfo, _teams) {
        const chart = this.addHelmChart(clusterInfo, this.props.values ?? {});
        for (let provisioned of clusterInfo.getAllProvisionedAddons().values()) {
            chart.node.addDependency(provisioned);
        }
    }
};
exports.OpaGatekeeperAddOn = OpaGatekeeperAddOn;
exports.OpaGatekeeperAddOn = OpaGatekeeperAddOn = __decorate([
    utils_1.supportsALL
], OpaGatekeeperAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL29wYS1nYXRla2VlcGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLHVDQUEwQztBQUMxQyw4Q0FBOEU7QUFVOUU7O0dBRUc7QUFFSCxNQUFNLFlBQVksR0FBbUI7SUFDakMsSUFBSSxFQUFFLFlBQVk7SUFDbEIsT0FBTyxFQUFFLGlDQUFpQztJQUMxQyxTQUFTLEVBQUUsbUJBQW1CO0lBQzlCLEtBQUssRUFBRSxZQUFZO0lBQ25CLFVBQVUsRUFBRSx1REFBdUQ7SUFDbkUsT0FBTyxFQUFFLFFBQVE7Q0FDcEIsQ0FBQztBQUdLLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVM7SUFFckMsT0FBTyxDQUEwQjtJQUV6QyxZQUFZLEtBQStCO1FBQ3ZDLEtBQUssQ0FBQyxFQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVELE1BQU0sQ0FBQyxZQUF5QjtRQUM1QixPQUFPO0lBQ1gsQ0FBQztJQUVELFVBQVUsQ0FBQyxXQUF3QixFQUFFLE1BQWM7UUFFL0MsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFFdEUsS0FBSyxJQUFJLFdBQVcsSUFBSSxXQUFXLENBQUMsdUJBQXVCLEVBQUUsQ0FBQyxNQUFNLEVBQUUsRUFBRSxDQUFDO1lBQ3JFLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzFDLENBQUM7SUFDTCxDQUFDO0NBRUosQ0FBQTtBQXRCWSxnREFBa0I7NkJBQWxCLGtCQUFrQjtJQUQ5QixtQkFBVztHQUNDLGtCQUFrQixDQXNCOUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDbHVzdGVySW5mbywgQ2x1c3RlclBvc3REZXBsb3ksIFRlYW0gfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uUHJvcHMsIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcblxyXG4vKipcclxuICogUHJvcGVydGllcyBhdmFpbGFibGUgdG8gY29uZmlndXJlIG9wYSBnYXRla2VlcGVyLlxyXG4gKiBuYW1lc3BhY2UgZGVmYXVsdCBpcyBnYXRla2VlcGVyLXN5c3RlbVxyXG4gKiB2ZXJzaW9uIGRlZmF1bHQgaXMgMy4yMC4xXHJcbiAqIHZhbHVlcyBhcyBwZXIgaHR0cHM6Ly9naXRodWIuY29tL29wZW4tcG9saWN5LWFnZW50L2dhdGVrZWVwZXIvdHJlZS9tYXN0ZXIvY2hhcnRzL2dhdGVrZWVwZXJcclxuICovXHJcbmV4cG9ydCB0eXBlIE9wYUdhdGVrZWVwZXJBZGRPblByb3BzID0gSGVsbUFkZE9uVXNlclByb3BzO1xyXG5cclxuLyoqXHJcbiAqIERlZmF1bHRzIG9wdGlvbnMgZm9yIHRoZSBnYXRla2VlcGVyIGFkZC1vblxyXG4gKi9cclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wczogSGVsbUFkZE9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiAnZ2F0ZWtlZXBlcicsXHJcbiAgICByZWxlYXNlOiAnYmx1ZXByaW50cy1hZGRvbi1vcGEtZ2F0ZWtlZXBlcicsXHJcbiAgICBuYW1lc3BhY2U6ICdnYXRla2VlcGVyLXN5c3RlbScsXHJcbiAgICBjaGFydDogJ2dhdGVrZWVwZXInLFxyXG4gICAgcmVwb3NpdG9yeTogXCJodHRwczovL29wZW4tcG9saWN5LWFnZW50LmdpdGh1Yi5pby9nYXRla2VlcGVyL2NoYXJ0c1wiLFxyXG4gICAgdmVyc2lvbjogJzMuMjAuMSdcclxufTtcclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgT3BhR2F0ZWtlZXBlckFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIGltcGxlbWVudHMgQ2x1c3RlclBvc3REZXBsb3kge1xyXG5cclxuICAgIHByaXZhdGUgb3B0aW9uczogT3BhR2F0ZWtlZXBlckFkZE9uUHJvcHM7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBPcGFHYXRla2VlcGVyQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzfSk7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcztcclxuICAgIH1cclxuXHJcbiAgICBkZXBsb3koX2NsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQge1xyXG4gICAgICAgIHJldHVybjtcclxuICAgIH1cclxuXHJcbiAgICBwb3N0RGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbywgX3RlYW1zOiBUZWFtW10pOiB2b2lkIHtcclxuXHJcbiAgICAgICAgY29uc3QgY2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdGhpcy5wcm9wcy52YWx1ZXMgPz8ge30pO1xyXG4gICAgICAgIFxyXG4gICAgICAgIGZvciAobGV0IHByb3Zpc2lvbmVkIG9mIGNsdXN0ZXJJbmZvLmdldEFsbFByb3Zpc2lvbmVkQWRkb25zKCkudmFsdWVzKCkpIHtcclxuICAgICAgICAgICAgY2hhcnQubm9kZS5hZGREZXBlbmRlbmN5KHByb3Zpc2lvbmVkKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG4iXX0=