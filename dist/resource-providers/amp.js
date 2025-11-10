"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateAmpProvider = void 0;
const aps = require("aws-cdk-lib/aws-aps");
/**
 * Creates new AMP Workspace with provided AMP Workspace name
 */
class CreateAmpProvider {
    name;
    workspaceName;
    workspaceTags;
    /**
     * Creates the AMP workspace
     * @param name Name of this resource that other resource providers, add-ons and teams can use for look-up.
     * @param workspaceName Name of your AMP Workspace
     * @param workspaceTags Tags to be used to create AMP Workspace
     */
    constructor(name, workspaceName, workspaceTags) {
        this.name = name;
        this.workspaceName = workspaceName;
        this.workspaceTags = workspaceTags;
    }
    provide(context) {
        return new aps.CfnWorkspace(context.scope, this.name, {
            alias: this.workspaceName,
            tags: this.workspaceTags,
        });
    }
}
exports.CreateAmpProvider = CreateAmpProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1wLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3Jlc291cmNlLXByb3ZpZGVycy9hbXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQ0EsMkNBQTJDO0FBSTNDOztHQUVHO0FBQ0gsTUFBYSxpQkFBaUI7SUFRTDtJQUF1QjtJQUFnQztJQU41RTs7Ozs7T0FLRztJQUNILFlBQXFCLElBQVksRUFBVyxhQUFxQixFQUFXLGFBQXdCO1FBQS9FLFNBQUksR0FBSixJQUFJLENBQVE7UUFBVyxrQkFBYSxHQUFiLGFBQWEsQ0FBUTtRQUFXLGtCQUFhLEdBQWIsYUFBYSxDQUFXO0lBQUcsQ0FBQztJQUV4RyxPQUFPLENBQUMsT0FBNEI7UUFDaEMsT0FBTyxJQUFJLEdBQUcsQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxFQUFFO1lBQ2xELEtBQUssRUFBRSxJQUFJLENBQUMsYUFBYTtZQUN6QixJQUFJLEVBQUUsSUFBSSxDQUFDLGFBQWE7U0FDM0IsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKO0FBaEJELDhDQWdCQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHNwaSBmcm9tICcuLi9zcGknO1xyXG5pbXBvcnQgKiBhcyBhcHMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwcyc7XHJcbmltcG9ydCB7IENmblRhZyB9IGZyb20gXCJhd3MtY2RrLWxpYi9jb3JlXCI7XHJcbmltcG9ydCB7IFJlc291cmNlUHJvdmlkZXIgfSBmcm9tICcuLi9zcGknO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgbmV3IEFNUCBXb3Jrc3BhY2Ugd2l0aCBwcm92aWRlZCBBTVAgV29ya3NwYWNlIG5hbWUgXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQ3JlYXRlQW1wUHJvdmlkZXIgaW1wbGVtZW50cyBSZXNvdXJjZVByb3ZpZGVyPGFwcy5DZm5Xb3Jrc3BhY2U+IHtcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgdGhlIEFNUCB3b3Jrc3BhY2VcclxuICAgICAqIEBwYXJhbSBuYW1lIE5hbWUgb2YgdGhpcyByZXNvdXJjZSB0aGF0IG90aGVyIHJlc291cmNlIHByb3ZpZGVycywgYWRkLW9ucyBhbmQgdGVhbXMgY2FuIHVzZSBmb3IgbG9vay11cC5cclxuICAgICAqIEBwYXJhbSB3b3Jrc3BhY2VOYW1lIE5hbWUgb2YgeW91ciBBTVAgV29ya3NwYWNlXHJcbiAgICAgKiBAcGFyYW0gd29ya3NwYWNlVGFncyBUYWdzIHRvIGJlIHVzZWQgdG8gY3JlYXRlIEFNUCBXb3Jrc3BhY2VcclxuICAgICAqL1xyXG4gICAgY29uc3RydWN0b3IocmVhZG9ubHkgbmFtZTogc3RyaW5nLCByZWFkb25seSB3b3Jrc3BhY2VOYW1lOiBzdHJpbmcsIHJlYWRvbmx5IHdvcmtzcGFjZVRhZ3M/OiBDZm5UYWdbXSkge31cclxuXHJcbiAgICBwcm92aWRlKGNvbnRleHQ6IHNwaS5SZXNvdXJjZUNvbnRleHQpIDogYXBzLkNmbldvcmtzcGFjZSB7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBhcHMuQ2ZuV29ya3NwYWNlKGNvbnRleHQuc2NvcGUsIHRoaXMubmFtZSwge1xyXG4gICAgICAgICAgICBhbGlhczogdGhpcy53b3Jrc3BhY2VOYW1lLCAgXHJcbiAgICAgICAgICAgIHRhZ3M6IHRoaXMud29ya3NwYWNlVGFncyxcclxuICAgICAgICB9KTsgICBcclxuICAgIH1cclxufSJdfQ==