"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApacheAirflowAddOn = void 0;
const assert = require("assert");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const index_1 = require("../helm-addon/index");
const aws_loadbalancer_controller_1 = require("../aws-loadbalancer-controller");
const efs_csi_driver_1 = require("../efs-csi-driver");
const utils_1 = require("../../utils");
const ts_deepmerge_1 = require("ts-deepmerge");
const AIRFLOW = 'airflow';
const RELEASE = 'blueprints-addon-apache-airflow';
const AIRFLOWSC = 'apache-airflow-sc';
const AIRFLOWPVC = 'efs-apache-airflow-pvc';
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: AIRFLOW,
    namespace: AIRFLOW,
    chart: AIRFLOW,
    version: "1.18.0",
    release: RELEASE,
    repository: "https://airflow.apache.org",
    enableAlb: false,
    enableEfs: false,
    enableLogging: false,
    values: {}
};
/**
 * This add-on is currently not supported. It will apply the latest falco helm chart but the latest AMI does not have stock driver supported and
 * driver build in the init fails atm.
 */
let ApacheAirflowAddOn = class ApacheAirflowAddOn extends index_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const albAddOnCheck = clusterInfo.getScheduledAddOn(aws_loadbalancer_controller_1.AwsLoadBalancerControllerAddOn.name);
        const enableAlb = this.options.enableAlb;
        const cert = this.options.certificateResourceName;
        const loggingIsEnabled = this.options.enableLogging;
        const loggingBucketResourceName = this.options.s3Bucket;
        const efsIsEnabled = this.options.enableEfs;
        const efsResourceName = this.options.efsFileSystem;
        const namespace = this.options.namespace;
        // Create Namespace
        const ns = (0, utils_1.createNamespace)(namespace, cluster, true, true);
        // Setting basic custom values for Kubernetes
        let values = {
            config: {
                "kubernetes": {
                    "namespace": this.options.namespace
                },
                "kubernetes_executor": {
                    "namespace": this.options.namespace
                }
            },
            "securityContext": {
                "fsGroup": 66534
            },
            "executor": "KubernetesExecutor"
        };
        // If Load Balancing is enabled
        if (enableAlb) {
            values = setUpLoadBalancer(clusterInfo, values, albAddOnCheck, cert);
        }
        else {
            assert(!cert, 'Cert option is supported only if ALB is enabled.');
        }
        // If Logging with S3 is enabled
        if (loggingIsEnabled) {
            const bucket = clusterInfo.getRequiredResource(loggingBucketResourceName);
            values = setUpLogging(clusterInfo, values, ns, namespace, bucket);
        }
        // If EFS is enabled for persistent storage
        let pvcResource;
        if (efsIsEnabled) {
            [values, pvcResource] = setUpEFS(clusterInfo, values, ns, namespace, efsResourceName);
        }
        // Merge values with user-provided one
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        // Apply Helm Chart
        const chart = this.addHelmChart(clusterInfo, values, false, false);
        // Add PVC dependency to the Chart in case of EFS generating the resource
        if (efsIsEnabled) {
            chart.node.addDependency(pvcResource);
        }
        return Promise.resolve(chart);
    }
};
exports.ApacheAirflowAddOn = ApacheAirflowAddOn;
exports.ApacheAirflowAddOn = ApacheAirflowAddOn = __decorate([
    utils_1.supportsX86
], ApacheAirflowAddOn);
/**
 * Helper function to set up Load Balancer
 */
function setUpLoadBalancer(clusterInfo, values, albAddOnCheck, cert) {
    // Check to ensure AWS Load Balancer Controller AddOn is provided in the list of Addons
    assert(albAddOnCheck, `Missing a dependency: ${aws_loadbalancer_controller_1.AwsLoadBalancerControllerAddOn.name}. Please add it to your list of addons.`);
    const presetAnnotations = {
        'alb.ingress.kubernetes.io/group.name': 'airflow',
        'alb.ingress.kubernetes.io/scheme': 'internet-facing',
        'alb.ingress.kubernetes.io/target-type': 'ip',
        'alb.ingress.kubernetes.io/listen-ports': '[{"HTTP": 80}]',
        'alb.ingress.kubernetes.io/healthcheck-path': '/health',
    };
    // Set helm custom value for certificates, if provided
    if (cert) {
        presetAnnotations['alb.ingress.kubernetes.io/listen-ports'] = '[{"HTTP": 80},{"HTTPS":443}]';
        const certificate = clusterInfo.getResource(cert);
        presetAnnotations['alb.ingress.kubernetes.io/certificate-arn'] = certificate?.certificateArn;
    }
    (0, utils_1.setPath)(values, "ingress.web", {
        "enabled": "true",
        "annotations": presetAnnotations,
        "pathType": "Prefix",
        "ingressClassName": "alb",
    });
    // Configuring Ingress for Airflow Web Ui hence the service type is changed to NodePort
    (0, utils_1.setPath)(values, "webserver.service", {
        type: "NodePort",
        ports: [{
                name: "airflow-ui",
                port: "{{ .Values.ports.airflowUI }}"
            }]
    });
    return values;
}
/**
 * Helper function to set up Logging with S3 Bucket
*/
function setUpLogging(clusterInfo, values, ns, namespace, bucket) {
    // Assert check to ensure you provide an S3 Bucket
    assert(bucket, "Please provide the name of S3 bucket for Logging.");
    // IRSA Policy
    const AirflowLoggingPolicy = {
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Action": [
                    "s3:ListBucket"
                ],
                "Resource": [`arn:aws:s3:::${bucket.bucketName}`]
            },
            {
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                ],
                "Resource": [`arn:aws:s3:::${bucket.bucketName}/*`]
            }
        ]
    };
    // Set up IRSA
    const airflowLoggingPolicyDocument = aws_iam_1.PolicyDocument.fromJson(AirflowLoggingPolicy);
    const sa = (0, utils_1.createServiceAccount)(clusterInfo.cluster, 'airflow-s3-logging-sa', namespace, airflowLoggingPolicyDocument);
    sa.node.addDependency(ns);
    // Helm custom value set up for S3 logging set up
    (0, utils_1.setPath)(values, "config.core.colored_console_log", 'True');
    (0, utils_1.setPath)(values, "config.core.remote_logging", 'True');
    (0, utils_1.setPath)(values, "config.logging", {
        "remote_logging": 'True',
        "logging_level": 'INFO',
        "colored_console_log": 'True',
        "remote_base_log_folder": `s3://${bucket.bucketName}/airflow-logs`,
        // aws_s3_conn is the name of the connection that needs to be created using Airflow admin UI once the deployment is complete
        // Steps can be seen in the docs link here -> https://github.com/apache/airflow/issues/25322
        "remote_log_conn_id": 'aws_s3_conn',
        "delete_worker_pods": 'False',
        "encrypt_s3_logs": 'True'
    });
    // Set Webserver SA so that server logs can be shipped to S3
    (0, utils_1.setPath)(values, "webserver.serviceAccount", {
        create: false,
        name: `${sa.serviceAccountName}`
    });
    // Set Worker SA so that worker logs can be shipped to S3
    (0, utils_1.setPath)(values, "workers.serviceAccount", {
        create: false,
        name: `${sa.serviceAccountName}`
    });
    // Set Scheduler SA so that scheduler logs can be shipped to S3
    (0, utils_1.setPath)(values, "scheduler.serviceAccount", {
        create: false,
        name: `${sa.serviceAccountName}`
    });
    return values;
}
/**
 *
 */
