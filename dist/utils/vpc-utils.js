"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tagSecurityGroup = tagSecurityGroup;
exports.tagSubnets = tagSubnets;
const ec2 = require("aws-cdk-lib/aws-ec2");
const custom_resources_1 = require("aws-cdk-lib/custom-resources");
/**
 * Tags EC2 Security Group with given tag and value - used for EKS Security Group Tagging
 * @param stack - CDK Stack
 * @param securityGroupId - Security Group Resource ID
 * @param key - Tag Key
 * @param value - Tag Value
 */
function tagSecurityGroup(stack, securityGroupId, key, value) {
    const tags = [{
            Key: key,
            Value: value
        }];
    const arn = `arn:${stack.partition}:ec2:${stack.region}:${stack.account}:security-group/` + securityGroupId;
    const parameters = {
        Resources: [securityGroupId],
        Tags: tags
    };
    applyEC2Tag("eks-sg", stack, parameters, key, [arn]);
}
/**
 * Tags VPC Subnets with given tag and value.
 * @param stack - CDK Stack
 * @param subnets - a list of subnets
 * @param key - Tag Key
 * @param value - Tag Value
 */
function tagSubnets(stack, subnets, key, value) {
    for (const subnet of subnets) {
        if (!ec2.Subnet.isVpcSubnet(subnet)) {
            throw new Error('This is not a valid subnet.');
        }
    }
    const tags = [{
            Key: key,
            Value: value
        }];
    const arns = subnets.map(function (val, _) {
        return `arn:${stack.partition}:ec2:${stack.region}:${stack.account}:subnet/` + val.subnetId;
    });
    const parameters = {
        Resources: subnets.map((arn) => arn.subnetId),
        Tags: tags
    };
    applyEC2Tag("subnet", stack, parameters, key, arns);
}
function applyEC2Tag(id, stack, parameters, tag, resources) {
    const sdkCall = {
        service: 'EC2',
        action: 'createTags',
        parameters: parameters,
        physicalResourceId: { id: `${tag}-${id}-Tagger` }
    };
    new custom_resources_1.AwsCustomResource(stack, `${id}-tags-${tag}`, {
        policy: custom_resources_1.AwsCustomResourcePolicy.fromSdkCalls({
            resources: resources,
        }),
        onCreate: sdkCall,
        onUpdate: sdkCall,
        onDelete: {
            ...sdkCall,
            action: 'deleteTags',
        },
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidnBjLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3V0aWxzL3ZwYy11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVdBLDRDQWNDO0FBU0QsZ0NBd0JDO0FBMURELDJDQUEyQztBQUUzQyxtRUFBc0c7QUFFdEc7Ozs7OztHQU1HO0FBQ0gsU0FBZ0IsZ0JBQWdCLENBQUMsS0FBWSxFQUFFLGVBQXVCLEVBQUUsR0FBVyxFQUFFLEtBQWE7SUFDOUYsTUFBTSxJQUFJLEdBQUcsQ0FBQztZQUNWLEdBQUcsRUFBRSxHQUFHO1lBQ1IsS0FBSyxFQUFFLEtBQUs7U0FDZixDQUFDLENBQUM7SUFFSCxNQUFNLEdBQUcsR0FBRyxPQUFPLEtBQUssQ0FBQyxTQUFTLFFBQVEsS0FBSyxDQUFDLE1BQU0sSUFBSSxLQUFLLENBQUMsT0FBTyxrQkFBa0IsR0FBQyxlQUFlLENBQUM7SUFFMUcsTUFBTSxVQUFVLEdBQUc7UUFDZixTQUFTLEVBQUUsQ0FBQyxlQUFlLENBQUM7UUFDNUIsSUFBSSxFQUFFLElBQUk7S0FDYixDQUFDO0lBRUYsV0FBVyxDQUFDLFFBQVEsRUFBRSxLQUFLLEVBQUUsVUFBVSxFQUFFLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxLQUFZLEVBQUUsT0FBc0IsRUFBRSxHQUFXLEVBQUUsS0FBYTtJQUN2RixLQUFLLE1BQU0sTUFBTSxJQUFJLE9BQU8sRUFBQyxDQUFDO1FBQzFCLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ2xDLE1BQU0sSUFBSSxLQUFLLENBQ1gsNkJBQTZCLENBQ2hDLENBQUM7UUFDTixDQUFDO0lBQ0wsQ0FBQztJQUVELE1BQU0sSUFBSSxHQUFHLENBQUM7WUFDVixHQUFHLEVBQUUsR0FBRztZQUNSLEtBQUssRUFBRSxLQUFLO1NBQ2YsQ0FBQyxDQUFDO0lBRUgsTUFBTSxJQUFJLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFTLEdBQUcsRUFBRSxDQUFDO1FBQ3BDLE9BQU8sT0FBTyxLQUFLLENBQUMsU0FBUyxRQUFRLEtBQUssQ0FBQyxNQUFNLElBQUksS0FBSyxDQUFDLE9BQU8sVUFBVSxHQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUM7SUFDOUYsQ0FBQyxDQUFDLENBQUM7SUFFSCxNQUFNLFVBQVUsR0FBRztRQUNmLFNBQVMsRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDO1FBQzdDLElBQUksRUFBRSxJQUFJO0tBQ2IsQ0FBQztJQUVGLFdBQVcsQ0FBQyxRQUFRLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7QUFDeEQsQ0FBQztBQUVELFNBQVMsV0FBVyxDQUFFLEVBQVUsRUFBRSxLQUFZLEVBQUUsVUFBOEIsRUFBRSxHQUFXLEVBQUUsU0FBbUI7SUFDNUcsTUFBTSxPQUFPLEdBQWU7UUFDeEIsT0FBTyxFQUFFLEtBQUs7UUFDZCxNQUFNLEVBQUUsWUFBWTtRQUNwQixVQUFVLEVBQUUsVUFBVTtRQUN0QixrQkFBa0IsRUFBRSxFQUFFLEVBQUUsRUFBRSxHQUFHLEdBQUcsSUFBSSxFQUFFLFNBQVMsRUFBQztLQUNuRCxDQUFDO0lBRUYsSUFBSSxvQ0FBaUIsQ0FBQyxLQUFLLEVBQUUsR0FBRyxFQUFFLFNBQVMsR0FBRyxFQUFFLEVBQUU7UUFDOUMsTUFBTSxFQUFFLDBDQUF1QixDQUFDLFlBQVksQ0FBQztZQUN6QyxTQUFTLEVBQUUsU0FBUztTQUN2QixDQUFDO1FBRUYsUUFBUSxFQUFFLE9BQU87UUFDakIsUUFBUSxFQUFFLE9BQU87UUFDakIsUUFBUSxFQUFFO1lBQ04sR0FBRyxPQUFPO1lBQ1YsTUFBTSxFQUFFLFlBQVk7U0FDdkI7S0FDSixDQUFDLENBQUM7QUFDUCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xyXG5pbXBvcnQgeyBTdGFjayB9IGZyb20gJ2F3cy1jZGstbGliJztcclxuaW1wb3J0IHsgQXdzQ3VzdG9tUmVzb3VyY2UsIEF3c0N1c3RvbVJlc291cmNlUG9saWN5LCBBd3NTZGtDYWxsIH0gZnJvbSBcImF3cy1jZGstbGliL2N1c3RvbS1yZXNvdXJjZXNcIjtcclxuXHJcbi8qKlxyXG4gKiBUYWdzIEVDMiBTZWN1cml0eSBHcm91cCB3aXRoIGdpdmVuIHRhZyBhbmQgdmFsdWUgLSB1c2VkIGZvciBFS1MgU2VjdXJpdHkgR3JvdXAgVGFnZ2luZ1xyXG4gKiBAcGFyYW0gc3RhY2sgLSBDREsgU3RhY2tcclxuICogQHBhcmFtIHNlY3VyaXR5R3JvdXBJZCAtIFNlY3VyaXR5IEdyb3VwIFJlc291cmNlIElEXHJcbiAqIEBwYXJhbSBrZXkgLSBUYWcgS2V5XHJcbiAqIEBwYXJhbSB2YWx1ZSAtIFRhZyBWYWx1ZVxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHRhZ1NlY3VyaXR5R3JvdXAoc3RhY2s6IFN0YWNrLCBzZWN1cml0eUdyb3VwSWQ6IHN0cmluZywga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGNvbnN0IHRhZ3MgPSBbe1xyXG4gICAgICAgIEtleToga2V5LFxyXG4gICAgICAgIFZhbHVlOiB2YWx1ZVxyXG4gICAgfV07XHJcblxyXG4gICAgY29uc3QgYXJuID0gYGFybjoke3N0YWNrLnBhcnRpdGlvbn06ZWMyOiR7c3RhY2sucmVnaW9ufToke3N0YWNrLmFjY291bnR9OnNlY3VyaXR5LWdyb3VwL2Arc2VjdXJpdHlHcm91cElkO1xyXG5cclxuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSB7XHJcbiAgICAgICAgUmVzb3VyY2VzOiBbc2VjdXJpdHlHcm91cElkXSxcclxuICAgICAgICBUYWdzOiB0YWdzXHJcbiAgICB9O1xyXG5cclxuICAgIGFwcGx5RUMyVGFnKFwiZWtzLXNnXCIsIHN0YWNrLCBwYXJhbWV0ZXJzLCBrZXksIFthcm5dKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRhZ3MgVlBDIFN1Ym5ldHMgd2l0aCBnaXZlbiB0YWcgYW5kIHZhbHVlLlxyXG4gKiBAcGFyYW0gc3RhY2sgLSBDREsgU3RhY2tcclxuICogQHBhcmFtIHN1Ym5ldHMgLSBhIGxpc3Qgb2Ygc3VibmV0c1xyXG4gKiBAcGFyYW0ga2V5IC0gVGFnIEtleVxyXG4gKiBAcGFyYW0gdmFsdWUgLSBUYWcgVmFsdWVcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiB0YWdTdWJuZXRzKHN0YWNrOiBTdGFjaywgc3VibmV0czogZWMyLklTdWJuZXRbXSwga2V5OiBzdHJpbmcsIHZhbHVlOiBzdHJpbmcpOiB2b2lkIHtcclxuICAgIGZvciAoY29uc3Qgc3VibmV0IG9mIHN1Ym5ldHMpe1xyXG4gICAgICAgIGlmICghZWMyLlN1Ym5ldC5pc1ZwY1N1Ym5ldChzdWJuZXQpKSB7XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcclxuICAgICAgICAgICAgICAgICdUaGlzIGlzIG5vdCBhIHZhbGlkIHN1Ym5ldC4nXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSBcclxuICAgIH1cclxuICAgIFxyXG4gICAgY29uc3QgdGFncyA9IFt7XHJcbiAgICAgICAgS2V5OiBrZXksXHJcbiAgICAgICAgVmFsdWU6IHZhbHVlXHJcbiAgICB9XTtcclxuXHJcbiAgICBjb25zdCBhcm5zID0gc3VibmV0cy5tYXAoZnVuY3Rpb24odmFsLCBfKXtcclxuICAgICAgICByZXR1cm4gYGFybjoke3N0YWNrLnBhcnRpdGlvbn06ZWMyOiR7c3RhY2sucmVnaW9ufToke3N0YWNrLmFjY291bnR9OnN1Ym5ldC9gK3ZhbC5zdWJuZXRJZDtcclxuICAgIH0pO1xyXG5cclxuICAgIGNvbnN0IHBhcmFtZXRlcnMgPSB7XHJcbiAgICAgICAgUmVzb3VyY2VzOiBzdWJuZXRzLm1hcCgoYXJuKSA9PiBhcm4uc3VibmV0SWQpLFxyXG4gICAgICAgIFRhZ3M6IHRhZ3NcclxuICAgIH07XHJcblxyXG4gICAgYXBwbHlFQzJUYWcoXCJzdWJuZXRcIiwgc3RhY2ssIHBhcmFtZXRlcnMsIGtleSwgYXJucyk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGFwcGx5RUMyVGFnKCBpZDogc3RyaW5nLCBzdGFjazogU3RhY2ssIHBhcmFtZXRlcnM6IFJlY29yZDxzdHJpbmcsYW55PiwgdGFnOiBzdHJpbmcsIHJlc291cmNlczogc3RyaW5nW10pOiB2b2lkIHtcclxuICAgIGNvbnN0IHNka0NhbGw6IEF3c1Nka0NhbGwgPSB7XHJcbiAgICAgICAgc2VydmljZTogJ0VDMicsXHJcbiAgICAgICAgYWN0aW9uOiAnY3JlYXRlVGFncycsXHJcbiAgICAgICAgcGFyYW1ldGVyczogcGFyYW1ldGVycyxcclxuICAgICAgICBwaHlzaWNhbFJlc291cmNlSWQ6IHsgaWQ6IGAke3RhZ30tJHtpZH0tVGFnZ2VyYH1cclxuICAgIH07XHJcbiAgICBcclxuICAgIG5ldyBBd3NDdXN0b21SZXNvdXJjZShzdGFjaywgYCR7aWR9LXRhZ3MtJHt0YWd9YCwge1xyXG4gICAgICAgIHBvbGljeTogQXdzQ3VzdG9tUmVzb3VyY2VQb2xpY3kuZnJvbVNka0NhbGxzKHtcclxuICAgICAgICAgICAgcmVzb3VyY2VzOiByZXNvdXJjZXMsXHJcbiAgICAgICAgfSksXHJcblxyXG4gICAgICAgIG9uQ3JlYXRlOiBzZGtDYWxsLFxyXG4gICAgICAgIG9uVXBkYXRlOiBzZGtDYWxsLFxyXG4gICAgICAgIG9uRGVsZXRlOiB7IFxyXG4gICAgICAgICAgICAuLi5zZGtDYWxsLCBcclxuICAgICAgICAgICAgYWN0aW9uOiAnZGVsZXRlVGFncycsXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG59Il19