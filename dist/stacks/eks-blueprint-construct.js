"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EksBlueprintConstruct = exports.BlueprintConstructBuilder = exports.BlueprintPropsConstraints = exports.EksBlueprintProps = exports.ControlPlaneLogType = exports.DEFAULT_VERSION = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
Object.defineProperty(exports, "ControlPlaneLogType", { enumerable: true, get: function () { return aws_eks_1.ClusterLoggingTypes; } });
const constructs_1 = require("constructs");
const mng_cluster_provider_1 = require("../cluster-providers/mng-cluster-provider");
const vpc_1 = require("../resource-providers/vpc");
const spi = require("../spi");
const constraints = require("../utils/constraints-utils");
const utils = require("../utils");
const utils_1 = require("../utils");
const kms_key_1 = require("../resource-providers/kms-key");
const argo_gitops_factory_1 = require("../addons/argocd/argo-gitops-factory");
const eks = require("aws-cdk-lib/aws-eks");
/* Default K8s version of EKS Blueprints */
exports.DEFAULT_VERSION = aws_eks_1.KubernetesVersion.V1_33;
class EksBlueprintProps {
    /**
     * The id for the blueprint.
     */
    id;
    /**
     * Defaults to id if not provided
     */
    name;
    /**
     * Add-ons if any.
     */
    addOns = [];
    /**
     * Teams if any
     */
    teams = [];
    /**
     * EC2 or Fargate are supported in the blueprint but any implementation conforming the interface
     * will work
     */
    clusterProvider = new mng_cluster_provider_1.MngClusterProvider();
    /**
     * Kubernetes version (must be initialized for addons to work properly)
     */
    version;
    /**
     * Named resource providers to leverage for cluster resources.
     * The resource can represent Vpc, Hosting Zones or other resources, see {@link spi.ResourceType}.
     * VPC for the cluster can be registered under the name of 'vpc' or as a single provider of type
     */
    resourceProviders = new Map();
    /**
     * Control Plane log types to be enabled (if not passed, none)
     * If wrong types are included, will throw an error.
     */
    enableControlPlaneLogTypes;
    /**
     * If set to true and no resouce provider for KMS key is defined (under GlobalResources.KmsKey),
     * a default KMS encryption key will be used for envelope encryption of Kubernetes secrets (AWS managed new KMS key).
     * If set to false, and no resouce provider for KMS key is defined (under GlobalResources.KmsKey), then no secrets
     * encyrption is applied.
     *
     * Default is true.
     */
    useDefaultSecretEncryption = true;
    /**
     * GitOps modes to be enabled. If not specified, GitOps mode is not enabled.
     */
    enableGitOpsMode;
    /**
     * When set to true, will not use extra nesting for blueprint resources and attach them directly to the stack.
     */
    compatibilityMode;
    /**
     * ipFamily to support IPv6 clusters. By default, it uses IPv4 as the value.
     */
    ipFamily;
}
exports.EksBlueprintProps = EksBlueprintProps;
class BlueprintPropsConstraints {
    /**
     * id can be no less than 1 character long, and no greater than 63 characters long.
     * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
     */
    id = new constraints.StringConstraint(1, 63);
    /**
     * name can be no less than 1 character long, and no greater than 63 characters long.
     * https://kubernetes.io/docs/concepts/overview/working-with-objects/names/
     */
    name = new constraints.StringConstraint(1, 63);
}
exports.BlueprintPropsConstraints = BlueprintPropsConstraints;
/**
 * Blueprint builder implements a builder pattern that improves readability (no bloated constructors)
 * and allows creating a blueprint in an abstract state that can be applied to various instantiations
 * in accounts and regions.
 */
class BlueprintConstructBuilder {
    props;
    env;
    constructor() {
        this.props = { addOns: new Array(), teams: new Array(), resourceProviders: new Map() };
        this.env = {
            account: process.env.CDK_DEFAULT_ACCOUNT,
            region: process.env.CDK_DEFAULT_REGION
        };
    }
    name(name) {
        this.props = { ...this.props, ...{ name } };
        return this;
    }
    account(account) {
        this.env.account = account;
        return this;
    }
    region(region) {
        this.env.region = region;
        return this;
    }
    version(version) {
        this.props = { ...this.props, ...{ version: version } };
        return this;
    }
    /**
     * Adding ipFamily method to support IPv6 clusters. By default, it uses IPv4 as the value.
     */
    ipFamily(ipFamily = eks.IpFamily.IP_V4) {
        this.props = { ...this.props, ...{ ipFamily: ipFamily } };
        return this;
    }
    enableControlPlaneLogTypes(...types) {
        this.props = { ...this.props, ...{ enableControlPlaneLogTypes: types } };
        return this;
    }
    enableGitOps(mode) {
        this.props = { ...this.props, ...{ enableGitOpsMode: mode ?? spi.GitOpsMode.APP_OF_APPS } };
        return this;
    }
    withBlueprintProps(props) {
        const resourceProviders = this.props.resourceProviders;
        this.props = { ...this.props, ...(0, utils_1.cloneDeep)(props) };
        if (props.resourceProviders) {
            this.props.resourceProviders = new Map([...resourceProviders.entries(), ...props.resourceProviders.entries()]);
        }
        return this;
    }
    addOns(...addOns) {
        this.props = { ...this.props, ...{ addOns: this.props.addOns?.concat(addOns) } };
        return this;
    }
    clusterProvider(clusterProvider) {
        this.props = { ...this.props, ...{ clusterProvider: clusterProvider } };
        return this;
    }
    id(id) {
        this.props = { ...this.props, ...{ id } };
        return this;
    }
    teams(...teams) {
        this.props = { ...this.props, ...{ teams: this.props.teams?.concat(teams) } };
        return this;
    }
    resourceProvider(name, provider) {
        this.props.resourceProviders?.set(name, provider);
        return this;
    }
    useDefaultSecretEncryption(useDefault) {
        this.props = { ...this.props, ...{ useDefaultSecretEncryption: useDefault } };
        return this;
    }
    withEnv(env) {
        this.env.account = env.account;
        this.env.region = env.region;
        return this;
    }
}
exports.BlueprintConstructBuilder = BlueprintConstructBuilder;
/**
 * Entry point to the platform provisioning. Creates a CFN stack based on the provided configuration
 * and orchestrates provisioning of add-ons, teams and post deployment hooks.
 */
