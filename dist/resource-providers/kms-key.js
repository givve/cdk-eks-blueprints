"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupKmsKeyProvider = exports.CreateKmsKeyProvider = void 0;
const kms = require("aws-cdk-lib/aws-kms");
/**
 * Lookup or create a KMS Key to configure EKS secrets encryption.
 *
 * @example
 * ```typescript
 *     const stack = blueprints.EksBlueprint.builder()
 *       .resourceProvider(GlobalResources.KmsKey, new CreateKmsKeyProvider("my-custom-eks-key"))
 *       .account("123456789012")
 *       .region("us-east-1")
 *       .build(app, "east-test-1");
 * ```
 */
class CreateKmsKeyProvider {
    aliasName;
    kmsKeyProps;
    /**
     * Configuration options for the KMS Key.
     *
     * @param aliasName The alias name for the KMS Key
     * @param kmsKeyProps The key props used
     */
    constructor(aliasName, kmsKeyProps) {
        this.aliasName = aliasName;
        this.kmsKeyProps = kmsKeyProps;
    }
    provide(context) {
        const id = context.scope.node.id;
        const keyId = !this.aliasName
            ? `${id}-kms-key`
            : `${id}-${this.aliasName}-KmsKey`;
        let key = undefined;
        key = new kms.Key(context.scope, keyId, {
            alias: this.aliasName,
            description: `Key for EKS Cluster '${context.blueprintProps.id}'`,
            ...this.kmsKeyProps,
        });
        return key;
    }
}
exports.CreateKmsKeyProvider = CreateKmsKeyProvider;
/**
 * Pass an aliasName to lookup an existing KMS Key.
 *
 * @param aliasName The alias name to lookup an existing KMS Key
 */
