"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformTeam = exports.ApplicationTeam = exports.TeamProps = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const iam = require("aws-cdk-lib/aws-iam");
const eksv2 = require("@aws-cdk/aws-eks-v2-alpha");
const csi_driver_provider_aws_secrets_1 = require("../addons/secrets-store/csi-driver-provider-aws-secrets");
const yaml_utils_1 = require("../utils/yaml-utils");
const default_team_roles_1 = require("./default-team-roles");
const utils_1 = require("../utils");
/**
 * Team properties.
 */
class TeamProps {
    /**
     * Required unique name for organization.
     * May map to an OU name.
     */
    name;
    /**
     * Defaults to team name prefixed by "team-"
     */
    namespace;
    /**
     *  Annotations such as necessary for GitOps engine.
     */
    namespaceAnnotations = { "argocd.argoproj.io/sync-wave": "-1" };
    /**
     * Labels such as necessary for AWS AppMesh
     */
    namespaceLabels;
    /**
     * Optional, but highly recommended setting to ensure predictable demands.
     */
    namespaceHardLimits = {
        'requests.cpu': '10', // TODO verify sane defaults
        'requests.memory': '10Gi',
        'limits.cpu': '20',
        'limits.memory': '20Gi'
    };
    /**
     * Service Account Name
     */
    serviceAccountName;
    /**
     * If specified, the IRSA account will be created for with the IRSA role
     * having the specified managed policies.
     *
     * @example
     * serviceAccountPolicies: [ManagedPolicy.fromAwsManagedPolicyName("")]
     *
     */
    serviceAccountPolicies;
    /**
     *  Team members who need to get access to the cluster
     */
    users;
    /**
     * Options existing role that should be used for cluster access.
     * If userRole and users are not provided, then no IAM setup is performed.
     */
    userRoleArn;
    /**
     * Team Secrets
     */
    teamSecrets;
    /**
     * Optional, directory where a team's manifests are stored
     */
    teamManifestDir;
}
exports.TeamProps = TeamProps;
class ApplicationTeam {
    teamProps;
    name;
    namespaceManifest;
    serviceAccount;
    constructor(teamProps) {
        this.name = teamProps.name;
        this.teamProps = {
            name: teamProps.name,
            namespace: teamProps.namespace ?? "team-" + teamProps.name,
            users: teamProps.users,
            namespaceAnnotations: teamProps.namespaceAnnotations,
            namespaceLabels: teamProps.namespaceLabels,
            namespaceHardLimits: teamProps.namespaceHardLimits,
            serviceAccountName: teamProps.serviceAccountName,
            serviceAccountPolicies: teamProps.serviceAccountPolicies,
            userRoleArn: teamProps.userRoleArn,
            teamSecrets: teamProps.teamSecrets,
            teamManifestDir: teamProps.teamManifestDir,
            extensionFunction: teamProps.extensionFunction
        };
    }
    setup(clusterInfo) {
        this.defaultSetupAccess(clusterInfo);
        this.setupNamespace(clusterInfo);
        this.setupServiceAccount(clusterInfo);
        this.setupSecrets(clusterInfo);
        if (this.teamProps.extensionFunction) {
            this.teamProps.extensionFunction(this, clusterInfo);
        }
    }
    defaultSetupAccess(clusterInfo) {
        const props = this.teamProps;
        if (!(clusterInfo.cluster instanceof aws_eks_1.Cluster || clusterInfo.clusterv2 instanceof eksv2.Cluster)) {
            utils_1.logger.warn(`Team ${props.name} has cluster access updates that are not supported with imported clusters`);
            return;
        }
        const users = this.teamProps.users ?? [];
        const teamRole = this.getOrCreateRole(clusterInfo, users, props.userRoleArn);
        if (clusterInfo.clusterv2 instanceof eksv2.Cluster) {
            const eksClusterv2 = clusterInfo.clusterv2;
            if (teamRole) {
                eksClusterv2.grantAccess(props.name + '-access', teamRole.roleArn, [new eksv2.AccessPolicy({
                        accessScope: { type: eksv2.AccessScopeType.NAMESPACE, namespaces: [props.namespace] },
                        policy: eksv2.AccessPolicyArn.AMAZON_EKS_ADMIN_POLICY
                    })]);
            }
        }
        else if (clusterInfo.cluster instanceof aws_eks_1.Cluster) {
            const eksCluster = clusterInfo.cluster;
            const awsAuth = eksCluster.awsAuth;
            if (teamRole) {
                awsAuth.addRoleMapping(teamRole, { groups: [props.namespace + "-team-group"], username: props.name });
            }
        }
        new aws_cdk_lib_1.CfnOutput(clusterInfo.cluster.stack, props.name + ' team role ', { value: teamRole ? teamRole.roleArn : "none" });
    }
    /**
     *
     * @param clusterInfo
     */
    defaultSetupAdminAccess(clusterInfo) {
        const props = this.teamProps;
        if (!(clusterInfo.cluster instanceof aws_eks_1.Cluster || clusterInfo.clusterv2 instanceof eksv2.Cluster)) {
            utils_1.logger.warn(`Team ${props.name} has cluster access updates that are not supported with imported clusters`);
            return;
        }
        const admins = this.teamProps.users ?? [];
        const adminRole = this.getOrCreateRole(clusterInfo, admins, props.userRoleArn);
        if (clusterInfo.clusterv2 instanceof eksv2.Cluster) {
            const eksClusterv2 = clusterInfo.clusterv2;
            if (adminRole) {
                eksClusterv2.grantAccess(props.name + '-access', adminRole.roleArn, [new eksv2.AccessPolicy({
                        accessScope: { type: eksv2.AccessScopeType.CLUSTER },
                        policy: eksv2.AccessPolicyArn.AMAZON_EKS_CLUSTER_ADMIN_POLICY
                    })]);
            }
        }
        else if (clusterInfo.cluster instanceof aws_eks_1.Cluster) {
            if (adminRole) {
                const eksCluster = clusterInfo.cluster;
                eksCluster.awsAuth.addMastersRole(adminRole, this.teamProps.name);
            }
        }
        new aws_cdk_lib_1.CfnOutput(clusterInfo.cluster.stack, props.name + ' team admin ', { value: adminRole ? adminRole.roleArn : "none" });
    }
    /**
     * Creates a new role with trust relationship or adds trust relationship for an existing role.
     * @param clusterInfo
     * @param users
     * @param role may be null if both role and users were not provided
     * @returns
     */
    getOrCreateRole(clusterInfo, users, roleArn) {
        let role = undefined;
        if (roleArn) {
            role = iam.Role.fromRoleArn(clusterInfo.cluster.stack, `${this.name}-team-role`, roleArn);
            users.forEach(user => role?.grant(user, "sts:assumeRole"));
        }
        else if (users && users.length > 0) {
            role = new iam.Role(clusterInfo.cluster.stack, this.teamProps.namespace + 'AccessRole', {
                assumedBy: new iam.CompositePrincipal(...users)
            });
            role.addToPrincipalPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: [clusterInfo.cluster.clusterArn],
                actions: [
                    "eks:DescribeNodegroup",
                    "eks:ListNodegroups",
                    "eks:DescribeCluster",
                    "eks:ListClusters",
                    "eks:AccessKubernetesApi",
                    "ssm:GetParameter",
                    "eks:ListUpdates",
                    "eks:ListFargateProfiles"
                ]
            }));
            role.addToPrincipalPolicy(new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                resources: ["*"],
                actions: [
                    "eks:ListClusters"
                ]
            }));
        }
        return role;
    }
    /**
     * Creates namespace and sets up policies.
     * @param clusterInfo
     */
    setupNamespace(clusterInfo) {
        const props = this.teamProps;
        const namespaceName = props.namespace;
        const teamManifestDir = props.teamManifestDir;
        this.namespaceManifest = new aws_eks_1.KubernetesManifest(clusterInfo.cluster.stack, props.name, {
            cluster: clusterInfo.cluster,
            manifest: [{
                    apiVersion: 'v1',
                    kind: 'Namespace',
                    metadata: {
                        name: namespaceName,
                        annotations: props.namespaceAnnotations,
                        labels: props.namespaceLabels
                    }
                }],
            overwrite: true,
            prune: true
        });
        if (props.namespaceHardLimits) {
            this.setupNamespacePolicies(clusterInfo, namespaceName);
        }
        const defaultRoles = new default_team_roles_1.DefaultTeamRoles().createManifest(namespaceName); //TODO: add support for custom RBAC
        const rbacManifest = new aws_eks_1.KubernetesManifest(clusterInfo.cluster.stack, namespaceName + "-rbac", {
            cluster: clusterInfo.cluster,
            manifest: defaultRoles,
            overwrite: true,
            prune: true
        });
        rbacManifest.node.addDependency(this.namespaceManifest);
        if (teamManifestDir) {
            (0, yaml_utils_1.applyYamlFromDir)(teamManifestDir, clusterInfo.cluster, this.namespaceManifest);
        }
    }
    /**
     * Sets up quotas
     * @param clusterInfo
     * @param namespaceName
     */
    setupNamespacePolicies(clusterInfo, namespaceName) {
        const quotaName = this.teamProps.name + "-quota";
        const quotaManifest = clusterInfo.cluster.addManifest(quotaName, {
            apiVersion: 'v1',
            kind: 'ResourceQuota',
            metadata: {
                name: quotaName,
                namespace: namespaceName
            },
            spec: {
                hard: this.teamProps.namespaceHardLimits
            }
        });
        quotaManifest.node.addDependency(this.namespaceManifest);
    }
    /**
     * Sets up ServiceAccount for the team namespace
     * @param clusterInfo
     */
    setupServiceAccount(clusterInfo) {
        const serviceAccountName = this.teamProps.serviceAccountName ? this.teamProps.serviceAccountName : `${this.teamProps.name}-sa`;
        const cluster = clusterInfo.cluster;
        this.serviceAccount = cluster.addServiceAccount(`${this.teamProps.name}-service-account`, {
            name: serviceAccountName,
            namespace: this.teamProps.namespace
        });
        this.serviceAccount.node.addDependency(this.namespaceManifest);
        if (this.teamProps.serviceAccountPolicies) {
            this.teamProps.serviceAccountPolicies.forEach(policy => this.serviceAccount.role.addManagedPolicy(policy));
        }
        const serviceAccountOutput = new aws_cdk_lib_1.CfnOutput(clusterInfo.cluster.stack, `${this.teamProps.name}-sa`, {
            value: serviceAccountName
        });
        serviceAccountOutput.node.addDependency(this.namespaceManifest);
    }
    /**
     * Sets up secrets
     * @param clusterInfo
     */
    setupSecrets(clusterInfo) {
        if (this.teamProps.teamSecrets) {
            const secretProviderClassName = this.teamProps.name + '-aws-secrets';
            new csi_driver_provider_aws_secrets_1.SecretProviderClass(clusterInfo, this.serviceAccount, secretProviderClassName, ...this.teamProps.teamSecrets);
        }
    }
}
exports.ApplicationTeam = ApplicationTeam;
/**
 * Platform team will setup all team members as admin access to the cluster by adding them to the master group.
 * The setup skips namespace/quota configuration.
 */
