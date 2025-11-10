"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmrEksAddOn = void 0;
const assert = require("assert");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const utils_1 = require("../../utils");
let EmrEksAddOn = class EmrEksAddOn {
    deploy(clusterInfo) {
        assert(clusterInfo.cluster instanceof aws_eks_1.Cluster, "EmrEksAddOn cannot be used with imported clusters as it requires changes to the cluster authentication.");
        const cluster = clusterInfo.cluster;
        /*
        * Create the service role used by EMR on EKS
        */
        const emrOnEksSlr = new aws_iam_1.CfnServiceLinkedRole(cluster.stack, 'EmrServiceRole', {
            awsServiceName: 'emr-containers.amazonaws.com',
        });
        //Init the service role as IRole because `addRoleMapping` method does not
        //support the CfnServiceLinkedRole type
        const emrEksServiceRole = aws_iam_1.Role.fromRoleArn(cluster.stack, 'ServiceRoleForAmazonEMRContainers', `arn:aws:iam::${aws_cdk_lib_1.Stack.of(cluster.stack).account}:role/AWSServiceRoleForAmazonEMRContainers`);
        //Add the service role to the AwsAuth
        cluster.awsAuth.addRoleMapping(emrEksServiceRole, {
            username: 'emr-containers',
            groups: ['']
        });
        return Promise.resolve(emrOnEksSlr);
    }
};
exports.EmrEksAddOn = EmrEksAddOn;
exports.EmrEksAddOn = EmrEksAddOn = __decorate([
    utils_1.supportsALL
], EmrEksAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2Vtci1vbi1la3MvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaUNBQWtDO0FBRWxDLDZDQUFvQztBQUNwQyxpREFBOEM7QUFDOUMsaURBQXdFO0FBRXhFLHVDQUEwQztBQUduQyxJQUFNLFdBQVcsR0FBakIsTUFBTSxXQUFXO0lBQ3RCLE1BQU0sQ0FBQyxXQUF3QjtRQUM3QixNQUFNLENBQUMsV0FBVyxDQUFDLE9BQU8sWUFBWSxpQkFBTyxFQUFFLHlHQUF5RyxDQUFDLENBQUM7UUFDMUosTUFBTSxPQUFPLEdBQVksV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUU3Qzs7VUFFRTtRQUNGLE1BQU0sV0FBVyxHQUFHLElBQUksOEJBQW9CLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxnQkFBZ0IsRUFBRTtZQUM1RSxjQUFjLEVBQUUsOEJBQThCO1NBQy9DLENBQUMsQ0FBQztRQUdILHlFQUF5RTtRQUN6RSx1Q0FBdUM7UUFDdkMsTUFBTSxpQkFBaUIsR0FBVSxjQUFJLENBQUMsV0FBVyxDQUMvQyxPQUFPLENBQUMsS0FBSyxFQUNiLG1DQUFtQyxFQUNuQyxnQkFBZ0IsbUJBQUssQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDLE9BQ3hDLDRDQUE0QyxDQUM3QyxDQUFDO1FBRUYscUNBQXFDO1FBQ3JDLE9BQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUM1QixpQkFBaUIsRUFDakI7WUFDRSxRQUFRLEVBQUUsZ0JBQWdCO1lBQzFCLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztTQUNiLENBQ0YsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUN0QyxDQUFDO0NBQ0YsQ0FBQTtBQWpDWSxrQ0FBVztzQkFBWCxXQUFXO0lBRHZCLG1CQUFXO0dBQ0MsV0FBVyxDQWlDdkIiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYXNzZXJ0ID0gcmVxdWlyZShcImFzc2VydFwiKTtcclxuaW1wb3J0IHsgQ2x1c3RlckFkZE9uLCBDbHVzdGVySW5mbyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgU3RhY2sgfSBmcm9tIFwiYXdzLWNkay1saWJcIjtcclxuaW1wb3J0IHsgQ2x1c3RlciB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcbmltcG9ydCB7IENmblNlcnZpY2VMaW5rZWRSb2xlLCBJUm9sZSwgUm9sZSB9IGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtaWFtXCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCB7IHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIEVtckVrc0FkZE9uIGltcGxlbWVudHMgQ2x1c3RlckFkZE9uIHtcclxuICBkZXBsb3koY2x1c3RlckluZm86IENsdXN0ZXJJbmZvKTogUHJvbWlzZTxDb25zdHJ1Y3Q+IHtcclxuICAgIGFzc2VydChjbHVzdGVySW5mby5jbHVzdGVyIGluc3RhbmNlb2YgQ2x1c3RlciwgXCJFbXJFa3NBZGRPbiBjYW5ub3QgYmUgdXNlZCB3aXRoIGltcG9ydGVkIGNsdXN0ZXJzIGFzIGl0IHJlcXVpcmVzIGNoYW5nZXMgdG8gdGhlIGNsdXN0ZXIgYXV0aGVudGljYXRpb24uXCIpO1xyXG4gICAgY29uc3QgY2x1c3RlcjogQ2x1c3RlciA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXI7XHJcblxyXG4gICAgLypcclxuICAgICogQ3JlYXRlIHRoZSBzZXJ2aWNlIHJvbGUgdXNlZCBieSBFTVIgb24gRUtTIFxyXG4gICAgKi9cclxuICAgIGNvbnN0IGVtck9uRWtzU2xyID0gbmV3IENmblNlcnZpY2VMaW5rZWRSb2xlKGNsdXN0ZXIuc3RhY2ssICdFbXJTZXJ2aWNlUm9sZScsIHtcclxuICAgICAgYXdzU2VydmljZU5hbWU6ICdlbXItY29udGFpbmVycy5hbWF6b25hd3MuY29tJyxcclxuICAgIH0pO1xyXG5cclxuXHJcbiAgICAvL0luaXQgdGhlIHNlcnZpY2Ugcm9sZSBhcyBJUm9sZSBiZWNhdXNlIGBhZGRSb2xlTWFwcGluZ2AgbWV0aG9kIGRvZXMgbm90XHJcbiAgICAvL3N1cHBvcnQgdGhlIENmblNlcnZpY2VMaW5rZWRSb2xlIHR5cGVcclxuICAgIGNvbnN0IGVtckVrc1NlcnZpY2VSb2xlOiBJUm9sZSA9IFJvbGUuZnJvbVJvbGVBcm4oXHJcbiAgICAgIGNsdXN0ZXIuc3RhY2ssXHJcbiAgICAgICdTZXJ2aWNlUm9sZUZvckFtYXpvbkVNUkNvbnRhaW5lcnMnLFxyXG4gICAgICBgYXJuOmF3czppYW06OiR7U3RhY2sub2YoY2x1c3Rlci5zdGFjaykuYWNjb3VudFxyXG4gICAgICB9OnJvbGUvQVdTU2VydmljZVJvbGVGb3JBbWF6b25FTVJDb250YWluZXJzYCxcclxuICAgICk7XHJcbiAgICBcclxuICAgIC8vQWRkIHRoZSBzZXJ2aWNlIHJvbGUgdG8gdGhlIEF3c0F1dGhcclxuICAgIGNsdXN0ZXIuYXdzQXV0aC5hZGRSb2xlTWFwcGluZyhcclxuICAgICAgZW1yRWtzU2VydmljZVJvbGUsXHJcbiAgICAgIHtcclxuICAgICAgICB1c2VybmFtZTogJ2Vtci1jb250YWluZXJzJyxcclxuICAgICAgICBncm91cHM6IFsnJ11cclxuICAgICAgfVxyXG4gICAgKTtcclxuICBcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoZW1yT25Fa3NTbHIpO1xyXG4gIH1cclxufSJdfQ==