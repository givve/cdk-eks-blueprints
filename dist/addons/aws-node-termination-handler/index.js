"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsNodeTerminationHandlerAddOn = exports.Mode = void 0;
const aws_autoscaling_1 = require("aws-cdk-lib/aws-autoscaling");
const aws_autoscaling_hooktargets_1 = require("aws-cdk-lib/aws-autoscaling-hooktargets");
const aws_events_1 = require("aws-cdk-lib/aws-events");
const aws_events_targets_1 = require("aws-cdk-lib/aws-events-targets");
const iam = require("aws-cdk-lib/aws-iam");
const aws_sqs_1 = require("aws-cdk-lib/aws-sqs");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const assert = require("assert");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Supported Modes
 */
var Mode;
(function (Mode) {
    /**
     * IMDS Mode
     */
    Mode[Mode["IMDS"] = 0] = "IMDS";
    /**
     * Queue Mode
     */
    Mode[Mode["QUEUE"] = 1] = "QUEUE";
})(Mode || (exports.Mode = Mode = {}));
/**
 * Default options for the add-on
 */
const defaultProps = {
    chart: 'aws-node-termination-handler',
    repository: 'https://aws.github.io/eks-charts',
    version: '0.27.2',
    release: 'blueprints-addon-aws-node-termination-handler',
    name: 'aws-node-termination-handler',
    namespace: 'kube-system',
    mode: Mode.IMDS
};
let AwsNodeTerminationHandlerAddOn = class AwsNodeTerminationHandlerAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    /**
     * Implementation of the deploy interface
     * @param clusterInfo
     */
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const asgCapacity = clusterInfo.autoscalingGroups || [];
        const karpenter = clusterInfo.getScheduledAddOn('KarpenterAddOn');
        if (!karpenter) {
            // No support for Fargate and Managed Node Groups, lets catch that
            assert(asgCapacity && asgCapacity.length > 0, 'AWS Node Termination Handler is only supported for self-managed nodes');
        }
        // Create an SQS Queue
        let helmValues;
        // Create Service Account
        const serviceAccount = cluster.addServiceAccount('aws-nth-sa', {
            name: 'aws-node-termination-handler-sa',
            namespace: this.options.namespace,
        });
        // Get the appropriate Helm Values depending upon the Mode selected
        if (this.options.mode === Mode.IMDS) {
            helmValues = this.configureImdsMode(serviceAccount, karpenter);
        }
        else {
            helmValues = this.configureQueueMode(cluster, serviceAccount, asgCapacity, karpenter);
        }
        // Deploy the helm chart
        const awsNodeTerminationHandlerChart = this.addHelmChart(clusterInfo, helmValues);
        awsNodeTerminationHandlerChart.node.addDependency(serviceAccount);
    }
    /**
     * Configures IMDS Mode
     * @param serviceAccount
     * @returns Helm values
     */
    configureImdsMode(serviceAccount, karpenter) {
        return {
            enableSpotInterruptionDraining: true,
            enableRebalanceMonitoring: true,
            enableRebalanceDraining: karpenter ? true : false,
            enableScheduledEventDraining: true,
            nodeSelector: karpenter ? { 'karpenter.sh/capacity-type': 'spot' } : {},
            serviceAccount: {
                create: false,
                name: serviceAccount.serviceAccountName,
            }
        };
    }
    /**
     * Configures Queue Mode
     * @param cluster
     * @param serviceAccount
     * @param asgCapacity
     * @returns Helm values
     */
    configureQueueMode(cluster, serviceAccount, asgCapacity, karpenter) {
        const queue = new aws_sqs_1.Queue(cluster.stack, "aws-nth-queue", {
            retentionPeriod: aws_cdk_lib_1.Duration.minutes(5)
        });
        queue.addToResourcePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [
                new iam.ServicePrincipal('events.amazonaws.com'),
                new iam.ServicePrincipal('sqs.amazonaws.com'),
            ],
            actions: ['sqs:SendMessage'],
            resources: [queue.queueArn]
        }));
        const resources = [];
        // This does not apply if you leverage Karpenter (which uses NTH for Spot/Fargate)
        if (!karpenter) {
            for (let i = 0; i < asgCapacity.length; i++) {
                const nodeGroup = asgCapacity[i];
                // Setup a Termination Lifecycle Hook on an ASG
                new aws_autoscaling_1.LifecycleHook(cluster.stack, `aws-${nodeGroup.autoScalingGroupName}-nth-lifecycle-hook`, {
                    lifecycleTransition: aws_autoscaling_1.LifecycleTransition.INSTANCE_TERMINATING,
                    heartbeatTimeout: aws_cdk_lib_1.Duration.minutes(5), // based on https://github.com/aws/aws-node-termination-handler docs
                    notificationTarget: new aws_autoscaling_hooktargets_1.QueueHook(queue),
                    autoScalingGroup: nodeGroup
                });
                // Tag the ASG
                const tags = [{
                        Key: 'aws-node-termination-handler/managed',
                        Value: 'true'
                    }];
                (0, utils_1.tagAsg)(cluster.stack, nodeGroup.autoScalingGroupName, tags);
                resources.push(nodeGroup.autoScalingGroupArn);
            }
        }
        // Create Amazon EventBridge Rules
        this.createEvents(cluster.stack, queue, karpenter);
        // Service Account Policy
        serviceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'autoscaling:CompleteLifecycleAction',
                'autoscaling:DescribeAutoScalingInstances',
                'autoscaling:DescribeTags'
            ],
            resources: karpenter ? ['*'] : resources
        }));
        serviceAccount.addToPrincipalPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['ec2:DescribeInstances'],
            resources: ['*']
        }));
        queue.grantConsumeMessages(serviceAccount);
        return {
            enableSqsTerminationDraining: true,
            queueURL: queue.queueUrl,
            awsRegion: karpenter ? cluster.stack.region : '',
            serviceAccount: {
                create: false,
                name: serviceAccount.serviceAccountName,
            },
            checkASGTagBeforeDraining: karpenter ? false : true,
            enableSpotInterruptionDraining: karpenter ? true : false,
        };
    }
    /**
     * Create EventBridge rules with target as SQS queue
     * @param scope
     * @param queue
     */
    createEvents(scope, queue, karpenter) {
        const target = new aws_events_targets_1.SqsQueue(queue);
        const eventPatterns = [
            {
                source: ['aws.ec2'],
                detailType: ['EC2 Spot Instance Interruption Warning']
            },
            {
                source: ['aws.ec2'],
                detailType: ['EC2 Instance Rebalance Recommendation']
            },
            {
                source: ['aws.ec2'],
                detailType: ['EC2 Instance State-change Notification']
            },
            {
                source: ['aws.health'],
                detailType: ['AWS Health Event'],
            }
        ];
        if (!karpenter) {
            eventPatterns.push({
                source: ['aws.autoscaling'],
                detailType: ['EC2 Instance-terminate Lifecycle Action']
            });
        }
        eventPatterns.forEach((event, index) => {
            const rule = new aws_events_1.Rule(scope, `rule-${index}`, { eventPattern: event });
            rule.addTarget(target);
        });
    }
};
exports.AwsNodeTerminationHandlerAddOn = AwsNodeTerminationHandlerAddOn;
exports.AwsNodeTerminationHandlerAddOn = AwsNodeTerminationHandlerAddOn = __decorate([
    utils_1.supportsX86
], AwsNodeTerminationHandlerAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2F3cy1ub2RlLXRlcm1pbmF0aW9uLWhhbmRsZXIvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaUVBQW1HO0FBQ25HLHlGQUFvRTtBQUVwRSx1REFBNEQ7QUFDNUQsdUVBQTBEO0FBQzFELDJDQUEyQztBQUMzQyxpREFBNEM7QUFDNUMsNkNBQXVDO0FBRXZDLGlDQUFpQztBQUVqQyx1Q0FBa0Q7QUFDbEQsOENBQThEO0FBRTlEOztHQUVHO0FBQ0gsSUFBWSxJQVVYO0FBVkQsV0FBWSxJQUFJO0lBQ2Q7O09BRUc7SUFDSCwrQkFBSSxDQUFBO0lBRUo7O09BRUc7SUFDSCxpQ0FBSyxDQUFBO0FBQ1AsQ0FBQyxFQVZXLElBQUksb0JBQUosSUFBSSxRQVVmO0FBYUQ7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBbUM7SUFDbkQsS0FBSyxFQUFFLDhCQUE4QjtJQUNyQyxVQUFVLEVBQUUsa0NBQWtDO0lBQzlDLE9BQU8sRUFBRSxRQUFRO0lBQ2pCLE9BQU8sRUFBRSwrQ0FBK0M7SUFDeEQsSUFBSSxFQUFFLDhCQUE4QjtJQUNwQyxTQUFTLEVBQUUsYUFBYTtJQUN4QixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7Q0FDaEIsQ0FBQztBQUdLLElBQU0sOEJBQThCLEdBQXBDLE1BQU0sOEJBQStCLFNBQVEsc0JBQVM7SUFFbkQsT0FBTyxDQUFpQztJQUVoRCxZQUFZLEtBQXNDO1FBQ2hELEtBQUssQ0FBQyxFQUFFLEdBQUcsWUFBbUIsRUFBRSxHQUFHLEtBQUssRUFBRSxDQUFDLENBQUM7UUFDNUMsSUFBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDO0lBQzVCLENBQUM7SUFFRDs7O09BR0c7SUFDSCxNQUFNLENBQUMsV0FBd0I7UUFDN0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxN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QUFFLENBQUMsdUNBQXVDLENBQUM7YUFDdEQ7WUFDRDtnQkFDRSxNQUFNLEVBQUUsQ0FBQyxTQUFTLENBQUM7Z0JBQ25CLFVBQVUsRUFBRSxDQUFDLHdDQUF3QyxDQUFDO2FBQ3ZEO1lBQ0Q7Z0JBQ0UsTUFBTSxFQUFFLENBQUMsWUFBWSxDQUFDO2dCQUN0QixVQUFVLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQzthQUNqQztTQUNGLENBQUM7UUFFRixJQUFJLENBQUMsU0FBUyxFQUFDLENBQUM7WUFDZCxhQUFhLENBQUMsSUFBSSxDQUNoQjtnQkFDRSxNQUFNLEVBQUUsQ0FBQyxpQkFBaUIsQ0FBQztnQkFDM0IsVUFBVSxFQUFFLENBQUMseUNBQXlDLENBQUM7YUFDeEQsQ0FDRixDQUFDO1FBQ0osQ0FBQztRQUVELGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEVBQUU7WUFDckMsTUFBTSxJQUFJLEdBQUcsSUFBSSxpQkFBSSxDQUFDLEtBQUssRUFBRSxRQUFRLEtBQUssRUFBRSxFQUFFLEVBQUUsWUFBWSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFDdkUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUN6QixDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRixDQUFBO0FBdkxZLHdFQUE4Qjt5Q0FBOUIsOEJBQThCO0lBRDFDLG1CQUFXO0dBQ0MsOEJBQThCLENBdUwxQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEF1dG9TY2FsaW5nR3JvdXAsIExpZmVjeWNsZUhvb2ssIExpZmVjeWNsZVRyYW5zaXRpb24gfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xyXG5pbXBvcnQgeyBRdWV1ZUhvb2sgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmctaG9va3RhcmdldHMnO1xyXG5pbXBvcnQgeyBJQ2x1c3RlciwgU2VydmljZUFjY291bnQgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWtzJztcclxuaW1wb3J0IHsgRXZlbnRQYXR0ZXJuLCBSdWxlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cyc7XHJcbmltcG9ydCB7IFNxc1F1ZXVlIH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWV2ZW50cy10YXJnZXRzJztcclxuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xyXG5pbXBvcnQgeyBRdWV1ZSB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zcXMnO1xyXG5pbXBvcnQgeyBEdXJhdGlvbiB9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gXCJhc3NlcnRcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckluZm8gfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgeyBzdXBwb3J0c1g4NiwgdGFnQXNnIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gJy4uL2hlbG0tYWRkb24nO1xyXG5cclxuLyoqXHJcbiAqIFN1cHBvcnRlZCBNb2Rlc1xyXG4gKi9cclxuZXhwb3J0IGVudW0gTW9kZSB7XHJcbiAgLyoqXHJcbiAgICogSU1EUyBNb2RlXHJcbiAgICovXHJcbiAgSU1EUyxcclxuXHJcbiAgLyoqXHJcbiAgICogUXVldWUgTW9kZVxyXG4gICAqL1xyXG4gIFFVRVVFXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb25maWd1cmF0aW9uIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5leHBvcnQgaW50ZXJmYWNlIEF3c05vZGVUZXJtaW5hdGlvbkhhbmRsZXJQcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcbiAgLyoqXHJcbiAgICogU3VwcG9ydGVkIE1vZGVzIGFyZSBNb2RlLklNRFMgYW5kIE1vZGUuUVVFVUVcclxuICAgKiBAZGVmYXVsdCBNb2RlLklNRFNcclxuICAgKi9cclxuICBtb2RlPzogTW9kZVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBvcHRpb25zIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHM6IEF3c05vZGVUZXJtaW5hdGlvbkhhbmRsZXJQcm9wcyA9IHtcclxuICBjaGFydDogJ2F3cy1ub2RlLXRlcm1pbmF0aW9uLWhhbmRsZXInLFxyXG4gIHJlcG9zaXRvcnk6ICdodHRwczovL2F3cy5naXRodWIuaW8vZWtzLWNoYXJ0cycsXHJcbiAgdmVyc2lvbjogJzAuMjcuMicsXHJcbiAgcmVsZWFzZTogJ2JsdWVwcmludHMtYWRkb24tYXdzLW5vZGUtdGVybWluYXRpb24taGFuZGxlcicsXHJcbiAgbmFtZTogJ2F3cy1ub2RlLXRlcm1pbmF0aW9uLWhhbmRsZXInLFxyXG4gIG5hbWVzcGFjZTogJ2t1YmUtc3lzdGVtJyxcclxuICBtb2RlOiBNb2RlLklNRFNcclxufTtcclxuXHJcbkBzdXBwb3J0c1g4NlxyXG5leHBvcnQgY2xhc3MgQXdzTm9kZVRlcm1pbmF0aW9uSGFuZGxlckFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgcHJpdmF0ZSBvcHRpb25zOiBBd3NOb2RlVGVybWluYXRpb25IYW5kbGVyUHJvcHM7XHJcblxyXG4gIGNvbnN0cnVjdG9yKHByb3BzPzogQXdzTm9kZVRlcm1pbmF0aW9uSGFuZGxlclByb3BzKSB7XHJcbiAgICBzdXBlcih7IC4uLmRlZmF1bHRQcm9wcyBhcyBhbnksIC4uLnByb3BzIH0pO1xyXG4gICAgdGhpcy5vcHRpb25zID0gdGhpcy5wcm9wcztcclxuICB9XHJcblxyXG4gIC8qKlxyXG4gICAqIEltcGxlbWVudGF0aW9uIG9mIHRoZSBkZXBsb3kgaW50ZXJmYWNlXHJcbiAgICogQHBhcmFtIGNsdXN0ZXJJbmZvIFxyXG4gICAqL1xyXG4gIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiB2b2lkIHtcclxuICAgIGNvbnN0IGNsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyOyAgICBcclxuICAgIGNvbnN0IGFzZ0NhcGFjaXR5ID0gY2x1c3RlckluZm8uYXV0b3NjYWxpbmdHcm91cHMgfHwgW107XHJcblxyXG4gICAgY29uc3Qga2FycGVudGVyID0gY2x1c3RlckluZm8uZ2V0U2NoZWR1bGVkQWRkT24oJ0thcnBlbnRlckFkZE9uJyk7XHJcbiAgICBpZiAoIWthcnBlbnRlcil7XHJcbiAgICAgIC8vIE5vIHN1cHBvcnQgZm9yIEZhcmdhdGUgYW5kIE1hbmFnZWQgTm9kZSBHcm91cHMsIGxldHMgY2F0Y2ggdGhhdFxyXG4gICAgICBhc3NlcnQoYXNnQ2FwYWNpdHkgJiYgYXNnQ2FwYWNpdHkubGVuZ3RoID4gMCwgJ0FXUyBOb2RlIFRlcm1pbmF0aW9uIEhhbmRsZXIgaXMgb25seSBzdXBwb3J0ZWQgZm9yIHNlbGYtbWFuYWdlZCBub2RlcycpO1xyXG4gICAgfSAgICBcclxuXHJcbiAgICAvLyBDcmVhdGUgYW4gU1FTIFF1ZXVlXHJcbiAgICBsZXQgaGVsbVZhbHVlczogYW55O1xyXG5cclxuICAgIC8vIENyZWF0ZSBTZXJ2aWNlIEFjY291bnRcclxuICAgIGNvbnN0IHNlcnZpY2VBY2NvdW50ID0gY2x1c3Rlci5hZGRTZXJ2aWNlQWNjb3VudCgnYXdzLW50aC1zYScsIHtcclxuICAgICAgICBuYW1lOiAnYXdzLW5vZGUtdGVybWluYXRpb24taGFuZGxlci1zYScsXHJcbiAgICAgICAgbmFtZXNwYWNlOiB0aGlzLm9wdGlvbnMubmFtZXNwYWNlLFxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8gR2V0IHRoZSBhcHByb3ByaWF0ZSBIZWxtIFZhbHVlcyBkZXBlbmRpbmcgdXBvbiB0aGUgTW9kZSBzZWxlY3RlZFxyXG4gICAgaWYgKHRoaXMub3B0aW9ucy5tb2RlID09PSBNb2RlLklNRFMpIHtcclxuICAgICAgICBoZWxtVmFsdWVzID0gdGhpcy5jb25maWd1cmVJbWRzTW9kZShzZXJ2aWNlQWNjb3VudCwga2FycGVudGVyKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICAgIGhlbG1WYWx1ZXMgPSB0aGlzLmNvbmZpZ3VyZVF1ZXVlTW9kZShjbHVzdGVyLCBzZXJ2aWNlQWNjb3VudCwgYXNnQ2FwYWNpdHksIGthcnBlbnRlcik7XHJcbiAgICB9XHJcbiAgICBcclxuICAgIC8vIERlcGxveSB0aGUgaGVsbSBjaGFydFxyXG4gICAgY29uc3QgYXdzTm9kZVRlcm1pbmF0aW9uSGFuZGxlckNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIGhlbG1WYWx1ZXMpO1xyXG4gICAgYXdzTm9kZVRlcm1pbmF0aW9uSGFuZGxlckNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShzZXJ2aWNlQWNjb3VudCk7XHJcbiAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmVzIElNRFMgTW9kZVxyXG4gICAqIEBwYXJhbSBzZXJ2aWNlQWNjb3VudCBcclxuICAgKiBAcmV0dXJucyBIZWxtIHZhbHVlc1xyXG4gICAqL1xyXG4gICAgcHJpdmF0ZSBjb25maWd1cmVJbWRzTW9kZShzZXJ2aWNlQWNjb3VudDogU2VydmljZUFjY291bnQsIGthcnBlbnRlcjogUHJvbWlzZTxDb25zdHJ1Y3Q+IHwgdW5kZWZpbmVkKTogYW55IHtcclxuICAgICAgICByZXR1cm4ge1xyXG4gICAgICAgICAgICBlbmFibGVTcG90SW50ZXJydXB0aW9uRHJhaW5pbmc6IHRydWUsXHJcbiAgICAgICAgICAgIGVuYWJsZVJlYmFsYW5jZU1vbml0b3Jpbmc6IHRydWUsXHJcbiAgICAgICAgICAgIGVuYWJsZVJlYmFsYW5jZURyYWluaW5nOiBrYXJwZW50ZXIgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgICAgICAgIGVuYWJsZVNjaGVkdWxlZEV2ZW50RHJhaW5pbmc6IHRydWUsXHJcbiAgICAgICAgICAgIG5vZGVTZWxlY3Rvcjoga2FycGVudGVyID8geydrYXJwZW50ZXIuc2gvY2FwYWNpdHktdHlwZSc6ICdzcG90J30gOiB7fSxcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnQ6IHtcclxuICAgICAgICAgICAgICAgIGNyZWF0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzZXJ2aWNlQWNjb3VudC5zZXJ2aWNlQWNjb3VudE5hbWUsXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAvKipcclxuICAgKiBDb25maWd1cmVzIFF1ZXVlIE1vZGVcclxuICAgKiBAcGFyYW0gY2x1c3RlclxyXG4gICAqIEBwYXJhbSBzZXJ2aWNlQWNjb3VudFxyXG4gICAqIEBwYXJhbSBhc2dDYXBhY2l0eVxyXG4gICAqIEByZXR1cm5zIEhlbG0gdmFsdWVzXHJcbiAgICovXHJcbiAgICBwcml2YXRlIGNvbmZpZ3VyZVF1ZXVlTW9kZShjbHVzdGVyOiBJQ2x1c3Rlciwgc2VydmljZUFjY291bnQ6IFNlcnZpY2VBY2NvdW50LCBhc2dDYXBhY2l0eTogQXV0b1NjYWxpbmdHcm91cFtdLCBrYXJwZW50ZXI6IFByb21pc2U8Q29uc3RydWN0PiB8IHVuZGVmaW5lZCk6IGFueSB7XHJcbiAgICAgICAgY29uc3QgcXVldWUgPSBuZXcgUXVldWUoY2x1c3Rlci5zdGFjaywgXCJhd3MtbnRoLXF1ZXVlXCIsIHtcclxuICAgICAgICAgICAgcmV0ZW50aW9uUGVyaW9kOiBEdXJhdGlvbi5taW51dGVzKDUpXHJcbiAgICAgICAgfSk7XHJcbiAgICAgICAgcXVldWUuYWRkVG9SZXNvdXJjZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgcHJpbmNpcGFsczogW1xyXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdldmVudHMuYW1hem9uYXdzLmNvbScpLFxyXG4gICAgICAgICAgICAgICAgbmV3IGlhbS5TZXJ2aWNlUHJpbmNpcGFsKCdzcXMuYW1hem9uYXdzLmNvbScpLFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ3NxczpTZW5kTWVzc2FnZSddLFxyXG4gICAgICAgICAgICByZXNvdXJjZXM6IFtxdWV1ZS5xdWV1ZUFybl1cclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIGNvbnN0IHJlc291cmNlczogc3RyaW5nW10gPSBbXTtcclxuXHJcbiAgICAgICAgLy8gVGhpcyBkb2VzIG5vdCBhcHBseSBpZiB5b3UgbGV2ZXJhZ2UgS2FycGVudGVyICh3aGljaCB1c2VzIE5USCBmb3IgU3BvdC9GYXJnYXRlKVxyXG4gICAgICAgIGlmICgha2FycGVudGVyKXtcclxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXNnQ2FwYWNpdHkubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICBjb25zdCBub2RlR3JvdXAgPSBhc2dDYXBhY2l0eVtpXTtcclxuICAgICAgICAgICAgICAvLyBTZXR1cCBhIFRlcm1pbmF0aW9uIExpZmVjeWNsZSBIb29rIG9uIGFuIEFTR1xyXG4gICAgICAgICAgICAgIG5ldyBMaWZlY3ljbGVIb29rKGNsdXN0ZXIuc3RhY2ssIGBhd3MtJHtub2RlR3JvdXAuYXV0b1NjYWxpbmdHcm91cE5hbWV9LW50aC1saWZlY3ljbGUtaG9va2AsIHtcclxuICAgICAgICAgICAgICAgICAgbGlmZWN5Y2xlVHJhbnNpdGlvbjogTGlmZWN5Y2xlVHJhbnNpdGlvbi5JTlNUQU5DRV9URVJNSU5BVElORyxcclxuICAgICAgICAgICAgICAgICAgaGVhcnRiZWF0VGltZW91dDogRHVyYXRpb24ubWludXRlcyg1KSwgLy8gYmFzZWQgb24gaHR0cHM6Ly9naXRodWIuY29tL2F3cy9hd3Mtbm9kZS10ZXJtaW5hdGlvbi1oYW5kbGVyIGRvY3NcclxuICAgICAgICAgICAgICAgICAgbm90aWZpY2F0aW9uVGFyZ2V0OiBuZXcgUXVldWVIb29rKHF1ZXVlKSxcclxuICAgICAgICAgICAgICAgICAgYXV0b1NjYWxpbmdHcm91cDogbm9kZUdyb3VwXHJcbiAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgIC8vIFRhZyB0aGUgQVNHXHJcbiAgICAgICAgICAgICAgY29uc3QgdGFncyA9IFt7XHJcbiAgICAgICAgICAgICAgICAgIEtleTogJ2F3cy1ub2RlLXRlcm1pbmF0aW9uLWhhbmRsZXIvbWFuYWdlZCcsXHJcbiAgICAgICAgICAgICAgICAgIFZhbHVlOiAndHJ1ZSdcclxuICAgICAgICAgICAgICB9XTtcclxuICAgICAgICAgICAgICB0YWdBc2coY2x1c3Rlci5zdGFjaywgbm9kZUdyb3VwLmF1dG9TY2FsaW5nR3JvdXBOYW1lLCB0YWdzKTtcclxuICAgICAgICAgICAgICByZXNvdXJjZXMucHVzaChub2RlR3JvdXAuYXV0b1NjYWxpbmdHcm91cEFybik7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvLyBDcmVhdGUgQW1hem9uIEV2ZW50QnJpZGdlIFJ1bGVzXHJcbiAgICAgICAgdGhpcy5jcmVhdGVFdmVudHMoY2x1c3Rlci5zdGFjaywgcXVldWUsIGthcnBlbnRlcik7XHJcblxyXG4gICAgICAgIC8vIFNlcnZpY2UgQWNjb3VudCBQb2xpY3lcclxuICAgICAgICBzZXJ2aWNlQWNjb3VudC5hZGRUb1ByaW5jaXBhbFBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XHJcbiAgICAgICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcclxuICAgICAgICAgICAgYWN0aW9uczogW1xyXG4gICAgICAgICAgICAgICAgJ2F1dG9zY2FsaW5nOkNvbXBsZXRlTGlmZWN5Y2xlQWN0aW9uJyxcclxuICAgICAgICAgICAgICAgICdhdXRvc2NhbGluZzpEZXNjcmliZUF1dG9TY2FsaW5nSW5zdGFuY2VzJyxcclxuICAgICAgICAgICAgICAgICdhdXRvc2NhbGluZzpEZXNjcmliZVRhZ3MnXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIHJlc291cmNlczoga2FycGVudGVyID8gWycqJ10gOiByZXNvdXJjZXNcclxuICAgICAgICB9KSk7XHJcblxyXG4gICAgICAgIHNlcnZpY2VBY2NvdW50LmFkZFRvUHJpbmNpcGFsUG9saWN5KG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcclxuICAgICAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkFMTE9XLFxyXG4gICAgICAgICAgICBhY3Rpb25zOiBbJ2VjMjpEZXNjcmliZUluc3RhbmNlcyddLFxyXG4gICAgICAgICAgICByZXNvdXJjZXM6IFsnKiddXHJcbiAgICAgICAgfSkpO1xyXG4gICAgICAgIHF1ZXVlLmdyYW50Q29uc3VtZU1lc3NhZ2VzKHNlcnZpY2VBY2NvdW50KTtcclxuXHJcbiAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgZW5hYmxlU3FzVGVybWluYXRpb25EcmFpbmluZzogdHJ1ZSxcclxuICAgICAgICAgICAgcXVldWVVUkw6IHF1ZXVlLnF1ZXVlVXJsLFxyXG4gICAgICAgICAgICBhd3NSZWdpb246IGthcnBlbnRlciA/IGNsdXN0ZXIuc3RhY2sucmVnaW9uOiAnJyxcclxuICAgICAgICAgICAgc2VydmljZUFjY291bnQ6IHtcclxuICAgICAgICAgICAgICAgIGNyZWF0ZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBuYW1lOiBzZXJ2aWNlQWNjb3VudC5zZXJ2aWNlQWNjb3VudE5hbWUsXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNoZWNrQVNHVGFnQmVmb3JlRHJhaW5pbmc6IGthcnBlbnRlciA/IGZhbHNlIDogdHJ1ZSxcclxuICAgICAgICAgICAgZW5hYmxlU3BvdEludGVycnVwdGlvbkRyYWluaW5nOiBrYXJwZW50ZXIgPyB0cnVlIDogZmFsc2UsXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgLyoqXHJcbiAgICogQ3JlYXRlIEV2ZW50QnJpZGdlIHJ1bGVzIHdpdGggdGFyZ2V0IGFzIFNRUyBxdWV1ZVxyXG4gICAqIEBwYXJhbSBzY29wZSBcclxuICAgKiBAcGFyYW0gcXVldWUgXHJcbiAgICovXHJcbiAgcHJpdmF0ZSBjcmVhdGVFdmVudHMoc2NvcGU6IENvbnN0cnVjdCwgcXVldWU6IFF1ZXVlLCBrYXJwZW50ZXI6IFByb21pc2U8Q29uc3RydWN0PiB8IHVuZGVmaW5lZCk6IHZvaWQge1xyXG4gICAgY29uc3QgdGFyZ2V0ID0gbmV3IFNxc1F1ZXVlKHF1ZXVlKTtcclxuICAgIGNvbnN0IGV2ZW50UGF0dGVybnM6IEV2ZW50UGF0dGVybltdID0gW1xyXG4gICAgICB7XHJcbiAgICAgICAgc291cmNlOiBbJ2F3cy5lYzInXSxcclxuICAgICAgICBkZXRhaWxUeXBlOiBbJ0VDMiBTcG90IEluc3RhbmNlIEludGVycnVwdGlvbiBXYXJuaW5nJ11cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIHNvdXJjZTogWydhd3MuZWMyJ10sXHJcbiAgICAgICAgZGV0YWlsVHlwZTogWydFQzIgSW5zdGFuY2UgUmViYWxhbmNlIFJlY29tbWVuZGF0aW9uJ11cclxuICAgICAgfSxcclxuICAgICAge1xyXG4gICAgICAgIHNvdXJjZTogWydhd3MuZWMyJ10sXHJcbiAgICAgICAgZGV0YWlsVHlwZTogWydFQzIgSW5zdGFuY2UgU3RhdGUtY2hhbmdlIE5vdGlmaWNhdGlvbiddXHJcbiAgICAgIH0sXHJcbiAgICAgIHtcclxuICAgICAgICBzb3VyY2U6IFsnYXdzLmhlYWx0aCddLFxyXG4gICAgICAgIGRldGFpbFR5cGU6IFsnQVdTIEhlYWx0aCBFdmVudCddLFxyXG4gICAgICB9XHJcbiAgICBdO1xyXG5cclxuICAgIGlmICgha2FycGVudGVyKXtcclxuICAgICAgZXZlbnRQYXR0ZXJucy5wdXNoKFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHNvdXJjZTogWydhd3MuYXV0b3NjYWxpbmcnXSxcclxuICAgICAgICAgIGRldGFpbFR5cGU6IFsnRUMyIEluc3RhbmNlLXRlcm1pbmF0ZSBMaWZlY3ljbGUgQWN0aW9uJ11cclxuICAgICAgICB9LFxyXG4gICAgICApO1xyXG4gICAgfVxyXG5cclxuICAgIGV2ZW50UGF0dGVybnMuZm9yRWFjaCgoZXZlbnQsIGluZGV4KSA9PiB7XHJcbiAgICAgIGNvbnN0IHJ1bGUgPSBuZXcgUnVsZShzY29wZSwgYHJ1bGUtJHtpbmRleH1gLCB7IGV2ZW50UGF0dGVybjogZXZlbnQgfSk7XHJcbiAgICAgIHJ1bGUuYWRkVGFyZ2V0KHRhcmdldCk7XHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuIl19