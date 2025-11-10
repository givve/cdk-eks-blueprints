"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JupyterHubAddOn = exports.JupyterHubServiceType = void 0;
const assert = require("assert");
const utils_1 = require("../../utils");
const aws_loadbalancer_controller_1 = require("../aws-loadbalancer-controller");
const helm_addon_1 = require("../helm-addon");
const efs = require("aws-cdk-lib/aws-efs");
const ec2 = require("aws-cdk-lib/aws-ec2");
const semver = require("semver");
const ebs_csi_driver_1 = require("../ebs-csi-driver");
const efs_csi_driver_1 = require("../efs-csi-driver");
/**
 * Configuration options for exposing the JupyterHub proxy
 */
var JupyterHubServiceType;
(function (JupyterHubServiceType) {
    /**
     * Expose the service using AWS Application Load Balancer + Ingress controller
     */
    JupyterHubServiceType[JupyterHubServiceType["ALB"] = 0] = "ALB";
    /**
     * Expose the service using AWS Network Load Balancer + LoadBalancer service
     */
    JupyterHubServiceType[JupyterHubServiceType["NLB"] = 1] = "NLB";
    /**
     * Use ClusterIP service type and allow customers to port-forward for localhost access
     */
    JupyterHubServiceType[JupyterHubServiceType["CLUSTERIP"] = 2] = "CLUSTERIP";
})(JupyterHubServiceType || (exports.JupyterHubServiceType = JupyterHubServiceType = {}));
const JUPYTERHUB = 'jupyterhub';
const RELEASE = 'blueprints-addon-jupyterhub';
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: JUPYTERHUB,
    namespace: JUPYTERHUB,
    version: '2.0.0',
    chart: JUPYTERHUB,
    release: RELEASE,
    repository: 'https://hub.jupyter.org/helm-chart/',
    values: {}
};
/**
 * Implementation of the JupyterHub add-on
 */
