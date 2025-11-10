"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalicoAddOn = void 0;
const dot = require("dot-object");
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: 'calico-addon',
    namespace: 'kube-system',
    version: '0.3.10',
    chart: "aws-calico",
    release: "blueprints-addon-calico",
    repository: "https://aws.github.io/eks-charts"
};
/**
 * @deprecated use CalicoOperator add-on instead
 */
let CalicoAddOn = class CalicoAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const values = this.options.values ?? {};
        const defaultValues = {};
        dot.set("calico.node.resources.requests.memory", "64Mi", defaultValues, true);
        dot.set("calico.node.resources.limits.memory", "100Mi", defaultValues, true);
        const merged = (0, ts_deepmerge_1.merge)(defaultValues, values);
        this.addHelmChart(clusterInfo, merged);
    }
};
exports.CalicoAddOn = CalicoAddOn;
exports.CalicoAddOn = CalicoAddOn = __decorate([
    utils_1.supportsX86
], CalicoAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2NhbGljby9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSxrQ0FBa0M7QUFDbEMsK0NBQXFDO0FBRXJDLDhDQUE4RDtBQUM5RCx1Q0FBMEM7QUEwQjFDOztHQUVHO0FBQ0gsTUFBTSxZQUFZLEdBQUc7SUFDakIsSUFBSSxFQUFFLGNBQWM7SUFDcEIsU0FBUyxFQUFFLGFBQWE7SUFDeEIsT0FBTyxFQUFFLFFBQVE7SUFDakIsS0FBSyxFQUFFLFlBQVk7SUFDbkIsT0FBTyxFQUFFLHlCQUF5QjtJQUNsQyxVQUFVLEVBQUUsa0NBQWtDO0NBQ2pELENBQUM7QUFFRjs7R0FFRztBQUVJLElBQU0sV0FBVyxHQUFqQixNQUFNLFdBQVksU0FBUSxzQkFBUztJQUU5QixPQUFPLENBQW1CO0lBRWxDLFlBQVksS0FBd0I7UUFDaEMsS0FBSyxDQUFDLEVBQUMsR0FBRyxZQUFZLEVBQUUsR0FBRyxLQUFLLEVBQUUsQ0FBQyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztJQUM5QixDQUFDO0lBRUQsTUFBTSxDQUFDLFdBQXdCO1FBQzNCLE1BQU0sTUFBTSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxJQUFJLEVBQUUsQ0FBQztRQUN6QyxNQUFNLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFFekIsR0FBRyxDQUFDLEdBQUcsQ0FBQyx1Q0FBdUMsRUFBRSxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBQzlFLEdBQUcsQ0FBQyxHQUFHLENBQUMscUNBQXFDLEVBQUUsT0FBTyxFQUFFLGFBQWEsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU3RSxNQUFNLE1BQU0sR0FBRyxJQUFBLG9CQUFLLEVBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBRTVDLElBQUksQ0FBQyxZQUFZLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxDQUFDO0lBQzNDLENBQUM7Q0FDSixDQUFBO0FBcEJZLGtDQUFXO3NCQUFYLFdBQVc7SUFEdkIsbUJBQVc7R0FDQyxXQUFXLENBb0J2QiIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGRvdCBmcm9tICdkb3Qtb2JqZWN0JztcclxuaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IHN1cHBvcnRzWDg2IH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5cclxuLyoqXHJcbiAqIENvbmZpZ3VyYXRpb24gb3B0aW9ucyBmb3IgdGhlIGFkZC1vbi5cclxuICogQGRlcHJlY2F0ZWRcclxuICovXHJcbmV4cG9ydCBpbnRlcmZhY2UgQ2FsaWNvQWRkT25Qcm9wcyBleHRlbmRzIEhlbG1BZGRPblVzZXJQcm9wcyB7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBOYW1lc3BhY2Ugd2hlcmUgQ2FsaWNvIHdpbGwgYmUgaW5zdGFsbGVkXHJcbiAgICAgKiBAZGVmYXVsdCBrdWJlLXN5c3RlbVxyXG4gICAgICovXHJcbiAgICBuYW1lc3BhY2U/OiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBIZWxtIGNoYXJ0IHZlcnNpb24gdG8gdXNlIHRvIGluc3RhbGwuXHJcbiAgICAgKiBAZGVmYXVsdCAwLjMuMTBcclxuICAgICAqL1xyXG4gICAgdmVyc2lvbj86IHN0cmluZztcclxuXHJcbiAgICAvKipcclxuICAgICAqIFZhbHVlcyBmb3IgdGhlIEhlbG0gY2hhcnQuXHJcbiAgICAgKi9cclxuICAgIHZhbHVlcz86IGFueTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlZmF1bHRzIG9wdGlvbnMgZm9yIHRoZSBhZGQtb25cclxuICovXHJcbmNvbnN0IGRlZmF1bHRQcm9wcyA9IHtcclxuICAgIG5hbWU6ICdjYWxpY28tYWRkb24nLFxyXG4gICAgbmFtZXNwYWNlOiAna3ViZS1zeXN0ZW0nLFxyXG4gICAgdmVyc2lvbjogJzAuMy4xMCcsXHJcbiAgICBjaGFydDogXCJhd3MtY2FsaWNvXCIsXHJcbiAgICByZWxlYXNlOiBcImJsdWVwcmludHMtYWRkb24tY2FsaWNvXCIsXHJcbiAgICByZXBvc2l0b3J5OiBcImh0dHBzOi8vYXdzLmdpdGh1Yi5pby9la3MtY2hhcnRzXCJcclxufTtcclxuXHJcbi8qKlxyXG4gKiBAZGVwcmVjYXRlZCB1c2UgQ2FsaWNvT3BlcmF0b3IgYWRkLW9uIGluc3RlYWRcclxuICovXHJcbkBzdXBwb3J0c1g4NlxyXG5leHBvcnQgY2xhc3MgQ2FsaWNvQWRkT24gZXh0ZW5kcyBIZWxtQWRkT24ge1xyXG5cclxuICAgIHByaXZhdGUgb3B0aW9uczogQ2FsaWNvQWRkT25Qcm9wcztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IENhbGljb0FkZE9uUHJvcHMpIHtcclxuICAgICAgICBzdXBlcih7Li4uZGVmYXVsdFByb3BzLCAuLi5wcm9wcyB9KTtcclxuICAgICAgICB0aGlzLm9wdGlvbnMgPSB0aGlzLnByb3BzO1xyXG4gICAgfVxyXG5cclxuICAgIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiB2b2lkIHtcclxuICAgICAgICBjb25zdCB2YWx1ZXMgPSB0aGlzLm9wdGlvbnMudmFsdWVzID8/IHt9O1xyXG4gICAgICAgIGNvbnN0IGRlZmF1bHRWYWx1ZXMgPSB7fTtcclxuXHJcbiAgICAgICAgZG90LnNldChcImNhbGljby5ub2RlLnJlc291cmNlcy5yZXF1ZXN0cy5tZW1vcnlcIiwgXCI2NE1pXCIsIGRlZmF1bHRWYWx1ZXMsIHRydWUpO1xyXG4gICAgICAgIGRvdC5zZXQoXCJjYWxpY28ubm9kZS5yZXNvdXJjZXMubGltaXRzLm1lbW9yeVwiLCBcIjEwME1pXCIsIGRlZmF1bHRWYWx1ZXMsIHRydWUpO1xyXG5cclxuICAgICAgICBjb25zdCBtZXJnZWQgPSBtZXJnZShkZWZhdWx0VmFsdWVzLCB2YWx1ZXMpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgbWVyZ2VkKTtcclxuICAgIH1cclxufVxyXG4iXX0=