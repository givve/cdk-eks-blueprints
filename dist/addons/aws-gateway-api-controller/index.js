"use strict";
// https://www.gateway-api-controller.eks.aws.dev/latest/guides/deploy/#setup
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsGatewayApiControllerAddOn = void 0;
const helm_addon_1 = require("../helm-addon");
const iam_policy_1 = require("./iam-policy");
const gateway_api_crds_1 = require("../gateway-api-crds");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const customResources = require("aws-cdk-lib/custom-resources");
const ec2 = require("aws-cdk-lib/aws-ec2");
const utils_1 = require("../../utils");
const AWS_GATEWAY_API_CONTROLLER_SA = 'gateway-api-controller';
const defaultProps = {
    name: 'aws-gateway-api-controller',
    namespace: 'aws-application-networking-system',
    chart: 'aws-gateway-controller-chart',
    version: 'v1.1.4',
    repository: 'oci://public.ecr.aws/aws-application-networking-k8s/aws-gateway-controller-chart',
    values: {},
    defaultServiceNetwork: '',
    enableServiceNetworkOverride: false,
    webhookEnabled: false,
    disableTaggingServiceApi: false,
    routeMaxConcurrentReconciles: 1,
};
class AwsGatewayApiControllerAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        // Step 1: Configure Security Groups for VPC Lattice 
        this.configureSecurityGroup(clusterInfo);
        // Step 2: Create namespace
        const namespace = this.createNamespace(clusterInfo);
        // Step 3: Set up IAM permissions
        const serviceAccount = this.setupIamPermissions(clusterInfo);
        // Step 4: Create GatewayClass that uses the official K8s Gateway API
        this.createGatewayClass(clusterInfo);
        // Step 5: Deploy the controller
        const chartValues = this.populateValues(serviceAccount);
        const awsGatewayApiController = this.addHelmChart(clusterInfo, chartValues);
        // Set up dependencies:
        serviceAccount.node.addDependency(namespace);
        awsGatewayApiController.node.addDependency(serviceAccount);
        return Promise.resolve(awsGatewayApiController);
    }
    /**
     * CDK does not provide native way to get managed prefix list as of 3/11/2025
     * PR seems to be almost done: https://github.com/aws/aws-cdk/pull/33619
     * Using CRD workaround as described here for now: https://gist.github.com/bericp1/eb0ce72079161f45f4867a9e3ab02bd9
     * */
    configureSecurityGroup(clusterInfo) {
        const clusterSg = clusterInfo.cluster.clusterSecurityGroup;
        const region = aws_cdk_lib_1.Stack.of(clusterInfo.cluster).region;
        // Create the prefix list lookup custom resource
        const vpcLatticePrefixListCall = new customResources.AwsCustomResource(clusterInfo.cluster.stack, 'GetVpcLatticePrefixListIDs', {
            resourceType: 'Custom::GetVpcLatticePrefixListIDs',
            onUpdate: {
                region,
                service: 'EC2',
                action: 'describeManagedPrefixLists',
                parameters: {
                    Filters: [
                        {
                            Name: 'prefix-list-name',
                            Values: [
                                `com.amazonaws.${region}.vpc-lattice`,
                                `com.amazonaws.${region}.ipv6.vpc-lattice`
                            ],
                        },
                    ],
                },
                physicalResourceId: customResources.PhysicalResourceId.of('GetVpcLatticePrefixListIDsFunction')
            },
            policy: customResources.AwsCustomResourcePolicy.fromSdkCalls({
                resources: customResources.AwsCustomResourcePolicy.ANY_RESOURCE
            })
        });
        // Get the prefix list IDs from the custom resource response
        const prefixListIds = [
            vpcLatticePrefixListCall.getResponseField('PrefixLists.0.PrefixListId'),
            vpcLatticePrefixListCall.getResponseField('PrefixLists.1.PrefixListId'),
        ];
        // Add security group rules for each prefix list
        prefixListIds.forEach(prefixListId => {
            // Add ingress rule
            clusterSg.addIngressRule(ec2.Peer.prefixList(prefixListId.toString()), ec2.Port.allTraffic(), 'Allow inbound from VPC Lattice');
            // Add egress rule
            clusterSg.addEgressRule(ec2.Peer.prefixList(prefixListId.toString()), ec2.Port.allTraffic(), 'Allow outbound to VPC Lattice');
        });
        return vpcLatticePrefixListCall;
    }
    // https://github.com/aws/aws-application-networking-k8s/blob/main/files/controller-installation/deploy-namesystem.yaml
    createNamespace(clusterInfo) {
        return clusterInfo.cluster.addManifest('aws-application-networking-system-namespace', {
            apiVersion: 'v1',
            kind: 'Namespace',
            metadata: {
                name: this.options.namespace,
                labels: {
                    'control-plane': 'gateway-api-controller'
                }
            }
        });
    }
    // https://github.com/aws/aws-application-networking-k8s/blob/main/files/controller-installation/recommended-inline-policy.json
    setupIamPermissions(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const serviceAccount = cluster.addServiceAccount(AWS_GATEWAY_API_CONTROLLER_SA, {
            name: AWS_GATEWAY_API_CONTROLLER_SA,
            namespace: this.options.namespace,
        });
        (0, iam_policy_1.getVpcLatticeControllerPolicy)().forEach((statement) => {
            serviceAccount.addToPrincipalPolicy(statement);
        });
        return serviceAccount;
    }
    // Sets Helm and AWS Gateway API Controller Configuration 
    // https://www.gateway-api-controller.eks.aws.dev/latest/guides/environment/
    populateValues(serviceAccount) {
        const values = this.options.values ?? {};
        values.serviceAccount = {
            create: false,
            name: serviceAccount.serviceAccountName
        };
        if (this.options.logLevel) {
            values.logLevel = this.options.logLevel;
        }
        if (this.options.defaultServiceNetwork) {
            values.defaultServiceNetwork = this.options.defaultServiceNetwork;
        }
        if (this.options.enableServiceNetworkOverride) {
            values.enableServiceNetworkOverride = this.options.enableServiceNetworkOverride;
        }
        if (this.options.webhookEnabled) {
            values.webhookEnabled = this.options.webhookEnabled;
        }
        if (this.options.disableTaggingServiceApi) {
            values.disableTaggingServiceApi = this.options.disableTaggingServiceApi;
        }
        if (this.options.routeMaxConcurrentReconciles) {
            values.routeMaxConcurrentReconciles = this.options.routeMaxConcurrentReconciles;
        }
        return values;
    }
    // https://github.com/aws/aws-application-networking-k8s/blob/main/files/controller-installation/gatewayclass.yaml
    createGatewayClass(clusterInfo) {
        return clusterInfo.cluster.addManifest('vpc-lattice-gateway-class', {
            apiVersion: 'gateway.networking.k8s.io/v1beta1',
            kind: 'GatewayClass',
            metadata: {
                name: 'amazon-vpc-lattice'
            },
            spec: {
                controllerName: 'application-networking.k8s.aws/gateway-api-controller'
            }
        });
    }
}
exports.AwsGatewayApiControllerAddOn = AwsGatewayApiControllerAddOn;
__decorate([
    (0, utils_1.dependable)(gateway_api_crds_1.GatewayApiCrdsAddOn.name)
], AwsGatewayApiControllerAddOn.prototype, "deploy", null);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2F3cy1nYXRld2F5LWFwaS1jb250cm9sbGVyL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSw2RUFBNkU7Ozs7Ozs7OztBQUk3RSw4Q0FBOEQ7QUFFOUQsNkNBQTZEO0FBQzdELDBEQUEwRDtBQUMxRCw2Q0FBb0M7QUFDcEMsZ0VBQWdFO0FBQ2hFLDJDQUEyQztBQUMzQyx1Q0FBeUM7QUFHekMsTUFBTSw2QkFBNkIsR0FBRyx3QkFBd0IsQ0FBQztBQXlDL0QsTUFBTSxZQUFZLEdBQXNDO0lBQ3BELElBQUksRUFBRSw0QkFBNEI7SUFDbEMsU0FBUyxFQUFFLG1DQUFtQztJQUM5QyxLQUFLLEVBQUUsOEJBQThCO0lBQ3JDLE9BQU8sRUFBRSxRQUFRO0lBQ2pCLFVBQVUsRUFBRSxrRkFBa0Y7SUFDOUYsTUFBTSxFQUFFLEVBQUU7SUFDVixxQkFBcUIsRUFBRSxFQUFFO0lBQ3pCLDRCQUE0QixFQUFFLEtBQUs7SUFDbkMsY0FBYyxFQUFFLEtBQUs7SUFDckIsd0JBQXdCLEVBQUUsS0FBSztJQUMvQiw0QkFBNEIsRUFBRSxDQUFDO0NBQ2xDLENBQUM7QUFFRixNQUFhLDRCQUE2QixTQUFRLHNCQUFTO0lBQzlDLE9BQU8sQ0FBb0M7SUFFcEQsWUFBWSxLQUF5QztRQUNqRCxLQUFLLENBQUMsRUFBRSxHQUFJLFlBQW9CLEVBQUUsR0FBRyxLQUFLLEVBQUMsQ0FBQyxDQUFDO1FBQzdDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQTBDLENBQUM7SUFDbkUsQ0FBQztJQUdELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixxREFBcUQ7UUFDckQsSUFBSSxDQUFDLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXpDLDJCQUEyQjtRQUMzQixNQUFNLFNBQVMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRXBE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aS1jb250cm9sbGVyLmVrcy5hd3MuZGV2L2xhdGVzdC9ndWlkZXMvZGVwbG95LyNzZXR1cFxyXG5cclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8sIFZhbHVlcyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgSGVsbUFkZE9uLCBIZWxtQWRkT25Vc2VyUHJvcHMgfSBmcm9tIFwiLi4vaGVsbS1hZGRvblwiO1xyXG5pbXBvcnQgeyBTZXJ2aWNlQWNjb3VudCB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcbmltcG9ydCB7IGdldFZwY0xhdHRpY2VDb250cm9sbGVyUG9saWN5IH0gZnJvbSBcIi4vaWFtLXBvbGljeVwiO1xyXG5pbXBvcnQgeyBHYXRld2F5QXBpQ3Jkc0FkZE9uIH0gZnJvbSBcIi4uL2dhdGV3YXktYXBpLWNyZHNcIjtcclxuaW1wb3J0IHsgU3RhY2sgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0ICogYXMgY3VzdG9tUmVzb3VyY2VzIGZyb20gJ2F3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXMnO1xyXG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XHJcbmltcG9ydCB7IGRlcGVuZGFibGUgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuXHJcblxyXG5jb25zdCBBV1NfR0FURVdBWV9BUElfQ09OVFJPTExFUl9TQSA9ICdnYXRld2F5LWFwaS1jb250cm9sbGVyJztcclxuXHJcbi8vIGh0dHBzOi8vd3d3LmdhdGV3YXktYXBpLWNvbnRyb2xsZXIuZWtzLmF3cy5kZXYvbGF0ZXN0L2d1aWRlcy9lbnZpcm9ubWVudC8jZW52aXJvbm1lbnQtdmFyaWFibGVzXHJcbmV4cG9ydCBpbnRlcmZhY2UgQXdzR2F0ZXdheUFwaUNvbnRyb2xsZXJBZGRPblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogTG9nIGxldmVsIGNvbmZpZ3VyYXRpb25cclxuICAgICAqIEBkZWZhdWx0IFwiaW5mb1wiXHJcbiAgICAgKi9cclxuICAgIGxvZ0xldmVsPzogJ2luZm8nIHwgJ2RlYnVnJztcclxuXHJcbiAgICAvKipcclxuICAgICAqIERlZmF1bHQgc2VydmljZSBuZXR3b3JrIG5hbWVcclxuICAgICAqIEBkZWZhdWx0IFwiXCJcclxuICAgICAqL1xyXG4gICAgZGVmYXVsdFNlcnZpY2VOZXR3b3JrPzogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIHNpbmdsZSBzZXJ2aWNlIG5ldHdvcmsgbW9kZVxyXG4gICAgICogQGRlZmF1bHQgXCJmYWxzZVwiXHJcbiAgICAgKi9cclxuICAgIGVuYWJsZVNlcnZpY2VOZXR3b3JrT3ZlcnJpZGU/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogRW5hYmxlIHdlYmhvb2sgbGlzdGVuZXIgZm9yIHBvZCByZWFkaW5lc3MgZ2F0ZSBpbmplY3Rpb25cclxuICAgICAqIEBkZWZhdWx0IFwiZmFsc2VcIlxyXG4gICAgICovXHJcbiAgICB3ZWJob29rRW5hYmxlZD86IGJvb2xlYW47XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEaXNhYmxlIEFXUyBSZXNvdXJjZSBHcm91cHMgVGFnZ2luZyBBUElcclxuICAgICAqIEBkZWZhdWx0IFwiZmFsc2VcIlxyXG4gICAgICovXHJcbiAgICBkaXNhYmxlVGFnZ2luZ1NlcnZpY2VBcGk/OiBib29sZWFuO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTWF4aW11bSBudW1iZXIgb2YgY29uY3VycmVudCByZWNvbmNpbGUgbG9vcHMgcGVyIHJvdXRlIHR5cGVcclxuICAgICAqIEBkZWZhdWx0IDFcclxuICAgICAqL1xyXG4gICAgcm91dGVNYXhDb25jdXJyZW50UmVjb25jaWxlcz86IG51bWJlcjtcclxufVxyXG5cclxuY29uc3QgZGVmYXVsdFByb3BzOiBBd3NHYXRld2F5QXBpQ29udHJvbGxlckFkZE9uUHJvcHMgPSB7XHJcbiAgICBuYW1lOiAnYXdzLWdhdGV3YXktYXBpLWNvbnRyb2xsZXInLFxyXG4gICAgbmFtZXNwYWNlOiAnYXdzLWFwcGxpY2F0aW9uLW5ldHdvcmtpbmctc3lzdGVtJyxcclxuICAgIGNoYXJ0OiAnYXdzLWdhdGV3YXktY29udHJvbGxlci1jaGFydCcsXHJcbiAgICB2ZXJzaW9uOiAndjEuMS40JyxcclxuICAgIHJlcG9zaXRvcnk6ICdvY2k6Ly9wdWJsaWMuZWNyLmF3cy9hd3MtYXBwbGljYXRpb24tbmV0d29ya2luZy1rOHMvYXdzLWdhdGV3YXktY29udHJvbGxlci1jaGFydCcsXHJcbiAgICB2YWx1ZXM6IHt9LFxyXG4gICAgZGVmYXVsdFNlcnZpY2VOZXR3b3JrOiAnJyxcclxuICAgIGVuYWJsZVNlcnZpY2VOZXR3b3JrT3ZlcnJpZGU6IGZhbHNlLFxyXG4gICAgd2ViaG9va0VuYWJsZWQ6IGZhbHNlLFxyXG4gICAgZGlzYWJsZVRhZ2dpbmdTZXJ2aWNlQXBpOiBmYWxzZSxcclxuICAgIHJvdXRlTWF4Q29uY3VycmVudFJlY29uY2lsZXM6IDEsXHJcbn07XHJcblxyXG5leHBvcnQgY2xhc3MgQXdzR2F0ZXdheUFwaUNvbnRyb2xsZXJBZGRPbiBleHRlbmRzIEhlbG1BZGRPbiB7XHJcbiAgICByZWFkb25seSBvcHRpb25zOiBBd3NHYXRld2F5QXBpQ29udHJvbGxlckFkZE9uUHJvcHM7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJvcHM/OiBBd3NHYXRld2F5QXBpQ29udHJvbGxlckFkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7IC4uLihkZWZhdWx0UHJvcHMgYXMgYW55KSwgLi4ucHJvcHN9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzIGFzIEF3c0dhdGV3YXlBcGlDb250cm9sbGVyQWRkT25Qcm9wcztcclxuICAgIH1cclxuXHJcbiAgICBAZGVwZW5kYWJsZShHYXRld2F5QXBpQ3Jkc0FkZE9uLm5hbWUpXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgICAgICAvLyBTdGVwIDE6IENvbmZpZ3VyZSBTZWN1cml0eSBHcm91cHMgZm9yIFZQQyBMYXR0aWNlIFxyXG4gICAgICAgIHRoaXMuY29uZmlndXJlU2VjdXJpdHlHcm91cChjbHVzdGVySW5mbyk7XHJcblxyXG4gICAgICAgIC8vIFN0ZXAgMjogQ3JlYXRlIG5hbWVzcGFjZVxyXG4gICAgICAgIGNvbnN0IG5hbWVzcGFjZSA9IHRoaXMuY3JlYXRlTmFtZXNwYWNlKGNsdXN0ZXJJbmZvKTtcclxuXHJcbiAgICAgICAgLy8gU3RlcCAzOiBTZXQgdXAgSUFNIHBlcm1pc3Npb25zXHJcbiAgICAgICAgY29uc3Qgc2VydmljZUFjY291bnQgPSB0aGlzLnNldHVwSWFtUGVybWlzc2lvbnMoY2x1c3RlckluZm8pO1xyXG5cclxuICAgICAgICAvLyBTdGVwIDQ6IENyZWF0ZSBHYXRld2F5Q2xhc3MgdGhhdCB1c2VzIHRoZSBvZmZpY2lhbCBLOHMgR2F0ZXdheSBBUElcclxuICAgICAgICB0aGlzLmNyZWF0ZUdhdGV3YXlDbGFzcyhjbHVzdGVySW5mbyk7XHJcblxyXG4gICAgICAgIC8vIFN0ZXAgNTogRGVwbG95IHRoZSBjb250cm9sbGVyXHJcbiAgICAgICAgY29uc3QgY2hhcnRWYWx1ZXMgPSB0aGlzLnBvcHVsYXRlVmFsdWVzKHNlcnZpY2VBY2NvdW50KTtcclxuICAgICAgICBjb25zdCBhd3NHYXRld2F5QXBpQ29udHJvbGxlciA9IHRoaXMuYWRkSGVsbUNoYXJ0KGNsdXN0ZXJJbmZvLCBjaGFydFZhbHVlcyk7XHJcblxyXG4gICAgICAgIC8vIFNldCB1cCBkZXBlbmRlbmNpZXM6XHJcbiAgICAgICAgc2VydmljZUFjY291bnQubm9kZS5hZGREZXBlbmRlbmN5KG5hbWVzcGFjZSk7XHJcbiAgICAgICAgYXdzR2F0ZXdheUFwaUNvbnRyb2xsZXIubm9kZS5hZGREZXBlbmRlbmN5KHNlcnZpY2VBY2NvdW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShhd3NHYXRld2F5QXBpQ29udHJvbGxlcik7XHJcbiAgICB9XHJcblxyXG4gICAgLyoqIFxyXG4gICAgICogQ0RLIGRvZXMgbm90IHByb3ZpZGUgbmF0aXZlIHdheSB0byBnZXQgbWFuYWdlZCBwcmVmaXggbGlzdCBhcyBvZiAzLzExLzIwMjVcclxuICAgICAqIFBSIHNlZW1zIHRvIGJlIGFsbW9zdCBkb25lOiBodHRwczovL2dpdGh1Yi5jb20vYXdzL2F3cy1jZGsvcHVsbC8zMzYxOVxyXG4gICAgICogVXNpbmcgQ1JEIHdvcmthcm91bmQgYXMgZGVzY3JpYmVkIGhlcmUgZm9yIG5vdzogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vYmVyaWNwMS9lYjBjZTcyMDc5MTYxZjQ1ZjQ4NjdhOWUzYWIwMmJkOVxyXG4gICAgICogKi8gXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZVNlY3VyaXR5R3JvdXAoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKSB7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlclNnID0gY2x1c3RlckluZm8uY2x1c3Rlci5jbHVzdGVyU2VjdXJpdHlHcm91cDtcclxuICAgICAgICBjb25zdCByZWdpb24gPSBTdGFjay5vZihjbHVzdGVySW5mby5jbHVzdGVyKS5yZWdpb247XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSB0aGUgcHJlZml4IGxpc3QgbG9va3VwIGN1c3RvbSByZXNvdXJjZVxyXG4gICAgICAgIGNvbnN0IHZwY0xhdHRpY2VQcmVmaXhMaXN0Q2FsbCA9IG5ldyBjdXN0b21SZXNvdXJjZXMuQXdzQ3VzdG9tUmVzb3VyY2UoY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjaywgJ0dldFZwY0xhdHRpY2VQcmVmaXhMaXN0SURzJywge1xyXG4gICAgICAgICAgICByZXNvdXJjZVR5cGU6ICdDdXN0b206OkdldFZwY0xhdHRpY2VQcmVmaXhMaXN0SURzJyxcclxuICAgICAgICAgICAgb25VcGRhdGU6IHtcclxuICAgICAgICAgICAgICAgIHJlZ2lvbixcclxuICAgICAgICAgICAgICAgIHNlcnZpY2U6ICdFQzInLFxyXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAnZGVzY3JpYmVNYW5hZ2VkUHJlZml4TGlzdHMnLFxyXG4gICAgICAgICAgICAgICAgcGFyYW1ldGVyczoge1xyXG4gICAgICAgICAgICAgICAgICAgIEZpbHRlcnM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgTmFtZTogJ3ByZWZpeC1saXN0LW5hbWUnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgVmFsdWVzOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYGNvbS5hbWF6b25hd3MuJHtyZWdpb259LnZwYy1sYXR0aWNlYCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBgY29tLmFtYXpvbmF3cy4ke3JlZ2lvbn0uaXB2Ni52cGMtbGF0dGljZWBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IGN1c3RvbVJlc291cmNlcy5QaHlzaWNhbFJlc291cmNlSWQub2YoJ0dldFZwY0xhdHRpY2VQcmVmaXhMaXN0SURzRnVuY3Rpb24nKVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBwb2xpY3k6IGN1c3RvbVJlc291cmNlcy5Bd3NDdXN0b21SZXNvdXJjZVBvbGljeS5mcm9tU2RrQ2FsbHMoe1xyXG4gICAgICAgICAgICAgICAgcmVzb3VyY2VzOiBjdXN0b21SZXNvdXJjZXMuQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kuQU5ZX1JFU09VUkNFXHJcbiAgICAgICAgICAgIH0pXHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIC8vIEdldCB0aGUgcHJlZml4IGxpc3QgSURzIGZyb20gdGhlIGN1c3RvbSByZXNvdXJjZSByZXNwb25zZVxyXG4gICAgICAgIGNvbnN0IHByZWZpeExpc3RJZHMgPSBbXHJcbiAgICAgICAgICAgIHZwY0xhdHRpY2VQcmVmaXhMaXN0Q2FsbC5nZXRSZXNwb25zZUZpZWxkKCdQcmVmaXhMaXN0cy4wLlByZWZpeExpc3RJZCcpLFxyXG4gICAgICAgICAgICB2cGNMYXR0aWNlUHJlZml4TGlzdENhbGwuZ2V0UmVzcG9uc2VGaWVsZCgnUHJlZml4TGlzdHMuMS5QcmVmaXhMaXN0SWQnKSxcclxuICAgICAgICBdO1xyXG5cclxuICAgICAgICAvLyBBZGQgc2VjdXJpdHkgZ3JvdXAgcnVsZXMgZm9yIGVhY2ggcHJlZml4IGxpc3RcclxuICAgICAgICBwcmVmaXhMaXN0SWRzLmZvckVhY2gocHJlZml4TGlzdElkID0+IHtcclxuICAgICAgICAgICAgLy8gQWRkIGluZ3Jlc3MgcnVsZVxyXG4gICAgICAgICAgICBjbHVzdGVyU2cuYWRkSW5ncmVzc1J1bGUoXHJcbiAgICAgICAgICAgICAgICBlYzIuUGVlci5wcmVmaXhMaXN0KHByZWZpeExpc3RJZC50b1N0cmluZygpKSxcclxuICAgICAgICAgICAgICAgIGVjMi5Qb3J0LmFsbFRyYWZmaWMoKSxcclxuICAgICAgICAgICAgICAgICdBbGxvdyBpbmJvdW5kIGZyb20gVlBDIExhdHRpY2UnXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAvLyBBZGQgZWdyZXNzIHJ1bGVcclxuICAgICAgICAgICAgY2x1c3RlclNnLmFkZEVncmVzc1J1bGUoXHJcbiAgICAgICAgICAgICAgICBlYzIuUGVlci5wcmVmaXhMaXN0KHByZWZpeExpc3RJZC50b1N0cmluZygpKSxcclxuICAgICAgICAgICAgICAgIGVjMi5Qb3J0LmFsbFRyYWZmaWMoKSxcclxuICAgICAgICAgICAgICAgICdBbGxvdyBvdXRib3VuZCB0byBWUEMgTGF0dGljZSdcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHZwY0xhdHRpY2VQcmVmaXhMaXN0Q2FsbDtcclxuICAgIH1cclxuXHJcblxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3MtYXBwbGljYXRpb24tbmV0d29ya2luZy1rOHMvYmxvYi9tYWluL2ZpbGVzL2NvbnRyb2xsZXItaW5zdGFsbGF0aW9uL2RlcGxveS1uYW1lc3lzdGVtLnlhbWxcclxuICAgIHByaXZhdGUgY3JlYXRlTmFtZXNwYWNlKGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IENvbnN0cnVjdCB7XHJcbiAgICAgICAgcmV0dXJuIGNsdXN0ZXJJbmZvLmNsdXN0ZXIuYWRkTWFuaWZlc3QoJ2F3cy1hcHBsaWNhdGlvbi1uZXR3b3JraW5nLXN5c3RlbS1uYW1lc3BhY2UnLCB7XHJcbiAgICAgICAgICAgIGFwaVZlcnNpb246ICd2MScsXHJcbiAgICAgICAgICAgIGtpbmQ6ICdOYW1lc3BhY2UnLFxyXG4gICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogdGhpcy5vcHRpb25zLm5hbWVzcGFjZSxcclxuICAgICAgICAgICAgICAgIGxhYmVsczoge1xyXG4gICAgICAgICAgICAgICAgICAgICdjb250cm9sLXBsYW5lJzogJ2dhdGV3YXktYXBpLWNvbnRyb2xsZXInXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYXdzL2F3cy1hcHBsaWNhdGlvbi1uZXR3b3JraW5nLWs4cy9ibG9iL21haW4vZmlsZXMvY29udHJvbGxlci1pbnN0YWxsYXRpb24vcmVjb21tZW5kZWQtaW5saW5lLXBvbGljeS5qc29uXHJcbiAgICBwcml2YXRlIHNldHVwSWFtUGVybWlzc2lvbnMoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKSB7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcblxyXG4gICAgICAgIGNvbnN0IHNlcnZpY2VBY2NvdW50ID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudChBV1NfR0FURVdBWV9BUElfQ09OVFJPTExFUl9TQSwge1xyXG4gICAgICAgICAgICBuYW1lOiBBV1NfR0FURVdBWV9BUElfQ09OVFJPTExFUl9TQSxcclxuICAgICAgICAgICAgbmFtZXNwYWNlOiB0aGlzLm9wdGlvbnMubmFtZXNwYWNlLFxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBnZXRWcGNMYXR0aWNlQ29udHJvbGxlclBvbGljeSgpLmZvckVhY2goKHN0YXRlbWVudCkgPT4ge1xyXG4gICAgICAgICAgICBzZXJ2aWNlQWNjb3VudC5hZGRUb1ByaW5jaXBhbFBvbGljeShzdGF0ZW1lbnQpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gc2VydmljZUFjY291bnQ7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gU2V0cyBIZWxtIGFuZCBBV1MgR2F0ZXdheSBBUEkgQ29udHJvbGxlciBDb25maWd1cmF0aW9uIFxyXG4gICAgLy8gaHR0cHM6Ly93d3cuZ2F0ZXdheS1hcGktY29udHJvbGxlci5la3MuYXdzLmRldi9sYXRlc3QvZ3VpZGVzL2Vudmlyb25tZW50L1xyXG4gICAgcHJpdmF0ZSBwb3B1bGF0ZVZhbHVlcyhzZXJ2aWNlQWNjb3VudDogU2VydmljZUFjY291bnQpOiBWYWx1ZXMge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMub3B0aW9ucy52YWx1ZXMgPz8ge307XHJcbiAgICAgICAgdmFsdWVzLnNlcnZpY2VBY2NvdW50ID0ge1xyXG4gICAgICAgICAgICBjcmVhdGU6IGZhbHNlLFxyXG4gICAgICAgICAgICBuYW1lOiBzZXJ2aWNlQWNjb3VudC5zZXJ2aWNlQWNjb3VudE5hbWVcclxuICAgICAgICB9O1xyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLmxvZ0xldmVsKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5sb2dMZXZlbCA9IHRoaXMub3B0aW9ucy5sb2dMZXZlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGVmYXVsdFNlcnZpY2VOZXR3b3JrKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5kZWZhdWx0U2VydmljZU5ldHdvcmsgPSB0aGlzLm9wdGlvbnMuZGVmYXVsdFNlcnZpY2VOZXR3b3JrO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5lbmFibGVTZXJ2aWNlTmV0d29ya092ZXJyaWRlKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5lbmFibGVTZXJ2aWNlTmV0d29ya092ZXJyaWRlID0gdGhpcy5vcHRpb25zLmVuYWJsZVNlcnZpY2VOZXR3b3JrT3ZlcnJpZGU7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAodGhpcy5vcHRpb25zLndlYmhvb2tFbmFibGVkKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy53ZWJob29rRW5hYmxlZCA9IHRoaXMub3B0aW9ucy53ZWJob29rRW5hYmxlZDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmICh0aGlzLm9wdGlvbnMuZGlzYWJsZVRhZ2dpbmdTZXJ2aWNlQXBpKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5kaXNhYmxlVGFnZ2luZ1NlcnZpY2VBcGkgPSB0aGlzLm9wdGlvbnMuZGlzYWJsZVRhZ2dpbmdTZXJ2aWNlQXBpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKHRoaXMub3B0aW9ucy5yb3V0ZU1heENvbmN1cnJlbnRSZWNvbmNpbGVzKSB7XHJcbiAgICAgICAgICAgIHZhbHVlcy5yb3V0ZU1heENvbmN1cnJlbnRSZWNvbmNpbGVzID0gdGhpcy5vcHRpb25zLnJvdXRlTWF4Q29uY3VycmVudFJlY29uY2lsZXM7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICByZXR1cm4gdmFsdWVzO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9hd3MvYXdzLWFwcGxpY2F0aW9uLW5ldHdvcmtpbmctazhzL2Jsb2IvbWFpbi9maWxlcy9jb250cm9sbGVyLWluc3RhbGxhdGlvbi9nYXRld2F5Y2xhc3MueWFtbFxyXG4gICAgcHJpdmF0ZSBjcmVhdGVHYXRld2F5Q2xhc3MoY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogQ29uc3RydWN0IHtcclxuICAgICAgICByZXR1cm4gY2x1c3RlckluZm8uY2x1c3Rlci5hZGRNYW5pZmVzdCgndnBjLWxhdHRpY2UtZ2F0ZXdheS1jbGFzcycsIHtcclxuICAgICAgICAgICAgYXBpVmVyc2lvbjogJ2dhdGV3YXkubmV0d29ya2luZy5rOHMuaW8vdjFiZXRhMScsXHJcbiAgICAgICAgICAgIGtpbmQ6ICdHYXRld2F5Q2xhc3MnLFxyXG4gICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogJ2FtYXpvbi12cGMtbGF0dGljZSdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgc3BlYzoge1xyXG4gICAgICAgICAgICAgICAgY29udHJvbGxlck5hbWU6ICdhcHBsaWNhdGlvbi1uZXR3b3JraW5nLms4cy5hd3MvZ2F0ZXdheS1hcGktY29udHJvbGxlcidcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==