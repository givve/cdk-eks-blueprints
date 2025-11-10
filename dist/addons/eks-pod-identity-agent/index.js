"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EksPodIdentityAgentAddOn = void 0;
const core_addon_1 = require("../core-addon");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const utils = require("../../utils");
const versionMap = new Map([
    [aws_eks_1.KubernetesVersion.V1_33, "v1.3.8-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_32, "v1.3.8-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_31, "v1.3.4-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_30, "v1.3.2-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_29, "v1.3.2-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_28, "v1.3.2-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_27, "v1.3.2-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_26, "v1.3.2-eksbuild.2"],
]);
/**
 * Default values for the add-on
 */
const defaultProps = {
    addOnName: 'eks-pod-identity-agent',
    version: 'auto',
    versionMap: versionMap,
    saName: "eks-pod-identity-agent-sa",
};
/**
 * Implementation of Amazon EKS Pod Identity Agent add-on.
 */
class EksPodIdentityAgentAddOn extends core_addon_1.CoreAddOn {
    deploy(clusterInfo) {
        return super.deploy(clusterInfo);
    }
    constructor(version) {
        super({
            addOnName: defaultProps.addOnName,
            version: version ?? defaultProps.version,
            saName: defaultProps.saName,
            versionMap: defaultProps.versionMap
        });
    }
}
exports.EksPodIdentityAgentAddOn = EksPodIdentityAgentAddOn;
__decorate([
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.VERSION_MISMATCH, 'v1.3.4-eksbuild.1')
], EksPodIdentityAgentAddOn.prototype, "deploy", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2Vrcy1wb2QtaWRlbnRpdHktYWdlbnQvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEsOENBQTBDO0FBQzFDLGlEQUF3RDtBQUN4RCxxQ0FBcUM7QUFFckMsTUFBTSxVQUFVLEdBQW1DLElBQUksR0FBRyxDQUFDO0lBQ3ZELENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0lBQzlDLENBQUMsMkJBQWlCLENBQUMsS0FBSyxFQUFFLG1CQUFtQixDQUFDO0NBQ2pELENBQUMsQ0FBQztBQUVIOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUc7SUFDakIsU0FBUyxFQUFFLHdCQUF3QjtJQUNuQyxPQUFPLEVBQUUsTUFBTTtJQUNmLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSwyQkFBMkI7Q0FDdEMsQ0FBQztBQUVGOztHQUVHO0FBQ0gsTUFBYSx3QkFBeUIsU0FBUSxzQkFBUztJQUduRCxNQUFNLENBQUMsV0FBd0I7UUFDM0IsT0FBTyxLQUFLLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0lBQ3JDLENBQUM7SUFFRCxZQUFZLE9BQWdCO1FBQ3hCLEtBQUssQ0FBQztZQUNGLFNBQVMsRUFBRSxZQUFZLENBQUMsU0FBUztZQUNqQyxPQUFPLEVBQUUsT0FBTyxJQUFJLFlBQVksQ0FBQyxPQUFPO1lBQ3hDLE1BQU0sRUFBRSxZQUFZLENBQUMsTUFBTTtZQUMzQixVQUFVLEVBQUUsWUFBWSxDQUFDLFVBQVU7U0FDdEMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBZkQsNERBZUM7QUFaRztJQURDLEtBQUssQ0FBQyxxQkFBcUIsQ0FBQyxLQUFLLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUUsbUJBQW1CLENBQUM7c0RBRzdGIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IENvcmVBZGRPbiB9IGZyb20gXCIuLi9jb3JlLWFkZG9uXCI7XHJcbmltcG9ydCB7IEt1YmVybmV0ZXNWZXJzaW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG5jb25zdCB2ZXJzaW9uTWFwOiBNYXA8S3ViZXJuZXRlc1ZlcnNpb24sIHN0cmluZz4gPSBuZXcgTWFwKFtcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMywgXCJ2MS4zLjgtZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMiwgXCJ2MS4zLjgtZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMSwgXCJ2MS4zLjQtZWtzYnVpbGQuMVwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMCwgXCJ2MS4zLjItZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yOSwgXCJ2MS4zLjItZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yOCwgXCJ2MS4zLjItZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yNywgXCJ2MS4zLjItZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yNiwgXCJ2MS4zLjItZWtzYnVpbGQuMlwiXSxcclxuXSk7XHJcblxyXG4vKipcclxuICogRGVmYXVsdCB2YWx1ZXMgZm9yIHRoZSBhZGQtb25cclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIGFkZE9uTmFtZTogJ2Vrcy1wb2QtaWRlbnRpdHktYWdlbnQnLFxyXG4gICAgdmVyc2lvbjogJ2F1dG8nLFxyXG4gICAgdmVyc2lvbk1hcDogdmVyc2lvbk1hcCxcclxuICAgIHNhTmFtZTogXCJla3MtcG9kLWlkZW50aXR5LWFnZW50LXNhXCIsXHJcbn07XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50YXRpb24gb2YgQW1hem9uIEVLUyBQb2QgSWRlbnRpdHkgQWdlbnQgYWRkLW9uLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEVrc1BvZElkZW50aXR5QWdlbnRBZGRPbiBleHRlbmRzIENvcmVBZGRPbiB7XHJcblxyXG4gICAgQHV0aWxzLmNvbmZsaWN0c1dpdGhBdXRvTW9kZSh1dGlscy5BdXRvTW9kZUNvbmZsaWN0VHlwZS5WRVJTSU9OX01JU01BVENILCAndjEuMy40LWVrc2J1aWxkLjEnKVxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICAgICAgcmV0dXJuIHN1cGVyLmRlcGxveShjbHVzdGVySW5mbyk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3RydWN0b3IodmVyc2lvbj86IHN0cmluZykge1xyXG4gICAgICAgIHN1cGVyKHtcclxuICAgICAgICAgICAgYWRkT25OYW1lOiBkZWZhdWx0UHJvcHMuYWRkT25OYW1lLFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiB2ZXJzaW9uID8/IGRlZmF1bHRQcm9wcy52ZXJzaW9uLFxyXG4gICAgICAgICAgICBzYU5hbWU6IGRlZmF1bHRQcm9wcy5zYU5hbWUsXHJcbiAgICAgICAgICAgIHZlcnNpb25NYXA6IGRlZmF1bHRQcm9wcy52ZXJzaW9uTWFwXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcbn1cclxuIl19