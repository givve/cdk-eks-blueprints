"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalicoOperatorAddOn = void 0;
const ts_deepmerge_1 = require("ts-deepmerge");
const helm_addon_1 = require("../helm-addon");
const utils_1 = require("../../utils");
/**
 * Defaults options for the add-on
 */
const defaultProps = {
    name: 'calico-operator',
    namespace: 'calico-operator',
    version: 'v3.30.3', // v3.27.2' latest is causing issues on cdk destroy
    chart: "tigera-operator",
    release: "bp-addon-calico-operator",
    repository: "https://docs.tigera.io/calico/charts"
};
let CalicoOperatorAddOn = class CalicoOperatorAddOn extends helm_addon_1.HelmAddOn {
    options;
    constructor(props) {
        super({ ...defaultProps, ...props });
        this.options = this.props;
    }
    deploy(clusterInfo) {
        const values = this.options.values ?? {};
        const defaultValues = {};
        const merged = (0, ts_deepmerge_1.merge)(defaultValues, values);
        this.addHelmChart(clusterInfo, merged);
    }
};
exports.CalicoOperatorAddOn = CalicoOperatorAddOn;
exports.CalicoOperatorAddOn = CalicoOperatorAddOn = __decorate([
    utils_1.supportsALL
], CalicoOperatorAddOn);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2NhbGljby1vcGVyYXRvci9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBQSwrQ0FBcUM7QUFFckMsOENBQThEO0FBQzlELHVDQUEwQztBQXlCMUM7O0dBRUc7QUFDSCxNQUFNLFlBQVksR0FBRztJQUNqQixJQUFJLEVBQUUsaUJBQWlCO0lBQ3ZCLFNBQVMsRUFBRSxpQkFBaUI7SUFDNUIsT0FBTyxFQUFFLFNBQVMsRUFBRSxtREFBbUQ7SUFDdkUsS0FBSyxFQUFFLGlCQUFpQjtJQUN4QixPQUFPLEVBQUUsMEJBQTBCO0lBQ25DLFVBQVUsRUFBRSxzQ0FBc0M7Q0FDckQsQ0FBQztBQUdLLElBQU0sbUJBQW1CLEdBQXpCLE1BQU0sbUJBQW9CLFNBQVEsc0JBQVM7SUFFdEMsT0FBTyxDQUEyQjtJQUUxQyxZQUFZLEtBQWdDO1FBQ3hDLEtBQUssQ0FBQyxFQUFDLEdBQUcsWUFBWSxFQUFFLEdBQUcsS0FBSyxFQUFFLENBQUMsQ0FBQztRQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUM7SUFDOUIsQ0FBQztJQUVELE1BQU0sQ0FBQyxXQUF3QjtRQUMzQixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE1BQU0sSUFBSSxFQUFFLENBQUM7UUFDekMsTUFBTSxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBRXpCLE1BQU0sTUFBTSxHQUFHLElBQUEsb0JBQUssRUFBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFFNUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFXLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDM0MsQ0FBQztDQUNKLENBQUE7QUFqQlksa0RBQW1COzhCQUFuQixtQkFBbUI7SUFEL0IsbUJBQVc7R0FDQyxtQkFBbUIsQ0FpQi9CIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgbWVyZ2UgfSBmcm9tIFwidHMtZGVlcG1lcmdlXCI7XHJcbmltcG9ydCB7IENsdXN0ZXJJbmZvIH0gZnJvbSBcIi4uLy4uL3NwaVwiO1xyXG5pbXBvcnQgeyBIZWxtQWRkT24sIEhlbG1BZGRPblVzZXJQcm9wcyB9IGZyb20gXCIuLi9oZWxtLWFkZG9uXCI7XHJcbmltcG9ydCB7IHN1cHBvcnRzQUxMIH0gZnJvbSBcIi4uLy4uL3V0aWxzXCI7XHJcblxyXG4vKipcclxuICogQ29uZmlndXJhdGlvbiBvcHRpb25zIGZvciB0aGUgYWRkLW9uLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBDYWxpY29PcGVyYXRvckFkZE9uUHJvcHMgZXh0ZW5kcyBIZWxtQWRkT25Vc2VyUHJvcHMge1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogTmFtZXNwYWNlIHdoZXJlIENhbGljbyB3aWxsIGJlIGluc3RhbGxlZFxyXG4gICAgICogQGRlZmF1bHQga3ViZS1zeXN0ZW1cclxuICAgICAqL1xyXG4gICAgbmFtZXNwYWNlPzogc3RyaW5nO1xyXG5cclxuICAgIC8qKlxyXG4gICAgICogSGVsbSBjaGFydCB2ZXJzaW9uIHRvIHVzZSB0byBpbnN0YWxsLlxyXG4gICAgICogQGRlZmF1bHQgMy4zMC4zXHJcbiAgICAgKi9cclxuICAgIHZlcnNpb24/OiBzdHJpbmc7XHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBWYWx1ZXMgZm9yIHRoZSBIZWxtIGNoYXJ0LlxyXG4gICAgICovXHJcbiAgICB2YWx1ZXM/OiBhbnk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWZhdWx0cyBvcHRpb25zIGZvciB0aGUgYWRkLW9uXHJcbiAqL1xyXG5jb25zdCBkZWZhdWx0UHJvcHMgPSB7XHJcbiAgICBuYW1lOiAnY2FsaWNvLW9wZXJhdG9yJyxcclxuICAgIG5hbWVzcGFjZTogJ2NhbGljby1vcGVyYXRvcicsXHJcbiAgICB2ZXJzaW9uOiAndjMuMzAuMycsIC8vIHYzLjI3LjInIGxhdGVzdCBpcyBjYXVzaW5nIGlzc3VlcyBvbiBjZGsgZGVzdHJveVxyXG4gICAgY2hhcnQ6IFwidGlnZXJhLW9wZXJhdG9yXCIsXHJcbiAgICByZWxlYXNlOiBcImJwLWFkZG9uLWNhbGljby1vcGVyYXRvclwiLFxyXG4gICAgcmVwb3NpdG9yeTogXCJodHRwczovL2RvY3MudGlnZXJhLmlvL2NhbGljby9jaGFydHNcIlxyXG59O1xyXG5cclxuQHN1cHBvcnRzQUxMXHJcbmV4cG9ydCBjbGFzcyBDYWxpY29PcGVyYXRvckFkZE9uIGV4dGVuZHMgSGVsbUFkZE9uIHtcclxuXHJcbiAgICBwcml2YXRlIG9wdGlvbnM6IENhbGljb09wZXJhdG9yQWRkT25Qcm9wcztcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcm9wcz86IENhbGljb09wZXJhdG9yQWRkT25Qcm9wcykge1xyXG4gICAgICAgIHN1cGVyKHsuLi5kZWZhdWx0UHJvcHMsIC4uLnByb3BzIH0pO1xyXG4gICAgICAgIHRoaXMub3B0aW9ucyA9IHRoaXMucHJvcHM7XHJcbiAgICB9XHJcblxyXG4gICAgZGVwbG95KGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyk6IHZvaWQge1xyXG4gICAgICAgIGNvbnN0IHZhbHVlcyA9IHRoaXMub3B0aW9ucy52YWx1ZXMgPz8ge307XHJcbiAgICAgICAgY29uc3QgZGVmYXVsdFZhbHVlcyA9IHt9O1xyXG5cclxuICAgICAgICBjb25zdCBtZXJnZWQgPSBtZXJnZShkZWZhdWx0VmFsdWVzLCB2YWx1ZXMpO1xyXG5cclxuICAgICAgICB0aGlzLmFkZEhlbG1DaGFydChjbHVzdGVySW5mbywgbWVyZ2VkKTtcclxuICAgIH1cclxufVxyXG4iXX0=