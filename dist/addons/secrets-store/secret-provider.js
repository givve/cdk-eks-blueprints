"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupSsmSecretByAttrs = exports.LookupSecretsManagerSecretByArn = exports.LookupSecretsManagerSecretByName = exports.GenerateSecretManagerProvider = void 0;
const aws_secretsmanager_1 = require("aws-cdk-lib/aws-secretsmanager");
const aws_ssm_1 = require("aws-cdk-lib/aws-ssm");
/**
 * Generate a new Secret on Secrets Manager
 */
class GenerateSecretManagerProvider {
    id;
    secretName;
    constructor(id, secretName) {
        this.id = id;
        this.secretName = secretName;
    }
    provide(clusterInfo) {
        const secret = new aws_secretsmanager_1.Secret(clusterInfo.cluster.stack, this.id, {
            secretName: this.secretName
        });
        return secret;
    }
}
exports.GenerateSecretManagerProvider = GenerateSecretManagerProvider;
/**
 * Lookup Secret in SecretsManager by Name
 */
class LookupSecretsManagerSecretByName {
    secretName;
    id;
    /**
     * @param secretName
     * @param id
     */
    constructor(secretName, id) {
        this.secretName = secretName;
        this.id = id;
    }
    provide(clusterInfo) {
        return aws_secretsmanager_1.Secret.fromSecretNameV2(clusterInfo.cluster.stack, this.id ?? `${this.secretName}-Lookup`, this.secretName);
    }
}
exports.LookupSecretsManagerSecretByName = LookupSecretsManagerSecretByName;
/**
 * Lookup Secret in SecretsManager by Arn
 */
class LookupSecretsManagerSecretByArn {
    secretArn;
    id;
    /**
     * @param secretArn
     * @param id
     */
    constructor(secretArn, id) {
        this.secretArn = secretArn;
        this.id = id;
    }
    provide(clusterInfo) {
        return aws_secretsmanager_1.Secret.fromSecretCompleteArn(clusterInfo.cluster.stack, this.id ?? `${this.secretArn}-Lookup`, this.secretArn);
    }
}
exports.LookupSecretsManagerSecretByArn = LookupSecretsManagerSecretByArn;
/**
 * Lookup SSM Parameter Store Secret by Name
 */