function setUpEFS(clusterInfo, values, ns, namespace, efsResourceName) {
    // Check 
    const efsAddOnCheck = clusterInfo.getScheduledAddOn(efs_csi_driver_1.EfsCsiDriverAddOn.name);
    assert(efsAddOnCheck, `Missing a dependency: ${efs_csi_driver_1.EfsCsiDriverAddOn.name}. Please add it to your list of addons.`);
    const efs = clusterInfo.getRequiredResource(efsResourceName);
    assert(efs, "Please provide the name of EFS File System.");
    // Need to create a storage class and pvc for the EFS
    const scResource = new aws_eks_1.KubernetesManifest(clusterInfo.cluster, 'apache-airflow-efs-sc', {
        cluster: clusterInfo.cluster,
        manifest: [{
                apiVersion: "storage.k8s.io/v1",
                kind: "StorageClass",
                metadata: { name: AIRFLOWSC },
                provisioner: "efs.csi.aws.com",
                parameters: {
                    provisioningMode: "efs-ap",
                    fileSystemId: `${efs.fileSystemId}`,
                    directoryPerms: "700",
                    gidRangeStart: "1000",
                    gidRangeEnd: "2000",
                }
            }], overwrite: true,
    });
    const pvcResource = new aws_eks_1.KubernetesManifest(clusterInfo.cluster, 'apache-airflow-efs-pvc', {
        cluster: clusterInfo.cluster,
        manifest: [{
                apiVersion: "v1",
                kind: "PersistentVolumeClaim",
                metadata: {
                    name: AIRFLOWPVC,
                    namespace: `${namespace}`
                },
                spec: {
                    accessModes: ["ReadWriteMany"],
                    storageClassName: AIRFLOWSC,
                    resources: {
                        requests: {
                            storage: '10Gi'
                        }
                    }
                }
            }], overwrite: true,
    });
    // SC depends on the EFS addon
    if (efsAddOnCheck) {
        efsAddOnCheck.then(construct => scResource.node.addDependency(construct));
    }
    // PVC depends on SC and NS
    pvcResource.node.addDependency(scResource);
    pvcResource.node.addDependency(ns);
    // Set helm custom values for persistent storage of DAGs
    (0, utils_1.setPath)(values, "dags.persistence", {
        enabled: true,
        size: "10Gi",
        storageClassName: AIRFLOWSC,
        accessMode: "ReadWriteMany",
        existingClaim: AIRFLOWPVC
    });
    return [values, pvcResource];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2FwYWNoZS1haXJmbG93L2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLGlDQUFpQztBQUlqQyxpREFBeUQ7QUFDekQsaURBQXFEO0FBR3JELCtDQUFnRDtBQUNoRCxnRkFBZ0Y7QUFDaEYsc0RBQXNEO0FBSXRELHVDQUEwRjtBQUcxRiwrQ0FBcUM7QUE4Q3JDLE1BQU0sT0FBTyxHQUFHLFNBQVMsQ0FBQztBQUMxQixNQUFNLE9BQU8sR0FBRyxpQ0FBaUMsQ0FBQztBQUNsRCxNQUFNLFNBQVMsR0FBRyxtQkFBbUIsQ0FBQztBQUN0QyxNQUFNLFVBQVUsR0FBRyx3QkFBd0IsQ0FBQztBQUU1Qzs7R0FFRztBQUNGLE1BQU0sWUFBWSxHQUFzQjtJQUNyQyxJQUFJLEVBQUUsT0FBTztJQUNiLFNBQVMsRUFBRSxPQUFPO0lBQ2xCLEtBQUssRUFBRSxPQUFPO0lBQ2QsT0FBTyxFQUFFLFFBQVE7SUFDakIsT0FBTyxFQUFFLE9BQU87SUFDaEIsVUFBVSxFQUFHLDRCQUE0QjtJQUN6QyxTQUFTLEVBQUUsS0FBSztJQUNoQixTQUFTLEVBQUUsS0FBSztJQUNoQixhQUFhLEVBQUUsS0FBSztJQUNwQixNQUFNLEVBQUUsRUFBRTtDQUNiLENBQUM7QUFFRjs7O0dBR0c7QUFFSSxJQUFNLGtCQUFrQixHQUF4QixNQUFNLGtCQUFtQixTQUFRLGlCQUFTO0lBRXBDLE9BQU8sQ0FBb0I7SUFFcEMsWUFBWSxLQUF5QjtRQUNqQyxLQUFLLENBQUMsRUFBQyxHQUFHLFlBQW9CLEVBQUUsR0FBRyxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBQzNDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQTBCLENBQUM7SUFDbkQsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FB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LFNBQVMsQ0FBQyxFQUFFLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztJQUM5RSxDQUFDO0lBRUQsMkJBQTJCO0lBQzNCLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLFdBQVcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO0lBRW5DLHdEQUF3RDtJQUN4RCxJQUFBLGVBQU8sRUFBQyxNQUFNLEVBQUUsa0JBQWtCLEVBQUU7UUFDaEMsT0FBTyxFQUFFLElBQUk7UUFDYixJQUFJLEVBQUUsTUFBTTtRQUNaLGdCQUFnQixFQUFFLFNBQVM7UUFDM0IsVUFBVSxFQUFFLGVBQWU7UUFDM0IsYUFBYSxFQUFFLFVBQVU7S0FDNUIsQ0FBQyxDQUFDO0lBRUgsT0FBTyxDQUFDLE1BQU0sRUFBRSxXQUFXLENBQUMsQ0FBQztBQUNqQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcclxuXHJcbmltcG9ydCB7IElDZXJ0aWZpY2F0ZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1jZXJ0aWZpY2F0ZW1hbmFnZXInO1xyXG5pbXBvcnQgeyBJQnVja2V0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcclxuaW1wb3J0IHsgS3ViZXJuZXRlc01hbmlmZXN0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVrcyc7XHJcbmltcG9ydCB7IFBvbGljeURvY3VtZW50IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XHJcblxyXG5pbXBvcnQgeyBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tIFwiLi4vaGVsbS1hZGRvblwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24gfSBmcm9tICcuLi9oZWxtLWFkZG9uL2luZGV4JztcclxuaW1wb3J0IHsgQXdzTG9hZEJhbGFuY2VyQ29udHJvbGxlckFkZE9uIH0gZnJvbSBcIi4uL2F3cy1sb2FkYmFsYW5jZXItY29udHJvbGxlclwiO1xyXG5pbXBvcnQgeyBFZnNDc2lEcml2ZXJBZGRPbiB9IGZyb20gXCIuLi9lZnMtY3NpLWRyaXZlclwiO1xyXG5cclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tICcuLi8uLi9zcGkvdHlwZXMnO1xyXG5pbXBvcnQgeyBWYWx1ZXMgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IHNldFBhdGgsIGNyZWF0ZU5hbWVzcGFjZSwgY3JlYXRlU2VydmljZUFjY291bnQsIHN1cHBvcnRzWDg2IH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IElGaWxlU3lzdGVtIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1lZnNcIjtcclxuXHJcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcInRzLWRlZXBtZXJnZVwiO1xyXG5cclxuLyoqXHJcbiAqIFVzZXIgcHJvdmlkZWQgb3B0aW9ucyBmb3IgdGhlIEhlbG0gQ2hhcnRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQWlyZmxvd0FkZE9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lc3BhY2VcclxuICAgICAqL1xyXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nLFxyXG4gICAgXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZSBMb2FkIEJhbGFuY2VyIGZvciBJbmdyZXNzIC0gZGVmYXVsdCBpcyBmYWxzZVxyXG4gICAgICovXHJcbiAgICBlbmFibGVBbGI/OiBib29sZWFuLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmFtZSBvZiB0aGUge0BsaW5rIGNlcnRpZmljYXRlUmVzb3VyY2VOYW1lfSB0byBiZSB1c2VkIGZvciBjZXJ0aWZpY2F0ZSBsb29rIHVwLiBcclxuICAgICAqIEBzZWUge0BsaW5rIEltcG9ydENlcnRpZmljYXRlUHJvdmlkZXJ9IGFuZCB7QGxpbmsgQ3JlYXRlQ2VydGlmaWNhdGVQcm92aWRlcn0gZm9yIGV4YW1wbGVzIG9mIGNlcnRpZmljYXRlIHByb3ZpZGVycy5cclxuICAgICAqL1xyXG4gICAgY2VydGlmaWNhdGVSZXNvdXJjZU5hbWU/OiBzdHJpbmcsXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBFbmFibGUgTG9nZ2luZyB3aXRoIFMzICAtIGRlZmF1bHQgaXMgZmFsc2VcclxuICAgICAqL1xyXG4gICAgZW5hYmxlTG9nZ2luZz86IGJvb2xlYW4sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lcyBvZiB0aGUgUzMgQnVja2V0IHByb3ZpZGVyIG5hbWVkIHJlc291cmNlcyAoQHNlZSBDcmVhdGVTM0J1Y2tldFByb3ZpZGVyLCBAc2VlIEltcG9ydFMzQnVja2V0UHJvdmlkZXIpLlxyXG4gICAgICogUzMgQnVja2V0IHByb3ZpZGVyIGlzIHJlZ2lzdGVyZWQgYXMgbmFtZWQgcmVzb3VyY2UgcHJvdmlkZXJzIHdpdGggdGhlIEVrc0JsdWVwcmludFByb3BzLlxyXG4gICAgICovXHJcbiAgICBzM0J1Y2tldD86IHN0cmluZyxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEVuYWJsZSBFRlMgZm9yIHBlcnNpc3RlbnQgc3RvcmFnZSBvZiBEQUdzIC0gZGVmYXVsdCBpcyBmYWxzZVxyXG4gICAgICovXHJcbiAgICBlbmFibGVFZnM/OiBib29sZWFuLFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmFtZXMgb2YgdGhlIEVGUyBGaWxlIFN5c3RlbSBwcm92aWRlciBuYW1lZCByZXNvdXJjZXMgKEBzZWUgQ3JlYXRlRWZzRmlsZVN5c3RlbVByb3ZpZGVyLCBAc2VlIExvb2t1cEVmc0ZpbGVTeXN0ZW1Qcm92aWRlcikuXHJcbiAgICAgKiBFRlMgRmlsZSBTeXN0ZW0gcHJvdmlkZXIgaXMgcmVnaXN0ZXJlZCBhcyBuYW1lZCByZXNvdXJjZSBwcm92aWRlcnMgd2l0aCB0aGUgRWtzQmx1ZXByaW50UHJvcHMuXHJcbiAgICAgKiBUaGlzIGlzIHJlcXVpcmVkIGlmIEVGUyBpcyBlbmFibGVkXHJcbiAgICAgKi9cclxuICAgIGVmc0ZpbGVTeXN0ZW0/OiBzdHJpbmcsXHJcbn1cclxuXHJcbmNvbnN0IEFJUkZMT1cgPSAnYWlyZmxvdyc7XHJcbmNvbnN0IFJFTEVBU0UgPSAnYmx1ZXByaW50cy1hZGRvbi1hcGFjaGUtYWlyZmxvdyc7XHJcbmNvbnN0IEFJUkZMT1dTQyA9ICdhcGFjaGUtYWlyZmxvdy1zYyc7XHJcbmNvbnN0IEFJUkZMT1dQVkMgPSAnZWZzLWFwYWNoZS1haXJmbG93LXB2Yyc7XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBwcm9wcyB0byBiZSB1c2VkIHdoZW4gY3JlYXRpbmcgdGhlIEhlbG0gY2hhcnRcclxuICovXHJcbiBjb25zdCBkZWZhdWx0UHJvcHM6IEFpcmZsb3dBZGRPblByb3BzID0ge1xyXG4gICAgbmFtZTogQUlSRkxPVyxcclxuICAgIG5hbWVzcGFjZTogQUlSRkxPVyxcclxuICAgIGNoYXJ0OiBBSVJGTE9XLFxyXG4gICAgdmVyc2lvbjogXCIxLjE4LjBcIixcclxuICAgIHJlbGVhc2U6IFJFTEVBU0UsXHJcbiAgICByZXBvc2l0b3J5OiAgXCJodHRwczovL2FpcmZsb3cuYXBhY2hlLm9yZ1wiLFxyXG4gICAgZW5hYmxlQWxiOiBmYWxzZSxcclxuICAgIGVuYWJsZUVmczogZmFsc2UsXHJcbiAgICBlbmFibGVMb2dnaW5nOiBmYWxzZSxcclxuICAgIHZhbHVlczoge31cclxufTtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGFkZC1vbiBpcyBjdXJyZW50bHkgbm90IHN1cHBvcnRlZC4gSXQgd2lsbCBhcHBseSB0aGUgbGF0ZXN0IGZhbGNvIGhlbG0gY2hhcnQgYnV0IHRoZSBsYXRlc3QgQU1JIGRvZXMgbm90IGhhdmUgc3RvY2sgZHJpdmVyIHN1cHBvcnRlZCBhbmRcclxuICogZHJpdmVyIGJ1aWxkIGluIHRoZSBpbml0IGZhaWxzIGF0bS4gXHJcbiAqL1xyXG5Ac3VwcG9ydHNYODZcclxuZXhwb3J0IGNsYXNzIEFwYWNoZUFpcmZsb3dBZGRPbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcblxyXG4gICAgcmVhZG9ubHkgb3B0aW9uczogQWlyZmxvd0FkZE9uUHJvcHM7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBBaXJmbG93QWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsuLi5kZWZhdWx0UHJvcHMgIGFzIGFueSwgLi4ucHJvcHN9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzIGFzIEFpcmZsb3dBZGRPblByb3BzO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgICAgICBjb25zdCBhbGJBZGRPbkNoZWNrID0gY2x1c3RlckluZm8uZ2V0U2NoZWR1bGVkQWRkT24oQXdzTG9hZEJhbGFuY2VyQ29udHJvbGxlckFkZE9uLm5hbWUpO1xyXG4gICAgICAgIGNvbnN0IGVuYWJsZUFsYiA9IHRoaXMub3B0aW9ucy5lbmFibGVBbGI7XHJcbiAgICAgICAgY29uc3QgY2VydCA9IHRoaXMub3B0aW9ucy5jZXJ0aWZpY2F0ZVJlc291cmNlTmFtZTtcclxuICAgICAgICBjb25zdCBsb2dnaW5nSXNFbmFibGVkID0gdGhpcy5vcHRpb25zLmVuYWJsZUxvZ2dpbmc7XHJcbiAgICAgICAgY29uc3QgbG9nZ2luZ0J1Y2tldFJlc291cmNlTmFtZSA9IHRoaXMub3B0aW9ucy5zM0J1Y2tldDtcclxuICAgICAgICBjb25zdCBlZnNJc0VuYWJsZWQgPSB0aGlzLm9wdGlvbnMuZW5hYmxlRWZzO1xyXG4gICAgICAgIGNvbnN0IGVmc1Jlc291cmNlTmFtZSA9IHRoaXMub3B0aW9ucy5lZnNGaWxlU3lzdGVtO1xyXG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IHRoaXMub3B0aW9ucy5uYW1lc3BhY2U7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBOYW1lc3BhY2VcclxuICAgICAgICBjb25zdCBucyA9IGNyZWF0ZU5hbWVzcGFjZShuYW1lc3BhY2UhLCBjbHVzdGVyLCB0cnVlLCB0cnVlKTtcclxuXHJcbiAgICAgICAgLy8gU2V0dGluZyBiYXNpYyBjdXN0b20gdmFsdWVzIGZvciBLdWJlcm5ldGVzXHJcbiAgICAgICAgbGV0IHZhbHVlczogVmFsdWVzID0ge1xyXG4gICAgICAgICAgICBjb25maWc6IHtcclxuICAgICAgICAgICAgICAgIFwia3ViZXJuZXRlc1wiOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJuYW1lc3BhY2VcIjogdGhpcy5vcHRpb25zLm5hbWVzcGFjZSFcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBcImt1YmVybmV0ZXNfZXhlY3V0b3JcIjoge1xyXG4gICAgICAgICAgICAgICAgICAgIFwibmFtZXNwYWNlXCI6IHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIFwic2VjdXJpdHlDb250ZXh0XCI6IHtcclxuICAgICAgICAgICAgICAgIFwiZnNHcm91cFwiOiA2NjUzNFxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBcImV4ZWN1dG9yXCI6IFwiS3ViZXJuZXRlc0V4ZWN1dG9yXCJcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICAvLyBJZiBMb2FkIEJhbGFuY2luZyBpcyBlbmFibGVkXHJcbiAgICAgICAgaWYgKGVuYWJsZUFsYil7XHJcbiAgICAgICAgICAgIHZhbHVlcyA9IHNldFVwTG9hZEJhbGFuY2VyKGNsdXN0ZXJJbmZvLCB2YWx1ZXMsIGFsYkFkZE9uQ2hlY2ssIGNlcnQpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGFzc2VydCghY2VydCwgJ0NlcnQgb3B0aW9uIGlzIHN1cHBvcnRlZCBvbmx5IGlmIEFMQiBpcyBlbmFibGVkLicpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gSWYgTG9nZ2luZyB3aXRoIFMzIGlzIGVuYWJsZWRcclxuICAgICAgICBpZiAobG9nZ2luZ0lzRW5hYmxlZCl7XHJcbiAgICAgICAgICAgIGNvbnN0IGJ1Y2tldCA9IGNsdXN0ZXJJbmZvLmdldFJlcXVpcmVkUmVzb3VyY2U8SUJ1Y2tldD4obG9nZ2luZ0J1Y2tldFJlc291cmNlTmFtZSEpO1xyXG4gICAgICAgICAgICB2YWx1ZXMgPSBzZXRVcExvZ2dpbmcoY2x1c3RlckluZm8sIHZhbHVlcywgbnMsIG5hbWVzcGFjZSEsIGJ1Y2tldCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBJZiBFRlMgaXMgZW5hYmxlZCBmb3IgcGVyc2lzdGVudCBzdG9yYWdlXHJcbiAgICAgICAgbGV0IHB2Y1Jlc291cmNlOiBLdWJlcm5ldGVzTWFuaWZlc3Q7XHJcbiAgICAgICAgaWYgKGVmc0lzRW5hYmxlZCl7XHJcbiAgICAgICAgICAgIFt2YWx1ZXMsIHB2Y1Jlc291cmNlXSA9IHNldFVwRUZTKGNsdXN0ZXJJbmZvLCB2YWx1ZXMsIG5zLCBuYW1lc3BhY2UhLCBlZnNSZXNvdXJjZU5hbWUhKTsgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIE1lcmdlIHZhbHVlcyB3aXRoIHVzZXItcHJvdmlkZWQgb25lXHJcbiAgICAgICAgdmFsdWVzID0gbWVyZ2UodmFsdWVzLCB0aGlzLnByb3BzLnZhbHVlcyA/PyB7fSk7XHJcblxyXG4gICAgICAgIC8vIEFwcGx5IEhlbG0gQ2hhcnRcclxuICAgICAgICBjb25zdCBjaGFydCA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCB2YWx1ZXMsIGZhbHNlLCBmYWxzZSk7XHJcblxyXG4gICAgICAgIC8vIEFkZCBQVkMgZGVwZW5kZW5jeSB0byB0aGUgQ2hhcnQgaW4gY2FzZSBvZiBFRlMgZ2VuZXJhdGluZyB0aGUgcmVzb3VyY2VcclxuICAgICAgICBpZiAoZWZzSXNFbmFibGVkKXtcclxuICAgICAgICAgICAgY2hhcnQubm9kZS5hZGREZXBlbmRlbmN5KHB2Y1Jlc291cmNlISk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNoYXJ0KTtcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBzZXQgdXAgTG9hZCBCYWxhbmNlclxyXG4gKi9cclxuZnVuY3Rpb24gc2V0VXBMb2FkQmFsYW5jZXIoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCB2YWx1ZXM6IFZhbHVlcywgYWxiQWRkT25DaGVjazogUHJvbWlzZTxDb25zdHJ1Y3Q+IHwgdW5kZWZpbmVkLCBjZXJ0OiBzdHJpbmcgfCB1bmRlZmluZWQgKTogVmFsdWVzIHtcclxuICAgICAvLyBDaGVjayB0byBlbnN1cmUgQVdTIExvYWQgQmFsYW5jZXIgQ29udHJvbGxlciBBZGRPbiBpcyBwcm92aWRlZCBpbiB0aGUgbGlzdCBvZiBBZGRvbnNcclxuICAgICBhc3NlcnQoYWxiQWRkT25DaGVjaywgYE1pc3NpbmcgYSBkZXBlbmRlbmN5OiAke0F3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXJBZGRPbi5uYW1lfS4gUGxlYXNlIGFkZCBpdCB0byB5b3VyIGxpc3Qgb2YgYWRkb25zLmApOyBcclxuICAgICBjb25zdCBwcmVzZXRBbm5vdGF0aW9uczogYW55ID0ge1xyXG4gICAgICAgICAnYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9ncm91cC5uYW1lJzogJ2FpcmZsb3cnLFxyXG4gICAgICAgICAnYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9zY2hlbWUnOiAnaW50ZXJuZXQtZmFjaW5nJyxcclxuICAgICAgICAgJ2FsYi5pbmdyZXNzLmt1YmVybmV0ZXMuaW8vdGFyZ2V0LXR5cGUnOiAnaXAnLFxyXG4gICAgICAgICAnYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9saXN0ZW4tcG9ydHMnOiAnW3tcIkhUVFBcIjogODB9XScsXHJcbiAgICAgICAgICdhbGIuaW5ncmVzcy5rdWJlcm5ldGVzLmlvL2hlYWx0aGNoZWNrLXBhdGgnOiAnL2hlYWx0aCcsXHJcbiAgICAgfTtcclxuXHJcbiAgICAgLy8gU2V0IGhlbG0gY3VzdG9tIHZhbHVlIGZvciBjZXJ0aWZpY2F0ZXMsIGlmIHByb3ZpZGVkXHJcbiAgICAgaWYgKGNlcnQpe1xyXG4gICAgICAgICBwcmVzZXRBbm5vdGF0aW9uc1snYWxiLmluZ3Jlc3Mua3ViZXJuZXRlcy5pby9saXN0ZW4tcG9ydHMnXSA9ICdbe1wiSFRUUFwiOiA4MH0se1wiSFRUUFNcIjo0NDN9XSc7XHJcbiAgICAgICAgIGNvbnN0IGNlcnRpZmljYXRlID0gY2x1c3RlckluZm8uZ2V0UmVzb3VyY2U8SUNlcnRpZmljYXRlPihjZXJ0KTtcclxuICAgICAgICAgcHJlc2V0QW5ub3RhdGlvbnNbJ2FsYi5pbmdyZXNzLmt1YmVybmV0ZXMuaW8vY2VydGlmaWNhdGUtYXJuJ10gPSBjZXJ0aWZpY2F0ZT8uY2VydGlmaWNhdGVBcm47XHJcbiAgICAgfSBcclxuICAgICBcclxuICAgICBzZXRQYXRoKHZhbHVlcywgXCJpbmdyZXNzLndlYlwiLCB7XHJcbiAgICAgICAgIFwiZW5hYmxlZFwiOiBcInRydWVcIixcclxuICAgICAgICAgXCJhbm5vdGF0aW9uc1wiOiBwcmVzZXRBbm5vdGF0aW9ucyxcclxuICAgICAgICAgXCJwYXRoVHlwZVwiOiBcIlByZWZpeFwiLFxyXG4gICAgICAgICBcImluZ3Jlc3NDbGFzc05hbWVcIjogXCJhbGJcIixcclxuICAgICB9KTtcclxuXHJcbiAgICAgLy8gQ29uZmlndXJpbmcgSW5ncmVzcyBmb3IgQWlyZmxvdyBXZWIgVWkgaGVuY2UgdGhlIHNlcnZpY2UgdHlwZSBpcyBjaGFuZ2VkIHRvIE5vZGVQb3J0XHJcbiAgICAgc2V0UGF0aCh2YWx1ZXMsIFwid2Vic2VydmVyLnNlcnZpY2VcIiwge1xyXG4gICAgICAgICB0eXBlOiBcIk5vZGVQb3J0XCIsXHJcbiAgICAgICAgIHBvcnRzOiBbe1xyXG4gICAgICAgICAgICAgbmFtZTogXCJhaXJmbG93LXVpXCIsXHJcbiAgICAgICAgICAgICBwb3J0OiBcInt7IC5WYWx1ZXMucG9ydHMuYWlyZmxvd1VJIH19XCJcclxuICAgICAgICAgfV1cclxuICAgICB9KTtcclxuXHJcbiAgICAgcmV0dXJuIHZhbHVlcztcclxufVxyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmdW5jdGlvbiB0byBzZXQgdXAgTG9nZ2luZyB3aXRoIFMzIEJ1Y2tldFxyXG4qL1xyXG5mdW5jdGlvbiBzZXRVcExvZ2dpbmcoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCB2YWx1ZXM6IFZhbHVlcywgbnM6IENvbnN0cnVjdCwgbmFtZXNwYWNlOiBzdHJpbmcsIGJ1Y2tldDogSUJ1Y2tldCk6IFZhbHVlcyB7XHJcbiAgICBcclxuICAgIC8vIEFzc2VydCBjaGVjayB0byBlbnN1cmUgeW91IHByb3ZpZGUgYW4gUzMgQnVja2V0XHJcbiAgICBhc3NlcnQoYnVja2V0LCBcIlBsZWFzZSBwcm92aWRlIHRoZSBuYW1lIG9mIFMzIGJ1Y2tldCBmb3IgTG9nZ2luZy5cIik7XHJcblxyXG4gICAgLy8gSVJTQSBQb2xpY3lcclxuICAgIGNvbnN0IEFpcmZsb3dMb2dnaW5nUG9saWN5ID0ge1xyXG4gICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcclxuICAgICAgICBcIlN0YXRlbWVudFwiOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBcInMzOkxpc3RCdWNrZXRcIlxyXG4gICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogW2Bhcm46YXdzOnMzOjo6JHtidWNrZXQuYnVja2V0TmFtZX1gXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBcInMzOlB1dE9iamVjdFwiXHJcbiAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBbYGFybjphd3M6czM6Ojoke2J1Y2tldC5idWNrZXROYW1lfS8qYF1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH07XHJcblxyXG4gICAgLy8gU2V0IHVwIElSU0FcclxuICAgIGNvbnN0IGFpcmZsb3dMb2dnaW5nUG9saWN5RG9jdW1lbnQgPSBQb2xpY3lEb2N1bWVudC5mcm9tSnNvbihBaXJmbG93TG9nZ2luZ1BvbGljeSk7XHJcbiAgICBjb25zdCBzYSA9IGNyZWF0ZVNlcnZpY2VBY2NvdW50KGNsdXN0ZXJJbmZvLmNsdXN0ZXIsICdhaXJmbG93LXMzLWxvZ2dpbmctc2EnLCBuYW1lc3BhY2UsIGFpcmZsb3dMb2dnaW5nUG9saWN5RG9jdW1lbnQpO1xyXG4gICAgc2Eubm9kZS5hZGREZXBlbmRlbmN5KG5zKTtcclxuXHJcbiAgICAvLyBIZWxtIGN1c3RvbSB2YWx1ZSBzZXQgdXAgZm9yIFMzIGxvZ2dpbmcgc2V0IHVwXHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJjb25maWcuY29yZS5jb2xvcmVkX2NvbnNvbGVfbG9nXCIsICdUcnVlJyk7XHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJjb25maWcuY29yZS5yZW1vdGVfbG9nZ2luZ1wiLCAnVHJ1ZScpO1xyXG4gICAgc2V0UGF0aCh2YWx1ZXMsIFwiY29uZmlnLmxvZ2dpbmdcIiwge1xyXG4gICAgICAgIFwicmVtb3RlX2xvZ2dpbmdcIjogJ1RydWUnLFxyXG4gICAgICAgIFwibG9nZ2luZ19sZXZlbFwiOiAnSU5GTycsXHJcbiAgICAgICAgXCJjb2xvcmVkX2NvbnNvbGVfbG9nXCI6ICdUcnVlJyxcclxuICAgICAgICBcInJlbW90ZV9iYXNlX2xvZ19mb2xkZXJcIjogYHMzOi8vJHtidWNrZXQuYnVja2V0TmFtZX0vYWlyZmxvdy1sb2dzYCxcclxuICAgICAgICAvLyBhd3NfczNfY29ubiBpcyB0aGUgbmFtZSBvZiB0aGUgY29ubmVjdGlvbiB0aGF0IG5lZWRzIHRvIGJlIGNyZWF0ZWQgdXNpbmcgQWlyZmxvdyBhZG1pbiBVSSBvbmNlIHRoZSBkZXBsb3ltZW50IGlzIGNvbXBsZXRlXHJcbiAgICAgICAgLy8gU3RlcHMgY2FuIGJlIHNlZW4gaW4gdGhlIGRvY3MgbGluayBoZXJlIC0+IGh0dHBzOi8vZ2l0aHViLmNvbS9hcGFjaGUvYWlyZmxvdy9pc3N1ZXMvMjUzMjJcclxuICAgICAgICBcInJlbW90ZV9sb2dfY29ubl9pZFwiOiAnYXdzX3MzX2Nvbm4nLFxyXG4gICAgICAgIFwiZGVsZXRlX3dvcmtlcl9wb2RzXCI6ICdGYWxzZScsXHJcbiAgICAgICAgXCJlbmNyeXB0X3MzX2xvZ3NcIjogJ1RydWUnXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgV2Vic2VydmVyIFNBIHNvIHRoYXQgc2VydmVyIGxvZ3MgY2FuIGJlIHNoaXBwZWQgdG8gUzNcclxuICAgIHNldFBhdGgodmFsdWVzLCBcIndlYnNlcnZlci5zZXJ2aWNlQWNjb3VudFwiLCB7XHJcbiAgICAgICAgY3JlYXRlOiBmYWxzZSxcclxuICAgICAgICBuYW1lOiBgJHtzYS5zZXJ2aWNlQWNjb3VudE5hbWV9YFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gU2V0IFdvcmtlciBTQSBzbyB0aGF0IHdvcmtlciBsb2dzIGNhbiBiZSBzaGlwcGVkIHRvIFMzXHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJ3b3JrZXJzLnNlcnZpY2VBY2NvdW50XCIsIHtcclxuICAgICAgICBjcmVhdGU6IGZhbHNlLFxyXG4gICAgICAgIG5hbWU6IGAke3NhLnNlcnZpY2VBY2NvdW50TmFtZX1gXHJcbiAgICB9KTtcclxuXHJcbiAgICAvLyBTZXQgU2NoZWR1bGVyIFNBIHNvIHRoYXQgc2NoZWR1bGVyIGxvZ3MgY2FuIGJlIHNoaXBwZWQgdG8gUzNcclxuICAgIHNldFBhdGgodmFsdWVzLCBcInNjaGVkdWxlci5zZXJ2aWNlQWNjb3VudFwiLCB7XHJcbiAgICAgICAgY3JlYXRlOiBmYWxzZSxcclxuICAgICAgICBuYW1lOiBgJHtzYS5zZXJ2aWNlQWNjb3VudE5hbWV9YFxyXG4gICAgfSk7XHJcbiAgICBcclxuICAgIHJldHVybiB2YWx1ZXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBcclxuICovXHJcbmZ1bmN0aW9uIHNldFVwRUZTKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbywgdmFsdWVzOiBWYWx1ZXMsIG5zOiBDb25zdHJ1Y3QsIG5hbWVzcGFjZTogc3RyaW5nLCBlZnNSZXNvdXJjZU5hbWU6IHN0cmluZyk6IFtWYWx1ZXMsIEt1YmVybmV0ZXNNYW5pZmVzdF0ge1xyXG4gICAgLy8gQ2hlY2sgXHJcbiAgICBjb25zdCBlZnNBZGRPbkNoZWNrID0gY2x1c3RlckluZm8uZ2V0U2NoZWR1bGVkQWRkT24oRWZzQ3NpRHJpdmVyQWRkT24ubmFtZSk7XHJcbiAgICBhc3NlcnQoZWZzQWRkT25DaGVjaywgYE1pc3NpbmcgYSBkZXBlbmRlbmN5OiAke0Vmc0NzaURyaXZlckFkZE9uLm5hbWV9LiBQbGVhc2UgYWRkIGl0IHRvIHlvdXIgbGlzdCBvZiBhZGRvbnMuYCk7IFxyXG4gICAgY29uc3QgZWZzID0gY2x1c3RlckluZm8uZ2V0UmVxdWlyZWRSZXNvdXJjZTxJRmlsZVN5c3RlbT4oZWZzUmVzb3VyY2VOYW1lKTtcclxuICAgIGFzc2VydChlZnMsIFwiUGxlYXNlIHByb3ZpZGUgdGhlIG5hbWUgb2YgRUZTIEZpbGUgU3lzdGVtLlwiKTtcclxuXHJcbiAgICAvLyBOZWVkIHRvIGNyZWF0ZSBhIHN0b3JhZ2UgY2xhc3MgYW5kIHB2YyBmb3IgdGhlIEVGU1xyXG4gICAgY29uc3Qgc2NSZXNvdXJjZSA9IG5ldyBLdWJlcm5ldGVzTWFuaWZlc3QoY2x1c3RlckluZm8uY2x1c3RlciwgJ2FwYWNoZS1haXJmbG93LWVmcy1zYycsIHtcclxuICAgICAgICBjbHVzdGVyOiBjbHVzdGVySW5mby5jbHVzdGVyLFxyXG4gICAgICAgIG1hbmlmZXN0OiBbe1xyXG4gICAgICAgICAgICBhcGlWZXJzaW9uOiBcInN0b3JhZ2UuazhzLmlvL3YxXCIsXHJcbiAgICAgICAgICAgIGtpbmQ6IFwiU3RvcmFnZUNsYXNzXCIsXHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7IG5hbWU6IEFJUkZMT1dTQyB9LFxyXG4gICAgICAgICAgICBwcm92aXNpb25lcjogXCJlZnMuY3NpLmF3cy5jb21cIixcclxuICAgICAgICAgICAgcGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAgICAgcHJvdmlzaW9uaW5nTW9kZTogXCJlZnMtYXBcIixcclxuICAgICAgICAgICAgICAgIGZpbGVTeXN0ZW1JZDogYCR7ZWZzLmZpbGVTeXN0ZW1JZH1gLFxyXG4gICAgICAgICAgICAgICAgZGlyZWN0b3J5UGVybXM6IFwiNzAwXCIsXHJcbiAgICAgICAgICAgICAgICBnaWRSYW5nZVN0YXJ0OiBcIjEwMDBcIixcclxuICAgICAgICAgICAgICAgIGdpZFJhbmdlRW5kOiBcIjIwMDBcIixcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1dLCBvdmVyd3JpdGU6IHRydWUsXHJcbiAgICB9KTtcclxuXHJcbiAgICBjb25zdCBwdmNSZXNvdXJjZSA9IG5ldyBLdWJlcm5ldGVzTWFuaWZlc3QoY2x1c3RlckluZm8uY2x1c3RlciwgJ2FwYWNoZS1haXJmbG93LWVmcy1wdmMnLHtcclxuICAgICAgICBjbHVzdGVyOiBjbHVzdGVySW5mby5jbHVzdGVyLFxyXG4gICAgICAgIG1hbmlmZXN0OiBbe1xyXG4gICAgICAgICAgICBhcGlWZXJzaW9uOiBcInYxXCIsXHJcbiAgICAgICAgICAgIGtpbmQ6IFwiUGVyc2lzdGVudFZvbHVtZUNsYWltXCIsXHJcbiAgICAgICAgICAgIG1ldGFkYXRhOiB7IFxyXG4gICAgICAgICAgICAgICAgbmFtZTogQUlSRkxPV1BWQyxcclxuICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogYCR7bmFtZXNwYWNlfWAgXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHNwZWM6IHtcclxuICAgICAgICAgICAgICAgIGFjY2Vzc01vZGVzOiBbXCJSZWFkV3JpdGVNYW55XCJdLFxyXG4gICAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzTmFtZTogQUlSRkxPV1NDLFxyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdHM6IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc3RvcmFnZTogJzEwR2knXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfV0sIG92ZXJ3cml0ZTogdHJ1ZSxcclxuICAgIH0pO1xyXG5cclxuICAgIC8vIFNDIGRlcGVuZHMgb24gdGhlIEVGUyBhZGRvblxyXG4gICAgaWYoZWZzQWRkT25DaGVjaykge1xyXG4gICAgICAgIGVmc0FkZE9uQ2hlY2sudGhlbihjb25zdHJ1Y3QgPT4gc2NSZXNvdXJjZS5ub2RlLmFkZERlcGVuZGVuY3koY29uc3RydWN0KSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUFZDIGRlcGVuZHMgb24gU0MgYW5kIE5TXHJcbiAgICBwdmNSZXNvdXJjZS5ub2RlLmFkZERlcGVuZGVuY3koc2NSZXNvdXJjZSk7XHJcbiAgICBwdmNSZXNvdXJjZS5ub2RlLmFkZERlcGVuZGVuY3kobnMpO1xyXG5cclxuICAgIC8vIFNldCBoZWxtIGN1c3RvbSB2YWx1ZXMgZm9yIHBlcnNpc3RlbnQgc3RvcmFnZSBvZiBEQUdzXHJcbiAgICBzZXRQYXRoKHZhbHVlcywgXCJkYWdzLnBlcnNpc3RlbmNlXCIsIHtcclxuICAgICAgICBlbmFibGVkOiB0cnVlLFxyXG4gICAgICAgIHNpemU6IFwiMTBHaVwiLFxyXG4gICAgICAgIHN0b3JhZ2VDbGFzc05hbWU6IEFJUkZMT1dTQyxcclxuICAgICAgICBhY2Nlc3NNb2RlOiBcIlJlYWRXcml0ZU1hbnlcIixcclxuICAgICAgICBleGlzdGluZ0NsYWltOiBBSVJGTE9XUFZDXHJcbiAgICB9KTtcclxuXHJcbiAgICByZXR1cm4gW3ZhbHVlcywgcHZjUmVzb3VyY2VdO1xyXG59XHJcbiJdfQ==