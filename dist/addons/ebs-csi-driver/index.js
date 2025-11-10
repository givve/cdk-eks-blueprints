"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbsCsiDriverAddOn = void 0;
const core_addon_1 = require("../core-addon");
const iam_policy_1 = require("./iam-policy");
const utils = require("../../utils");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_eks_2 = require("aws-cdk-lib/aws-eks");
/* VersioMap showing the default version for 4 supported Kubernetes versions */
const versionMap = new Map([
    [aws_eks_1.KubernetesVersion.V1_33, "v1.48.0-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_32, "v1.48.0-eksbuild.2"],
    [aws_eks_1.KubernetesVersion.V1_31, "v1.42.0-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_30, "v1.36.0-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_29, "v1.36.0-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_28, "v1.36.0-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_27, "v1.36.0-eksbuild.1"],
    [aws_eks_1.KubernetesVersion.V1_26, "v1.36.0-eksbuild.1"],
]);
/**
 * Default values for the add-on
 */
const defaultProps = {
    addOnName: "aws-ebs-csi-driver",
    version: "auto",
    versionMap: versionMap,
    saName: "ebs-csi-controller-sa",
    storageClass: "gp3", // Set the default StorageClass to gp3
    allowVolumeExpansion: false,
};
/**
 * Implementation of EBS CSI Driver EKS add-on
 */
let EbsCsiDriverAddOn = class EbsCsiDriverAddOn extends core_addon_1.CoreAddOn {
    options;
    ebsProps;
    constructor(options) {
        super({
            addOnName: defaultProps.addOnName,
            version: options?.version ?? defaultProps.version,
            versionMap: defaultProps.versionMap,
            saName: defaultProps.saName,
            configurationValues: options?.configurationValues,
        });
        this.options = options;
        this.ebsProps = {
            ...defaultProps,
            ...options,
        };
    }
    providePolicyDocument(clusterInfo) {
        return (0, iam_policy_1.getEbsDriverPolicyDocument)(clusterInfo.cluster.stack.partition, this.options?.kmsKeys);
    }
    async deploy(clusterInfo) {
        const baseDeployment = await super.deploy(clusterInfo);
        const cluster = clusterInfo.cluster;
        let updateSc;
        if (this.ebsProps.storageClass) {
            // patch resource on cluster
            const patchSc = new aws_eks_2.KubernetesPatch(cluster.stack, `${cluster}-RemoveGP2SC`, {
                cluster: cluster,
                resourceName: "storageclass/gp2",
                applyPatch: {
                    metadata: {
                        annotations: {
                            "storageclass.kubernetes.io/is-default-class": "false",
                        },
                    },
                },
                restorePatch: {
                    metadata: {
                        annotations: {
                            "storageclass.kubernetes.io/is-default-class": "true",
                        },
                    },
                },
            });
            // Create and set gp3 StorageClass as cluster-wide default
            updateSc = new aws_eks_2.KubernetesManifest(cluster.stack, `${cluster}-SetDefaultSC`, {
                cluster: cluster,
                manifest: [
                    {
                        apiVersion: "storage.k8s.io/v1",
                        kind: "StorageClass",
                        metadata: {
                            name: "gp3",
                            annotations: {
                                "storageclass.kubernetes.io/is-default-class": "true",
                            },
                        },
                        provisioner: "ebs.csi.aws.com",
                        reclaimPolicy: "Delete",
                        volumeBindingMode: "WaitForFirstConsumer",
                        allowVolumeExpansion: this.ebsProps.allowVolumeExpansion,
                        parameters: {
                            type: "gp3",
                            fsType: "ext4",
                            encrypted: "true",
                        },
                    },
                ],
            });
            patchSc.node.addDependency(baseDeployment);
            updateSc.node.addDependency(patchSc);
            return updateSc;
        }
        else {
            return baseDeployment;
        }
    }
};
exports.EbsCsiDriverAddOn = EbsCsiDriverAddOn;
__decorate([
    utils.conflictsWithAutoMode(utils.AutoModeConflictType.VERSION_MISMATCH, "v1.37.0-eksbuild.1")
], EbsCsiDriverAddOn.prototype, "deploy", null);
exports.EbsCsiDriverAddOn = EbsCsiDriverAddOn = __decorate([
    utils.supportsALL
], EbsCsiDriverAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2Vicy1jc2ktZHJpdmVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUdBLDhDQUEwRDtBQUMxRCw2Q0FBMEQ7QUFDMUQscUNBQXFDO0FBQ3JDLGlEQUF3RDtBQUV4RCxpREFBMEU7QUFFMUUsK0VBQStFO0FBQy9FLE1BQU0sVUFBVSxHQUFtQyxJQUFJLEdBQUcsQ0FBQztJQUN6RCxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztJQUMvQyxDQUFDLDJCQUFpQixDQUFDLEtBQUssRUFBRSxvQkFBb0IsQ0FBQztDQUNoRCxDQUFDLENBQUM7QUF5Qkg7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBNEM7SUFDNUQsU0FBUyxFQUFFLG9CQUFvQjtJQUMvQixPQUFPLEVBQUUsTUFBTTtJQUNmLFVBQVUsRUFBRSxVQUFVO0lBQ3RCLE1BQU0sRUFBRSx1QkFBdUI7SUFDL0IsWUFBWSxFQUFFLEtBQUssRUFBRSxzQ0FBc0M7SUFDM0Qsb0JBQW9CLEVBQUUsS0FBSztDQUM1QixDQUFDO0FBRUY7O0dBRUc7QUFFSSxJQUFNLGlCQUFpQixHQUF2QixNQUFNLGlCQUFrQixTQUFRLHNCQUFTO0lBR3pCO0lBRlosUUFBUSxDQUF5QjtJQUUxQyxZ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LGlCQUFpQjtJQUQ3QixLQUFLLENBQUMsV0FBVztHQUNMLGlCQUFpQixDQWdHN0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBQb2xpY3lEb2N1bWVudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCAqIGFzIGttcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWttc1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgQ29yZUFkZE9uLCBDb3JlQWRkT25Qcm9wcyB9IGZyb20gXCIuLi9jb3JlLWFkZG9uXCI7XHJcbmltcG9ydCB7IGdldEVic0RyaXZlclBvbGljeURvY3VtZW50IH0gZnJvbSBcIi4vaWFtLXBvbGljeVwiO1xyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgS3ViZXJuZXRlc1ZlcnNpb24gfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBLdWJlcm5ldGVzTWFuaWZlc3QsIEt1YmVybmV0ZXNQYXRjaCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcblxyXG4vKiBWZXJzaW9NYXAgc2hvd2luZyB0aGUgZGVmYXVsdCB2ZXJzaW9uIGZvciA0IHN1cHBvcnRlZCBLdWJlcm5ldGVzIHZlcnNpb25zICovXHJcbmNvbnN0IHZlcnNpb25NYXA6IE1hcDxLdWJlcm5ldGVzVmVyc2lvbiwgc3RyaW5nPiA9IG5ldyBNYXAoW1xyXG4gIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMywgXCJ2MS40OC4wLWVrc2J1aWxkLjJcIl0sXHJcbiAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzMyLCBcInYxLjQ4LjAtZWtzYnVpbGQuMlwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMzEsIFwidjEuNDIuMC1la3NidWlsZC4xXCJdLFxyXG4gIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMCwgXCJ2MS4zNi4wLWVrc2J1aWxkLjFcIl0sXHJcbiAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI5LCBcInYxLjM2LjAtZWtzYnVpbGQuMVwiXSxcclxuICBbS3ViZXJuZXRlc1ZlcnNpb24uVjFfMjgsIFwidjEuMzYuMC1la3NidWlsZC4xXCJdLFxyXG4gIFtLdWJlcm5ldGVzVmVyc2lvbi5WMV8yNywgXCJ2MS4zNi4wLWVrc2J1aWxkLjFcIl0sXHJcbiAgW0t1YmVybmV0ZXNWZXJzaW9uLlYxXzI2LCBcInYxLjM2LjAtZWtzYnVpbGQuMVwiXSxcclxuXSk7XHJcblxyXG4vKipcclxuICogSW50ZXJmYWNlIGZvciBFQlMgQ1NJIERyaXZlciBFS1MgYWRkLW9uIG9wdGlvbnNcclxuICovXHJcbmV4cG9ydCB0eXBlIEVic0NzaURyaXZlckFkZE9uUHJvcHMgPSBPbWl0PENvcmVBZGRPblByb3BzLCBcInBvbGljeURvY3VtZW50UHJvdmlkZXJcIiB8IFwic2FOYW1lXCIgfCBcImFkZE9uTmFtZVwiIHwgXCJjb250cm9sUGxhbmVBZGRPblwiIHwgXCJuYW1lc3BhY2VcIiB8IFwidmVyc2lvbk1hcFwiIHwgXCJ2ZXJzaW9uXCI+ICYge1xyXG4gIC8qKlxyXG4gICAqIExpc3Qgb2YgS01TIGtleXMgdG8gYmUgdXNlZCBmb3IgZW5jcnlwdGlvblxyXG4gICAqL1xyXG4gIGttc0tleXM/OiBrbXMuS2V5W107XHJcbiAgLyoqXHJcbiAgICogU3RvcmFnZUNsYXNzIHRvIGJlIHVzZWQgZm9yIHRoZSBhZGRvblxyXG4gICAqL1xyXG4gIHN0b3JhZ2VDbGFzcz86IHN0cmluZztcclxuICAvKipcclxuICAgKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGRlZmF1bHQgc3RvcmFnZSBjbGFzcyBjcmVhdGVkIGJ5IHRoZSBhZGRvbiBzaG91bGQgYWxsb3cgdm9sdW1lIGV4cGFuc2lvbiBvciBub3QuXHJcbiAgICogQGRlZmF1bHQgZmFsc2VcclxuICAgKi9cclxuICBhbGxvd1ZvbHVtZUV4cGFuc2lvbj86IGJvb2xlYW47XHJcbiAgLyoqXHJcbiAgICogVmVyc2lvbiBvZiB0aGUgRUJTIENTSSBkcml2ZXIgdG8gYmUgdXNlZFxyXG4gICAqL1xyXG4gIHZlcnNpb24/OiBzdHJpbmc7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHZhbHVlcyBmb3IgdGhlIGFkZC1vblxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzOiBDb3JlQWRkT25Qcm9wcyAmIEVic0NzaURyaXZlckFkZE9uUHJvcHMgPSB7XHJcbiAgYWRkT25OYW1lOiBcImF3cy1lYnMtY3NpLWRyaXZlclwiLFxyXG4gIHZlcnNpb246IFwiYXV0b1wiLFxyXG4gIHZlcnNpb25NYXA6IHZlcnNpb25NYXAsXHJcbiAgc2FOYW1lOiBcImVicy1jc2ktY29udHJvbGxlci1zYVwiLFxyXG4gIHN0b3JhZ2VDbGFzczogXCJncDNcIiwgLy8gU2V0IHRoZSBkZWZhdWx0IFN0b3JhZ2VDbGFzcyB0byBncDNcclxuICBhbGxvd1ZvbHVtZUV4cGFuc2lvbjogZmFsc2UsXHJcbn07XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50YXRpb24gb2YgRUJTIENTSSBEcml2ZXIgRUtTIGFkZC1vblxyXG4gKi9cclxuQHV0aWxzLnN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBFYnNDc2lEcml2ZXJBZGRPbiBleHRlbmRzIENvcmVBZGRPbiB7XHJcbiAgcmVhZG9ubHkgZWJzUHJvcHM6IEVic0NzaURyaXZlckFkZE9uUHJvcHM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHJlYWRvbmx5IG9wdGlvbnM/OiBFYnNDc2lEcml2ZXJBZGRPblByb3BzKSB7XHJcbiAgICBzdXBlcih7XHJcbiAgICAgIGFkZE9uTmFtZTogZGVmYXVsdFByb3BzLmFkZE9uTmFtZSxcclxuICAgICAgdmVyc2lvbjogb3B0aW9ucz8udmVyc2lvbiA/PyBkZWZhdWx0UHJvcHMudmVyc2lvbixcclxuICAgICAgdmVyc2lvbk1hcDogZGVmYXVsdFByb3BzLnZlcnNpb25NYXAsXHJcbiAgICAgIHNhTmFtZTogZGVmYXVsdFByb3BzLnNhTmFtZSxcclxuICAgICAgY29uZmlndXJhdGlvblZhbHVlczogb3B0aW9ucz8uY29uZmlndXJhdGlvblZhbHVlcyxcclxuICAgIH0pO1xyXG5cclxuICAgIHRoaXMuZWJzUHJvcHMgPSB7XHJcbiAgICAgIC4uLmRlZmF1bHRQcm9wcyxcclxuICAgICAgLi4ub3B0aW9ucyxcclxuICAgIH07XHJcbiAgfVxyXG5cclxuICBwcm92aWRlUG9saWN5RG9jdW1lbnQoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUG9saWN5RG9jdW1lbnQge1xyXG4gICAgcmV0dXJuIGdldEVic0RyaXZlclBvbGljeURvY3VtZW50KFxyXG4gICAgICBjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLnBhcnRpdGlvbixcclxuICAgICAgdGhpcy5vcHRpb25zPy5rbXNLZXlzXHJcbiAgICApO1xyXG4gIH1cclxuXHJcbiAgQHV0aWxzLmNvbmZsaWN0c1dpdGhBdXRvTW9kZSh1dGlscy5BdXRvTW9kZUNvbmZsaWN0VHlwZS5WRVJTSU9OX01JU01BVENILCBcInYxLjM3LjAtZWtzYnVpbGQuMVwiKVxyXG4gIGFzeW5jIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgY29uc3QgYmFzZURlcGxveW1lbnQgPSBhd2FpdCBzdXBlci5kZXBsb3koY2x1c3RlckluZm8pO1xyXG5cclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG4gICAgbGV0IHVwZGF0ZVNjOiBLdWJlcm5ldGVzTWFuaWZlc3Q7XHJcblxyXG4gICAgaWYgKHRoaXMuZWJzUHJvcHMuc3RvcmFnZUNsYXNzKSB7XHJcbiAgICAgIC8vIHBhdGNoIHJlc291cmNlIG9uIGNsdXN0ZXJcclxuICAgICAgY29uc3QgcGF0Y2hTYyA9IG5ldyBLdWJlcm5ldGVzUGF0Y2goXHJcbiAgICAgICAgY2x1c3Rlci5zdGFjayxcclxuICAgICAgICBgJHtjbHVzdGVyfS1SZW1vdmVHUDJTQ2AsXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgY2x1c3RlcjogY2x1c3RlcixcclxuICAgICAgICAgIHJlc291cmNlTmFtZTogXCJzdG9yYWdlY2xhc3MvZ3AyXCIsXHJcbiAgICAgICAgICBhcHBseVBhdGNoOiB7XHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgYW5ub3RhdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgIFwic3RvcmFnZWNsYXNzLmt1YmVybmV0ZXMuaW8vaXMtZGVmYXVsdC1jbGFzc1wiOiBcImZhbHNlXCIsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICByZXN0b3JlUGF0Y2g6IHtcclxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICBhbm5vdGF0aW9uczoge1xyXG4gICAgICAgICAgICAgICAgXCJzdG9yYWdlY2xhc3Mua3ViZXJuZXRlcy5pby9pcy1kZWZhdWx0LWNsYXNzXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH1cclxuICAgICAgKTtcclxuXHJcbiAgICAgIC8vIENyZWF0ZSBhbmQgc2V0IGdwMyBTdG9yYWdlQ2xhc3MgYXMgY2x1c3Rlci13aWRlIGRlZmF1bHRcclxuICAgICAgdXBkYXRlU2MgPSBuZXcgS3ViZXJuZXRlc01hbmlmZXN0KFxyXG4gICAgICAgIGNsdXN0ZXIuc3RhY2ssXHJcbiAgICAgICAgYCR7Y2x1c3Rlcn0tU2V0RGVmYXVsdFNDYCxcclxuICAgICAgICB7XHJcbiAgICAgICAgICBjbHVzdGVyOiBjbHVzdGVyLFxyXG4gICAgICAgICAgbWFuaWZlc3Q6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgIGFwaVZlcnNpb246IFwic3RvcmFnZS5rOHMuaW8vdjFcIixcclxuICAgICAgICAgICAgICBraW5kOiBcIlN0b3JhZ2VDbGFzc1wiLFxyXG4gICAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImdwM1wiLFxyXG4gICAgICAgICAgICAgICAgYW5ub3RhdGlvbnM6IHtcclxuICAgICAgICAgICAgICAgICAgXCJzdG9yYWdlY2xhc3Mua3ViZXJuZXRlcy5pby9pcy1kZWZhdWx0LWNsYXNzXCI6IFwidHJ1ZVwiLFxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgIHByb3Zpc2lvbmVyOiBcImVicy5jc2kuYXdzLmNvbVwiLFxyXG4gICAgICAgICAgICAgIHJlY2xhaW1Qb2xpY3k6IFwiRGVsZXRlXCIsXHJcbiAgICAgICAgICAgICAgdm9sdW1lQmluZGluZ01vZGU6IFwiV2FpdEZvckZpcnN0Q29uc3VtZXJcIixcclxuICAgICAgICAgICAgICBhbGxvd1ZvbHVtZUV4cGFuc2lvbjogdGhpcy5lYnNQcm9wcy5hbGxvd1ZvbHVtZUV4cGFuc2lvbixcclxuICAgICAgICAgICAgICBwYXJhbWV0ZXJzOiB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImdwM1wiLFxyXG4gICAgICAgICAgICAgICAgZnNUeXBlOiBcImV4dDRcIixcclxuICAgICAgICAgICAgICAgIGVuY3J5cHRlZDogXCJ0cnVlXCIsXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgIF0sXHJcbiAgICAgICAgfVxyXG4gICAgICApO1xyXG5cclxuICAgICAgcGF0Y2hTYy5ub2RlLmFkZERlcGVuZGVuY3koYmFzZURlcGxveW1lbnQpO1xyXG4gICAgICB1cGRhdGVTYy5ub2RlLmFkZERlcGVuZGVuY3kocGF0Y2hTYyk7XHJcblxyXG4gICAgICByZXR1cm4gdXBkYXRlU2M7XHJcbiAgICB9IGVsc2UgXHJcbiAgICB7XHJcbiAgICAgIHJldHVybiBiYXNlRGVwbG95bWVudDtcclxuICAgIH1cclxuICB9XHJcbn1cclxuIl19