"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KNativeOperator = void 0;
const utils_1 = require("../../utils");
const kubectl_provider_1 = require("../helm-addon/kubectl-provider");
const defaultProps = {
    name: 'knative-operator',
    namespace: 'default',
    version: 'v1.8.1',
};
/**
 * Implementation of KNative add-on for EKS Blueprints. Installs KNative to the Cluster.
 */
let KNativeOperator = class KNativeOperator {
    knativeAddOnProps;
    constructor(props) {
        this.knativeAddOnProps = { ...defaultProps, ...props };
    }
    deploy(clusterInfo) {
        const BASE_URL = `https://github.com/knative/operator/releases/download/knative`;
        // Load External YAML: https://github.com/knative/operator/releases/download/knative-v1.8.1/operator.yaml
        const doc = (0, utils_1.loadExternalYaml)(BASE_URL + `-${this.knativeAddOnProps.version}/operator.yaml`).slice(0, 26); // the last element is null
        const kubectlProvider = new kubectl_provider_1.KubectlProvider(clusterInfo);
        const statement = kubectlProvider.addManifest({ manifest: doc, values: {}, name: 'knative-operator', namespace: this.knativeAddOnProps.namespace });
        return Promise.resolve(statement);
    }
};
exports.KNativeOperator = KNativeOperator;
__decorate([
    (0, utils_1.dependable)('IstioControlPlaneAddOn')
], KNativeOperator.prototype, "deploy", null);
exports.KNativeOperator = KNativeOperator = __decorate([
    utils_1.supportsALL
], KNativeOperator);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2tuYXRpdmUtb3BlcmF0b3IvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEsdUNBQXVFO0FBRXZFLHFFQUFpRTtBQXlCakUsTUFBTSxZQUFZLEdBQUc7SUFDakIsSUFBSSxFQUFFLGtCQUFrQjtJQUN4QixTQUFTLEVBQUUsU0FBUztJQUNwQixPQUFPLEVBQUUsUUFBUTtDQUNwQixDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLGVBQWUsR0FBckIsTUFBTSxlQUFlO0lBRWYsaUJBQWlCLENBQXVCO0lBRWpELFlBQVksS0FBNEI7UUFDcEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQztJQUMzRCxDQUFDO0lBR0QsTUFBTSxDQUFDLFdBQXdCO1FBQzNCLE1BQU0sUUFBUSxHQUFHLCtEQUErRCxDQUFDO1FBRWpGLHlHQUF5RztRQUN6RyxNQUFNLEdBQUcsR0FBRyxJQUFBLHdCQUFnQixFQUN4QixRQUFRLEdBQUcsSUFBSSxJQUFJLENBQUMsaUJBQWlCLENBQUMsT0FBTyxnQkFBZ0IsQ0FDaEUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsMkJBQTJCO1FBRTNDLE1BQU0sZUFBZSxHQUFHLElBQUksa0NBQWUsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUV6RCxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsV0FBVyxDQUN6QyxFQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsa0JBQWtCLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFVLEVBQUUsQ0FDeEcsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQ0osQ0FBQTtBQXpCWSwwQ0FBZTtBQVN4QjtJQURDLElBQUEsa0JBQVUsRUFBQyx3QkFBd0IsQ0FBQzs2Q0FnQnBDOzBCQXhCUSxlQUFlO0lBRDNCLG1CQUFXO0dBQ0MsZUFBZSxDQXlCM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgQ2x1c3RlckFkZE9uLCBDbHVzdGVySW5mbyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgZGVwZW5kYWJsZSwgbG9hZEV4dGVybmFsWWFtbCwgc3VwcG9ydHNBTEx9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tICcuLi9oZWxtLWFkZG9uJztcclxuaW1wb3J0IHsgS3ViZWN0bFByb3ZpZGVyIH0gZnJvbSBcIi4uL2hlbG0tYWRkb24va3ViZWN0bC1wcm92aWRlclwiO1xyXG5cclxuLyoqXHJcbiAqIEtuYXRpdmUgT3BlcmF0b3IgUHJvcGVydGllcyBleHRlbmRlZCBcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgS25hdGl2ZU9wZXJhdG9yUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbmFtZXNwYWNlIHRvIGluc3RhbGwgS25hdGl2ZSBpblxyXG4gICAgICogQGRlZmF1bHQgZGVmYXVsdFxyXG4gICAgICovXHJcbiAgICBuYW1lc3BhY2U/OiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbmFtZSB0byBiZSBhc3NpZ25lZCB0byBnaXZlbiB0byB0aGUgS25hdGl2ZSBvcGVyYXRvclxyXG4gICAgICogQGRlZmF1bHQga25hdGl2ZS1vcGVyYXRvclxyXG4gICAgICovXHJcbiAgICBuYW1lPzogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHZlcnNpb24gb2YgdGhlIEtOYXRpdmUgT3BlcmF0b3IgdG8gdXNlXHJcbiAgICAgKiBAZGVmYXVsdCB2MS44LjFcclxuICAgICAqL1xyXG4gICAgdmVyc2lvbj86IHN0cmluZztcclxufVxyXG5cclxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xyXG4gICAgbmFtZTogJ2tuYXRpdmUtb3BlcmF0b3InLFxyXG4gICAgbmFtZXNwYWNlOiAnZGVmYXVsdCcsXHJcbiAgICB2ZXJzaW9uOiAndjEuOC4xJyxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBLTmF0aXZlIGFkZC1vbiBmb3IgRUtTIEJsdWVwcmludHMuIEluc3RhbGxzIEtOYXRpdmUgdG8gdGhlIENsdXN0ZXIuXHJcbiAqL1xyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIEtOYXRpdmVPcGVyYXRvciBpbXBsZW1lbnRzIENsdXN0ZXJBZGRPbiB7XHJcblxyXG4gICAgcmVhZG9ubHkga25hdGl2ZUFkZE9uUHJvcHM6IEtuYXRpdmVPcGVyYXRvclByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogS25hdGl2ZU9wZXJhdG9yUHJvcHMpIHtcclxuICAgICAgICB0aGlzLmtuYXRpdmVBZGRPblByb3BzID0geyAuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzIH07XHJcbiAgICB9XHJcblxyXG4gICAgQGRlcGVuZGFibGUoJ0lzdGlvQ29udHJvbFBsYW5lQWRkT24nKVxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICAgICAgY29uc3QgQkFTRV9VUkwgPSBgaHR0cHM6Ly9naXRodWIuY29tL2tuYXRpdmUvb3BlcmF0b3IvcmVsZWFzZXMvZG93bmxvYWQva25hdGl2ZWA7XHJcblxyXG4gICAgICAgIC8vIExvYWQgRXh0ZXJuYWwgWUFNTDogaHR0cHM6Ly9naXRodWIuY29tL2tuYXRpdmUvb3BlcmF0b3IvcmVsZWFzZXMvZG93bmxvYWQva25hdGl2ZS12MS44LjEvb3BlcmF0b3IueWFtbFxyXG4gICAgICAgIGNvbnN0IGRvYyA9IGxvYWRFeHRlcm5hbFlhbWwoXHJcbiAgICAgICAgICAgIEJBU0VfVVJMICsgYC0ke3RoaXMua25hdGl2ZUFkZE9uUHJvcHMudmVyc2lvbn0vb3BlcmF0b3IueWFtbGBcclxuICAgICAgICApLnNsaWNlKDAsIDI2KTsgLy8gdGhlIGxhc3QgZWxlbWVudCBpcyBudWxsXHJcblxyXG4gICAgICAgIGNvbnN0IGt1YmVjdGxQcm92aWRlciA9IG5ldyBLdWJlY3RsUHJvdmlkZXIoY2x1c3RlckluZm8pO1xyXG5cclxuICAgICAgICBjb25zdCBzdGF0ZW1lbnQgPSBrdWJlY3RsUHJvdmlkZXIuYWRkTWFuaWZlc3QoXHJcbiAgICAgICAgICAgIHsgbWFuaWZlc3Q6IGRvYywgdmFsdWVzOiB7fSwgbmFtZTogJ2tuYXRpdmUtb3BlcmF0b3InLCBuYW1lc3BhY2U6IHRoaXMua25hdGl2ZUFkZE9uUHJvcHMubmFtZXNwYWNlISB9XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShzdGF0ZW1lbnQpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==