class LookupKmsKeyProvider {
    aliasName;
    constructor(aliasName) {
        this.aliasName = aliasName;
    }
    provide(context) {
        const id = context.scope.node.id;
        const keyId = `${id}-${this.aliasName}-KmsKey`;
        return kms.Key.fromLookup(context.scope, keyId, {
            aliasName: this.aliasName,
        });
    }
}
exports.LookupKmsKeyProvider = LookupKmsKeyProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia21zLWtleS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9yZXNvdXJjZS1wcm92aWRlcnMva21zLWtleS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSwyQ0FBMkM7QUFHM0M7Ozs7Ozs7Ozs7O0dBV0c7QUFDSCxNQUFhLG9CQUFvQjtJQUNkLFNBQVMsQ0FBVTtJQUNuQixXQUFXLENBQWdCO0lBRTVDOzs7OztPQUtHO0lBQ0gsWUFBbUIsU0FBa0IsRUFBRSxXQUEwQjtRQUMvRCxJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUMzQixJQUFJLENBQUMsV0FBVyxHQUFHLFdBQVcsQ0FBQztJQUNqQyxDQUFDO0lBRUQsT0FBTyxDQUFDLE9BQXdCO1FBQzlCLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUNqQyxNQUFNLEtBQUssR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTO1lBQzNCLENBQUMsQ0FBQyxHQUFHLEVBQUUsVUFBVTtZQUNqQixDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLFNBQVMsU0FBUyxDQUFDO1FBQ3JDLElBQUksR0FBRyxHQUFHLFNBQVMsQ0FBQztRQUVwQixHQUFHLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO1lBQ3RDLEtBQUssRUFBRSxJQUFJLENBQUMsU0FBUztZQUNyQixXQUFXLEVBQUUsd0JBQXdCLE9BQU8sQ0FBQyxjQUFjLENBQUMsRUFBRSxHQUFHO1lBQ2pFLEdBQUcsSUFBSSxDQUFDLFdBQVc7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0NBQ0Y7QUE5QkQsb0RBOEJDO0FBRUQ7Ozs7R0FJRztBQUNILE1BQWEsb0JBQW9CO0lBQ2QsU0FBUyxDQUFTO0lBRW5DLFlBQW1CLFNBQWlCO1FBQ2xDLElBQUksQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0lBQzdCLENBQUM7SUFFRCxPQUFPLENBQUMsT0FBd0I7UUFDOUIsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2pDLE1BQU0sS0FBSyxHQUFHLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxTQUFTLFNBQVMsQ0FBQztRQUUvQyxPQUFPLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFO1lBQzlDLFNBQVMsRUFBRSxJQUFJLENBQUMsU0FBUztTQUMxQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFmRCxvREFlQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGttcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWttc1wiO1xyXG5pbXBvcnQgeyBSZXNvdXJjZUNvbnRleHQsIFJlc291cmNlUHJvdmlkZXIgfSBmcm9tIFwiLi4vc3BpXCI7XHJcblxyXG4vKipcclxuICogTG9va3VwIG9yIGNyZWF0ZSBhIEtNUyBLZXkgdG8gY29uZmlndXJlIEVLUyBzZWNyZXRzIGVuY3J5cHRpb24uXHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIGBgYHR5cGVzY3JpcHRcclxuICogICAgIGNvbnN0IHN0YWNrID0gYmx1ZXByaW50cy5Fa3NCbHVlcHJpbnQuYnVpbGRlcigpXHJcbiAqICAgICAgIC5yZXNvdXJjZVByb3ZpZGVyKEdsb2JhbFJlc291cmNlcy5LbXNLZXksIG5ldyBDcmVhdGVLbXNLZXlQcm92aWRlcihcIm15LWN1c3RvbS1la3Mta2V5XCIpKVxyXG4gKiAgICAgICAuYWNjb3VudChcIjEyMzQ1Njc4OTAxMlwiKVxyXG4gKiAgICAgICAucmVnaW9uKFwidXMtZWFzdC0xXCIpXHJcbiAqICAgICAgIC5idWlsZChhcHAsIFwiZWFzdC10ZXN0LTFcIik7XHJcbiAqIGBgYFxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIENyZWF0ZUttc0tleVByb3ZpZGVyIGltcGxlbWVudHMgUmVzb3VyY2VQcm92aWRlcjxrbXMuSUtleT4ge1xyXG4gIHByaXZhdGUgcmVhZG9ubHkgYWxpYXNOYW1lPzogc3RyaW5nO1xyXG4gIHByaXZhdGUgcmVhZG9ubHkga21zS2V5UHJvcHM/OiBrbXMuS2V5UHJvcHM7XHJcblxyXG4gIC8qKlxyXG4gICAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIEtNUyBLZXkuXHJcbiAgICpcclxuICAgKiBAcGFyYW0gYWxpYXNOYW1lIFRoZSBhbGlhcyBuYW1lIGZvciB0aGUgS01TIEtleVxyXG4gICAqIEBwYXJhbSBrbXNLZXlQcm9wcyBUaGUga2V5IHByb3BzIHVzZWRcclxuICAgKi9cclxuICBwdWJsaWMgY29uc3RydWN0b3IoYWxpYXNOYW1lPzogc3RyaW5nLCBrbXNLZXlQcm9wcz86IGttcy5LZXlQcm9wcykge1xyXG4gICAgdGhpcy5hbGlhc05hbWUgPSBhbGlhc05hbWU7XHJcbiAgICB0aGlzLmttc0tleVByb3BzID0ga21zS2V5UHJvcHM7XHJcbiAgfVxyXG5cclxuICBwcm92aWRlKGNvbnRleHQ6IFJlc291cmNlQ29udGV4dCk6IGttcy5JS2V5IHtcclxuICAgIGNvbnN0IGlkID0gY29udGV4dC5zY29wZS5ub2RlLmlkO1xyXG4gICAgY29uc3Qga2V5SWQgPSAhdGhpcy5hbGlhc05hbWVcclxuICAgICAgPyBgJHtpZH0ta21zLWtleWBcclxuICAgICAgOiBgJHtpZH0tJHt0aGlzLmFsaWFzTmFtZX0tS21zS2V5YDtcclxuICAgIGxldCBrZXkgPSB1bmRlZmluZWQ7XHJcblxyXG4gICAga2V5ID0gbmV3IGttcy5LZXkoY29udGV4dC5zY29wZSwga2V5SWQsIHtcclxuICAgICAgYWxpYXM6IHRoaXMuYWxpYXNOYW1lLFxyXG4gICAgICBkZXNjcmlwdGlvbjogYEtleSBmb3IgRUtTIENsdXN0ZXIgJyR7Y29udGV4dC5ibHVlcHJpbnRQcm9wcy5pZH0nYCxcclxuICAgICAgLi4udGhpcy5rbXNLZXlQcm9wcyxcclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBrZXk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogUGFzcyBhbiBhbGlhc05hbWUgdG8gbG9va3VwIGFuIGV4aXN0aW5nIEtNUyBLZXkuXHJcbiAqXHJcbiAqIEBwYXJhbSBhbGlhc05hbWUgVGhlIGFsaWFzIG5hbWUgdG8gbG9va3VwIGFuIGV4aXN0aW5nIEtNUyBLZXlcclxuICovXHJcbmV4cG9ydCBjbGFzcyBMb29rdXBLbXNLZXlQcm92aWRlciBpbXBsZW1lbnRzIFJlc291cmNlUHJvdmlkZXI8a21zLklLZXk+IHtcclxuICBwcml2YXRlIHJlYWRvbmx5IGFsaWFzTmFtZTogc3RyaW5nO1xyXG5cclxuICBwdWJsaWMgY29uc3RydWN0b3IoYWxpYXNOYW1lOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuYWxpYXNOYW1lID0gYWxpYXNOYW1lO1xyXG4gIH1cclxuXHJcbiAgcHJvdmlkZShjb250ZXh0OiBSZXNvdXJjZUNvbnRleHQpOiBrbXMuSUtleSB7XHJcbiAgICBjb25zdCBpZCA9IGNvbnRleHQuc2NvcGUubm9kZS5pZDtcclxuICAgIGNvbnN0IGtleUlkID0gYCR7aWR9LSR7dGhpcy5hbGlhc05hbWV9LUttc0tleWA7XHJcblxyXG4gICAgcmV0dXJuIGttcy5LZXkuZnJvbUxvb2t1cChjb250ZXh0LnNjb3BlLCBrZXlJZCwge1xyXG4gICAgICBhbGlhc05hbWU6IHRoaXMuYWxpYXNOYW1lLFxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcbiJdfQ==