"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalsSecretsAddOn = void 0;
const utils_1 = require("../../utils");
const iam = require("aws-cdk-lib/aws-iam");
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
const aws_cdk_lib_1 = require("aws-cdk-lib");
/**
 * Default props for the add-on.
 */
const defaultProps = {
    name: "external-secrets",
    chart: "external-secrets",
    release: "blueprints-addon-external-secrets",
    version: "0.19.2",
    repository: "https://charts.external-secrets.io",
    namespace: "external-secrets",
    values: {},
};
/**
 * Default iam policy
 */
const defaultIamPolicy = new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    actions: [
        "secretsmanager:GetResourcePolicy",
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:ListSecretVersionIds",
        "secretsmanager:ListSecrets",
        "ssm:DescribeParameters",
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath",
        "ssm:GetParameterHistory",
        "kms:Decrypt"
    ],
    resources: ["*"],
});
/**
 * ExternalsSecretsAddOn deploys ExternalsSecrets into an EKS cluster using the `external-secrets` Helm chart.
 * https://github.com/external-secrets/external-secrets/
 *
 * For information on how to configure the `external-secrets` Helm chart, please view the values.yaml spec provided by the chart.
 * https://github.com/external-secrets/external-secrets/blob/main/deploy/charts/external-secrets/values.yaml
 */
