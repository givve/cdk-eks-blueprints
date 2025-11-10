"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNamedResource = getNamedResource;
exports.getResource = getResource;
const proxy_utils_1 = require("../utils/proxy-utils");
const uuid_1 = require("uuid");
/**
 * Creates a proxy to the named resource provider. This proxy will resolve to the type of the
 * resource provider under the provided name.
 * It enables getting references to resources outside of the Stack construct and using them with the blueprint:
 * @example
 * const app = new cdk.App();
 * const adminRole: iam.IRole = blueprints.getNamedResource("my-admin-role""); // note, there is no stack class here
 *
 * const clusterProvider = new blueprints.GenericClusterProvider({
     mastersRole: adminRole,
     ... other props
 * });
 * @param resourceName
 * @returns
 */
function getNamedResource(resourceName) {
    return new Proxy({}, new proxy_utils_1.DummyProxy((resourceContext) => {
        return resourceContext.get(resourceName);
    }));
}
/**
 * Creates a proxy to an anonymous resource. This function allows passing the provider function as input.
 * It enables creating ad-hoc references outside of the Stack construct and using them with the blueprint.
 * Designed for cases when resource is defined once and needed in a single place.
 * @example
 * const app = new cdk.App();
 * const clusterProvider = new blueprints.GenericClusterProvider({
 *   mastersRole: blueprints.getResource(context => { // will generate a unique name for resource.
        return new iam.Role(context.scope, 'AdminRole', { assumedBy: new AccountRootPrincipal()});
    }),
    ... other props
});
 * @param resourceName
 * @returns
 */
