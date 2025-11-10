"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var UpboundCrossplaneAddOn_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpboundCrossplaneAddOn = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const cdk = require("aws-cdk-lib");
const helm_addon_1 = require("../helm-addon");
const defaultProps = {
    name: 'uxp',
    release: 'blueprints-addon-uxp',
    namespace: 'upbound-system',
    chart: 'universal-crossplane',
    version: '1.14.5-up.1',
    repository: 'https://charts.upbound.io/stable',
    values: {}
};
let UpboundCrossplaneAddOn = UpboundCrossplaneAddOn_1 = class UpboundCrossplaneAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        // Create the `upbound-system` namespace.
        const ns = (0, utils_1.createNamespace)(this.options.namespace, cluster, true);
        // Create the CrossPlane AWS Provider IRSA.
        const serviceAccountName = "provider-aws";
        const sa = cluster.addServiceAccount(serviceAccountName, {
            name: serviceAccountName,
            namespace: this.options.namespace,
        });
        sa.node.addDependency(ns);
        sa.role.attachInlinePolicy(new aws_iam_1.Policy(cluster.stack, 'eks-connect-policy', {
            document: aws_iam_1.PolicyDocument.fromJson({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": ["sts:AssumeRole"],
                        "Resource": `${this.options.clusterAccessRole.roleArn}`
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["eks:*"],
                        "Resource": `*`
                    }
                ]
            })
        }));
        clusterInfo.addAddOnContext(UpboundCrossplaneAddOn_1.name, {
            arn: sa.role.roleArn
        });
        new cdk.CfnOutput(cluster.stack, 'providerawssaiamrole', {
            value: sa.role.roleArn,
            description: 'provider AWS IAM role',
            exportName: 'providerawssaiamrole'
        });
        let values = this.options.values ?? {};
        values = (0, ts_deepmerge_1.merge)(values, values);
        const chart = this.addHelmChart(clusterInfo, values, false, true);
        chart.node.addDependency(sa);
        return Promise.resolve(chart);
    }
};
exports.UpboundCrossplaneAddOn = UpboundCrossplaneAddOn;
exports.UpboundCrossplaneAddOn = UpboundCrossplaneAddOn = UpboundCrossplaneAddOn_1 = __decorate([
    utils_1.supportsALL
], UpboundCrossplaneAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3VwYm91bmQtdW5pdmVyc2FsLWNyb3NzcGxhbmUvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUVBLCtDQUFxQztBQUNyQyx1Q0FBeUQ7QUFDekQsaURBQWtFO0FBQ2xFLG1DQUFtQztBQUNuQyw4Q0FBNEQ7QUFrQjVELE1BQU0sWUFBWSxHQUFHO0lBQ2pCLElBQUksRUFBRSxLQUFLO0lBQ1gsT0FBTyxFQUFFLHNCQUFzQjtJQUMvQixTQUFTLEVBQUUsZ0JBQWdCO0lBQzNCLEtBQUssRUFBRSxzQkFBc0I7SUFDN0IsT0FBTyxFQUFFLGFBQWE7SUFDdEIsVUFBVSxFQUFFLGtDQUFrQztJQUM5QyxNQUFNLEVBQUUsRUFBRTtDQUNiLENBQUM7QUFHSyxJQUFNLHNCQUFzQiw4QkFBNUIsTUFBTSxzQkFBdUIsU0FBUSxzQkFBUztJQUV4QyxPQUFPLENBQThCO0lBRTlDLFlBQWEsS0FBbUM7UUFDNUMsS0FBSyxDQUFDLEVBQUMsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBRW5DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQW9DLENBQUM7SUFDN0QsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBRXBDLHlDQUF5QztRQUN6QyxNQUFNLEVBQUUsR0FBRyxJQUFBLHVCQUFlLEVBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFVLEVBQUUsT0FBTyxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRW5FLDJDQUEyQztRQUMzQyxNQUFNLGtCQUFrQixHQUFHLGNBQWMsQ0FBQztRQUMxQyxNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsa0JBQWtCLEVBQUU7WUFDckQsSUFBSSxFQUFFLGtCQUFrQjtZQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxTQUFVO1NBRXJDLENBQUMsQ0FBQztRQUVILEVBQUUsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQzFCLEVBQUUsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsSUFBSSxnQkFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLEVBQUc7WUFDeEUsUUFBUSxFQUFFLHdCQUFjLENBQUMsUUFBUSxDQUFDO2dCQUM5QixTQUFTLEVBQUUsWUFBWTtnQkFDdkIsV0FBVyxFQUFFO29CQUNUO3dCQUNJLFFBQVEsRUFBRSxPQUFPO3dCQUNqQixRQUFRLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FBQzt3QkFDNUIsVUFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPLEVBQUU7cUJBQzFEO29CQUNEO3dCQUNJLFFBQVEsRUFBRSxPQUFPO3dCQUNqQixRQUFRLEVBQUUsQ0FBQyxPQUFPLENBQUM7d0JBQ25CLFVBQVUsRUFBRSxHQUFHO3FCQUNsQjtpQkFDSjthQUNKLENBQUM7U0FBQyxDQUFDLENBQUMsQ0FBQztRQUVWLFdBQVcsQ0FBQyxlQUFlLENBQUMsd0JBQXNCLENBQUMsSUFBSSxFQUFFO1lBQ3JELEdBQUcsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLE9BQU87U0FDdkIsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsc0JBQXNCLEVBQ25EO1lBQ0ksS0FBSyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsT0FBTztZQUN0QixXQUFXLEVBQUUsdUJBQXVCO1lBQ3BDLFVBQVUsRUFBRyxzQkFBc0I7U0FDdEMsQ0FBQyxDQUFDO1FBRVAsSUFBSSxNQUFNLEdBQVcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDO1FBQy9DLE1BQU0sR0FBRyxJQUFBLG9CQUFLLEVBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRS9CLE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbEUsS0FBSyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDN0IsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ2xDLENBQUM7Q0FDSixDQUFBO0FBNURZLHdEQUFzQjtpQ0FBdEIsc0JBQXNCO0lBRGxDLG1CQUFXO0dBQ0Msc0JBQXNCLENBNERsQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5pbXBvcnQge0NsdXN0ZXJJbmZvLCBWYWx1ZXN9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7Y3JlYXRlTmFtZXNwYWNlLCBzdXBwb3J0c0FMTH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5pbXBvcnQge0lSb2xlLCBQb2xpY3ksIFBvbGljeURvY3VtZW50fSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHtIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wc30gZnJvbSBcIi4uL2hlbG0tYWRkb25cIjtcclxuXHJcbi8qKlxyXG4gKiBVc2VyIHByb3ZpZGVkIG9wdGlvbnMgZm9yIHRoZSBIZWxtIENoYXJ0LlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBVcGJvdW5kQ3Jvc3NwbGFuZUFkZE9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBUbyBDcmVhdGUgTmFtZXNwYWNlIHVzaW5nIENES1xyXG4gICAgICovXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuO1xyXG4gICAgLypcclxuICAgICAqIEVLUyBDbHVzdGVyIEFjY2VzcyBSb2xlLlxyXG4gICAgICogVGhpcyBpcyBhIHJvbGUgd2l0aCByaWdodCBwZXJtaXNzaW9ucyB0aGF0IHdpbGwgYmUgdXNlZCBieSBDcm9zc1BsYW5lIEFXUyBwcm92aWRlclxyXG4gICAgICogdG8gcHJvdmlzaW9uIEFXUyByZXNvdXJjZXMuXHJcbiAgICAgKi9cclxuICAgIGNsdXN0ZXJBY2Nlc3NSb2xlOiBJUm9sZTtcclxufVxyXG5cclxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xyXG4gICAgbmFtZTogJ3V4cCcsXHJcbiAgICByZWxlYXNlOiAnYmx1ZXByaW50cy1hZGRvbi11eHAnLFxyXG4gICAgbmFtZXNwYWNlOiAndXBib3VuZC1zeXN0ZW0nLFxyXG4gICAgY2hhcnQ6ICd1bml2ZXJzYWwtY3Jvc3NwbGFuZScsXHJcbiAgICB2ZXJzaW9uOiAnMS4xNC41LXVwLjEnLFxyXG4gICAgcmVwb3NpdG9yeTogJ2h0dHBzOi8vY2hhcnRzLnVwYm91bmQuaW8vc3RhYmxlJyxcclxuICAgIHZhbHVlczoge31cclxufTtcclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgVXBib3VuZENyb3NzcGxhbmVBZGRPbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gICAgcmVhZG9ubHkgb3B0aW9uczogVXBib3VuZENyb3NzcGxhbmVBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCBwcm9wcz86IFVwYm91bmRDcm9zc3BsYW5lQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzfSk7XHJcblxyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgVXBib3VuZENyb3NzcGxhbmVBZGRPblByb3BzO1xyXG4gICAgfVxyXG5cclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiB2b2lkIHwgUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIHRoZSBgdXBib3VuZC1zeXN0ZW1gIG5hbWVzcGFjZS5cclxuICAgICAgICBjb25zdCBucyA9IGNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISwgY2x1c3RlciwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgQ3Jvc3NQbGFuZSBBV1MgUHJvdmlkZXIgSVJTQS5cclxuICAgICAgICBjb25zdCBzZXJ2aWNlQWNjb3VudE5hbWUgPSBcInByb3ZpZGVyLWF3c1wiO1xyXG4gICAgICAgIGNvbnN0IHNhID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudChzZXJ2aWNlQWNjb3VudE5hbWUsIHtcclxuICAgICAgICAgICAgbmFtZTogc2VydmljZUFjY291bnROYW1lLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2U6IHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhLFxyXG5cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgc2Eubm9kZS5hZGREZXBlbmRlbmN5KG5zKTtcclxuICAgICAgICBzYS5yb2xlLmF0dGFjaElubGluZVBvbGljeShuZXcgUG9saWN5KGNsdXN0ZXIuc3RhY2ssICdla3MtY29ubmVjdC1wb2xpY3knLCAge1xyXG4gICAgICAgICAgICBkb2N1bWVudDogUG9saWN5RG9jdW1lbnQuZnJvbUpzb24oe1xyXG4gICAgICAgICAgICAgICAgXCJWZXJzaW9uXCI6IFwiMjAxMi0xMC0xN1wiLFxyXG4gICAgICAgICAgICAgICAgXCJTdGF0ZW1lbnRcIjogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXCJzdHM6QXNzdW1lUm9sZVwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBgJHt0aGlzLm9wdGlvbnMuY2x1c3RlckFjY2Vzc1JvbGUucm9sZUFybn1gXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1wiZWtzOipcIl0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogYCpgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9KX0pKTtcclxuXHJcbiAgICAgICAgY2x1c3RlckluZm8uYWRkQWRkT25Db250ZXh0KFVwYm91bmRDcm9zc3BsYW5lQWRkT24ubmFtZSwge1xyXG4gICAgICAgICAgICBhcm46IHNhLnJvbGUucm9sZUFyblxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBuZXcgY2RrLkNmbk91dHB1dChjbHVzdGVyLnN0YWNrLCAncHJvdmlkZXJhd3NzYWlhbXJvbGUnLFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB2YWx1ZTogc2Eucm9sZS5yb2xlQXJuLFxyXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdwcm92aWRlciBBV1MgSUFNIHJvbGUnLFxyXG4gICAgICAgICAgICAgICAgZXhwb3J0TmFtZSA6ICdwcm92aWRlcmF3c3NhaWFtcm9sZSdcclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGxldCB2YWx1ZXM6IFZhbHVlcyA9IHRoaXMub3B0aW9ucy52YWx1ZXMgPz8ge307XHJcbiAgICAgICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB2YWx1ZXMpO1xyXG5cclxuICAgICAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB2YWx1ZXMsIGZhbHNlLCB0cnVlKTtcclxuICAgICAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gICAgfVxyXG59Il19