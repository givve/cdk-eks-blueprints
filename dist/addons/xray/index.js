"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var XrayAddOn_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.XrayAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const cluster_providers_1 = require("../../cluster-providers");
const utils_1 = require("../../utils");
/**
 * Implementation of AWS X-Ray add-on for EKS Blueprints. Installs xray daemonset and exposes
 * an internal ClusterIP service for tracing on port 2000 (UDP).
 */
let XrayAddOn = XrayAddOn_1 = class XrayAddOn {
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const nodeGroups = (0, cluster_providers_1.assertEC2NodeGroup)(clusterInfo, XrayAddOn_1.name);
        nodeGroups.forEach(nodeGroup => {
            nodeGroup.role.addManagedPolicy(aws_iam_1.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'));
        });
        // Apply manifest
        const doc = (0, utils_1.readYamlDocument)(__dirname + '/xray-ds.yaml');
        const manifest = doc.split("---").map(e => (0, utils_1.loadYaml)(e));
        new aws_eks_1.KubernetesManifest(cluster.stack, "xray-daemon", {
            cluster,
            manifest,
            overwrite: true
        });
    }
};
exports.XrayAddOn = XrayAddOn;
exports.XrayAddOn = XrayAddOn = XrayAddOn_1 = __decorate([
    utils_1.supportsX86
], XrayAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3hyYXkvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLGlEQUF5RDtBQUN6RCxpREFBb0Q7QUFDcEQsK0RBQTZEO0FBRTdELHVDQUFzRTtBQUV0RTs7O0dBR0c7QUFFSSxJQUFNLFNBQVMsaUJBQWYsTUFBTSxTQUFTO0lBRWxCLE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE9BQU8sR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDO1FBQ3BDLE1BQU0sVUFBVSxHQUFHLElBQUEsc0NBQWtCLEVBQUMsV0FBVyxFQUFFLFdBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUVuRSxVQUFVLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxFQUFFO1lBQzNCLFNBQVMsQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsdUJBQWEsQ0FBQyx3QkFBd0IsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDLENBQUM7UUFDeEcsQ0FBQyxDQUFDLENBQUM7UUFFSCxpQkFBaUI7UUFDakIsTUFBTSxHQUFHLEdBQUcsSUFBQSx3QkFBZ0IsRUFBQyxTQUFTLEdBQUcsZUFBZSxDQUFDLENBQUM7UUFDMUQsTUFBTSxRQUFRLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFBLGdCQUFRLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RCxJQUFJLDRCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsYUFBYSxFQUFFO1lBQ2pELE9BQU87WUFDUCxRQUFRO1lBQ1IsU0FBUyxFQUFFLElBQUk7U0FDbEIsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKLENBQUE7QUFuQlksOEJBQVM7b0JBQVQsU0FBUztJQURyQixtQkFBVztHQUNDLFNBQVMsQ0FtQnJCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgS3ViZXJuZXRlc01hbmlmZXN0IH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgTWFuYWdlZFBvbGljeSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IGFzc2VydEVDMk5vZGVHcm91cCB9IGZyb20gXCIuLi8uLi9jbHVzdGVyLXByb3ZpZGVyc1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVyQWRkT24sIENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBsb2FkWWFtbCwgcmVhZFlhbWxEb2N1bWVudCwgc3VwcG9ydHNYODYgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuXHJcbi8qKlxyXG4gKiBJbXBsZW1lbnRhdGlvbiBvZiBBV1MgWC1SYXkgYWRkLW9uIGZvciBFS1MgQmx1ZXByaW50cy4gSW5zdGFsbHMgeHJheSBkYWVtb25zZXQgYW5kIGV4cG9zZXMgXHJcbiAqIGFuIGludGVybmFsIENsdXN0ZXJJUCBzZXJ2aWNlIGZvciB0cmFjaW5nIG9uIHBvcnQgMjAwMCAoVURQKS5cclxuICovXHJcbkBzdXBwb3J0c1g4NlxyXG5leHBvcnQgY2xhc3MgWHJheUFkZE9uIGltcGxlbWVudHMgQ2x1c3RlckFkZE9uIHtcclxuXHJcbiAgICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogdm9pZCB7XHJcbiAgICAgICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICAgICAgY29uc3Qgbm9kZUdyb3VwcyA9IGFzc2VydEVDMk5vZGVHcm91cChjbHVzdGVySW5mbywgWHJheUFkZE9uLm5hbWUpO1xyXG5cclxuICAgICAgICBub2RlR3JvdXBzLmZvckVhY2gobm9kZUdyb3VwID0+IHtcclxuICAgICAgICAgICAgbm9kZUdyb3VwLnJvbGUuYWRkTWFuYWdlZFBvbGljeShNYW5hZ2VkUG9saWN5LmZyb21Bd3NNYW5hZ2VkUG9saWN5TmFtZSgnQVdTWFJheURhZW1vbldyaXRlQWNjZXNzJykpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICAvLyBBcHBseSBtYW5pZmVzdFxyXG4gICAgICAgIGNvbnN0IGRvYyA9IHJlYWRZYW1sRG9jdW1lbnQoX19kaXJuYW1lICsgJy94cmF5LWRzLnlhbWwnKTtcclxuICAgICAgICBjb25zdCBtYW5pZmVzdCA9IGRvYy5zcGxpdChcIi0tLVwiKS5tYXAoZSA9PiBsb2FkWWFtbChlKSk7XHJcbiAgICAgICAgbmV3IEt1YmVybmV0ZXNNYW5pZmVzdChjbHVzdGVyLnN0YWNrLCBcInhyYXktZGFlbW9uXCIsIHtcclxuICAgICAgICAgICAgY2x1c3RlcixcclxuICAgICAgICAgICAgbWFuaWZlc3QsXHJcbiAgICAgICAgICAgIG92ZXJ3cml0ZTogdHJ1ZVxyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG59Il19