"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoreAddOn = exports.CoreAddOnProps = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const utils_1 = require("../../utils");
const sdk = require("@aws-sdk/client-eks");
const aws_cdk_lib_1 = require("aws-cdk-lib");
class CoreAddOnProps {
    /**
     * Name of the add-on to instantiate
     */
    addOnName;
    /**
     * Version of the add-on to use. Must match the version of the cluster where it
     * will be deployed it
     */
    version;
    /**
     * Policy document provider returns the policy required by the add-on to allow it to interact with AWS resources
     */
    policyDocumentProvider;
    /**
     * Service Account Name to be used with AddOn.
     */
    saName;
    /**
     * Namespace to create the ServiceAccount.
     */
    namespace;
    /**
     * ConfigurationValues field to pass custom configurations to Addon
     */
    configurationValues;
    /**
     * Indicates that add-on must be installed before any capacity is added for worker nodes (incuding Fargate).
     */
    controlPlaneAddOn;
    /**
     * Map between kubernetes versions and addOn versions for auto selection.
     */
    versionMap;
}
exports.CoreAddOnProps = CoreAddOnProps;
const DEFAULT_NAMESPACE = "kube-system";
/**
 * Implementation of EKS Managed add-ons.
 */
class CoreAddOn {
    coreAddOnProps;
    constructor(coreAddOnProps) {
        this.coreAddOnProps = coreAddOnProps;
        utils_1.userLog.debug(`Core add-on ${coreAddOnProps.addOnName} is at version ${coreAddOnProps.version}`);
    }
    async deploy(clusterInfo) {
        let serviceAccountRoleArn = undefined;
        let serviceAccount = undefined;
        let saNamespace = undefined;
        saNamespace = DEFAULT_NAMESPACE;
        if (this.coreAddOnProps?.namespace) {
            saNamespace = this.coreAddOnProps.namespace;
        }
        const ns = this.createNamespace(clusterInfo, saNamespace);
        // Create a service account if user provides namespace, PolicyDocument
        const policies = this.provideManagedPolicies(clusterInfo);
        if (policies) {
            serviceAccount = this.createServiceAccount(clusterInfo, saNamespace, policies);
            serviceAccountRoleArn = serviceAccount.role.roleArn;
            if (ns) {
                serviceAccount.node.addDependency(ns);
            }
        }
        let version = this.coreAddOnProps.version;
        if (this.coreAddOnProps.version === "auto") {
            version = await this.provideVersion(clusterInfo.version, clusterInfo.cluster.stack.region);
        }
        let addOnProps = {
            addonName: this.coreAddOnProps.addOnName,
            addonVersion: version,
            configurationValues: JSON.stringify(this.coreAddOnProps.configurationValues),
            clusterName: clusterInfo.cluster.clusterName,
            serviceAccountRoleArn: serviceAccountRoleArn,
            resolveConflicts: "OVERWRITE"
        };
        const cfnAddon = new aws_eks_1.CfnAddon(clusterInfo.cluster.stack, this.coreAddOnProps.addOnName + "-addOn", addOnProps);
        if (serviceAccount) {
            cfnAddon.node.addDependency(serviceAccount);
        }
        else if (ns) {
            cfnAddon.node.addDependency(ns);
        }
        if (this.coreAddOnProps.controlPlaneAddOn) {
            (0, utils_1.deployBeforeCapacity)(cfnAddon, clusterInfo);
        }
        /**
         *  Retain the addon otherwise cluster destroy will fail due to CoreDnsComputeTypePatch
         *  https://github.com/aws/aws-cdk/issues/28621
         * */
        if (clusterInfo.cluster instanceof aws_eks_1.FargateCluster && this.coreAddOnProps.addOnName === "coredns") {
            cfnAddon.applyRemovalPolicy(aws_cdk_lib_1.RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE);
        }
        // Instantiate the Add-on
        return Promise.resolve(cfnAddon);
    }
    /**
     * Override this method to create namespace for the core addon. In many cases the addon is created in the kube-system namespace
     * which does not require creation as it is always there.
     * For addons that support other namespace as destinations this method should be implemented.
     * @param clusterInfo
     * @param name
     * @returns
     */
    createNamespace(_clusterInfo, _namespaceName) {
        return undefined;
    }
    /**
     * Override this method to control how service account is created.
     * @param clusterInfo
     * @param saNamespace
     * @param policies
     * @returns
     */
    createServiceAccount(clusterInfo, saNamespace, policies) {
        return (0, utils_1.createServiceAccountWithPolicy)(clusterInfo.cluster, this.coreAddOnProps.saName, saNamespace, ...policies);
    }
    /**
     * Template method with default implementation to execute the supplied function of policyDocumentProvider.
     * Allows overriding this method in subclasses for more complex cases of policies.
     * @param clusterInfo
     * @returns
     */
    providePolicyDocument(clusterInfo) {
        if (this.coreAddOnProps?.policyDocumentProvider) {
            return this.coreAddOnProps.policyDocumentProvider(clusterInfo.cluster.stack.partition);
        }
        return undefined;
    }
    /**
     * Template method to return managed policies for the service account.
     * Allows overriding in subclasses to handle more complex cases of policies.
     */
    provideManagedPolicies(clusterInfo) {
        let result;
        const policyDocument = this.providePolicyDocument(clusterInfo);
        if (policyDocument) {
            const policy = new aws_iam_1.ManagedPolicy(clusterInfo.cluster, `${this.coreAddOnProps.addOnName}-managed-policy`, {
                document: policyDocument
            });
            result = [policy];
        }
        return result;
    }
    async provideVersion(clusterVersion, region) {
        const client = new sdk.EKSClient({ region });
        const command = new sdk.DescribeAddonVersionsCommand({
            addonName: this.coreAddOnProps.addOnName,
            kubernetesVersion: clusterVersion.version
        });
        try {
            const response = await client.send(command);
            if (response.addons && response.addons.length > 0) {
                const defaultVersions = response.addons?.flatMap(addon => addon.addonVersions?.filter(version => version.compatibilities?.some(compatibility => compatibility.defaultVersion === true)));
                const version = defaultVersions[0]?.addonVersion;
                if (!version) {
                    throw new Error(`No default version found for addo-on ${this.coreAddOnProps.addOnName}`);
                }
                utils_1.userLog.debug(`Core add-on ${this.coreAddOnProps.addOnName} has autoselected version ${version}`);
                return version;
            }
            else {
                throw new Error(`No add-on versions found for addon-on ${this.coreAddOnProps.addOnName}`);
            }
        }
        catch (error) {
            utils_1.logger.warn(error);
            utils_1.logger.warn(error);
            utils_1.logger.warn(`Failed to retrieve add-on versions from EKS for add-on ${this.coreAddOnProps.addOnName}.`);
            utils_1.logger.warn("Possible reasons for failures - Unauthorized or Authentication failure or Network failure on the terminal.");
            utils_1.logger.warn(" Falling back to default version.");
            let version = this.provideDefaultAutoVersion(clusterVersion);
            utils_1.userLog.debug(`Core add-on ${this.coreAddOnProps.addOnName} has autoselected version ${version}`);
            return version;
        }
    }
    provideDefaultAutoVersion(version) {
        const versionMap = this.coreAddOnProps.versionMap;
        if (versionMap && versionMap.size > 0) {
            return versionMap.get(version) ?? versionMap.values().next().value;
        }
        throw new Error(`No default version found for add-on ${this.coreAddOnProps.addOnName}`);
    }
    getAddonVersion() {
        return this.coreAddOnProps.version;
    }
}
exports.CoreAddOn = CoreAddOn;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2NvcmUtYWRkb24vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsaURBQStFO0FBSS9FLGlEQUFvRjtBQUVwRix1Q0FBc0c7QUFDdEcsMkNBQTJDO0FBQzNDLDZDQUE0QztBQUc1QyxNQUFhLGNBQWM7SUFDdkI7O09BRUc7SUFDTSxTQUFTLENBQVM7SUFDM0I7OztPQUdHO0lBQ00sT0FBTyxDQUFTO0lBQ3pCOztPQUVHO0lBQ00sc0JBQXNCLENBQXlDO0lBQ3hFOztPQUVHO0lBQ00sTUFBTSxDQUFTO0lBQ3hCOztPQUVHO0lBQ00sU0FBUyxDQUFVO0lBQzVCOztPQUVHO0lBQ00sbUJBQW1CLENBQVU7SUFFdEM7O09BRUc7SUFDTSxpQkFBaUIsQ0FBVztJQUdyQzs7T0FFRztJQUNNLFVBQVUsQ0FBa0M7Q0FDeEQ7QUFyQ0Qsd0NBcUNDO0FBRUQsTUFBTSxpQkFBaUIsR0FBRyxhQUFhLENBQUM7QUFFeEM7O0dBRUc7QUFDSCxNQUFhLFNBQVM7SUFFVCxjQUFjLENBQWlCO0lBRXhDLFlBQVksY0FBOEI7UUFDdEMsSUFBSSxDQUFDLGNBQWMsR0FBRyxjQUFjLENBQUM7UUFDckMsZUFBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLGNBQWMsQ0FBQyxTQUFTLGtCQUFrQixjQUFjLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQztJQUNyRyxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxXQUF3QjtRQUVqQyxJQUFJLHFCQUFxQixHQUF1QixTQUFTLENBQUM7UUFDMUQsSUFBSSxjQUFjLEdBQStCLFNBQVMsQ0FBQztRQUMzRCxJQUFJLFdBQVcsR0FBdUIsU0FBUyxDQUFDO1FBRWhELFdBQVcsR0FBRyxpQkFBaUIsQ0FBQztRQUNoQyxJQUFJLElBQUksQ0FBQyxjQUFjLEVBQUUsU0FBUyxFQUFFLENBQUM7WUFDakMsV0FBVyxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDO1FBQ2hELENBQUM7UUFFRCxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUUxRCxzRUFBc0U7UUFDdEUsTUFBTSxRQUFRLEdBQUcsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBQzFELElBQUksUUFBUSxFQUFFLENBQUM7WUFDWCxjQUFjLEdBQUcsSUFBSSxDQUFDLG9CQUFvQixDQUFDLFdBQVcsRUFBRSxXQUFXLEVBQUUsUUFBUSxDQUFDLENBQUM7WUFDL0UscUJBQXFCLEdBQUcsY0FBYyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUM7WUFDcEQsSUFBRyxFQUFFLEVBQUUsQ0FBQztnQkFDSixjQUFjLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUMxQyxDQUFDO1FBQ0wsQ0FBQztRQUVELElBQUksT0FBTyxHQUFXLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO1FBRWxELElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxPQUFPLEtBQUssTUFBTSxFQUFFLENBQUM7WUFDekMsT0FBTyxHQUFHLE1BQU0sSUFBSSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsT0FBTyxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBQy9GLENBQUM7UUFFRCxJQUFJLFVBQVUsR0FBRztZQUNiLFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVM7WUFDeEMsWUFBWSxFQUFFLE9BQU87WUFDckIsbUJBQW1CLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsY0FBYyxDQUFDLG1CQUFtQixDQUFDO1lBQzVFLFdBQVcsRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLFdBQVc7WUFDNUMscUJBQXFCLEVBQUUscUJBQXFCO1lBQzVDLGdCQUFnQixFQUFFLFdBQVc7U0FDaEMsQ0FBQztRQUVGLE1BQU0sUUFBUSxHQUFHLElBQUksa0JBQVEsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsR0FBRyxRQUFRLEVBQUUsVUFBVSxDQUFDLENBQUM7UUFDL0csSUFBSSxjQUFjLEVBQUUsQ0FBQztZQUNqQixRQUFRLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUNoRCxDQUFDO2FBQ0ksSUFBRyxFQUFFLEVBQUUsQ0FBQztZQUNULFFBQVEsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLENBQUM7UUFFRCxJQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsaUJBQWlCLEVBQUUsQ0FBQztZQUN2QyxJQUFBLDRCQUFvQixFQUFDLFFBQVEsRUFBRSxXQUFXLENBQUMsQ0FBQztRQUNoRCxDQUFDO1FBQ0Q7OzthQUdLO1FBRUwsSUFBRyxXQUFXLENBQUMsT0FBTyxZQUFZLHdCQUFjLElBQUksSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFDLENBQUM7WUFDN0YsUUFBUSxDQUFDLGtCQUFrQixDQUFDLDJCQUFhLENBQUMsMEJBQTBCLENBQUMsQ0FBQztRQUMxRSxDQUFDO1FBQ0QseUJBQXlCO1FBQ3pCLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRUQ7Ozs7Ozs7T0FPRztJQUNILGVBQWUsQ0FBQyxZQUF5QixFQUFFLGNBQXNCO1FBQzdELE9BQU8sU0FBUyxDQUFDO0lBQ3JCLENBQUM7SUFFRDs7Ozs7O09BTUc7SUFDSCxvQkFBb0IsQ0FBQyxXQUF3QixFQUFFLFdBQW1CLEVBQUUsUUFBMEI7UUFDMUYsT0FBTyxJQUFBLHNDQUE4QixFQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLGNBQWMsQ0FBQyxNQUFNLEVBQ2pGLFdBQVcsRUFBRSxHQUFHLFFBQVEsQ0FBQyxDQUFDO0lBQ2xDLENBQUM7SUFFRDs7Ozs7T0FLRztJQUNILHFCQUFxQixDQUFDLFdBQXdCO1FBQzFDLElBQUcsSUFBSSxDQUFDLGNBQWMsRUFBRSxzQkFBc0IsRUFBRSxDQUFDO1lBQzdDLE9BQU8sSUFBSSxDQUFDLGNBQWMsQ0FBQyxzQkFBc0IsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxTQUFTLENBQUMsQ0FBQztRQUMzRixDQUFDO1FBQ0QsT0FBTyxTQUFTLENBQUM7SUFDckIsQ0FBQztJQUVEOzs7T0FHRztJQUNILHNCQUFzQixDQUFDLFdBQXdCO1FBQzNDLElBQUksTUFBcUMsQ0FBQztRQUMxQyxNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUMscUJBQXFCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFL0QsSUFBRyxjQUFjLEVBQUUsQ0FBQztZQUNoQixNQUFNLE1BQU0sR0FBRyxJQUFJLHVCQUFhLENBQUMsV0FBVyxDQUFDLE9BQU8sRUFBRSxHQUFHLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxpQkFBaUIsRUFBRTtnQkFDckcsUUFBUSxFQUFFLGNBQWM7YUFDM0IsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDdEIsQ0FBQztRQUNELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7SUFFRCxLQUFLLENBQUMsY0FBYyxDQUFDLGNBQWlDLEVBQUUsTUFBYztRQUNsRSxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQzdDLE1BQU0sT0FBTyxHQUFHLElBQUksR0FBRyxDQUFDLDRCQUE0QixDQUFDO1lBQ2pELFNBQVMsRUFBRSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVM7WUFDeEMsaUJBQWlCLEVBQUUsY0FBYyxDQUFDLE9BQU87U0FDNUMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDO1lBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1lBQzVDLElBQUksUUFBUSxDQUFDLE1BQU0sSUFBSSxRQUFRLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQ2pELENBQUM7Z0JBQ0csTUFBTSxlQUFlLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FDckQsS0FBSyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FDcEMsT0FBTyxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsY0FBYyxLQUFLLElBQUksQ0FBQyxDQUN0RixDQUNKLENBQUM7Z0JBRUYsTUFBTSxPQUFPLEdBQXVCLGVBQWUsQ0FBQyxDQUFDLENBQUMsRUFBRSxZQUFZLENBQUM7Z0JBQ3JFLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztvQkFDWCxNQUFNLElBQUksS0FBSyxDQUFDLHdDQUF3QyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7Z0JBQzdGLENBQUM7Z0JBQ0QsZUFBTyxDQUFDLEtBQUssQ0FBQyxlQUFlLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyw2QkFBNkIsT0FBTyxFQUFFLENBQUMsQ0FBQztnQkFDbEcsT0FBTyxPQUFPLENBQUM7WUFDbkIsQ0FBQztpQkFDSSxDQUFDO2dCQUNGLE1BQU0sSUFBSSxLQUFLLENBQUMseUNBQXlDLElBQUksQ0FBQyxjQUFjLENBQUMsU0FBUyxFQUFFLENBQUMsQ0FBQztZQUM5RixDQUFDO1FBQ0wsQ0FBQztRQUNELE9BQU8sS0FBSyxFQUFFLENBQUM7WUFDWCxjQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ25CLGNBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDbkIsY0FBTSxDQUFDLElBQUksQ0FBQywwREFBMEQsSUFBSSxDQUFDLGNBQWMsQ0FBQyxTQUFTLEdBQUcsQ0FBQyxDQUFDO1lBQ3hHLGNBQU0sQ0FBQyxJQUFJLENBQUMsNEdBQTRHLENBQUMsQ0FBQztZQUMxSCxjQUFNLENBQUMsSUFBSSxDQUFDLG1DQUFtQyxDQUFDLENBQUM7WUFDakQsSUFBSSxPQUFPLEdBQVcsSUFBSSxDQUFDLHlCQUF5QixDQUFDLGNBQWMsQ0FBQyxDQUFDO1lBQ3JFLGVBQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsNkJBQTZCLE9BQU8sRUFBRSxDQUFDLENBQUM7WUFDbEcsT0FBTyxPQUFPLENBQUM7UUFDbkIsQ0FBQztJQUNMLENBQUM7SUFFRCx5QkFBeUIsQ0FBQyxPQUEwQjtRQUNoRCxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQztRQUNsRCxJQUFJLFVBQVUsSUFBSSxVQUFVLENBQUMsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDO1lBQ3BDLE9BQU8sVUFBVSxDQUFDLEdBQUcsQ0FBQyxPQUFPLENBQUMsSUFBSSxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsS0FBTSxDQUFDO1FBQ3hFLENBQUM7UUFDRCxNQUFNLElBQUksS0FBSyxDQUFDLHVDQUF1QyxJQUFJLENBQUMsY0FBYyxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUM7SUFDNUYsQ0FBQztJQUVELGVBQWU7UUFDYixPQUFPLElBQUksQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDO0lBQ3JDLENBQUM7Q0FDSjtBQS9LRCw4QkErS0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDZm5BZGRvbiwgRmFyZ2F0ZUNsdXN0ZXIsIFNlcnZpY2VBY2NvdW50IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckFkZE9uIH0gZnJvbSBcIi4uLy4uXCI7XHJcbmltcG9ydCB7IEF1dG9Nb2RlQWRkb24sIENsdXN0ZXJJbmZvLCBWYWx1ZXMgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCwgSUNvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IElNYW5hZ2VkUG9saWN5LCBNYW5hZ2VkUG9saWN5LCBQb2xpY3lEb2N1bWVudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IEt1YmVybmV0ZXNWZXJzaW9uIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgY3JlYXRlU2VydmljZUFjY291bnRXaXRoUG9saWN5LCBkZXBsb3lCZWZvcmVDYXBhY2l0eSwgbG9nZ2VyLCB1c2VyTG9nLCAgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0ICogYXMgc2RrIGZyb20gXCJAYXdzLXNkay9jbGllbnQtZWtzXCI7XHJcbmltcG9ydCB7IFJlbW92YWxQb2xpY3kgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgQ29yZUFkZE9uUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lIG9mIHRoZSBhZGQtb24gdG8gaW5zdGFudGlhdGVcclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgYWRkT25OYW1lOiBzdHJpbmc7XHJcbiAgICAvKipcclxuICAgICAqIFZlcnNpb24gb2YgdGhlIGFkZC1vbiB0byB1c2UuIE11c3QgbWF0Y2ggdGhlIHZlcnNpb24gb2YgdGhlIGNsdXN0ZXIgd2hlcmUgaXRcclxuICAgICAqIHdpbGwgYmUgZGVwbG95ZWQgaXRcclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgdmVyc2lvbjogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiBQb2xpY3kgZG9jdW1lbnQgcHJvdmlkZXIgcmV0dXJucyB0aGUgcG9saWN5IHJlcXVpcmVkIGJ5IHRoZSBhZGQtb24gdG8gYWxsb3cgaXQgdG8gaW50ZXJhY3Qgd2l0aCBBV1MgcmVzb3VyY2VzXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHBvbGljeURvY3VtZW50UHJvdmlkZXI/OiAocGFydGl0aW9uOiBzdHJpbmcpID0+IFBvbGljeURvY3VtZW50O1xyXG4gICAgLyoqXHJcbiAgICAgKiBTZXJ2aWNlIEFjY291bnQgTmFtZSB0byBiZSB1c2VkIHdpdGggQWRkT24uXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHNhTmFtZTogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lc3BhY2UgdG8gY3JlYXRlIHRoZSBTZXJ2aWNlQWNjb3VudC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgbmFtZXNwYWNlPzogc3RyaW5nO1xyXG4gICAgLyoqXHJcbiAgICAgKiBDb25maWd1cmF0aW9uVmFsdWVzIGZpZWxkIHRvIHBhc3MgY3VzdG9tIGNvbmZpZ3VyYXRpb25zIHRvIEFkZG9uXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IGNvbmZpZ3VyYXRpb25WYWx1ZXM/OiBWYWx1ZXM7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmRpY2F0ZXMgdGhhdCBhZGQtb24gbXVzdCBiZSBpbnN0YWxsZWQgYmVmb3JlIGFueSBjYXBhY2l0eSBpcyBhZGRlZCBmb3Igd29ya2VyIG5vZGVzIChpbmN1ZGluZyBGYXJnYXRlKS5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgY29udHJvbFBsYW5lQWRkT24/OiBib29sZWFuO1xyXG5cclxuXHJcbiAgICAvKipcclxuICAgICAqIE1hcCBiZXR3ZWVuIGt1YmVybmV0ZXMgdmVyc2lvbnMgYW5kIGFkZE9uIHZlcnNpb25zIGZvciBhdXRvIHNlbGVjdGlvbi5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgdmVyc2lvbk1hcD86IE1hcDxLdWJlcm5ldGVzVmVyc2lvbiwgc3RyaW5nPjtcclxufVxyXG5cclxuY29uc3QgREVGQVVMVF9OQU1FU1BBQ0UgPSBcImt1YmUtc3lzdGVtXCI7XHJcblxyXG4vKipcclxuICogSW1wbGVtZW50YXRpb24gb2YgRUtTIE1hbmFnZWQgYWRkLW9ucy5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBDb3JlQWRkT24gaW1wbGVtZW50cyBDbHVzdGVyQWRkT24sIEF1dG9Nb2RlQWRkb257XHJcblxyXG4gICAgcmVhZG9ubHkgY29yZUFkZE9uUHJvcHM6IENvcmVBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKGNvcmVBZGRPblByb3BzOiBDb3JlQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHRoaXMuY29yZUFkZE9uUHJvcHMgPSBjb3JlQWRkT25Qcm9wcztcclxuICAgICAgICB1c2VyTG9nLmRlYnVnKGBDb3JlIGFkZC1vbiAke2NvcmVBZGRPblByb3BzLmFkZE9uTmFtZX0gaXMgYXQgdmVyc2lvbiAke2NvcmVBZGRPblByb3BzLnZlcnNpb259YCk7XHJcbiAgICB9XHJcblxyXG4gICAgYXN5bmMgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcblxyXG4gICAgICAgIGxldCBzZXJ2aWNlQWNjb3VudFJvbGVBcm46IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZDtcclxuICAgICAgICBsZXQgc2VydmljZUFjY291bnQ6IFNlcnZpY2VBY2NvdW50IHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG4gICAgICAgIGxldCBzYU5hbWVzcGFjZTogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkO1xyXG5cclxuICAgICAgICBzYU5hbWVzcGFjZSA9IERFRkFVTFRfTkFNRVNQQUNFO1xyXG4gICAgICAgIGlmICh0aGlzLmNvcmVBZGRPblByb3BzPy5uYW1lc3BhY2UpIHtcclxuICAgICAgICAgICAgc2FOYW1lc3BhY2UgPSB0aGlzLmNvcmVBZGRPblByb3BzLm5hbWVzcGFjZTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IG5zID0gdGhpcy5jcmVhdGVOYW1lc3BhY2UoY2x1c3RlckluZm8sIHNhTmFtZXNwYWNlKTtcclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIGEgc2VydmljZSBhY2NvdW50IGlmIHVzZXIgcHJvdmlkZXMgbmFtZXNwYWNlLCBQb2xpY3lEb2N1bWVudFxyXG4gICAgICAgIGNvbnN0IHBvbGljaWVzID0gdGhpcy5wcm92aWRlTWFuYWdlZFBvbGljaWVzKGNsdXN0ZXJJbmZvKTtcclxuICAgICAgICBpZiAocG9saWNpZXMpIHtcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnQgPSB0aGlzLmNyZWF0ZVNlcnZpY2VBY2NvdW50KGNsdXN0ZXJJbmZvLCBzYU5hbWVzcGFjZSwgcG9saWNpZXMpO1xyXG4gICAgICAgICAgICBzZXJ2aWNlQWNjb3VudFJvbGVBcm4gPSBzZXJ2aWNlQWNjb3VudC5yb2xlLnJvbGVBcm47XHJcbiAgICAgICAgICAgIGlmKG5zKSB7XHJcbiAgICAgICAgICAgICAgICBzZXJ2aWNlQWNjb3VudC5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgdmVyc2lvbjogc3RyaW5nID0gdGhpcy5jb3JlQWRkT25Qcm9wcy52ZXJzaW9uO1xyXG5cclxuICAgICAgICBpZiAodGhpcy5jb3JlQWRkT25Qcm9wcy52ZXJzaW9uID09PSBcImF1dG9cIikge1xyXG4gICAgICAgICAgICB2ZXJzaW9uID0gYXdhaXQgdGhpcy5wcm92aWRlVmVyc2lvbihjbHVzdGVySW5mby52ZXJzaW9uLCBjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLnJlZ2lvbik7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsZXQgYWRkT25Qcm9wcyA9IHtcclxuICAgICAgICAgICAgYWRkb25OYW1lOiB0aGlzLmNvcmVBZGRPblByb3BzLmFkZE9uTmFtZSxcclxuICAgICAgICAgICAgYWRkb25WZXJzaW9uOiB2ZXJzaW9uLFxyXG4gICAgICAgICAgICBjb25maWd1cmF0aW9uVmFsdWVzOiBKU09OLnN0cmluZ2lmeSh0aGlzLmNvcmVBZGRPblByb3BzLmNvbmZpZ3VyYXRpb25WYWx1ZXMpLFxyXG4gICAgICAgICAgICBjbHVzdGVyTmFtZTogY2x1c3RlckluZm8uY2x1c3Rlci5jbHVzdGVyTmFtZSxcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnRSb2xlQXJuOiBzZXJ2aWNlQWNjb3VudFJvbGVBcm4sXHJcbiAgICAgICAgICAgIHJlc29sdmVDb25mbGljdHM6IFwiT1ZFUldSSVRFXCJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBjb25zdCBjZm5BZGRvbiA9IG5ldyBDZm5BZGRvbihjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLCB0aGlzLmNvcmVBZGRPblByb3BzLmFkZE9uTmFtZSArIFwiLWFkZE9uXCIsIGFkZE9uUHJvcHMpO1xyXG4gICAgICAgIGlmIChzZXJ2aWNlQWNjb3VudCkge1xyXG4gICAgICAgICAgICBjZm5BZGRvbi5ub2RlLmFkZERlcGVuZGVuY3koc2VydmljZUFjY291bnQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKG5zKSB7XHJcbiAgICAgICAgICAgIGNmbkFkZG9uLm5vZGUuYWRkRGVwZW5kZW5jeShucyk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLmNvcmVBZGRPblByb3BzLmNvbnRyb2xQbGFuZUFkZE9uKSB7XHJcbiAgICAgICAgICAgIGRlcGxveUJlZm9yZUNhcGFjaXR5KGNmbkFkZG9uLCBjbHVzdGVySW5mbyk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8qKlxyXG4gICAgICAgICAqICBSZXRhaW4gdGhlIGFkZG9uIG90aGVyd2lzZSBjbHVzdGVyIGRlc3Ryb3kgd2lsbCBmYWlsIGR1ZSB0byBDb3JlRG5zQ29tcHV0ZVR5cGVQYXRjaCBcclxuICAgICAgICAgKiAgaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3MtY2RrL2lzc3Vlcy8yODYyMVxyXG4gICAgICAgICAqICovIFxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGNsdXN0ZXJJbmZvLmNsdXN0ZXIgaW5zdGFuY2VvZiBGYXJnYXRlQ2x1c3RlciAmJiB0aGlzLmNvcmVBZGRPblByb3BzLmFkZE9uTmFtZSA9PT0gXCJjb3JlZG5zXCIpe1xyXG4gICAgICAgICAgICBjZm5BZGRvbi5hcHBseVJlbW92YWxQb2xpY3koUmVtb3ZhbFBvbGljeS5SRVRBSU5fT05fVVBEQVRFX09SX0RFTEVURSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEluc3RhbnRpYXRlIHRoZSBBZGQtb25cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNmbkFkZG9uKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE92ZXJyaWRlIHRoaXMgbWV0aG9kIHRvIGNyZWF0ZSBuYW1lc3BhY2UgZm9yIHRoZSBjb3JlIGFkZG9uLiBJbiBtYW55IGNhc2VzIHRoZSBhZGRvbiBpcyBjcmVhdGVkIGluIHRoZSBrdWJlLXN5c3RlbSBuYW1lc3BhY2VcclxuICAgICAqIHdoaWNoIGRvZXMgbm90IHJlcXVpcmUgY3JlYXRpb24gYXMgaXQgaXMgYWx3YXlzIHRoZXJlLiBcclxuICAgICAqIEZvciBhZGRvbnMgdGhhdCBzdXBwb3J0IG90aGVyIG5hbWVzcGFjZSBhcyBkZXN0aW5hdGlvbnMgdGhpcyBtZXRob2Qgc2hvdWxkIGJlIGltcGxlbWVudGVkLlxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvIFxyXG4gICAgICogQHBhcmFtIG5hbWUgXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgY3JlYXRlTmFtZXNwYWNlKF9jbHVzdGVySW5mbzogQ2x1c3RlckluZm8sIF9uYW1lc3BhY2VOYW1lOiBzdHJpbmcpOiBJQ29uc3RydWN0IHwgdW5kZWZpbmVkIHtcclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3ZlcnJpZGUgdGhpcyBtZXRob2QgdG8gY29udHJvbCBob3cgc2VydmljZSBhY2NvdW50IGlzIGNyZWF0ZWQuXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAgICAgKiBAcGFyYW0gc2FOYW1lc3BhY2UgXHJcbiAgICAgKiBAcGFyYW0gcG9saWNpZXMgXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgY3JlYXRlU2VydmljZUFjY291bnQoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCBzYU5hbWVzcGFjZTogc3RyaW5nLCBwb2xpY2llczogSU1hbmFnZWRQb2xpY3lbXSk6IFNlcnZpY2VBY2NvdW50IHtcclxuICAgICAgICByZXR1cm4gY3JlYXRlU2VydmljZUFjY291bnRXaXRoUG9saWN5KGNsdXN0ZXJJbmZvLmNsdXN0ZXIsIHRoaXMuY29yZUFkZE9uUHJvcHMuc2FOYW1lLFxyXG4gICAgICAgICAgICBzYU5hbWVzcGFjZSwgLi4ucG9saWNpZXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGVtcGxhdGUgbWV0aG9kIHdpdGggZGVmYXVsdCBpbXBsZW1lbnRhdGlvbiB0byBleGVjdXRlIHRoZSBzdXBwbGllZCBmdW5jdGlvbiBvZiBwb2xpY3lEb2N1bWVudFByb3ZpZGVyLlxyXG4gICAgICogQWxsb3dzIG92ZXJyaWRpbmcgdGhpcyBtZXRob2QgaW4gc3ViY2xhc3NlcyBmb3IgbW9yZSBjb21wbGV4IGNhc2VzIG9mIHBvbGljaWVzLlxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvXHJcbiAgICAgKiBAcmV0dXJuc1xyXG4gICAgICovXHJcbiAgICBwcm92aWRlUG9saWN5RG9jdW1lbnQoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKSA6IFBvbGljeURvY3VtZW50IHwgdW5kZWZpbmVkIHtcclxuICAgICAgICBpZih0aGlzLmNvcmVBZGRPblByb3BzPy5wb2xpY3lEb2N1bWVudFByb3ZpZGVyKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvcmVBZGRPblByb3BzLnBvbGljeURvY3VtZW50UHJvdmlkZXIoY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjay5wYXJ0aXRpb24pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGVtcGxhdGUgbWV0aG9kIHRvIHJldHVybiBtYW5hZ2VkIHBvbGljaWVzIGZvciB0aGUgc2VydmljZSBhY2NvdW50LlxyXG4gICAgICogQWxsb3dzIG92ZXJyaWRpbmcgaW4gc3ViY2xhc3NlcyB0byBoYW5kbGUgbW9yZSBjb21wbGV4IGNhc2VzIG9mIHBvbGljaWVzLlxyXG4gICAgICovXHJcbiAgICBwcm92aWRlTWFuYWdlZFBvbGljaWVzKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbykgOiBJTWFuYWdlZFBvbGljeVtdIHwgdW5kZWZpbmVkIHtcclxuICAgICAgICBsZXQgcmVzdWx0IDogSU1hbmFnZWRQb2xpY3lbXSB8IHVuZGVmaW5lZDtcclxuICAgICAgICBjb25zdCBwb2xpY3lEb2N1bWVudCA9IHRoaXMucHJvdmlkZVBvbGljeURvY3VtZW50KGNsdXN0ZXJJbmZvKTtcclxuXHJcbiAgICAgICAgaWYocG9saWN5RG9jdW1lbnQpIHtcclxuICAgICAgICAgICAgY29uc3QgcG9saWN5ID0gbmV3IE1hbmFnZWRQb2xpY3koY2x1c3RlckluZm8uY2x1c3RlciwgYCR7dGhpcy5jb3JlQWRkT25Qcm9wcy5hZGRPbk5hbWV9LW1hbmFnZWQtcG9saWN5YCwge1xyXG4gICAgICAgICAgICAgICAgZG9jdW1lbnQ6IHBvbGljeURvY3VtZW50XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICByZXN1bHQgPSBbcG9saWN5XTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICBhc3luYyBwcm92aWRlVmVyc2lvbihjbHVzdGVyVmVyc2lvbjogS3ViZXJuZXRlc1ZlcnNpb24sIHJlZ2lvbjogc3RyaW5nKSA6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICAgICAgY29uc3QgY2xpZW50ID0gbmV3IHNkay5FS1NDbGllbnQoeyByZWdpb24gfSk7XHJcbiAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBzZGsuRGVzY3JpYmVBZGRvblZlcnNpb25zQ29tbWFuZCh7XHJcbiAgICAgICAgICAgIGFkZG9uTmFtZTogdGhpcy5jb3JlQWRkT25Qcm9wcy5hZGRPbk5hbWUsXHJcbiAgICAgICAgICAgIGt1YmVybmV0ZXNWZXJzaW9uOiBjbHVzdGVyVmVyc2lvbi52ZXJzaW9uXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgY2xpZW50LnNlbmQoY29tbWFuZCk7XHJcbiAgICAgICAgICAgIGlmIChyZXNwb25zZS5hZGRvbnMgJiYgcmVzcG9uc2UuYWRkb25zLmxlbmd0aCA+IDApXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGNvbnN0IGRlZmF1bHRWZXJzaW9ucyA9IHJlc3BvbnNlLmFkZG9ucz8uZmxhdE1hcChhZGRvbiA9PlxyXG4gICAgICAgICAgICAgICAgICAgIGFkZG9uLmFkZG9uVmVyc2lvbnM/LmZpbHRlcih2ZXJzaW9uID0+XHJcbiAgICAgICAgICAgICAgICAgICAgICB2ZXJzaW9uLmNvbXBhdGliaWxpdGllcz8uc29tZShjb21wYXRpYmlsaXR5ID0+IGNvbXBhdGliaWxpdHkuZGVmYXVsdFZlcnNpb24gPT09IHRydWUpXHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjb25zdCB2ZXJzaW9uOiBzdHJpbmcgfCB1bmRlZmluZWQgPSBkZWZhdWx0VmVyc2lvbnNbMF0/LmFkZG9uVmVyc2lvbjtcclxuICAgICAgICAgICAgICAgIGlmICghdmVyc2lvbikgeyBcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYE5vIGRlZmF1bHQgdmVyc2lvbiBmb3VuZCBmb3IgYWRkby1vbiAke3RoaXMuY29yZUFkZE9uUHJvcHMuYWRkT25OYW1lfWApO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgdXNlckxvZy5kZWJ1ZyhgQ29yZSBhZGQtb24gJHt0aGlzLmNvcmVBZGRPblByb3BzLmFkZE9uTmFtZX0gaGFzIGF1dG9zZWxlY3RlZCB2ZXJzaW9uICR7dmVyc2lvbn1gKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB2ZXJzaW9uO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBhZGQtb24gdmVyc2lvbnMgZm91bmQgZm9yIGFkZG9uLW9uICR7dGhpcy5jb3JlQWRkT25Qcm9wcy5hZGRPbk5hbWV9YCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgY2F0Y2ggKGVycm9yKSB7XHJcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKGVycm9yKTtcclxuICAgICAgICAgICAgbG9nZ2VyLndhcm4oZXJyb3IpO1xyXG4gICAgICAgICAgICBsb2dnZXIud2FybihgRmFpbGVkIHRvIHJldHJpZXZlIGFkZC1vbiB2ZXJzaW9ucyBmcm9tIEVLUyBmb3IgYWRkLW9uICR7dGhpcy5jb3JlQWRkT25Qcm9wcy5hZGRPbk5hbWV9LmApO1xyXG4gICAgICAgICAgICBsb2dnZXIud2FybihcIlBvc3NpYmxlIHJlYXNvbnMgZm9yIGZhaWx1cmVzIC0gVW5hdXRob3JpemVkIG9yIEF1dGhlbnRpY2F0aW9uIGZhaWx1cmUgb3IgTmV0d29yayBmYWlsdXJlIG9uIHRoZSB0ZXJtaW5hbC5cIik7XHJcbiAgICAgICAgICAgIGxvZ2dlci53YXJuKFwiIEZhbGxpbmcgYmFjayB0byBkZWZhdWx0IHZlcnNpb24uXCIpO1xyXG4gICAgICAgICAgICBsZXQgdmVyc2lvbjogc3RyaW5nID0gdGhpcy5wcm92aWRlRGVmYXVsdEF1dG9WZXJzaW9uKGNsdXN0ZXJWZXJzaW9uKTtcclxuICAgICAgICAgICAgdXNlckxvZy5kZWJ1ZyhgQ29yZSBhZGQtb24gJHt0aGlzLmNvcmVBZGRPblByb3BzLmFkZE9uTmFtZX0gaGFzIGF1dG9zZWxlY3RlZCB2ZXJzaW9uICR7dmVyc2lvbn1gKTtcclxuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb247XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHByb3ZpZGVEZWZhdWx0QXV0b1ZlcnNpb24odmVyc2lvbjogS3ViZXJuZXRlc1ZlcnNpb24pIDogc3RyaW5nIHtcclxuICAgICAgICBjb25zdCB2ZXJzaW9uTWFwID0gdGhpcy5jb3JlQWRkT25Qcm9wcy52ZXJzaW9uTWFwO1xyXG4gICAgICAgIGlmICh2ZXJzaW9uTWFwICYmIHZlcnNpb25NYXAuc2l6ZSA+IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb25NYXAuZ2V0KHZlcnNpb24pID8/IHZlcnNpb25NYXAudmFsdWVzKCkubmV4dCgpLnZhbHVlITtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBkZWZhdWx0IHZlcnNpb24gZm91bmQgZm9yIGFkZC1vbiAke3RoaXMuY29yZUFkZE9uUHJvcHMuYWRkT25OYW1lfWApO1xyXG4gICAgfVxyXG5cclxuICAgIGdldEFkZG9uVmVyc2lvbigpOiBzdHJpbmcge1xyXG4gICAgICByZXR1cm4gdGhpcy5jb3JlQWRkT25Qcm9wcy52ZXJzaW9uO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==