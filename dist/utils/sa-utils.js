"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReplaceServiceAccount = void 0;
exports.createServiceAccount = createServiceAccount;
exports.createServiceAccountWithPolicy = createServiceAccountWithPolicy;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const eks = require("aws-cdk-lib/aws-eks");
const iam = require("aws-cdk-lib/aws-iam");
const constructs_1 = require("constructs");
/**
 * Creates a service account that can access secrets
 * @param clusterInfo
 * @returns sa
 */
function createServiceAccount(cluster, name, namespace, policyDocument) {
    const policy = new iam.ManagedPolicy(cluster, `${name}-managed-policy`, {
        document: policyDocument
    });
    return createServiceAccountWithPolicy(cluster, name, namespace, policy);
}
function createServiceAccountWithPolicy(cluster, name, namespace, ...policies) {
    const sa = cluster.addServiceAccount(`${name}-sa`, {
        name: name,
        namespace: namespace
    });
    policies.forEach(policy => sa.role.addManagedPolicy(policy));
    return sa;
}
/**
 * This class is a copy of the CDK ServiceAccount class with the only difference of allowing
 * to replace service account if it already exists (e.g. a case with installing VPC CNI add-on).
 * Once CDK adds support to replace an existing service account, this class should be deleted and replaced
 * with the standard eks.ServiceAccount.
 */
