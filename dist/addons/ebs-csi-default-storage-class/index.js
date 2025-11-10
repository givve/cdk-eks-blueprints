"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EbsCsiDefaultStorageClassAddOn = void 0;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const utils_1 = require("../../utils");
let EbsCsiDefaultStorageClassAddOn = class EbsCsiDefaultStorageClassAddOn {
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        const storageClassManifest = {
            apiVersion: "storage.k8s.io/v1",
            kind: "StorageClass",
            metadata: {
                name: "auto-ebs-sc",
                annotations: {
                    "storageclass.kubernetes.io/is-default-class": "true"
                }
            },
            provisioner: "ebs.csi.eks.amazonaws.com",
            volumeBindingMode: "WaitForFirstConsumer",
            parameters: {
                type: "gp3",
                encrypted: "true"
            }
        };
        new aws_eks_1.KubernetesManifest(cluster.stack, 'ebs-storage-class', {
            cluster,
            manifest: [storageClassManifest],
            overwrite: true
        });
    }
};
exports.EbsCsiDefaultStorageClassAddOn = EbsCsiDefaultStorageClassAddOn;
__decorate([
    (0, utils_1.conflictsWith)('EbsCsiDriverAddOn'),
    (0, utils_1.mustRunOnAutoMode)()
], EbsCsiDefaultStorageClassAddOn.prototype, "deploy", null);
exports.EbsCsiDefaultStorageClassAddOn = EbsCsiDefaultStorageClassAddOn = __decorate([
    utils_1.supportsALL
], EbsCsiDefaultStorageClassAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2Vicy1jc2ktZGVmYXVsdC1zdG9yYWdlLWNsYXNzL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUNBLGlEQUF5RDtBQUN6RCx1Q0FBNEU7QUFJckUsSUFBTSw4QkFBOEIsR0FBcEMsTUFBTSw4QkFBOEI7SUFJekMsTUFBTSxDQUFDLFdBQXdCO1FBQzdCLE1BQU0sT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDcEMsTUFBTSxvQkFBb0IsR0FBRztZQUMzQixVQUFVLEVBQUUsbUJBQW1CO1lBQy9CLElBQUksRUFBRSxjQUFjO1lBQ3BCLFFBQVEsRUFBRTtnQkFDUixJQUFJLEVBQUUsYUFBYTtnQkFDbkIsV0FBVyxFQUFFO29CQUNYLDZDQUE2QyxFQUFFLE1BQU07aUJBQ3REO2FBQ0Y7WUFDRCxXQUFXLEVBQUUsMkJBQTJCO1lBQ3hDLGlCQUFpQixFQUFFLHNCQUFzQjtZQUN6QyxVQUFVLEVBQUU7Z0JBQ1YsSUFBSSxFQUFFLEtBQUs7Z0JBQ1gsU0FBUyxFQUFFLE1BQU07YUFDbEI7U0FDRixDQUFDO1FBQ0YsSUFBSSw0QkFBa0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLG1CQUFtQixFQUFFO1lBQ3pELE9BQU87WUFDUCxRQUFRLEVBQUUsQ0FBQyxvQkFBb0IsQ0FBQztZQUNoQyxTQUFTLEVBQUUsSUFBSTtTQUNoQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0YsQ0FBQTtBQTVCWSx3RUFBOEI7QUFJekM7SUFGQyxJQUFBLHFCQUFhLEVBQUMsbUJBQW1CLENBQUM7SUFDbEMsSUFBQSx5QkFBaUIsR0FBRTs0REF3Qm5CO3lDQTNCVSw4QkFBOEI7SUFEMUMsbUJBQVc7R0FDQyw4QkFBOEIsQ0E0QjFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ2x1c3RlckFkZE9uLCBDbHVzdGVySW5mbyB9IGZyb20gJy4uLy4uL3NwaSc7XHJcbmltcG9ydCB7IEt1YmVybmV0ZXNNYW5pZmVzdCB9IGZyb20gJ2F3cy1jZGstbGliL2F3cy1la3MnO1xyXG5pbXBvcnQgeyBjb25mbGljdHNXaXRoLCBtdXN0UnVuT25BdXRvTW9kZSwgc3VwcG9ydHNBTEwgfSBmcm9tICcuLi8uLi91dGlscyc7XHJcblxyXG5cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBFYnNDc2lEZWZhdWx0U3RvcmFnZUNsYXNzQWRkT24gaW1wbGVtZW50cyBDbHVzdGVyQWRkT24ge1xyXG5cclxuICBAY29uZmxpY3RzV2l0aCgnRWJzQ3NpRHJpdmVyQWRkT24nKVxyXG4gIEBtdXN0UnVuT25BdXRvTW9kZSgpXHJcbiAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQge1xyXG4gICAgY29uc3QgY2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcbiAgICBjb25zdCBzdG9yYWdlQ2xhc3NNYW5pZmVzdCA9IHtcclxuICAgICAgYXBpVmVyc2lvbjogXCJzdG9yYWdlLms4cy5pby92MVwiLFxyXG4gICAgICBraW5kOiBcIlN0b3JhZ2VDbGFzc1wiLFxyXG4gICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgIG5hbWU6IFwiYXV0by1lYnMtc2NcIixcclxuICAgICAgICBhbm5vdGF0aW9uczoge1xyXG4gICAgICAgICAgXCJzdG9yYWdlY2xhc3Mua3ViZXJuZXRlcy5pby9pcy1kZWZhdWx0LWNsYXNzXCI6IFwidHJ1ZVwiXHJcbiAgICAgICAgfVxyXG4gICAgICB9LFxyXG4gICAgICBwcm92aXNpb25lcjogXCJlYnMuY3NpLmVrcy5hbWF6b25hd3MuY29tXCIsXHJcbiAgICAgIHZvbHVtZUJpbmRpbmdNb2RlOiBcIldhaXRGb3JGaXJzdENvbnN1bWVyXCIsXHJcbiAgICAgIHBhcmFtZXRlcnM6IHtcclxuICAgICAgICB0eXBlOiBcImdwM1wiLFxyXG4gICAgICAgIGVuY3J5cHRlZDogXCJ0cnVlXCJcclxuICAgICAgfVxyXG4gICAgfTtcclxuICAgIG5ldyBLdWJlcm5ldGVzTWFuaWZlc3QoY2x1c3Rlci5zdGFjaywgJ2Vicy1zdG9yYWdlLWNsYXNzJywge1xyXG4gICAgICBjbHVzdGVyLFxyXG4gICAgICBtYW5pZmVzdDogW3N0b3JhZ2VDbGFzc01hbmlmZXN0XSxcclxuICAgICAgb3ZlcndyaXRlOiB0cnVlXHJcbiAgICB9KTtcclxuICB9XHJcbn1cclxuXHJcbiJdfQ==