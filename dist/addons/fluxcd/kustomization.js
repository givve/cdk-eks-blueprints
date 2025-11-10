"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluxKustomization = void 0;
const utils_1 = require("../../utils");
/**
 * Flux Kustomization API defines a pipeline for fetching, decrypting, building, validating and applying Kustomize overlays or plain Kubernetes manifests.
 */
class FluxKustomization {
    constructor() { }
    generate(name, repoName, namespace, fluxSyncInterval, fluxPrune, fluxTimeout, values, fluxKustomizationPath, fluxTargetNamespace, fluxSourceKind) {
        const kustomizationManifest = {
            apiVersion: "kustomize.toolkit.fluxcd.io/v1beta2",
            kind: "Kustomization",
            metadata: {
                name,
                namespace
            },
            spec: {
                interval: fluxSyncInterval,
                sourceRef: {
                    kind: fluxSourceKind || "GitRepository",
                    name: repoName
                },
                path: fluxKustomizationPath,
                prune: fluxPrune,
                timeout: fluxTimeout
            }
        };
        if (values) {
            (0, utils_1.setPath)(kustomizationManifest, "spec.postBuild.substitute", values);
        }
        if (fluxTargetNamespace) {
            (0, utils_1.setPath)(kustomizationManifest, "spec.targetNamespace", fluxTargetNamespace);
        }
        return kustomizationManifest;
    }
}
exports.FluxKustomization = FluxKustomization;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia3VzdG9taXphdGlvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvZmx1eGNkL2t1c3RvbWl6YXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsdUNBQXNDO0FBR3RDOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFFMUIsZ0JBQWUsQ0FBQztJQUVULFFBQVEsQ0FBQyxJQUFZLEVBQUUsUUFBZ0IsRUFBRSxTQUFpQixFQUFFLGdCQUF3QixFQUFFLFNBQWtCLEVBQUUsV0FBbUIsRUFBRSxNQUFrQixFQUFFLHFCQUE2QixFQUFFLG1CQUE0QixFQUFFLGNBQXVCO1FBRTFPLE1BQU0scUJBQXFCLEdBQUc7WUFDMUIsVUFBVSxFQUFFLHFDQUFxQztZQUNqRCxJQUFJLEVBQUUsZUFBZTtZQUNyQixRQUFRLEVBQUU7Z0JBQ04sSUFBSTtnQkFDSixTQUFTO2FBQ1o7WUFDRCxJQUFJLEVBQUU7Z0JBQ0YsUUFBUSxFQUFFLGdCQUFnQjtnQkFDMUIsU0FBUyxFQUFFO29CQUNQLElBQUksRUFBRSxjQUFjLElBQUksZUFBZTtvQkFDdkMsSUFBSSxFQUFFLFFBQVE7aUJBQ2pCO2dCQUNELElBQUksRUFBRSxxQkFBcUI7Z0JBQzNCLEtBQUssRUFBRSxTQUFTO2dCQUNoQixPQUFPLEVBQUUsV0FBVzthQUN2QjtTQUNKLENBQUM7UUFDRixJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ1QsSUFBQSxlQUFPLEVBQUMscUJBQXFCLEVBQUUsMkJBQTJCLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDeEUsQ0FBQztRQUNELElBQUksbUJBQW1CLEVBQUUsQ0FBQztZQUN0QixJQUFBLGVBQU8sRUFBQyxxQkFBcUIsRUFBRSxzQkFBc0IsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1FBQ2hGLENBQUM7UUFDRCxPQUFPLHFCQUFxQixDQUFDO0lBQ2pDLENBQUM7Q0FDSjtBQWhDRCw4Q0FnQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBzZXRQYXRoIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCAqIGFzIHNwaSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcblxyXG4vKipcclxuICogRmx1eCBLdXN0b21pemF0aW9uIEFQSSBkZWZpbmVzIGEgcGlwZWxpbmUgZm9yIGZldGNoaW5nLCBkZWNyeXB0aW5nLCBidWlsZGluZywgdmFsaWRhdGluZyBhbmQgYXBwbHlpbmcgS3VzdG9taXplIG92ZXJsYXlzIG9yIHBsYWluIEt1YmVybmV0ZXMgbWFuaWZlc3RzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEZsdXhLdXN0b21pemF0aW9uIHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcigpIHt9XHJcblxyXG4gICAgcHVibGljIGdlbmVyYXRlKG5hbWU6IHN0cmluZywgcmVwb05hbWU6IHN0cmluZywgbmFtZXNwYWNlOiBzdHJpbmcsIGZsdXhTeW5jSW50ZXJ2YWw6IHN0cmluZywgZmx1eFBydW5lOiBib29sZWFuLCBmbHV4VGltZW91dDogc3RyaW5nLCB2YWx1ZXM6IHNwaS5WYWx1ZXMsIGZsdXhLdXN0b21pemF0aW9uUGF0aDogc3RyaW5nLCBmbHV4VGFyZ2V0TmFtZXNwYWNlPzogc3RyaW5nLCBmbHV4U291cmNlS2luZD86IHN0cmluZykge1xyXG4gICAgICAgIFxyXG4gICAgICAgIGNvbnN0IGt1c3RvbWl6YXRpb25NYW5pZmVzdCA9IHtcclxuICAgICAgICAgICAgYXBpVmVyc2lvbjogXCJrdXN0b21pemUudG9vbGtpdC5mbHV4Y2QuaW8vdjFiZXRhMlwiLFxyXG4gICAgICAgICAgICBraW5kOiBcIkt1c3RvbWl6YXRpb25cIixcclxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICAgIG5hbWUsXHJcbiAgICAgICAgICAgICAgICBuYW1lc3BhY2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWw6IGZsdXhTeW5jSW50ZXJ2YWwsXHJcbiAgICAgICAgICAgICAgICBzb3VyY2VSZWY6IHtcclxuICAgICAgICAgICAgICAgICAgICBraW5kOiBmbHV4U291cmNlS2luZCB8fCBcIkdpdFJlcG9zaXRvcnlcIixcclxuICAgICAgICAgICAgICAgICAgICBuYW1lOiByZXBvTmFtZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHBhdGg6IGZsdXhLdXN0b21pemF0aW9uUGF0aCxcclxuICAgICAgICAgICAgICAgIHBydW5lOiBmbHV4UHJ1bmUsXHJcbiAgICAgICAgICAgICAgICB0aW1lb3V0OiBmbHV4VGltZW91dFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAodmFsdWVzKSB7XHJcbiAgICAgICAgICAgIHNldFBhdGgoa3VzdG9taXphdGlvbk1hbmlmZXN0LCBcInNwZWMucG9zdEJ1aWxkLnN1YnN0aXR1dGVcIiwgdmFsdWVzKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGZsdXhUYXJnZXROYW1lc3BhY2UpIHtcclxuICAgICAgICAgICAgc2V0UGF0aChrdXN0b21pemF0aW9uTWFuaWZlc3QsIFwic3BlYy50YXJnZXROYW1lc3BhY2VcIiwgZmx1eFRhcmdldE5hbWVzcGFjZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBrdXN0b21pemF0aW9uTWFuaWZlc3Q7XHJcbiAgICB9XHJcbn1cclxuIl19