class ReplaceServiceAccount extends constructs_1.Construct {
    /**
     * The role which is linked to the service account.
     */
    role;
    assumeRoleAction;
    grantPrincipal;
    policyFragment;
    /**
     * The name of the service account.
     */
    serviceAccountName;
    /**
     * The namespace where the service account is located in.
     */
    serviceAccountNamespace;
    constructor(scope, id, props) {
        super(scope, id);
        const { cluster } = props;
        this.serviceAccountName = props.name ?? aws_cdk_lib_1.Names.uniqueId(this).toLowerCase();
        this.serviceAccountNamespace = props.namespace ?? 'default';
        // From K8s docs: https://kubernetes.io/docs/tasks/configure-pod-container/configure-service-account/
        if (!this.isValidDnsSubdomainName(this.serviceAccountName)) {
            throw RangeError('The name of a ServiceAccount object must be a valid DNS subdomain name.');
        }
        // From K8s docs: https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/#namespaces-and-dns
        if (!this.isValidDnsLabelName(this.serviceAccountNamespace)) {
            throw RangeError('All namespace names must be valid RFC 1123 DNS labels.');
        }
        /* Add conditions to the role to improve security. This prevents other pods in the same namespace to assume the role.
        * See documentation: https://docs.aws.amazon.com/eks/latest/userguide/create-service-account-iam-policy-and-role.html
        */
        const conditions = new aws_cdk_lib_1.CfnJson(this, 'ConditionJson', {
            value: {
                [`${cluster.openIdConnectProvider.openIdConnectProviderIssuer}:aud`]: 'sts.amazonaws.com',
                [`${cluster.openIdConnectProvider.openIdConnectProviderIssuer}:sub`]: `system:serviceaccount:${this.serviceAccountNamespace}:${this.serviceAccountName}`,
            },
        });
        const principal = new iam.OpenIdConnectPrincipal(cluster.openIdConnectProvider).withConditions({
            StringEquals: conditions,
        });
        this.role = new iam.Role(this, 'Role', { assumedBy: principal });
        this.assumeRoleAction = this.role.assumeRoleAction;
        this.grantPrincipal = this.role.grantPrincipal;
        this.policyFragment = this.role.policyFragment;
        // Note that we cannot use `cluster.addManifest` here because that would create the manifest
        // constrct in the scope of the cluster stack, which might be a different stack than this one.
        // This means that the cluster stack would depend on this stack because of the role,
        // and since this stack inherintely depends on the cluster stack, we will have a circular dependency.
        new eks.KubernetesManifest(this, `manifest-${id}ServiceAccountResource`, {
            cluster,
            overwrite: true,
            manifest: [{
                    apiVersion: 'v1',
                    kind: 'ServiceAccount',
                    metadata: {
                        name: this.serviceAccountName,
                        namespace: this.serviceAccountNamespace,
                        labels: {
                            'app.kubernetes.io/name': this.serviceAccountName,
                            ...props.labels,
                        },
                        annotations: {
                            'eks.amazonaws.com/role-arn': this.role.roleArn,
                            ...props.annotations,
                        },
                    },
                }],
        });
    }
    addToPrincipalPolicy(statement) {
        return this.role.addToPrincipalPolicy(statement);
    }
    /**
     * If the value is a DNS subdomain name as defined in RFC 1123, from K8s docs.
     *
     * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-subdomain-names
     */
    isValidDnsSubdomainName(value) {
        return value.length <= 253 && /^[a-z0-9]+[a-z0-9-.]*[a-z0-9]+$/.test(value);
    }
    /**
     * If the value follows DNS label standard as defined in RFC 1123, from K8s docs.
     *
     * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#dns-label-names
     */
    isValidDnsLabelName(value) {
        return value.length <= 63 && /^[a-z0-9]+[a-z0-9-]*[a-z0-9]+$/.test(value);
    }
}
exports.ReplaceServiceAccount = ReplaceServiceAccount;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2EtdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMvc2EtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBV0Esb0RBT0M7QUFFRCx3RUFRQztBQTNCRCw2Q0FBNkM7QUFDN0MsMkNBQTJDO0FBQzNDLDJDQUEyQztBQUMzQywyQ0FBdUM7QUFFdkM7Ozs7R0FJRztBQUNILFNBQWdCLG9CQUFvQixDQUFDLE9BQWlCLEVBQUUsSUFBWSxFQUFFLFNBQWlCLEVBQUUsY0FBa0M7SUFDdkgsTUFBTSxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksaUJBQWlCLEVBQUU7UUFDcEUsUUFBUSxFQUFFLGNBQWM7S0FDM0IsQ0FBQyxDQUFDO0lBRUgsT0FBTyw4QkFBOEIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxNQUFNLENBQUMsQ0FBQztBQUU1RSxDQUFDO0FBRUQsU0FBZ0IsOEJBQThCLENBQUMsT0FBaUIsRUFBRSxJQUFZLEVBQUUsU0FBaUIsRUFBRSxHQUFHLFFBQThCO0lBQ2hJLE1BQU0sRUFBRSxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLElBQUksS0FBSyxFQUFFO1FBQy9DLElBQUksRUFBRSxJQUFJO1FBQ1YsU0FBUyxFQUFFLFNBQVM7S0FDdkIsQ0FBQyxDQUFDO0lBRUgsUUFBUSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3RCxPQUFPLEVBQUUsQ0FBQztBQUNkLENBQUM7QUFFRDs7Ozs7R0FLRztBQUNILE1BQWEscUJBQXNCLFNBQVEsc0JBQVM7SUFDaEQ7O09BRUc7SUFDYSxJQUFJLENBQVk7SUFFaEIsZ0JBQWdCLENBQVM7SUFDekIsY0FBYyxDQUFpQjtJQUMvQixjQUFjLENBQThCO0lBRTVE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QW9CLENBQUMsU0FBOEI7UUFDdEQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQ25ELENBQUM7SUFFRDs7OztPQUlHO0lBQ0ssdUJBQXVCLENBQUMsS0FBYTtRQUMzQyxPQUFPLEtBQUssQ0FBQyxNQUFNLElBQUksR0FBRyxJQUFJLGlDQUFpQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNLLG1CQUFtQixDQUFDLEtBQWE7UUFDdkMsT0FBTyxLQUFLLENBQUMsTUFBTSxJQUFJLEVBQUUsSUFBSSxnQ0FBZ0MsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDNUUsQ0FBQztDQUNGO0FBdEdMLHNEQXNHSyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IElDbHVzdGVyLCBTZXJ2aWNlQWNjb3VudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcbmltcG9ydCB7IENmbkpzb24sIE5hbWVzIH0gZnJvbSBcImF3cy1jZGstbGliXCI7XHJcbmltcG9ydCAqIGFzIGVrcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyBhIHNlcnZpY2UgYWNjb3VudCB0aGF0IGNhbiBhY2Nlc3Mgc2VjcmV0c1xyXG4gKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAqIEByZXR1cm5zIHNhXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VydmljZUFjY291bnQoY2x1c3RlcjogSUNsdXN0ZXIsIG5hbWU6IHN0cmluZywgbmFtZXNwYWNlOiBzdHJpbmcsIHBvbGljeURvY3VtZW50OiBpYW0uUG9saWN5RG9jdW1lbnQpOiBTZXJ2aWNlQWNjb3VudCB7XHJcbiAgICBjb25zdCBwb2xpY3kgPSBuZXcgaWFtLk1hbmFnZWRQb2xpY3koY2x1c3RlciwgYCR7bmFtZX0tbWFuYWdlZC1wb2xpY3lgLCB7XHJcbiAgICAgICAgZG9jdW1lbnQ6IHBvbGljeURvY3VtZW50XHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gY3JlYXRlU2VydmljZUFjY291bnRXaXRoUG9saWN5KGNsdXN0ZXIsIG5hbWUsIG5hbWVzcGFjZSwgcG9saWN5KTtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVTZXJ2aWNlQWNjb3VudFdpdGhQb2xpY3koY2x1c3RlcjogSUNsdXN0ZXIsIG5hbWU6IHN0cmluZywgbmFtZXNwYWNlOiBzdHJpbmcsIC4uLnBvbGljaWVzOiBpYW0uSU1hbmFnZWRQb2xpY3lbXSk6IFNlcnZpY2VBY2NvdW50IHtcclxuICAgIGNvbnN0IHNhID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudChgJHtuYW1lfS1zYWAsIHtcclxuICAgICAgICBuYW1lOiBuYW1lLFxyXG4gICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXHJcbiAgICB9KTtcclxuXHJcbiAgICBwb2xpY2llcy5mb3JFYWNoKHBvbGljeSA9PiBzYS5yb2xlLmFkZE1hbmFnZWRQb2xpY3kocG9saWN5KSk7XHJcbiAgICByZXR1cm4gc2E7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGNsYXNzIGlzIGEgY29weSBvZiB0aGUgQ0RLIFNlcnZpY2VBY2NvdW50IGNsYXNzIHdpdGggdGhlIG9ubHkgZGlmZmVyZW5jZSBvZiBhbGxvd2luZyBcclxuICogdG8gcmVwbGFjZSBzZXJ2aWNlIGFjY291bnQgaWYgaXQgYWxyZWFkeSBleGlzdHMgKGUuZy4gYSBjYXNlIHdpdGggaW5zdGFsbGluZyBWUEMgQ05JIGFkZC1vbikuXHJcbiAqIE9uY2UgQ0RLIGFkZHMgc3VwcG9ydCB0byByZXBsYWNlIGFuIGV4aXN0aW5nIHNlcnZpY2UgYWNjb3VudCwgdGhpcyBjbGFzcyBzaG91bGQgYmUgZGVsZXRlZCBhbmQgcmVwbGFjZWRcclxuICogd2l0aCB0aGUgc3RhbmRhcmQgZWtzLlNlcnZpY2VBY2NvdW50LlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFJlcGxhY2VTZXJ2aWNlQWNjb3VudCBleHRlbmRzIENvbnN0cnVjdCBpbXBsZW1lbnRzIGlhbS5JUHJpbmNpcGFsIHtcclxuICAgIC8qKlxyXG4gICAgICogVGhlIHJvbGUgd2hpY2ggaXMgbGlua2VkIHRvIHRoZSBzZXJ2aWNlIGFjY291bnQuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyByZWFkb25seSByb2xlOiBpYW0uSVJvbGU7XHJcbiAgXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgYXNzdW1lUm9sZUFjdGlvbjogc3RyaW5nO1xyXG4gICAgcHVibGljIHJlYWRvbmx5IGdyYW50UHJpbmNpcGFsOiBpYW0uSVByaW5jaXBhbDtcclxuICAgIHB1YmxpYyByZWFkb25seSBwb2xpY3lGcmFnbWVudDogaWFtLlByaW5jaXBhbFBvbGljeUZyYWdtZW50O1xyXG4gIFxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGUgbmFtZSBvZiB0aGUgc2VydmljZSBhY2NvdW50LlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VydmljZUFjY291bnROYW1lOiBzdHJpbmc7XHJcbiAgXHJcbiAgICAvKipcclxuICAgICAqIFRoZSBuYW1lc3BhY2Ugd2hlcmUgdGhlIHNlcnZpY2UgYWNjb3VudCBpcyBsb2NhdGVkIGluLlxyXG4gICAgICovXHJcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VydmljZUFjY291bnROYW1lc3BhY2U6IHN0cmluZztcclxuICBcclxuICAgIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBla3MuU2VydmljZUFjY291bnRQcm9wcykge1xyXG4gICAgICBzdXBlcihzY29wZSwgaWQpO1xyXG4gIFxyXG4gICAgICBjb25zdCB7IGNsdXN0ZXIgfSA9IHByb3BzO1xyXG4gICAgICB0aGlzLnNlcnZpY2VBY2NvdW50TmFtZSA9IHByb3BzLm5hbWUgPz8gTmFtZXMudW5pcXVlSWQodGhpcykudG9Mb3dlckNhc2UoKTtcclxuICAgICAgdGhpcy5zZXJ2aWNlQWNjb3VudE5hbWVzcGFjZSA9IHByb3BzLm5hbWVzcGFjZSA/PyAnZGVmYXVsdCc7XHJcbiAgXHJcbiAgICAgIC8vIEZyb20gSzhzIGRvY3M6IGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL3Rhc2tzL2NvbmZpZ3VyZS1wb2QtY29udGFpbmVyL2NvbmZpZ3VyZS1zZXJ2aWNlLWFjY291bnQvXHJcbiAgICAgIGlmICghdGhpcy5pc1ZhbGlkRG5zU3ViZG9tYWluTmFtZSh0aGlzLnNlcnZpY2VBY2NvdW50TmFtZSkpIHtcclxuICAgICAgICB0aHJvdyBSYW5nZUVycm9yKCdUaGUgbmFtZSBvZiBhIFNlcnZpY2VBY2NvdW50IG9iamVjdCBtdXN0IGJlIGEgdmFsaWQgRE5TIHN1YmRvbWFpbiBuYW1lLicpO1xyXG4gICAgICB9XHJcbiAgXHJcbiAgICAgIC8vIEZyb20gSzhzIGRvY3M6IGh0dHBzOi8va3ViZXJuZXRlcy5pby9kb2NzL2NvbmNlcHRzL292ZXJ2aWV3L3dvcmtpbmctd2l0aC1vYmplY3RzL25hbWVzcGFjZXMvI25hbWVzcGFjZXMtYW5kLWRuc1xyXG4gICAgICBpZiAoIXRoaXMuaXNWYWxpZERuc0xhYmVsTmFtZSh0aGlzLnNlcnZpY2VBY2NvdW50TmFtZXNwYWNlKSkge1xyXG4gICAgICAgIHRocm93IFJhbmdlRXJyb3IoJ0FsbCBuYW1lc3BhY2UgbmFtZXMgbXVzdCBiZSB2YWxpZCBSRkMgMTEyMyBETlMgbGFiZWxzLicpO1xyXG4gICAgICB9XHJcbiAgXHJcbiAgICAgIC8qIEFkZCBjb25kaXRpb25zIHRvIHRoZSByb2xlIHRvIGltcHJvdmUgc2VjdXJpdHkuIFRoaXMgcHJldmVudHMgb3RoZXIgcG9kcyBpbiB0aGUgc2FtZSBuYW1lc3BhY2UgdG8gYXNzdW1lIHRoZSByb2xlLlxyXG4gICAgICAqIFNlZSBkb2N1bWVudGF0aW9uOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vZWtzL2xhdGVzdC91c2VyZ3VpZGUvY3JlYXRlLXNlcnZpY2UtYWNjb3VudC1pYW0tcG9saWN5LWFuZC1yb2xlLmh0bWxcclxuICAgICAgKi9cclxuICAgICAgY29uc3QgY29uZGl0aW9ucyA9IG5ldyBDZm5Kc29uKHRoaXMsICdDb25kaXRpb25Kc29uJywge1xyXG4gICAgICAgIHZhbHVlOiB7XHJcbiAgICAgICAgICBbYCR7Y2x1c3Rlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIub3BlbklkQ29ubmVjdFByb3ZpZGVySXNzdWVyfTphdWRgXTogJ3N0cy5hbWF6b25hd3MuY29tJyxcclxuICAgICAgICAgIFtgJHtjbHVzdGVyLm9wZW5JZENvbm5lY3RQcm92aWRlci5vcGVuSWRDb25uZWN0UHJvdmlkZXJJc3N1ZXJ9OnN1YmBdOiBgc3lzdGVtOnNlcnZpY2VhY2NvdW50OiR7dGhpcy5zZXJ2aWNlQWNjb3VudE5hbWVzcGFjZX06JHt0aGlzLnNlcnZpY2VBY2NvdW50TmFtZX1gLFxyXG4gICAgICAgIH0sXHJcbiAgICAgIH0pO1xyXG4gICAgICBjb25zdCBwcmluY2lwYWwgPSBuZXcgaWFtLk9wZW5JZENvbm5lY3RQcmluY2lwYWwoY2x1c3Rlci5vcGVuSWRDb25uZWN0UHJvdmlkZXIpLndpdGhDb25kaXRpb25zKHtcclxuICAgICAgICBTdHJpbmdFcXVhbHM6IGNvbmRpdGlvbnMsXHJcbiAgICAgIH0pO1xyXG4gICAgICB0aGlzLnJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ1JvbGUnLCB7IGFzc3VtZWRCeTogcHJpbmNpcGFsIH0pO1xyXG4gIFxyXG4gICAgICB0aGlzLmFzc3VtZVJvbGVBY3Rpb24gPSB0aGlzLnJvbGUuYXNzdW1lUm9sZUFjdGlvbjtcclxuICAgICAgdGhpcy5ncmFudFByaW5jaXBhbCA9IHRoaXMucm9sZS5ncmFudFByaW5jaXBhbDtcclxuICAgICAgdGhpcy5wb2xpY3lGcmFnbWVudCA9IHRoaXMucm9sZS5wb2xpY3lGcmFnbWVudDtcclxuICBcclxuICAgICAgLy8gTm90ZSB0aGF0IHdlIGNhbm5vdCB1c2UgYGNsdXN0ZXIuYWRkTWFuaWZlc3RgIGhlcmUgYmVjYXVzZSB0aGF0IHdvdWxkIGNyZWF0ZSB0aGUgbWFuaWZlc3RcclxuICAgICAgLy8gY29uc3RyY3QgaW4gdGhlIHNjb3BlIG9mIHRoZSBjbHVzdGVyIHN0YWNrLCB3aGljaCBtaWdodCBiZSBhIGRpZmZlcmVudCBzdGFjayB0aGFuIHRoaXMgb25lLlxyXG4gICAgICAvLyBUaGlzIG1lYW5zIHRoYXQgdGhlIGNsdXN0ZXIgc3RhY2sgd291bGQgZGVwZW5kIG9uIHRoaXMgc3RhY2sgYmVjYXVzZSBvZiB0aGUgcm9sZSxcclxuICAgICAgLy8gYW5kIHNpbmNlIHRoaXMgc3RhY2sgaW5oZXJpbnRlbHkgZGVwZW5kcyBvbiB0aGUgY2x1c3RlciBzdGFjaywgd2Ugd2lsbCBoYXZlIGEgY2lyY3VsYXIgZGVwZW5kZW5jeS5cclxuICAgICAgbmV3IGVrcy5LdWJlcm5ldGVzTWFuaWZlc3QodGhpcywgYG1hbmlmZXN0LSR7aWR9U2VydmljZUFjY291bnRSZXNvdXJjZWAsIHtcclxuICAgICAgICBjbHVzdGVyLFxyXG4gICAgICAgIG92ZXJ3cml0ZTogdHJ1ZSxcclxuICAgICAgICBtYW5pZmVzdDogW3tcclxuICAgICAgICAgIGFwaVZlcnNpb246ICd2MScsXHJcbiAgICAgICAgICBraW5kOiAnU2VydmljZUFjY291bnQnLFxyXG4gICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgbmFtZTogdGhpcy5zZXJ2aWNlQWNjb3VudE5hbWUsXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogdGhpcy5zZXJ2aWNlQWNjb3VudE5hbWVzcGFjZSxcclxuICAgICAgICAgICAgbGFiZWxzOiB7XHJcbiAgICAgICAgICAgICAgJ2FwcC5rdWJlcm5ldGVzLmlvL25hbWUnOiB0aGlzLnNlcnZpY2VBY2NvdW50TmFtZSxcclxuICAgICAgICAgICAgICAuLi5wcm9wcy5sYWJlbHMsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGFubm90YXRpb25zOiB7XHJcbiAgICAgICAgICAgICAgJ2Vrcy5hbWF6b25hd3MuY29tL3JvbGUtYXJuJzogdGhpcy5yb2xlLnJvbGVBcm4sXHJcbiAgICAgICAgICAgICAgLi4ucHJvcHMuYW5ub3RhdGlvbnMsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgIH1dLFxyXG4gICAgICB9KTtcclxuICBcclxuICAgIH1cclxuICAgIHB1YmxpYyBhZGRUb1ByaW5jaXBhbFBvbGljeShzdGF0ZW1lbnQ6IGlhbS5Qb2xpY3lTdGF0ZW1lbnQpOiBpYW0uQWRkVG9QcmluY2lwYWxQb2xpY3lSZXN1bHQge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnJvbGUuYWRkVG9QcmluY2lwYWxQb2xpY3koc3RhdGVtZW50KTtcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBJZiB0aGUgdmFsdWUgaXMgYSBETlMgc3ViZG9tYWluIG5hbWUgYXMgZGVmaW5lZCBpbiBSRkMgMTEyMywgZnJvbSBLOHMgZG9jcy5cclxuICAgICAgICpcclxuICAgICAgICogaHR0cHM6Ly9rdWJlcm5ldGVzLmlvL2RvY3MvY29uY2VwdHMvb3ZlcnZpZXcvd29ya2luZy13aXRoLW9iamVjdHMvbmFtZXMvI2Rucy1zdWJkb21haW4tbmFtZXNcclxuICAgICAgICovXHJcbiAgICAgIHByaXZhdGUgaXNWYWxpZERuc1N1YmRvbWFpbk5hbWUodmFsdWU6IHN0cmluZyk6IGJvb2xlYW4ge1xyXG4gICAgICAgIHJldHVybiB2YWx1ZS5sZW5ndGggPD0gMjUzICYmIC9eW2EtejAtOV0rW2EtejAtOS0uXSpbYS16MC05XSskLy50ZXN0KHZhbHVlKTtcclxuICAgICAgfVxyXG4gICAgXHJcbiAgICAgIC8qKlxyXG4gICAgICAgKiBJZiB0aGUgdmFsdWUgZm9sbG93cyBETlMgbGFiZWwgc3RhbmRhcmQgYXMgZGVmaW5lZCBpbiBSRkMgMTEyMywgZnJvbSBLOHMgZG9jcy5cclxuICAgICAgICpcclxuICAgICAgICogaHR0cHM6Ly9rdWJlcm5ldGVzLmlvL2RvY3MvY29uY2VwdHMvb3ZlcnZpZXcvd29ya2luZy13aXRoLW9iamVjdHMvbmFtZXMvI2Rucy1sYWJlbC1uYW1lc1xyXG4gICAgICAgKi9cclxuICAgICAgcHJpdmF0ZSBpc1ZhbGlkRG5zTGFiZWxOYW1lKHZhbHVlOiBzdHJpbmcpOiBib29sZWFuIHtcclxuICAgICAgICByZXR1cm4gdmFsdWUubGVuZ3RoIDw9IDYzICYmIC9eW2EtejAtOV0rW2EtejAtOS1dKlthLXowLTldKyQvLnRlc3QodmFsdWUpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiJdfQ==