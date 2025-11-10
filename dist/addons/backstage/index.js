"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BackstageAddOn = void 0;
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const HTTPS = "https://";
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: "blueprints-backstage-addon",
    namespace: "backstage",
    chart: "backstage",
    version: "0.17.0",
    release: "backstage",
    repository: "https://backstage.github.io/charts",
    imageTag: "latest",
    values: {}
};
/**
 * Main class to instantiate the Helm chart
 */
let BackstageAddOn = class BackstageAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        let values = this.populateValues(clusterInfo, this.options);
        const chart = this.addHelmChart(clusterInfo, values);
        new aws_cdk_lib_1.CfnOutput(clusterInfo.cluster.stack, 'Backstage base URL', {
            value: HTTPS + this.options.subdomain,
            description: "Backstage base URL",
            exportName: "BackstageBaseUrl",
        });
        return Promise.resolve(chart);
    }
    /**
    * populateValues populates the appropriate values used to customize the Helm chart
    * @param helmOptions User provided values to customize the chart
    */
    populateValues(clusterInfo, helmOptions) {
        const values = helmOptions.values ?? {};
        const annotations = {
            "alb.ingress.kubernetes.io/scheme": "internet-facing",
            "alb.ingress.kubernetes.io/target-type": "ip",
            "alb.ingress.kubernetes.io/certificate-arn": clusterInfo.getResource(helmOptions.certificateResourceName)?.certificateArn
        };
        const databaseInstance = clusterInfo.getRequiredResource(helmOptions.databaseResourceName);
        if (databaseInstance === undefined) {
            throw new Error("Database instance not found");
        }
        const databaseChartValues = {
            "client": "pg",
            "connection": {
                "host": databaseInstance.dbInstanceEndpointAddress,
                "port": databaseInstance.dbInstanceEndpointPort,
                "user": "${POSTGRES_USER}",
                "password": "${POSTGRES_PASSWORD}"
            }
        };
        (0, utils_1.setPath)(values, "ingress.enabled", true);
        (0, utils_1.setPath)(values, "ingress.className", "alb");
        (0, utils_1.setPath)(values, "ingress.host", helmOptions.subdomain);
        (0, utils_1.setPath)(values, "ingress.annotations", annotations);
        (0, utils_1.setPath)(values, "backstage.image.registry", helmOptions.imageRegistry);
        (0, utils_1.setPath)(values, "backstage.image.repository", helmOptions.imageRepository);
        (0, utils_1.setPath)(values, "backstage.image.tag", helmOptions.imageTag);
        (0, utils_1.setPath)(values, "backstage.appConfig.app.baseUrl", HTTPS + helmOptions.subdomain);
        (0, utils_1.setPath)(values, "backstage.appConfig.backend.baseUrl", HTTPS + helmOptions.subdomain);
        (0, utils_1.setPath)(values, "backstage.appConfig.backend.database", databaseChartValues);
        (0, utils_1.setPath)(values, "backstage.extraEnvVarsSecrets", [helmOptions.databaseSecretTargetName]);
        (0, utils_1.setPath)(values, "backstage.command", ["node", "packages/backend", "--config", "app-config.yaml"]);
        return values;
    }
};
exports.BackstageAddOn = BackstageAddOn;
__decorate([
    (0, utils_1.dependable)('AwsLoadBalancerControllerAddOn', 'ExternalsSecretsAddOn')
], BackstageAddOn.prototype, "deploy", null);
exports.BackstageAddOn = BackstageAddOn = __decorate([
    utils_1.supportsX86
], BackstageAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2JhY2tzdGFnZS9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSw4Q0FBOEQ7QUFDOUQsdUNBQStEO0FBSS9ELDZDQUF3QztBQUV4QyxNQUFNLEtBQUssR0FBRyxVQUFVLENBQUM7QUE0Q3pCOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUc7SUFDbkIsSUFBSSxFQUFFLDRCQUE0QjtJQUNsQyxTQUFTLEVBQUUsV0FBVztJQUN0QixLQUFLLEVBQUUsV0FBVztJQUNsQixPQUFPLEVBQUUsUUFBUTtJQUNqQixPQUFPLEVBQUUsV0FBVztJQUNwQixVQUFVLEVBQUcsb0NBQW9DO0lBQ2pELFFBQVEsRUFBRSxRQUFRO0lBQ2xCLE1BQU0sRUFBRSxFQUFFO0NBQ1gsQ0FBQztBQUVGOztHQUVHO0FBRUksSUFBTSxjQUFjLEdBQXBCLE1BQU0sY0FBZSxTQUFRLHNCQUFTO0lBRWxDLE9BQU8sQ0FBc0I7SUFFdEMsWUFBWSxLQUEyQjtRQUNyQyxLQUFLLENBQUMsRUFBQyxHQUFHLFlBQVksRUFBRSxHQUFHLEtBQUssRUFBQyxDQUFDLENBQUM7UUFDbkMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBNEIsQ0FBQztJQUNuRCxDQUFDO0lBR0QsTUFBTSxDQUFDLFdBQXdCO1FBQzdCLElBQUksTUFBTSxHQUFXLElBQUksQ0FBQyxjQUFjLENBQUMsV0FBVyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNwRSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVcsRUFBRSxNQUFNLENBQUMsQ0FBQztRQUVyRCxJQUFJLHVCQUFTLENBQUMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLEVBQUU7WUFDN0QsS0FBSyxFQUFFLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVM7WUFDckMsV0FBVyxFQUFFLG9CQUFvQjtZQUNqQyxVQUFVLEVBQUUsa0JBQWtCO1NBQy9CLENBQUMsQ0FBQztRQUVILE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNoQyxDQUFDO0lBRUQ7OztNQUdFO0lBQ0YsY0FBYyxDQUFDLFdBQXdCLEVBQUUsV0FBZ0M7UUFDdkUsTUFBTSxNQUFNLEdBQUcsV0FBVyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFFeEMsTUFBTSxXQUFXLEdBQUc7WUFDbEIsa0NBQWtDLEVBQUUsaUJBQWlCO1lBQ3JELHVDQUF1QyxFQUFFLElBQUk7WUFDN0MsMkNBQTJDLEVBQUUsV0FBVyxDQUFDLFdBQVcsQ0FBZSxXQUFXLENBQUMsdUJBQXVCLENBQUMsRUFBRSxjQUFjO1NBQ3hJLENBQUM7UUFFRixNQUFNLGdCQUFnQixHQUEyQixXQUFXLENBQUMsbUJBQW1CLENBQUMsV0FBVyxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFDbkgsSUFBSSxnQkFBZ0IsS0FBSyxTQUFTLEVBQUUsQ0FBQztZQUNqQyxNQUFNLElBQUksS0FBSyxDQUFDLDZCQUE2QixDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELE1BQU0sbUJBQW1CLEdBQUc7WUFDMUIsUUFBUSxFQUFFLElBQUk7WUFDZCxZQUFZLEVBQUU7Z0JBQ1osTUFBTSxFQUFFLGdCQUFnQixDQUFDLHlCQUF5QjtnQkFDbEQsTUFBTSxFQUFFLGdCQUFnQixDQUFDLHNCQUFzQjtnQkFDL0MsTUFBTSxFQUFFLGtCQUFrQjtnQkFDMUIsVUFBVSxFQUFFLHNCQUFzQjthQUNuQztTQUNGLENBQUM7UUFFRixJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDekMsSUFBQSxlQUFPLEVBQUMsTUFBTSxFQUFFLG1CQUFtQixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQzVDLElBQUEsZUFBTyxFQUFDLE1BQU0sRUFBRSxjQUFjLEVBQUUsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3ZELElBQUEsZUFBTyxFQUFDLE1BQU0sRUFBRSxxQkFBcUIsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUVwRCxJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsMEJBQTBCLEVBQUUsV0FBVyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ3ZFLElBQUEsZUFBTyxFQUFDLE1BQU0sRUFBRSw0QkFBNEIsRUFBRSxXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDM0UsSUFBQSxlQUFPLEVBQUMsTUFBTSxFQUFFLHFCQUFxQixFQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUU3RCxJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsaUNBQWlDLEVBQUUsS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUNsRixJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUscUNBQXFDLEVBQUUsS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUN0RixJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsc0NBQXNDLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztRQUU3RSxJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsK0JBQStCLEVBQUUsQ0FBQyxXQUFXLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDO1FBRXpGLElBQUEsZUFBTyxFQUFDLE1BQU0sRUFBRSxtQkFBbUIsRUFBRSxDQUFDLE1BQU0sRUFBRSxrQkFBa0IsRUFBRSxVQUFVLEVBQUUsaUJBQWlCLENBQUMsQ0FBQyxDQUFDO1FBRWxHLE9BQU8sTUFBTSxDQUFDO0lBQ2hCLENBQUM7Q0FDRixDQUFBO0FBdEVZLHdDQUFjO0FBVXpCO0lBREMsSUFBQSxrQkFBVSxFQUFDLGdDQUFnQyxFQUFDLHVCQUF1QixDQUFDOzRDQVlwRTt5QkFyQlUsY0FBYztJQUQxQixtQkFBVztHQUNDLGNBQWMsQ0FzRTFCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tIFwiLi4vaGVsbS1hZGRvblwiO1xyXG5pbXBvcnQgeyBkZXBlbmRhYmxlLCBzZXRQYXRoLCBzdXBwb3J0c1g4NiB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBJQ2VydGlmaWNhdGUgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlclwiO1xyXG5pbXBvcnQgKiBhcyByZHMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1yZHNcIjtcclxuaW1wb3J0IHsgQ2ZuT3V0cHV0IH0gZnJvbSAnYXdzLWNkay1saWInO1xyXG5cclxuY29uc3QgSFRUUFMgPSBcImh0dHBzOi8vXCI7XHJcblxyXG4vKipcclxuICogVXNlciBwcm92aWRlZCBvcHRpb25zIGZvciB0aGUgSGVsbSBDaGFydFxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBCYWNrc3RhZ2VBZGRPblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHN1YmRvbWFpbiB0aGF0IHdpbGwgYmUgYXNzaWduZWQgdG8gdGhlIEJhY2tzdGFnZSBhcHBsaWNhdGlvbi5cclxuICAgICAqL1xyXG4gICAgc3ViZG9tYWluOiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcmVzb3VyY2UgbmFtZSBvZiB0aGUgY2VydGlmaWNhdGUgdG8gYmUgYXNzaWduZWQgdG8gdGhlIExvYWQgQmFsYW5jZXIuXHJcbiAgICAgKi9cclxuICAgIGNlcnRpZmljYXRlUmVzb3VyY2VOYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgcmVnaXN0cnkgVVJMIG9mIHRoZSBCYWNrc3RhZ2UgYXBwbGljYXRpb24ncyBEb2NrZXIgaW1hZ2UuXHJcbiAgICAgKi9cclxuICAgIGltYWdlUmVnaXN0cnk6IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSByZXBvc2l0b3J5IG5hbWUgaW4gdGhlIFwiaW1hZ2VSZWdpc3RyeVwiLlxyXG4gICAgICovXHJcbiAgICBpbWFnZVJlcG9zaXRvcnk6IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoZSB0YWcgb2YgdGhlIEJhY2tzdGFnZSBhcHBsaWNhdGlvbidzIERvY2tlciBpbWFnZS5cclxuICAgICAqIEBkZWZhdWx0ICdsYXRlc3QnXHJcbiAgICAgKi9cclxuICAgIGltYWdlVGFnPzogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJlc291cmNlIG5hbWUgb2YgdGhlIGRhdGFiYXNlLlxyXG4gICAgICovXHJcbiAgICBkYXRhYmFzZVJlc291cmNlTmFtZTogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhlIG5hbWUgb2YgdGhlIEt1YmVybmV0ZXMgU2VjcmV0IHdoaWNoIHdpbGwgYmUgY3JlYXRlZCBieSB0aGUgYWRkLW9uIGFuZFxyXG4gICAgICogaW5qZWN0ZWQgd2l0aCB0aGUgZGF0YWJhc2UgY3JlZGVudGlhbHMuXHJcbiAgICAgKi9cclxuICAgIGRhdGFiYXNlU2VjcmV0VGFyZ2V0TmFtZTogc3RyaW5nO1xyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBwcm9wcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgdGhlIEhlbG0gY2hhcnRcclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICBuYW1lOiBcImJsdWVwcmludHMtYmFja3N0YWdlLWFkZG9uXCIsXHJcbiAgbmFtZXNwYWNlOiBcImJhY2tzdGFnZVwiLFxyXG4gIGNoYXJ0OiBcImJhY2tzdGFnZVwiLFxyXG4gIHZlcnNpb246IFwiMC4xNy4wXCIsXHJcbiAgcmVsZWFzZTogXCJiYWNrc3RhZ2VcIixcclxuICByZXBvc2l0b3J5OiAgXCJodHRwczovL2JhY2tzdGFnZS5naXRodWIuaW8vY2hhcnRzXCIsXHJcbiAgaW1hZ2VUYWc6IFwibGF0ZXN0XCIsXHJcbiAgdmFsdWVzOiB7fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1haW4gY2xhc3MgdG8gaW5zdGFudGlhdGUgdGhlIEhlbG0gY2hhcnRcclxuICovXHJcbkBzdXBwb3J0c1g4NlxyXG5leHBvcnQgY2xhc3MgQmFja3N0YWdlQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICByZWFkb25seSBvcHRpb25zOiBCYWNrc3RhZ2VBZGRPblByb3BzO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wcz86IEJhY2tzdGFnZUFkZE9uUHJvcHMpIHtcclxuICAgIHN1cGVyKHsuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzfSk7XHJcbiAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzIGFzIEJhY2tzdGFnZUFkZE9uUHJvcHM7XHJcbiAgfVxyXG4gIFxyXG4gIEBkZXBlbmRhYmxlKCdBd3NMb2FkQmFsYW5jZXJDb250cm9sbGVyQWRkT24nLCdFeHRlcm5hbHNTZWNyZXRzQWRkT24nKVxyXG4gIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgbGV0IHZhbHVlczogVmFsdWVzID0gdGhpcy5wb3B1bGF0ZVZhbHVlcyhjbHVzdGVySW5mbywgdGhpcy5vcHRpb25zKTtcclxuICAgIGNvbnN0IGNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcyk7XHJcblxyXG4gICAgbmV3IENmbk91dHB1dChjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLCAnQmFja3N0YWdlIGJhc2UgVVJMJywge1xyXG4gICAgICB2YWx1ZTogSFRUUFMgKyB0aGlzLm9wdGlvbnMuc3ViZG9tYWluLFxyXG4gICAgICBkZXNjcmlwdGlvbjogXCJCYWNrc3RhZ2UgYmFzZSBVUkxcIixcclxuICAgICAgZXhwb3J0TmFtZTogXCJCYWNrc3RhZ2VCYXNlVXJsXCIsXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNoYXJ0KTtcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICogcG9wdWxhdGVWYWx1ZXMgcG9wdWxhdGVzIHRoZSBhcHByb3ByaWF0ZSB2YWx1ZXMgdXNlZCB0byBjdXN0b21pemUgdGhlIEhlbG0gY2hhcnRcclxuICAqIEBwYXJhbSBoZWxtT3B0aW9ucyBVc2VyIHByb3ZpZGVkIHZhbHVlcyB0byBjdXN0b21pemUgdGhlIGNoYXJ0XHJcbiAgKi9cclxuICBwb3B1bGF0ZVZhbHVlcyhjbHVzdGVySW5mbzogQ2x1c3RlckluZm8sIGhlbG1PcHRpb25zOiBCYWNrc3RhZ2VBZGRPblByb3BzKTogVmFsdWVzIHtcclxuICAgIGNvbnN0IHZhbHVlcyA9IGhlbG1PcHRpb25zLnZhbHVlcyA/PyB7fTtcclxuICAgIFxyXG4gICAgY29uc3QgYW5ub3RhdGlvbnMgPSB7XHJcbiAgICAgIFwiYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9zY2hlbWVcIjogXCJpbnRlcm5ldC1mYWNpbmdcIixcclxuICAgICAgXCJhbGIuaW5ncmVzcy5rdWJlcm5ldGVzLmlvL3RhcmdldC10eXBlXCI6IFwiaXBcIixcclxuICAgICAgXCJhbGIuaW5ncmVzcy5rdWJlcm5ldGVzLmlvL2NlcnRpZmljYXRlLWFyblwiOiBjbHVzdGVySW5mby5nZXRSZXNvdXJjZTxJQ2VydGlmaWNhdGU+KGhlbG1PcHRpb25zLmNlcnRpZmljYXRlUmVzb3VyY2VOYW1lKT8uY2VydGlmaWNhdGVBcm5cclxuICAgIH07XHJcbiAgXHJcbiAgICBjb25zdCBkYXRhYmFzZUluc3RhbmNlOiByZHMuSURhdGFiYXNlSW5zdGFuY2UgID0gY2x1c3RlckluZm8uZ2V0UmVxdWlyZWRSZXNvdXJjZShoZWxtT3B0aW9ucy5kYXRhYmFzZVJlc291cmNlTmFtZSk7XHJcbiAgICBpZiAoZGF0YWJhc2VJbnN0YW5jZSA9PT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiRGF0YWJhc2UgaW5zdGFuY2Ugbm90IGZvdW5kXCIpO1xyXG4gICAgfVxyXG4gIFxyXG4gICAgY29uc3QgZGF0YWJhc2VDaGFydFZhbHVlcyA9IHtcclxuICAgICAgXCJjbGllbnRcIjogXCJwZ1wiLFxyXG4gICAgICBcImNvbm5lY3Rpb25cIjoge1xyXG4gICAgICAgIFwiaG9zdFwiOiBkYXRhYmFzZUluc3RhbmNlLmRiSW5zdGFuY2VFbmRwb2ludEFkZHJlc3MsXHJcbiAgICAgICAgXCJwb3J0XCI6IGRhdGFiYXNlSW5zdGFuY2UuZGJJbnN0YW5jZUVuZHBvaW50UG9ydCxcclxuICAgICAgICBcInVzZXJcIjogXCIke1BPU1RHUkVTX1VTRVJ9XCIsXHJcbiAgICAgICAgXCJwYXNzd29yZFwiOiBcIiR7UE9TVEdSRVNfUEFTU1dPUkR9XCJcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIFxyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiaW5ncmVzcy5lbmFibGVkXCIsIHRydWUpO1xyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiaW5ncmVzcy5jbGFzc05hbWVcIiwgXCJhbGJcIik7XHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJpbmdyZXNzLmhvc3RcIiwgaGVsbU9wdGlvbnMuc3ViZG9tYWluKTtcclxuICAgIHNldFBhdGgodmFsdWVzLCBcImluZ3Jlc3MuYW5ub3RhdGlvbnNcIiwgYW5ub3RhdGlvbnMpO1xyXG4gIFxyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiYmFja3N0YWdlLmltYWdlLnJlZ2lzdHJ5XCIsIGhlbG1PcHRpb25zLmltYWdlUmVnaXN0cnkpO1xyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiYmFja3N0YWdlLmltYWdlLnJlcG9zaXRvcnlcIiwgaGVsbU9wdGlvbnMuaW1hZ2VSZXBvc2l0b3J5KTtcclxuICAgIHNldFBhdGgodmFsdWVzLCBcImJhY2tzdGFnZS5pbWFnZS50YWdcIiwgaGVsbU9wdGlvbnMuaW1hZ2VUYWcpO1xyXG4gIFxyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiYmFja3N0YWdlLmFwcENvbmZpZy5hcHAuYmFzZVVybFwiLCBIVFRQUyArIGhlbG1PcHRpb25zLnN1YmRvbWFpbik7XHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJiYWNrc3RhZ2UuYXBwQ29uZmlnLmJhY2tlbmQuYmFzZVVybFwiLCBIVFRQUyArIGhlbG1PcHRpb25zLnN1YmRvbWFpbik7XHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJiYWNrc3RhZ2UuYXBwQ29uZmlnLmJhY2tlbmQuZGF0YWJhc2VcIiwgZGF0YWJhc2VDaGFydFZhbHVlcyk7XHJcblxyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiYmFja3N0YWdlLmV4dHJhRW52VmFyc1NlY3JldHNcIiwgW2hlbG1PcHRpb25zLmRhdGFiYXNlU2VjcmV0VGFyZ2V0TmFtZV0pO1xyXG4gIFxyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiYmFja3N0YWdlLmNvbW1hbmRcIiwgW1wibm9kZVwiLCBcInBhY2thZ2VzL2JhY2tlbmRcIiwgXCItLWNvbmZpZ1wiLCBcImFwcC1jb25maWcueWFtbFwiXSk7XHJcbiAgICBcclxuICAgIHJldHVybiB2YWx1ZXM7XHJcbiAgfVxyXG59XHJcbiJdfQ==