class EksBlueprintConstruct extends constructs_1.Construct {
    asyncTasks;
    clusterInfo;
    constructor(parent, blueprintProps) {
        super(parent, blueprintProps.id + "-ct");
        this.validateInput(blueprintProps);
        const scope = blueprintProps.compatibilityMode ? parent : this;
        const resourceContext = this.provideNamedResources(blueprintProps, scope);
        let vpcResource = resourceContext.get(spi.GlobalResources.Vpc);
        if (!vpcResource) {
            vpcResource = resourceContext.add(spi.GlobalResources.Vpc, new vpc_1.VpcProvider());
        }
        let version = blueprintProps.version;
        if (version == "auto") {
            version = exports.DEFAULT_VERSION;
        }
        let kmsKeyResource = resourceContext.get(spi.GlobalResources.KmsKey);
        if (!kmsKeyResource && blueprintProps.useDefaultSecretEncryption != false) {
            kmsKeyResource = resourceContext.add(spi.GlobalResources.KmsKey, new kms_key_1.CreateKmsKeyProvider());
        }
        blueprintProps = this.resolveDynamicProxies(blueprintProps, resourceContext);
        const clusterProvider = blueprintProps.clusterProvider ?? new mng_cluster_provider_1.MngClusterProvider({
            id: `${blueprintProps.name ?? blueprintProps.id}-ng`,
            version
        });
        this.clusterInfo = clusterProvider.createCluster(scope, vpcResource, kmsKeyResource, version, blueprintProps.enableControlPlaneLogTypes, blueprintProps.ipFamily);
        this.clusterInfo.setResourceContext(resourceContext);
        if (blueprintProps.enableGitOpsMode == spi.GitOpsMode.APPLICATION) {
            argo_gitops_factory_1.ArgoGitOpsFactory.enableGitOps();
        }
        else if (blueprintProps.enableGitOpsMode == spi.GitOpsMode.APP_OF_APPS) {
            argo_gitops_factory_1.ArgoGitOpsFactory.enableGitOpsAppOfApps();
        }
        const postDeploymentSteps = Array();
        for (let addOn of (blueprintProps.addOns ?? [])) { // must iterate in the strict order
            const result = addOn.deploy(this.clusterInfo);
            if (result) {
                const addOnKey = utils.getAddOnNameOrId(addOn);
                this.clusterInfo.addScheduledAddOn(addOnKey, result, utils.isOrderedAddOn(addOn));
            }
            const postDeploy = addOn;
            if (postDeploy.postDeploy !== undefined) {
                postDeploymentSteps.push(postDeploy);
            }
        }
        const scheduledAddOns = this.clusterInfo.getAllScheduledAddons();
        const addOnKeys = [...scheduledAddOns.keys()];
        const promises = scheduledAddOns.values();
        this.asyncTasks = Promise.all(promises).then((constructs) => {
            constructs.forEach((construct, index) => {
                this.clusterInfo.addProvisionedAddOn(addOnKeys[index], construct);
            });
            if (blueprintProps.teams != null) {
                for (let team of blueprintProps.teams) {
                    team.setup(this.clusterInfo);
                }
            }
            for (let step of postDeploymentSteps) {
                step.postDeploy(this.clusterInfo, blueprintProps.teams ?? []);
            }
        });
        this.asyncTasks.catch(err => {
            console.error(err);
            throw new Error(err);
        });
    }
    /**
     * Since constructor cannot be marked as async, adding a separate method to wait
     * for async code to finish.
     * @returns Promise that resolves to the blueprint
     */
    async waitForAsyncTasks() {
        if (this.asyncTasks) {
            return this.asyncTasks.then(() => {
                return this;
            });
        }
        return Promise.resolve(this);
    }
    /**
     * This method returns all the constructs produced by during the cluster creation (e.g. add-ons).
     * May be used in testing for verification.
     * @returns Async Tasks object
     */
    getAsyncTasks() {
        return this.asyncTasks;
    }
    /**
     * This method returns all the constructs produced by during the cluster creation (e.g. add-ons).
     * May be used in testing for verification.
     * @returns cluster info object
     */
    getClusterInfo() {
        return this.clusterInfo;
    }
    provideNamedResources(blueprintProps, scope) {
        const result = new spi.ResourceContext(scope, blueprintProps);
        for (let [key, value] of blueprintProps.resourceProviders ?? []) {
            result.add(key, value);
        }
        return result;
    }
    /**
     * Resolves all dynamic proxies, that substitutes resource provider proxies with the resolved values.
     * @param blueprintProps
     * @param resourceContext
     * @returns a copy of blueprint props with resolved values
     */
    resolveDynamicProxies(blueprintProps, resourceContext) {
        return utils.cloneDeep(blueprintProps, (value) => {
            return utils.resolveTarget(value, resourceContext);
        });
    }
    /**
     * Validates input against basic defined constraints.
     * @param blueprintProps
     */
    validateInput(blueprintProps) {
        const teamNames = new Set();
        constraints.validateConstraints(new BlueprintPropsConstraints, EksBlueprintProps.name, blueprintProps);
        if (blueprintProps.teams) {
            blueprintProps.teams.forEach(e => {
                if (teamNames.has(e.name)) {
                    throw new Error(`Team ${e.name} is registered more than once`);
                }
                teamNames.add(e.name);
            });
        }
    }
}
exports.EksBlueprintConstruct = EksBlueprintConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZWtzLWJsdWVwcmludC1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvc3RhY2tzL2Vrcy1ibHVlcHJpbnQtY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUVBLGlEQUFvRztBQW1CM0Ysb0dBbkJ1Qiw2QkFBbUIsT0FtQnZCO0FBbEI1QiwyQ0FBdUM7QUFDdkMsb0ZBQStFO0FBQy9FLG1EQUF3RDtBQUN4RCw4QkFBOEI7QUFDOUIsMERBQTBEO0FBQzFELGtDQUFrQztBQUNsQyxvQ0FBcUM7QUFFckMsMkRBQW1FO0FBQ25FLDhFQUF5RTtBQUV6RSwyQ0FBMkM7QUFDM0MsMkNBQTJDO0FBQzlCLFFBQUEsZUFBZSxHQUFHLDJCQUFpQixDQUFDLEtBQUssQ0FBQztBQU92RCxNQUFhLGlCQUFpQjtJQUMxQjs7T0FFRztJQUNNLEVBQUUsQ0FBUztJQUVwQjs7T0FFRztJQUNNLElBQUksQ0FBVTtJQUV2Qjs7T0FFRztJQUNNLE1BQU0sR0FBNkIsRUFBRSxDQUFDO0lBRS9DOztPQUVHO0lBQ00sS0FBSyxHQUFxQixFQUFFLENBQUM7SUFFdEM7OztPQUdHO0lBQ00sZUFBZSxHQUF5QixJQUFJLHlDQUFrQixFQUFFLENBQUM7SUFFMUU7O09BRUc7SUFDTSxPQUFPLENBQThCO0lBRTlDOzs7O09BSUc7SUFDSCxpQkFBaUIsR0FBdUMsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUVsRTs7O09BR0c7SUFDTSwwQkFBMEIsQ0FBeUI7SUFFNUQ7Ozs7Ozs7T0FPRztJQUNNLDBCQUEwQixHQUFlLElBQUksQ0FBQztJQUV2RDs7T0FFRztJQUNNLGdCQUFnQixDQUFrQjtJQUUzQzs7T0FFRztJQUNNLGlCQUFpQixDQUFXO0lBRXJDOztPQUVHO0lBQ00sUUFBUSxDQUFnQjtDQUVwQztBQXRFRCw4Q0FzRUM7QUFFRCxNQUFhLHlCQUF5QjtJQUNsQzs7O09BR0c7SUFDSCxFQUFFLEdBQUcsSUFBSSxXQUFXLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO0lBRTdDOzs7T0FHRztJQUNILElBQUksR0FBRyxJQUFJLFdBQVcsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDbEQ7QUFaRCw4REFZQztBQUVEOzs7O0dBSUc7QUFDSCxNQUFhLHlCQUF5QjtJQUVsQyxLQUFLLENBQTZCO0lBQ2xDLEdBQUcsQ0FHRDtJQUVGO1FBQ0ksSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLE1BQU0sRUFBRSxJQUFJLEtBQUssRUFBb0IsRUFBRSxLQUFLLEVBQUUsSUFBSSxLQUFLLEVBQVksRUFBRSxpQkFBaUIsRUFBRSxJQUFJLEdBQUcsRUFBRSxFQUFFLENBQUM7UUFDbkgsSUFBSSxDQUFDLEdBQUcsR0FBRztZQUNQLE9BQU8sRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQjtZQUN4QyxNQUFNLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxrQkFBa0I7U0FDekMsQ0FBQztJQUNOLENBQUM7SUFFTSxJQUFJLENBQUMsSUFBWTtRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxJQUFJLEVBQUUsRUFBRSxDQUFDO1FBQzVDLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxPQUFPLENBQUMsT0FBZ0I7UUFDM0IsSUFBSSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsT0FBTyxDQUFDO1FBQzNCLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxNQUFNLENBQUMsTUFBZTtRQUN6QixJQUFJLENBQUMsR0FBRyxDQUFDLE1BQU0sR0FBRyxNQUFNLENBQUM7UUFDekIsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLE9BQU8sQ0FBQyxPQUFtQztRQUM5QyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLEVBQUUsQ0FBQztRQUN4RCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRUQ7O09BRUc7SUFDSSxRQUFRLENBQUMsV0FBMEIsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLO1FBQ3hELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLFFBQVEsRUFBRSxRQUFRLEVBQUUsRUFBRSxDQUFDO1FBQzFELE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSwwQkFBMEIsQ0FBQyxHQUFHLEtBQTRCO1FBQzdELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLDBCQUEwQixFQUFFLEtBQUssRUFBRSxFQUFFLENBQUM7UUFDekUsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLFlBQVksQ0FBQyxJQUFxQjtRQUNyQyxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxJQUFJLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLEVBQUUsRUFBRSxDQUFDO1FBQzVGLE9BQU8sSUFBSSxDQUFDO0lBQ2hCLENBQUM7SUFFTSxrQkFBa0IsQ0FBQyxLQUFpQztRQUN2RCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsaUJBQWtCLENBQUM7UUFDeEQsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUEsaUJBQVMsRUFBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3BELElBQUksS0FBSyxDQUFDLGlCQUFpQixFQUFFLENBQUM7WUFDMUIsSUFBSSxDQUFDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsaUJBQWtCLENBQUMsT0FBTyxFQUFFLEVBQUUsR0FBRyxLQUFLLENBQUMsaUJBQWlCLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3BILENBQUM7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU0sTUFBTSxDQUFDLEdBQUcsTUFBMEI7UUFDdkMsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDakYsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLGVBQWUsQ0FBQyxlQUFvQztRQUN2RCxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsS0FBSyxFQUFFLEdBQUcsRUFBRSxlQUFlLEVBQUUsZUFBZSxFQUFFLEVBQUUsQ0FBQztRQUN4RSxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU0sRUFBRSxDQUFDLEVBQVU7UUFDaEIsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsQ0FBQztRQUMxQyxPQUFPLElBQUksQ0FBQztJQUNoQixDQUFDO0lBRU0sS0FBSyxDQUFDLEdBQUcsS0FBaUI7UUFDN0IsSUFBSSxDQUFDLEtBQUssR0FBRyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLE1BQU0sQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDOUUsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLGdCQUFnQixDQUFDLElBQVksRUFBRSxRQUE4QjtRQUNoRSxJQUFJLENBQUMsS0FBSyxDQUFDLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxJQUFJLEVBQUUsUUFBUSxDQUFDLENBQUM7UUFDbEQsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLDBCQUEwQixDQUFDLFVBQW1CO1FBQ2pELElBQUksQ0FBQyxLQUFLLEdBQUcsRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLDBCQUEwQixFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUM7UUFDOUUsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztJQUVNLE9BQU8sQ0FBQyxHQUFvQjtRQUMvQixJQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDO1FBQy9CLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUM7UUFDN0IsT0FBTyxJQUFJLENBQUM7SUFDaEIsQ0FBQztDQUVKO0FBbkdELDhEQW1HQztBQUVEOzs7R0FHRztBQUNILE1BQWEscUJBQXNCLFNBQVEsc0JBQVM7SUFFeEMsVUFBVSxDQUE4QjtJQUV4QyxXQUFXLENBQWtCO0lBRXJDLFlBQVksTUFBaUIsRUFBRSxjQUFpQztRQUM1RCxLQUFLLENBQUMsTUFBTSxFQUFFLGNBQWMsQ0FBQyxFQUFFLEdBQUcsS0FBSyxDQUFFLENBQUM7UUFDMUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsQ0FBQztRQUVuQyxNQUFNLEtBQUssR0FBRyxjQUFjLENBQUMsaUJBQWlCLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1FBRS9ELE1BQU0sZUFBZSxHQUFHLElBQUksQ0FBQyxxQkFBcUIsQ0FBQyxjQUFjLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFMUUsSUFBSSxXQUFXLEdBQXFCLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVqRixJQUFJLENBQUMsV0FBVyxFQUFFLENBQUM7WUFDZixXQUFXLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxJQUFJLGlCQUFXLEVBQUUsQ0FBQyxDQUFDO1FBQ2xGLENBQUM7UUFFRCxJQUFJLE9BQU8sR0FBRyxjQUFjLENBQUMsT0FBTyxDQUFDO1FBQ3JDLElBQUksT0FBTyxJQUFJLE1BQU0sRUFBRSxDQUFDO1lBQ3BCLE9BQU8sR0FBRyx1QkFBZSxDQUFDO1FBQzlCLENBQUM7UUFFRCxJQUFJLGNBQWMsR0FBcUIsZUFBZSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLE1BQU0sQ0FBQyxDQUFDO1FBRXZGLElBQUksQ0FBQyxjQUFjLElBQUksY0FBYyxDQUFDLDBCQUEwQixJQUFJLEtBQUssRUFBRSxDQUFDO1lBQ3hFLGNBQWMsR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFLElBQUksOEJBQW9CLEVBQUUsQ0FBQyxDQUFDO1FBQ2pHLENBQUM7UUFFRCxjQUFjLEdBQUcsSUFBSSxDQUFDLHFCQUFxQixDQUFDLGNBQWMsRUFBRSxlQUFlLENBQUMsQ0FBQztRQUU3RSxNQUFNLGVBQWUsR0FBRyxjQUFjLENBQUMsZUFBZSxJQUFJLElBQUkseUNBQWtCLENBQUM7WUFDN0UsRUFBRSxFQUFFLEdBQUcsY0FBYyxDQUFDLElBQUksSUFBSSxjQUFjLENBQUMsRUFBRSxLQUFLO1lBQ3BELE9BQU87U0FDVixDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsV0FBVyxHQUFHLGVBQWUsQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFLFdBQVksRUFBRSxjQUFjLEVBQUUsT0FBTyxFQUFFLGNBQWMsQ0FBQywwQkFBMEIsRUFBRSxjQUFjLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDbkssSUFBSSxDQUFDLFdBQVcsQ0FBQyxrQkFBa0IsQ0FBQyxlQUFlLENBQUMsQ0FBQztRQUVyRCxJQUFJLGNBQWMsQ0FBQyxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ2hFLHVDQUFpQixDQUFDLFlBQVksRUFBRSxDQUFDO1FBQ3JDLENBQUM7YUFBTSxJQUFJLGNBQWMsQ0FBQyxnQkFBZ0IsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsRUFBRSxDQUFDO1lBQ3ZFLHVDQUFpQixDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDOUMsQ0FBQztRQUVELE1BQU0sbUJBQW1CLEdBQUcsS0FBSyxFQUF5QixDQUFDO1FBRTNELEtBQUssSUFBSSxLQUFLLElBQUksQ0FBQyxjQUFjLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQyxtQ0FBbUM7WUFDbEYsTUFBTSxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7WUFDOUMsSUFBSSxNQUFNLEVBQUUsQ0FBQztnQkFDVCxNQUFNLFFBQVEsR0FBRyxLQUFLLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQy9DLElBQUksQ0FBQyxXQUFXLENBQUMsaUJBQWlCLENBQUMsUUFBUSxFQUFFLE1BQU0sRUFBRSxLQUFLLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEYsQ0FBQztZQUNELE1BQU0sVUFBVSxHQUFRLEtBQUssQ0FBQztZQUM5QixJQUFLLFVBQW9DLENBQUMsVUFBVSxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNqRSxtQkFBbUIsQ0FBQyxJQUFJLENBQXdCLFVBQVUsQ0FBQyxDQUFDO1lBQ2hFLENBQUM7UUFDTCxDQUFDO1FBRUQsTUFBTSxlQUFlLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxxQkFBcUIsRUFBRSxDQUFDO1FBQ2pFLE1BQU0sU0FBUyxHQUFHLENBQUMsR0FBRyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztRQUM5QyxNQUFNLFFBQVEsR0FBRyxlQUFlLENBQUMsTUFBTSxFQUFFLENBQUM7UUFFMUMsSUFBSSxDQUFDLFVBQVUsR0FBRyxPQUFPLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLFVBQVUsRUFBRSxFQUFFO1lBQ3hELFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQyxTQUFTLEVBQUUsS0FBSyxFQUFFLEVBQUU7Z0JBQ3BDLElBQUksQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQ3RFLENBQUMsQ0FBQyxDQUFDO1lBRUgsSUFBSSxjQUFjLENBQUMsS0FBSyxJQUFJLElBQUksRUFBRSxDQUFDO2dCQUMvQixLQUFLLElBQUksSUFBSSxJQUFJLGNBQWMsQ0FBQyxLQUFLLEVBQUUsQ0FBQztvQkFDcEMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7Z0JBQ2pDLENBQUM7WUFDTCxDQUFDO1lBRUQsS0FBSyxJQUFJLElBQUksSUFBSSxtQkFBbUIsRUFBRSxDQUFDO2dCQUNuQyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxXQUFXLEVBQUUsY0FBYyxDQUFDLEtBQUssSUFBSSxFQUFFLENBQUMsQ0FBQztZQUNsRSxDQUFDO1FBQ0wsQ0FBQyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUN4QixPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBQ25CLE1BQU0sSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDekIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNJLEtBQUssQ0FBQyxpQkFBaUI7UUFDMUIsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDbEIsT0FBTyxJQUFJLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUU7Z0JBQzdCLE9BQU8sSUFBSSxDQUFDO1lBQ2hCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUNELE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUNqQyxDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILGFBQWE7UUFDVCxPQUFPLElBQUksQ0FBQyxVQUFVLENBQUM7SUFDM0IsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxjQUFjO1FBQ1YsT0FBTyxJQUFJLENBQUMsV0FBVyxDQUFDO0lBQzVCLENBQUM7SUFFTyxxQkFBcUIsQ0FBQyxjQUFpQyxFQUFFLEtBQWdCO1FBQzdFLE1BQU0sTUFBTSxHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFFOUQsS0FBSyxJQUFJLENBQUMsR0FBRyxFQUFFLEtBQUssQ0FBQyxJQUFJLGNBQWMsQ0FBQyxpQkFBaUIsSUFBSSxFQUFFLEVBQUUsQ0FBQztZQUM5RCxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUMzQixDQUFDO1FBRUQsT0FBTyxNQUFNLENBQUM7SUFDbEIsQ0FBQztJQUVEOzs7OztPQUtHO0lBQ0sscUJBQXFCLENBQUMsY0FBaUMsRUFBRSxlQUFvQztRQUNqRyxPQUFPLEtBQUssQ0FBQyxTQUFTLENBQUMsY0FBYyxFQUFFLENBQUMsS0FBSyxFQUFFLEVBQUU7WUFDN0MsT0FBTyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRSxlQUFlLENBQUMsQ0FBQztRQUN2RCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRDs7O09BR0c7SUFDSyxhQUFhLENBQUMsY0FBaUM7UUFDbkQsTUFBTSxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQVUsQ0FBQztRQUNwQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsSUFBSSx5QkFBeUIsRUFBRSxpQkFBaUIsQ0FBQyxJQUFJLEVBQUUsY0FBYyxDQUFDLENBQUM7UUFDdkcsSUFBSSxjQUFjLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDdkIsY0FBYyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQzdCLElBQUksU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDeEIsTUFBTSxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLCtCQUErQixDQUFDLENBQUM7Z0JBQ25FLENBQUM7Z0JBQ0QsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDMUIsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0lBQ0wsQ0FBQztDQUNKO0FBN0pELHNEQTZKQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCB7IElWcGMgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcclxuaW1wb3J0IHsgQ2x1c3RlckxvZ2dpbmdUeXBlcyBhcyBDb250cm9sUGxhbmVMb2dUeXBlLCBLdWJlcm5ldGVzVmVyc2lvbiB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcclxuaW1wb3J0IHsgTW5nQ2x1c3RlclByb3ZpZGVyIH0gZnJvbSAnLi4vY2x1c3Rlci1wcm92aWRlcnMvbW5nLWNsdXN0ZXItcHJvdmlkZXInO1xyXG5pbXBvcnQgeyBWcGNQcm92aWRlciB9IGZyb20gJy4uL3Jlc291cmNlLXByb3ZpZGVycy92cGMnO1xyXG5pbXBvcnQgKiBhcyBzcGkgZnJvbSAnLi4vc3BpJztcclxuaW1wb3J0ICogYXMgY29uc3RyYWludHMgZnJvbSAnLi4vdXRpbHMvY29uc3RyYWludHMtdXRpbHMnO1xyXG5pbXBvcnQgKiBhcyB1dGlscyBmcm9tICcuLi91dGlscyc7XHJcbmltcG9ydCB7IGNsb25lRGVlcCB9IGZyb20gJy4uL3V0aWxzJztcclxuaW1wb3J0IHsgSUtleSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3Mta21zXCI7XHJcbmltcG9ydCB7Q3JlYXRlS21zS2V5UHJvdmlkZXJ9IGZyb20gXCIuLi9yZXNvdXJjZS1wcm92aWRlcnMva21zLWtleVwiO1xyXG5pbXBvcnQgeyBBcmdvR2l0T3BzRmFjdG9yeSB9IGZyb20gXCIuLi9hZGRvbnMvYXJnb2NkL2FyZ28tZ2l0b3BzLWZhY3RvcnlcIjtcclxuXHJcbmltcG9ydCAqIGFzIGVrcyBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG4vKiBEZWZhdWx0IEs4cyB2ZXJzaW9uIG9mIEVLUyBCbHVlcHJpbnRzICovXHJcbmV4cG9ydCBjb25zdCBERUZBVUxUX1ZFUlNJT04gPSBLdWJlcm5ldGVzVmVyc2lvbi5WMV8zMztcclxuXHJcbi8qKlxyXG4gKiAgRXhwb3J0aW5nIGNvbnRyb2wgcGxhbmUgbG9nIHR5cGUgc28gdGhhdCBjdXN0b21lcnMgZG9uJ3QgaGF2ZSB0byBpbXBvcnQgQ0RLIEVLUyBtb2R1bGUgZm9yIGJsdWVwcmludCBjb25maWd1cmF0aW9uLlxyXG4gKi9cclxuZXhwb3J0IHsgQ29udHJvbFBsYW5lTG9nVHlwZSB9O1xyXG5cclxuZXhwb3J0IGNsYXNzIEVrc0JsdWVwcmludFByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogVGhlIGlkIGZvciB0aGUgYmx1ZXByaW50LlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBpZDogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRGVmYXVsdHMgdG8gaWQgaWYgbm90IHByb3ZpZGVkXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IG5hbWU/OiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGQtb25zIGlmIGFueS5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgYWRkT25zPzogQXJyYXk8c3BpLkNsdXN0ZXJBZGRPbj4gPSBbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIFRlYW1zIGlmIGFueVxyXG4gICAgICovXHJcbiAgICByZWFkb25seSB0ZWFtcz86IEFycmF5PHNwaS5UZWFtPiA9IFtdO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRUMyIG9yIEZhcmdhdGUgYXJlIHN1cHBvcnRlZCBpbiB0aGUgYmx1ZXByaW50IGJ1dCBhbnkgaW1wbGVtZW50YXRpb24gY29uZm9ybWluZyB0aGUgaW50ZXJmYWNlXHJcbiAgICAgKiB3aWxsIHdvcmtcclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgY2x1c3RlclByb3ZpZGVyPzogc3BpLkNsdXN0ZXJQcm92aWRlciA9IG5ldyBNbmdDbHVzdGVyUHJvdmlkZXIoKTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEt1YmVybmV0ZXMgdmVyc2lvbiAobXVzdCBiZSBpbml0aWFsaXplZCBmb3IgYWRkb25zIHRvIHdvcmsgcHJvcGVybHkpXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHZlcnNpb24/OiBLdWJlcm5ldGVzVmVyc2lvbiB8IFwiYXV0b1wiO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmFtZWQgcmVzb3VyY2UgcHJvdmlkZXJzIHRvIGxldmVyYWdlIGZvciBjbHVzdGVyIHJlc291cmNlcy5cclxuICAgICAqIFRoZSByZXNvdXJjZSBjYW4gcmVwcmVzZW50IFZwYywgSG9zdGluZyBab25lcyBvciBvdGhlciByZXNvdXJjZXMsIHNlZSB7QGxpbmsgc3BpLlJlc291cmNlVHlwZX0uXHJcbiAgICAgKiBWUEMgZm9yIHRoZSBjbHVzdGVyIGNhbiBiZSByZWdpc3RlcmVkIHVuZGVyIHRoZSBuYW1lIG9mICd2cGMnIG9yIGFzIGEgc2luZ2xlIHByb3ZpZGVyIG9mIHR5cGVcclxuICAgICAqL1xyXG4gICAgcmVzb3VyY2VQcm92aWRlcnM/OiBNYXA8c3RyaW5nLCBzcGkuUmVzb3VyY2VQcm92aWRlcj4gPSBuZXcgTWFwKCk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb250cm9sIFBsYW5lIGxvZyB0eXBlcyB0byBiZSBlbmFibGVkIChpZiBub3QgcGFzc2VkLCBub25lKVxyXG4gICAgICogSWYgd3JvbmcgdHlwZXMgYXJlIGluY2x1ZGVkLCB3aWxsIHRocm93IGFuIGVycm9yLlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBlbmFibGVDb250cm9sUGxhbmVMb2dUeXBlcz86IENvbnRyb2xQbGFuZUxvZ1R5cGVbXTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIElmIHNldCB0byB0cnVlIGFuZCBubyByZXNvdWNlIHByb3ZpZGVyIGZvciBLTVMga2V5IGlzIGRlZmluZWQgKHVuZGVyIEdsb2JhbFJlc291cmNlcy5LbXNLZXkpLFxyXG4gICAgICogYSBkZWZhdWx0IEtNUyBlbmNyeXB0aW9uIGtleSB3aWxsIGJlIHVzZWQgZm9yIGVudmVsb3BlIGVuY3J5cHRpb24gb2YgS3ViZXJuZXRlcyBzZWNyZXRzIChBV1MgbWFuYWdlZCBuZXcgS01TIGtleSkuXHJcbiAgICAgKiBJZiBzZXQgdG8gZmFsc2UsIGFuZCBubyByZXNvdWNlIHByb3ZpZGVyIGZvciBLTVMga2V5IGlzIGRlZmluZWQgKHVuZGVyIEdsb2JhbFJlc291cmNlcy5LbXNLZXkpLCB0aGVuIG5vIHNlY3JldHNcclxuICAgICAqIGVuY3lycHRpb24gaXMgYXBwbGllZC5cclxuICAgICAqXHJcbiAgICAgKiBEZWZhdWx0IGlzIHRydWUuXHJcbiAgICAgKi9cclxuICAgIHJlYWRvbmx5IHVzZURlZmF1bHRTZWNyZXRFbmNyeXB0aW9uPyA6IGJvb2xlYW4gID0gdHJ1ZTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIEdpdE9wcyBtb2RlcyB0byBiZSBlbmFibGVkLiBJZiBub3Qgc3BlY2lmaWVkLCBHaXRPcHMgbW9kZSBpcyBub3QgZW5hYmxlZC5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgZW5hYmxlR2l0T3BzTW9kZT86IHNwaS5HaXRPcHNNb2RlO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogV2hlbiBzZXQgdG8gdHJ1ZSwgd2lsbCBub3QgdXNlIGV4dHJhIG5lc3RpbmcgZm9yIGJsdWVwcmludCByZXNvdXJjZXMgYW5kIGF0dGFjaCB0aGVtIGRpcmVjdGx5IHRvIHRoZSBzdGFjay5cclxuICAgICAqL1xyXG4gICAgcmVhZG9ubHkgY29tcGF0aWJpbGl0eU1vZGU/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogaXBGYW1pbHkgdG8gc3VwcG9ydCBJUHY2IGNsdXN0ZXJzLiBCeSBkZWZhdWx0LCBpdCB1c2VzIElQdjQgYXMgdGhlIHZhbHVlLlxyXG4gICAgICovXHJcbiAgICByZWFkb25seSBpcEZhbWlseT86IGVrcy5JcEZhbWlseTtcclxuXHJcbn1cclxuXHJcbmV4cG9ydCBjbGFzcyBCbHVlcHJpbnRQcm9wc0NvbnN0cmFpbnRzIGltcGxlbWVudHMgY29uc3RyYWludHMuQ29uc3RyYWludHNUeXBlPEVrc0JsdWVwcmludFByb3BzPiB7XHJcbiAgICAvKipcclxuICAgICAqIGlkIGNhbiBiZSBubyBsZXNzIHRoYW4gMSBjaGFyYWN0ZXIgbG9uZywgYW5kIG5vIGdyZWF0ZXIgdGhhbiA2MyBjaGFyYWN0ZXJzIGxvbmcuXHJcbiAgICAgKiBodHRwczovL2t1YmVybmV0ZXMuaW8vZG9jcy9jb25jZXB0cy9vdmVydmlldy93b3JraW5nLXdpdGgtb2JqZWN0cy9uYW1lcy9cclxuICAgICAqL1xyXG4gICAgaWQgPSBuZXcgY29uc3RyYWludHMuU3RyaW5nQ29uc3RyYWludCgxLCA2Myk7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBuYW1lIGNhbiBiZSBubyBsZXNzIHRoYW4gMSBjaGFyYWN0ZXIgbG9uZywgYW5kIG5vIGdyZWF0ZXIgdGhhbiA2MyBjaGFyYWN0ZXJzIGxvbmcuXHJcbiAgICAgKiBodHRwczovL2t1YmVybmV0ZXMuaW8vZG9jcy9jb25jZXB0cy9vdmVydmlldy93b3JraW5nLXdpdGgtb2JqZWN0cy9uYW1lcy9cclxuICAgICAqL1xyXG4gICAgbmFtZSA9IG5ldyBjb25zdHJhaW50cy5TdHJpbmdDb25zdHJhaW50KDEsIDYzKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIEJsdWVwcmludCBidWlsZGVyIGltcGxlbWVudHMgYSBidWlsZGVyIHBhdHRlcm4gdGhhdCBpbXByb3ZlcyByZWFkYWJpbGl0eSAobm8gYmxvYXRlZCBjb25zdHJ1Y3RvcnMpXHJcbiAqIGFuZCBhbGxvd3MgY3JlYXRpbmcgYSBibHVlcHJpbnQgaW4gYW4gYWJzdHJhY3Qgc3RhdGUgdGhhdCBjYW4gYmUgYXBwbGllZCB0byB2YXJpb3VzIGluc3RhbnRpYXRpb25zXHJcbiAqIGluIGFjY291bnRzIGFuZCByZWdpb25zLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEJsdWVwcmludENvbnN0cnVjdEJ1aWxkZXIge1xyXG5cclxuICAgIHByb3BzOiBQYXJ0aWFsPEVrc0JsdWVwcmludFByb3BzPjtcclxuICAgIGVudjoge1xyXG4gICAgICAgIGFjY291bnQ/OiBzdHJpbmcsXHJcbiAgICAgICAgcmVnaW9uPzogc3RyaW5nXHJcbiAgICB9O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKCkge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IGFkZE9uczogbmV3IEFycmF5PHNwaS5DbHVzdGVyQWRkT24+KCksIHRlYW1zOiBuZXcgQXJyYXk8c3BpLlRlYW0+KCksIHJlc291cmNlUHJvdmlkZXJzOiBuZXcgTWFwKCkgfTtcclxuICAgICAgICB0aGlzLmVudiA9IHtcclxuICAgICAgICAgICAgYWNjb3VudDogcHJvY2Vzcy5lbnYuQ0RLX0RFRkFVTFRfQUNDT1VOVCxcclxuICAgICAgICAgICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT05cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyBuYW1lKG5hbWU6IHN0cmluZyk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgbmFtZSB9IH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGFjY291bnQoYWNjb3VudD86IHN0cmluZyk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMuZW52LmFjY291bnQgPSBhY2NvdW50O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZWdpb24ocmVnaW9uPzogc3RyaW5nKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5lbnYucmVnaW9uID0gcmVnaW9uO1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB2ZXJzaW9uKHZlcnNpb246IFwiYXV0b1wiIHwgS3ViZXJuZXRlc1ZlcnNpb24pOiB0aGlzIHtcclxuICAgICAgICB0aGlzLnByb3BzID0geyAuLi50aGlzLnByb3BzLCAuLi57IHZlcnNpb246IHZlcnNpb24gfSB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkaW5nIGlwRmFtaWx5IG1ldGhvZCB0byBzdXBwb3J0IElQdjYgY2x1c3RlcnMuIEJ5IGRlZmF1bHQsIGl0IHVzZXMgSVB2NCBhcyB0aGUgdmFsdWUuXHJcbiAgICAgKi9cclxuICAgIHB1YmxpYyBpcEZhbWlseShpcEZhbWlseTogIGVrcy5JcEZhbWlseSA9IGVrcy5JcEZhbWlseS5JUF9WNCk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgaXBGYW1pbHk6IGlwRmFtaWx5IH0gfTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW5hYmxlQ29udHJvbFBsYW5lTG9nVHlwZXMoLi4udHlwZXM6IENvbnRyb2xQbGFuZUxvZ1R5cGVbXSk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgZW5hYmxlQ29udHJvbFBsYW5lTG9nVHlwZXM6IHR5cGVzIH0gfTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgZW5hYmxlR2l0T3BzKG1vZGU/OiBzcGkuR2l0T3BzTW9kZSk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgZW5hYmxlR2l0T3BzTW9kZTogbW9kZSA/PyBzcGkuR2l0T3BzTW9kZS5BUFBfT0ZfQVBQUyB9IH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIHdpdGhCbHVlcHJpbnRQcm9wcyhwcm9wczogUGFydGlhbDxFa3NCbHVlcHJpbnRQcm9wcz4pOiB0aGlzIHtcclxuICAgICAgICBjb25zdCByZXNvdXJjZVByb3ZpZGVycyA9IHRoaXMucHJvcHMucmVzb3VyY2VQcm92aWRlcnMhO1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLmNsb25lRGVlcChwcm9wcykgfTtcclxuICAgICAgICBpZiAocHJvcHMucmVzb3VyY2VQcm92aWRlcnMpIHtcclxuICAgICAgICAgICAgdGhpcy5wcm9wcy5yZXNvdXJjZVByb3ZpZGVycyA9IG5ldyBNYXAoWy4uLnJlc291cmNlUHJvdmlkZXJzIS5lbnRyaWVzKCksIC4uLnByb3BzLnJlc291cmNlUHJvdmlkZXJzLmVudHJpZXMoKV0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgYWRkT25zKC4uLmFkZE9uczogc3BpLkNsdXN0ZXJBZGRPbltdKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5wcm9wcyA9IHsgLi4udGhpcy5wcm9wcywgLi4ueyBhZGRPbnM6IHRoaXMucHJvcHMuYWRkT25zPy5jb25jYXQoYWRkT25zKSB9IH07XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG4gICAgcHVibGljIGNsdXN0ZXJQcm92aWRlcihjbHVzdGVyUHJvdmlkZXI6IHNwaS5DbHVzdGVyUHJvdmlkZXIpIHtcclxuICAgICAgICB0aGlzLnByb3BzID0geyAuLi50aGlzLnByb3BzLCAuLi57IGNsdXN0ZXJQcm92aWRlcjogY2x1c3RlclByb3ZpZGVyIH0gfTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgaWQoaWQ6IHN0cmluZyk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgaWQgfSB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB0ZWFtcyguLi50ZWFtczogc3BpLlRlYW1bXSk6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgdGVhbXM6IHRoaXMucHJvcHMudGVhbXM/LmNvbmNhdCh0ZWFtcykgfSB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyByZXNvdXJjZVByb3ZpZGVyKG5hbWU6IHN0cmluZywgcHJvdmlkZXI6IHNwaS5SZXNvdXJjZVByb3ZpZGVyKTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5wcm9wcy5yZXNvdXJjZVByb3ZpZGVycz8uc2V0KG5hbWUsIHByb3ZpZGVyKTtcclxuICAgICAgICByZXR1cm4gdGhpcztcclxuICAgIH1cclxuXHJcbiAgICBwdWJsaWMgdXNlRGVmYXVsdFNlY3JldEVuY3J5cHRpb24odXNlRGVmYXVsdDogYm9vbGVhbik6IHRoaXMge1xyXG4gICAgICAgIHRoaXMucHJvcHMgPSB7IC4uLnRoaXMucHJvcHMsIC4uLnsgdXNlRGVmYXVsdFNlY3JldEVuY3J5cHRpb246IHVzZURlZmF1bHQgfSB9O1xyXG4gICAgICAgIHJldHVybiB0aGlzO1xyXG4gICAgfVxyXG5cclxuICAgIHB1YmxpYyB3aXRoRW52KGVudjogY2RrLkVudmlyb25tZW50KTogdGhpcyB7XHJcbiAgICAgICAgdGhpcy5lbnYuYWNjb3VudCA9IGVudi5hY2NvdW50O1xyXG4gICAgICAgIHRoaXMuZW52LnJlZ2lvbiA9IGVudi5yZWdpb247XHJcbiAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKipcclxuICogRW50cnkgcG9pbnQgdG8gdGhlIHBsYXRmb3JtIHByb3Zpc2lvbmluZy4gQ3JlYXRlcyBhIENGTiBzdGFjayBiYXNlZCBvbiB0aGUgcHJvdmlkZWQgY29uZmlndXJhdGlvblxyXG4gKiBhbmQgb3JjaGVzdHJhdGVzIHByb3Zpc2lvbmluZyBvZiBhZGQtb25zLCB0ZWFtcyBhbmQgcG9zdCBkZXBsb3ltZW50IGhvb2tzLlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEVrc0JsdWVwcmludENvbnN0cnVjdCBleHRlbmRzIENvbnN0cnVjdCB7XHJcblxyXG4gICAgcHJpdmF0ZSBhc3luY1Rhc2tzOiBQcm9taXNlPHZvaWQgfCBDb25zdHJ1Y3RbXT47XHJcblxyXG4gICAgcHJpdmF0ZSBjbHVzdGVySW5mbzogc3BpLkNsdXN0ZXJJbmZvO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHBhcmVudDogQ29uc3RydWN0LCBibHVlcHJpbnRQcm9wczogRWtzQmx1ZXByaW50UHJvcHMpIHtcclxuICAgICAgICBzdXBlcihwYXJlbnQsIGJsdWVwcmludFByb3BzLmlkICsgXCItY3RcIiApO1xyXG4gICAgICAgIHRoaXMudmFsaWRhdGVJbnB1dChibHVlcHJpbnRQcm9wcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNjb3BlID0gYmx1ZXByaW50UHJvcHMuY29tcGF0aWJpbGl0eU1vZGUgPyBwYXJlbnQgOiB0aGlzO1xyXG5cclxuICAgICAgICBjb25zdCByZXNvdXJjZUNvbnRleHQgPSB0aGlzLnByb3ZpZGVOYW1lZFJlc291cmNlcyhibHVlcHJpbnRQcm9wcywgc2NvcGUpO1xyXG5cclxuICAgICAgICBsZXQgdnBjUmVzb3VyY2U6IElWcGMgfCB1bmRlZmluZWQgPSByZXNvdXJjZUNvbnRleHQuZ2V0KHNwaS5HbG9iYWxSZXNvdXJjZXMuVnBjKTtcclxuXHJcbiAgICAgICAgaWYgKCF2cGNSZXNvdXJjZSkge1xyXG4gICAgICAgICAgICB2cGNSZXNvdXJjZSA9IHJlc291cmNlQ29udGV4dC5hZGQoc3BpLkdsb2JhbFJlc291cmNlcy5WcGMsIG5ldyBWcGNQcm92aWRlcigpKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB2ZXJzaW9uID0gYmx1ZXByaW50UHJvcHMudmVyc2lvbjtcclxuICAgICAgICBpZiAodmVyc2lvbiA9PSBcImF1dG9cIikge1xyXG4gICAgICAgICAgICB2ZXJzaW9uID0gREVGQVVMVF9WRVJTSU9OO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IGttc0tleVJlc291cmNlOiBJS2V5IHwgdW5kZWZpbmVkID0gcmVzb3VyY2VDb250ZXh0LmdldChzcGkuR2xvYmFsUmVzb3VyY2VzLkttc0tleSk7XHJcblxyXG4gICAgICAgIGlmICgha21zS2V5UmVzb3VyY2UgJiYgYmx1ZXByaW50UHJvcHMudXNlRGVmYXVsdFNlY3JldEVuY3J5cHRpb24gIT0gZmFsc2UpIHtcclxuICAgICAgICAgICAga21zS2V5UmVzb3VyY2UgPSByZXNvdXJjZUNvbnRleHQuYWRkKHNwaS5HbG9iYWxSZXNvdXJjZXMuS21zS2V5LCBuZXcgQ3JlYXRlS21zS2V5UHJvdmlkZXIoKSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBibHVlcHJpbnRQcm9wcyA9IHRoaXMucmVzb2x2ZUR5bmFtaWNQcm94aWVzKGJsdWVwcmludFByb3BzLCByZXNvdXJjZUNvbnRleHQpO1xyXG5cclxuICAgICAgICBjb25zdCBjbHVzdGVyUHJvdmlkZXIgPSBibHVlcHJpbnRQcm9wcy5jbHVzdGVyUHJvdmlkZXIgPz8gbmV3IE1uZ0NsdXN0ZXJQcm92aWRlcih7XHJcbiAgICAgICAgICAgIGlkOiBgJHtibHVlcHJpbnRQcm9wcy5uYW1lID8/IGJsdWVwcmludFByb3BzLmlkfS1uZ2AsXHJcbiAgICAgICAgICAgIHZlcnNpb25cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5jbHVzdGVySW5mbyA9IGNsdXN0ZXJQcm92aWRlci5jcmVhdGVDbHVzdGVyKHNjb3BlLCB2cGNSZXNvdXJjZSEsIGttc0tleVJlc291cmNlLCB2ZXJzaW9uLCBibHVlcHJpbnRQcm9wcy5lbmFibGVDb250cm9sUGxhbmVMb2dUeXBlcywgYmx1ZXByaW50UHJvcHMuaXBGYW1pbHkpO1xyXG4gICAgICAgIHRoaXMuY2x1c3RlckluZm8uc2V0UmVzb3VyY2VDb250ZXh0KHJlc291cmNlQ29udGV4dCk7XHJcblxyXG4gICAgICAgIGlmIChibHVlcHJpbnRQcm9wcy5lbmFibGVHaXRPcHNNb2RlID09IHNwaS5HaXRPcHNNb2RlLkFQUExJQ0FUSU9OKSB7XHJcbiAgICAgICAgICAgIEFyZ29HaXRPcHNGYWN0b3J5LmVuYWJsZUdpdE9wcygpO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoYmx1ZXByaW50UHJvcHMuZW5hYmxlR2l0T3BzTW9kZSA9PSBzcGkuR2l0T3BzTW9kZS5BUFBfT0ZfQVBQUykge1xyXG4gICAgICAgICAgICBBcmdvR2l0T3BzRmFjdG9yeS5lbmFibGVHaXRPcHNBcHBPZkFwcHMoKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGNvbnN0IHBvc3REZXBsb3ltZW50U3RlcHMgPSBBcnJheTxzcGkuQ2x1c3RlclBvc3REZXBsb3k+KCk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IGFkZE9uIG9mIChibHVlcHJpbnRQcm9wcy5hZGRPbnMgPz8gW10pKSB7IC8vIG11c3QgaXRlcmF0ZSBpbiB0aGUgc3RyaWN0IG9yZGVyXHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IGFkZE9uLmRlcGxveSh0aGlzLmNsdXN0ZXJJbmZvKTtcclxuICAgICAgICAgICAgaWYgKHJlc3VsdCkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgYWRkT25LZXkgPSB1dGlscy5nZXRBZGRPbk5hbWVPcklkKGFkZE9uKTtcclxuICAgICAgICAgICAgICAgIHRoaXMuY2x1c3RlckluZm8uYWRkU2NoZWR1bGVkQWRkT24oYWRkT25LZXksIHJlc3VsdCwgdXRpbHMuaXNPcmRlcmVkQWRkT24oYWRkT24pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBjb25zdCBwb3N0RGVwbG95OiBhbnkgPSBhZGRPbjtcclxuICAgICAgICAgICAgaWYgKChwb3N0RGVwbG95IGFzIHNwaS5DbHVzdGVyUG9zdERlcGxveSkucG9zdERlcGxveSAhPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICBwb3N0RGVwbG95bWVudFN0ZXBzLnB1c2goPHNwaS5DbHVzdGVyUG9zdERlcGxveT5wb3N0RGVwbG95KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgY29uc3Qgc2NoZWR1bGVkQWRkT25zID0gdGhpcy5jbHVzdGVySW5mby5nZXRBbGxTY2hlZHVsZWRBZGRvbnMoKTtcclxuICAgICAgICBjb25zdCBhZGRPbktleXMgPSBbLi4uc2NoZWR1bGVkQWRkT25zLmtleXMoKV07XHJcbiAgICAgICAgY29uc3QgcHJvbWlzZXMgPSBzY2hlZHVsZWRBZGRPbnMudmFsdWVzKCk7XHJcblxyXG4gICAgICAgIHRoaXMuYXN5bmNUYXNrcyA9IFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKChjb25zdHJ1Y3RzKSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0cnVjdHMuZm9yRWFjaCgoY29uc3RydWN0LCBpbmRleCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbHVzdGVySW5mby5hZGRQcm92aXNpb25lZEFkZE9uKGFkZE9uS2V5c1tpbmRleF0sIGNvbnN0cnVjdCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgaWYgKGJsdWVwcmludFByb3BzLnRlYW1zICE9IG51bGwpIHtcclxuICAgICAgICAgICAgICAgIGZvciAobGV0IHRlYW0gb2YgYmx1ZXByaW50UHJvcHMudGVhbXMpIHtcclxuICAgICAgICAgICAgICAgICAgICB0ZWFtLnNldHVwKHRoaXMuY2x1c3RlckluZm8pO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBmb3IgKGxldCBzdGVwIG9mIHBvc3REZXBsb3ltZW50U3RlcHMpIHtcclxuICAgICAgICAgICAgICAgIHN0ZXAucG9zdERlcGxveSh0aGlzLmNsdXN0ZXJJbmZvLCBibHVlcHJpbnRQcm9wcy50ZWFtcyA/PyBbXSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgdGhpcy5hc3luY1Rhc2tzLmNhdGNoKGVyciA9PiB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGVycik7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBTaW5jZSBjb25zdHJ1Y3RvciBjYW5ub3QgYmUgbWFya2VkIGFzIGFzeW5jLCBhZGRpbmcgYSBzZXBhcmF0ZSBtZXRob2QgdG8gd2FpdFxyXG4gICAgICogZm9yIGFzeW5jIGNvZGUgdG8gZmluaXNoLlxyXG4gICAgICogQHJldHVybnMgUHJvbWlzZSB0aGF0IHJlc29sdmVzIHRvIHRoZSBibHVlcHJpbnRcclxuICAgICAqL1xyXG4gICAgcHVibGljIGFzeW5jIHdhaXRGb3JBc3luY1Rhc2tzKCk6IFByb21pc2U8RWtzQmx1ZXByaW50Q29uc3RydWN0PiB7XHJcbiAgICAgICAgaWYgKHRoaXMuYXN5bmNUYXNrcykge1xyXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5hc3luY1Rhc2tzLnRoZW4oKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKHRoaXMpO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmV0dXJucyBhbGwgdGhlIGNvbnN0cnVjdHMgcHJvZHVjZWQgYnkgZHVyaW5nIHRoZSBjbHVzdGVyIGNyZWF0aW9uIChlLmcuIGFkZC1vbnMpLlxyXG4gICAgICogTWF5IGJlIHVzZWQgaW4gdGVzdGluZyBmb3IgdmVyaWZpY2F0aW9uLlxyXG4gICAgICogQHJldHVybnMgQXN5bmMgVGFza3Mgb2JqZWN0XHJcbiAgICAgKi9cclxuICAgIGdldEFzeW5jVGFza3MoKTogUHJvbWlzZTx2b2lkIHwgQ29uc3RydWN0W10+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5hc3luY1Rhc2tzO1xyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBtZXRob2QgcmV0dXJucyBhbGwgdGhlIGNvbnN0cnVjdHMgcHJvZHVjZWQgYnkgZHVyaW5nIHRoZSBjbHVzdGVyIGNyZWF0aW9uIChlLmcuIGFkZC1vbnMpLlxyXG4gICAgICogTWF5IGJlIHVzZWQgaW4gdGVzdGluZyBmb3IgdmVyaWZpY2F0aW9uLlxyXG4gICAgICogQHJldHVybnMgY2x1c3RlciBpbmZvIG9iamVjdFxyXG4gICAgICovXHJcbiAgICBnZXRDbHVzdGVySW5mbygpOiBzcGkuQ2x1c3RlckluZm8ge1xyXG4gICAgICAgIHJldHVybiB0aGlzLmNsdXN0ZXJJbmZvO1xyXG4gICAgfVxyXG5cclxuICAgIHByaXZhdGUgcHJvdmlkZU5hbWVkUmVzb3VyY2VzKGJsdWVwcmludFByb3BzOiBFa3NCbHVlcHJpbnRQcm9wcywgc2NvcGU6IENvbnN0cnVjdCk6IHNwaS5SZXNvdXJjZUNvbnRleHQge1xyXG4gICAgICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBzcGkuUmVzb3VyY2VDb250ZXh0KHNjb3BlLCBibHVlcHJpbnRQcm9wcyk7XHJcblxyXG4gICAgICAgIGZvciAobGV0IFtrZXksIHZhbHVlXSBvZiBibHVlcHJpbnRQcm9wcy5yZXNvdXJjZVByb3ZpZGVycyA/PyBbXSkge1xyXG4gICAgICAgICAgICByZXN1bHQuYWRkKGtleSwgdmFsdWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlc29sdmVzIGFsbCBkeW5hbWljIHByb3hpZXMsIHRoYXQgc3Vic3RpdHV0ZXMgcmVzb3VyY2UgcHJvdmlkZXIgcHJveGllcyB3aXRoIHRoZSByZXNvbHZlZCB2YWx1ZXMuXHJcbiAgICAgKiBAcGFyYW0gYmx1ZXByaW50UHJvcHNcclxuICAgICAqIEBwYXJhbSByZXNvdXJjZUNvbnRleHRcclxuICAgICAqIEByZXR1cm5zIGEgY29weSBvZiBibHVlcHJpbnQgcHJvcHMgd2l0aCByZXNvbHZlZCB2YWx1ZXNcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSByZXNvbHZlRHluYW1pY1Byb3hpZXMoYmx1ZXByaW50UHJvcHM6IEVrc0JsdWVwcmludFByb3BzLCByZXNvdXJjZUNvbnRleHQ6IHNwaS5SZXNvdXJjZUNvbnRleHQpIDogRWtzQmx1ZXByaW50UHJvcHMge1xyXG4gICAgICAgIHJldHVybiB1dGlscy5jbG9uZURlZXAoYmx1ZXByaW50UHJvcHMsICh2YWx1ZSkgPT4ge1xyXG4gICAgICAgICAgICByZXR1cm4gdXRpbHMucmVzb2x2ZVRhcmdldCh2YWx1ZSwgcmVzb3VyY2VDb250ZXh0KTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbGlkYXRlcyBpbnB1dCBhZ2FpbnN0IGJhc2ljIGRlZmluZWQgY29uc3RyYWludHMuXHJcbiAgICAgKiBAcGFyYW0gYmx1ZXByaW50UHJvcHNcclxuICAgICAqL1xyXG4gICAgcHJpdmF0ZSB2YWxpZGF0ZUlucHV0KGJsdWVwcmludFByb3BzOiBFa3NCbHVlcHJpbnRQcm9wcykge1xyXG4gICAgICAgIGNvbnN0IHRlYW1OYW1lcyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgIGNvbnN0cmFpbnRzLnZhbGlkYXRlQ29uc3RyYWludHMobmV3IEJsdWVwcmludFByb3BzQ29uc3RyYWludHMsIEVrc0JsdWVwcmludFByb3BzLm5hbWUsIGJsdWVwcmludFByb3BzKTtcclxuICAgICAgICBpZiAoYmx1ZXByaW50UHJvcHMudGVhbXMpIHtcclxuICAgICAgICAgICAgYmx1ZXByaW50UHJvcHMudGVhbXMuZm9yRWFjaChlID0+IHtcclxuICAgICAgICAgICAgICAgIGlmICh0ZWFtTmFtZXMuaGFzKGUubmFtZSkpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYFRlYW0gJHtlLm5hbWV9IGlzIHJlZ2lzdGVyZWQgbW9yZSB0aGFuIG9uY2VgKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIHRlYW1OYW1lcy5hZGQoZS5uYW1lKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4iXX0=