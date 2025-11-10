"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreDnsAddOn = void 0;
const utils = require("../../utils");
const core_addon_1 = require("../core-addon");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_eks_2 = require("aws-cdk-lib/aws-eks");
const versionMap = new Map([
    [aws_eks_2.KubernetesVersion.V1_33, "v1.12.1-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_32, "v1.11.4-eksbuild.2"],
    [aws_eks_2.KubernetesVersion.V1_31, "v1.11.3-eksbuild.1"],
    [aws_eks_2.KubernetesVersion.V1_30, "v1.11.1-eksbuild.8"],
    [aws_eks_2.KubernetesVersion.V1_29, "v1.11.1-eksbuild.4"],
    [aws_eks_2.KubernetesVersion.V1_28, "v1.10.1-eksbuild.4"],
    [aws_eks_2.KubernetesVersion.V1_27, "v1.10.1-eksbuild.4"],
    [aws_eks_2.KubernetesVersion.V1_26, "v1.9.3-eksbuild.7"],
]);
const defaultProps = {
    addOnName: 'coredns',
    versionMap: versionMap,
    saName: 'coredns',
    configurationValues: {}
};
/**
 * Implementation of CoreDns EKS add-on.
 */
let CoreDnsAddOn = class CoreDnsAddOn extends core_addon_1.CoreAddOn {
    constructor(version, props) {
        super({
            version: version ?? "auto",
            ...defaultProps,
            ...props
        });
    }
    deploy(clusterInfo) {
        const addonPromise = super.deploy(clusterInfo);
        if (clusterInfo.cluster instanceof aws_eks_1.FargateCluster) {
            this.handleFargatePatch(addonPromise);
        }
        return addonPromise;
    }
    /**
     *  Retain the addon otherwise cluster destroy will fail due to CoreDnsComputeTypePatch
     *  https://github.com/aws/aws-cdk/issues/28621
     */
    handleFargatePatch(addonPromise) {
        addonPromise.then(addon => {
            if (addon instanceof aws_eks_1.CfnAddon) {
                addon.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE);
            }
        });
    }
};
exports.CoreDnsAddOn = CoreDnsAddOn;
__decorate([
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.VERSION_UNKNOWN)
], CoreDnsAddOn.prototype, "deploy", null);
exports.CoreDnsAddOn = CoreDnsAddOn = __decorate([
    utils.supportsALL
], CoreDnsAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2NvcmVkbnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBRUEscUNBQXFDO0FBQ3JDLDhDQUEwRDtBQUMxRCxpREFBK0Q7QUFDL0QsNkNBQTRDO0FBQzVDLGlEQUF3RDtBQUN4RCxNQUFNLFVBQVUsR0FBbUMsSUFBSSxHQUFHLENBQUM7SUFDdkQsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsb0JBQW9CLENBQUM7SUFDL0MsQ0FBQywyQkFBaUIsQ0FBQyxLQUFLLEVBQUUsbUJBQW1CLENBQUM7Q0FDakQsQ0FBQyxDQUFDO0FBUUgsTUFBTSxZQUFZLEdBQUc7SUFDakIsU0FBUyxFQUFFLFNBQVM7SUFDcEIsVUFBVSxFQUFFLFVBQVU7SUFDdEIsTUFBTSxFQUFFLFNBQVM7SUFDakIsbUJBQW1CLEVBQUUsRUFBRTtDQUMxQixDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLFlBQVksR0FBbEIsTUFBTSxZQUFhLFNBQVEsc0JBQVM7SUFFdkMsWUFBWSxPQUFnQixFQUFFLEtBQXlCO1FBQ25ELEtBQUssQ0FBQztZQUNGLE9BQU8sRUFBRSxPQUFPLElBQUksTUFBTTtZQUMxQixHQUFJLFlBQVk7WUFDaEIsR0FBSSxLQUFLO1NBQ1osQ0FBQyxDQUFDO0lBQ1AsQ0FBQztJQUdELE1BQU0sQ0FBQyxXQUF3QjtRQUUzQixNQUFNLFlBQVksR0FBdUIsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVuRSxJQUFHLFdBQVcsQ0FBQyxPQUFPLFlBQVksd0JBQWMsRUFBQyxDQUFDO1lBQzlDLElBQUksQ0FBQyxrQkFBa0IsQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMxQyxDQUFDO1FBQ0QsT0FBTyxZQUFZLENBQUM7SUFDeEIsQ0FBQztJQUVEOzs7T0FHRztJQUNILGtCQUFrQixDQUFFLFlBQWdDO1FBQ2hELFlBQVksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUU7WUFDdEIsSUFBRyxLQUFLLFlBQVksa0JBQVEsRUFBQyxDQUFDO2dCQUMxQixLQUFLLENBQUMsa0JBQWtCLENBQUMsMkJBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1lBQ3ZFLENBQUM7UUFDTCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7Q0FDSixDQUFBO0FBaENZLG9DQUFZO0FBV3JCO0lBREMsS0FBSyxDQUFDLHFCQUFxQixDQUFDLEtBQUssQ0FBQyxvQkFBb0IsQ0FBQyxlQUFlLENBQUM7MENBU3ZFO3VCQW5CUSxZQUFZO0lBRHhCLEtBQUssQ0FBQyxXQUFXO0dBQ0wsWUFBWSxDQWdDeEIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0ICogYXMgdXRpbHMgZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IENvcmVBZGRPbiwgQ29yZUFkZE9uUHJvcHMgfSBmcm9tIFwiLi4vY29yZS1hZGRvblwiO1xyXG5pbXBvcnQgeyBDZm5BZGRvbiwgRmFyZ2F0ZUNsdXN0ZXIgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgeyBSZW1vdmFsUG9saWN5IH0gZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCB7IEt1YmVybmV0ZXNWZXJzaW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuY29uc3QgdmVyc2lvbk1hcDogTWFwPEt1YmVybmV0ZXNWZXJzaW9uLCBzdHJpbmc+ID0gbmV3IE1hcChbXHJcbiAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzMsIFwidjEuMTIuMS1la3NidWlsZC4yXCJdLFxyXG4gICAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzMyLCBcInYxLjExLjQtZWtzYnVpbGQuMlwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMSwgXCJ2MS4xMS4zLWVrc2J1aWxkLjFcIl0sXHJcbiAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzAsIFwidjEuMTEuMS1la3NidWlsZC44XCJdLFxyXG4gICAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI5LCBcInYxLjExLjEtZWtzYnVpbGQuNFwiXSxcclxuICAgIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yOCwgXCJ2MS4xMC4xLWVrc2J1aWxkLjRcIl0sXHJcbiAgICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjcsIFwidjEuMTAuMS1la3NidWlsZC40XCJdLFxyXG4gICAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI2LCBcInYxLjkuMy1la3NidWlsZC43XCJdLFxyXG5dKTtcclxuXHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgY29yZWRucyBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBDb3JlRG5zQWRkT25Qcm9wcyA9IE9taXQ8Q29yZUFkZE9uUHJvcHMsIFwic2FOYW1lXCIgfCBcImFkZE9uTmFtZVwiIHwgXCJ2ZXJzaW9uXCIgPjtcclxuXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIGFkZE9uTmFtZTogJ2NvcmVkbnMnLFxyXG4gICAgdmVyc2lvbk1hcDogdmVyc2lvbk1hcCxcclxuICAgIHNhTmFtZTogJ2NvcmVkbnMnLFxyXG4gICAgY29uZmlndXJhdGlvblZhbHVlczoge31cclxufTtcclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBDb3JlRG5zIEVLUyBhZGQtb24uXHJcbiAqL1xyXG5AdXRpbHMuc3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIENvcmVEbnNBZGRPbiBleHRlbmRzIENvcmVBZGRPbiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IodmVyc2lvbj86IHN0cmluZywgcHJvcHM/OiBDb3JlRG5zQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHtcclxuICAgICAgICAgICAgdmVyc2lvbjogdmVyc2lvbiA/PyBcImF1dG9cIixcclxuICAgICAgICAgICAgLi4uIGRlZmF1bHRQcm9wcyxcclxuICAgICAgICAgICAgLi4uIHByb3BzXHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgQHV0aWxzLmNvbmZsaWN0c1dpdGhBdXRvTW9kZSh1dGlscy5BdXRvTW9kZUNvbmZsaWN0VHlwZS5WRVJTSU9OX1VOS05PV04pXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuXHJcbiAgICAgICAgY29uc3QgYWRkb25Qcm9taXNlOiBQcm9taXNlPENvbnN0cnVjdD4gPSBzdXBlci5kZXBsb3koY2x1c3RlckluZm8pO1xyXG5cclxuICAgICAgICBpZihjbHVzdGVySW5mby5jbHVzdGVyIGluc3RhbmNlb2YgRmFyZ2F0ZUNsdXN0ZXIpe1xyXG4gICAgICAgICAgICB0aGlzLmhhbmRsZUZhcmdhdGVQYXRjaChhZGRvblByb21pc2UpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gYWRkb25Qcm9taXNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogIFJldGFpbiB0aGUgYWRkb24gb3RoZXJ3aXNlIGNsdXN0ZXIgZGVzdHJveSB3aWxsIGZhaWwgZHVlIHRvIENvcmVEbnNDb21wdXRlVHlwZVBhdGNoIFxyXG4gICAgICogIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MvYXdzLWNkay9pc3N1ZXMvMjg2MjFcclxuICAgICAqLyBcclxuICAgIGhhbmRsZUZhcmdhdGVQYXRjaCggYWRkb25Qcm9taXNlOiBQcm9taXNlPENvbnN0cnVjdD4gKXtcclxuICAgICAgICBhZGRvblByb21pc2UudGhlbihhZGRvbiA9PiB7XHJcbiAgICAgICAgICAgIGlmKGFkZG9uIGluc3RhbmNlb2YgQ2ZuQWRkb24pe1xyXG4gICAgICAgICAgICAgICAgYWRkb24uYXBwbHlSZW1vdmFsUG9saWN5KFJlbW92YWxQb2xpY3kuUkVUQUlOX09OX1VQREFURV9PUl9ERUxFVEUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSk7XHJcbiAgICB9ICAgXHJcbn1cclxuIl19