"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KubeProxyAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const utils = require("../../utils");
const core_addon_1 = require("../core-addon");
const versionMap = new Map([
    [aws_eks_1.KubernetesVersion.V1_33, "v1.33.0-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_32, "v1.32.0-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_31, "v1.31.2-eksbuild.3"],
    [aws_eks_1.KubernetesVersion.V1_30, "v1.30.0-eksbuild.3"],
    [aws_eks_1.KubernetesVersion.V1_29, "v1.29.0-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_28, "v1.28.2-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_27, "v1.27.6-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_26, "v1.26.9-eksbuild.2"],
]);
const defaultProps = {
    addOnName: "kube-proxy",
    saName: "kube-proxy",
    versionMap: versionMap,
};
/**
 * Implementation of KubeProxy EKS add-on.
 */
let KubeProxyAddOn = class KubeProxyAddOn extends core_addon_1.CoreAddOn {
    deploy(clusterInfo) {
        return super.deploy(clusterInfo);
    }
    constructor(version, props) {
        super({
            version: version ?? "auto",
            ...defaultProps,
            ...props
        });
    }
};
exports.KubeProxyAddOn = KubeProxyAddOn;
__decorate([
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.VERSION_MISMATCH, "v1.29.10-eksbuild.3")
], KubeProxyAddOn.prototype, "deploy", null);
exports.KubeProxyAddOn = KubeProxyAddOn = __decorate([
    utils.supportsALL
], KubeProxyAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2t1YmUtcHJveHkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaURBQXdEO0FBQ3hELHFDQUFxQztBQUNyQyw4Q0FBMEQ7QUFJMUQsTUFBTSxVQUFVLEdBQW1DLElBQUksR0FBRyxDQUFDO0lBQ3pELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0lBQy9DLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG9CQUFvQixDQUFDO0NBQ2hELENBQUMsQ0FBQztBQU9ILE1BQU0sWUFBWSxHQUFHO0lBQ2pCLFNBQVMsRUFBRSxZQUFZO0lBQ3ZCLE1BQU0sRUFBRSxZQUFZO0lBQ3BCLFVBQVUsRUFBRSxVQUFVO0NBQ3pCLENBQUM7QUFFRjs7R0FFRztBQUVJLElBQU0sY0FBYyxHQUFwQixNQUFNLGNBQWUsU0FBUSxzQkFBUztJQUd6QyxNQUFNLENBQUMsV0FBd0I7UUFDM0IsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxZQUFZLE9BQWdCLEVBQUUsS0FBMkI7UUFDckQsS0FBSyxDQUFDO1lBQ0YsT0FBTyxFQUFFLE9BQU8sSUFBSSxNQUFNO1lBQzFCLEdBQUksWUFBWTtZQUNoQixHQUFJLEtBQUs7U0FDWixDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0osQ0FBQTtBQWRZLHdDQUFjO0FBR3ZCO0lBREMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxnQkFBZ0IsRUFBRSxxQkFBcUIsQ0FBQzs0Q0FHL0Y7eUJBTFEsY0FBYztJQUQxQixLQUFLLENBQUMsV0FBVztHQUNMLGNBQWMsQ0FjMUIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBLdWJlcm5ldGVzVmVyc2lvbiB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcbmltcG9ydCAqIGFzIHV0aWxzIGZyb20gXCIuLi8uLi91dGlsc1wiO1xyXG5pbXBvcnQgeyBDb3JlQWRkT24sIENvcmVBZGRPblByb3BzIH0gZnJvbSBcIi4uL2NvcmUtYWRkb25cIjtcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tIFwiLi4vLi4vc3BpL3R5cGVzXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcblxyXG5jb25zdCB2ZXJzaW9uTWFwOiBNYXA8S3ViZXJuZXRlc1ZlcnNpb24sIHN0cmluZz4gPSBuZXcgTWFwKFtcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzMsIFwidjEuMzMuMC1la3NidWlsZC4yXCJdLFxyXG4gIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMiwgXCJ2MS4zMi4wLWVrc2J1aWxkLjJcIl0sXHJcbiAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzMxLCBcInYxLjMxLjItZWtzYnVpbGQuM1wiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzAsIFwidjEuMzAuMC1la3NidWlsZC4zXCJdLFxyXG4gIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yOSwgXCJ2MS4yOS4wLWVrc2J1aWxkLjFcIl0sXHJcbiAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI4LCBcInYxLjI4LjItZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjcsIFwidjEuMjcuNi1la3NidWlsZC4yXCJdLFxyXG4gIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yNiwgXCJ2MS4yNi45LWVrc2J1aWxkLjJcIl0sXHJcbl0pO1xyXG5cclxuLyoqXHJcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGNvcmVkbnMgYWRkLW9uLlxyXG4gKi9cclxuZXhwb3J0IHR5cGUga3ViZVByb3h5QWRkT25Qcm9wcyA9IE9taXQ8Q29yZUFkZE9uUHJvcHMsIFwic2FOYW1lXCIgfCBcImFkZE9uTmFtZVwiIHwgXCJ2ZXJzaW9uXCIgPjtcclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIGFkZE9uTmFtZTogXCJrdWJlLXByb3h5XCIsXHJcbiAgICBzYU5hbWU6IFwia3ViZS1wcm94eVwiLFxyXG4gICAgdmVyc2lvbk1hcDogdmVyc2lvbk1hcCxcclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBLdWJlUHJveHkgRUtTIGFkZC1vbi5cclxuICovXHJcbkB1dGlscy5zdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgS3ViZVByb3h5QWRkT24gZXh0ZW5kcyBDb3JlQWRkT24ge1xyXG5cclxuICAgIEB1dGlscy5jb25mbGljdHNXaXRoQXV0b01vZGUodXRpbHMuQXV0b01vZGVDb25mbGljdFR5cGUuVkVSU0lPTl9NSVNNQVRDSCwgXCJ2MS4yOS4xMC1la3NidWlsZC4zXCIpXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICByZXR1cm4gc3VwZXIuZGVwbG95KGNsdXN0ZXJJbmZvKTtcclxuICAgIH1cclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih2ZXJzaW9uPzogc3RyaW5nLCBwcm9wcz86IGt1YmVQcm94eUFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7XHJcbiAgICAgICAgICAgIHZlcnNpb246IHZlcnNpb24gPz8gXCJhdXRvXCIsXHJcbiAgICAgICAgICAgIC4uLiBkZWZhdWx0UHJvcHMsXHJcbiAgICAgICAgICAgIC4uLiBwcm9wc1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==