let ExternalsSecretsAddOn = class ExternalsSecretsAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        // Create the ExternalsSecrets namespace.
        const namespace = this.options.namespace;
        const ns = (0, utils_1.createNamespace)(this.options.namespace, cluster, true);
        // Create the ExternalsSecrets service account.
        const serviceAccountName = "external-secrets-sa";
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: namespace,
        });
        sa.node.addDependency(ns);
        // Apply additional IAM policies to the service account.
        const policies = this.options.iamPolicies || [defaultIamPolicy];
        policies.forEach((policy) => sa.addToPrincipalPolicy(policy));
        // Configure values.
        let values = {
            serviceAccount: {
                name: serviceAccountName,
                create: false,
            },
            ...this.options.values,
        };
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const helmChart = this.addHelmChart(clusterInfo, values, false, true, aws_cdk_lib_1.Duration.minutes(15));
        helmChart.node.addDependency(sa);
        return Promise.resolve(helmChart);
    }
};
exports.ExternalsSecretsAddOn = ExternalsSecretsAddOn;
exports.ExternalsSecretsAddOn = ExternalsSecretsAddOn = __decorate([
    utils_1.supportsALL
], ExternalsSecretsAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2V4dGVybmFsLXNlY3JldHMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsdUNBQTJEO0FBQzNELDJDQUEyQztBQUMzQywrQ0FBcUM7QUFHckMsOENBQThEO0FBQzlELDZDQUF1QztBQVl2Qzs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUErQjtJQUMvQyxJQUFJLEVBQUUsa0JBQWtCO0lBQ3hCLEtBQUssRUFBRSxrQkFBa0I7SUFDekIsT0FBTyxFQUFFLG1DQUFtQztJQUM1QyxPQUFPLEVBQUUsUUFBUTtJQUNqQixVQUFVLEVBQUUsb0NBQW9DO0lBQ2hELFNBQVMsRUFBRSxrQkFBa0I7SUFDN0IsTUFBTSxFQUFFLEVBQUU7Q0FDWCxDQUFDO0FBRUY7O0dBRUc7QUFDSCxNQUFNLGdCQUFnQixHQUF3QixJQUFJLEdBQUcsQ0FBQyxlQUFlLENBQUM7SUFDcEUsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztJQUN4QixPQUFPLEVBQUU7UUFDUCxrQ0FBa0M7UUFDbEMsK0JBQStCO1FBQy9CLCtCQUErQjtRQUMvQixxQ0FBcUM7UUFDckMsNEJBQTRCO1FBQzVCLHdCQUF3QjtRQUN4QixrQkFBa0I7UUFDbEIsbUJBQW1CO1FBQ25CLHlCQUF5QjtRQUN6Qix5QkFBeUI7UUFDekIsYUFBYTtLQUNkO0lBQ0QsU0FBUyxFQUFFLENBQUMsR0FBRyxDQUFDO0NBQ2pCLENBQUMsQ0FBQztBQUVIOzs7Ozs7R0FNRztBQUVJLElBQU0scUJBQXFCLEdBQTNCLE1BQU0scUJBQXNCLFNBQVEsc0JBQVM7SUFDekMsT0FBTyxDQUE2QjtJQUU3QyxZQUFZLEtBQWtDO1FBQzVDLEtBQUssQ0FBQyxFQUFFLEdBQUksWUFBb0IsRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDOUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQzVCLENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFDN0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUVwQyx5Q0FBeUM7UUFDekMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUM7UUFDekMsTUFBTSxFQUFFLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBVSxFQUFFLE9BQU8sRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVuRSwrQ0FBK0M7UUFDL0MsTUFBTSxrQkFBa0IsR0FBRyxxQkFBcUIsQ0FBQztRQUNqRCxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLEVBQUU7WUFDdkQsSUFBSSxFQUFFLGtCQUFrQjtZQUN4QixTQUFTLEVBQUUsU0FBUztTQUNyQixDQUFDLENBQUM7UUFDSCxFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUUxQix3REFBd0Q7UUFDeEQsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO1FBQ2hFLFFBQVEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxNQUEyQixFQUFFLEVBQUUsQ0FDL0MsRUFBRSxDQUFDLG9CQUFvQixDQUFDLE1BQU0sQ0FBQyxDQUNoQyxDQUFDO1FBRUYsb0JBQW9CO1FBQ3BCLElBQUksTUFBTSxHQUFZO1lBQ3BCLGNBQWMsRUFBRTtnQkFDZCxJQUFJLEVBQUUsa0JBQWtCO2dCQUN4QixNQUFNLEVBQUUsS0FBSzthQUNkO1lBQ0QsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU07U0FDdkIsQ0FBQztRQUVGLE1BQU0sR0FBRyxJQUFBLG9CQUFLLEVBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBRWhELE1BQU0sU0FBUyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLHNCQUFRLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDNUYsU0FBUyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFFakMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ3BDLENBQUM7Q0FDRixDQUFBO0FBN0NZLHNEQUFxQjtnQ0FBckIscUJBQXFCO0lBRGpDLG1CQUFXO0dBQ0MscUJBQXFCLENBNkNqQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZU5hbWVzcGFjZSwgc3VwcG9ydHNBTEwgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcInRzLWRlZXBtZXJnZVwiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IER1cmF0aW9uIH0gZnJvbSBcImF3cy1jZGstbGliXCI7XHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgRXh0ZXJuYWxzU2VjcmV0cyBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVybmFsc1NlY3JldHNBZGRPblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAvKipcclxuICAgKiBJYW0gcG9saWNpZXMgZm9yIHRoZSBhZGQtb24uXHJcbiAgICovXHJcbiAgaWFtUG9saWNpZXM/OiBpYW0uUG9saWN5U3RhdGVtZW50W107XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHByb3BzIGZvciB0aGUgYWRkLW9uLlxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzOiBFeHRlcm5hbHNTZWNyZXRzQWRkT25Qcm9wcyA9IHtcclxuICBuYW1lOiBcImV4dGVybmFsLXNlY3JldHNcIixcclxuICBjaGFydDogXCJleHRlcm5hbC1zZWNyZXRzXCIsXHJcbiAgcmVsZWFzZTogXCJibHVlcHJpbnRzLWFkZG9uLWV4dGVybmFsLXNlY3JldHNcIixcclxuICB2ZXJzaW9uOiBcIjAuMTkuMlwiLFxyXG4gIHJlcG9zaXRvcnk6IFwiaHR0cHM6Ly9jaGFydHMuZXh0ZXJuYWwtc2VjcmV0cy5pb1wiLFxyXG4gIG5hbWVzcGFjZTogXCJleHRlcm5hbC1zZWNyZXRzXCIsXHJcbiAgdmFsdWVzOiB7fSxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IGlhbSBwb2xpY3lcclxuICovXHJcbmNvbnN0IGRlZmF1bHRJYW1Qb2xpY3k6IGlhbS5Qb2xpY3lTdGF0ZW1lbnQgPSBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gIGFjdGlvbnM6IFtcclxuICAgIFwic2VjcmV0c21hbmFnZXI6R2V0UmVzb3VyY2VQb2xpY3lcIixcclxuICAgIFwic2VjcmV0c21hbmFnZXI6R2V0U2VjcmV0VmFsdWVcIixcclxuICAgIFwic2VjcmV0c21hbmFnZXI6RGVzY3JpYmVTZWNyZXRcIixcclxuICAgIFwic2VjcmV0c21hbmFnZXI6TGlzdFNlY3JldFZlcnNpb25JZHNcIixcclxuICAgIFwic2VjcmV0c21hbmFnZXI6TGlzdFNlY3JldHNcIixcclxuICAgIFwic3NtOkRlc2NyaWJlUGFyYW1ldGVyc1wiLFxyXG4gICAgXCJzc206R2V0UGFyYW1ldGVyXCIsXHJcbiAgICBcInNzbTpHZXRQYXJhbWV0ZXJzXCIsXHJcbiAgICBcInNzbTpHZXRQYXJhbWV0ZXJzQnlQYXRoXCIsXHJcbiAgICBcInNzbTpHZXRQYXJhbWV0ZXJIaXN0b3J5XCIsXHJcbiAgICBcImttczpEZWNyeXB0XCJcclxuICBdLFxyXG4gIHJlc291cmNlczogW1wiKlwiXSxcclxufSk7XHJcblxyXG4vKipcclxuICogRXh0ZXJuYWxzU2VjcmV0c0FkZE9uIGRlcGxveXMgRXh0ZXJuYWxzU2VjcmV0cyBpbnRvIGFuIEVLUyBjbHVzdGVyIHVzaW5nIHRoZSBgZXh0ZXJuYWwtc2VjcmV0c2AgSGVsbSBjaGFydC5cclxuICogaHR0cHM6Ly9naXRodWIuY29tL2V4dGVybmFsLXNlY3JldHMvZXh0ZXJuYWwtc2VjcmV0cy9cclxuICpcclxuICogRm9yIGluZm9ybWF0aW9uIG9uIGhvdyB0byBjb25maWd1cmUgdGhlIGBleHRlcm5hbC1zZWNyZXRzYCBIZWxtIGNoYXJ0LCBwbGVhc2UgdmlldyB0aGUgdmFsdWVzLnlhbWwgc3BlYyBwcm92aWRlZCBieSB0aGUgY2hhcnQuXHJcbiAqIGh0dHBzOi8vZ2l0aHViLmNvbS9leHRlcm5hbC1zZWNyZXRzL2V4dGVybmFsLXNlY3JldHMvYmxvYi9tYWluL2RlcGxveS9jaGFydHMvZXh0ZXJuYWwtc2VjcmV0cy92YWx1ZXMueWFtbFxyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBFeHRlcm5hbHNTZWNyZXRzQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG4gIHJlYWRvbmx5IG9wdGlvbnM6IEV4dGVybmFsc1NlY3JldHNBZGRPblByb3BzO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wcz86IEV4dGVybmFsc1NlY3JldHNBZGRPblByb3BzKSB7XHJcbiAgICBzdXBlcih7IC4uLihkZWZhdWx0UHJvcHMgYXMgYW55KSwgLi4ucHJvcHMgfSk7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzO1xyXG4gIH1cclxuXHJcbiAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIEV4dGVybmFsc1NlY3JldHMgbmFtZXNwYWNlLlxyXG4gICAgY29uc3QgbmFtZXNwYWNlID0gdGhpcy5vcHRpb25zLm5hbWVzcGFjZTtcclxuICAgIGNvbnN0IG5zID0gY3JlYXRlTmFtZXNwYWNlKHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhLCBjbHVzdGVyLCB0cnVlKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIEV4dGVybmFsc1NlY3JldHMgc2VydmljZSBhY2NvdW50LlxyXG4gICAgY29uc3Qgc2VydmljZUFjY291bnROYW1lID0gXCJleHRlcm5hbC1zZWNyZXRzLXNhXCI7XHJcbiAgICBjb25zdCBzYSA9IGNsdXN0ZXIuYWRkU2VydmljZUFjY291bnQoc2VydmljZUFjY291bnROYW1lLCB7XHJcbiAgICAgIG5hbWU6IHNlcnZpY2VBY2NvdW50TmFtZSxcclxuICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2UsXHJcbiAgICB9KTtcclxuICAgIHNhLm5vZGUuYWRkRGVwZW5kZW5jeShucyk7XHJcblxyXG4gICAgLy8gQXBwbHkgYWRkaXRpb25hbCBJQU0gcG9saWNpZXMgdG8gdGhlIHNlcnZpY2UgYWNjb3VudC5cclxuICAgIGNvbnN0IHBvbGljaWVzID0gdGhpcy5vcHRpb25zLmlhbVBvbGljaWVzIHx8IFtkZWZhdWx0SWFtUG9saWN5XTtcclxuICAgIHBvbGljaWVzLmZvckVhY2goKHBvbGljeTogaWFtLlBvbGljeVN0YXRlbWVudCkgPT5cclxuICAgICAgc2EuYWRkVG9QcmluY2lwYWxQb2xpY3kocG9saWN5KVxyXG4gICAgKTtcclxuXHJcbiAgICAvLyBDb25maWd1cmUgdmFsdWVzLlxyXG4gICAgbGV0IHZhbHVlcyA6IFZhbHVlcyA9IHtcclxuICAgICAgc2VydmljZUFjY291bnQ6IHtcclxuICAgICAgICBuYW1lOiBzZXJ2aWNlQWNjb3VudE5hbWUsXHJcbiAgICAgICAgY3JlYXRlOiBmYWxzZSxcclxuICAgICAgfSxcclxuICAgICAgLi4udGhpcy5vcHRpb25zLnZhbHVlcyxcclxuICAgIH07XHJcblxyXG4gICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcblxyXG4gICAgY29uc3QgaGVsbUNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcywgZmFsc2UsIHRydWUsIER1cmF0aW9uLm1pbnV0ZXMoMTUpKTtcclxuICAgIGhlbG1DaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG5cclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoaGVsbUNoYXJ0KTtcclxuICB9XHJcbn1cclxuIl19