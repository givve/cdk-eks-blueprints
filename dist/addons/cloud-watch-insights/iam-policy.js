"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ebsCollectorPolicy = ebsCollectorPolicy;
const aws_iam_1 = require("aws-cdk-lib/aws-iam");
function ebsCollectorPolicy() {
    return new aws_iam_1.PolicyDocument({
        statements: [
            new aws_iam_1.PolicyStatement({
                actions: [
                    'ec2:DescribeVolumes',
                ],
                resources: ['*']
            })
        ]
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi9hZGRvbnMvY2xvdWQtd2F0Y2gtaW5zaWdodHMvaWFtLXBvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUVBLGdEQVdDO0FBYkQsaURBQW9FO0FBRXBFLFNBQWdCLGtCQUFrQjtJQUNoQyxPQUFPLElBQUksd0JBQWMsQ0FBQztRQUN4QixVQUFVLEVBQUU7WUFDVixJQUFJLHlCQUFlLENBQUM7Z0JBQ2xCLE9BQU8sRUFBRTtvQkFDUCxxQkFBcUI7aUJBQ3RCO2dCQUNELFNBQVMsRUFBRSxDQUFDLEdBQUcsQ0FBQzthQUNqQixDQUFDO1NBQ0g7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtQb2xpY3lEb2N1bWVudCwgUG9saWN5U3RhdGVtZW50fSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWlhbVwiO1xyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIGVic0NvbGxlY3RvclBvbGljeSgpOiBQb2xpY3lEb2N1bWVudCB7XHJcbiAgcmV0dXJuIG5ldyBQb2xpY3lEb2N1bWVudCh7XHJcbiAgICBzdGF0ZW1lbnRzOiBbXHJcbiAgICAgIG5ldyBQb2xpY3lTdGF0ZW1lbnQoe1xyXG4gICAgICAgIGFjdGlvbnM6IFtcclxuICAgICAgICAgICdlYzI6RGVzY3JpYmVWb2x1bWVzJyxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlc291cmNlczogWycqJ11cclxuICAgICAgfSlcclxuICAgIF1cclxuICB9KTtcclxufVxyXG5cclxuIl19