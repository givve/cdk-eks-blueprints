"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VeleroAddOn = void 0;
const iam = require("aws-cdk-lib/aws-iam");
const s3 = require("aws-cdk-lib/aws-s3");
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: 'velero',
    version: "3.2.0",
    namespace: "velero",
    createNamespace: true,
    chart: "velero",
    repository: "https://vmware-tanzu.github.io/helm-charts/",
    release: "blueprints-addon-velero",
    values: {
        initContainers: [
            {
                name: "velero-plugin-for-aws",
                image: "velero/velero-plugin-for-aws:v1.2.0",
                imagePullPolicy: "IfNotPresent",
                volumeMounts: [
                    {
                        mountPath: "/target",
                        name: "plugins"
                    }
                ]
            }
        ],
        configuration: {
            provider: "aws",
            backupStorageLocation: {
                name: "default",
                config: {}
            },
            volumeSnapshotLocation: {
                name: "default",
                config: {}
            },
        },
        serviceAccount: {
            server: {}
        }
    },
};
let VeleroAddOn = class VeleroAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super((0, ts_deepmerge_1.merge)(defaultProps, props ?? {}));
        this.options = this.props;
    }
    /**
     * Implementation of the add-on contract deploy method.
    */
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const props = this.options;
        // Create S3 bucket if no existing bucket, create s3 bucket and corresponding KMS key
        const s3Bucket = this.getOrCreateS3Bucket(clusterInfo, "backup-bucket", props.values.configuration.backupStorageLocation.bucket);
        // Create Namespace if namespace is not explicied defined.
        const veleroNamespace = this.createNamespaceIfNeeded(clusterInfo, "velero", props.namespace, props.createNamespace);
        // Setup IAM Role for Service Accounts (IRSA) for the Velero Service Account    
        const veleroServiceAccount = this.createServiceAccountWithIamRoles(clusterInfo, "velero-account", veleroNamespace.name, s3Bucket);
        // if veleroName space does not exist and needs creation, add the dependency
        if (veleroNamespace.manifest) {
            veleroServiceAccount.node.addDependency(veleroNamespace.manifest);
        }
        // Setup the values for the helm chart
        const valueVariable = {
            values: {
                configuration: {
                    backupStorageLocation: {
                        prefix: props.values.configuration.backupStorageLocation.prefix ?? "velero/" + cluster.clusterName,
                        bucket: s3Bucket.bucketName,
                        config: {
                            region: props.values.configuration.backupStorageLocation.config.region ?? cluster.stack.region,
                        }
                    },
                    volumeSnapshotLocation: {
                        config: {
                            region: props.values.configuration.backupStorageLocation.config.region ?? cluster.stack.region
                        }
                    }
                },
                // IAM role for Service Account
                serviceAccount: {
                    server: {
                        create: false,
                        name: veleroServiceAccount.serviceAccountName,
                    }
                }
            }
        };
        const values = (0, ts_deepmerge_1.merge)(props.values, valueVariable.values) ?? {};
        const chartNode = this.addHelmChart(clusterInfo, values);
        chartNode.node.addDependency(veleroServiceAccount);
        return Promise.resolve(chartNode);
    }
    /**
     * Return S3 Bucket
     * @param clusterInfo
     * @param id S3-Bucket-Postfix
     * @param existingBucketName exiting provided S3 BucketName if it exists
     * @returns the existing provided S3 bucket  or the newly created S3 bucket as s3.IBucket
     */
    getOrCreateS3Bucket(clusterInfo, id, existingBucketName) {
        if (!existingBucketName) {
            const bucket = new s3.Bucket(clusterInfo.cluster, "velero-${id}", {
                encryption: s3.BucketEncryption.KMS_MANAGED, // Velero Known bug for support with S3 with SSE-KMS with CMK, thus it does not support S3 Bucket Key: https://github.com/vmware-tanzu/helm-charts/issues/83
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Block Public Access for S3
                publicReadAccess: false,
                enforceSSL: true // Encryption in Transit
            });
            return s3.Bucket.fromBucketName(clusterInfo.cluster, 'getOrCreateS3Bucket', bucket.bucketName);
        }
        else {
            return s3.Bucket.fromBucketName(clusterInfo.cluster, 'getOrCreateS3Bucket', existingBucketName);
        }
    }
    /**
     * Return Velero Namespace where Velero will be installed onto
     * @param clusterInfo
     * @param defaultName the Default Namespace for Velero if nothing specified
     * @param namespace
     * @returns the namespace created or existed.
     */
    createNamespaceIfNeeded(clusterInfo, defaultName, namespace, create) {
        // Create Namespace if namespace is not explicied defined.
        if (namespace) {
            // Create Namespace if the "create" option is true
            if (create) {
                const namespaceManifest = (0, utils_1.createNamespace)(namespace, clusterInfo.cluster);
                return { name: namespace, manifest: namespaceManifest };
            }
            // If the "create" option if false, then namespace will not be created, return namespace.name
            else {
                return { name: namespace };
            }
        }
        else {
            return { name: defaultName }; // initial value of veleroNamespace
        }
    }
    /**
     * Return Velero Namespace where Velero will be installed onto
     * @param clusterInfo
     * @param id
     * @param namespace Velero namespace name
     * @param s3BucketName the S3 BucketName where Velero will stores the backup onto
     * @returns the service Account
     */
    createServiceAccountWithIamRoles(clusterInfo, id, namespace, s3Bucket) {
        // Setup IAM Role for Service Accounts (IRSA) for the Velero Service Account
        const veleroServiceAccount = clusterInfo.cluster.addServiceAccount(id, {
            name: id,
            namespace: namespace
        });
        // IAM policy for Velero
        const veleroPolicyDocument = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "ec2:DescribeVolumes",
                        "ec2:DescribeSnapshots",
                        "ec2:CreateTags",
                        "ec2:CreateVolume",
                        "ec2:CreateSnapshot",
                        "ec2:DeleteSnapshot"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:DeleteObject",
                        "s3:PutObject",
                        "s3:AbortMultipartUpload",
                        "s3:ListMultipartUploadParts",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        s3Bucket.arnForObjects("*"),
                        s3Bucket.bucketArn
                    ]
                }
            ]
        };
        const veleroCustomPolicyDocument = iam.PolicyDocument.fromJson(veleroPolicyDocument);
        const veleroPolicy = new iam.ManagedPolicy(clusterInfo.cluster, "velero-managed-policy", {
            document: veleroCustomPolicyDocument
        });
        veleroServiceAccount.role.addManagedPolicy(veleroPolicy);
        return veleroServiceAccount;
    }
};
exports.VeleroAddOn = VeleroAddOn;
exports.VeleroAddOn = VeleroAddOn = __decorate([
    utils_1.supportsALL
], VeleroAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3ZlbGVyby9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSwyQ0FBMkM7QUFDM0MseUNBQXlDO0FBRXpDLCtDQUFxQztBQUVyQyx1Q0FBMkQ7QUFDM0QsOENBQThEO0FBUzlEOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUc7SUFDakIsSUFBSSxFQUFFLFFBQVE7SUFDZCxPQUFPLEVBQUUsT0FBTztJQUNoQixTQUFTLEVBQUUsUUFBUTtJQUNuQixlQUFlLEVBQUUsSUFBSTtJQUNyQixLQUFLLEVBQUUsUUFBUTtJQUNmLFVBQVUsRUFBRSw2Q0FBNkM7SUFDekQsT0FBTyxFQUFFLHlCQUF5QjtJQUNsQyxNQUFNLEVBQUM7UUFDSCxjQUFjLEVBQUM7WUFDWDtnQkFDSSxJQUFJLEVBQUUsdUJBQXVCO2dCQUM3QixLQUFLLEVBQUUscUNBQXFDO2dCQUM1QyxlQUFlLEVBQUUsY0FBYztnQkFDL0IsWUFBWSxFQUFDO29CQUNUO3dCQUNJLFNBQVMsRUFBRSxTQUFTO3dCQUNwQixJQUFJLEVBQUUsU0FBUztxQkFDbEI7aUJBQ0o7YUFDSjtTQUNKO1FBQ0QsYUFBYSxFQUFFO1lBQ1gsUUFBUSxFQUFFLEtBQUs7WUFDZixxQkFBcUIsRUFBQztnQkFDbEIsSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsTUFBTSxFQUFDLEVBQUU7YUFDWjtZQUNELHNCQUFzQixFQUFDO2dCQUNuQixJQUFJLEVBQUUsU0FBUztnQkFDZixNQUFNLEVBQUMsRUFBRTthQUNaO1NBQ0o7UUFDRCxjQUFjLEVBQUU7WUFDWixNQUFNLEVBQUMsRUFBRTtTQUNaO0tBQ0o7Q0FDSixDQUFDO0FBR0ssSUFBTSxXQUFXLEdBQWpCLE1BQU0sV0FBWSxTQUFRLHNCQUFTO0lBRTlCLE9BQU8sQ0FBNkI7SUFFNUMsWUFBWSxLQUF3QjtRQUNoQyxLQUFLLENBQUMsSUFBQSxvQkFBSyxFQUFD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QUE7QUExS1ksa0NBQVc7c0JBQVgsV0FBVztJQUR2QixtQkFBVztHQUNDLFdBQVcsQ0EwS3ZCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgU2VydmljZUFjY291bnQgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgKiBhcyBpYW0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0ICogYXMgczMgZnJvbSBcImF3cy1jZGstbGliL2F3cy1zM1wiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBtZXJnZSB9IGZyb20gXCJ0cy1kZWVwbWVyZ2VcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IGNyZWF0ZU5hbWVzcGFjZSwgc3VwcG9ydHNBTEwgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tIFwiLi4vaGVsbS1hZGRvblwiO1xyXG5cclxuLyoqXHJcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGFkZC1vbi5cclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgVmVsZXJvQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7ICAgIFxyXG4gICAgY3JlYXRlTmFtZXNwYWNlOiBib29sZWFuO1xyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdHMgb3B0aW9ucyBmb3IgdGhlIGFkZC1vblxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzID0ge1xyXG4gICAgbmFtZTogJ3ZlbGVybycsXHJcbiAgICB2ZXJzaW9uOiBcIjMuMi4wXCIsXHJcbiAgICBuYW1lc3BhY2U6IFwidmVsZXJvXCIsXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U6IHRydWUsXHJcbiAgICBjaGFydDogXCJ2ZWxlcm9cIixcclxuICAgIHJlcG9zaXRvcnk6IFwiaHR0cHM6Ly92bXdhcmUtdGFuenUuZ2l0aHViLmlvL2hlbG0tY2hhcnRzL1wiLFxyXG4gICAgcmVsZWFzZTogXCJibHVlcHJpbnRzLWFkZG9uLXZlbGVyb1wiLFxyXG4gICAgdmFsdWVzOntcclxuICAgICAgICBpbml0Q29udGFpbmVyczpbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IFwidmVsZXJvLXBsdWdpbi1mb3ItYXdzXCIsXHJcbiAgICAgICAgICAgICAgICBpbWFnZTogXCJ2ZWxlcm8vdmVsZXJvLXBsdWdpbi1mb3ItYXdzOnYxLjIuMFwiLFxyXG4gICAgICAgICAgICAgICAgaW1hZ2VQdWxsUG9saWN5OiBcIklmTm90UHJlc2VudFwiLFxyXG4gICAgICAgICAgICAgICAgdm9sdW1lTW91bnRzOltcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG1vdW50UGF0aDogXCIvdGFyZ2V0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IFwicGx1Z2luc1wiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBjb25maWd1cmF0aW9uOiB7XHJcbiAgICAgICAgICAgIHByb3ZpZGVyOiBcImF3c1wiLFxyXG4gICAgICAgICAgICBiYWNrdXBTdG9yYWdlTG9jYXRpb246e1xyXG4gICAgICAgICAgICAgICAgbmFtZTogXCJkZWZhdWx0XCIsXHJcbiAgICAgICAgICAgICAgICBjb25maWc6e31cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgdm9sdW1lU25hcHNob3RMb2NhdGlvbjp7XHJcbiAgICAgICAgICAgICAgICBuYW1lOiBcImRlZmF1bHRcIixcclxuICAgICAgICAgICAgICAgIGNvbmZpZzp7fVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgc2VydmljZUFjY291bnQ6IHtcclxuICAgICAgICAgICAgc2VydmVyOnt9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxufTtcclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgVmVsZXJvQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICAgIHByaXZhdGUgb3B0aW9uczogUmVxdWlyZWQ8VmVsZXJvQWRkT25Qcm9wcz47XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBWZWxlcm9BZGRPblByb3BzKSB7XHJcbiAgICAgICAgc3VwZXIobWVyZ2UoZGVmYXVsdFByb3BzLCBwcm9wcyA/PyB7fSkpO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgUmVxdWlyZWQ8VmVsZXJvQWRkT25Qcm9wcz47XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBJbXBsZW1lbnRhdGlvbiBvZiB0aGUgYWRkLW9uIGNvbnRyYWN0IGRlcGxveSBtZXRob2QuXHJcbiAgICAqL1xyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICAgICAgY29uc3QgcHJvcHMgPSB0aGlzLm9wdGlvbnM7XHJcbiAgICAgICAgICAgICAgIFxyXG4gICAgICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgaWYgbm8gZXhpc3RpbmcgYnVja2V0LCBjcmVhdGUgczMgYnVja2V0IGFuZCBjb3JyZXNwb25kaW5nIEtNUyBrZXlcclxuICAgICAgICBjb25zdCBzM0J1Y2tldCA9IHRoaXMuZ2V0T3JDcmVhdGVTM0J1Y2tldChjbHVzdGVySW5mbywgXCJiYWNrdXAtYnVja2V0XCIsIHByb3BzLnZhbHVlcy5jb25maWd1cmF0aW9uLmJhY2t1cFN0b3JhZ2VMb2NhdGlvbi5idWNrZXQpO1xyXG5cclxuICAgICAgICAvLyBDcmVhdGUgTmFtZXNwYWNlIGlmIG5hbWVzcGFjZSBpcyBub3QgZXhwbGljaWVkIGRlZmluZWQuXHJcbiAgICAgICAgY29uc3QgdmVsZXJvTmFtZXNwYWNlID0gdGhpcy5jcmVhdGVOYW1lc3BhY2VJZk5lZWRlZChjbHVzdGVySW5mbywgXCJ2ZWxlcm9cIiwgcHJvcHMubmFtZXNwYWNlLCBwcm9wcy5jcmVhdGVOYW1lc3BhY2UpO1xyXG5cclxuICAgICAgICAvLyBTZXR1cCBJQU0gUm9sZSBmb3IgU2VydmljZSBBY2NvdW50cyAoSVJTQSkgZm9yIHRoZSBWZWxlcm8gU2VydmljZSBBY2NvdW50ICAgIFxyXG4gICAgICAgIGNvbnN0IHZlbGVyb1NlcnZpY2VBY2NvdW50ID0gdGhpcy5jcmVhdGVTZXJ2aWNlQWNjb3VudFdpdGhJYW1Sb2xlcyhjbHVzdGVySW5mbywgXCJ2ZWxlcm8tYWNjb3VudFwiLCB2ZWxlcm9OYW1lc3BhY2UubmFtZSwgczNCdWNrZXQpO1xyXG4gICAgICAgIFxyXG4gICAgICAgIC8vIGlmIHZlbGVyb05hbWUgc3BhY2UgZG9lcyBub3QgZXhpc3QgYW5kIG5lZWRzIGNyZWF0aW9uLCBhZGQgdGhlIGRlcGVuZGVuY3lcclxuICAgICAgICBpZiAodmVsZXJvTmFtZXNwYWNlLm1hbmlmZXN0KSB7XHJcbiAgICAgICAgICAgIHZlbGVyb1NlcnZpY2VBY2NvdW50Lm5vZGUuYWRkRGVwZW5kZW5jeSh2ZWxlcm9OYW1lc3BhY2UubWFuaWZlc3QpO1xyXG4gICAgICAgIH1cclxuICAgICAgICBcclxuICAgICAgICAvLyBTZXR1cCB0aGUgdmFsdWVzIGZvciB0aGUgaGVsbSBjaGFydFxyXG4gICAgICAgIGNvbnN0IHZhbHVlVmFyaWFibGUgPSB7XHJcbiAgICAgICAgICAgIHZhbHVlczoge1xyXG4gICAgICAgICAgICAgICAgY29uZmlndXJhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIGJhY2t1cFN0b3JhZ2VMb2NhdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcmVmaXg6IHByb3BzLnZhbHVlcyEuY29uZmlndXJhdGlvbi5iYWNrdXBTdG9yYWdlTG9jYXRpb24ucHJlZml4ID8/IFwidmVsZXJvL1wiICsgY2x1c3Rlci5jbHVzdGVyTmFtZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgYnVja2V0OiBzM0J1Y2tldC5idWNrZXROYW1lLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBjb25maWc6e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICByZWdpb246IHByb3BzLnZhbHVlcyEuY29uZmlndXJhdGlvbi5iYWNrdXBTdG9yYWdlTG9jYXRpb24uY29uZmlnLnJlZ2lvbiA/PyBjbHVzdGVyLnN0YWNrLnJlZ2lvbixcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgdm9sdW1lU25hcHNob3RMb2NhdGlvbjp7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbmZpZzp7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWdpb246IHByb3BzLnZhbHVlcyEuY29uZmlndXJhdGlvbi5iYWNrdXBTdG9yYWdlTG9jYXRpb24uY29uZmlnLnJlZ2lvbiA/PyBjbHVzdGVyLnN0YWNrLnJlZ2lvblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIC8vIElBTSByb2xlIGZvciBTZXJ2aWNlIEFjY291bnRcclxuICAgICAgICAgICAgICAgIHNlcnZpY2VBY2NvdW50OiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNyZWF0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6IHZlbGVyb1NlcnZpY2VBY2NvdW50LnNlcnZpY2VBY2NvdW50TmFtZSwgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH07XHJcblxyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IG1lcmdlKHByb3BzLnZhbHVlcyEsIHZhbHVlVmFyaWFibGUudmFsdWVzKSA/PyB7fTsgXHJcbiBcclxuICAgICAgICBjb25zdCBjaGFydE5vZGUgPSB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgdmFsdWVzKTtcclxuICAgICAgICBjaGFydE5vZGUubm9kZS5hZGREZXBlbmRlbmN5KHZlbGVyb1NlcnZpY2VBY2NvdW50KTtcclxuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKGNoYXJ0Tm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXR1cm4gUzMgQnVja2V0XHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm8gXHJcbiAgICAgKiBAcGFyYW0gaWQgUzMtQnVja2V0LVBvc3RmaXggXHJcbiAgICAgKiBAcGFyYW0gZXhpc3RpbmdCdWNrZXROYW1lIGV4aXRpbmcgcHJvdmlkZWQgUzMgQnVja2V0TmFtZSBpZiBpdCBleGlzdHMgXHJcbiAgICAgKiBAcmV0dXJucyB0aGUgZXhpc3RpbmcgcHJvdmlkZWQgUzMgYnVja2V0ICBvciB0aGUgbmV3bHkgY3JlYXRlZCBTMyBidWNrZXQgYXMgczMuSUJ1Y2tldFxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgZ2V0T3JDcmVhdGVTM0J1Y2tldChjbHVzdGVySW5mbzogQ2x1c3RlckluZm8sIGlkOiBzdHJpbmcsIGV4aXN0aW5nQnVja2V0TmFtZTogbnVsbHxzdHJpbmcgKTogczMuSUJ1Y2tldCB7XHJcbiAgICAgICAgaWYgKCFleGlzdGluZ0J1Y2tldE5hbWUpe1xyXG4gICAgICAgICAgICBjb25zdCBidWNrZXQgPSBuZXcgczMuQnVja2V0KGNsdXN0ZXJJbmZvLmNsdXN0ZXIsIFwidmVsZXJvLSR7aWR9XCIsIHtcclxuICAgICAgICAgICAgICAgIGVuY3J5cHRpb246IHMzLkJ1Y2tldEVuY3J5cHRpb24uS01TX01BTkFHRUQsIC8vIFZlbGVybyBLbm93biBidWcgZm9yIHN1cHBvcnQgd2l0aCBTMyB3aXRoIFNTRS1LTVMgd2l0aCBDTUssIHRodXMgaXQgZG9lcyBub3Qgc3VwcG9ydCBTMyBCdWNrZXQgS2V5OiBodHRwczovL2dpdGh1Yi5jb20vdm13YXJlLXRhbnp1L2hlbG0tY2hhcnRzL2lzc3Vlcy84M1xyXG4gICAgICAgICAgICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCwgLy8gQmxvY2sgUHVibGljIEFjY2VzcyBmb3IgUzNcclxuICAgICAgICAgICAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZW5mb3JjZVNTTDogdHJ1ZSAvLyBFbmNyeXB0aW9uIGluIFRyYW5zaXRcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJldHVybiBzMy5CdWNrZXQuZnJvbUJ1Y2tldE5hbWUoY2x1c3RlckluZm8uY2x1c3RlciwgJ2dldE9yQ3JlYXRlUzNCdWNrZXQnLCBidWNrZXQuYnVja2V0TmFtZSApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgcmV0dXJuIHMzLkJ1Y2tldC5mcm9tQnVja2V0TmFtZShjbHVzdGVySW5mby5jbHVzdGVyLCAnZ2V0T3JDcmVhdGVTM0J1Y2tldCcsIGV4aXN0aW5nQnVja2V0TmFtZSApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiBWZWxlcm8gTmFtZXNwYWNlIHdoZXJlIFZlbGVybyB3aWxsIGJlIGluc3RhbGxlZCBvbnRvXHJcbiAgICAgKiBAcGFyYW0gY2x1c3RlckluZm9cclxuICAgICAqIEBwYXJhbSBkZWZhdWx0TmFtZSB0aGUgRGVmYXVsdCBOYW1lc3BhY2UgZm9yIFZlbGVybyBpZiBub3RoaW5nIHNwZWNpZmllZCBcclxuICAgICAqIEBwYXJhbSBuYW1lc3BhY2VcclxuICAgICAqIEByZXR1cm5zIHRoZSBuYW1lc3BhY2UgY3JlYXRlZCBvciBleGlzdGVkLlxyXG4gICAgICovXHJcbiAgICBwcm90ZWN0ZWQgY3JlYXRlTmFtZXNwYWNlSWZOZWVkZWQoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvLCBkZWZhdWx0TmFtZTogc3RyaW5nLCBuYW1lc3BhY2U6IHN0cmluZywgY3JlYXRlOiBib29sZWFuKToge25hbWU6IHN0cmluZywgbWFuaWZlc3Q/OiBDb25zdHJ1Y3R9IHtcclxuICAgICAgICAvLyBDcmVhdGUgTmFtZXNwYWNlIGlmIG5hbWVzcGFjZSBpcyBub3QgZXhwbGljaWVkIGRlZmluZWQuXHJcbiAgICAgICAgaWYgKG5hbWVzcGFjZSl7XHJcbiAgICAgICAgICAgIC8vIENyZWF0ZSBOYW1lc3BhY2UgaWYgdGhlIFwiY3JlYXRlXCIgb3B0aW9uIGlzIHRydWVcclxuICAgICAgICAgICAgaWYgKGNyZWF0ZSkge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbmFtZXNwYWNlTWFuaWZlc3QgPSBjcmVhdGVOYW1lc3BhY2UobmFtZXNwYWNlLCBjbHVzdGVySW5mby5jbHVzdGVyKTtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IG5hbWVzcGFjZSwgbWFuaWZlc3Q6IG5hbWVzcGFjZU1hbmlmZXN0IH07XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gSWYgdGhlIFwiY3JlYXRlXCIgb3B0aW9uIGlmIGZhbHNlLCB0aGVuIG5hbWVzcGFjZSB3aWxsIG5vdCBiZSBjcmVhdGVkLCByZXR1cm4gbmFtZXNwYWNlLm5hbWVcclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IG5hbWVzcGFjZSB9O1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIHJldHVybiB7IG5hbWU6IGRlZmF1bHROYW1lIH07IC8vIGluaXRpYWwgdmFsdWUgb2YgdmVsZXJvTmFtZXNwYWNlXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmV0dXJuIFZlbGVybyBOYW1lc3BhY2Ugd2hlcmUgVmVsZXJvIHdpbGwgYmUgaW5zdGFsbGVkIG9udG9cclxuICAgICAqIEBwYXJhbSBjbHVzdGVySW5mb1xyXG4gICAgICogQHBhcmFtIGlkXHJcbiAgICAgKiBAcGFyYW0gbmFtZXNwYWNlIFZlbGVybyBuYW1lc3BhY2UgbmFtZVxyXG4gICAgICogQHBhcmFtIHMzQnVja2V0TmFtZSB0aGUgUzMgQnVja2V0TmFtZSB3aGVyZSBWZWxlcm8gd2lsbCBzdG9yZXMgdGhlIGJhY2t1cCBvbnRvXHJcbiAgICAgKiBAcmV0dXJucyB0aGUgc2VydmljZSBBY2NvdW50XHJcbiAgICAgKi9cclxuICAgIHByb3RlY3RlZCBjcmVhdGVTZXJ2aWNlQWNjb3VudFdpdGhJYW1Sb2xlcyhjbHVzdGVySW5mbzogQ2x1c3RlckluZm8sIGlkOiBzdHJpbmcsIG5hbWVzcGFjZTogc3RyaW5nLCBzM0J1Y2tldDogczMuSUJ1Y2tldCk6IFNlcnZpY2VBY2NvdW50IHtcclxuICAgICAgICAvLyBTZXR1cCBJQU0gUm9sZSBmb3IgU2VydmljZSBBY2NvdW50cyAoSVJTQSkgZm9yIHRoZSBWZWxlcm8gU2VydmljZSBBY2NvdW50XHJcbiAgICAgICAgY29uc3QgdmVsZXJvU2VydmljZUFjY291bnQgPSBjbHVzdGVySW5mby5jbHVzdGVyLmFkZFNlcnZpY2VBY2NvdW50IChcclxuICAgICAgICAgICAgaWQsXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IGlkLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiBuYW1lc3BhY2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIC8vIElBTSBwb2xpY3kgZm9yIFZlbGVyb1xyXG4gICAgICAgIGNvbnN0IHZlbGVyb1BvbGljeURvY3VtZW50ID0ge1xyXG4gICAgICAgICAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXHJcbiAgICAgICAgICAgIFwiU3RhdGVtZW50XCI6IFtcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcclxuICAgICAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVzY3JpYmVWb2x1bWVzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBcImVjMjpEZXNjcmliZVNuYXBzaG90c1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlVGFnc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgXCJlYzI6Q3JlYXRlVm9sdW1lXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICBcImVjMjpDcmVhdGVTbmFwc2hvdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgXCJlYzI6RGVsZXRlU25hcHNob3RcIlxyXG4gICAgICAgICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFwiKlwiXHJcbiAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgICAgICBcIkFjdGlvblwiOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzMzpHZXRPYmplY3RcIixcclxuICAgICAgICAgICAgICAgICAgICBcInMzOkRlbGV0ZU9iamVjdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiczM6UHV0T2JqZWN0XCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzMzpBYm9ydE11bHRpcGFydFVwbG9hZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiczM6TGlzdE11bHRpcGFydFVwbG9hZFBhcnRzXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJzMzpMaXN0QnVja2V0XCJcclxuICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICBcIlJlc291cmNlXCI6IFtcclxuICAgICAgICAgICAgICAgICAgICBzM0J1Y2tldC5hcm5Gb3JPYmplY3RzKFwiKlwiKSxcclxuICAgICAgICAgICAgICAgICAgICBzM0J1Y2tldC5idWNrZXRBcm4gICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBdXHJcbiAgICAgICAgfTtcclxuXHJcbiAgICAgICAgY29uc3QgdmVsZXJvQ3VzdG9tUG9saWN5RG9jdW1lbnQgPSBpYW0uUG9saWN5RG9jdW1lbnQuZnJvbUpzb24odmVsZXJvUG9saWN5RG9jdW1lbnQpO1xyXG4gICAgICAgIGNvbnN0IHZlbGVyb1BvbGljeSA9IG5ldyBpYW0uTWFuYWdlZFBvbGljeShjbHVzdGVySW5mby5jbHVzdGVyLCBcInZlbGVyby1tYW5hZ2VkLXBvbGljeVwiLCB7XHJcbiAgICAgICAgICAgIGRvY3VtZW50OiB2ZWxlcm9DdXN0b21Qb2xpY3lEb2N1bWVudFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHZlbGVyb1NlcnZpY2VBY2NvdW50LnJvbGUuYWRkTWFuYWdlZFBvbGljeSh2ZWxlcm9Qb2xpY3kpO1xyXG4gICAgICAgIHJldHVybiB2ZWxlcm9TZXJ2aWNlQWNjb3VudDtcclxuICAgIH1cclxufSJdfQ==