class PlatformTeam extends ApplicationTeam {
    constructor(teamProps) {
        super(teamProps);
    }
    /**
     * Override
     * @param clusterInfo
     */
    setup(clusterInfo) {
        this.defaultSetupAdminAccess(clusterInfo);
    }
}
exports.PlatformTeam = PlatformTeam;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVhbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi90ZWFtcy90ZWFtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUF3QztBQUN4QyxpREFBa0Y7QUFDbEYsMkNBQTJDO0FBQzNDLG1EQUFtRDtBQUVuRCw2R0FBOEc7QUFFOUcsb0RBQXVEO0FBQ3ZELDZEQUF3RDtBQUN4RCxvQ0FBa0M7QUFFbEM7O0dBRUc7QUFDSCxNQUFhLFNBQVM7SUFFbEI7OztPQUdHO0lBQ00sSUFBSSxDQUFTO0lBRXRCOztPQUVHO0lBQ00sU0FBUyxDQUFVO0lBRTVCOztPQUVHO0lBQ00sb0JBQW9CLEdBQThCLEVBQUUsOEJBQThCLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFFcEc7O09BRUc7SUFDTSxlQUFlLENBQTRCO0lBRXBEOztPQUVHO0lBQ00sbUJBQW1CLEdBQVk7UUFDcEMsY0FBYyxFQUFFLElBQUksRUFBRSw0QkFBNEI7UUFDbEQsaUJBQWlCLEVBQUUsTUFBTTtRQUN6QixZQUFZLEVBQUUsSUFBSTtRQUNsQixlQUFlLEVBQUUsTUFBTTtLQUMxQixDQUFDO0lBRUY7O09BRUc7SUFDTSxrQkFBa0IsQ0FBVTtJQUVyQzs7Ozs7OztPQU9HO0lBQ00sc0JBQXNCLENBQXdCO0lBRXZEOztPQUVHO0lBQ00sS0FBSyxDQUEyQjtJQUV6Qzs7O09BR0c7SUFDTSxXQUFXLENBQVU7SUFFOUI7O09BRUc7SUFDTSxXQUFXLENBQW9CO0lBRXhDOztPQUVHO0lBQ00sZUFBZSxDQUFVO0NBT3JDO0FBMUVELDhCQTBFQztBQUVELE1BQWEsZUFBZTtJQUVmLFNBQVMsQ0FBWTtJQUVyQixJQUFJLENBQVM7SUFFZixpQkFBaUIsQ0FBcUI7SUFFdEMsY0FBYyxDQUFpQjtJQUV0QyxZQUFZLFNBQW9CO1FBQzVCLElBQUksQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQztRQUMzQixJQUFJLENBQUMsU0FBUyxHQUFHO1lBQ2IsSUFBSSxFQUFF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QyxDQUFDO0NBQ0o7QUFiRCxvQ0FhQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENmbk91dHB1dCB9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgQ2x1c3RlciwgS3ViZXJuZXRlc01hbmlmZXN0LCBTZXJ2aWNlQWNjb3VudCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xyXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcbmltcG9ydCAqIGFzIGVrc3YyIGZyb20gJ0Bhd3MtY2RrL2F3cy1la3MtdjItYWxwaGEnO1xyXG5pbXBvcnQgeyBJUm9sZSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IENzaVNlY3JldFByb3BzLCBTZWNyZXRQcm92aWRlckNsYXNzIH0gZnJvbSAnLi4vYWRkb25zL3NlY3JldHMtc3RvcmUvY3NpLWRyaXZlci1wcm92aWRlci1hd3Mtc2VjcmV0cyc7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvLCBUZWFtLCBWYWx1ZXMgfSBmcm9tICcuLi9zcGknO1xyXG5pbXBvcnQgeyBhcHBseVlhbWxGcm9tRGlyIH0gZnJvbSAnLi4vdXRpbHMveWFtbC11dGlscyc7XHJcbmltcG9ydCB7IERlZmF1bHRUZWFtUm9sZXMgfSBmcm9tICcuL2RlZmF1bHQtdGVhbS1yb2xlcyc7XHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gJy4uL3V0aWxzJztcclxuXHJcbi8qKlxyXG4gKiBUZWFtIHByb3BlcnRpZXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgVGVhbVByb3BzIHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlcXVpcmVkIHVuaXF1ZSBuYW1lIGZvciBvcmdhbml6YXRpb24uXHJcbiAgICAgKiBNYXkgbWFwIHRvIGFuIE9VIG5hbWUuIFxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEZWZhdWx0cyB0byB0ZWFtIG5hbWUgcHJlZml4ZWQgYnkgXCJ0ZWFtLVwiXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IG5hbWVzcGFjZT86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqICBBbm5vdGF0aW9ucyBzdWNoIGFzIG5lY2Vzc2FyeSBmb3IgR2l0T3BzIGVuZ2luZS4gXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IG5hbWVzcGFjZUFubm90YXRpb25zPyA6IHsgW2tleTogc3RyaW5nXTogYW55OyB9ID0geyBcImFyZ29jZC5hcmdvcHJvai5pby9zeW5jLXdhdmVcIjogXCItMVwiIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBMYWJlbHMgc3VjaCBhcyBuZWNlc3NhcnkgZm9yIEFXUyBBcHBNZXNoIFxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBuYW1lc3BhY2VMYWJlbHM/IDogeyBba2V5OiBzdHJpbmddOiBhbnk7IH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcHRpb25hbCwgYnV0IGhpZ2hseSByZWNvbW1lbmRlZCBzZXR0aW5nIHRvIGVuc3VyZSBwcmVkaWN0YWJsZSBkZW1hbmRzLlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBuYW1lc3BhY2VIYXJkTGltaXRzPzogVmFsdWVzID0ge1xyXG4gICAgICAgICdyZXF1ZXN0cy5jcHUnOiAnMTAnLCAvLyBUT0RPIHZlcmlmeSBzYW5lIGRlZmF1bHRzXHJcbiAgICAgICAgJ3JlcXVlc3RzLm1lbW9yeSc6ICcxMEdpJyxcclxuICAgICAgICAnbGltaXRzLmNwdSc6ICcyMCcsXHJcbiAgICAgICAgJ2xpbWl0cy5tZW1vcnknOiAnMjBHaSdcclxuICAgIH07XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXJ2aWNlIEFjY291bnQgTmFtZVxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBzZXJ2aWNlQWNjb3VudE5hbWU/OiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJZiBzcGVjaWZpZWQsIHRoZSBJUlNBIGFjY291bnQgd2lsbCBiZSBjcmVhdGVkIGZvciB3aXRoIHRoZSBJUlNBIHJvbGVcclxuICAgICAqIGhhdmluZyB0aGUgc3BlY2lmaWVkIG1hbmFnZWQgcG9saWNpZXMuIFxyXG4gICAgICogXHJcbiAgICAgKiBAZXhhbXBsZVxyXG4gICAgICogc2VydmljZUFjY291bnRQb2xpY2llczogW01hbmFnZWRQb2xpY3kuZnJvbUF3c01hbmFnZWRQb2xpY3lOYW1lKFwiXCIpXVxyXG4gICAgICogXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHNlcnZpY2VBY2NvdW50UG9saWNpZXM/OiBpYW0uSU1hbmFnZWRQb2xpY3lbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqICBUZWFtIG1lbWJlcnMgd2hvIG5lZWQgdG8gZ2V0IGFjY2VzcyB0byB0aGUgY2x1c3RlclxyXG4gICAgICovXHJcbiAgICByZWFkb25seSB1c2Vycz86IEFycmF5PGlhbS5Bcm5QcmluY2lwYWw+O1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3B0aW9ucyBleGlzdGluZyByb2xlIHRoYXQgc2hvdWxkIGJlIHVzZWQgZm9yIGNsdXN0ZXIgYWNjZXNzLiBcclxuICAgICAqIElmIHVzZXJSb2xlIGFuZCB1c2VycyBhcmUgbm90IHByb3ZpZGVkLCB0aGVuIG5vIElBTSBzZXR1cCBpcyBwZXJmb3JtZWQuIFxyXG4gICAgICovXHJcbiAgICByZWFkb25seSB1c2VyUm9sZUFybj86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRlYW0gU2VjcmV0c1xyXG4gICAgICovXHJcbiAgICByZWFkb25seSB0ZWFtU2VjcmV0cz86IENzaVNlY3JldFByb3BzW107XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcHRpb25hbCwgZGlyZWN0b3J5IHdoZXJlIGEgdGVhbSdzIG1hbmlmZXN0cyBhcmUgc3RvcmVkXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHRlYW1NYW5pZmVzdERpcj86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wdGlvbmFsLCBVc2UgdGhpcyBmdW5jdGlvbiB0byBhZGQgaW5mcmFzdHJ1Y3R1cmUgb3Igd29ya2xvYWRzIFxyXG4gICAgICogZGVwbG95bWVudHRvIHRoZSB0ZWFtXHJcbiAgICAqL1xyXG4gICAgZXh0ZW5zaW9uRnVuY3Rpb24/ICh0ZWFtOiBBcHBsaWNhdGlvblRlYW0sIGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQ7XHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvblRlYW0gaW1wbGVtZW50cyBUZWFtIHtcclxuXHJcbiAgICByZWFkb25seSB0ZWFtUHJvcHM6IFRlYW1Qcm9wcztcclxuXHJcbiAgICByZWFkb25seSBuYW1lOiBzdHJpbmc7XHJcblxyXG4gICAgcHVibGljIG5hbWVzcGFjZU1hbmlmZXN0OiBLdWJlcm5ldGVzTWFuaWZlc3Q7XHJcblxyXG4gICAgcHVibGljIHNlcnZpY2VBY2NvdW50OiBTZXJ2aWNlQWNjb3VudDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih0ZWFtUHJvcHM6IFRlYW1Qcm9wcykge1xyXG4gICAgICAgIHRoaXMubmFtZSA9IHRlYW1Qcm9wcy5uYW1lO1xyXG4gICAgICAgIHRoaXMudGVhbVByb3BzID0ge1xyXG4gICAgICAgICAgICBuYW1lOiB0ZWFtUHJvcHMubmFtZSxcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiB0ZWFtUHJvcHMubmFtZXNwYWNlID8/IFwidGVhbS1cIiArIHRlYW1Qcm9wcy5uYW1lLFxyXG4gICAgICAgICAgICB1c2VyczogdGVhbVByb3BzLnVzZXJzLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2VBbm5vdGF0aW9uczogdGVhbVByb3BzLm5hbWVzcGFjZUFubm90YXRpb25zLFxyXG4gICAgICAgICAgICBuYW1lc3BhY2VMYWJlbHM6IHRlYW1Qcm9wcy5uYW1lc3BhY2VMYWJlbHMsXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZUhhcmRMaW1pdHM6IHRlYW1Qcm9wcy5uYW1lc3BhY2VIYXJkTGltaXRzLFxyXG4gICAgICAgICAgICBzZXJ2aWNlQWNjb3VudE5hbWU6IHRlYW1Qcm9wcy5zZXJ2aWNlQWNjb3VudE5hbWUsXHJcbiAgICAgICAgICAgIHNlcnZpY2VBY2NvdW50UG9saWNpZXM6IHRlYW1Qcm9wcy5zZXJ2aWNlQWNjb3VudFBvbGljaWVzLFxyXG4gICAgICAgICAgICB1c2VyUm9sZUFybjogdGVhbVByb3BzLnVzZXJSb2xlQXJuLFxyXG4gICAgICAgICAgICB0ZWFtU2VjcmV0czogdGVhbVByb3BzLnRlYW1TZWNyZXRzLFxyXG4gICAgICAgICAgICB0ZWFtTWFuaWZlc3REaXI6IHRlYW1Qcm9wcy50ZWFtTWFuaWZlc3REaXIsXHJcbiAgICAgICAgICAgIGV4dGVuc2lvbkZ1bmN0aW9uOiB0ZWFtUHJvcHMuZXh0ZW5zaW9uRnVuY3Rpb25cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBzZXR1cChjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiB2b2lkIHtcclxuICAgICAgICB0aGlzLmRlZmF1bHRTZXR1cEFjY2VzcyhjbHVzdGVySW5mbyk7XHJcbiAgICAgICAgdGhpcy5zZXR1cE5hbWVzcGFjZShjbHVzdGVySW5mbyk7XHJcbiAgICAgICAgdGhpcy5zZXR1cFNlcnZpY2VBY2NvdW50KGNsdXN0ZXJJbmZvKTtcclxuICAgICAgICB0aGlzLnNldHVwU2VjcmV0cyhjbHVzdGVySW5mbyk7XHJcbiAgICAgICAgaWYgKHRoaXMudGVhbVByb3BzLmV4dGVuc2lvbkZ1bmN0aW9uKSB7XHJcbiAgICAgICAgICAgIHRoaXMudGVhbVByb3BzLmV4dGVuc2lvbkZ1bmN0aW9uKHRoaXMsIGNsdXN0ZXJJbmZvKTtcclxuICAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb3RlY3RlZCBkZWZhdWx0U2V0dXBBY2Nlc3MoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKSB7XHJcbiAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnRlYW1Qcm9wczsgICAgICAgIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKCEoY2x1c3RlckluZm8uY2x1c3RlciBpbnN0YW5jZW9mIENsdXN0ZXIgfHwgY2x1c3RlckluZm8uY2x1c3RlcnYyIGluc3RhbmNlb2YgZWtzdjIuQ2x1c3RlcikpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLndhcm4oYFRlYW0gJHtwcm9wcy5uYW1lfSBoYXMgY2x1c3RlciBhY2Nlc3MgdXBkYXRlcyB0aGF0IGFyZSBub3Qgc3VwcG9ydGVkIHdpdGggaW1wb3J0ZWQgY2x1c3RlcnNgICk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgdXNlcnMgPSB0aGlzLnRlYW1Qcm9wcy51c2VycyA/PyBbXTtcclxuICAgICAgICBjb25zdCB0ZWFtUm9sZSA9IHRoaXMuZ2V0T3JDcmVhdGVSb2xlKGNsdXN0ZXJJbmZvLCB1c2VycywgcHJvcHMudXNlclJvbGVBcm4pO1xyXG5cclxuICAgICAgICBpZihjbHVzdGVySW5mby5jbHVzdGVydjIgaW5zdGFuY2VvZiBla3N2Mi5DbHVzdGVyKXtcclxuICAgICAgICAgICAgY29uc3QgZWtzQ2x1c3RlcnYyOiBla3N2Mi5DbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcnYyIGFzIGVrc3YyLkNsdXN0ZXI7XHJcbiAgICAgICAgICAgIGlmKHRlYW1Sb2xlKXtcclxuICAgICAgICAgICAgICAgIGVrc0NsdXN0ZXJ2Mi5ncmFudEFjY2Vzcyhwcm9wcy5uYW1lKyctYWNjZXNzJywgdGVhbVJvbGUucm9sZUFybiwgW25ldyBla3N2Mi5BY2Nlc3NQb2xpY3koe1xyXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1Njb3BlOiB7dHlwZTogZWtzdjIuQWNjZXNzU2NvcGVUeXBlLk5BTUVTUEFDRSwgbmFtZXNwYWNlczogW3Byb3BzLm5hbWVzcGFjZSFdfSwgXHJcbiAgICAgICAgICAgICAgICAgICAgcG9saWN5OiBla3N2Mi5BY2Nlc3NQb2xpY3lBcm4uQU1BWk9OX0VLU19BRE1JTl9QT0xJQ1lcclxuICAgICAgICAgICAgICAgIH0pXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9ZWxzZSBpZihjbHVzdGVySW5mby5jbHVzdGVyIGluc3RhbmNlb2YgQ2x1c3Rlcil7XHJcbiAgICAgICAgICAgIGNvbnN0IGVrc0NsdXN0ZXIgOiBDbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICAgICAgY29uc3QgYXdzQXV0aCA9IGVrc0NsdXN0ZXIuYXdzQXV0aDtcclxuICAgICAgICAgIGlmICh0ZWFtUm9sZSkge1xyXG4gICAgICAgICAgICBhd3NBdXRoLmFkZFJvbGVNYXBwaW5nKHRlYW1Sb2xlLCB7IGdyb3VwczogW3Byb3BzLm5hbWVzcGFjZSEgKyBcIi10ZWFtLWdyb3VwXCJdLCB1c2VybmFtZTogcHJvcHMubmFtZSB9KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgbmV3IENmbk91dHB1dChjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLCBwcm9wcy5uYW1lICsgJyB0ZWFtIHJvbGUgJywgeyB2YWx1ZTogdGVhbVJvbGUgPyB0ZWFtUm9sZS5yb2xlQXJuIDogXCJub25lXCIgfSk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBkZWZhdWx0U2V0dXBBZG1pbkFjY2VzcyhjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pIHtcclxuICAgICAgICBjb25zdCBwcm9wcyA9IHRoaXMudGVhbVByb3BzOyAgICAgICAgXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYoIShjbHVzdGVySW5mby5jbHVzdGVyIGluc3RhbmNlb2YgQ2x1c3RlciB8fCBjbHVzdGVySW5mby5jbHVzdGVydjIgaW5zdGFuY2VvZiBla3N2Mi5DbHVzdGVyKSkge1xyXG4gICAgICAgICAgICBsb2dnZXIud2FybihgVGVhbSAke3Byb3BzLm5hbWV9IGhhcyBjbHVzdGVyIGFjY2VzcyB1cGRhdGVzIHRoYXQgYXJlIG5vdCBzdXBwb3J0ZWQgd2l0aCBpbXBvcnRlZCBjbHVzdGVyc2AgKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCBhZG1pbnMgPSB0aGlzLnRlYW1Qcm9wcy51c2VycyA/PyBbXTtcclxuICAgICAgICBjb25zdCBhZG1pblJvbGUgPSB0aGlzLmdldE9yQ3JlYXRlUm9sZShjbHVzdGVySW5mbywgYWRtaW5zLCBwcm9wcy51c2VyUm9sZUFybik7XHJcblxyXG4gICAgICAgIGlmKGNsdXN0ZXJJbmZvLmNsdXN0ZXJ2MiBpbnN0YW5jZW9mIGVrc3YyLkNsdXN0ZXIpe1xyXG4gICAgICAgICAgICBjb25zdCBla3NDbHVzdGVydjI6IGVrc3YyLkNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVydjIhO1xyXG4gICAgICAgICAgICBpZihhZG1pblJvbGUpe1xyXG4gICAgICAgICAgICAgICAgZWtzQ2x1c3RlcnYyLmdyYW50QWNjZXNzKHByb3BzLm5hbWUrJy1hY2Nlc3MnLCBhZG1pblJvbGUucm9sZUFybiwgW25ldyBla3N2Mi5BY2Nlc3NQb2xpY3koe1xyXG4gICAgICAgICAgICAgICAgICAgIGFjY2Vzc1Njb3BlOiB7dHlwZTogZWtzdjIuQWNjZXNzU2NvcGVUeXBlLkNMVVNURVJ9LCBcclxuICAgICAgICAgICAgICAgICAgICBwb2xpY3k6IGVrc3YyLkFjY2Vzc1BvbGljeUFybi5BTUFaT05fRUtTX0NMVVNURVJfQURNSU5fUE9MSUNZXHJcbiAgICAgICAgICAgICAgICB9KV0pO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfWVsc2UgaWYgKGNsdXN0ZXJJbmZvLmNsdXN0ZXIgaW5zdGFuY2VvZiBDbHVzdGVyKXtcclxuXHJcblxyXG4gICAgICAgICAgICBpZiAoYWRtaW5Sb2xlKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBla3NDbHVzdGVyOiBDbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICAgICAgICAgIGVrc0NsdXN0ZXIuYXdzQXV0aC5hZGRNYXN0ZXJzUm9sZShhZG1pblJvbGUsIHRoaXMudGVhbVByb3BzLm5hbWUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIG5ldyBDZm5PdXRwdXQoY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjaywgcHJvcHMubmFtZSArICcgdGVhbSBhZG1pbiAnLCB7IHZhbHVlOiBhZG1pblJvbGUgPyBhZG1pblJvbGUucm9sZUFybiA6IFwibm9uZVwiIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ3JlYXRlcyBhIG5ldyByb2xlIHdpdGggdHJ1c3QgcmVsYXRpb25zaGlwIG9yIGFkZHMgdHJ1c3QgcmVsYXRpb25zaGlwIGZvciBhbiBleGlzdGluZyByb2xlLlxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvIFxyXG4gICAgICogQHBhcmFtIHVzZXJzIFxyXG4gICAgICogQHBhcmFtIHJvbGUgbWF5IGJlIG51bGwgaWYgYm90aCByb2xlIGFuZCB1c2VycyB3ZXJlIG5vdCBwcm92aWRlZFxyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBnZXRPckNyZWF0ZVJvbGUoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCB1c2VyczogQXJyYXk8aWFtLkFyblByaW5jaXBhbD4sIHJvbGVBcm4/OiBzdHJpbmcpOiBpYW0uSVJvbGUgfCB1bmRlZmluZWQge1xyXG4gICAgICAgIGxldCByb2xlOiBJUm9sZSB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBcclxuICAgICAgICBpZiAocm9sZUFybikge1xyXG4gICAgICAgICAgICByb2xlID0gaWFtLlJvbGUuZnJvbVJvbGVBcm4oY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjaywgYCR7dGhpcy5uYW1lfS10ZWFtLXJvbGVgLCByb2xlQXJuKTtcclxuICAgICAgICAgICAgdXNlcnMuZm9yRWFjaCh1c2VyID0+IHJvbGU/LmdyYW50KHVzZXIsIFwic3RzOmFzc3VtZVJvbGVcIikpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHVzZXJzICYmIHVzZXJzLmxlbmd0aCA+IDApe1xyXG4gICAgICAgICAgICByb2xlID0gbmV3IGlhbS5Sb2xlKGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2ssIHRoaXMudGVhbVByb3BzLm5hbWVzcGFjZSArICdBY2Nlc3NSb2xlJywge1xyXG4gICAgICAgICAgICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLkNvbXBvc2l0ZVByaW5jaXBhbCguLi51c2VycylcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJvbGUuYWRkVG9QcmluY2lwYWxQb2xpY3kobmV3IGlhbS5Qb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBbY2x1c3RlckluZm8uY2x1c3Rlci5jbHVzdGVyQXJuXSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVrczpEZXNjcmliZU5vZGVncm91cFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWtzOkxpc3ROb2RlZ3JvdXBzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJla3M6RGVzY3JpYmVDbHVzdGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJla3M6TGlzdENsdXN0ZXJzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJla3M6QWNjZXNzS3ViZXJuZXRlc0FwaVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwic3NtOkdldFBhcmFtZXRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiZWtzOkxpc3RVcGRhdGVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJla3M6TGlzdEZhcmdhdGVQcm9maWxlc1wiXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgICAgICByb2xlLmFkZFRvUHJpbmNpcGFsUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgICAgIHJlc291cmNlczogW1wiKlwiXSxcclxuICAgICAgICAgICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICAgICAgICAgICBcImVrczpMaXN0Q2x1c3RlcnNcIlxyXG4gICAgICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gcm9sZTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgbmFtZXNwYWNlIGFuZCBzZXRzIHVwIHBvbGljaWVzLlxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvIFxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgc2V0dXBOYW1lc3BhY2UoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKSB7XHJcbiAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLnRlYW1Qcm9wcztcclxuICAgICAgICBjb25zdCBuYW1lc3BhY2VOYW1lID0gcHJvcHMubmFtZXNwYWNlITtcclxuICAgICAgICBjb25zdCB0ZWFtTWFuaWZlc3REaXIgPSBwcm9wcy50ZWFtTWFuaWZlc3REaXI7XHJcblxyXG4gICAgICAgIHRoaXMubmFtZXNwYWNlTWFuaWZlc3QgPSBuZXcgS3ViZXJuZXRlc01hbmlmZXN0KGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2ssIHByb3BzLm5hbWUsIHtcclxuICAgICAgICAgICAgY2x1c3RlcjogY2x1c3RlckluZm8uY2x1c3RlcixcclxuICAgICAgICAgICAgbWFuaWZlc3Q6IFt7XHJcbiAgICAgICAgICAgICAgICBhcGlWZXJzaW9uOiAndjEnLFxyXG4gICAgICAgICAgICAgICAga2luZDogJ05hbWVzcGFjZScsXHJcbiAgICAgICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IG5hbWVzcGFjZU5hbWUsXHJcbiAgICAgICAgICAgICAgICAgICAgYW5ub3RhdGlvbnM6IHByb3BzLm5hbWVzcGFjZUFubm90YXRpb25zLFxyXG4gICAgICAgICAgICAgICAgICAgIGxhYmVsczogcHJvcHMubmFtZXNwYWNlTGFiZWxzXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICBvdmVyd3JpdGU6IHRydWUsXHJcbiAgICAgICAgICAgIHBydW5lOiB0cnVlXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGlmIChwcm9wcy5uYW1lc3BhY2VIYXJkTGltaXRzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0dXBOYW1lc3BhY2VQb2xpY2llcyhjbHVzdGVySW5mbywgbmFtZXNwYWNlTmFtZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCBkZWZhdWx0Um9sZXMgPSBuZXcgRGVmYXVsdFRlYW1Sb2xlcygpLmNyZWF0ZU1hbmlmZXN0KG5hbWVzcGFjZU5hbWUpOyAvL1RPRE86IGFkZCBzdXBwb3J0IGZvciBjdXN0b20gUkJBQ1xyXG5cclxuICAgICAgICBjb25zdCByYmFjTWFuaWZlc3QgPSBuZXcgS3ViZXJuZXRlc01hbmlmZXN0KGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2ssIG5hbWVzcGFjZU5hbWUgKyBcIi1yYmFjXCIsIHtcclxuICAgICAgICAgICAgY2x1c3RlcjogY2x1c3RlckluZm8uY2x1c3RlcixcclxuICAgICAgICAgICAgbWFuaWZlc3Q6IGRlZmF1bHRSb2xlcyxcclxuICAgICAgICAgICAgb3ZlcndyaXRlOiB0cnVlLFxyXG4gICAgICAgICAgICBwcnVuZTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByYmFjTWFuaWZlc3Qubm9kZS5hZGREZXBlbmRlbmN5KHRoaXMubmFtZXNwYWNlTWFuaWZlc3QpO1xyXG5cclxuICAgICAgICBpZiAodGVhbU1hbmlmZXN0RGlyKXtcclxuICAgICAgICAgICAgYXBwbHlZYW1sRnJvbURpcih0ZWFtTWFuaWZlc3REaXIsIGNsdXN0ZXJJbmZvLmNsdXN0ZXIsIHRoaXMubmFtZXNwYWNlTWFuaWZlc3QpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdXAgcXVvdGFzXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAgICAgKiBAcGFyYW0gbmFtZXNwYWNlTmFtZSBcclxuICAgICAqL1xyXG4gICAgcHJvdGVjdGVkIHNldHVwTmFtZXNwYWNlUG9saWNpZXMoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCBuYW1lc3BhY2VOYW1lOiBzdHJpbmcpIHtcclxuICAgICAgICBjb25zdCBxdW90YU5hbWUgPSB0aGlzLnRlYW1Qcm9wcy5uYW1lICsgXCItcXVvdGFcIjtcclxuICAgICAgICBjb25zdCBxdW90YU1hbmlmZXN0ID0gY2x1c3RlckluZm8uY2x1c3Rlci5hZGRNYW5pZmVzdChxdW90YU5hbWUsIHtcclxuICAgICAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcclxuICAgICAgICAgICAga2luZDogJ1Jlc291cmNlUXVvdGEnLFxyXG4gICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogcXVvdGFOYW1lLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2VOYW1lXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgIGhhcmQ6IHRoaXMudGVhbVByb3BzLm5hbWVzcGFjZUhhcmRMaW1pdHNcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHF1b3RhTWFuaWZlc3Qubm9kZS5hZGREZXBlbmRlbmN5KHRoaXMubmFtZXNwYWNlTWFuaWZlc3QpO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdXAgU2VydmljZUFjY291bnQgZm9yIHRoZSB0ZWFtIG5hbWVzcGFjZVxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvIFxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgc2V0dXBTZXJ2aWNlQWNjb3VudChjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pIHtcclxuICAgICAgICBjb25zdCBzZXJ2aWNlQWNjb3VudE5hbWUgPSB0aGlzLnRlYW1Qcm9wcy5zZXJ2aWNlQWNjb3VudE5hbWU/IHRoaXMudGVhbVByb3BzLnNlcnZpY2VBY2NvdW50TmFtZSA6IGAke3RoaXMudGVhbVByb3BzLm5hbWV9LXNhYDtcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICBcclxuICAgICAgICB0aGlzLnNlcnZpY2VBY2NvdW50ID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudChgJHt0aGlzLnRlYW1Qcm9wcy5uYW1lfS1zZXJ2aWNlLWFjY291bnRgLCB7XHJcbiAgICAgICAgICAgIG5hbWU6IHNlcnZpY2VBY2NvdW50TmFtZSxcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiB0aGlzLnRlYW1Qcm9wcy5uYW1lc3BhY2VcclxuICAgICAgICB9KTtcclxuICAgICAgICB0aGlzLnNlcnZpY2VBY2NvdW50Lm5vZGUuYWRkRGVwZW5kZW5jeSh0aGlzLm5hbWVzcGFjZU1hbmlmZXN0KTtcclxuXHJcbiAgICAgICAgaWYodGhpcy50ZWFtUHJvcHMuc2VydmljZUFjY291bnRQb2xpY2llcykge1xyXG4gICAgICAgICAgICB0aGlzLnRlYW1Qcm9wcy5zZXJ2aWNlQWNjb3VudFBvbGljaWVzLmZvckVhY2gocG9saWN5ID0+IHRoaXMuc2VydmljZUFjY291bnQucm9sZS5hZGRNYW5hZ2VkUG9saWN5KHBvbGljeSkpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2VydmljZUFjY291bnRPdXRwdXQgPSBuZXcgQ2ZuT3V0cHV0KGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2ssIGAke3RoaXMudGVhbVByb3BzLm5hbWV9LXNhYCwge1xyXG4gICAgICAgICAgICB2YWx1ZTogc2VydmljZUFjY291bnROYW1lXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgc2VydmljZUFjY291bnRPdXRwdXQubm9kZS5hZGREZXBlbmRlbmN5KHRoaXMubmFtZXNwYWNlTWFuaWZlc3QpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogU2V0cyB1cCBzZWNyZXRzXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm9cclxuICAgICAqL1xyXG4gICAgcHJvdGVjdGVkIHNldHVwU2VjcmV0cyhjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pIHtcclxuICAgICAgICBpZiAodGhpcy50ZWFtUHJvcHMudGVhbVNlY3JldHMpIHtcclxuICAgICAgICAgICAgY29uc3Qgc2VjcmV0UHJvdmlkZXJDbGFzc05hbWUgPSB0aGlzLnRlYW1Qcm9wcy5uYW1lICsgJy1hd3Mtc2VjcmV0cyc7XHJcbiAgICAgICAgICAgIG5ldyBTZWNyZXRQcm92aWRlckNsYXNzKGNsdXN0ZXJJbmZvLCB0aGlzLnNlcnZpY2VBY2NvdW50LCBzZWNyZXRQcm92aWRlckNsYXNzTmFtZSwgLi4udGhpcy50ZWFtUHJvcHMudGVhbVNlY3JldHMpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFBsYXRmb3JtIHRlYW0gd2lsbCBzZXR1cCBhbGwgdGVhbSBtZW1iZXJzIGFzIGFkbWluIGFjY2VzcyB0byB0aGUgY2x1c3RlciBieSBhZGRpbmcgdGhlbSB0byB0aGUgbWFzdGVyIGdyb3VwLlxyXG4gKiBUaGUgc2V0dXAgc2tpcHMgbmFtZXNwYWNlL3F1b3RhIGNvbmZpZ3VyYXRpb24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgUGxhdGZvcm1UZWFtIGV4dGVuZHMgQXBwbGljYXRpb25UZWFtIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih0ZWFtUHJvcHM6IFRlYW1Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHRlYW1Qcm9wcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPdmVycmlkZVxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvXHJcbiAgICAgKi9cclxuICAgIHNldHVwKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQge1xyXG4gICAgICAgIHRoaXMuZGVmYXVsdFNldHVwQWRtaW5BY2Nlc3MoY2x1c3RlckluZm8pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==