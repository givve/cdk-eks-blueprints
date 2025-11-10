"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsiDriverProviderAws = void 0;
const cdk = require("aws-cdk-lib");
const yaml_utils_1 = require("../../utils/yaml-utils");
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
class CsiDriverProviderAws {
    props;
    constructor(props) {
        this.props = props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = {
            grpcSupportedProviders: 'aws'
        };
        if (typeof (this.props.rotationPollInterval) === 'string') {
            values.enableSecretRotation = 'true';
            values.rotationPollInterval = this.props.rotationPollInterval;
        }
        if (this.props.syncSecrets === true) {
            values.syncSecret = {
                enabled: 'true'
            };
        }
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const helmChartOptions = {
            chart: this.props.chart,
            repository: this.props.repository,
            namespace: this.props.namespace,
            release: this.props.release,
            version: this.props.version,
            wait: true,
            timeout: cdk.Duration.minutes(15),
            values,
        };
        helm_addon_1.HelmAddOn.validateVersion({
            chart: helmChartOptions.chart,
            repository: helmChartOptions.repository,
            version: helmChartOptions.version
        });
        const secretStoreCSIDriverHelmChart = cluster.addHelmChart('SecretsStoreCSIDriver', helmChartOptions);
        const manifestUrl = this.props.ascpUrl;
        const manifest = (0, yaml_utils_1.loadExternalYaml)(manifestUrl);
        const secretProviderManifest = clusterInfo.cluster.addManifest('SecretsStoreCsiDriverProviderAws', ...manifest);
        secretProviderManifest.node.addDependency(secretStoreCSIDriverHelmChart);
        return secretProviderManifest;
    }
}
exports.CsiDriverProviderAws = CsiDriverProviderAws;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY3NpLWRyaXZlci1wcm92aWRlci1hd3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3NlY3JldHMtc3RvcmUvY3NpLWRyaXZlci1wcm92aWRlci1hd3MudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsbUNBQW1DO0FBRW5DLHVEQUEwRDtBQUcxRCwrQ0FBcUM7QUFDckMsOENBQTBDO0FBRzFDLE1BQWEsb0JBQW9CO0lBRVg7SUFBcEIsWUFBb0IsS0FBNkI7UUFBN0IsVUFBSyxHQUFMLEtBQUssQ0FBd0I7SUFBRyxDQUFDO0lBRXJELE1BQU0sQ0FBQyxXQUF3QjtRQUM3QixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBRXBDLElBQUksTUFBTSxHQUFXO1lBQ25CLHNCQUFzQixFQUFFLEtBQUs7U0FDOUIsQ0FBQztRQUVGLElBQUksT0FBTSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsS0FBSyxRQUFRLEVBQUUsQ0FBQztZQUN6RCxNQUFNLENBQUMsb0JBQW9CLEdBQUcsTUFBTSxDQUFDO1lBQ3JDLE1BQU0sQ0FBQyxvQkFBb0IsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixDQUFDO1FBQ2hFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxLQUFLLElBQUksRUFBRSxDQUFDO1lBQ3BDLE1BQU0sQ0FBQyxVQUFVLEdBQUc7Z0JBQ2xCLE9BQU8sRUFBRSxNQUFNO2FBQ2hCLENBQUM7UUFDSixDQUFDO1FBRUQsTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFFaEQsTUFBTSxnQkFBZ0IsR0FBRztZQUNyQixLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFNO1lBQ3hCLFVBQVUsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVc7WUFDbEMsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsU0FBVTtZQUNoQyxPQUFPLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPO1lBQzNCLE9BQU8sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE9BQU87WUFDM0IsSUFBSSxFQUFFLElBQUk7WUFDVixPQUFPLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxPQUFPLENBQUMsRUFBRSxDQUFDO1lBQ2pDLE1BQU07U0FDUCxDQUFDO1FBRUosc0JBQVMsQ0FBQyxlQUFlLENBQUM7WUFDdEIsS0FBSyxFQUFFLGdCQUFnQixDQUFDLEtBQUs7WUFDN0IsVUFBVSxFQUFFLGdCQUFnQixDQUFDLFVBQVU7WUFDdkMsT0FBTyxFQUFFLGdCQUFnQixDQUFDLE9BQVE7U0FDckMsQ0FBQyxDQUFDO1FBRUgsTUFBTSw2QkFBNkIsR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLHVCQUF1QixFQUFFLGdCQUFnQixDQUFDLENBQUM7UUFFdEcsTUFBTSxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFRLENBQUM7UUFDeEMsTUFBTSxRQUFRLEdBQTBCLElBQUEsNkJBQWdCLEVBQUMsV0FBVyxDQUFDLENBQUM7UUFDdEUsTUFBTSxzQkFBc0IsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVcsQ0FBQyxrQ0FBa0MsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDO1FBQ2hILHNCQUFzQixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsNkJBQTZCLENBQUMsQ0FBQztRQUN6RSxPQUFPLHNCQUFzQixDQUFDO0lBQ2hDLENBQUM7Q0FDRjtBQWpERCxvREFpREMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IGxvYWRFeHRlcm5hbFlhbWwgfSBmcm9tIFwiLi4vLi4vdXRpbHMveWFtbC11dGlsc1wiO1xyXG5pbXBvcnQgeyBLdWJlcm5ldGVzTWFuaWZlc3QgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgeyBTZWNyZXRzU3RvcmVBZGRPblByb3BzIH0gZnJvbSBcIi5cIjtcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcblxyXG5cclxuZXhwb3J0IGNsYXNzIENzaURyaXZlclByb3ZpZGVyQXdzIHtcclxuXHJcbiAgY29uc3RydWN0b3IocHJpdmF0ZSBwcm9wczogU2VjcmV0c1N0b3JlQWRkT25Qcm9wcykge31cclxuXHJcbiAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IEt1YmVybmV0ZXNNYW5pZmVzdCB7XHJcbiAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuXHJcbiAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSB7XHJcbiAgICAgIGdycGNTdXBwb3J0ZWRQcm92aWRlcnM6ICdhd3MnXHJcbiAgICB9O1xyXG5cclxuICAgIGlmICh0eXBlb2YodGhpcy5wcm9wcy5yb3RhdGlvblBvbGxJbnRlcnZhbCkgPT09ICdzdHJpbmcnKSB7XHJcbiAgICAgIHZhbHVlcy5lbmFibGVTZWNyZXRSb3RhdGlvbiA9ICd0cnVlJztcclxuICAgICAgdmFsdWVzLnJvdGF0aW9uUG9sbEludGVydmFsID0gdGhpcy5wcm9wcy5yb3RhdGlvblBvbGxJbnRlcnZhbDtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5wcm9wcy5zeW5jU2VjcmV0cyA9PT0gdHJ1ZSkge1xyXG4gICAgICB2YWx1ZXMuc3luY1NlY3JldCA9IHtcclxuICAgICAgICBlbmFibGVkOiAndHJ1ZSdcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICB2YWx1ZXMgPSBtZXJnZSh2YWx1ZXMsIHRoaXMucHJvcHMudmFsdWVzID8/IHt9KTtcclxuICAgIFxyXG4gICAgY29uc3QgaGVsbUNoYXJ0T3B0aW9ucyA9IHtcclxuICAgICAgICBjaGFydDogdGhpcy5wcm9wcy5jaGFydCEsXHJcbiAgICAgICAgcmVwb3NpdG9yeTogdGhpcy5wcm9wcy5yZXBvc2l0b3J5ISxcclxuICAgICAgICBuYW1lc3BhY2U6IHRoaXMucHJvcHMubmFtZXNwYWNlISxcclxuICAgICAgICByZWxlYXNlOiB0aGlzLnByb3BzLnJlbGVhc2UsXHJcbiAgICAgICAgdmVyc2lvbjogdGhpcy5wcm9wcy52ZXJzaW9uLFxyXG4gICAgICAgIHdhaXQ6IHRydWUsXHJcbiAgICAgICAgdGltZW91dDogY2RrLkR1cmF0aW9uLm1pbnV0ZXMoMTUpLFxyXG4gICAgICAgIHZhbHVlcyxcclxuICAgICAgfTtcclxuXHJcbiAgICBIZWxtQWRkT24udmFsaWRhdGVWZXJzaW9uKHtcclxuICAgICAgICBjaGFydDogaGVsbUNoYXJ0T3B0aW9ucy5jaGFydCxcclxuICAgICAgICByZXBvc2l0b3J5OiBoZWxtQ2hhcnRPcHRpb25zLnJlcG9zaXRvcnksXHJcbiAgICAgICAgdmVyc2lvbjogaGVsbUNoYXJ0T3B0aW9ucy52ZXJzaW9uIVxyXG4gICAgfSk7XHJcblxyXG4gICAgY29uc3Qgc2VjcmV0U3RvcmVDU0lEcml2ZXJIZWxtQ2hhcnQgPSBjbHVzdGVyLmFkZEhlbG1DaGFydCgnU2VjcmV0c1N0b3JlQ1NJRHJpdmVyJywgaGVsbUNoYXJ0T3B0aW9ucyk7XHJcblxyXG4gICAgY29uc3QgbWFuaWZlc3RVcmwgPSB0aGlzLnByb3BzLmFzY3BVcmwhO1xyXG4gICAgY29uc3QgbWFuaWZlc3Q6IFJlY29yZDxzdHJpbmcsIGFueT5bXSA9IGxvYWRFeHRlcm5hbFlhbWwobWFuaWZlc3RVcmwpO1xyXG4gICAgY29uc3Qgc2VjcmV0UHJvdmlkZXJNYW5pZmVzdCA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXIuYWRkTWFuaWZlc3QoJ1NlY3JldHNTdG9yZUNzaURyaXZlclByb3ZpZGVyQXdzJywgLi4ubWFuaWZlc3QpO1xyXG4gICAgc2VjcmV0UHJvdmlkZXJNYW5pZmVzdC5ub2RlLmFkZERlcGVuZGVuY3koc2VjcmV0U3RvcmVDU0lEcml2ZXJIZWxtQ2hhcnQpO1xyXG4gICAgcmV0dXJuIHNlY3JldFByb3ZpZGVyTWFuaWZlc3Q7XHJcbiAgfVxyXG59Il19