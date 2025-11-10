"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALBDefaultIngressClassAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const utils_1 = require("../../utils");
let ALBDefaultIngressClassAddOn = class ALBDefaultIngressClassAddOn {
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const ingressClassManifest = {
            apiVersion: "networking.k8s.io/v1",
            kind: "IngressClass",
            metadata: {
                labels: { "app.kubernetes.io/name": "LoadBalancerController" },
                name: "alb"
            },
            spec: {
                controller: "eks.amazonaws.com/alb"
            }
        };
        new aws_eks_1.KubernetesManifest(cluster.stack, 'alb-ingress-class', {
            cluster,
            manifest: [ingressClassManifest],
            overwrite: true
        });
    }
};
exports.ALBDefaultIngressClassAddOn = ALBDefaultIngressClassAddOn;
__decorate([
    (0, utils_1.conflictsWith)('AwsLoadBalancerControllerAddOn'),
    (0, utils_1.mustRunOnAutoMode)()
], ALBDefaultIngressClassAddOn.prototype, "deploy", null);
exports.ALBDefaultIngressClassAddOn = ALBDefaultIngressClassAddOn = __decorate([
    utils_1.supportsALL
], ALBDefaultIngressClassAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2F3cy1hbGItZGVmYXVsdC1pbmdyZXNzLWNsYXNzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLGlEQUF5RDtBQUN6RCx1Q0FBNEU7QUFJckUsSUFBTSwyQkFBMkIsR0FBakMsTUFBTSwyQkFBMkI7SUFJdEMsTUFBTSxDQUFDLFdBQXdCO1FBQzdCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDcEMsTUFBTSxvQkFBb0IsR0FBRztZQUMzQixVQUFVLEVBQUUsc0JBQXNCO1lBQ2xDLElBQUksRUFBRSxjQUFjO1lBQ3BCLFFBQVEsRUFBRTtnQkFDUixNQUFNLEVBQ0osRUFBRSx3QkFBd0IsRUFBRSx3QkFBd0IsRUFBRTtnQkFDeEQsSUFBSSxFQUFFLEtBQUs7YUFDWjtZQUNELElBQUksRUFBRTtnQkFDSixVQUFVLEVBQUUsdUJBQXVCO2FBQ3BDO1NBQ0YsQ0FBQztRQUNGLElBQUksNEJBQWtCLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxtQkFBbUIsRUFBRTtZQUN6RCxPQUFPO1lBQ1AsUUFBUSxFQUFFLENBQUMsb0JBQW9CLENBQUM7WUFDaEMsU0FBUyxFQUFFLElBQUk7U0FDaEIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGLENBQUE7QUF4Qlksa0VBQTJCO0FBSXRDO0lBRkMsSUFBQSxxQkFBYSxFQUFDLGdDQUFnQyxDQUFDO0lBQy9DLElBQUEseUJBQWlCLEdBQUU7eURBb0JuQjtzQ0F2QlUsMkJBQTJCO0lBRHZDLG1CQUFXO0dBQ0MsMkJBQTJCLENBd0J2QyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENsdXN0ZXJBZGRPbiwgQ2x1c3RlckluZm8gfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgeyBLdWJlcm5ldGVzTWFuaWZlc3QgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWtzJztcclxuaW1wb3J0IHsgY29uZmxpY3RzV2l0aCwgbXVzdFJ1bk9uQXV0b01vZGUsIHN1cHBvcnRzQUxMIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5cclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgQUxCRGVmYXVsdEluZ3Jlc3NDbGFzc0FkZE9uIGltcGxlbWVudHMgQ2x1c3RlckFkZE9uIHtcclxuXHJcbiAgQGNvbmZsaWN0c1dpdGgoJ0F3c0xvYWRCYWxhbmNlckNvbnRyb2xsZXJBZGRPbicpXHJcbiAgQG11c3RSdW5PbkF1dG9Nb2RlKClcclxuICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogdm9pZCB7XHJcbiAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgIGNvbnN0IGluZ3Jlc3NDbGFzc01hbmlmZXN0ID0ge1xyXG4gICAgICBhcGlWZXJzaW9uOiBcIm5ldHdvcmtpbmcuazhzLmlvL3YxXCIsXHJcbiAgICAgIGtpbmQ6IFwiSW5ncmVzc0NsYXNzXCIsXHJcbiAgICAgIG1ldGFkYXRhOiB7XHJcbiAgICAgICAgbGFiZWxzOlxyXG4gICAgICAgICAgeyBcImFwcC5rdWJlcm5ldGVzLmlvL25hbWVcIjogXCJMb2FkQmFsYW5jZXJDb250cm9sbGVyXCIgfSxcclxuICAgICAgICBuYW1lOiBcImFsYlwiXHJcbiAgICAgIH0sXHJcbiAgICAgIHNwZWM6IHtcclxuICAgICAgICBjb250cm9sbGVyOiBcImVrcy5hbWF6b25hd3MuY29tL2FsYlwiXHJcbiAgICAgIH1cclxuICAgIH07XHJcbiAgICBuZXcgS3ViZXJuZXRlc01hbmlmZXN0KGNsdXN0ZXIuc3RhY2ssICdhbGItaW5ncmVzcy1jbGFzcycsIHtcclxuICAgICAgY2x1c3RlcixcclxuICAgICAgbWFuaWZlc3Q6IFtpbmdyZXNzQ2xhc3NNYW5pZmVzdF0sXHJcbiAgICAgIG92ZXJ3cml0ZTogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgfVxyXG59XHJcblxyXG4iXX0=