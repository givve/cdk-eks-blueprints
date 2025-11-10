"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LookupSubnetProvider = exports.DirectVpcProvider = exports.VpcProvider = void 0;
exports.getVPCFromId = getVPCFromId;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const ec2 = require("aws-cdk-lib/aws-ec2");
const eks = require("aws-cdk-lib/aws-eks");
const ipv6_vpc_1 = require("./ipv6-vpc");
/**
 * VPC resource provider
 */
class VpcProvider {
    vpcProps;
    vpcId;
    primaryCidr;
    secondaryCidr;
    secondarySubnetCidrs;
    constructor(vpcId, vpcProps) {
        this.vpcProps = vpcProps;
        this.vpcId = vpcId;
        this.primaryCidr = vpcProps?.primaryCidr;
        this.secondaryCidr = vpcProps?.secondaryCidr;
        this.secondarySubnetCidrs = vpcProps?.secondarySubnetCidrs;
    }
    provide(context) {
        const id = context.scope.node.id;
        const ipFamily = context.blueprintProps.ipFamily;
        if (ipFamily == eks.IpFamily.IP_V6) {
            const ipv6VpcProvider = new ipv6_vpc_1.Ipv6VpcProvider(this.vpcId);
            return ipv6VpcProvider.provide(context);
        }
        let vpc = getVPCFromId(context, id, this.vpcId);
        if (vpc == null) {
            // It will automatically divide the provided VPC CIDR range, and create public and private subnets per Availability Zone.
            // If VPC CIDR range is not provided, uses `10.0.0.0/16` as the range and creates public and private subnets per Availability Zone.
            // Network routing for the public subnets will be configured to allow outbound access directly via an Internet Gateway.
            // Network routing for the private subnets will be configured to allow outbound access via a set of resilient NAT Gateways (one per AZ).
            // Creates Secondary CIDR and Secondary subnets if passed.
            if (this.primaryCidr) {
                vpc = new ec2.Vpc(context.scope, id + "-vpc", {
                    ipAddresses: ec2.IpAddresses.cidr(this.primaryCidr)
                });
            }
            else {
                vpc = new ec2.Vpc(context.scope, id + "-vpc");
            }
        }
        if (this.secondaryCidr) {
            this.createSecondarySubnets(context, id, vpc);
        }
        return vpc;
    }
    createSecondarySubnets(context, id, vpc) {
        const secondarySubnets = [];
        const secondaryCidr = new ec2.CfnVPCCidrBlock(context.scope, id + "-secondaryCidr", {
            vpcId: vpc.vpcId,
            cidrBlock: this.secondaryCidr
        });
        secondaryCidr.node.addDependency(vpc);
        if (this.secondarySubnetCidrs) {
            for (let i = 0; i < vpc.availabilityZones.length; i++) {
                if (this.secondarySubnetCidrs[i]) {
                    secondarySubnets[i] = new ec2.PrivateSubnet(context.scope, id + "private-subnet-" + i, {
                        availabilityZone: vpc.availabilityZones[i],
                        cidrBlock: this.secondarySubnetCidrs[i],
                        vpcId: vpc.vpcId
                    });
                    secondarySubnets[i].node.addDependency(secondaryCidr);
                    context.add("secondary-cidr-subnet-" + i, {
                        provide(_context) { return secondarySubnets[i]; }
                    });
                }
            }
            for (let secondarySubnet of secondarySubnets) {
                aws_cdk_lib_1.Tags.of(secondarySubnet).add("kubernetes.io/role/internal-elb", "1", { applyToLaunchedInstances: true });
                aws_cdk_lib_1.Tags.of(secondarySubnet).add("Name", `blueprint-construct-dev-PrivateSubnet-${secondarySubnet}`, { applyToLaunchedInstances: true });
            }
        }
    }
}
exports.VpcProvider = VpcProvider;
/*
** This function will give return vpc based on the ResourceContext and vpcId passed to the cluster.
 */
function getVPCFromId(context, nodeId, vpcId) {
    let vpc = undefined;
    if (vpcId) {
        if (vpcId === "default") {
            console.log(`looking up completely default VPC`);
            vpc = ec2.Vpc.fromLookup(context.scope, nodeId + "-vpc", { isDefault: true });
        }
        else {
            console.log(`looking up non-default ${vpcId} VPC`);
            vpc = ec2.Vpc.fromLookup(context.scope, nodeId + "-vpc", { vpcId: vpcId });
        }
    }
    return vpc;
}
class DirectVpcProvider {
    vpc;
    constructor(vpc) {
        this.vpc = vpc;
    }
    provide(_context) {
        return this.vpc;
    }
}
exports.DirectVpcProvider = DirectVpcProvider;
/**
 * Direct import secondary subnet provider, based on a known subnet ID.
 * Recommended method if secondary subnet id is known, as it avoids extra look-ups.
 */
