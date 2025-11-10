"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GpuOperatorAddon = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const utils_1 = require("../../utils");
const helm_addon_1 = require("../helm-addon");
/**
 * Default props to be used when creating the Helm chart
 */
const defaultProps = {
    name: "gpu-operator-addon",
    namespace: "gpu-operator",
    chart: "gpu-operator",
    version: "v25.3.3",
    release: "nvidia-gpu-operator",
    repository: "https://nvidia.github.io/gpu-operator",
    createNamespace: true,
    values: {}
};
/**
 * Main class to instantiate the Helm chart for NVIDIA GPU operator
 * GPU operator manages the software and drivers needed for GPU accelerated workloads
 * It validates all requisite software is installed before scheduling GPU workcload
 * Using MIG (Multi Instance GPUs) allows you to virtually split your GPU into multiple units
 */
let GpuOperatorAddon = class GpuOperatorAddon extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const cluster = clusterInfo.cluster;
        let values = this.options.values ?? {};
        values = (0, ts_deepmerge_1.merge)(values, this.props.values ?? {});
        const chart = this.addHelmChart(clusterInfo, values);
        if (this.options.createNamespace == true) {
            // Let CDK Create the Namespace
            const namespace = (0, utils_1.createNamespace)(this.options.namespace, cluster);
            chart.node.addDependency(namespace);
        }
        return Promise.resolve(chart);
    }
};
exports.GpuOperatorAddon = GpuOperatorAddon;
exports.GpuOperatorAddon = GpuOperatorAddon = __decorate([
    utils_1.supportsALL
], GpuOperatorAddon);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2dwdS1vcGVyYXRvci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFDQSwrQ0FBcUM7QUFFckMsdUNBQTJEO0FBQzNELDhDQUE4RTtBQWM5RTs7R0FFRztBQUNILE1BQU0sWUFBWSxHQUEyQztJQUN6RCxJQUFJLEVBQUUsb0JBQW9CO0lBQzFCLFNBQVMsRUFBRSxjQUFjO0lBQ3pCLEtBQUssRUFBRSxjQUFjO0lBQ3JCLE9BQU8sRUFBRSxTQUFTO0lBQ2xCLE9BQU8sRUFBRSxxQkFBcUI7SUFDOUIsVUFBVSxFQUFHLHVDQUF1QztJQUNwRCxlQUFlLEVBQUUsSUFBSTtJQUNyQixNQUFNLEVBQUUsRUFBRTtDQUNiLENBQUM7QUFFRjs7Ozs7R0FLRztBQUVJLElBQU0sZ0JBQWdCLEdBQXRCLE1BQU0sZ0JBQWlCLFNBQVEsc0JBQVM7SUFFcEMsT0FBTyxDQUF3QjtJQUV4QyxZQUFZLEtBQTZCO1FBQ3ZDLEtBQUssQ0FBQyxFQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFDLENBQUMsQ0FBQztRQUNuQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUE4QixDQUFDO0lBQ3JELENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFDN0IsTUFBTSxPQUFPLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQztRQUNwQyxJQUFJLE1BQU0sR0FBVyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDL0MsTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLElBQUksRUFBRSxDQUFDLENBQUM7UUFDaEQsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFckQsSUFBSSxJQUFJLENBQUMsT0FBTyxDQUFDLGVBQWUsSUFBSSxJQUFJLEVBQUMsQ0FBQztZQUN4QywrQkFBK0I7WUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBQSx1QkFBZSxFQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBVSxFQUFHLE9BQU8sQ0FBQyxDQUFDO1lBQ3JFLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFNBQVMsQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFDRCxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7SUFDaEMsQ0FBQztDQUNGLENBQUE7QUF0QlksNENBQWdCOzJCQUFoQixnQkFBZ0I7SUFENUIsbUJBQVc7R0FDQyxnQkFBZ0IsQ0FzQjVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XHJcbmltcG9ydCB7IG1lcmdlIH0gZnJvbSBcInRzLWRlZXBtZXJnZVwiO1xyXG5pbXBvcnQgeyBDbHVzdGVySW5mbywgVmFsdWVzIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVOYW1lc3BhY2UsIHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcbmltcG9ydCB7IEhlbG1BZGRPbiwgSGVsbUFkZE9uUHJvcHMsIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IFZhbHVlc1NjaGVtYSB9IGZyb20gJy4vdmFsdWVzJztcclxuLyoqXHJcbiAqIFVzZXIgcHJvdmlkZWQgb3B0aW9ucyBmb3IgdGhlIEhlbG0gQ2hhcnRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgR3B1T3BlcmF0b3JBZGRvblByb3BzIGV4dGVuZHMgSGVsbUFkZE9uVXNlclByb3BzIHtcclxuICAvKipcclxuICAgKiBUbyBDcmVhdGUgTmFtZXNwYWNlIHVzaW5nIENES1xyXG4gICAqLyAgICBcclxuICBjcmVhdGVOYW1lc3BhY2U/OiBib29sZWFuO1xyXG5cclxuICB2YWx1ZXM/OiBWYWx1ZXNTY2hlbWE7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0IHByb3BzIHRvIGJlIHVzZWQgd2hlbiBjcmVhdGluZyB0aGUgSGVsbSBjaGFydFxyXG4gKi9cclxuY29uc3QgZGVmYXVsdFByb3BzOiBIZWxtQWRkT25Qcm9wcyAmIEdwdU9wZXJhdG9yQWRkb25Qcm9wcyA9IHtcclxuICAgIG5hbWU6IFwiZ3B1LW9wZXJhdG9yLWFkZG9uXCIsXHJcbiAgICBuYW1lc3BhY2U6IFwiZ3B1LW9wZXJhdG9yXCIsXHJcbiAgICBjaGFydDogXCJncHUtb3BlcmF0b3JcIixcclxuICAgIHZlcnNpb246IFwidjI1LjMuM1wiLFxyXG4gICAgcmVsZWFzZTogXCJudmlkaWEtZ3B1LW9wZXJhdG9yXCIsXHJcbiAgICByZXBvc2l0b3J5OiAgXCJodHRwczovL252aWRpYS5naXRodWIuaW8vZ3B1LW9wZXJhdG9yXCIsXHJcbiAgICBjcmVhdGVOYW1lc3BhY2U6IHRydWUsXHJcbiAgICB2YWx1ZXM6IHt9XHJcbn07XHJcblxyXG4vKipcclxuICogTWFpbiBjbGFzcyB0byBpbnN0YW50aWF0ZSB0aGUgSGVsbSBjaGFydCBmb3IgTlZJRElBIEdQVSBvcGVyYXRvclxyXG4gKiBHUFUgb3BlcmF0b3IgbWFuYWdlcyB0aGUgc29mdHdhcmUgYW5kIGRyaXZlcnMgbmVlZGVkIGZvciBHUFUgYWNjZWxlcmF0ZWQgd29ya2xvYWRzXHJcbiAqIEl0IHZhbGlkYXRlcyBhbGwgcmVxdWlzaXRlIHNvZnR3YXJlIGlzIGluc3RhbGxlZCBiZWZvcmUgc2NoZWR1bGluZyBHUFUgd29ya2Nsb2FkXHJcbiAqIFVzaW5nIE1JRyAoTXVsdGkgSW5zdGFuY2UgR1BVcykgYWxsb3dzIHlvdSB0byB2aXJ0dWFsbHkgc3BsaXQgeW91ciBHUFUgaW50byBtdWx0aXBsZSB1bml0c1xyXG4gKi9cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBHcHVPcGVyYXRvckFkZG9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgcmVhZG9ubHkgb3B0aW9uczogR3B1T3BlcmF0b3JBZGRvblByb3BzO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wcz86IEdwdU9wZXJhdG9yQWRkb25Qcm9wcykge1xyXG4gICAgc3VwZXIoey4uLmRlZmF1bHRQcm9wcywgLi4ucHJvcHN9KTtcclxuICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHMgYXMgR3B1T3BlcmF0b3JBZGRvblByb3BzO1xyXG4gIH1cclxuXHJcbiAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IFByb21pc2U8Q29uc3RydWN0PiB7XHJcbiAgICBjb25zdCBjbHVzdGVyID0gY2x1c3RlckluZm8uY2x1c3RlcjtcclxuICAgIGxldCB2YWx1ZXM6IFZhbHVlcyA9IHRoaXMub3B0aW9ucy52YWx1ZXMgPz8ge307XHJcbiAgICB2YWx1ZXMgPSBtZXJnZSh2YWx1ZXMsIHRoaXMucHJvcHMudmFsdWVzID8/IHt9KTtcclxuICAgIGNvbnN0IGNoYXJ0ID0gdGhpcy5hZGRIZWxtQ2hhcnQoY2x1c3RlckluZm8sIHZhbHVlcyk7XHJcblxyXG4gICAgaWYoIHRoaXMub3B0aW9ucy5jcmVhdGVOYW1lc3BhY2UgPT0gdHJ1ZSl7XHJcbiAgICAgIC8vIExldCBDREsgQ3JlYXRlIHRoZSBOYW1lc3BhY2VcclxuICAgICAgY29uc3QgbmFtZXNwYWNlID0gY3JlYXRlTmFtZXNwYWNlKHRoaXMub3B0aW9ucy5uYW1lc3BhY2UhICwgY2x1c3Rlcik7XHJcbiAgICAgIGNoYXJ0Lm5vZGUuYWRkRGVwZW5kZW5jeShuYW1lc3BhY2UpO1xyXG4gICAgfVxyXG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShjaGFydCk7XHJcbiAgfVxyXG59XHJcbiJdfQ==