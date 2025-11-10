"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluxBucket = void 0;
const utils_1 = require("../../utils");
/**
 * Flux Bucket API defines a Source to produce an Artifact for objects from storage solutions like Amazon S3.
 * @see https://fluxcd.io/flux/components/source/buckets/
 */
class FluxBucket {
    bucketName;
    region;
    prefixPath;
    constructor(bucketName, region, prefixPath) {
        this.bucketName = bucketName;
        this.region = region;
        this.prefixPath = prefixPath;
    }
    generate(name, namespace, fluxSyncInterval, provider, endpoint, fluxSecretRefName) {
        const bucketManifest = {
            apiVersion: "source.toolkit.fluxcd.io/v1beta2",
            kind: "Bucket",
            metadata: {
                name: name,
                namespace: namespace
            },
            spec: {
                interval: fluxSyncInterval,
                bucketName: this.bucketName,
                provider: provider,
                endpoint: endpoint,
                region: this.region,
            }
        };
        if (fluxSecretRefName) {
            (0, utils_1.setPath)(bucketManifest, "spec.secretRef.name", fluxSecretRefName);
        }
        if (this.prefixPath) {
            (0, utils_1.setPath)(bucketManifest, "spec.prefix", this.prefixPath);
        }
        return bucketManifest;
    }
}
exports.FluxBucket = FluxBucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYnVja2V0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkZG9ucy9mbHV4Y2QvYnVja2V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLHVDQUFzQztBQUV0Qzs7O0dBR0c7QUFDSCxNQUFhLFVBQVU7SUFFVTtJQUFxQztJQUFpQztJQUFuRyxZQUE2QixVQUFrQixFQUFtQixNQUFjLEVBQW1CLFVBQW1CO1FBQXpGLGVBQVUsR0FBVixVQUFVLENBQVE7UUFBbUIsV0FBTSxHQUFOLE1BQU0sQ0FBUTtRQUFtQixlQUFVLEdBQVYsVUFBVSxDQUFTO0lBQUcsQ0FBQztJQUVuSCxRQUFRLENBQUMsSUFBWSxFQUFFLFNBQWlCLEVBQUUsZ0JBQXdCLEVBQUUsUUFBZ0IsRUFBRSxRQUFnQixFQUFFLGlCQUEwQjtRQUVySSxNQUFNLGNBQWMsR0FBSTtZQUNwQixVQUFVLEVBQUUsa0NBQWtDO1lBQzlDLElBQUksRUFBRSxRQUFRO1lBQ2QsUUFBUSxFQUFFO2dCQUNOLElBQUksRUFBRSxJQUFJO2dCQUNWLFNBQVMsRUFBRSxTQUFTO2FBQ3ZCO1lBQ0QsSUFBSSxFQUFFO2dCQUNGLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtnQkFDM0IsUUFBUSxFQUFFLFFBQVE7Z0JBQ2xCLFFBQVEsRUFBRSxRQUFRO2dCQUNsQixNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU07YUFDdEI7U0FDSixDQUFDO1FBRUYsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO1lBQ3BCLElBQUEsZUFBTyxFQUFDLGNBQWMsRUFBRSxxQkFBcUIsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3RFLENBQUM7UUFFRCxJQUFJLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNsQixJQUFBLGVBQU8sRUFBQyxjQUFjLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUM1RCxDQUFDO1FBRUQsT0FBTyxjQUFjLENBQUM7SUFDMUIsQ0FBQztDQUNKO0FBaENELGdDQWdDQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHNldFBhdGggfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuXHJcbi8qKlxyXG4gKiBGbHV4IEJ1Y2tldCBBUEkgZGVmaW5lcyBhIFNvdXJjZSB0byBwcm9kdWNlIGFuIEFydGlmYWN0IGZvciBvYmplY3RzIGZyb20gc3RvcmFnZSBzb2x1dGlvbnMgbGlrZSBBbWF6b24gUzMuXHJcbiAqIEBzZWUgaHR0cHM6Ly9mbHV4Y2QuaW8vZmx1eC9jb21wb25lbnRzL3NvdXJjZS9idWNrZXRzL1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEZsdXhCdWNrZXQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgYnVja2V0TmFtZTogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IHJlZ2lvbjogc3RyaW5nLCBwcml2YXRlIHJlYWRvbmx5IHByZWZpeFBhdGg/OiBzdHJpbmcpIHt9XHJcblxyXG4gICAgcHVibGljIGdlbmVyYXRlKG5hbWU6IHN0cmluZywgbmFtZXNwYWNlOiBzdHJpbmcsIGZsdXhTeW5jSW50ZXJ2YWw6IHN0cmluZywgcHJvdmlkZXI6IHN0cmluZywgZW5kcG9pbnQ6IHN0cmluZywgZmx1eFNlY3JldFJlZk5hbWU/OiBzdHJpbmcpIHtcclxuXHJcbiAgICAgICAgY29uc3QgYnVja2V0TWFuaWZlc3QgPSAge1xyXG4gICAgICAgICAgICBhcGlWZXJzaW9uOiBcInNvdXJjZS50b29sa2l0LmZsdXhjZC5pby92MWJldGEyXCIsXHJcbiAgICAgICAgICAgIGtpbmQ6IFwiQnVja2V0XCIsXHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgaW50ZXJ2YWw6IGZsdXhTeW5jSW50ZXJ2YWwsXHJcbiAgICAgICAgICAgICAgICBidWNrZXROYW1lOiB0aGlzLmJ1Y2tldE5hbWUsXHJcbiAgICAgICAgICAgICAgICBwcm92aWRlcjogcHJvdmlkZXIsXHJcbiAgICAgICAgICAgICAgICBlbmRwb2ludDogZW5kcG9pbnQsXHJcbiAgICAgICAgICAgICAgICByZWdpb246IHRoaXMucmVnaW9uLFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGZsdXhTZWNyZXRSZWZOYW1lKSB7XHJcbiAgICAgICAgICAgIHNldFBhdGgoYnVja2V0TWFuaWZlc3QsIFwic3BlYy5zZWNyZXRSZWYubmFtZVwiLCBmbHV4U2VjcmV0UmVmTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5wcmVmaXhQYXRoKSB7XHJcbiAgICAgICAgICAgIHNldFBhdGgoYnVja2V0TWFuaWZlc3QsIFwic3BlYy5wcmVmaXhcIiwgdGhpcy5wcmVmaXhQYXRoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiBidWNrZXRNYW5pZmVzdDtcclxuICAgIH1cclxufVxyXG4iXX0=