class LookupSsmSecretByAttrs {
    secretName;
    version;
    encryptionKey;
    simpleName;
    id;
    /**
     * @param secretName
     * @param version
     * @param encryptionKey
     * @param simpleName
     * @param id
     */
    constructor(secretName, version, encryptionKey, simpleName, id) {
        this.secretName = secretName;
        this.version = version;
        this.encryptionKey = encryptionKey;
        this.simpleName = simpleName;
        this.id = id;
    }
    /**
     * Lookup the secret string parameter
     * @param clusterInfo
     * @returns
     */
    provide(clusterInfo) {
        return aws_ssm_1.StringParameter.fromSecureStringParameterAttributes(clusterInfo.cluster.stack, this.id ?? `${this.secretName}-Lookup`, {
            parameterName: this.secretName,
            version: this.version,
            encryptionKey: this.encryptionKey,
            simpleName: this.simpleName
        });
    }
}
exports.LookupSsmSecretByAttrs = LookupSsmSecretByAttrs;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0LXByb3ZpZGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vbGliL2FkZG9ucy9zZWNyZXRzLXN0b3JlL3NlY3JldC1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFDQSx1RUFBaUU7QUFDakUsaURBQXdFO0FBV3hFOztHQUVHO0FBQ0gsTUFBYSw2QkFBNkI7SUFFcEI7SUFBb0I7SUFBeEMsWUFBb0IsRUFBVSxFQUFVLFVBQWtCO1FBQXRDLE9BQUUsR0FBRixFQUFFLENBQVE7UUFBVSxlQUFVLEdBQVYsVUFBVSxDQUFRO0lBQUcsQ0FBQztJQUU5RCxPQUFPLENBQUMsV0FBd0I7UUFDNUIsTUFBTSxNQUFNLEdBQUcsSUFBSSwyQkFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUU7WUFDMUQsVUFBVSxFQUFFLElBQUksQ0FBQyxVQUFVO1NBQzlCLENBQUMsQ0FBQztRQUVILE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7Q0FDRjtBQVhELHNFQVdDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLGdDQUFnQztJQUt2QjtJQUE0QjtJQUpoRDs7O09BR0c7SUFDSCxZQUFvQixVQUFrQixFQUFVLEVBQVc7UUFBdkMsZUFBVSxHQUFWLFVBQVUsQ0FBUTtRQUFVLE9BQUUsR0FBRixFQUFFLENBQVM7SUFBRyxDQUFDO0lBRS9ELE9BQU8sQ0FBQyxXQUF3QjtRQUM5QixPQUFPLDJCQUFNLENBQUMsZ0JBQWdCLENBQzVCLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QixJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsU0FBUyxFQUN0QyxJQUFJLENBQUMsVUFBVSxDQUNoQixDQUFDO0lBQ0osQ0FBQztDQUNGO0FBZEQsNEVBY0M7QUFFRDs7R0FFRztBQUNGLE1BQWEsK0JBQStCO0lBS3ZCO0lBQTJCO0lBSi9DOzs7T0FHRztJQUNILFlBQW9CLFNBQWlCLEVBQVUsRUFBVztRQUF0QyxjQUFTLEdBQVQsU0FBUyxDQUFRO1FBQVUsT0FBRSxHQUFGLEVBQUUsQ0FBUztJQUFHLENBQUM7SUFFOUQsT0FBTyxDQUFDLFdBQXdCO1FBQzlCLE9BQU8sMkJBQU0sQ0FBQyxxQkFBcUIsQ0FDakMsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQ3pCLElBQUksQ0FBQyxFQUFFLElBQUksR0FBRyxJQUFJLENBQUMsU0FBUyxTQUFTLEVBQ3JDLElBQUksQ0FBQyxTQUFTLENBQ2YsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQWRBLDBFQWNBO0FBRUQ7O0dBRUc7QUFDRixNQUFhLHNCQUFzQjtJQVN4QjtJQUNBO0lBQ0E7SUFDQTtJQUNBO0lBWlY7Ozs7OztPQU1HO0lBQ0gsWUFDVSxVQUFrQixFQUNsQixPQUFlLEVBQ2YsYUFBb0IsRUFDcEIsVUFBb0IsRUFDcEIsRUFBVztRQUpYLGVBQVUsR0FBVixVQUFVLENBQVE7UUFDbEIsWUFBTyxHQUFQLE9BQU8sQ0FBUTtRQUNmLGtCQUFhLEdBQWIsYUFBYSxDQUFPO1FBQ3BCLGVBQVUsR0FBVixVQUFVLENBQVU7UUFDcEIsT0FBRSxHQUFGLEVBQUUsQ0FBUztJQUNsQixDQUFDO0lBRUo7Ozs7T0FJRztJQUNILE9BQU8sQ0FBQyxXQUF3QjtRQUM5QixPQUFPLHlCQUFlLENBQUMsbUNBQW1DLENBQ3hELFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUN6QixJQUFJLENBQUMsRUFBRSxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsU0FBUyxFQUFFO1lBQ3RDLGFBQWEsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUM5QixPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU87WUFDckIsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtTQUM1QixDQUNGLENBQUM7SUFDSixDQUFDO0NBQ0Y7QUFoQ0Esd0RBZ0NBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgeyBJU2VjcmV0LCBTZWNyZXQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc2VjcmV0c21hbmFnZXInO1xyXG5pbXBvcnQgeyBJU3RyaW5nUGFyYW1ldGVyLCBTdHJpbmdQYXJhbWV0ZXIgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc3NtJztcclxuaW1wb3J0IHsgSUtleSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1rbXMnO1xyXG5cclxuLyoqXHJcbiAqIFNlY3JldCBQcm92aWRlciBJbnRlcmZhY2VcclxuICogWW91IGNhbiBwcm92aWRlKCkgeW91ciBvd24gU2VjcmV0c1xyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBTZWNyZXRQcm92aWRlciB7XHJcbiAgcHJvdmlkZShjbHVzdGVySW5mbz86IENsdXN0ZXJJbmZvKTogSVNlY3JldCB8IElTdHJpbmdQYXJhbWV0ZXI7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBHZW5lcmF0ZSBhIG5ldyBTZWNyZXQgb24gU2VjcmV0cyBNYW5hZ2VyXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR2VuZXJhdGVTZWNyZXRNYW5hZ2VyUHJvdmlkZXIgaW1wbGVtZW50cyBTZWNyZXRQcm92aWRlciB7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgaWQ6IHN0cmluZywgcHJpdmF0ZSBzZWNyZXROYW1lOiBzdHJpbmcpIHt9XHJcblxyXG4gIHByb3ZpZGUoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogSVNlY3JldCB7XHJcbiAgICAgIGNvbnN0IHNlY3JldCA9IG5ldyBTZWNyZXQoY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjaywgdGhpcy5pZCwge1xyXG4gICAgICAgICAgc2VjcmV0TmFtZTogdGhpcy5zZWNyZXROYW1lXHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHNlY3JldDtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBMb29rdXAgU2VjcmV0IGluIFNlY3JldHNNYW5hZ2VyIGJ5IE5hbWVcclxuICovXHJcbmV4cG9ydCBjbGFzcyBMb29rdXBTZWNyZXRzTWFuYWdlclNlY3JldEJ5TmFtZSBpbXBsZW1lbnRzIFNlY3JldFByb3ZpZGVyIHtcclxuICAvKipcclxuICAgKiBAcGFyYW0gc2VjcmV0TmFtZVxyXG4gICAqIEBwYXJhbSBpZFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc2VjcmV0TmFtZTogc3RyaW5nLCBwcml2YXRlIGlkPzogc3RyaW5nKSB7fVxyXG5cclxuICBwcm92aWRlKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IElTZWNyZXQge1xyXG4gICAgcmV0dXJuIFNlY3JldC5mcm9tU2VjcmV0TmFtZVYyKFxyXG4gICAgICBjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLFxyXG4gICAgICB0aGlzLmlkID8/IGAke3RoaXMuc2VjcmV0TmFtZX0tTG9va3VwYCxcclxuICAgICAgdGhpcy5zZWNyZXROYW1lXHJcbiAgICApO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIExvb2t1cCBTZWNyZXQgaW4gU2VjcmV0c01hbmFnZXIgYnkgQXJuXHJcbiAqL1xyXG4gZXhwb3J0IGNsYXNzIExvb2t1cFNlY3JldHNNYW5hZ2VyU2VjcmV0QnlBcm4gaW1wbGVtZW50cyBTZWNyZXRQcm92aWRlciB7XHJcbiAgLyoqXHJcbiAgICogQHBhcmFtIHNlY3JldEFyblxyXG4gICAqIEBwYXJhbSBpZFxyXG4gICAqL1xyXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgc2VjcmV0QXJuOiBzdHJpbmcsIHByaXZhdGUgaWQ/OiBzdHJpbmcpIHt9XHJcblxyXG4gIHByb3ZpZGUoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogSVNlY3JldCB7XHJcbiAgICByZXR1cm4gU2VjcmV0LmZyb21TZWNyZXRDb21wbGV0ZUFybihcclxuICAgICAgY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjayxcclxuICAgICAgdGhpcy5pZCA/PyBgJHt0aGlzLnNlY3JldEFybn0tTG9va3VwYCxcclxuICAgICAgdGhpcy5zZWNyZXRBcm5cclxuICAgICk7XHJcbiAgfVxyXG59XHJcblxyXG4vKipcclxuICogTG9va3VwIFNTTSBQYXJhbWV0ZXIgU3RvcmUgU2VjcmV0IGJ5IE5hbWVcclxuICovXHJcbiBleHBvcnQgY2xhc3MgTG9va3VwU3NtU2VjcmV0QnlBdHRycyBpbXBsZW1lbnRzIFNlY3JldFByb3ZpZGVyIHtcclxuICAvKipcclxuICAgKiBAcGFyYW0gc2VjcmV0TmFtZSBcclxuICAgKiBAcGFyYW0gdmVyc2lvbiBcclxuICAgKiBAcGFyYW0gZW5jcnlwdGlvbktleSBcclxuICAgKiBAcGFyYW0gc2ltcGxlTmFtZSBcclxuICAgKiBAcGFyYW0gaWQgXHJcbiAgICovXHJcbiAgY29uc3RydWN0b3IoXHJcbiAgICBwcml2YXRlIHNlY3JldE5hbWU6IHN0cmluZyxcclxuICAgIHByaXZhdGUgdmVyc2lvbjogbnVtYmVyLFxyXG4gICAgcHJpdmF0ZSBlbmNyeXB0aW9uS2V5PzogSUtleSxcclxuICAgIHByaXZhdGUgc2ltcGxlTmFtZT86IGJvb2xlYW4sXHJcbiAgICBwcml2YXRlIGlkPzogc3RyaW5nLFxyXG4gICkge31cclxuXHJcbiAgLyoqXHJcbiAgICogTG9va3VwIHRoZSBzZWNyZXQgc3RyaW5nIHBhcmFtZXRlclxyXG4gICAqIEBwYXJhbSBjbHVzdGVySW5mbyBcclxuICAgKiBAcmV0dXJucyBcclxuICAgKi9cclxuICBwcm92aWRlKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IElTdHJpbmdQYXJhbWV0ZXIge1xyXG4gICAgcmV0dXJuIFN0cmluZ1BhcmFtZXRlci5mcm9tU2VjdXJlU3RyaW5nUGFyYW1ldGVyQXR0cmlidXRlcyhcclxuICAgICAgY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjayxcclxuICAgICAgdGhpcy5pZCA/PyBgJHt0aGlzLnNlY3JldE5hbWV9LUxvb2t1cGAsIHtcclxuICAgICAgICBwYXJhbWV0ZXJOYW1lOiB0aGlzLnNlY3JldE5hbWUsXHJcbiAgICAgICAgdmVyc2lvbjogdGhpcy52ZXJzaW9uLFxyXG4gICAgICAgIGVuY3J5cHRpb25LZXk6IHRoaXMuZW5jcnlwdGlvbktleSxcclxuICAgICAgICBzaW1wbGVOYW1lOiB0aGlzLnNpbXBsZU5hbWVcclxuICAgICAgfVxyXG4gICAgKTtcclxuICB9XHJcbn0iXX0=