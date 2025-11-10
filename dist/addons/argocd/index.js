"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgoCDAddOn = void 0;
const assert = require("assert");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const bcrypt = require("bcrypt");
const dot = require("dot-object");
const ts_deepmerge_1 = require("ts-deepmerge");
const __1 = require("..");
const spi = require("../../spi");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
const application_1 = require("./application");
const manifest_utils_1 = require("./manifest-utils");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    namespace: "argocd",
    version: '7.9.0',
    chart: "argo-cd",
    release: "blueprints-addon-argocd",
    repository: "https://argoproj.github.io/argo-helm"
};
/**
 * Implementation of ArgoCD add-on and post deployment hook.
 */
let ArgoCDAddOn = class ArgoCDAddOn {
    options;
    chartNode;
    constructor(props) {
        this.options = { ...defaultProps, ...props };
        helm_addon_1.HelmAddOn.validateVersion({
            chart: this.options.chart,
            version: this.options.version,
            repository: this.options.repository
        });
        if (this.options.bootstrapRepo) {
            (0, utils_1.validateConstraints)(new spi.ApplicationRepositoryConstraints, "ArgoCDAddOnProps.bootstrapRepo", this.options.bootstrapRepo);
        }
    }
    generate(clusterInfo, deployment, wave = 0) {
        const promise = clusterInfo.getScheduledAddOn('ArgoCDAddOn');
        if (promise === undefined) {
            throw new Error("ArgoCD addon must be registered before creating Argo managed add-ons for helm applications");
        }
        const manifest = new application_1.ArgoApplication(deployment.repository ?? this.options.bootstrapRepo).generate(deployment, wave);
        const construct = clusterInfo.cluster.addManifest(deployment.name, manifest);
        promise.then(chart => {
            construct.node.addDependency(chart);
        });
        return construct;
    }
    /**
     * Implementation of the add-on contract deploy method.
    */
    async deploy(clusterInfo) {
        const namespace = (0, utils_1.createNamespace)(this.options.namespace, clusterInfo.cluster, true);
        const sa = this.createServiceAccount(clusterInfo);
        sa.node.addDependency(namespace);
        const defaultValues = {};
        dot.set("server.serviceAccount.create", false, defaultValues);
        const secrets = [];
        if (this.options.bootstrapRepo?.credentialsSecretName) {
            const repo = this.options.bootstrapRepo;
            secrets.push((0, manifest_utils_1.createSecretRef)(repo.credentialsType, repo.credentialsSecretName));
        }
        if (this.options.adminPasswordSecretName) {
            const adminSecret = await this.createAdminSecret(clusterInfo.cluster.stack.region);
            dot.set("configs.secret.argocdServerAdminPassword", adminSecret, defaultValues, true);
        }
        let secretProviderClass;
        if (secrets.length > 0) {
            secretProviderClass = new __1.SecretProviderClass(clusterInfo, sa, 'blueprints-secret', ...secrets);
            dot.set('server', secretProviderClass.getVolumeMounts('blueprints-secret-inline'), defaultValues, true);
        }
        this.getAllRepositories().forEach((repo, index) => {
            const repoName = repo.name ?? index == 0 ? "bootstrap" : `bootstrap-${index}`;
            dot.set(`configs.repositories.${repoName}`, { url: repo.repoUrl }, defaultValues, true);
        });
        let values = (0, ts_deepmerge_1.merge)(defaultValues, this.options.values ?? {});
        this.chartNode = clusterInfo.cluster.addHelmChart("argocd-addon", {
            chart: this.options.chart,
            release: this.options.release,
            repository: this.options.repository,
            version: this.options.version,
            namespace: this.options.namespace,
            values: values
        });
        this.chartNode.node.addDependency(sa);
        if (secretProviderClass) {
            secretProviderClass.addDependent(this.chartNode);
        }
        return this.chartNode;
    }
    /**
     * Post deployment step is used to create a bootstrap repository if options are provided for the add-on.
     * @param clusterInfo
     * @param teams
     * @returns
     */
    postDeploy(clusterInfo, teams) {
        assert(teams != null);
        const appRepo = this.options.bootstrapRepo;
        const shared = {
            clusterName: clusterInfo.cluster.clusterName,
            region: aws_cdk_lib_1.Stack.of(clusterInfo.cluster).region,
            repoUrl: appRepo?.repoUrl,
            targetRevision: appRepo?.targetRevision,
        };
        if (appRepo) {
            // merge with custom bootstrapValues with AddOnContexts and common values
            const merged = { ...shared, ...Object.fromEntries(clusterInfo.getAddOnContexts().entries()), ...this.options.bootstrapValues };
            this.generate(clusterInfo, {
                name: appRepo.name ?? "bootstrap-apps",
                namespace: this.options.namespace,
                repository: appRepo,
                values: merged,
            });
        }
        const workloadApps = this.options.workloadApplications;
        if (workloadApps) {
            workloadApps.forEach(app => {
                const values = { ...shared, ...app.values };
                this.generate(clusterInfo, { ...app, ...{ values } });
            });
        }
        this.chartNode = undefined;
    }
    /**
     * @returns bcrypt hash of the admin secret provided from the AWS secret manager.
     */
    async createAdminSecret(region) {
        const secretValue = await (0, utils_1.getSecretValue)(this.options.adminPasswordSecretName, region);
        return bcrypt.hash(secretValue, 10);
    }
    /**
     * Creates a service account that can access secrets
     * @param clusterInfo
     * @returns
     */
    createServiceAccount(clusterInfo) {
        const sa = clusterInfo.cluster.addServiceAccount('argo-cd-server', {
            name: "argocd-server",
            namespace: this.options.namespace
        });
        return sa;
    }
    /**
     * Returns all repositories defined in the options.
     */
    getAllRepositories() {
        let result = [];
        const urls = new Set();
        const bootstrapRepo = this.options.bootstrapRepo;
        if (bootstrapRepo) {
            result.push({ ...bootstrapRepo, ...{ name: bootstrapRepo.name ?? "bootstrap" } });
            urls.add(bootstrapRepo.repoUrl);
        }
        if (this.options.workloadApplications) {
            this.options.workloadApplications.forEach(repo => {
                if (repo.repository && !urls.has(repo.repository.repoUrl)) {
                    result.push(repo.repository);
                    urls.add(repo.repository.repoUrl);
                }
            });
        }
        return result;
    }
};
exports.ArgoCDAddOn = ArgoCDAddOn;
exports.ArgoCDAddOn = ArgoCDAddOn = __decorate([
    utils_1.supportsALL
], ArgoCDAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2FyZ29jZC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxpQ0FBaUM7QUFFakMsNkNBQW9DO0FBQ3BDLGlDQUFpQztBQUVqQyxrQ0FBa0M7QUFDbEMsK0NBQXFDO0FBQ3JDLDBCQUF5QztBQUN6QyxpQ0FBaUM7QUFDakMsdUNBQWdHO0FBQ2hHLDhDQUE4RDtBQUM5RCwrQ0FBZ0Q7QUFDaEQscURBQW1EO0FBeURuRDs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFHO0lBQ2pCLFNBQVMsRUFBRSxRQUFRO0lBQ25CLE9BQU8sRUFBRSxPQUFPO0lBQ2hCLEtBQUssRUFBRSxTQUFTO0lBQ2hCLE9BQU8sRUFBRSx5QkFBeUI7SUFDbEMsVUFBVSxFQUFFLHNDQUFzQztDQUNyRCxDQUFDO0FBR0Y7O0dBRUc7QUFFSSxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFXO0lBRVgsT0FBTyxDQUFtQjtJQUUzQixTQUFTLENBQWE7SUFFOUIsWUFBWSxLQUF3QjtRQUNoQyxJQUFJLENBQUMsT0FBTyxHQUFHLEVBQUUsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQztRQUM3QyxzQkFBUyxDQUFDLGVBQWUsQ0FBQztZQUN0QixLQUFLLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFNO1lBQzFCLE9BQU8sRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQVE7WUFDOUIsVUFBVSxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVztTQUN2QyxDQUFDLENBQUM7UUFDSCxJQUFJLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxFQUFDLENBQUM7WUFDNUIsSUFBQSwyQkFBbUIsRUFBQyxJQUFJLEdBQUcsQ0FBQyxnQ0FBZ0MsRUFBRSxnQ0FBZ0MsRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBQ2hJLENBQUM7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O2dCQUM3QyxJQUFHLElBQUksQ0FBQyxVQUFVLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQztvQkFDdkQsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7b0JBQzdCLElBQUksQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsQ0FBQztnQkFDdEMsQ0FBQztZQUNMLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUVELE9BQU8sTUFBTSxDQUFDO0lBQ2xCLENBQUM7Q0FDSixDQUFBO0FBOUtZLGtDQUFXO3NCQUFYLFdBQVc7SUFEdkIsbUJBQVc7R0FDQyxXQUFXLENBOEt2QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XHJcbmltcG9ydCB7IEhlbG1DaGFydCwgU2VydmljZUFjY291bnQgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgeyBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgYmNyeXB0IGZyb20gXCJiY3J5cHRcIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgZG90IGZyb20gJ2RvdC1vYmplY3QnO1xyXG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJ0cy1kZWVwbWVyZ2VcIjtcclxuaW1wb3J0IHsgU2VjcmV0UHJvdmlkZXJDbGFzcyB9IGZyb20gJy4uJztcclxuaW1wb3J0ICogYXMgc3BpIGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgY3JlYXRlTmFtZXNwYWNlLCBnZXRTZWNyZXRWYWx1ZSwgc3VwcG9ydHNBTEwsIHZhbGlkYXRlQ29uc3RyYWludHMgfSBmcm9tICcuLi8uLi91dGlscyc7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uVXNlclByb3BzIH0gZnJvbSAnLi4vaGVsbS1hZGRvbic7XHJcbmltcG9ydCB7IEFyZ29BcHBsaWNhdGlvbiB9IGZyb20gJy4vYXBwbGljYXRpb24nO1xyXG5pbXBvcnQgeyBjcmVhdGVTZWNyZXRSZWYgfSBmcm9tICcuL21hbmlmZXN0LXV0aWxzJztcclxuaW1wb3J0IHsgR2l0UmVwb3NpdG9yeVJlZmVyZW5jZSB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuXHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEFyZ29DREFkZE9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lc3BhY2Ugd2hlcmUgYWRkLW9uIHdpbGwgYmUgZGVwbG95ZWQuIFxyXG4gICAgICogQGRlZmF1bHQgYXJnb2NkXHJcbiAgICAgKi9cclxuICAgIG5hbWVzcGFjZT86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICogSGVsbSBjaGFydCB2ZXJzaW9uIHRvIHVzZSB0byBpbnN0YWxsLlxyXG4gICAgKiBAZGVmYXVsdCA1LjUxLjZcclxuICAgICovXHJcbiAgICB2ZXJzaW9uPzogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSWYgcHJvdmlkZWQsIHRoZSBhZGRvbiB3aWxsIGJvb3RzdHJhcCB0aGUgYXBwIG9yIGFwcHMgaW4gdGhlIHByb3ZpZGVkIHJlcG9zaXRvcnkuXHJcbiAgICAgKiBJbiBnZW5lcmFsLCB0aGUgcmVwbyBpcyBleHBlY3RlZCB0byBoYXZlIHRoZSBhcHAgb2YgYXBwcywgd2hpY2ggY2FuIGVuYWJsZSB0byBib290c3RyYXAgYWxsIHdvcmtsb2FkcyxcclxuICAgICAqIGFmdGVyIHRoZSBpbmZyYXN0cnVjdHVyZSBhbmQgdGVhbSBwcm92aXNpb25pbmcgaXMgY29tcGxldGUuXHJcbiAgICAgKiBXaGVuIEdpdE9wcyBtb2RlIGlzIGVuYWJsZWQgdmlhIGBBcmdvR2l0T3BzRmFjdG9yeWAgZm9yIGRlcGxveWluZyB0aGUgQWRkT25zLCB0aGlzIGJvb3RzdHJhcFxyXG4gICAgICogcmVwb3NpdG9yeSB3aWxsIGJlIHVzZWQgZm9yIHByb3Zpc2lvbmluZyBhbGwgYEhlbG1BZGRPbmAgYmFzZWQgQWRkT25zLlxyXG4gICAgICovXHJcbiAgICBib290c3RyYXBSZXBvPzogc3BpLkFwcGxpY2F0aW9uUmVwb3NpdG9yeTtcclxuXHJcbiAgICAvKipcclxuICAgICAqIE9wdGlvbmFsIHZhbHVlcyBmb3IgdGhlIGJvb3RzdHJhcCBhcHBsaWNhdGlvbi4gVGhlc2UgbWF5IGNvbnRhaW4gdmFsdWVzIHN1Y2ggYXMgZG9tYWluIG5hbWVkIHByb3Zpc2lvbmVkIGJ5IG90aGVyIGFkZC1vbnMsIGNlcnRpZmljYXRlLCBhbmQgb3RoZXIgcGFyYW1ldGVycyB0byBwYXNzIFxyXG4gICAgICogdG8gdGhlIGFwcGxpY2F0aW9ucy4gXHJcbiAgICAgKi9cclxuICAgIGJvb3RzdHJhcFZhbHVlcz86IHNwaS5WYWx1ZXMsXHJcblxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkaXRpb25hbCBHaXRPcHMgYXBwbGljYXRpb25zIGFuZCByZXBvc2l0b3JpZXMuIElmIHRoZXJlIGlzIGEgc3BsaXQgYmV0d2VlbiBpbmZyYSBhbmQgYXBwbGljYXRpb24gcmVwb3NpdG9yaWVzIHRoZW5cclxuICAgICAqIGJvb3RzdHJhcCByZXBvIGlzIGV4cGVjdGVkIHRvIGJlIGxldmVyYWdlZCBmb3IgaW5mcmFzdHJ1Y3R1cmUgYW5kIGFwcGxpY2F0aW9uIGRlcGxveW1lbnRzIHdpbGwgY29udGFpbiBhZGRpdGlvbmFsIGFwcGxpY2F0aW9ucy5cclxuICAgICAqL1xyXG4gICAgd29ya2xvYWRBcHBsaWNhdGlvbnM/OiBzcGkuR2l0T3BzQXBwbGljYXRpb25EZXBsb3ltZW50W10sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBPcHRpb25hbCBhZG1pbiBwYXNzd29yZCBzZWNyZXQgbmFtZSBhcyBkZWZpbmVkIGluIEFXUyBTZWNyZXRzIE1hbmFnZXIgKHBsYWludGV4dCkuXHJcbiAgICAgKiBUaGlzIGFsbG93cyB0byBjb250cm9sIGFkbWluIHBhc3N3b3JkIGFjcm9zcyB0aGUgZW50ZXJwcmlzZS4gUGFzc3dvcmQgd2lsbCBiZSByZXRyaWV2ZWQgYW5kIFxyXG4gICAgICogc3RvcmVkIGFzIGEgbm9uLXJldmVyc2libGUgYmNyeXB0IGhhc2guIFxyXG4gICAgICogTm90ZTogYXQgcHJlc2VudCwgY2hhbmdlIG9mIHBhc3N3b3JkIG1heSByZXF1aXJlIG1hbnVhbCByZXN0YXJ0IG9mIGFyZ29jZCBzZXJ2ZXIuIFxyXG4gICAgICovXHJcbiAgICBhZG1pblBhc3N3b3JkU2VjcmV0TmFtZT86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbHVlcyB0byBwYXNzIHRvIHRoZSBjaGFydCBhcyBwZXIgaHR0cHM6Ly9naXRodWIuY29tL2FyZ29wcm9qL2FyZ28taGVsbS9ibG9iL21hc3Rlci9jaGFydHMvYXJnby1jZC92YWx1ZXMueWFtbC5cclxuICAgICAqL1xyXG4gICAgdmFsdWVzPzogc3BpLlZhbHVlcztcclxuICAgIFxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdHMgb3B0aW9ucyBmb3IgdGhlIGFkZC1vblxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xyXG4gICAgbmFtZXNwYWNlOiBcImFyZ29jZFwiLFxyXG4gICAgdmVyc2lvbjogJzcuOS4wJyxcclxuICAgIGNoYXJ0OiBcImFyZ28tY2RcIixcclxuICAgIHJlbGVhc2U6IFwiYmx1ZXByaW50cy1hZGRvbi1hcmdvY2RcIixcclxuICAgIHJlcG9zaXRvcnk6IFwiaHR0cHM6Ly9hcmdvcHJvai5naXRodWIuaW8vYXJnby1oZWxtXCJcclxufTtcclxuXHJcblxyXG4vKipcclxuICogSW1wbGVtZW50YXRpb24gb2YgQXJnb0NEIGFkZC1vbiBhbmQgcG9zdCBkZXBsb3ltZW50IGhvb2suXHJcbiAqL1xyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIEFyZ29DREFkZE9uIGltcGxlbWVudHMgc3BpLkNsdXN0ZXJBZGRPbiwgc3BpLkNsdXN0ZXJQb3N0RGVwbG95IHtcclxuXHJcbiAgICByZWFkb25seSBvcHRpb25zOiBBcmdvQ0RBZGRPblByb3BzO1xyXG5cclxuICAgIHByaXZhdGUgY2hhcnROb2RlPzogSGVsbUNoYXJ0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogQXJnb0NEQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHsgLi4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9O1xyXG4gICAgICAgIEhlbG1BZGRPbi52YWxpZGF0ZVZlcnNpb24oe1xyXG4gICAgICAgICAgICBjaGFydDogdGhpcy5vcHRpb25zLmNoYXJ0ISxcclxuICAgICAgICAgICAgdmVyc2lvbjogdGhpcy5vcHRpb25zLnZlcnNpb24hLFxyXG4gICAgICAgICAgICByZXBvc2l0b3J5OiB0aGlzLm9wdGlvbnMucmVwb3NpdG9yeSFcclxuICAgICAgICB9KTtcclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmJvb3RzdHJhcFJlcG8pe1xyXG4gICAgICAgICAgICB2YWxpZGF0ZUNvbnN0cmFpbnRzKG5ldyBzcGkuQXBwbGljYXRpb25SZXBvc2l0b3J5Q29uc3RyYWludHMsIFwiQXJnb0NEQWRkT25Qcm9wcy5ib290c3RyYXBSZXBvXCIsIHRoaXMub3B0aW9ucy5ib290c3RyYXBSZXBvKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgZ2VuZXJhdGUoY2x1c3RlckluZm86IHNwaS5DbHVzdGVySW5mbywgZGVwbG95bWVudDogc3BpLkdpdE9wc0FwcGxpY2F0aW9uRGVwbG95bWVudCwgd2F2ZSA9IDApOiBDb25zdHJ1Y3Qge1xyXG4gICAgICAgIGNvbnN0IHByb21pc2UgPSBjbHVzdGVySW5mby5nZXRTY2hlZHVsZWRBZGRPbignQXJnb0NEQWRkT24nKTtcclxuXHJcbiAgICAgICAgaWYgKHByb21pc2UgPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJBcmdvQ0QgYWRkb24gbXVzdCBiZSByZWdpc3RlcmVkIGJlZm9yZSBjcmVhdGluZyBBcmdvIG1hbmFnZWQgYWRkLW9ucyBmb3IgaGVsbSBhcHBsaWNhdGlvbnNcIik7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGNvbnN0IG1hbmlmZXN0ID0gbmV3IEFyZ29BcHBsaWNhdGlvbihkZXBsb3ltZW50LnJlcG9zaXRvcnkgPz8gdGhpcy5vcHRpb25zLmJvb3RzdHJhcFJlcG8pLmdlbmVyYXRlKGRlcGxveW1lbnQsIHdhdmUpO1xyXG4gICAgICAgIGNvbnN0IGNvbnN0cnVjdCA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXIuYWRkTWFuaWZlc3QoZGVwbG95bWVudC5uYW1lLCBtYW5pZmVzdCk7XHJcbiAgICAgICAgcHJvbWlzZS50aGVuKGNoYXJ0ID0+IHtcclxuICAgICAgICAgICAgY29uc3RydWN0Lm5vZGUuYWRkRGVwZW5kZW5jeShjaGFydCk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIHJldHVybiBjb25zdHJ1Y3Q7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgYWRkLW9uIGNvbnRyYWN0IGRlcGxveSBtZXRob2QuXHJcbiAgICAqL1xyXG4gICAgYXN5bmMgZGVwbG95KGNsdXN0ZXJJbmZvOiBzcGkuQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IGNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISwgY2x1c3RlckluZm8uY2x1c3RlciwgdHJ1ZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNhID0gdGhpcy5jcmVhdGVTZXJ2aWNlQWNjb3VudChjbHVzdGVySW5mbyk7XHJcbiAgICAgICAgc2Eubm9kZS5hZGREZXBlbmRlbmN5KG5hbWVzcGFjZSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXM6IHNwaS5WYWx1ZXMgPSB7fTtcclxuICAgICAgICBkb3Quc2V0KFwic2VydmVyLnNlcnZpY2VBY2NvdW50LmNyZWF0ZVwiLCBmYWxzZSwgZGVmYXVsdFZhbHVlcyk7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlY3JldHMgPSBbXTtcclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5ib290c3RyYXBSZXBvPy5jcmVkZW50aWFsc1NlY3JldE5hbWUpIHtcclxuICAgICAgICAgICAgY29uc3QgcmVwbyA9IHRoaXMub3B0aW9ucy5ib290c3RyYXBSZXBvO1xyXG4gICAgICAgICAgICBzZWNyZXRzLnB1c2goY3JlYXRlU2VjcmV0UmVmKHJlcG8uY3JlZGVudGlhbHNUeXBlISwgcmVwby5jcmVkZW50aWFsc1NlY3JldE5hbWUhKSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuYWRtaW5QYXNzd29yZFNlY3JldE5hbWUpIHtcclxuICAgICAgICAgICAgY29uc3QgYWRtaW5TZWNyZXQgPSBhd2FpdCB0aGlzLmNyZWF0ZUFkbWluU2VjcmV0KGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2sucmVnaW9uKTtcclxuICAgICAgICAgICAgZG90LnNldChcImNvbmZpZ3Muc2VjcmV0LmFyZ29jZFNlcnZlckFkbWluUGFzc3dvcmRcIiwgYWRtaW5TZWNyZXQsIGRlZmF1bHRWYWx1ZXMsIHRydWUpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbGV0IHNlY3JldFByb3ZpZGVyQ2xhc3M6IFNlY3JldFByb3ZpZGVyQ2xhc3MgfCB1bmRlZmluZWQ7XHJcblxyXG4gICAgICAgIGlmIChzZWNyZXRzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICAgICAgc2VjcmV0UHJvdmlkZXJDbGFzcyA9IG5ldyBTZWNyZXRQcm92aWRlckNsYXNzKGNsdXN0ZXJJbmZvLCBzYSwgJ2JsdWVwcmludHMtc2VjcmV0JywgLi4uc2VjcmV0cyk7XHJcbiAgICAgICAgICAgIGRvdC5zZXQoJ3NlcnZlcicsIHNlY3JldFByb3ZpZGVyQ2xhc3MuZ2V0Vm9sdW1lTW91bnRzKCdibHVlcHJpbnRzLXNlY3JldC1pbmxpbmUnKSwgZGVmYXVsdFZhbHVlcywgdHJ1ZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICB0aGlzLmdldEFsbFJlcG9zaXRvcmllcygpLmZvckVhY2goKHJlcG8sIGluZGV4KSA9PiB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlcG9OYW1lID0gcmVwby5uYW1lID8/IGluZGV4ID09IDAgPyBcImJvb3RzdHJhcFwiIDogYGJvb3RzdHJhcC0ke2luZGV4fWA7XHJcbiAgICAgICAgICAgIGRvdC5zZXQoYGNvbmZpZ3MucmVwb3NpdG9yaWVzLiR7cmVwb05hbWV9YCwgeyB1cmw6IHJlcG8ucmVwb1VybCB9LCBkZWZhdWx0VmFsdWVzLCB0cnVlKTtcclxuICAgICAgICB9KTtcclxuICAgICAgICBcclxuICAgICAgICBsZXQgdmFsdWVzID0gbWVyZ2UoZGVmYXVsdFZhbHVlcywgdGhpcy5vcHRpb25zLnZhbHVlcyA/PyB7fSk7XHJcblxyXG4gICAgICAgIHRoaXMuY2hhcnROb2RlID0gY2x1c3RlckluZm8uY2x1c3Rlci5hZGRIZWxtQ2hhcnQoXCJhcmdvY2QtYWRkb25cIiwge1xyXG4gICAgICAgICAgICBjaGFydDogdGhpcy5vcHRpb25zLmNoYXJ0ISxcclxuICAgICAgICAgICAgcmVsZWFzZTogdGhpcy5vcHRpb25zLnJlbGVhc2UsXHJcbiAgICAgICAgICAgIHJlcG9zaXRvcnk6IHRoaXMub3B0aW9ucy5yZXBvc2l0b3J5LFxyXG4gICAgICAgICAgICB2ZXJzaW9uOiB0aGlzLm9wdGlvbnMudmVyc2lvbixcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiB0aGlzLm9wdGlvbnMubmFtZXNwYWNlLFxyXG4gICAgICAgICAgICB2YWx1ZXM6IHZhbHVlc1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICB0aGlzLmNoYXJ0Tm9kZS5ub2RlLmFkZERlcGVuZGVuY3koc2EpO1xyXG5cclxuICAgICAgICBpZiAoc2VjcmV0UHJvdmlkZXJDbGFzcykge1xyXG4gICAgICAgICAgICBzZWNyZXRQcm92aWRlckNsYXNzLmFkZERlcGVuZGVudCh0aGlzLmNoYXJ0Tm9kZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdGhpcy5jaGFydE5vZGU7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBQb3N0IGRlcGxveW1lbnQgc3RlcCBpcyB1c2VkIHRvIGNyZWF0ZSBhIGJvb3RzdHJhcCByZXBvc2l0b3J5IGlmIG9wdGlvbnMgYXJlIHByb3ZpZGVkIGZvciB0aGUgYWRkLW9uLlxyXG4gICAgICogQHBhcmFtIGNsdXN0ZXJJbmZvIFxyXG4gICAgICogQHBhcmFtIHRlYW1zIFxyXG4gICAgICogQHJldHVybnMgXHJcbiAgICAgKi9cclxuICAgIHBvc3REZXBsb3koY2x1c3RlckluZm86IHNwaS5DbHVzdGVySW5mbywgdGVhbXM6IHNwaS5UZWFtW10pIHtcclxuICAgICAgICBhc3NlcnQodGVhbXMgIT0gbnVsbCk7XHJcbiAgICAgICAgY29uc3QgYXBwUmVwbyA9IHRoaXMub3B0aW9ucy5ib290c3RyYXBSZXBvO1xyXG4gICAgICAgIGNvbnN0IHNoYXJlZCA9IHtcclxuICAgICAgICAgICAgY2x1c3Rlck5hbWU6IGNsdXN0ZXJJbmZvLmNsdXN0ZXIuY2x1c3Rlck5hbWUsXHJcbiAgICAgICAgICAgIHJlZ2lvbjogU3RhY2sub2YoY2x1c3RlckluZm8uY2x1c3RlcikucmVnaW9uLFxyXG4gICAgICAgICAgICByZXBvVXJsOiBhcHBSZXBvPy5yZXBvVXJsLFxyXG4gICAgICAgICAgICB0YXJnZXRSZXZpc2lvbjogYXBwUmVwbz8udGFyZ2V0UmV2aXNpb24sXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgaWYgKGFwcFJlcG8pIHtcclxuICAgICAgICAgICAgLy8gbWVyZ2Ugd2l0aCBjdXN0b20gYm9vdHN0cmFwVmFsdWVzIHdpdGggQWRkT25Db250ZXh0cyBhbmQgY29tbW9uIHZhbHVlc1xyXG4gICAgICAgICAgICBjb25zdCBtZXJnZWQgPSB7IC4uLnNoYXJlZCwgLi4uT2JqZWN0LmZyb21FbnRyaWVzKGNsdXN0ZXJJbmZvLmdldEFkZE9uQ29udGV4dHMoKS5lbnRyaWVzKCkpLCAuLi50aGlzLm9wdGlvbnMuYm9vdHN0cmFwVmFsdWVzIH07XHJcblxyXG4gICAgICAgICAgICB0aGlzLmdlbmVyYXRlKGNsdXN0ZXJJbmZvLCB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBhcHBSZXBvLm5hbWUgPz8gXCJib290c3RyYXAtYXBwc1wiLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiB0aGlzLm9wdGlvbnMubmFtZXNwYWNlISxcclxuICAgICAgICAgICAgICAgIHJlcG9zaXRvcnk6IGFwcFJlcG8sXHJcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IG1lcmdlZCxcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBjb25zdCB3b3JrbG9hZEFwcHMgPSB0aGlzLm9wdGlvbnMud29ya2xvYWRBcHBsaWNhdGlvbnM7XHJcblxyXG4gICAgICAgIGlmKHdvcmtsb2FkQXBwcykge1xyXG4gICAgICAgICAgICB3b3JrbG9hZEFwcHMuZm9yRWFjaChhcHAgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgdmFsdWVzID0gIHsgLi4uc2hhcmVkLCAuLi5hcHAudmFsdWVzIH07XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdlbmVyYXRlKGNsdXN0ZXJJbmZvLCB7IC4uLmFwcCwgLi4ueyB2YWx1ZXMgfSB9KTtcclxuICAgICAgICAgICAgfSk7IFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5jaGFydE5vZGUgPSB1bmRlZmluZWQ7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBAcmV0dXJucyBiY3J5cHQgaGFzaCBvZiB0aGUgYWRtaW4gc2VjcmV0IHByb3ZpZGVkIGZyb20gdGhlIEFXUyBzZWNyZXQgbWFuYWdlci5cclxuICAgICAqL1xyXG4gICAgcHJvdGVjdGVkIGFzeW5jIGNyZWF0ZUFkbWluU2VjcmV0KHJlZ2lvbjogc3RyaW5nKTogUHJvbWlzZTxzdHJpbmc+IHtcclxuICAgICAgICBjb25zdCBzZWNyZXRWYWx1ZSA9IGF3YWl0IGdldFNlY3JldFZhbHVlKHRoaXMub3B0aW9ucy5hZG1pblBhc3N3b3JkU2VjcmV0TmFtZSEsIHJlZ2lvbik7XHJcbiAgICAgICAgcmV0dXJuIGJjcnlwdC5oYXNoKHNlY3JldFZhbHVlLCAxMCk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDcmVhdGVzIGEgc2VydmljZSBhY2NvdW50IHRoYXQgY2FuIGFjY2VzcyBzZWNyZXRzXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAgICAgKiBAcmV0dXJucyBcclxuICAgICAqL1xyXG4gICAgcHJvdGVjdGVkIGNyZWF0ZVNlcnZpY2VBY2NvdW50KGNsdXN0ZXJJbmZvOiBzcGkuQ2x1c3RlckluZm8pOiBTZXJ2aWNlQWNjb3VudCB7XHJcbiAgICAgICAgY29uc3Qgc2EgPSBjbHVzdGVySW5mby5jbHVzdGVyLmFkZFNlcnZpY2VBY2NvdW50KCdhcmdvLWNkLXNlcnZlcicsIHtcclxuICAgICAgICAgICAgbmFtZTogXCJhcmdvY2Qtc2VydmVyXCIsXHJcbiAgICAgICAgICAgIG5hbWVzcGFjZTogdGhpcy5vcHRpb25zLm5hbWVzcGFjZVxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHJldHVybiBzYTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybnMgYWxsIHJlcG9zaXRvcmllcyBkZWZpbmVkIGluIHRoZSBvcHRpb25zLlxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgZ2V0QWxsUmVwb3NpdG9yaWVzKCk6IEdpdFJlcG9zaXRvcnlSZWZlcmVuY2VbXSB7XHJcbiAgICAgICAgbGV0IHJlc3VsdDogR2l0UmVwb3NpdG9yeVJlZmVyZW5jZVtdID0gW107XHJcbiAgICAgICAgXHJcbiAgICAgICAgY29uc3QgdXJscyA9IG5ldyBTZXQ8c3RyaW5nPigpO1xyXG4gICAgICAgIGNvbnN0IGJvb3RzdHJhcFJlcG8gPSB0aGlzLm9wdGlvbnMuYm9vdHN0cmFwUmVwbztcclxuXHJcbiAgICAgICAgaWYoYm9vdHN0cmFwUmVwbykge1xyXG4gICAgICAgICAgICByZXN1bHQucHVzaCh7Li4uYm9vdHN0cmFwUmVwbywgLi4ueyBuYW1lIDogYm9vdHN0cmFwUmVwby5uYW1lID8/IFwiYm9vdHN0cmFwXCJ9fSk7XHJcbiAgICAgICAgICAgIHVybHMuYWRkKGJvb3RzdHJhcFJlcG8ucmVwb1VybCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZih0aGlzLm9wdGlvbnMud29ya2xvYWRBcHBsaWNhdGlvbnMpIHtcclxuICAgICAgICAgICAgdGhpcy5vcHRpb25zLndvcmtsb2FkQXBwbGljYXRpb25zLmZvckVhY2gocmVwbyA9PiB7XHJcbiAgICAgICAgICAgICAgICBpZihyZXBvLnJlcG9zaXRvcnkgJiYgIXVybHMuaGFzKHJlcG8ucmVwb3NpdG9yeS5yZXBvVXJsKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHJlcG8ucmVwb3NpdG9yeSk7XHJcbiAgICAgICAgICAgICAgICAgICAgdXJscy5hZGQocmVwby5yZXBvc2l0b3J5LnJlcG9VcmwpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHJldHVybiByZXN1bHQ7XHJcbiAgICB9XHJcbn1cclxuIl19