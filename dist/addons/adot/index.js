"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdotCollectorAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const utils_1 = require("../../utils");
const cert_manager_1 = require("../cert-manager");
const core_addon_1 = require("../core-addon");
const iam_policy_1 = require("./iam-policy");
const aws_eks_2 = require("aws-cdk-lib/aws-eks");
const versionMap = new Map([
    [aws_eks_2.KubernetesVersion.V1_33, "v0.131.0-eksbuild.1"],
    [aws_eks_2.KubernetesVersion.V1_32, "v0.131.0-eksbuild.1"],
    [aws_eks_2.KubernetesVersion.V1_31, "v0.109.0-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_30, "v0.109.0-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_29, "v0.109.0-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_28, "v0.109.0-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_27, "v0.109.0-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_26, "v0.109.0-eksbuild.2"],
]);
const defaultProps = {
    addOnName: 'adot',
    version: 'auto',
    versionMap: versionMap,
    saName: 'adot-collector',
    policyDocumentProvider: iam_policy_1.getAdotCollectorPolicyDocument,
    namespace: 'default',
    configurationValues: {}
};
/**
 * Implementation of Adot Collector EKS add-on.
 */
let AdotCollectorAddOn = class AdotCollectorAddOn extends core_addon_1.CoreAddOn {
    constructor(props) {
        super({
            ...defaultProps,
            ...props,
            namespace: props?.namespace ?? defaultProps.namespace,
            version: props?.version ?? defaultProps.version
        });
    }
    deploy(clusterInfo) {
        const addOnPromise = super.deploy(clusterInfo);
        return addOnPromise;
    }
    /**
     * Overriding base class method to create namespace and register permissions.
     * @param clusterInfo
     * @param name
     * @returns
     */
    createNamespace(clusterInfo, namespaceName) {
        // Create namespace if not default
        const cluster = clusterInfo.cluster;
        const ns = (0, utils_1.createNamespace)(namespaceName, cluster, true, true);
        // Applying ADOT Permission manifest
        const otelPermissionsDoc = (0, utils_1.readYamlDocument)(__dirname + '/otel-permissions.yaml');
        const otelPermissionsManifest = otelPermissionsDoc.split("---").map(e => (0, utils_1.loadYaml)(e));
        const otelPermissionsStatement = new aws_eks_1.KubernetesManifest(cluster.stack, "adot-addon-otelPermissions", {
            cluster,
            manifest: otelPermissionsManifest,
            overwrite: true,
        });
        otelPermissionsStatement.node.addDependency(ns);
        return otelPermissionsStatement;
    }
};
exports.AdotCollectorAddOn = AdotCollectorAddOn;
__decorate([
    (0, utils_1.dependable)(cert_manager_1.CertManagerAddOn.name)
], AdotCollectorAddOn.prototype, "deploy", null);
exports.AdotCollectorAddOn = AdotCollectorAddOn = __decorate([
    utils_1.supportsALL
], AdotCollectorAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2Fkb3QvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaURBQXlEO0FBR3pELHVDQUFtRztBQUNuRyxrREFBbUQ7QUFDbkQsOENBQTBEO0FBQzFELDZDQUE4RDtBQUM5RCxpREFBd0Q7QUFFeEQsTUFBTSxVQUFVLEdBQW1DLElBQUksR0FBRyxDQUFDO0lBQ3pELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0lBQ2hELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLHFCQUFxQixDQUFDO0NBQ2pELENBQUMsQ0FBQztBQVNILE1BQU0sWUFBWSxHQUFHO0lBQ2pCLFNBQVMsRUFBRSxNQUFNO0lBQ2pCLE9BQU8sRUFBRSxNQUFNO0lBQ2YsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLGdCQUFnQjtJQUN4QixzQkFBc0IsRUFBRSwyQ0FBOEI7SUFDdEQsU0FBUyxFQUFFLFNBQVM7SUFDcEIsbUJBQW1CLEVBQUUsRUFBRTtDQUMxQixDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLHNCQUFTO0lBRTdDLFlBQVksS0FBK0I7UUFDdkMsS0FBSyxDQUFDO1lBQ0YsR0FBRyxZQUFZO1lBQ2YsR0FBRyxLQUFLO1lBQ1IsU0FBUyxFQUFFLEtBQUssRUFBRSxTQUFTLElBQUksWUFBWSxDQUFDLFNBQVM7WUFDckQsT0FBTyxFQUFFLEtBQUssRUFBRSxPQUFPLElBQUksWUFBWSxDQUFDLE9BQU87U0FDbEQsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUdELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLFlBQVksR0FBRyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQy9DLE9BQU8sWUFBWSxDQUFDO0lBQ3hCLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILGVBQWUsQ0FBQyxXQUF3QixFQUFFLGFBQXFCO1FBQzNELGtDQUFrQztRQUNsQyxNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLE1BQU0sRUFBRSxHQUFHLElBQUEsdUJBQWUsRUFBQyxhQUFhLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUvRCxvQ0FBb0M7UUFDcEMsTUFBTSxrQkFBa0IsR0FBRyxJQUFBLHdCQUFnQixFQUFDLFNBQVMsR0FBRyx3QkFBd0IsQ0FBQyxDQUFDO1FBQ2xGLE1BQU0sdUJBQXVCLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUEsZ0JBQVEsRUFBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ3RGLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSw0QkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLDRCQUE0QixFQUFFO1lBQ2pHLE9BQU87WUFDUCxRQUFRLEVBQUUsdUJBQXVCO1lBQ2pDLFNBQVMsRUFBRSxJQUFJO1NBQ2xCLENBQUMsQ0FBQztRQUVILHdCQUF3QixDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUM7UUFDaEQsT0FBTyx3QkFBd0IsQ0FBQztJQUNwQyxDQUFDO0NBQ0osQ0FBQTtBQXhDWSxnREFBa0I7QUFZM0I7SUFEQyxJQUFBLGtCQUFVLEVBQUMsK0JBQWdCLENBQUMsSUFBSSxDQUFDO2dEQUlqQzs2QkFmUSxrQkFBa0I7SUFEOUIsbUJBQVc7R0FDQyxrQkFBa0IsQ0F3QzlCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgS3ViZXJuZXRlc01hbmlmZXN0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0LCBJQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UsIGRlcGVuZGFibGUsIGxvYWRZYW1sLCByZWFkWWFtbERvY3VtZW50LCBzdXBwb3J0c0FMTCB9IGZyb20gXCIuLi8uLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBDZXJ0TWFuYWdlckFkZE9uIH0gZnJvbSBcIi4uL2NlcnQtbWFuYWdlclwiO1xyXG5pbXBvcnQgeyBDb3JlQWRkT24sIENvcmVBZGRPblByb3BzIH0gZnJvbSBcIi4uL2NvcmUtYWRkb25cIjtcclxuaW1wb3J0IHsgZ2V0QWRvdENvbGxlY3RvclBvbGljeURvY3VtZW50IH0gZnJvbSBcIi4vaWFtLXBvbGljeVwiO1xyXG5pbXBvcnQgeyBLdWJlcm5ldGVzVmVyc2lvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcblxyXG5jb25zdCB2ZXJzaW9uTWFwOiBNYXA8S3ViZXJuZXRlc1ZlcnNpb24sIHN0cmluZz4gPSBuZXcgTWFwKFtcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzMsIFwidjAuMTMxLjAtZWtzYnVpbGQuMVwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzIsIFwidjAuMTMxLjAtZWtzYnVpbGQuMVwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzEsIFwidjAuMTA5LjAtZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzAsIFwidjAuMTA5LjAtZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjksIFwidjAuMTA5LjAtZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjgsIFwidjAuMTA5LjAtZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjcsIFwidjAuMTA5LjAtZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjYsIFwidjAuMTA5LjAtZWtzYnVpbGQuMlwiXSxcclxuXSk7XHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgQWRvdCBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBBZG90Q29sbGVjdG9yQWRkT25Qcm9wcyA9IFBhcnRpYWw8T21pdDxDb3JlQWRkT25Qcm9wcywgXCJhZGRPbk5hbWVcIiB8IFwic2FOYW1lXCI+PiAmIHtcclxuICAgIG5hbWVzcGFjZT86IHN0cmluZztcclxufTtcclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIGFkZE9uTmFtZTogJ2Fkb3QnLFxyXG4gICAgdmVyc2lvbjogJ2F1dG8nLFxyXG4gICAgdmVyc2lvbk1hcDogdmVyc2lvbk1hcCxcclxuICAgIHNhTmFtZTogJ2Fkb3QtY29sbGVjdG9yJyxcclxuICAgIHBvbGljeURvY3VtZW50UHJvdmlkZXI6IGdldEFkb3RDb2xsZWN0b3JQb2xpY3lEb2N1bWVudCxcclxuICAgIG5hbWVzcGFjZTogJ2RlZmF1bHQnLFxyXG4gICAgY29uZmlndXJhdGlvblZhbHVlczoge31cclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBBZG90IENvbGxlY3RvciBFS1MgYWRkLW9uLlxyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBBZG90Q29sbGVjdG9yQWRkT24gZXh0ZW5kcyBDb3JlQWRkT24ge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQWRvdENvbGxlY3RvckFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7XHJcbiAgICAgICAgICAgIC4uLmRlZmF1bHRQcm9wcyxcclxuICAgICAgICAgICAgLi4ucHJvcHMsXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogcHJvcHM/Lm5hbWVzcGFjZSA/PyBkZWZhdWx0UHJvcHMubmFtZXNwYWNlLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiBwcm9wcz8udmVyc2lvbiA/PyBkZWZhdWx0UHJvcHMudmVyc2lvblxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIEBkZXBlbmRhYmxlKENlcnRNYW5hZ2VyQWRkT24ubmFtZSlcclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGNvbnN0IGFkZE9uUHJvbWlzZSA9IHN1cGVyLmRlcGxveShjbHVzdGVySW5mbyk7XHJcbiAgICAgICAgcmV0dXJuIGFkZE9uUHJvbWlzZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE92ZXJyaWRpbmcgYmFzZSBjbGFzcyBtZXRob2QgdG8gY3JlYXRlIG5hbWVzcGFjZSBhbmQgcmVnaXN0ZXIgcGVybWlzc2lvbnMuXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAgICAgKiBAcGFyYW0gbmFtZSBcclxuICAgICAqIEByZXR1cm5zIFxyXG4gICAgICovXHJcbiAgICBjcmVhdGVOYW1lc3BhY2UoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCBuYW1lc3BhY2VOYW1lOiBzdHJpbmcpOiBJQ29uc3RydWN0IHwgdW5kZWZpbmVkIHtcclxuICAgICAgICAvLyBDcmVhdGUgbmFtZXNwYWNlIGlmIG5vdCBkZWZhdWx0XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICAgICAgY29uc3QgbnMgPSBjcmVhdGVOYW1lc3BhY2UobmFtZXNwYWNlTmFtZSwgY2x1c3RlciwgdHJ1ZSwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIC8vIEFwcGx5aW5nIEFET1QgUGVybWlzc2lvbiBtYW5pZmVzdFxyXG4gICAgICAgIGNvbnN0IG90ZWxQZXJtaXNzaW9uc0RvYyA9IHJlYWRZYW1sRG9jdW1lbnQoX19kaXJuYW1lICsgJy9vdGVsLXBlcm1pc3Npb25zLnlhbWwnKTtcclxuICAgICAgICBjb25zdCBvdGVsUGVybWlzc2lvbnNNYW5pZmVzdCA9IG90ZWxQZXJtaXNzaW9uc0RvYy5zcGxpdChcIi0tLVwiKS5tYXAoZSA9PiBsb2FkWWFtbChlKSk7XHJcbiAgICAgICAgY29uc3Qgb3RlbFBlcm1pc3Npb25zU3RhdGVtZW50ID0gbmV3IEt1YmVybmV0ZXNNYW5pZmVzdChjbHVzdGVyLnN0YWNrLCBcImFkb3QtYWRkb24tb3RlbFBlcm1pc3Npb25zXCIsIHtcclxuICAgICAgICAgICAgY2x1c3RlcixcclxuICAgICAgICAgICAgbWFuaWZlc3Q6IG90ZWxQZXJtaXNzaW9uc01hbmlmZXN0LFxyXG4gICAgICAgICAgICBvdmVyd3JpdGU6IHRydWUsXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIG90ZWxQZXJtaXNzaW9uc1N0YXRlbWVudC5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG4gICAgICAgIHJldHVybiBvdGVsUGVybWlzc2lvbnNTdGF0ZW1lbnQ7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==