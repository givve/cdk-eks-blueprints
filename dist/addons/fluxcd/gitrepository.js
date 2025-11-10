"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FluxGitRepository = void 0;
const utils_1 = require("../../utils");
/**
 * Flux GitRepository API defines a Source to produce an Artifact for a Git repository revision.
 */
class FluxGitRepository {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    generate(name, namespace, fluxSyncInterval, fluxSecretRefName) {
        const repository = this.repository;
        const gitManifest = {
            apiVersion: "source.toolkit.fluxcd.io/v1beta2",
            kind: "GitRepository",
            metadata: {
                name: name,
                namespace: namespace
            },
            spec: {
                interval: fluxSyncInterval,
                url: repository.repoUrl,
                ref: {
                    branch: repository.targetRevision,
                },
            }
        };
        if (fluxSecretRefName) {
            (0, utils_1.setPath)(gitManifest, "spec.secretRef.name", fluxSecretRefName);
        }
        return gitManifest;
    }
}
exports.FluxGitRepository = FluxGitRepository;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2l0cmVwb3NpdG9yeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvZmx1eGNkL2dpdHJlcG9zaXRvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsdUNBQXNDO0FBRXRDOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFFRztJQUE3QixZQUE2QixVQUFxQztRQUFyQyxlQUFVLEdBQVYsVUFBVSxDQUEyQjtJQUFHLENBQUM7SUFFL0QsUUFBUSxDQUFDLElBQVksRUFBRSxTQUFpQixFQUFFLGdCQUF3QixFQUFFLGlCQUF5QjtRQUVoRyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDO1FBQ25DLE1BQU0sV0FBVyxHQUFJO1lBQ2pCLFVBQVUsRUFBRSxrQ0FBa0M7WUFDOUMsSUFBSSxFQUFFLGVBQWU7WUFDckIsUUFBUSxFQUFFO2dCQUNOLElBQUksRUFBRSxJQUFJO2dCQUNWLFNBQVMsRUFBRSxTQUFTO2FBQ3ZCO1lBQ0QsSUFBSSxFQUFFO2dCQUNGLFFBQVEsRUFBRSxnQkFBZ0I7Z0JBQzFCLEdBQUcsRUFBRSxVQUFVLENBQUMsT0FBTztnQkFDdkIsR0FBRyxFQUFFO29CQUNELE1BQU0sRUFBRSxVQUFVLENBQUMsY0FBYztpQkFDcEM7YUFDSjtTQUNKLENBQUM7UUFDRixJQUFJLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsSUFBQSxlQUFPLEVBQUMsV0FBVyxFQUFFLHFCQUFxQixFQUFFLGlCQUFpQixDQUFDLENBQUM7UUFDbkUsQ0FBQztRQUNELE9BQU8sV0FBVyxDQUFDO0lBQ3ZCLENBQUM7Q0FDSjtBQTNCRCw4Q0EyQkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzcGkgZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBzZXRQYXRoIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG4vKipcclxuICogRmx1eCBHaXRSZXBvc2l0b3J5IEFQSSBkZWZpbmVzIGEgU291cmNlIHRvIHByb2R1Y2UgYW4gQXJ0aWZhY3QgZm9yIGEgR2l0IHJlcG9zaXRvcnkgcmV2aXNpb24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRmx1eEdpdFJlcG9zaXRvcnkge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgcmVwb3NpdG9yeTogc3BpLkFwcGxpY2F0aW9uUmVwb3NpdG9yeSkge31cclxuXHJcbiAgICBwdWJsaWMgZ2VuZXJhdGUobmFtZTogc3RyaW5nLCBuYW1lc3BhY2U6IHN0cmluZywgZmx1eFN5bmNJbnRlcnZhbDogc3RyaW5nLCBmbHV4U2VjcmV0UmVmTmFtZTogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlcG9zaXRvcnkgPSB0aGlzLnJlcG9zaXRvcnk7XHJcbiAgICAgICAgY29uc3QgZ2l0TWFuaWZlc3QgPSAge1xyXG4gICAgICAgICAgICBhcGlWZXJzaW9uOiBcInNvdXJjZS50b29sa2l0LmZsdXhjZC5pby92MWJldGEyXCIsXHJcbiAgICAgICAgICAgIGtpbmQ6IFwiR2l0UmVwb3NpdG9yeVwiLFxyXG4gICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogbmFtZSxcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgIGludGVydmFsOiBmbHV4U3luY0ludGVydmFsLFxyXG4gICAgICAgICAgICAgICAgdXJsOiByZXBvc2l0b3J5LnJlcG9VcmwsXHJcbiAgICAgICAgICAgICAgICByZWY6IHtcclxuICAgICAgICAgICAgICAgICAgICBicmFuY2g6IHJlcG9zaXRvcnkudGFyZ2V0UmV2aXNpb24sXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgICBpZiAoZmx1eFNlY3JldFJlZk5hbWUpIHtcclxuICAgICAgICAgICAgc2V0UGF0aChnaXRNYW5pZmVzdCwgXCJzcGVjLnNlY3JldFJlZi5uYW1lXCIsIGZsdXhTZWNyZXRSZWZOYW1lKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIGdpdE1hbmlmZXN0O1xyXG4gICAgfVxyXG59XHJcbiJdfQ==