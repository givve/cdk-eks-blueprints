"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsServerAddOn = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    chart: 'metrics-server',
    repository: 'https://kubernetes-sigs.github.io/metrics-server',
    version: '3.13.0',
    release: 'blueprints-addon-metrics-server',
    name: 'metrics-server',
    namespace: 'kube-system',
    createNamespace: false,
};
let MetricsServerAddOn = class MetricsServerAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = this.options ?? {};
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
exports.MetricsServerAddOn = MetricsServerAddOn;
exports.MetricsServerAddOn = MetricsServerAddOn = __decorate([
    utils_1.supportsALL
], MetricsServerAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL21ldHJpY3Mtc2VydmVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLCtDQUFxQztBQUVyQyw4Q0FBOEU7QUFDOUUsdUNBQTJEO0FBYTNEOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQTZDO0lBQzNELEtBQUssRUFBRSxnQkFBZ0I7SUFDdkIsVUFBVSxFQUFFLGtEQUFrRDtJQUM5RCxPQUFPLEVBQUUsUUFBUTtJQUNqQixPQUFPLEVBQUUsaUNBQWlDO0lBQzFDLElBQUksRUFBRSxnQkFBZ0I7SUFDdEIsU0FBUyxFQUFFLGFBQWE7SUFDeEIsZUFBZSxFQUFFLEtBQUs7Q0FDekIsQ0FBQztBQUdLLElBQU0sa0JBQWtCLEdBQXhCLE1BQU0sa0JBQW1CLFNBQVEsc0JBQVM7SUFDcEMsT0FBTyxDQUEwQjtJQUUxQyxZQUFZLEtBQStCO1FBQ3ZDLEtBQUssQ0FBQyxFQUFFLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNyQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFnQyxDQUFDO0lBQ3pELENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFDM0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxJQUFJLE1BQU0sR0FBVyxJQUFJLENBQUMsT0FBTyxJQUFJLEVBQUUsQ0FBQztRQUN4QyxNQUFNLEdBQUcsSUFBQSxvQkFBSyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUNoRCxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVyRCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ3ZDLCtCQUErQjtZQUMvQixNQUFNLFNBQVMsR0FBRyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFDcEUsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0NBQ0osQ0FBQTtBQXJCWSxnREFBa0I7NkJBQWxCLGtCQUFrQjtJQUQ5QixtQkFBVztHQUNDLGtCQUFrQixDQXFCOUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblByb3BzLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tICcuLi9oZWxtLWFkZG9uJztcclxuaW1wb3J0IHsgY3JlYXRlTmFtZXNwYWNlLCBzdXBwb3J0c0FMTCB9IGZyb20gJy4uLy4uL3V0aWxzJztcclxuXHJcbi8qKlxyXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIHRoZSBhZGQtb24uXHJcbiAqL1xyXG5cclxuZXhwb3J0IGludGVyZmFjZSBNZXRyaWNzU2VydmVyQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgICAvKipcclxuICAgICAqIFRvIENyZWF0ZSBOYW1lc3BhY2UgdXNpbmcgQ0RLXHJcbiAgICAgKi9cclxuICAgIGNyZWF0ZU5hbWVzcGFjZT86IGJvb2xlYW47XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0cyBvcHRpb25zIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHM6IEhlbG1BZGRPblByb3BzICYgTWV0cmljc1NlcnZlckFkZE9uUHJvcHMgPSB7XHJcbiAgICBjaGFydDogJ21ldHJpY3Mtc2VydmVyJyxcclxuICAgIHJlcG9zaXRvcnk6ICdodHRwczovL2t1YmVybmV0ZXMtc2lncy5naXRodWIuaW8vbWV0cmljcy1zZXJ2ZXInLFxyXG4gICAgdmVyc2lvbjogJzMuMTMuMCcsXHJcbiAgICByZWxlYXNlOiAnYmx1ZXByaW50cy1hZGRvbi1tZXRyaWNzLXNlcnZlcicsXHJcbiAgICBuYW1lOiAnbWV0cmljcy1zZXJ2ZXInLFxyXG4gICAgbmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxyXG4gICAgY3JlYXRlTmFtZXNwYWNlOiBmYWxzZSxcclxufTtcclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgTWV0cmljc1NlcnZlckFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuICAgIHJlYWRvbmx5IG9wdGlvbnM6IE1ldHJpY3NTZXJ2ZXJBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogTWV0cmljc1NlcnZlckFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7IC4uLmRlZmF1bHRQcm9wcywgLi4ucHJvcHMgfSk7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcyBhcyBNZXRyaWNzU2VydmVyQWRkT25Qcm9wcztcclxuICAgIH1cclxuXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSB0aGlzLm9wdGlvbnMgPz8ge307XHJcbiAgICAgICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcbiAgICAgICAgY29uc3QgY2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzKTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jcmVhdGVOYW1lc3BhY2UgPT0gdHJ1ZSkge1xyXG4gICAgICAgICAgICAvLyBMZXQgQ0RLIENyZWF0ZSB0aGUgTmFtZXNwYWNlXHJcbiAgICAgICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IGNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISwgY2x1c3Rlcik7XHJcbiAgICAgICAgICAgIGNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShuYW1lc3BhY2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNoYXJ0KTtcclxuICAgIH1cclxufVxyXG4iXX0=