let JupyterHubAddOn = class JupyterHubAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = this.options.values ?? {};
        // The addon requires a persistent storage option
        assert(this.options.ebsConfig || this.options.efsConfig, "You need to provide a persistent storage option.");
        // But you can only provide one option for persistent storage
        assert(!(this.options.ebsConfig && this.options.efsConfig), "You cannot provide more than one persistent storage option.");
        // Create Namespace
        const ns = (0, utils_1.createNamespace)(this.options.namespace, cluster, true, true);
        // User Environment setup
        let cmd;
        if (semver.lt(this.options.version, '2.0.0')) {
            cmd = ["start-singleuser.sh"];
        }
        else {
            cmd = ["jupyterhub-singleuser", "--allow-root"];
        }
        const notebook = this.options.notebookStack || 'jupyter/base-notebook';
        (0, utils_1.setPath)(values, "singleuser", {
            "image": {
                "name": `${notebook}`,
                "tag": "latest"
            },
            "extraEnv": { "CHOWN_HOME": "yes" },
            "uid": 0,
            "fsGid": 0,
            "cmd": cmd
        });
        // Persistent Storage Setup for EBS
        if (this.options.ebsConfig) {
            this.addEbsStorage(clusterInfo, values, this.options.ebsConfig);
        }
        // Persistent Storage Setup for EFS
        if (this.options.efsConfig) {
            this.addEfsStorage(clusterInfo, values, this.options.efsConfig);
        }
        // OpenID Connect authentication setup
        if (this.options.oidcConfig) {
            (0, utils_1.setPath)(values, "hub.config", {
                "JupyterHub": { "authenticator_class": "generic-oauth" },
                "GenericOAuthenticator": {
                    "client_id": this.options.oidcConfig.clientId,
                    "client_secret": this.options.oidcConfig.clientSecret,
                    "oauth_callback_url": this.options.oidcConfig.callbackUrl,
                    "authorize_url": this.options.oidcConfig.authUrl,
                    "token_url": this.options.oidcConfig.tokenUrl,
                    "userdata_url": this.options.oidcConfig.userDataUrl,
                    "scope": this.options.oidcConfig.scope,
                    "username_key": this.options.oidcConfig.usernameKey,
                }
            });
        }
        // Proxy information - set either ALB, NLB (default) or ClusterIP service based on 
        // provided configuration
        const serviceType = this.options.serviceType;
        const ingressHosts = this.options.ingressHosts || [];
        const ingressAnnotations = this.options.ingressAnnotations;
        const cert = this.options.certificateResourceName;
        const albAddOnCheck = clusterInfo.getScheduledAddOn(aws_loadbalancer_controller_1.AwsLoadBalancerControllerAddOn.name);
        // Use Ingress and AWS ALB
        if (serviceType == JupyterHubServiceType.ALB) {
            assert(albAddOnCheck, `Missing a dependency: ${aws_loadbalancer_controller_1.AwsLoadBalancerControllerAddOn.name}. Please add it to your list of addons.`);
            const presetAnnotations = {
                'alb.ingress.kubernetes.io/scheme': 'internet-facing',
                'alb.ingress.kubernetes.io/target-type': 'ip',
                'kubernetes.io/ingress.class': 'alb',
            };
            if (cert) {
                presetAnnotations['alb.ingress.kubernetes.io/ssl-redirect'] = '443';
                presetAnnotations['alb.ingress.kubernetes.io/listen-ports'] = '[{"HTTP": 80},{"HTTPS":443}]';
                const certificate = clusterInfo.getResource(cert);
                presetAnnotations['alb.ingress.kubernetes.io/certificate-arn'] = certificate?.certificateArn;
            }
            const annotations = { ...ingressAnnotations, ...presetAnnotations };
            (0, utils_1.setPath)(values, "ingress.annotations", annotations);
            (0, utils_1.setPath)(values, "ingress.hosts", ingressHosts);
            (0, utils_1.setPath)(values, "ingress.enabled", true);
            (0, utils_1.setPath)(values, "proxy.service", { "type": "ClusterIP" });
        }
        else {
            assert(!ingressHosts || ingressHosts.length == 0, 'Ingress Hosts CANNOT be assigned when ingress is disabled');
            assert(!ingressAnnotations, 'Ingress annotations CANNOT be assigned when ingress is disabled');
            assert(!cert, 'Cert option is only supported if ingress is enabled.');
            // If we set SVC, set the proxy service type to ClusterIP and allow users to port-forward to localhost
            if (serviceType == JupyterHubServiceType.CLUSTERIP) {
                (0, utils_1.setPath)(values, "proxy.service", { "type": "ClusterIP" });
                // We will use NLB 
            }
            else {
                assert(albAddOnCheck, `Missing a dependency: ${aws_loadbalancer_controller_1.AwsLoadBalancerControllerAddOn.name}. Please add it to your list of addons.`);
                (0, utils_1.setPath)(values, "proxy.service", {
                    "annotations": {
                        "service.beta.kubernetes.io/aws-load-balancer-type": "nlb",
                        "service.beta.kubernetes.io/aws-load-balancer-scheme": "internet-facing",
                        "service.beta.kubernetes.io/aws-load-balancer-nlb-target-type": "ip",
                    }
                });
            }
        }
        // Create Helm Chart
        const jupyterHubChart = this.addHelmChart(clusterInfo, values, false, false);
        // Add dependency
        jupyterHubChart.node.addDependency(ns);
        if (albAddOnCheck) {
            albAddOnCheck.then(construct => jupyterHubChart.node.addDependency(construct));
        }
        return Promise.resolve(jupyterHubChart);
    }
    /**
     * This is a helper function to create EBS persistent storage
     * @param {ClusterInfo} clusterInfo - Cluster Info
     * @param {string} values - Helm Chart Values
     * @param {string} ebsConfig - EBS Configurations supplied by user
     * @returns
     */
    addEbsStorage(clusterInfo, values, ebsConfig) {
        const dep = clusterInfo.getScheduledAddOn(ebs_csi_driver_1.EbsCsiDriverAddOn.name);
        assert(dep, `Missing a dependency: ${ebs_csi_driver_1.EbsCsiDriverAddOn.name}. Please add it to your list of addons.`);
        // Create persistent storage with EBS
        const storageClass = ebsConfig.storageClass;
        const ebsCapacity = ebsConfig.capacity;
        (0, utils_1.setPath)(values, "singleuser.storage", {
            "dynamic": { "storageClass": storageClass },
            "capacity": ebsCapacity
        });
    }
    /**
     * This is a helper function to create EFS persistent storage
     * @param {ClusterInfo} clusterInfo - Cluster Info
     * @param {string} values - Helm Chart Values
     * @param {string} efsConfig - EFS Configurations supplied by user
     * @returns
     */
    addEfsStorage(clusterInfo, values, efsConfig) {
        const dep = clusterInfo.getScheduledAddOn(efs_csi_driver_1.EfsCsiDriverAddOn.name);
        assert(dep, `Missing a dependency: ${efs_csi_driver_1.EfsCsiDriverAddOn.name}. Please add it to your list of addons.`);
        const pvcName = efsConfig.pvcName;
        const removalPolicy = efsConfig.removalPolicy;
        const efsCapacity = efsConfig.capacity;
        this.setupEFS(clusterInfo, this.options.namespace, pvcName, efsCapacity, removalPolicy);
        (0, utils_1.setPath)(values, "singleuser.storage", {
            "type": "static",
            "static": {
                "pvcName": `${pvcName}`,
                "subPath": "home/{username}"
            }
        });
    }
    /**
     * This is a helper function to use EFS as persistent storage
     * including necessary security group with ingress rule,
     * EFS File System, Kubernetes PV and PVC
     * @param {ClusterInfo} clusterInfo - Cluster Info
     * @param {string} namespace - Namespace
     * @param {string} pvcName - Name of the PV and PVC
     * @param {RemovalPolicy}removalPolicy - Removal Policy for EFS File System (RETAIN, DESTROY or SNAPSHOT)
     * @returns
     * */
    setupEFS(clusterInfo, namespace, pvcName, capacity, removalPolicy) {
        const cluster = clusterInfo.cluster;
        const clusterVpcCidr = clusterInfo.cluster.vpc.vpcCidrBlock;
        // Security Group required for access to the File System
        // With the right ingress rule
        const jupyterHubSG = new ec2.SecurityGroup(cluster.stack, 'MyEfsSecurityGroup', {
            vpc: clusterInfo.cluster.vpc,
            securityGroupName: "EksBlueprintsJHubEFSSG",
        });
        jupyterHubSG.addIngressRule(ec2.Peer.ipv4(clusterVpcCidr), new ec2.Port({
            protocol: ec2.Protocol.TCP,
            stringRepresentation: "EFSconnection",
            toPort: 2049,
            fromPort: 2049,
        }));
        // Create the EFS File System
        const jupyterHubFileSystem = new efs.FileSystem(cluster.stack, 'MyEfsFileSystem', {
            vpc: clusterInfo.cluster.vpc,
            securityGroup: jupyterHubSG,
            removalPolicy: removalPolicy,
        });
        const efsId = jupyterHubFileSystem.fileSystemId;
        // Create StorageClass
        const efsSC = cluster.addManifest('efs-storage-class', {
            apiVersion: 'storage.k8s.io/v1',
            kind: 'StorageClass',
            metadata: {
                name: 'efs-sc',
            },
            provisioner: 'efs.csi.aws.com',
        });
        // Setup PersistentVolume and PersistentVolumeClaim
        const efsPV = cluster.addManifest('efs-pv', {
            apiVersion: 'v1',
            kind: 'PersistentVolume',
            metadata: {
                name: `${pvcName}`,
                namespace: namespace
            },
            spec: {
                capacity: { storage: `${capacity}` },
                volumeMode: 'Filesystem',
                accessModes: ['ReadWriteMany'],
                storageClassName: 'efs-sc',
                csi: {
                    driver: 'efs.csi.aws.com',
                    volumeHandle: `${efsId}`,
                }
            },
        });
        efsPV.node.addDependency(efsSC);
        efsPV.node.addDependency(jupyterHubFileSystem);
        const efsPVC = cluster.addManifest('efs-pvc', {
            apiVersion: 'v1',
            kind: 'PersistentVolumeClaim',
            metadata: {
                name: `${pvcName}`,
                namespace: namespace
            },
            spec: {
                storageClassName: 'efs-sc',
                accessModes: ['ReadWriteMany'],
                resources: { requests: { storage: `${capacity}` } },
            },
        });
        efsPVC.node.addDependency(efsPV);
    }
};
exports.JupyterHubAddOn = JupyterHubAddOn;
exports.JupyterHubAddOn = JupyterHubAddOn = __decorate([
    utils_1.supportsALL
], JupyterHubAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2p1cHl0ZXJodWIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaUNBQWlDO0FBR2pDLHVDQUFvRTtBQUNwRSxnRkFBZ0Y7QUFDaEYsOENBQThFO0FBRzlFLDJDQUEyQztBQUMzQywyQ0FBMkM7QUFHM0MsaUNBQWlDO0FBQ2pDLHNEQUFzRDtBQUN0RCxzREFBc0Q7QUFFdEQ7O0dBRUc7QUFDSCxJQUFZLHFCQWVYO0FBZkQsV0FBWSxxQkFBcUI7SUFDN0I7O09BRUc7SUFDSCwrREFBRyxDQUFBO0lBRUg7O09BRUc7SUFDSCwrREFBRyxDQUFBO0lBRUg7O09BRUc7SUFDSCwyRUFBUyxDQUFBO0FBQ2IsQ0FBQyxFQWZXLHFCQUFxQixxQ0FBckIscUJBQXFCLFFBZWhDO0FBMkVELE1BQU0sVUFBVSxHQUFHLFlBQVksQ0FBQztBQUNoQyxNQUFNLE9BQU8sR0FBRyw2QkFBNkIsQ0FBQztBQUU5Qzs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUFtQjtJQUNqQyxJQUFJLEVBQUUsVUFBVTtJQUNoQixTQUFTLEVBQUUsVUFBVTtJQUNyQixPQUFPLEVBQUUsT0FBTztJQUNoQixLQUFLLEVBQUUsVUFBVTtJQUNqQixPQUFPLEVBQUUsT0FBTztJQUNoQixVQUFVLEVBQUUscUNBQXFDO0lBQ2pELE1BQU0sRUFBRSxFQUFFO0NBQ2IsQ0FBQztBQUVGOztHQUVHO0FBRUksSUFBTSxlQUFlLEdBQXJCLE1BQU0sZUFBZ0IsU0FBUSxzQkFBUztJQUVqQyxPQUFPLENBQXVCO0lBRXZDLFlBQVksS0FBNEI7UUFDcEMsS0FBSyxDQUFDLEVBQUMsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBQ25DLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQTZCLENBQUM7SUFDdEQsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3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MUIsR0FBRyxFQUFFO29CQUNELE1BQU0sRUFBRSxpQkFBaUI7b0JBQ3pCLFlBQVksRUFBRSxHQUFHLEtBQUssRUFBRTtpQkFDM0I7YUFDSjtTQUNKLENBQUMsQ0FBQztRQUNILEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLENBQUM7UUFFL0MsTUFBTSxNQUFNLEdBQUcsT0FBTyxDQUFDLFdBQVcsQ0FBQyxTQUFTLEVBQUU7WUFDMUMsVUFBVSxFQUFFLElBQUk7WUFDaEIsSUFBSSxFQUFFLHVCQUF1QjtZQUM3QixRQUFRLEVBQUU7Z0JBQ04sSUFBSSxFQUFFLEdBQUcsT0FBTyxFQUFFO2dCQUNsQixTQUFTLEVBQUUsU0FBUzthQUN2QjtZQUNELElBQUksRUFBRTtnQkFDRixnQkFBZ0IsRUFBRSxRQUFRO2dCQUMxQixXQUFXLEVBQUUsQ0FBRSxlQUFlLENBQUU7Z0JBQ2hDLFNBQVMsRUFBRSxFQUFFLFFBQVEsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLFFBQVEsRUFBRSxFQUFFLEVBQUU7YUFDdEQ7U0FDSixDQUFDLENBQUM7UUFDSCxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLENBQUMsQ0FBQztJQUNyQyxDQUFDO0NBQ0osQ0FBQTtBQXBRWSwwQ0FBZTswQkFBZixlQUFlO0lBRDNCLG1CQUFXO0dBQ0MsZUFBZSxDQW9RM0IiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSBcImFzc2VydFwiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbyB9IGZyb20gJy4uLy4uL3NwaSc7XHJcbmltcG9ydCB7IGNyZWF0ZU5hbWVzcGFjZSwgc2V0UGF0aCwgc3VwcG9ydHNBTEwgfSBmcm9tICcuLi8uLi91dGlscyc7XHJcbmltcG9ydCB7IEF3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXJBZGRPbiB9IGZyb20gXCIuLi9hd3MtbG9hZGJhbGFuY2VyLWNvbnRyb2xsZXJcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Qcm9wcywgSGVsbUFkZE9uVXNlclByb3BzIH0gZnJvbSAnLi4vaGVsbS1hZGRvbic7XHJcblxyXG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xyXG5pbXBvcnQgKiBhcyBlZnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVmcyc7XHJcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcclxuaW1wb3J0IHsgSUNlcnRpZmljYXRlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNlcnRpZmljYXRlbWFuYWdlcic7XHJcblxyXG5pbXBvcnQgKiBhcyBzZW12ZXIgZnJvbSAnc2VtdmVyJztcclxuaW1wb3J0IHsgRWJzQ3NpRHJpdmVyQWRkT24gfSBmcm9tIFwiLi4vZWJzLWNzaS1kcml2ZXJcIjtcclxuaW1wb3J0IHsgRWZzQ3NpRHJpdmVyQWRkT24gfSBmcm9tIFwiLi4vZWZzLWNzaS1kcml2ZXJcIjtcclxuXHJcbi8qKlxyXG4gKiBDb25maWd1cmF0aW9uIG9wdGlvbnMgZm9yIGV4cG9zaW5nIHRoZSBKdXB5dGVySHViIHByb3h5XHJcbiAqL1xyXG5leHBvcnQgZW51bSBKdXB5dGVySHViU2VydmljZVR5cGUge1xyXG4gICAgLyoqXHJcbiAgICAgKiBFeHBvc2UgdGhlIHNlcnZpY2UgdXNpbmcgQVdTIEFwcGxpY2F0aW9uIExvYWQgQmFsYW5jZXIgKyBJbmdyZXNzIGNvbnRyb2xsZXJcclxuICAgICAqL1xyXG4gICAgQUxCLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogRXhwb3NlIHRoZSBzZXJ2aWNlIHVzaW5nIEFXUyBOZXR3b3JrIExvYWQgQmFsYW5jZXIgKyBMb2FkQmFsYW5jZXIgc2VydmljZVxyXG4gICAgICovXHJcbiAgICBOTEIsXHJcbiAgICBcclxuICAgIC8qKlxyXG4gICAgICogVXNlIENsdXN0ZXJJUCBzZXJ2aWNlIHR5cGUgYW5kIGFsbG93IGN1c3RvbWVycyB0byBwb3J0LWZvcndhcmQgZm9yIGxvY2FsaG9zdCBhY2Nlc3NcclxuICAgICAqL1xyXG4gICAgQ0xVU1RFUklQLFxyXG59XHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgYWRkLW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBKdXB5dGVySHViQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDb25maWd1cmF0aW9ucyBuZWNlc3NhcnkgdG8gdXNlIEVCUyBhcyBQZXJzaXN0ZW50IFZvbHVtZVxyXG4gICAgICogQHByb3BlcnR5IHtzdHJpbmd9IHN0b3JhZ2VDbGFzcyAtIHN0b3JhZ2UgY2xhc3MgZm9yIHRoZSB2b2x1bWVcclxuICAgICAqIEBwcm9wZXJ0eSB7c3RyaW5nfSBjYXBhY2l0eSAtIHN0b3JhZ2UgY2FwYWNpdHkgKGluIE1pIG9yIEdpKVxyXG4gICAgICovXHJcbiAgICBlYnNDb25maWc/OiB7XHJcbiAgICAgICAgc3RvcmFnZUNsYXNzOiBzdHJpbmcsXHJcbiAgICAgICAgY2FwYWNpdHk6IHN0cmluZyxcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENvbmZpZ3VyYXRpb24gbmVjZXNzYXJ5IHRvIHVzZSBFRlMgYXMgUGVyc2lzdGVudCBWb2x1bWVcclxuICAgICAqIEBwcm9wZXJ0eSB7Y2RrLlJlbW92YWxQb2xpY3l9IHJlbW92YWxQb2xpY3kgLSBSZW1vdmFsIFBvbGljeSBmb3IgRUZTIChERVNUUk9ZLCBSRVRBSU4gb3IgU05BUFNIT1QpXHJcbiAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gcHZjTmFtZSAtIE5hbWUgb2YgdGhlIFZvbHVtZSB0byBiZSB1c2VkIGZvciBQViBhbmQgUFZDXHJcbiAgICAgKiBAcHJvcGVydHkge3N0cmluZ30gY2FwYWNpdHkgLSBTdG9yYWdlIENhcGFjaXR5IChpbiBNaSBvciBHaSlcclxuICAgICAqL1xyXG4gICAgZWZzQ29uZmlnPzoge1xyXG4gICAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LFxyXG4gICAgICAgIHB2Y05hbWU6IHN0cmluZyxcclxuICAgICAgICBjYXBhY2l0eTogc3RyaW5nLFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uZmlndXJhdGlvbiBzZXR0aW5ncyBmb3IgT3BlbklEIENvbm5lY3QgYXV0aGVudGljYXRpb24gcHJvdG9jb2xcclxuICAgICAqL1xyXG4gICAgb2lkY0NvbmZpZz86IHtcclxuICAgICAgICBjYWxsYmFja1VybDogc3RyaW5nLFxyXG4gICAgICAgIGF1dGhVcmw6IHN0cmluZyxcclxuICAgICAgICB0b2tlblVybDogc3RyaW5nLFxyXG4gICAgICAgIHVzZXJEYXRhVXJsOiBzdHJpbmcsXHJcbiAgICAgICAgY2xpZW50SWQ6IHN0cmluZyxcclxuICAgICAgICBjbGllbnRTZWNyZXQ6IHN0cmluZyxcclxuICAgICAgICBzY29wZT86IHN0cmluZ1tdLFxyXG4gICAgICAgIHVzZXJuYW1lS2V5Pzogc3RyaW5nLFxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQ29uZmlndXJhdGlvbiB0byBzZXQgaG93IHRoZSBodWIgc2VydmljZSB3aWxsIGJlIGV4cG9zZWRcclxuICAgICAqIFNlZSBlbnVtIGp1cHl0ZXJIdWJTZXJ2aWNlIGZvciBjaG9pY2VzXHJcbiAgICAgKi9cclxuICAgIHNlcnZpY2VUeXBlOiBKdXB5dGVySHViU2VydmljZVR5cGUsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbmdyZXNzIGhvc3QgLSBvbmx5IGlmIEluZ3Jlc3MgaXMgZW5hYmxlZFxyXG4gICAgICogSXQgaXMgYSBsaXN0IG9mIGF2YWlsYWJsZSBob3N0cyB0byBiZSByb3V0ZWQgdXBvbiByZXF1ZXN0XHJcbiAgICAgKi9cclxuICAgIGluZ3Jlc3NIb3N0cz86IHN0cmluZ1tdLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSW5ncmVzcyBhbm5vdGF0aW9ucyAtIG9ubHkgYXBwbHkgaWYgSW5ncmVzcyBpcyBlbmFibGVkLCBvdGhlcndpc2UgdGhyb3dzIGFuIGVycm9yXHJcbiAgICAgKi9cclxuICAgIGluZ3Jlc3NBbm5vdGF0aW9ucz86IHtcclxuICAgICAgICBba2V5OiBzdHJpbmddOiBzdHJpbmdcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIE5vdGVib29rIHN0YWNrIGFzIGRlZmluZWQgdXNpbmcgRG9ja2VyIFN0YWNrcyBmb3IgSnVweXRlciBoZXJlOlxyXG4gICAgICogaHR0cHM6Ly9qdXB5dGVyLWRvY2tlci1zdGFja3MucmVhZHRoZWRvY3MuaW8vZW4vbGF0ZXN0L3VzaW5nL3NlbGVjdGluZy5odG1sI2NvcmUtc3RhY2tzXHJcbiAgICAgKi9cclxuICAgIG5vdGVib29rU3RhY2s/OiBzdHJpbmcsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lIG9mIHRoZSBjZXJ0aWZpY2F0ZSB7QGxpbmsgTmFtZWRSZXNvdXJjZVByb3ZpZGVyfSB0byBiZSB1c2VkIGZvciBjZXJ0aWZpY2F0ZSBsb29rIHVwLiBcclxuICAgICAqIEBzZWUge0BsaW5rIEltcG9ydENlcnRpZmljYXRlUHJvdmlkZXJ9IGFuZCB7QGxpbmsgQ3JlYXRlQ2VydGlmaWNhdGVQcm92aWRlcn0gZm9yIGV4YW1wbGVzIG9mIGNlcnRpZmljYXRlIHByb3ZpZGVycy5cclxuICAgICAqL1xyXG4gICAgY2VydGlmaWNhdGVSZXNvdXJjZU5hbWU/OiBzdHJpbmcsXHJcbn1cclxuXHJcbmNvbnN0IEpVUFlURVJIVUIgPSAnanVweXRlcmh1Yic7XHJcbmNvbnN0IFJFTEVBU0UgPSAnYmx1ZXByaW50cy1hZGRvbi1qdXB5dGVyaHViJztcclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0cyBvcHRpb25zIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHM6IEhlbG1BZGRPblByb3BzID0ge1xyXG4gICAgbmFtZTogSlVQWVRFUkhVQixcclxuICAgIG5hbWVzcGFjZTogSlVQWVRFUkhVQixcclxuICAgIHZlcnNpb246ICcyLjAuMCcsXHJcbiAgICBjaGFydDogSlVQWVRFUkhVQixcclxuICAgIHJlbGVhc2U6IFJFTEVBU0UsXHJcbiAgICByZXBvc2l0b3J5OiAnaHR0cHM6Ly9odWIuanVweXRlci5vcmcvaGVsbS1jaGFydC8nLFxyXG4gICAgdmFsdWVzOiB7fVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBKdXB5dGVySHViIGFkZC1vblxyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBKdXB5dGVySHViQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICAgIHJlYWRvbmx5IG9wdGlvbnM6IEp1cHl0ZXJIdWJBZGRPblByb3BzO1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByb3BzPzogSnVweXRlckh1YkFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7Li4uZGVmYXVsdFByb3BzLCAuLi5wcm9wc30pO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgSnVweXRlckh1YkFkZE9uUHJvcHM7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG4gICAgICAgIGxldCB2YWx1ZXMgPSB0aGlzLm9wdGlvbnMudmFsdWVzID8/IHt9O1xyXG5cclxuICAgICAgICAvLyBUaGUgYWRkb24gcmVxdWlyZXMgYSBwZXJzaXN0ZW50IHN0b3JhZ2Ugb3B0aW9uXHJcbiAgICAgICAgYXNzZXJ0KHRoaXMub3B0aW9ucy5lYnNDb25maWcgfHwgdGhpcy5vcHRpb25zLmVmc0NvbmZpZywgXCJZb3UgbmVlZCB0byBwcm92aWRlIGEgcGVyc2lzdGVudCBzdG9yYWdlIG9wdGlvbi5cIik7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gQnV0IHlvdSBjYW4gb25seSBwcm92aWRlIG9uZSBvcHRpb24gZm9yIHBlcnNpc3RlbnQgc3RvcmFnZVxyXG4gICAgICAgIGFzc2VydCghKHRoaXMub3B0aW9ucy5lYnNDb25maWcgJiYgdGhpcy5vcHRpb25zLmVmc0NvbmZpZyksIFwiWW91IGNhbm5vdCBwcm92aWRlIG1vcmUgdGhhbiBvbmUgcGVyc2lzdGVudCBzdG9yYWdlIG9wdGlvbi5cIik7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBOYW1lc3BhY2VcclxuICAgICAgICBjb25zdCBucyA9IGNyZWF0ZU5hbWVzcGFjZSh0aGlzLm9wdGlvbnMubmFtZXNwYWNlISwgY2x1c3RlciwgdHJ1ZSwgdHJ1ZSk7XHJcbiAgICAgICAgXHJcbiAgICAgICAgLy8gVXNlciBFbnZpcm9ubWVudCBzZXR1cFxyXG4gICAgICAgIGxldCBjbWQ7XHJcbiAgICAgICAgaWYgKHNlbXZlci5sdCh0aGlzLm9wdGlvbnMudmVyc2lvbiEsICcyLjAuMCcpKXtcclxuICAgICAgICAgICAgY21kID0gW1wic3RhcnQtc2luZ2xldXNlci5zaFwiXTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBjbWQgPSBbXCJqdXB5dGVyaHViLXNpbmdsZXVzZXJcIixcIi0tYWxsb3ctcm9vdFwiXTtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3Qgbm90ZWJvb2sgPSB0aGlzLm9wdGlvbnMubm90ZWJvb2tTdGFjayB8fCAnanVweXRlci9iYXNlLW5vdGVib29rJztcclxuICAgICAgICBzZXRQYXRoKHZhbHVlcywgXCJzaW5nbGV1c2VyXCIsIHtcclxuICAgICAgICAgICAgXCJpbWFnZVwiOntcclxuICAgICAgICAgICAgICAgIFwibmFtZVwiOiBgJHtub3RlYm9va31gLFxyXG4gICAgICAgICAgICAgICAgXCJ0YWdcIjogXCJsYXRlc3RcIiBcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgXCJleHRyYUVudlwiOiB7IFwiQ0hPV05fSE9NRVwiOiBcInllc1wiIH0sXHJcbiAgICAgICAgICAgIFwidWlkXCI6IDAsXHJcbiAgICAgICAgICAgIFwiZnNHaWRcIjogMCxcclxuICAgICAgICAgICAgXCJjbWRcIjogY21kXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIFBlcnNpc3RlbnQgU3RvcmFnZSBTZXR1cCBmb3IgRUJTXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5lYnNDb25maWcpe1xyXG4gICAgICAgICAgICB0aGlzLmFkZEVic1N0b3JhZ2UoY2x1c3RlckluZm8sIHZhbHVlcywgdGhpcy5vcHRpb25zLmVic0NvbmZpZyk7XHJcbiAgICAgICAgfSBcclxuICAgICAgICBcclxuICAgICAgICAvLyBQZXJzaXN0ZW50IFN0b3JhZ2UgU2V0dXAgZm9yIEVGU1xyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZWZzQ29uZmlnKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYWRkRWZzU3RvcmFnZShjbHVzdGVySW5mbywgdmFsdWVzLCB0aGlzLm9wdGlvbnMuZWZzQ29uZmlnKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE9wZW5JRCBDb25uZWN0IGF1dGhlbnRpY2F0aW9uIHNldHVwXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5vaWRjQ29uZmlnKXtcclxuICAgICAgICAgICAgc2V0UGF0aCh2YWx1ZXMsIFwiaHViLmNvbmZpZ1wiLCB7XHJcbiAgICAgICAgICAgICAgICBcIkp1cHl0ZXJIdWJcIjogeyBcImF1dGhlbnRpY2F0b3JfY2xhc3NcIjogXCJnZW5lcmljLW9hdXRoXCIgfSwgXHJcbiAgICAgICAgICAgICAgICBcIkdlbmVyaWNPQXV0aGVudGljYXRvclwiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJjbGllbnRfaWRcIjogdGhpcy5vcHRpb25zLm9pZGNDb25maWcuY2xpZW50SWQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJjbGllbnRfc2VjcmV0XCI6IHRoaXMub3B0aW9ucy5vaWRjQ29uZmlnLmNsaWVudFNlY3JldCxcclxuICAgICAgICAgICAgICAgICAgICBcIm9hdXRoX2NhbGxiYWNrX3VybFwiOiB0aGlzLm9wdGlvbnMub2lkY0NvbmZpZy5jYWxsYmFja1VybCxcclxuICAgICAgICAgICAgICAgICAgICBcImF1dGhvcml6ZV91cmxcIjogdGhpcy5vcHRpb25zLm9pZGNDb25maWcuYXV0aFVybCxcclxuICAgICAgICAgICAgICAgICAgICBcInRva2VuX3VybFwiOiB0aGlzLm9wdGlvbnMub2lkY0NvbmZpZy50b2tlblVybCxcclxuICAgICAgICAgICAgICAgICAgICBcInVzZXJkYXRhX3VybFwiOiB0aGlzLm9wdGlvbnMub2lkY0NvbmZpZy51c2VyRGF0YVVybCxcclxuICAgICAgICAgICAgICAgICAgICBcInNjb3BlXCI6ICB0aGlzLm9wdGlvbnMub2lkY0NvbmZpZy5zY29wZSxcclxuICAgICAgICAgICAgICAgICAgICBcInVzZXJuYW1lX2tleVwiOiAgdGhpcy5vcHRpb25zLm9pZGNDb25maWcudXNlcm5hbWVLZXksXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gUHJveHkgaW5mb3JtYXRpb24gLSBzZXQgZWl0aGVyIEFMQiwgTkxCIChkZWZhdWx0KSBvciBDbHVzdGVySVAgc2VydmljZSBiYXNlZCBvbiBcclxuICAgICAgICAvLyBwcm92aWRlZCBjb25maWd1cmF0aW9uXHJcbiAgICAgICAgY29uc3Qgc2VydmljZVR5cGUgPSB0aGlzLm9wdGlvbnMuc2VydmljZVR5cGU7XHJcbiAgICAgICAgY29uc3QgaW5ncmVzc0hvc3RzID0gdGhpcy5vcHRpb25zLmluZ3Jlc3NIb3N0cyB8fCBbXTtcclxuICAgICAgICBjb25zdCBpbmdyZXNzQW5ub3RhdGlvbnMgPSB0aGlzLm9wdGlvbnMuaW5ncmVzc0Fubm90YXRpb25zO1xyXG4gICAgICAgIGNvbnN0IGNlcnQgPSB0aGlzLm9wdGlvbnMuY2VydGlmaWNhdGVSZXNvdXJjZU5hbWU7XHJcblxyXG4gICAgICAgIGNvbnN0IGFsYkFkZE9uQ2hlY2sgPSBjbHVzdGVySW5mby5nZXRTY2hlZHVsZWRBZGRPbihBd3NMb2FkQmFsYW5jZXJDb250cm9sbGVyQWRkT24ubmFtZSk7XHJcbiAgICAgICAgLy8gVXNlIEluZ3Jlc3MgYW5kIEFXUyBBTEJcclxuICAgICAgICBpZiAoc2VydmljZVR5cGUgPT0gSnVweXRlckh1YlNlcnZpY2VUeXBlLkFMQil7XHJcbiAgICAgICAgICAgIGFzc2VydChhbGJBZGRPbkNoZWNrLCBgTWlzc2luZyBhIGRlcGVuZGVuY3k6ICR7QXdzTG9hZEJhbGFuY2VyQ29udHJvbGxlckFkZE9uLm5hbWV9LiBQbGVhc2UgYWRkIGl0IHRvIHlvdXIgbGlzdCBvZiBhZGRvbnMuYCk7IFxyXG4gICAgICAgICAgICBjb25zdCBwcmVzZXRBbm5vdGF0aW9uczogYW55ID0ge1xyXG4gICAgICAgICAgICAgICAgJ2FsYi5pbmdyZXNzLmt1YmVybmV0ZXMuaW8vc2NoZW1lJzogJ2ludGVybmV0LWZhY2luZycsXHJcbiAgICAgICAgICAgICAgICAnYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby90YXJnZXQtdHlwZSc6ICdpcCcsXHJcbiAgICAgICAgICAgICAgICAna3ViZXJuZXRlcy5pby9pbmdyZXNzLmNsYXNzJzogJ2FsYicsXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgIGlmIChjZXJ0KXtcclxuICAgICAgICAgICAgICAgIHByZXNldEFubm90YXRpb25zWydhbGIuaW5ncmVzcy5rdWJlcm5ldGVzLmlvL3NzbC1yZWRpcmVjdCddID0gJzQ0Myc7XHJcbiAgICAgICAgICAgICAgICBwcmVzZXRBbm5vdGF0aW9uc1snYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9saXN0ZW4tcG9ydHMnXSA9ICdbe1wiSFRUUFwiOiA4MH0se1wiSFRUUFNcIjo0NDN9XSc7XHJcbiAgICAgICAgICAgICAgICBjb25zdCBjZXJ0aWZpY2F0ZSA9IGNsdXN0ZXJJbmZvLmdldFJlc291cmNlPElDZXJ0aWZpY2F0ZT4oY2VydCk7XHJcbiAgICAgICAgICAgICAgICBwcmVzZXRBbm5vdGF0aW9uc1snYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9jZXJ0aWZpY2F0ZS1hcm4nXSA9IGNlcnRpZmljYXRlPy5jZXJ0aWZpY2F0ZUFybjtcclxuICAgICAgICAgICAgfSBcclxuICAgICAgICAgICAgY29uc3QgYW5ub3RhdGlvbnMgPSB7IC4uLmluZ3Jlc3NBbm5vdGF0aW9ucywgLi4ucHJlc2V0QW5ub3RhdGlvbnN9O1xyXG4gICAgICAgICAgICBzZXRQYXRoKHZhbHVlcywgXCJpbmdyZXNzLmFubm90YXRpb25zXCIsIGFubm90YXRpb25zKTtcclxuICAgICAgICAgICAgc2V0UGF0aCh2YWx1ZXMsIFwiaW5ncmVzcy5ob3N0c1wiLCBpbmdyZXNzSG9zdHMpO1xyXG4gICAgICAgICAgICBzZXRQYXRoKHZhbHVlcywgXCJpbmdyZXNzLmVuYWJsZWRcIiwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHNldFBhdGgodmFsdWVzLCBcInByb3h5LnNlcnZpY2VcIiwge1widHlwZVwiIDogXCJDbHVzdGVySVBcIn0pO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFzc2VydCghaW5ncmVzc0hvc3RzIHx8IGluZ3Jlc3NIb3N0cy5sZW5ndGggPT0gMCwgJ0luZ3Jlc3MgSG9zdHMgQ0FOTk9UIGJlIGFzc2lnbmVkIHdoZW4gaW5ncmVzcyBpcyBkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBhc3NlcnQoIWluZ3Jlc3NBbm5vdGF0aW9ucywgJ0luZ3Jlc3MgYW5ub3RhdGlvbnMgQ0FOTk9UIGJlIGFzc2lnbmVkIHdoZW4gaW5ncmVzcyBpcyBkaXNhYmxlZCcpO1xyXG4gICAgICAgICAgICBhc3NlcnQoIWNlcnQsICdDZXJ0IG9wdGlvbiBpcyBvbmx5IHN1cHBvcnRlZCBpZiBpbmdyZXNzIGlzIGVuYWJsZWQuJyk7XHJcbiAgICAgICAgICAgIC8vIElmIHdlIHNldCBTVkMsIHNldCB0aGUgcHJveHkgc2VydmljZSB0eXBlIHRvIENsdXN0ZXJJUCBhbmQgYWxsb3cgdXNlcnMgdG8gcG9ydC1mb3J3YXJkIHRvIGxvY2FsaG9zdFxyXG4gICAgICAgICAgICBpZiAoc2VydmljZVR5cGUgPT0gSnVweXRlckh1YlNlcnZpY2VUeXBlLkNMVVNURVJJUCl7XHJcbiAgICAgICAgICAgICAgICBzZXRQYXRoKHZhbHVlcywgXCJwcm94eS5zZXJ2aWNlXCIsIHtcInR5cGVcIjogXCJDbHVzdGVySVBcIn0pO1xyXG4gICAgICAgICAgICAvLyBXZSB3aWxsIHVzZSBOTEIgXHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBhc3NlcnQoYWxiQWRkT25DaGVjaywgYE1pc3NpbmcgYSBkZXBlbmRlbmN5OiAke0F3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXJBZGRPbi5uYW1lfS4gUGxlYXNlIGFkZCBpdCB0byB5b3VyIGxpc3Qgb2YgYWRkb25zLmApOyBcclxuICAgICAgICAgICAgICAgIHNldFBhdGgodmFsdWVzLCBcInByb3h5LnNlcnZpY2VcIiwgeyBcclxuICAgICAgICAgICAgICAgICAgICBcImFubm90YXRpb25zXCI6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCJzZXJ2aWNlLmJldGEua3ViZXJuZXRlcy5pby9hd3MtbG9hZC1iYWxhbmNlci10eXBlXCI6IFwibmxiXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VydmljZS5iZXRhLmt1YmVybmV0ZXMuaW8vYXdzLWxvYWQtYmFsYW5jZXItc2NoZW1lXCI6IFwiaW50ZXJuZXQtZmFjaW5nXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwic2VydmljZS5iZXRhLmt1YmVybmV0ZXMuaW8vYXdzLWxvYWQtYmFsYW5jZXItbmxiLXRhcmdldC10eXBlXCI6IFwiaXBcIixcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gQ3JlYXRlIEhlbG0gQ2hhcnRcclxuICAgICAgICBjb25zdCBqdXB5dGVySHViQ2hhcnQgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzLCBmYWxzZSwgZmFsc2UpO1xyXG5cclxuICAgICAgICAvLyBBZGQgZGVwZW5kZW5jeVxyXG4gICAgICAgIGp1cHl0ZXJIdWJDaGFydC5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG5cclxuICAgICAgICBpZihhbGJBZGRPbkNoZWNrKSB7XHJcbiAgICAgICAgICAgIGFsYkFkZE9uQ2hlY2sudGhlbihjb25zdHJ1Y3QgPT4ganVweXRlckh1YkNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShjb25zdHJ1Y3QpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShqdXB5dGVySHViQ2hhcnQpO1xyXG4gICAgfVxyXG4gICAgLyoqXHJcbiAgICAgKiBUaGlzIGlzIGEgaGVscGVyIGZ1bmN0aW9uIHRvIGNyZWF0ZSBFQlMgcGVyc2lzdGVudCBzdG9yYWdlXHJcbiAgICAgKiBAcGFyYW0ge0NsdXN0ZXJJbmZvfSBjbHVzdGVySW5mbyAtIENsdXN0ZXIgSW5mb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHZhbHVlcyAtIEhlbG0gQ2hhcnQgVmFsdWVzXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gZWJzQ29uZmlnIC0gRUJTIENvbmZpZ3VyYXRpb25zIHN1cHBsaWVkIGJ5IHVzZXJcclxuICAgICAqIEByZXR1cm5zXHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBhZGRFYnNTdG9yYWdlKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbywgdmFsdWVzOiBhbnksIGVic0NvbmZpZzogYW55KXtcclxuICAgICAgICBjb25zdCBkZXAgPSBjbHVzdGVySW5mby5nZXRTY2hlZHVsZWRBZGRPbihFYnNDc2lEcml2ZXJBZGRPbi5uYW1lKTtcclxuICAgICAgICBhc3NlcnQoZGVwLCBgTWlzc2luZyBhIGRlcGVuZGVuY3k6ICR7RWJzQ3NpRHJpdmVyQWRkT24ubmFtZX0uIFBsZWFzZSBhZGQgaXQgdG8geW91ciBsaXN0IG9mIGFkZG9ucy5gKTsgXHJcbiAgICAgICAgLy8gQ3JlYXRlIHBlcnNpc3RlbnQgc3RvcmFnZSB3aXRoIEVCU1xyXG4gICAgICAgIGNvbnN0IHN0b3JhZ2VDbGFzcyA9IGVic0NvbmZpZy5zdG9yYWdlQ2xhc3M7XHJcbiAgICAgICAgY29uc3QgZWJzQ2FwYWNpdHkgPSBlYnNDb25maWcuY2FwYWNpdHk7XHJcbiAgICAgICAgc2V0UGF0aCh2YWx1ZXMsIFwic2luZ2xldXNlci5zdG9yYWdlXCIsIHtcclxuICAgICAgICAgICAgXCJkeW5hbWljXCI6IHsgXCJzdG9yYWdlQ2xhc3NcIjogc3RvcmFnZUNsYXNzIH0sXHJcbiAgICAgICAgICAgIFwiY2FwYWNpdHlcIjogZWJzQ2FwYWNpdHlcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFRoaXMgaXMgYSBoZWxwZXIgZnVuY3Rpb24gdG8gY3JlYXRlIEVGUyBwZXJzaXN0ZW50IHN0b3JhZ2VcclxuICAgICAqIEBwYXJhbSB7Q2x1c3RlckluZm99IGNsdXN0ZXJJbmZvIC0gQ2x1c3RlciBJbmZvXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gdmFsdWVzIC0gSGVsbSBDaGFydCBWYWx1ZXNcclxuICAgICAqIEBwYXJhbSB7c3RyaW5nfSBlZnNDb25maWcgLSBFRlMgQ29uZmlndXJhdGlvbnMgc3VwcGxpZWQgYnkgdXNlclxyXG4gICAgICogQHJldHVybnNcclxuICAgICAqL1xyXG4gICAgcHJvdGVjdGVkIGFkZEVmc1N0b3JhZ2UoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCB2YWx1ZXM6IGFueSwgZWZzQ29uZmlnOiBhbnkpe1xyXG4gICAgICAgIGNvbnN0IGRlcCA9IGNsdXN0ZXJJbmZvLmdldFNjaGVkdWxlZEFkZE9uKEVmc0NzaURyaXZlckFkZE9uLm5hbWUpO1xyXG4gICAgICAgIGFzc2VydChkZXAsIGBNaXNzaW5nIGEgZGVwZW5kZW5jeTogJHtFZnNDc2lEcml2ZXJBZGRPbi5uYW1lfS4gUGxlYXNlIGFkZCBpdCB0byB5b3VyIGxpc3Qgb2YgYWRkb25zLmApOyBcclxuXHJcbiAgICAgICAgY29uc3QgcHZjTmFtZSA9IGVmc0NvbmZpZy5wdmNOYW1lO1xyXG4gICAgICAgIGNvbnN0IHJlbW92YWxQb2xpY3kgPSBlZnNDb25maWcucmVtb3ZhbFBvbGljeTtcclxuICAgICAgICBjb25zdCBlZnNDYXBhY2l0eSA9IGVmc0NvbmZpZy5jYXBhY2l0eTtcclxuXHJcbiAgICAgICAgdGhpcy5zZXR1cEVGUyhjbHVzdGVySW5mbywgdGhpcy5vcHRpb25zLm5hbWVzcGFjZSEsIHB2Y05hbWUsIGVmc0NhcGFjaXR5LCByZW1vdmFsUG9saWN5KTtcclxuICAgICAgICBzZXRQYXRoKHZhbHVlcywgXCJzaW5nbGV1c2VyLnN0b3JhZ2VcIiwge1xyXG4gICAgICAgICAgICBcInR5cGVcIjogXCJzdGF0aWNcIixcclxuICAgICAgICAgICAgXCJzdGF0aWNcIjoge1xyXG4gICAgICAgICAgICAgICAgXCJwdmNOYW1lXCI6IGAke3B2Y05hbWV9YCxcclxuICAgICAgICAgICAgICAgIFwic3ViUGF0aFwiOiBcImhvbWUve3VzZXJuYW1lfVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuICAgIC8qKlxyXG4gICAgICogVGhpcyBpcyBhIGhlbHBlciBmdW5jdGlvbiB0byB1c2UgRUZTIGFzIHBlcnNpc3RlbnQgc3RvcmFnZVxyXG4gICAgICogaW5jbHVkaW5nIG5lY2Vzc2FyeSBzZWN1cml0eSBncm91cCB3aXRoIGluZ3Jlc3MgcnVsZSxcclxuICAgICAqIEVGUyBGaWxlIFN5c3RlbSwgS3ViZXJuZXRlcyBQViBhbmQgUFZDXHJcbiAgICAgKiBAcGFyYW0ge0NsdXN0ZXJJbmZvfSBjbHVzdGVySW5mbyAtIENsdXN0ZXIgSW5mb1xyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IG5hbWVzcGFjZSAtIE5hbWVzcGFjZVxyXG4gICAgICogQHBhcmFtIHtzdHJpbmd9IHB2Y05hbWUgLSBOYW1lIG9mIHRoZSBQViBhbmQgUFZDXHJcbiAgICAgKiBAcGFyYW0ge1JlbW92YWxQb2xpY3l9cmVtb3ZhbFBvbGljeSAtIFJlbW92YWwgUG9saWN5IGZvciBFRlMgRmlsZSBTeXN0ZW0gKFJFVEFJTiwgREVTVFJPWSBvciBTTkFQU0hPVClcclxuICAgICAqIEByZXR1cm5zXHJcbiAgICAgKiAqL1xyXG4gICAgcHJvdGVjdGVkIHNldHVwRUZTKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbywgbmFtZXNwYWNlOiBzdHJpbmcsIHB2Y05hbWU6IHN0cmluZywgY2FwYWNpdHk6IHN0cmluZywgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kpe1xyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG4gICAgICAgIGNvbnN0IGNsdXN0ZXJWcGNDaWRyID0gY2x1c3RlckluZm8uY2x1c3Rlci52cGMudnBjQ2lkckJsb2NrO1xyXG5cclxuICAgICAgICAvLyBTZWN1cml0eSBHcm91cCByZXF1aXJlZCBmb3IgYWNjZXNzIHRvIHRoZSBGaWxlIFN5c3RlbVxyXG4gICAgICAgIC8vIFdpdGggdGhlIHJpZ2h0IGluZ3Jlc3MgcnVsZVxyXG4gICAgICAgIGNvbnN0IGp1cHl0ZXJIdWJTRyA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cChcclxuICAgICAgICAgICAgY2x1c3Rlci5zdGFjaywgJ015RWZzU2VjdXJpdHlHcm91cCcsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZwYzogY2x1c3RlckluZm8uY2x1c3Rlci52cGMsXHJcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwTmFtZTogXCJFa3NCbHVlcHJpbnRzSkh1YkVGU1NHXCIsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG4gICAgICAgIGp1cHl0ZXJIdWJTRy5hZGRJbmdyZXNzUnVsZShcclxuICAgICAgICAgICAgZWMyLlBlZXIuaXB2NChjbHVzdGVyVnBjQ2lkciksXHJcbiAgICAgICAgICAgIG5ldyBlYzIuUG9ydCh7XHJcbiAgICAgICAgICAgICAgICBwcm90b2NvbDogZWMyLlByb3RvY29sLlRDUCxcclxuICAgICAgICAgICAgICAgIHN0cmluZ1JlcHJlc2VudGF0aW9uOiBcIkVGU2Nvbm5lY3Rpb25cIixcclxuICAgICAgICAgICAgICAgIHRvUG9ydDogMjA0OSxcclxuICAgICAgICAgICAgICAgIGZyb21Qb3J0OiAyMDQ5LFxyXG4gICAgICAgICAgICB9KSxcclxuICAgICAgICApO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgdGhlIEVGUyBGaWxlIFN5c3RlbVxyXG4gICAgICAgIGNvbnN0IGp1cHl0ZXJIdWJGaWxlU3lzdGVtID0gbmV3IGVmcy5GaWxlU3lzdGVtKFxyXG4gICAgICAgICAgICBjbHVzdGVyLnN0YWNrLCAnTXlFZnNGaWxlU3lzdGVtJywgXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHZwYzogY2x1c3RlckluZm8uY2x1c3Rlci52cGMsXHJcbiAgICAgICAgICAgICAgICBzZWN1cml0eUdyb3VwOiBqdXB5dGVySHViU0csXHJcbiAgICAgICAgICAgICAgICByZW1vdmFsUG9saWN5OiByZW1vdmFsUG9saWN5LFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuICAgICAgICBjb25zdCBlZnNJZCA9IGp1cHl0ZXJIdWJGaWxlU3lzdGVtLmZpbGVTeXN0ZW1JZDtcclxuICAgICAgICBcclxuICAgICAgICAvLyBDcmVhdGUgU3RvcmFnZUNsYXNzXHJcbiAgICAgICAgY29uc3QgZWZzU0MgPSBjbHVzdGVyLmFkZE1hbmlmZXN0KCdlZnMtc3RvcmFnZS1jbGFzcycsIHtcclxuICAgICAgICAgICAgYXBpVmVyc2lvbjogJ3N0b3JhZ2UuazhzLmlvL3YxJyxcclxuICAgICAgICAgICAga2luZDogJ1N0b3JhZ2VDbGFzcycsXHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiAnZWZzLXNjJyxcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgcHJvdmlzaW9uZXI6ICdlZnMuY3NpLmF3cy5jb20nLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBTZXR1cCBQZXJzaXN0ZW50Vm9sdW1lIGFuZCBQZXJzaXN0ZW50Vm9sdW1lQ2xhaW1cclxuICAgICAgICBjb25zdCBlZnNQViA9IGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ2Vmcy1wdicsIHtcclxuICAgICAgICAgICAgYXBpVmVyc2lvbjogJ3YxJyxcclxuICAgICAgICAgICAga2luZDogJ1BlcnNpc3RlbnRWb2x1bWUnLFxyXG4gICAgICAgICAgICBtZXRhZGF0YTogeyBcclxuICAgICAgICAgICAgICAgIG5hbWU6IGAke3B2Y05hbWV9YCxcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgIGNhcGFjaXR5OiB7IHN0b3JhZ2U6IGAke2NhcGFjaXR5fWAgfSxcclxuICAgICAgICAgICAgICAgIHZvbHVtZU1vZGU6ICdGaWxlc3lzdGVtJyxcclxuICAgICAgICAgICAgICAgIGFjY2Vzc01vZGVzOiBbICdSZWFkV3JpdGVNYW55JyBdLFxyXG4gICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzTmFtZTogJ2Vmcy1zYycsXHJcbiAgICAgICAgICAgICAgICBjc2k6IHtcclxuICAgICAgICAgICAgICAgICAgICBkcml2ZXI6ICdlZnMuY3NpLmF3cy5jb20nLFxyXG4gICAgICAgICAgICAgICAgICAgIHZvbHVtZUhhbmRsZTogYCR7ZWZzSWR9YCxcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICB9KTtcclxuICAgICAgICBlZnNQVi5ub2RlLmFkZERlcGVuZGVuY3koZWZzU0MpO1xyXG4gICAgICAgIGVmc1BWLm5vZGUuYWRkRGVwZW5kZW5jeShqdXB5dGVySHViRmlsZVN5c3RlbSk7XHJcblxyXG4gICAgICAgIGNvbnN0IGVmc1BWQyA9IGNsdXN0ZXIuYWRkTWFuaWZlc3QoJ2Vmcy1wdmMnLCB7XHJcbiAgICAgICAgICAgIGFwaVZlcnNpb246ICd2MScsXHJcbiAgICAgICAgICAgIGtpbmQ6ICdQZXJzaXN0ZW50Vm9sdW1lQ2xhaW0nLFxyXG4gICAgICAgICAgICBtZXRhZGF0YTogeyBcclxuICAgICAgICAgICAgICAgIG5hbWU6IGAke3B2Y05hbWV9YCxcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogbmFtZXNwYWNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzc05hbWU6ICdlZnMtc2MnLFxyXG4gICAgICAgICAgICAgICAgYWNjZXNzTW9kZXM6IFsgJ1JlYWRXcml0ZU1hbnknIF0sXHJcbiAgICAgICAgICAgICAgICByZXNvdXJjZXM6IHsgcmVxdWVzdHM6IHsgc3RvcmFnZTogYCR7Y2FwYWNpdHl9YCB9IH0sXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgZWZzUFZDLm5vZGUuYWRkRGVwZW5kZW5jeShlZnNQVik7XHJcbiAgICB9XHJcbn1cclxuXHJcbiJdfQ==