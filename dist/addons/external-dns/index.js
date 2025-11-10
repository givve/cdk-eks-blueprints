"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExternalDnsAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const helm_addon_1 = require("../helm-addon");
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const defaultProps = {
    name: 'external-dns',
    chart: 'external-dns',
    namespace: 'external-dns',
    repository: 'https://kubernetes-sigs.github.io/external-dns/',
    release: 'blueprints-addon-external-dns',
    version: '1.19.0',
    values: {},
};
/**
 * Implementation of the External DNS service: https://github.com/kubernetes-sigs/external-dns/.
 * It is required to integrate with Route53 for external DNS resolution.
 */
let ExternalDnsAddOn = class ExternalDnsAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const region = clusterInfo.cluster.stack.region;
        const cluster = clusterInfo.cluster;
        const namespace = this.options.namespace ?? this.options.name;
        const namespaceManifest = new aws_eks_1.KubernetesManifest(cluster.stack, `${this.props.name}-ns`, {
            cluster,
            manifest: [{
                    apiVersion: 'v1',
                    kind: 'Namespace',
                    metadata: { name: namespace },
                }],
            overwrite: true
        });
        const sa = cluster.addServiceAccount(this.props.name, { name: `${this.props.name}-sa`, namespace });
        const hostedZones = this.options.hostedZoneResources.map(e => clusterInfo.getRequiredResource(e));
        sa.addToPrincipalPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ['route53:ChangeResourceRecordSets', 'route53:ListResourceRecordSets'],
            resources: hostedZones.map(hostedZone => hostedZone.hostedZoneArn),
        }));
        sa.addToPrincipalPolicy(new aws_iam_1.PolicyStatement({
            effect: aws_iam_1.Effect.ALLOW,
            actions: ['route53:ListHostedZones'],
            resources: ['*'],
        }));
        sa.node.addDependency(namespaceManifest);
        // Create a --zone-id-filter arg for each hosted zone
        const zoneIdFilterArgs = hostedZones.map((hostedZone) => `--zone-id-filter=${hostedZone.hostedZoneId}`);
        let values = {
            provider: "aws",
            extraArgs: zoneIdFilterArgs,
            aws: {
                region,
            },
            serviceAccount: {
                create: false,
                name: sa.serviceAccountName,
            },
        };
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const sources = this.options.sources;
        if (sources) {
            values.sources = sources;
        }
        const chart = this.addHelmChart(clusterInfo, values);
        chart.node.addDependency(namespaceManifest);
        // return the Promise Construct for any teams that may depend on this
        return Promise.resolve(chart);
    }
};
exports.ExternalDnsAddOn = ExternalDnsAddOn;
exports.ExternalDnsAddOn = ExternalDnsAddOn = __decorate([
    utils_1.supportsALL
], ExternalDnsAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2V4dGVybmFsLWRucy9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpREFBeUQ7QUFDekQsaURBQThEO0FBSTlELDhDQUE4RDtBQUM5RCwrQ0FBcUM7QUFDckMsdUNBQTBDO0FBa0IxQyxNQUFNLFlBQVksR0FBRztJQUNqQixJQUFJLEVBQUUsY0FBYztJQUNwQixLQUFLLEVBQUUsY0FBYztJQUNyQixTQUFTLEVBQUUsY0FBYztJQUN6QixVQUFVLEVBQUUsaURBQWlEO0lBQzdELE9BQU8sRUFBRSwrQkFBK0I7SUFDeEMsT0FBTyxFQUFFLFFBQVE7SUFDakIsTUFBTSxFQUFFLEVBQUU7Q0FDYixDQUFDO0FBRUY7OztHQUdHO0FBRUksSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBaUIsU0FBUSxzQkFBUztJQUVuQyxPQUFPLENBQW1CO0lBRWxDLFlBQVksS0FBdUI7UUFDL0IsS0FBSyxDQUFDLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3JDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQXlCLENBQUM7SUFDbEQsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE1BQU0sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUM7UUFDaEQsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQztRQUU5RCxNQUFNLGlCQUFpQixHQUFHLElBQUksNEJBQWtCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUU7WUFDckYsT0FBTztZQUNQLFFBQVEsRUFBRSxDQUFDO29CQUNQLFVBQVUsRUFBRSxJQUFJO29CQUNoQixJQUFJLEVBQUUsV0FBVztvQkFDakIsUUFBUSxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtpQkFDaEMsQ0FBQztZQUNGLFNBQVMsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQztRQUVILE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUMsQ0FBQztRQUVwRyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBYyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBRS9HLEVBQUUsQ0FBQyxvQkFBb0IsQ0FDbkIsSUFBSSx5QkFBZSxDQUFDO1lBQ2hCLE1BQU0sRUFBRSxnQkFBTSxDQUFDLEtBQUs7WUFDcEIsT0FBTyxFQUFFLENBQUMsa0NBQWtDLEVBQUUsZ0NBQWdDLENBQUM7WUFDL0UsU0FBUyxFQUFFLFdBQVcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxVQUFXLENBQUMsYUFBYSxDQUFDO1NBQ3RFLENBQUMsQ0FDTCxDQUFDO1FBRUYsRUFBRSxDQUFDLG9CQUFvQixDQUNuQixJQUFJLHlCQUFlLENBQUM7WUFDaEIsTUFBTSxFQUFFLGdCQUFNLENBQUMsS0FBSztZQUNwQixPQUFPLEVBQUUsQ0FBQyx5QkFBeUIsQ0FBQztZQUNwQyxTQUFTLEVBQUUsQ0FBQyxHQUFHLENBQUM7U0FDbkIsQ0FBQyxDQUNMLENBQUM7UUFFRixFQUFFLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBRXpDLHFEQUFxRDtRQUNyRCxNQUFNLGdCQUFnQixHQUFHLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRSxDQUFDLG9CQUFvQixVQUFXLENBQUMsWUFBWSxFQUFFLENBQUMsQ0FBQztRQUV6RyxJQUFJLE1BQU0sR0FBVztZQUNqQixRQUFRLEVBQUUsS0FBSztZQUNmLFNBQVMsRUFBRSxnQkFBZ0I7WUFDM0IsR0FBRyxFQUFFO2dCQUNILE1BQU07YUFDUDtZQUNELGNBQWMsRUFBRTtnQkFDZCxNQUFNLEVBQUUsS0FBSztnQkFDYixJQUFJLEVBQUUsRUFBRSxDQUFDLGtCQUFrQjthQUM1QjtTQUNKLENBQUM7UUFFRixNQUFNLEdBQUcsSUFBQSxvQkFBSyxFQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUMsQ0FBQztRQUVoRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztRQUVyQyxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQ1YsTUFBTSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7UUFDN0IsQ0FBQztRQUVELE1BQU0sS0FBSyxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRXJELEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDNUMscUVBQXFFO1FBQ3JFLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNsQyxDQUFDO0NBQ0osQ0FBQTtBQTNFWSw0Q0FBZ0I7MkJBQWhCLGdCQUFnQjtJQUQ1QixtQkFBVztHQUNDLGdCQUFnQixDQTJFNUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBLdWJlcm5ldGVzTWFuaWZlc3QgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWtzJztcclxuaW1wb3J0IHsgRWZmZWN0LCBQb2xpY3lTdGF0ZW1lbnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcclxuaW1wb3J0IHsgSUhvc3RlZFpvbmUgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtcm91dGU1Myc7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gJy4uL2hlbG0tYWRkb24nO1xyXG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJ0cy1kZWVwbWVyZ2VcIjtcclxuaW1wb3J0IHsgc3VwcG9ydHNBTEwgfSBmcm9tICcuLi8uLi91dGlscyc7XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGV4dGVybmFsIEROUyBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEV4dGVybmFsRG5zUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lcyBvZiBob3N0ZWQgem9uZSBwcm92aWRlciBuYW1lZCByZXNvdXJjZXMgKEBzZWUgTG9va3VwSG9zdGVkWm9uZVByb3ZpZGVyKSBmb3IgZXh0ZXJuYWwgRE5TLlxyXG4gICAgICogSG9zdGVkIHpvbmUgcHJvdmlkZXJzIGFyZSByZWdpc3RlcmVkIGFzIG5hbWVkIHJlc291cmNlIHByb3ZpZGVycyB3aXRoIHRoZSBFa3NCbHVlcHJpbnRQcm9wcy5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgaG9zdGVkWm9uZVJlc291cmNlczogc3RyaW5nW107XHJcbiAgICAvKipcclxuICAgICAqIExpc3Qgb2Ygc291cmNlcyB0byB3YXRjaCB3aGVuIHN5bnRoZXNpemluZyBETlMgcmVjb3Jkcy4gIElmIGVtcHR5LCB0aGUgZGVmYXVsdCB0eXBlcyBhcmUgXCJzZXJ2aWNlXCIgYW5kIFwiaW5ncmVzc1wiLlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBzb3VyY2VzPzogc3RyaW5nW107XHJcbn1cclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIG5hbWU6ICdleHRlcm5hbC1kbnMnLFxyXG4gICAgY2hhcnQ6ICdleHRlcm5hbC1kbnMnLFxyXG4gICAgbmFtZXNwYWNlOiAnZXh0ZXJuYWwtZG5zJyxcclxuICAgIHJlcG9zaXRvcnk6ICdodHRwczovL2t1YmVybmV0ZXMtc2lncy5naXRodWIuaW8vZXh0ZXJuYWwtZG5zLycsXHJcbiAgICByZWxlYXNlOiAnYmx1ZXByaW50cy1hZGRvbi1leHRlcm5hbC1kbnMnLFxyXG4gICAgdmVyc2lvbjogJzEuMTkuMCcsXHJcbiAgICB2YWx1ZXM6IHt9LFxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBFeHRlcm5hbCBETlMgc2VydmljZTogaHR0cHM6Ly9naXRodWIuY29tL2t1YmVybmV0ZXMtc2lncy9leHRlcm5hbC1kbnMvLlxyXG4gKiBJdCBpcyByZXF1aXJlZCB0byBpbnRlZ3JhdGUgd2l0aCBSb3V0ZTUzIGZvciBleHRlcm5hbCBETlMgcmVzb2x1dGlvbi4gXHJcbiAqL1xyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIEV4dGVybmFsRG5zQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICAgIHByaXZhdGUgb3B0aW9uczogRXh0ZXJuYWxEbnNQcm9wcztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wczogRXh0ZXJuYWxEbnNQcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsgLi4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzIGFzIEV4dGVybmFsRG5zUHJvcHM7XHJcbiAgICB9XHJcblxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICAgICAgY29uc3QgcmVnaW9uID0gY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjay5yZWdpb247XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlID0gdGhpcy5vcHRpb25zLm5hbWVzcGFjZSA/PyB0aGlzLm9wdGlvbnMubmFtZTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZXNwYWNlTWFuaWZlc3QgPSBuZXcgS3ViZXJuZXRlc01hbmlmZXN0KGNsdXN0ZXIuc3RhY2ssIGAke3RoaXMucHJvcHMubmFtZX0tbnNgLCB7XHJcbiAgICAgICAgICAgIGNsdXN0ZXIsXHJcbiAgICAgICAgICAgIG1hbmlmZXN0OiBbe1xyXG4gICAgICAgICAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcclxuICAgICAgICAgICAgICAgIGtpbmQ6ICdOYW1lc3BhY2UnLFxyXG4gICAgICAgICAgICAgICAgbWV0YWRhdGE6IHsgbmFtZTogbmFtZXNwYWNlIH0sXHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBvdmVyd3JpdGU6IHRydWVcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc2EgPSBjbHVzdGVyLmFkZFNlcnZpY2VBY2NvdW50KHRoaXMucHJvcHMubmFtZSwgeyBuYW1lOiBgJHt0aGlzLnByb3BzLm5hbWV9LXNhYCwgbmFtZXNwYWNlIH0pO1xyXG5cclxuICAgICAgICBjb25zdCBob3N0ZWRab25lcyA9IHRoaXMub3B0aW9ucy5ob3N0ZWRab25lUmVzb3VyY2VzLm1hcChlID0+IGNsdXN0ZXJJbmZvLmdldFJlcXVpcmVkUmVzb3VyY2U8SUhvc3RlZFpvbmU+KGUpKTtcclxuXHJcbiAgICAgICAgc2EuYWRkVG9QcmluY2lwYWxQb2xpY3koXHJcbiAgICAgICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3JvdXRlNTM6Q2hhbmdlUmVzb3VyY2VSZWNvcmRTZXRzJywgJ3JvdXRlNTM6TGlzdFJlc291cmNlUmVjb3JkU2V0cyddLFxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBob3N0ZWRab25lcy5tYXAoaG9zdGVkWm9uZSA9PiBob3N0ZWRab25lIS5ob3N0ZWRab25lQXJuKSxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgc2EuYWRkVG9QcmluY2lwYWxQb2xpY3koXHJcbiAgICAgICAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBFZmZlY3QuQUxMT1csXHJcbiAgICAgICAgICAgICAgICBhY3Rpb25zOiBbJ3JvdXRlNTM6TGlzdEhvc3RlZFpvbmVzJ10sXHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddLFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICBzYS5ub2RlLmFkZERlcGVuZGVuY3kobmFtZXNwYWNlTWFuaWZlc3QpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgYSAtLXpvbmUtaWQtZmlsdGVyIGFyZyBmb3IgZWFjaCBob3N0ZWQgem9uZVxyXG4gICAgICAgIGNvbnN0IHpvbmVJZEZpbHRlckFyZ3MgPSBob3N0ZWRab25lcy5tYXAoKGhvc3RlZFpvbmUpID0+IGAtLXpvbmUtaWQtZmlsdGVyPSR7aG9zdGVkWm9uZSEuaG9zdGVkWm9uZUlkfWApO1xyXG5cclxuICAgICAgICBsZXQgdmFsdWVzOiBWYWx1ZXMgPSB7XHJcbiAgICAgICAgICAgIHByb3ZpZGVyOiBcImF3c1wiLFxyXG4gICAgICAgICAgICBleHRyYUFyZ3M6IHpvbmVJZEZpbHRlckFyZ3MsXHJcbiAgICAgICAgICAgIGF3czoge1xyXG4gICAgICAgICAgICAgIHJlZ2lvbixcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnQ6IHtcclxuICAgICAgICAgICAgICBjcmVhdGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgIG5hbWU6IHNhLnNlcnZpY2VBY2NvdW50TmFtZSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICB2YWx1ZXMgPSBtZXJnZSh2YWx1ZXMsIHRoaXMucHJvcHMudmFsdWVzID8/IHt9KTtcclxuXHJcbiAgICAgICAgY29uc3Qgc291cmNlcyA9IHRoaXMub3B0aW9ucy5zb3VyY2VzO1xyXG5cclxuICAgICAgICBpZiAoc291cmNlcykge1xyXG4gICAgICAgICAgICB2YWx1ZXMuc291cmNlcyA9IHNvdXJjZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB2YWx1ZXMpO1xyXG5cclxuICAgICAgICBjaGFydC5ub2RlLmFkZERlcGVuZGVuY3kobmFtZXNwYWNlTWFuaWZlc3QpO1xyXG4gICAgICAgIC8vIHJldHVybiB0aGUgUHJvbWlzZSBDb25zdHJ1Y3QgZm9yIGFueSB0ZWFtcyB0aGF0IG1heSBkZXBlbmQgb24gdGhpc1xyXG4gICAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoY2hhcnQpO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==