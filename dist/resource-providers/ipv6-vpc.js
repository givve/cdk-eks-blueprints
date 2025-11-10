"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ipv6VpcProvider = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const aws_ec2_1 = require("aws-cdk-lib/aws-ec2");
const vpc_1 = require("./vpc");
/**
 * IPV6 VPC resource provider
 */
class Ipv6VpcProvider {
    vpcId;
    constructor(vpcId) {
        this.vpcId = vpcId;
    }
    provide(context) {
        const id = context.scope.node.id;
        let vpc = (0, vpc_1.getVPCFromId)(context, id, this.vpcId);
        if (vpc == null) {
            // It will automatically divide the provided VPC CIDR range, and create public and private subnets per Availability Zone.
            // Network routing for the public subnets will be configured to allow outbound access directly via an Internet Gateway.
            // Network routing for the private subnets will be configured to allow outbound access via a one NAT Gateway to reduce the cost.
            // IPv6 does not require NAT for pod to pod communication. By default, we are creating one NAT for cluster communications outside endpoints if any.
            return this.getIPv6VPC(context, id);
        }
        return vpc;
    }
    /*
    ** AWS recommend to have dual stack vpc for ipv6 EKS clusters. This functions creates VPC required for IPV6 cluster.
    ** For more info refer: https://docs.aws.amazon.com/vpc/latest/userguide/vpc-migrate-ipv6-add.html
     */
    getIPv6VPC(context, id) {
        // Create VPC with dual stack mode
        // Setting natGateways lower than the number of Availability Zones in VPC in order to save on NAT cost.
        const vpc = new ec2.Vpc(context.scope, id + "-vpc", { natGateways: 1,
            ipProtocol: aws_ec2_1.IpProtocol.DUAL_STACK, restrictDefaultSecurityGroup: false });
        // Create and associate IPV6 CIDR blocks
        const ipv6Cidr = new ec2.CfnVPCCidrBlock(context.scope, id + "-CIDR6", {
            vpcId: vpc.vpcId,
            amazonProvidedIpv6CidrBlock: true,
        });
        let subnetCount = 0;
        let subnets = [...vpc.publicSubnets, ...vpc.privateSubnets];
        // associate an IPv6 CIDR block with a subnet
        for (let subnet of subnets) {
            // Wait for the ipv6 cidr to complete
            subnet.node.addDependency(ipv6Cidr);
            this.associateSubnetsWithIpv6CIDR(subnetCount, subnet, vpc);
            subnetCount++;
        }
        return vpc;
    }
    /*
    ** For IPV6 vpc we need to attach subnets with available ipv6Cidr blocks in the vpc.
    ** Refer steps in here: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/intrinsic-function-reference-cidr.html
     */
    associateSubnetsWithIpv6CIDR(count, subnet, vpc) {
        const cfnSubnet = subnet.node.defaultChild;
        // The VPC is associated with /56 for amazonProvidedIpv6CidrBlock. So value of 64 subnet mask. so 256 cidr blocks are available.
        // Having 64 as subnet mask will give 2^64 IP's for each subnet. Which high enough for any kind of workload.
        const ipv6CIDRSubnetMask = "64";
        cfnSubnet.ipv6CidrBlock = aws_cdk_lib_1.Fn.select(count, aws_cdk_lib_1.Fn.cidr(aws_cdk_lib_1.Fn.select(0, vpc.vpcIpv6CidrBlocks), 256, ipv6CIDRSubnetMask));
        cfnSubnet.assignIpv6AddressOnCreation = true;
    }
}
exports.Ipv6VpcProvider = Ipv6VpcProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXB2Ni12cGMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcmVzb3VyY2UtcHJvdmlkZXJzL2lwdjYtdnBjLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUFBLDZDQUErQjtBQUMvQiwyQ0FBMkM7QUFDM0MsaURBQXFEO0FBRXJELCtCQUFtQztBQUVuQzs7R0FFRztBQUNILE1BQWEsZUFBZTtJQUNmLEtBQUssQ0FBVTtJQUV4QixZQUFZLEtBQWM7UUFDdEIsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDdkIsQ0FBQztJQUVELE9BQU8sQ0FBQyxPQUF3QjtRQUM1QixNQUFNLEVBQUUsR0FBRyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUM7UUFDakMsSUFBSSxHQUFHLEdBQUcsSUFBQSxrQkFBWSxFQUFDLE9BQU8sRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ2hELElBQUksR0FBRyxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ2QseUhBQXlIO1lBQ3pILHVIQUF1SDtZQUN2SCxnSUFBZ0k7WUFDaEksbUpBQW1KO1lBQ25KLE9BQU8sSUFBSSxDQUFDLFVBQVUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFDeEMsQ0FBQztRQUNELE9BQU8sR0FBRyxDQUFDO0lBQ2YsQ0FBQztJQUVEOzs7T0FHRztJQUNILFVBQVUsQ0FBQyxPQUF3QixFQUFFLEVBQVU7UUFDM0Msa0NBQWtDO1FBQ2xDLHVHQUF1RztRQUN2RyxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxFQUFFLEdBQUMsTUFBTSxFQUFFLEVBQUUsV0FBVyxFQUFFLENBQUM7WUFDOUQsVUFBVSxFQUFFLG9CQUFVLENBQUMsVUFBVSxFQUFFLDRCQUE0QixFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7UUFFOUUsd0NBQXdDO1FBQ3hDLE1BQU0sUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLGVBQWUsQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLEVBQUUsR0FBQyxRQUFRLEVBQUU7WUFDakUsS0FBSyxFQUFFLEdBQUcsQ0FBQyxLQUFLO1lBQ2hCLDJCQUEyQixFQUFFLElBQUk7U0FDcEMsQ0FBQyxDQUFDO1FBQ0gsSUFBSSxXQUFXLEdBQUcsQ0FBQyxDQUFDO1FBQ3BCLElBQUksT0FBTyxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsYUFBYSxFQUFFLEdBQUcsR0FBRyxDQUFDLGNBQWMsQ0FBQyxDQUFDO1FBRTVELDZDQUE2QztRQUM3QyxLQUFNLElBQUksTUFBTSxJQUFJLE9BQU8sRUFBRSxDQUFDO1lBQzFCLHFDQUFxQztZQUNyQyxNQUFNLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsNEJBQTRCLENBQUMsV0FBVyxFQUFFLE1BQU0sRUFBRSxHQUFHLENBQUMsQ0FBQztZQUM1RCxXQUFXLEVBQUUsQ0FBQztRQUNsQixDQUFDO1FBQ0QsT0FBTyxHQUFHLENBQUM7SUFDZixDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsNEJBQTRCLENBQUMsS0FBYSxFQUFFLE1BQW1CLEVBQUUsR0FBUTtRQUNyRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLFlBQTZCLENBQUM7UUFDNUQsZ0lBQWdJO1FBQ2hJLDRHQUE0RztRQUM1RyxNQUFNLGtCQUFrQixHQUFHLElBQUksQ0FBQztRQUNoQyxTQUFTLENBQUMsYUFBYSxHQUFHLGdCQUFFLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxnQkFBRSxDQUFDLElBQUksQ0FBQyxnQkFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLGlCQUFpQixDQUFDLEVBQUUsR0FBRyxFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztRQUNsSCxTQUFTLENBQUMsMkJBQTJCLEdBQUcsSUFBSSxDQUFDO0lBQ2pELENBQUM7Q0FFSjtBQTdERCwwQ0E2REMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge0ZufSBmcm9tICdhd3MtY2RrLWxpYic7XHJcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcclxuaW1wb3J0IHtJcFByb3RvY29sLCBWcGMgfSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcclxuaW1wb3J0IHsgUmVzb3VyY2VDb250ZXh0LCBSZXNvdXJjZVByb3ZpZGVyIH0gZnJvbSBcIi4uL3NwaVwiO1xyXG5pbXBvcnQge2dldFZQQ0Zyb21JZH0gZnJvbSBcIi4vdnBjXCI7XHJcblxyXG4vKipcclxuICogSVBWNiBWUEMgcmVzb3VyY2UgcHJvdmlkZXJcclxuICovXHJcbmV4cG9ydCBjbGFzcyBJcHY2VnBjUHJvdmlkZXIgaW1wbGVtZW50cyBSZXNvdXJjZVByb3ZpZGVyPGVjMi5JVnBjPiB7XHJcbiAgICByZWFkb25seSB2cGNJZD86IHN0cmluZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih2cGNJZD86IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMudnBjSWQgPSB2cGNJZDtcclxuICAgIH1cclxuXHJcbiAgICBwcm92aWRlKGNvbnRleHQ6IFJlc291cmNlQ29udGV4dCk6IGVjMi5JVnBjIHtcclxuICAgICAgICBjb25zdCBpZCA9IGNvbnRleHQuc2NvcGUubm9kZS5pZDtcclxuICAgICAgICBsZXQgdnBjID0gZ2V0VlBDRnJvbUlkKGNvbnRleHQsIGlkLCB0aGlzLnZwY0lkKTtcclxuICAgICAgICBpZiAodnBjID09IG51bGwpIHtcclxuICAgICAgICAgICAgLy8gSXQgd2lsbCBhdXRvbWF0aWNhbGx5IGRpdmlkZSB0aGUgcHJvdmlkZWQgVlBDIENJRFIgcmFuZ2UsIGFuZCBjcmVhdGUgcHVibGljIGFuZCBwcml2YXRlIHN1Ym5ldHMgcGVyIEF2YWlsYWJpbGl0eSBab25lLlxyXG4gICAgICAgICAgICAvLyBOZXR3b3JrIHJvdXRpbmcgZm9yIHRoZSBwdWJsaWMgc3VibmV0cyB3aWxsIGJlIGNvbmZpZ3VyZWQgdG8gYWxsb3cgb3V0Ym91bmQgYWNjZXNzIGRpcmVjdGx5IHZpYSBhbiBJbnRlcm5ldCBHYXRld2F5LlxyXG4gICAgICAgICAgICAvLyBOZXR3b3JrIHJvdXRpbmcgZm9yIHRoZSBwcml2YXRlIHN1Ym5ldHMgd2lsbCBiZSBjb25maWd1cmVkIHRvIGFsbG93IG91dGJvdW5kIGFjY2VzcyB2aWEgYSBvbmUgTkFUIEdhdGV3YXkgdG8gcmVkdWNlIHRoZSBjb3N0LlxyXG4gICAgICAgICAgICAvLyBJUHY2IGRvZXMgbm90IHJlcXVpcmUgTkFUIGZvciBwb2QgdG8gcG9kIGNvbW11bmljYXRpb24uIEJ5IGRlZmF1bHQsIHdlIGFyZSBjcmVhdGluZyBvbmUgTkFUIGZvciBjbHVzdGVyIGNvbW11bmljYXRpb25zIG91dHNpZGUgZW5kcG9pbnRzIGlmIGFueS5cclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0SVB2NlZQQyhjb250ZXh0LCBpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiB2cGM7XHJcbiAgICB9XHJcblxyXG4gICAgLypcclxuICAgICoqIEFXUyByZWNvbW1lbmQgdG8gaGF2ZSBkdWFsIHN0YWNrIHZwYyBmb3IgaXB2NiBFS1MgY2x1c3RlcnMuIFRoaXMgZnVuY3Rpb25zIGNyZWF0ZXMgVlBDIHJlcXVpcmVkIGZvciBJUFY2IGNsdXN0ZXIuXHJcbiAgICAqKiBGb3IgbW9yZSBpbmZvIHJlZmVyOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vdnBjL2xhdGVzdC91c2VyZ3VpZGUvdnBjLW1pZ3JhdGUtaXB2Ni1hZGQuaHRtbFxyXG4gICAgICovXHJcbiAgICBnZXRJUHY2VlBDKGNvbnRleHQ6IFJlc291cmNlQ29udGV4dCwgaWQ6IHN0cmluZyk6ZWMyLklWcGMge1xyXG4gICAgICAgIC8vIENyZWF0ZSBWUEMgd2l0aCBkdWFsIHN0YWNrIG1vZGVcclxuICAgICAgICAvLyBTZXR0aW5nIG5hdEdhdGV3YXlzIGxvd2VyIHRoYW4gdGhlIG51bWJlciBvZiBBdmFpbGFiaWxpdHkgWm9uZXMgaW4gVlBDIGluIG9yZGVyIHRvIHNhdmUgb24gTkFUIGNvc3QuXHJcbiAgICAgICAgY29uc3QgdnBjID0gbmV3IGVjMi5WcGMoY29udGV4dC5zY29wZSwgaWQrXCItdnBjXCIsIHsgbmF0R2F0ZXdheXM6IDEsXHJcbiAgICAgICAgICAgIGlwUHJvdG9jb2w6IElwUHJvdG9jb2wuRFVBTF9TVEFDSywgcmVzdHJpY3REZWZhdWx0U2VjdXJpdHlHcm91cDogZmFsc2UgfSk7XHJcblxyXG4gICAgICAgIC8vIENyZWF0ZSBhbmQgYXNzb2NpYXRlIElQVjYgQ0lEUiBibG9ja3NcclxuICAgICAgICBjb25zdCBpcHY2Q2lkciA9IG5ldyBlYzIuQ2ZuVlBDQ2lkckJsb2NrKGNvbnRleHQuc2NvcGUsIGlkK1wiLUNJRFI2XCIsIHtcclxuICAgICAgICAgICAgdnBjSWQ6IHZwYy52cGNJZCxcclxuICAgICAgICAgICAgYW1hem9uUHJvdmlkZWRJcHY2Q2lkckJsb2NrOiB0cnVlLFxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIGxldCBzdWJuZXRDb3VudCA9IDA7XHJcbiAgICAgICAgbGV0IHN1Ym5ldHMgPSBbLi4udnBjLnB1YmxpY1N1Ym5ldHMsIC4uLnZwYy5wcml2YXRlU3VibmV0c107XHJcblxyXG4gICAgICAgIC8vIGFzc29jaWF0ZSBhbiBJUHY2IENJRFIgYmxvY2sgd2l0aCBhIHN1Ym5ldFxyXG4gICAgICAgIGZvciAoIGxldCBzdWJuZXQgb2Ygc3VibmV0cykge1xyXG4gICAgICAgICAgICAvLyBXYWl0IGZvciB0aGUgaXB2NiBjaWRyIHRvIGNvbXBsZXRlXHJcbiAgICAgICAgICAgIHN1Ym5ldC5ub2RlLmFkZERlcGVuZGVuY3koaXB2NkNpZHIpO1xyXG4gICAgICAgICAgICB0aGlzLmFzc29jaWF0ZVN1Ym5ldHNXaXRoSXB2NkNJRFIoc3VibmV0Q291bnQsIHN1Ym5ldCwgdnBjKTtcclxuICAgICAgICAgICAgc3VibmV0Q291bnQrKztcclxuICAgICAgICB9XHJcbiAgICAgICAgcmV0dXJuIHZwYztcclxuICAgIH1cclxuXHJcbiAgICAvKlxyXG4gICAgKiogRm9yIElQVjYgdnBjIHdlIG5lZWQgdG8gYXR0YWNoIHN1Ym5ldHMgd2l0aCBhdmFpbGFibGUgaXB2NkNpZHIgYmxvY2tzIGluIHRoZSB2cGMuXHJcbiAgICAqKiBSZWZlciBzdGVwcyBpbiBoZXJlOiBodHRwczovL2RvY3MuYXdzLmFtYXpvbi5jb20vQVdTQ2xvdWRGb3JtYXRpb24vbGF0ZXN0L1VzZXJHdWlkZS9pbnRyaW5zaWMtZnVuY3Rpb24tcmVmZXJlbmNlLWNpZHIuaHRtbFxyXG4gICAgICovXHJcbiAgICBhc3NvY2lhdGVTdWJuZXRzV2l0aElwdjZDSURSKGNvdW50OiBudW1iZXIsIHN1Ym5ldDogZWMyLklTdWJuZXQsIHZwYzogVnBjKSB7XHJcbiAgICAgICAgY29uc3QgY2ZuU3VibmV0ID0gc3VibmV0Lm5vZGUuZGVmYXVsdENoaWxkIGFzIGVjMi5DZm5TdWJuZXQ7XHJcbiAgICAgICAgLy8gVGhlIFZQQyBpcyBhc3NvY2lhdGVkIHdpdGggLzU2IGZvciBhbWF6b25Qcm92aWRlZElwdjZDaWRyQmxvY2suIFNvIHZhbHVlIG9mIDY0IHN1Ym5ldCBtYXNrLiBzbyAyNTYgY2lkciBibG9ja3MgYXJlIGF2YWlsYWJsZS5cclxuICAgICAgICAvLyBIYXZpbmcgNjQgYXMgc3VibmV0IG1hc2sgd2lsbCBnaXZlIDJeNjQgSVAncyBmb3IgZWFjaCBzdWJuZXQuIFdoaWNoIGhpZ2ggZW5vdWdoIGZvciBhbnkga2luZCBvZiB3b3JrbG9hZC5cclxuICAgICAgICBjb25zdCBpcHY2Q0lEUlN1Ym5ldE1hc2sgPSBcIjY0XCI7XHJcbiAgICAgICAgY2ZuU3VibmV0LmlwdjZDaWRyQmxvY2sgPSBGbi5zZWxlY3QoY291bnQsIEZuLmNpZHIoRm4uc2VsZWN0KDAsIHZwYy52cGNJcHY2Q2lkckJsb2NrcyksIDI1NiwgaXB2NkNJRFJTdWJuZXRNYXNrKSk7XHJcbiAgICAgICAgY2ZuU3VibmV0LmFzc2lnbklwdjZBZGRyZXNzT25DcmVhdGlvbiA9IHRydWU7XHJcbiAgICB9XHJcblxyXG59XHJcbiJdfQ==