function getResource(fn) {
    const uid = (0, uuid_1.v4)();
    return new Proxy({}, new proxy_utils_1.DummyProxy((resourceContext) => {
        let result = resourceContext.get(uid);
        if (result == null) {
            resourceContext.add(uid, {
                provide(context) {
                    return fn(context);
                }
            });
            result = resourceContext.get(uid);
        }
        return result;
    }));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvcmVzb3VyY2UtcHJvdmlkZXJzL3V0aWxzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBcUJBLDRDQUlDO0FBaUJELGtDQWNDO0FBdkRELHNEQUFrRDtBQUVsRCwrQkFBa0M7QUFHbEM7Ozs7Ozs7Ozs7Ozs7O0dBY0c7QUFDSCxTQUFnQixnQkFBZ0IsQ0FBb0MsWUFBcUI7SUFDckYsT0FBTyxJQUFJLEtBQUssQ0FBQyxFQUFPLEVBQUUsSUFBSSx3QkFBVSxDQUFDLENBQUMsZUFBZ0MsRUFBRSxFQUFFO1FBQzFFLE9BQU8sZUFBZSxDQUFDLEdBQUcsQ0FBQyxZQUFZLENBQU0sQ0FBQztJQUNsRCxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ1IsQ0FBQztBQUVEOzs7Ozs7Ozs7Ozs7OztHQWNHO0FBQ0gsU0FBZ0IsV0FBVyxDQUFrQyxFQUFtQztJQUM1RixNQUFNLEdBQUcsR0FBRyxJQUFBLFNBQUksR0FBRSxDQUFDO0lBQ25CLE9BQU8sSUFBSSxLQUFLLENBQUMsRUFBTyxFQUFFLElBQUksd0JBQVUsQ0FBQyxDQUFDLGVBQWdDLEVBQUUsRUFBRTtRQUMxRSxJQUFJLE1BQU0sR0FBRyxlQUFlLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1FBQ3RDLElBQUcsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDO1lBQ2hCLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFO2dCQUNyQixPQUFPLENBQUMsT0FBd0I7b0JBQzVCLE9BQU8sRUFBRSxDQUFDLE9BQU8sQ0FBQyxDQUFDO2dCQUN2QixDQUFDO2FBQ0osQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLGVBQWUsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFNLENBQUM7UUFDM0MsQ0FBQztRQUNELE9BQU8sTUFBVyxDQUFDO0lBQ3ZCLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDUixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgSVJlc291cmNlIH0gZnJvbSAnYXdzLWNkay1saWIvY29yZSc7XHJcbmltcG9ydCB7IER1bW15UHJveHkgfSBmcm9tICcuLi91dGlscy9wcm94eS11dGlscyc7XHJcbmltcG9ydCB7IFJlc291cmNlQ29udGV4dCB9IGZyb20gJy4uL3NwaSc7XHJcbmltcG9ydCB7IHY0IGFzIHV1aWQgfSBmcm9tICd1dWlkJztcclxuaW1wb3J0IHsgSUNvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBwcm94eSB0byB0aGUgbmFtZWQgcmVzb3VyY2UgcHJvdmlkZXIuIFRoaXMgcHJveHkgd2lsbCByZXNvbHZlIHRvIHRoZSB0eXBlIG9mIHRoZSBcclxuICogcmVzb3VyY2UgcHJvdmlkZXIgdW5kZXIgdGhlIHByb3ZpZGVkIG5hbWUuIFxyXG4gKiBJdCBlbmFibGVzIGdldHRpbmcgcmVmZXJlbmNlcyB0byByZXNvdXJjZXMgb3V0c2lkZSBvZiB0aGUgU3RhY2sgY29uc3RydWN0IGFuZCB1c2luZyB0aGVtIHdpdGggdGhlIGJsdWVwcmludDpcclxuICogQGV4YW1wbGVcclxuICogY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcclxuICogY29uc3QgYWRtaW5Sb2xlOiBpYW0uSVJvbGUgPSBibHVlcHJpbnRzLmdldE5hbWVkUmVzb3VyY2UoXCJteS1hZG1pbi1yb2xlXCJcIik7IC8vIG5vdGUsIHRoZXJlIGlzIG5vIHN0YWNrIGNsYXNzIGhlcmVcclxuICogXHJcbiAqIGNvbnN0IGNsdXN0ZXJQcm92aWRlciA9IG5ldyBibHVlcHJpbnRzLkdlbmVyaWNDbHVzdGVyUHJvdmlkZXIoe1xyXG4gICAgIG1hc3RlcnNSb2xlOiBhZG1pblJvbGUsXHJcbiAgICAgLi4uIG90aGVyIHByb3BzXHJcbiAqIH0pO1xyXG4gKiBAcGFyYW0gcmVzb3VyY2VOYW1lIFxyXG4gKiBAcmV0dXJucyBcclxuICovXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXROYW1lZFJlc291cmNlPFQgZXh0ZW5kcyBJQ29uc3RydWN0ID0gSUNvbnN0cnVjdD4ocmVzb3VyY2VOYW1lIDogc3RyaW5nKSA6IFQge1xyXG4gICAgcmV0dXJuIG5ldyBQcm94eSh7fSBhcyBULCBuZXcgRHVtbXlQcm94eSgocmVzb3VyY2VDb250ZXh0OiBSZXNvdXJjZUNvbnRleHQpID0+IHtcclxuICAgICAgICByZXR1cm4gcmVzb3VyY2VDb250ZXh0LmdldChyZXNvdXJjZU5hbWUpIGFzIFQ7XHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIGEgcHJveHkgdG8gYW4gYW5vbnltb3VzIHJlc291cmNlLiBUaGlzIGZ1bmN0aW9uIGFsbG93cyBwYXNzaW5nIHRoZSBwcm92aWRlciBmdW5jdGlvbiBhcyBpbnB1dC4gIFxyXG4gKiBJdCBlbmFibGVzIGNyZWF0aW5nIGFkLWhvYyByZWZlcmVuY2VzIG91dHNpZGUgb2YgdGhlIFN0YWNrIGNvbnN0cnVjdCBhbmQgdXNpbmcgdGhlbSB3aXRoIHRoZSBibHVlcHJpbnQuXHJcbiAqIERlc2lnbmVkIGZvciBjYXNlcyB3aGVuIHJlc291cmNlIGlzIGRlZmluZWQgb25jZSBhbmQgbmVlZGVkIGluIGEgc2luZ2xlIHBsYWNlLlxyXG4gKiBAZXhhbXBsZVxyXG4gKiBjb25zdCBhcHAgPSBuZXcgY2RrLkFwcCgpO1xyXG4gKiBjb25zdCBjbHVzdGVyUHJvdmlkZXIgPSBuZXcgYmx1ZXByaW50cy5HZW5lcmljQ2x1c3RlclByb3ZpZGVyKHtcclxuICogICBtYXN0ZXJzUm9sZTogYmx1ZXByaW50cy5nZXRSZXNvdXJjZShjb250ZXh0ID0+IHsgLy8gd2lsbCBnZW5lcmF0ZSBhIHVuaXF1ZSBuYW1lIGZvciByZXNvdXJjZS4gXHJcbiAgICAgICAgcmV0dXJuIG5ldyBpYW0uUm9sZShjb250ZXh0LnNjb3BlLCAnQWRtaW5Sb2xlJywgeyBhc3N1bWVkQnk6IG5ldyBBY2NvdW50Um9vdFByaW5jaXBhbCgpfSk7XHJcbiAgICB9KSxcclxuICAgIC4uLiBvdGhlciBwcm9wc1xyXG59KTtcclxuICogQHBhcmFtIHJlc291cmNlTmFtZSBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZ2V0UmVzb3VyY2U8VCBleHRlbmRzIElSZXNvdXJjZSA9IElSZXNvdXJjZT4oZm46IChjb250ZXh0OiBSZXNvdXJjZUNvbnRleHQpID0+IFQpIDogVCB7XHJcbiAgICBjb25zdCB1aWQgPSB1dWlkKCk7XHJcbiAgICByZXR1cm4gbmV3IFByb3h5KHt9IGFzIFQsIG5ldyBEdW1teVByb3h5KChyZXNvdXJjZUNvbnRleHQ6IFJlc291cmNlQ29udGV4dCkgPT4ge1xyXG4gICAgICAgIGxldCByZXN1bHQgPSByZXNvdXJjZUNvbnRleHQuZ2V0KHVpZCk7XHJcbiAgICAgICAgaWYocmVzdWx0ID09IG51bGwpIHtcclxuICAgICAgICAgICAgcmVzb3VyY2VDb250ZXh0LmFkZCh1aWQsIHtcclxuICAgICAgICAgICAgICAgIHByb3ZpZGUoY29udGV4dDogUmVzb3VyY2VDb250ZXh0KSA6IFQge1xyXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBmbihjb250ZXh0KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc291cmNlQ29udGV4dC5nZXQodWlkKSBhcyBUO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0IGFzIFQ7XHJcbiAgICB9KSk7XHJcbn1cclxuIl19