class LookupSubnetProvider {
    subnetId;
    constructor(subnetId) {
        this.subnetId = subnetId;
    }
    provide(context) {
        return ec2.Subnet.fromSubnetAttributes(context.scope, `${this.subnetId}-secondarysubnet`, { subnetId: this.subnetId });
    }
}
exports.LookupSubnetProvider = LookupSubnetProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3Jlc291cmNlLXByb3ZpZGVycy92cGMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBb0dBLG9DQVlDO0FBaEhELDZDQUFtQztBQUNuQywyQ0FBMkM7QUFHM0MsMkNBQTJDO0FBQzNDLHlDQUEyQztBQVczQzs7R0FFRztBQUNILE1BQWEsV0FBVztJQU1nQjtJQUwzQixLQUFLLENBQVU7SUFDZixXQUFXLENBQVU7SUFDckIsYUFBYSxDQUFVO0lBQ3ZCLG9CQUFvQixDQUFZO0lBRXpDLFlBQVksS0FBYyxFQUFVLFFBQW1CO1FBQW5CLGFBQVEsR0FBUixRQUFRLENBQVc7UUFDbkQsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7UUFDbkIsSUFBSSxDQUFDLFdBQVcsR0FBRyxRQUFRLEVBQUUsV0FBVyxDQUFDO1FBQ3pDLElBQUksQ0FBQyxhQUFhLEdBQUcsUUFBUSxFQUFFLGFBQWEsQ0FBQztRQUM3QyxJQUFJLENBQUMsb0JBQW9CLEdBQUcsUUFBUSxFQUFFLG9CQUFvQixDQUFDO0lBQy9ELENBQUM7SUFFRCxPQUFPLENBQUMsT0FBd0I7UUFDNUIsTUFBTSxFQUFFLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1FBQ2pDLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsUUFBUSxDQUFDO1FBRWpELElBQUksUUFBUSxJQUFJLEdBQUcsQ0FBQyxRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7WUFDakMsTUFBTSxlQUFlLEdBQW1CLElBQUksMEJBQWUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDeEUsT0FBTyxlQUFlLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQzVDLENBQUM7UUFFRCxJQUFJLEdBQUcsR0FBRyxZQUFZLENBQUMsT0FBTyxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsS0FBSyxD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QUFPLEdBQUcsQ0FBQyxNQUFNLENBQUMsb0JBQW9CLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxRQUFRLGtCQUFrQixFQUFFLEVBQUMsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRLEVBQUMsQ0FBQyxDQUFDO0lBQ3pILENBQUM7Q0FDSjtBQU5ELG9EQU1DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgVGFncyB9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xyXG5pbXBvcnQgeyBJU3VibmV0LCBQcml2YXRlU3VibmV0IH0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XHJcbmltcG9ydCB7IFJlc291cmNlQ29udGV4dCwgUmVzb3VyY2VQcm92aWRlciB9IGZyb20gXCIuLi9zcGlcIjtcclxuaW1wb3J0ICogYXMgZWtzIGZyb20gXCJhd3MtY2RrLWxpYi9hd3MtZWtzXCI7XHJcbmltcG9ydCB7SXB2NlZwY1Byb3ZpZGVyfSBmcm9tIFwiLi9pcHY2LXZwY1wiO1xyXG5cclxuLyoqXHJcbiAqIEludGVyZmFjZSBmb3IgTWFwcGluZyBmb3IgZmllbGRzIHN1Y2ggYXMgUHJpbWFyeSBDSURSLCBTZWNvbmRhcnkgQ0lEUiwgU2Vjb25kYXJ5IFN1Ym5ldCBDSURSLlxyXG4gKi9cclxuaW50ZXJmYWNlIFZwY1Byb3BzIHtcclxuICAgcHJpbWFyeUNpZHI/OiBzdHJpbmcsXHJcbiAgIHNlY29uZGFyeUNpZHI/OiBzdHJpbmcsXHJcbiAgIHNlY29uZGFyeVN1Ym5ldENpZHJzPzogc3RyaW5nW11cclxufVxyXG5cclxuLyoqXHJcbiAqIFZQQyByZXNvdXJjZSBwcm92aWRlciBcclxuICovXHJcbmV4cG9ydCBjbGFzcyBWcGNQcm92aWRlciBpbXBsZW1lbnRzIFJlc291cmNlUHJvdmlkZXI8ZWMyLklWcGM+IHtcclxuICAgIHJlYWRvbmx5IHZwY0lkPzogc3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgcHJpbWFyeUNpZHI/OiBzdHJpbmc7XHJcbiAgICByZWFkb25seSBzZWNvbmRhcnlDaWRyPzogc3RyaW5nO1xyXG4gICAgcmVhZG9ubHkgc2Vjb25kYXJ5U3VibmV0Q2lkcnM/OiBzdHJpbmdbXTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcih2cGNJZD86IHN0cmluZywgcHJpdmF0ZSB2cGNQcm9wcz86IFZwY1Byb3BzKSB7XHJcbiAgICAgICAgdGhpcy52cGNJZCA9IHZwY0lkO1xyXG4gICAgICAgIHRoaXMucHJpbWFyeUNpZHIgPSB2cGNQcm9wcz8ucHJpbWFyeUNpZHI7XHJcbiAgICAgICAgdGhpcy5zZWNvbmRhcnlDaWRyID0gdnBjUHJvcHM/LnNlY29uZGFyeUNpZHI7XHJcbiAgICAgICAgdGhpcy5zZWNvbmRhcnlTdWJuZXRDaWRycyA9IHZwY1Byb3BzPy5zZWNvbmRhcnlTdWJuZXRDaWRycztcclxuICAgIH1cclxuXHJcbiAgICBwcm92aWRlKGNvbnRleHQ6IFJlc291cmNlQ29udGV4dCk6IGVjMi5JVnBjIHtcclxuICAgICAgICBjb25zdCBpZCA9IGNvbnRleHQuc2NvcGUubm9kZS5pZDtcclxuICAgICAgICBjb25zdCBpcEZhbWlseSA9IGNvbnRleHQuYmx1ZXByaW50UHJvcHMuaXBGYW1pbHk7XHJcblxyXG4gICAgICAgIGlmIChpcEZhbWlseSA9PSBla3MuSXBGYW1pbHkuSVBfVjYpIHtcclxuICAgICAgICAgICAgY29uc3QgaXB2NlZwY1Byb3ZpZGVyOklwdjZWcGNQcm92aWRlciA9IG5ldyBJcHY2VnBjUHJvdmlkZXIodGhpcy52cGNJZCk7XHJcbiAgICAgICAgICAgIHJldHVybiBpcHY2VnBjUHJvdmlkZXIucHJvdmlkZShjb250ZXh0KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxldCB2cGMgPSBnZXRWUENGcm9tSWQoY29udGV4dCwgaWQsIHRoaXMudnBjSWQpO1xyXG4gICAgICAgIGlmICh2cGMgPT0gbnVsbCkge1xyXG4gICAgICAgICAgICAvLyBJdCB3aWxsIGF1dG9tYXRpY2FsbHkgZGl2aWRlIHRoZSBwcm92aWRlZCBWUEMgQ0lEUiByYW5nZSwgYW5kIGNyZWF0ZSBwdWJsaWMgYW5kIHByaXZhdGUgc3VibmV0cyBwZXIgQXZhaWxhYmlsaXR5IFpvbmUuXHJcbiAgICAgICAgICAgIC8vIElmIFZQQyBDSURSIHJhbmdlIGlzIG5vdCBwcm92aWRlZCwgdXNlcyBgMTAuMC4wLjAvMTZgIGFzIHRoZSByYW5nZSBhbmQgY3JlYXRlcyBwdWJsaWMgYW5kIHByaXZhdGUgc3VibmV0cyBwZXIgQXZhaWxhYmlsaXR5IFpvbmUuXHJcbiAgICAgICAgICAgIC8vIE5ldHdvcmsgcm91dGluZyBmb3IgdGhlIHB1YmxpYyBzdWJuZXRzIHdpbGwgYmUgY29uZmlndXJlZCB0byBhbGxvdyBvdXRib3VuZCBhY2Nlc3MgZGlyZWN0bHkgdmlhIGFuIEludGVybmV0IEdhdGV3YXkuXHJcbiAgICAgICAgICAgIC8vIE5ldHdvcmsgcm91dGluZyBmb3IgdGhlIHByaXZhdGUgc3VibmV0cyB3aWxsIGJlIGNvbmZpZ3VyZWQgdG8gYWxsb3cgb3V0Ym91bmQgYWNjZXNzIHZpYSBhIHNldCBvZiByZXNpbGllbnQgTkFUIEdhdGV3YXlzIChvbmUgcGVyIEFaKS5cclxuICAgICAgICAgICAgLy8gQ3JlYXRlcyBTZWNvbmRhcnkgQ0lEUiBhbmQgU2Vjb25kYXJ5IHN1Ym5ldHMgaWYgcGFzc2VkLlxyXG4gICAgICAgICAgICBpZiAodGhpcy5wcmltYXJ5Q2lkcikge1xyXG4gICAgICAgICAgICAgICAgdnBjID0gbmV3IGVjMi5WcGMoY29udGV4dC5zY29wZSwgaWQgKyBcIi12cGNcIix7XHJcbiAgICAgICAgICAgICAgICAgICAgaXBBZGRyZXNzZXM6IGVjMi5JcEFkZHJlc3Nlcy5jaWRyKHRoaXMucHJpbWFyeUNpZHIpXHJcbiAgICAgICAgICAgICAgICB9KTsgICAgXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB2cGMgPSBuZXcgZWMyLlZwYyhjb250ZXh0LnNjb3BlLCBpZCArIFwiLXZwY1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHRoaXMuc2Vjb25kYXJ5Q2lkcikge1xyXG4gICAgICAgICAgICB0aGlzLmNyZWF0ZVNlY29uZGFyeVN1Ym5ldHMoY29udGV4dCwgaWQsIHZwYyk7XHJcbiAgICAgICAgfVxyXG4gICAgXHJcbiAgICAgICAgcmV0dXJuIHZwYztcclxuICAgIH1cclxuXHJcbiAgICBwcm90ZWN0ZWQgY3JlYXRlU2Vjb25kYXJ5U3VibmV0cyhjb250ZXh0OiBSZXNvdXJjZUNvbnRleHQsIGlkOiBzdHJpbmcsIHZwYzogZWMyLklWcGMpIHtcclxuICAgICAgICBjb25zdCBzZWNvbmRhcnlTdWJuZXRzOiBBcnJheTxQcml2YXRlU3VibmV0PiA9IFtdO1xyXG4gICAgICAgIGNvbnN0IHNlY29uZGFyeUNpZHIgPSBuZXcgZWMyLkNmblZQQ0NpZHJCbG9jayhjb250ZXh0LnNjb3BlLCBpZCArIFwiLXNlY29uZGFyeUNpZHJcIiwge1xyXG4gICAgICAgICAgICB2cGNJZDogdnBjLnZwY0lkLFxyXG4gICAgICAgICAgICBjaWRyQmxvY2s6IHRoaXMuc2Vjb25kYXJ5Q2lkclxyXG4gICAgICAgIH0pO1xyXG4gICAgICAgIHNlY29uZGFyeUNpZHIubm9kZS5hZGREZXBlbmRlbmN5KHZwYyk7XHJcbiAgICAgICAgaWYgKHRoaXMuc2Vjb25kYXJ5U3VibmV0Q2lkcnMpIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB2cGMuYXZhaWxhYmlsaXR5Wm9uZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLnNlY29uZGFyeVN1Ym5ldENpZHJzW2ldKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kYXJ5U3VibmV0c1tpXSA9IG5ldyBlYzIuUHJpdmF0ZVN1Ym5ldChjb250ZXh0LnNjb3BlLCBpZCArIFwicHJpdmF0ZS1zdWJuZXQtXCIgKyBpLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGF2YWlsYWJpbGl0eVpvbmU6IHZwYy5hdmFpbGFiaWxpdHlab25lc1tpXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgY2lkckJsb2NrOiB0aGlzLnNlY29uZGFyeVN1Ym5ldENpZHJzW2ldLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2cGNJZDogdnBjLnZwY0lkXHJcbiAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgc2Vjb25kYXJ5U3VibmV0c1tpXS5ub2RlLmFkZERlcGVuZGVuY3koc2Vjb25kYXJ5Q2lkcik7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5hZGQoXCJzZWNvbmRhcnktY2lkci1zdWJuZXQtXCIgKyBpLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHByb3ZpZGUoX2NvbnRleHQpOiBJU3VibmV0IHsgcmV0dXJuIHNlY29uZGFyeVN1Ym5ldHNbaV07IH1cclxuICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBmb3IgKGxldCBzZWNvbmRhcnlTdWJuZXQgb2Ygc2Vjb25kYXJ5U3VibmV0cykge1xyXG4gICAgICAgICAgICAgICAgVGFncy5vZihzZWNvbmRhcnlTdWJuZXQpLmFkZChcImt1YmVybmV0ZXMuaW8vcm9sZS9pbnRlcm5hbC1lbGJcIiwgXCIxXCIsIHsgYXBwbHlUb0xhdW5jaGVkSW5zdGFuY2VzOiB0cnVlIH0pO1xyXG4gICAgICAgICAgICAgICAgVGFncy5vZihzZWNvbmRhcnlTdWJuZXQpLmFkZChcIk5hbWVcIiwgYGJsdWVwcmludC1jb25zdHJ1Y3QtZGV2LVByaXZhdGVTdWJuZXQtJHtzZWNvbmRhcnlTdWJuZXR9YCwgeyBhcHBseVRvTGF1bmNoZWRJbnN0YW5jZXM6IHRydWUgfSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcblxyXG5cclxuLypcclxuKiogVGhpcyBmdW5jdGlvbiB3aWxsIGdpdmUgcmV0dXJuIHZwYyBiYXNlZCBvbiB0aGUgUmVzb3VyY2VDb250ZXh0IGFuZCB2cGNJZCBwYXNzZWQgdG8gdGhlIGNsdXN0ZXIuXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0VlBDRnJvbUlkKGNvbnRleHQ6IFJlc291cmNlQ29udGV4dCwgbm9kZUlkOiBzdHJpbmcsIHZwY0lkPzogc3RyaW5nKSB7XHJcbiAgICBsZXQgdnBjID0gdW5kZWZpbmVkO1xyXG4gICAgaWYgKHZwY0lkKSB7XHJcbiAgICAgICAgaWYgKHZwY0lkID09PSBcImRlZmF1bHRcIikge1xyXG4gICAgICAgICAgICBjb25zb2xlLmxvZyhgbG9va2luZyB1cCBjb21wbGV0ZWx5IGRlZmF1bHQgVlBDYCk7XHJcbiAgICAgICAgICAgIHZwYyA9IGVjMi5WcGMuZnJvbUxvb2t1cChjb250ZXh0LnNjb3BlLCBub2RlSWQgKyBcIi12cGNcIiwgeyBpc0RlZmF1bHQ6IHRydWUgfSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY29uc29sZS5sb2coYGxvb2tpbmcgdXAgbm9uLWRlZmF1bHQgJHt2cGNJZH0gVlBDYCk7XHJcbiAgICAgICAgICAgIHZwYyA9IGVjMi5WcGMuZnJvbUxvb2t1cChjb250ZXh0LnNjb3BlLCBub2RlSWQgKyBcIi12cGNcIiwgeyB2cGNJZDogdnBjSWQgfSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIHZwYztcclxufVxyXG5cclxuZXhwb3J0IGNsYXNzIERpcmVjdFZwY1Byb3ZpZGVyIGltcGxlbWVudHMgUmVzb3VyY2VQcm92aWRlcjxlYzIuSVZwYz4ge1xyXG4gICAgIGNvbnN0cnVjdG9yKHJlYWRvbmx5IHZwYzogZWMyLklWcGMpIHsgfVxyXG5cclxuICAgIHByb3ZpZGUoX2NvbnRleHQ6IFJlc291cmNlQ29udGV4dCk6IGVjMi5JVnBjIHtcclxuICAgICAgICByZXR1cm4gdGhpcy52cGM7XHJcbiAgICB9ICAgIFxyXG59XHJcblxyXG4vKipcclxuICogRGlyZWN0IGltcG9ydCBzZWNvbmRhcnkgc3VibmV0IHByb3ZpZGVyLCBiYXNlZCBvbiBhIGtub3duIHN1Ym5ldCBJRC4gXHJcbiAqIFJlY29tbWVuZGVkIG1ldGhvZCBpZiBzZWNvbmRhcnkgc3VibmV0IGlkIGlzIGtub3duLCBhcyBpdCBhdm9pZHMgZXh0cmEgbG9vay11cHMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgTG9va3VwU3VibmV0UHJvdmlkZXIgaW1wbGVtZW50cyBSZXNvdXJjZVByb3ZpZGVyPElTdWJuZXQ+IHtcclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgc3VibmV0SWQ6IHN0cmluZykgeyB9XHJcblxyXG4gICAgcHJvdmlkZShjb250ZXh0OiBSZXNvdXJjZUNvbnRleHQpOiBlYzIuSVN1Ym5ldCB7XHJcbiAgICAgICAgcmV0dXJuIGVjMi5TdWJuZXQuZnJvbVN1Ym5ldEF0dHJpYnV0ZXMoY29udGV4dC5zY29wZSwgYCR7dGhpcy5zdWJuZXRJZH0tc2Vjb25kYXJ5c3VibmV0YCwge3N1Ym5ldElkOiB0aGlzLnN1Ym5ldElkfSk7XHJcbiAgICB9XHJcbn1cclxuIl19