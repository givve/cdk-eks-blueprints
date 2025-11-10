"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestedStackAddOn = exports.NestedStackAddOnProps = void 0;
const utils_1 = require("../../utils");
/**
 * Properties for the nested stack add-on.
 */
class NestedStackAddOnProps {
    /**
     * Required identified, must be unique within the parent stack scope.
     */
    id;
    /**
     * Builder that generates the stack.
     */
    builder;
    /**
     * Optional properties for the nested stack.
     */
    nestedStackProps;
}
exports.NestedStackAddOnProps = NestedStackAddOnProps;
let NestedStackAddOn = class NestedStackAddOn {
    props;
    id;
    constructor(props) {
        this.props = props;
        this.id = props.id;
    }
    deploy(clusterInfo) {
        const props = this.props;
        const stack = clusterInfo.cluster.stack;
        return Promise.resolve(props.builder.build(stack, props.id, props.nestedStackProps));
    }
};
exports.NestedStackAddOn = NestedStackAddOn;
exports.NestedStackAddOn = NestedStackAddOn = __decorate([
    utils_1.supportsALL
], NestedStackAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL25lc3RlZC1zdGFjay9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFHQSx1Q0FBMEM7QUFFMUM7O0dBRUc7QUFDSCxNQUFhLHFCQUFxQjtJQUM5Qjs7T0FFRztJQUNILEVBQUUsQ0FBUztJQUVYOztPQUVHO0lBQ0gsT0FBTyxDQUFxQjtJQUU1Qjs7T0FFRztJQUNILGdCQUFnQixDQUFvQjtDQUN2QztBQWZELHNEQWVDO0FBR00sSUFBTSxnQkFBZ0IsR0FBdEIsTUFBTSxnQkFBZ0I7SUFJSTtJQUZwQixFQUFFLENBQVc7SUFFdEIsWUFBNkIsS0FBNEI7UUFBNUIsVUFBSyxHQUFMLEtBQUssQ0FBdUI7UUFDckQsSUFBSSxDQUFDLEVBQUUsR0FBRyxLQUFLLENBQUMsRUFBRSxDQUFDO0lBQ3ZCLENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFDM0IsTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQztRQUN6QixNQUFNLEtBQUssR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQztRQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxFQUFFLEVBQUMsS0FBSyxDQUFDLGdCQUFnQixDQUFDLENBQUMsQ0FBQztJQUN4RixDQUFDO0NBRUosQ0FBQTtBQWRZLDRDQUFnQjsyQkFBaEIsZ0JBQWdCO0lBRDVCLG1CQUFXO0dBQ0MsZ0JBQWdCLENBYzVCIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmVzdGVkU3RhY2tQcm9wcyB9IGZyb20gXCJhd3MtY2RrLWxpYlwiO1xyXG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tIFwiY29uc3RydWN0c1wiO1xyXG5pbXBvcnQgeyBDbHVzdGVyQWRkT24sIENsdXN0ZXJJbmZvLCBOZXN0ZWRTdGFja0J1aWxkZXIgfSBmcm9tIFwiLi4vLi4vc3BpXCI7XHJcbmltcG9ydCB7IHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG4vKipcclxuICogUHJvcGVydGllcyBmb3IgdGhlIG5lc3RlZCBzdGFjayBhZGQtb24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgTmVzdGVkU3RhY2tBZGRPblByb3BzIHtcclxuICAgIC8qKlxyXG4gICAgICogUmVxdWlyZWQgaWRlbnRpZmllZCwgbXVzdCBiZSB1bmlxdWUgd2l0aGluIHRoZSBwYXJlbnQgc3RhY2sgc2NvcGUuXHJcbiAgICAgKi9cclxuICAgIGlkOiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBCdWlsZGVyIHRoYXQgZ2VuZXJhdGVzIHRoZSBzdGFjay5cclxuICAgICAqL1xyXG4gICAgYnVpbGRlcjogTmVzdGVkU3RhY2tCdWlsZGVyO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogT3B0aW9uYWwgcHJvcGVydGllcyBmb3IgdGhlIG5lc3RlZCBzdGFjay5cclxuICAgICAqL1xyXG4gICAgbmVzdGVkU3RhY2tQcm9wcz86IE5lc3RlZFN0YWNrUHJvcHM7XHJcbn1cclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgTmVzdGVkU3RhY2tBZGRPbiAgaW1wbGVtZW50cyBDbHVzdGVyQWRkT24ge1xyXG5cclxuICAgIHJlYWRvbmx5IGlkPyA6IHN0cmluZztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IHByb3BzOiBOZXN0ZWRTdGFja0FkZE9uUHJvcHMpIHtcclxuICAgICAgICB0aGlzLmlkID0gcHJvcHMuaWQ7XHJcbiAgICB9XHJcblxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQgfCBQcm9taXNlPENvbnN0cnVjdD4ge1xyXG4gICAgICAgIGNvbnN0IHByb3BzID0gdGhpcy5wcm9wcztcclxuICAgICAgICBjb25zdCBzdGFjayA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2s7XHJcbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShwcm9wcy5idWlsZGVyLmJ1aWxkKHN0YWNrLCBwcm9wcy5pZCxwcm9wcy5uZXN0ZWRTdGFja1Byb3BzKSk7XHJcbiAgICB9XHJcblxyXG59Il19