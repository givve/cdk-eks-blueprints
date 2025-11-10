"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsForFluentBitAddOn = void 0;
const helm_addon_1 = require("../helm-addon");
const namespace_utils_1 = require("../../utils/namespace-utils");
const utils_1 = require("../../utils");
/**
 * Default props for the add-on.
 */
const defaultProps = {
    name: 'fluent-bit',
    chart: 'aws-for-fluent-bit',
    release: "blueprints-addon-aws-for-fluent-bit",
    version: '0.1.35',
    repository: 'https://aws.github.io/eks-charts',
    namespace: 'kube-system',
    createNamespace: false,
    values: {}
};
/**
 * AwsForFluentBitAddOn deploys FluentBit into an EKS cluster using the `aws-for-fluent-bit` Helm chart.
 * https://github.com/aws/eks-charts/tree/master/stable/aws-for-fluent-bit
 *
 * For information on how to configure the `aws-for-fluent-bit` Helm chart to forward logs and metrics to AWS services like CloudWatch or Kinesis, please view the values.yaml spec provided by the chart.
 * https://github.com/aws/eks-charts/blob/master/stable/aws-for-fluent-bit/values.yaml
 */
let AwsForFluentBitAddOn = class AwsForFluentBitAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const namespace = this.options.namespace;
        // Create the FluentBut service account.
        const serviceAccountName = 'aws-for-fluent-bit-sa';
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: namespace
        });
        // Create namespace
        if (this.options.createNamespace) {
            const ns = (0, namespace_utils_1.createNamespace)(namespace, cluster, true);
            sa.node.addDependency(ns);
        }
        // Apply additional IAM policies to the service account.
        const policies = this.options.iamPolicies || [];
        policies.forEach((policy) => sa.addToPrincipalPolicy(policy));
        // Configure values.
        const values = {
            serviceAccount: {
                name: serviceAccountName,
                create: false
            },
            ...this.options.values
        };
        const helmChart = this.addHelmChart(clusterInfo, values);
        helmChart.node.addDependency(sa);
        return Promise.resolve(helmChart);
    }
};
exports.AwsForFluentBitAddOn = AwsForFluentBitAddOn;
exports.AwsForFluentBitAddOn = AwsForFluentBitAddOn = __decorate([
    utils_1.supportsALL
], AwsForFluentBitAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2F3cy1mb3ItZmx1ZW50LWJpdC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQSw4Q0FBOEQ7QUFFOUQsaUVBQThEO0FBQzlELHVDQUEwQztBQWdCMUM7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBOEI7SUFDNUMsSUFBSSxFQUFFLFlBQVk7SUFDbEIsS0FBSyxFQUFFLG9CQUFvQjtJQUMzQixPQUFPLEVBQUUscUNBQXFDO0lBQzlDLE9BQU8sRUFBRSxRQUFRO0lBQ2pCLFVBQVUsRUFBRSxrQ0FBa0M7SUFDOUMsU0FBUyxFQUFFLGFBQWE7SUFDeEIsZUFBZSxFQUFFLEtBQUs7SUFDdEIsTUFBTSxFQUFFLEVBQUU7Q0FDYixDQUFDO0FBRUY7Ozs7OztHQU1HO0FBRUksSUFBTSxvQkFBb0IsR0FBMUIsTUFBTSxvQkFBcUIsU0FBUSxzQkFBUztJQUV0QyxPQUFPLENBQTRCO0lBRTVDLFlBQVksS0FBaUM7UUFDekMsS0FBSyxDQUFDLEVBQUUsR0FBRyxZQUFtQixFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUM1QyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBVSxDQUFDO1FBRTFDLHdDQUF3QztRQUN4QyxNQUFNLGtCQUFrQixHQUFHLHVCQUF1QixDQUFDO1FBQ25ELE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxrQkFBa0IsRUFBRTtZQUNyRCxJQUFJLEVBQUUsa0JBQWtCO1lBQ3hCLFNBQVMsRUFBRSxTQUFTO1NBQ3ZCLENBQUMsQ0FBQztRQUVILG1CQUFtQjtRQUNuQixJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLENBQUM7WUFDL0IsTUFBTSxFQUFFLEdBQUcsSUFBQSxpQ0FBZSxFQUFDLFNBQVMsRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDckQsRUFBRSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDOUIsQ0FBQztRQUVELHdEQUF3RDtRQUN4RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFdBQVcsSUFBSSxFQUFFLENBQUM7UUFDaEQsUUFBUSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQXVCLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO1FBRS9FLG9CQUFvQjtRQUNwQixNQUFNLE1BQU0sR0FBRztZQUNYLGNBQWMsRUFBRTtnQkFDWixJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixNQUFNLEVBQUUsS0FBSzthQUNoQjtZQUNELEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO1NBQ3pCLENBQUM7UUFFRixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUN6RCxTQUFTLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUNqQyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDdEMsQ0FBQztDQUNKLENBQUE7QUEzQ1ksb0RBQW9COytCQUFwQixvQkFBb0I7SUFEaEMsbUJBQVc7R0FDQyxvQkFBb0IsQ0EyQ2hDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgUG9saWN5U3RhdGVtZW50IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcblxyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaS90eXBlc1wiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UgfSBmcm9tIFwiLi4vLi4vdXRpbHMvbmFtZXNwYWNlLXV0aWxzXCI7XHJcbmltcG9ydCB7IHN1cHBvcnRzQUxMIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5cclxuLyoqXHJcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEZsdWVudEJpdCBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEF3c0ZvckZsdWVudEJpdEFkZE9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBJYW0gcG9saWNpZXMgZm9yIHRoZSBhZGQtb24uXHJcbiAgICAgKi9cclxuICAgIGlhbVBvbGljaWVzPzogUG9saWN5U3RhdGVtZW50W10sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGUgTmFtZXNwYWNlIHdpdGggdGhlIHByb3ZpZGVkIG9uZSAod2lsbCBub3QgaWYgbmFtZXNwYWNlIGlzIGt1YmUtc3lzdGVtKVxyXG4gICAgICovXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuXHJcbn1cclxuLyoqXHJcbiAqIERlZmF1bHQgcHJvcHMgZm9yIHRoZSBhZGQtb24uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHM6IEF3c0ZvckZsdWVudEJpdEFkZE9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiAnZmx1ZW50LWJpdCcsXHJcbiAgICBjaGFydDogJ2F3cy1mb3ItZmx1ZW50LWJpdCcsXHJcbiAgICByZWxlYXNlOiBcImJsdWVwcmludHMtYWRkb24tYXdzLWZvci1mbHVlbnQtYml0XCIsXHJcbiAgICB2ZXJzaW9uOiAnMC4xLjM1JyxcclxuICAgIHJlcG9zaXRvcnk6ICdodHRwczovL2F3cy5naXRodWIuaW8vZWtzLWNoYXJ0cycsXHJcbiAgICBuYW1lc3BhY2U6ICdrdWJlLXN5c3RlbScsXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U6IGZhbHNlLFxyXG4gICAgdmFsdWVzOiB7fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEF3c0ZvckZsdWVudEJpdEFkZE9uIGRlcGxveXMgRmx1ZW50Qml0IGludG8gYW4gRUtTIGNsdXN0ZXIgdXNpbmcgdGhlIGBhd3MtZm9yLWZsdWVudC1iaXRgIEhlbG0gY2hhcnQuXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MvZWtzLWNoYXJ0cy90cmVlL21hc3Rlci9zdGFibGUvYXdzLWZvci1mbHVlbnQtYml0XHJcbiAqIFxyXG4gKiBGb3IgaW5mb3JtYXRpb24gb24gaG93IHRvIGNvbmZpZ3VyZSB0aGUgYGF3cy1mb3ItZmx1ZW50LWJpdGAgSGVsbSBjaGFydCB0byBmb3J3YXJkIGxvZ3MgYW5kIG1ldHJpY3MgdG8gQVdTIHNlcnZpY2VzIGxpa2UgQ2xvdWRXYXRjaCBvciBLaW5lc2lzLCBwbGVhc2UgdmlldyB0aGUgdmFsdWVzLnlhbWwgc3BlYyBwcm92aWRlZCBieSB0aGUgY2hhcnQuXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MvZWtzLWNoYXJ0cy9ibG9iL21hc3Rlci9zdGFibGUvYXdzLWZvci1mbHVlbnQtYml0L3ZhbHVlcy55YW1sXHJcbiAqL1xyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIEF3c0ZvckZsdWVudEJpdEFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgICByZWFkb25seSBvcHRpb25zOiBBd3NGb3JGbHVlbnRCaXRBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQXdzRm9yRmx1ZW50Qml0QWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsgLi4uZGVmYXVsdFByb3BzIGFzIGFueSwgLi4ucHJvcHMgfSk7XHJcbiAgICAgICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcztcclxuICAgIH1cclxuXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICBjb25zdCBuYW1lc3BhY2UgPSB0aGlzLm9wdGlvbnMubmFtZXNwYWNlITtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBGbHVlbnRCdXQgc2VydmljZSBhY2NvdW50LlxyXG4gICAgICAgIGNvbnN0IHNlcnZpY2VBY2NvdW50TmFtZSA9ICdhd3MtZm9yLWZsdWVudC1iaXQtc2EnO1xyXG4gICAgICAgIGNvbnN0IHNhID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudChzZXJ2aWNlQWNjb3VudE5hbWUsIHtcclxuICAgICAgICAgICAgbmFtZTogc2VydmljZUFjY291bnROYW1lLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IG5hbWVzcGFjZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgbmFtZXNwYWNlXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5jcmVhdGVOYW1lc3BhY2UpIHtcclxuICAgICAgICAgICAgY29uc3QgbnMgPSBjcmVhdGVOYW1lc3BhY2UobmFtZXNwYWNlLCBjbHVzdGVyLCB0cnVlKTtcclxuICAgICAgICAgICAgc2Eubm9kZS5hZGREZXBlbmRlbmN5KG5zKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIEFwcGx5IGFkZGl0aW9uYWwgSUFNIHBvbGljaWVzIHRvIHRoZSBzZXJ2aWNlIGFjY291bnQuXHJcbiAgICAgICAgY29uc3QgcG9saWNpZXMgPSB0aGlzLm9wdGlvbnMuaWFtUG9saWNpZXMgfHwgW107XHJcbiAgICAgICAgcG9saWNpZXMuZm9yRWFjaCgocG9saWN5OiBQb2xpY3lTdGF0ZW1lbnQpID0+IHNhLmFkZFRvUHJpbmNpcGFsUG9saWN5KHBvbGljeSkpO1xyXG5cclxuICAgICAgICAvLyBDb25maWd1cmUgdmFsdWVzLlxyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHtcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnQ6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHNlcnZpY2VBY2NvdW50TmFtZSxcclxuICAgICAgICAgICAgICAgIGNyZWF0ZTogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgLi4udGhpcy5vcHRpb25zLnZhbHVlc1xyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IGhlbG1DaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB2YWx1ZXMpO1xyXG4gICAgICAgIGhlbG1DaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaGVsbUNoYXJ0KTtcclxuICAgIH1cclxufVxyXG4iXX0=