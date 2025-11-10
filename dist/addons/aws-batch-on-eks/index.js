"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AwsBatchAddOn = void 0;
const assert = require("assert");
const aws_cdk_lib_1 = require("aws-cdk-lib");
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
const utils_1 = require("../../utils");
const BATCH = 'aws-batch';
let AwsBatchAddOn = class AwsBatchAddOn {
    deploy(clusterInfo) {
        assert(clusterInfo.cluster instanceof aws_eks_1.Cluster, "AwsBatchAddOn cannot be used with imported clusters");
        const cluster = clusterInfo.cluster;
        const roleNameforBatch = 'AWSServiceRoleForBatch';
        const slrCheck = aws_iam_1.Role.fromRoleName(cluster.stack, 'BatchServiceLinkedRole', roleNameforBatch);
        // Create the service role used by AWS Batch on EKS if one doesn't exist
        if (slrCheck.roleName != roleNameforBatch) {
            new aws_iam_1.CfnServiceLinkedRole(cluster.stack, 'BatchServiceRole', {
                awsServiceName: 'batch.amazonaws.com',
            });
        }
        //Init the service role as IRole because `addRoleMapping` method does not
        //support the CfnServiceLinkedRole type
        const batchEksServiceRole = aws_iam_1.Role.fromRoleArn(cluster.stack, 'ServiceRoleForBatch', `arn:aws:iam::${aws_cdk_lib_1.Stack.of(cluster.stack).account}:role/AWSServiceRoleForBatch`);
        //Add the service role to the AwsAuth
        cluster.awsAuth.addRoleMapping(batchEksServiceRole, {
            username: BATCH,
            groups: ['']
        });
        return Promise.resolve(batchEksServiceRole);
    }
};
exports.AwsBatchAddOn = AwsBatchAddOn;
exports.AwsBatchAddOn = AwsBatchAddOn = __decorate([
    utils_1.supportsALL
], AwsBatchAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2F3cy1iYXRjaC1vbi1la3MvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQUEsaUNBQWtDO0FBRWxDLDZDQUFvQztBQUNwQyxpREFBOEM7QUFDOUMsaURBQXdFO0FBRXhFLHVDQUEwQztBQUUxQyxNQUFNLEtBQUssR0FBRyxXQUFXLENBQUM7QUFHbkIsSUFBTSxhQUFhLEdBQW5CLE1BQU0sYUFBYTtJQUN4QixNQUFNLENBQUMsV0FBd0I7UUFDN0IsTUFBTSxDQUFDLFdBQVcsQ0FBQyxPQUFPLFlBQVksaUJBQU8sRUFBRSxxREFBcUQsQ0FBQyxDQUFDO1FBQ3RHLE1BQU0sT0FBTyxHQUFZLFdBQVcsQ0FBQyxPQUFPLENBQUM7UUFDN0MsTUFBTSxnQkFBZ0IsR0FBRyx3QkFBd0IsQ0FBQztRQUNsRCxNQUFNLFFBQVEsR0FBRyxjQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsd0JBQXdCLEVBQUUsZ0JBQWdCLENBQUMsQ0FBQztRQUU5Rix3RUFBd0U7UUFDeEUsSUFBSSxRQUFRLENBQUMsUUFBUSxJQUFJLGdCQUFnQixFQUFDLENBQUM7WUFDekMsSUFBSSw4QkFBb0IsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLGtCQUFrQixFQUFFO2dCQUMxRCxjQUFjLEVBQUUscUJBQXFCO2FBQ3RDLENBQUMsQ0FBQztRQUNMLENBQUM7UUFFRCx5RUFBeUU7UUFDekUsdUNBQXVDO1FBQ3ZDLE1BQU0sbUJBQW1CLEdBQVUsY0FBSSxDQUFDLFdBQVcsQ0FDakQsT0FBTyxDQUFDLEtBQUssRUFDYixxQkFBcUIsRUFDckIsZ0JBQWdCLG1CQUFLLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxPQUFPLDhCQUE4QixDQUM5RSxDQUFDO1FBRUYscUNBQXFDO1FBQ3JDLE9BQU8sQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUM1QixtQkFBbUIsRUFDbkI7WUFDRSxRQUFRLEVBQUUsS0FBSztZQUNmLE1BQU0sRUFBRSxDQUFDLEVBQUUsQ0FBQztTQUNiLENBQ0YsQ0FBQztRQUVGLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0lBRTlDLENBQUM7Q0FDRixDQUFBO0FBbENZLHNDQUFhO3dCQUFiLGFBQWE7SUFEekIsbUJBQVc7R0FDQyxhQUFhLENBa0N6QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBhc3NlcnQgPSByZXF1aXJlKFwiYXNzZXJ0XCIpO1xyXG5pbXBvcnQgeyBDbHVzdGVyQWRkT24sIENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBTdGFjayB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBDbHVzdGVyIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgQ2ZuU2VydmljZUxpbmtlZFJvbGUsIElSb2xlLCBSb2xlIH0gZnJvbSBcImF3cy1jZGstbGliL2F3cy1pYW1cIjtcclxuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgc3VwcG9ydHNBTEwgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuXHJcbmNvbnN0IEJBVENIID0gJ2F3cy1iYXRjaCc7XHJcblxyXG5Ac3VwcG9ydHNBTExcclxuZXhwb3J0IGNsYXNzIEF3c0JhdGNoQWRkT24gaW1wbGVtZW50cyBDbHVzdGVyQWRkT24ge1xyXG4gIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgYXNzZXJ0KGNsdXN0ZXJJbmZvLmNsdXN0ZXIgaW5zdGFuY2VvZiBDbHVzdGVyLCBcIkF3c0JhdGNoQWRkT24gY2Fubm90IGJlIHVzZWQgd2l0aCBpbXBvcnRlZCBjbHVzdGVyc1wiKTtcclxuICAgIGNvbnN0IGNsdXN0ZXI6IENsdXN0ZXIgPSBjbHVzdGVySW5mby5jbHVzdGVyO1xyXG4gICAgY29uc3Qgcm9sZU5hbWVmb3JCYXRjaCA9ICdBV1NTZXJ2aWNlUm9sZUZvckJhdGNoJztcclxuICAgIGNvbnN0IHNsckNoZWNrID0gUm9sZS5mcm9tUm9sZU5hbWUoY2x1c3Rlci5zdGFjaywgJ0JhdGNoU2VydmljZUxpbmtlZFJvbGUnLCByb2xlTmFtZWZvckJhdGNoKTtcclxuXHJcbiAgICAvLyBDcmVhdGUgdGhlIHNlcnZpY2Ugcm9sZSB1c2VkIGJ5IEFXUyBCYXRjaCBvbiBFS1MgaWYgb25lIGRvZXNuJ3QgZXhpc3RcclxuICAgIGlmIChzbHJDaGVjay5yb2xlTmFtZSAhPSByb2xlTmFtZWZvckJhdGNoKXtcclxuICAgICAgbmV3IENmblNlcnZpY2VMaW5rZWRSb2xlKGNsdXN0ZXIuc3RhY2ssICdCYXRjaFNlcnZpY2VSb2xlJywge1xyXG4gICAgICAgIGF3c1NlcnZpY2VOYW1lOiAnYmF0Y2guYW1hem9uYXdzLmNvbScsXHJcbiAgICAgIH0pO1xyXG4gICAgfSAgICBcclxuXHJcbiAgICAvL0luaXQgdGhlIHNlcnZpY2Ugcm9sZSBhcyBJUm9sZSBiZWNhdXNlIGBhZGRSb2xlTWFwcGluZ2AgbWV0aG9kIGRvZXMgbm90XHJcbiAgICAvL3N1cHBvcnQgdGhlIENmblNlcnZpY2VMaW5rZWRSb2xlIHR5cGVcclxuICAgIGNvbnN0IGJhdGNoRWtzU2VydmljZVJvbGU6IElSb2xlID0gUm9sZS5mcm9tUm9sZUFybihcclxuICAgICAgY2x1c3Rlci5zdGFjayxcclxuICAgICAgJ1NlcnZpY2VSb2xlRm9yQmF0Y2gnLFxyXG4gICAgICBgYXJuOmF3czppYW06OiR7U3RhY2sub2YoY2x1c3Rlci5zdGFjaykuYWNjb3VudH06cm9sZS9BV1NTZXJ2aWNlUm9sZUZvckJhdGNoYCxcclxuICAgICk7XHJcbiAgICBcclxuICAgIC8vQWRkIHRoZSBzZXJ2aWNlIHJvbGUgdG8gdGhlIEF3c0F1dGhcclxuICAgIGNsdXN0ZXIuYXdzQXV0aC5hZGRSb2xlTWFwcGluZyhcclxuICAgICAgYmF0Y2hFa3NTZXJ2aWNlUm9sZSxcclxuICAgICAge1xyXG4gICAgICAgIHVzZXJuYW1lOiBCQVRDSCxcclxuICAgICAgICBncm91cHM6IFsnJ11cclxuICAgICAgfVxyXG4gICAgKTtcclxuICBcclxuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoYmF0Y2hFa3NTZXJ2aWNlUm9sZSk7XHJcblxyXG4gIH1cclxufSJdfQ==