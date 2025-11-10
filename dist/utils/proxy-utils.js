"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DummyProxy = exports.sourceFunction = exports.isDynamicProxy = void 0;
exports.resolveTarget = resolveTarget;
const nutil = require("node:util/types");
/**
 * Symbol that uniquely designates that a particular proxy is instance of our DummyProxy
 */
exports.isDynamicProxy = Symbol("isDynamicProxy");
/**
 * Symbol that retrieves the source function from the proxy. This function is expected to create the required target (e.g. resource).
 */
exports.sourceFunction = Symbol("sourceFunction");
/**
 * Simple proxy implementation that will require resolution at runtime (enables lazy loading).
 * Unlike dynamic proxy that can create target on the fly, this proxy
 * just a place-holder that supplies the function that can be used to resolve the target.
 * Since most CDK constructs are not idempotent (meaning you can not call a create function twice, the second will fail)
 * this design choice was the simplest to support declarative resources.
 * Customers can clone the supplied JSON structure with cloneDeep and replace proxies with the actual targets as part of that process.
 */
class DummyProxy {
    source;
    constructor(source) {
        this.source = source;
    }
    get(_, key) {
        if (key === exports.isDynamicProxy) {
            return true;
        }
        if (key === exports.sourceFunction) {
            return this.source;
        }
        return new Proxy({}, new DummyProxy((arg) => {
            return this.source(arg)[key];
        }));
    }
}
exports.DummyProxy = DummyProxy;
/**
 * Function resolves the proxy with the target, that enables lazy loading use cases.
 * @param value potential proxy to resolve
 * @param arg represents the argument that should be passed to the resolution function (sourceFunction).
 * @returns
 */
function resolveTarget(value, arg) {
    if (nutil.isProxy(value)) {
        const object = value;
        if (object[exports.isDynamicProxy]) {
            const fn = object[exports.sourceFunction];
            return fn(arg);
        }
    }
    return value;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHktdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMvcHJveHktdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBK0NBLHNDQVNDO0FBeERELHlDQUF5QztBQUl6Qzs7R0FFRztBQUNVLFFBQUEsY0FBYyxHQUFHLE1BQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDO0FBRXZEOztHQUVHO0FBQ1UsUUFBQSxjQUFjLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFdkQ7Ozs7Ozs7R0FPRztBQUNILE1BQWEsVUFBVTtJQUVDO0lBQXBCLFlBQW9CLE1BQW9CO1FBQXBCLFdBQU0sR0FBTixNQUFNLENBQWM7SUFBRyxDQUFDO0lBRXJDLEdBQUcsQ0FBQyxDQUFJLEVBQUUsR0FBZ0I7UUFDN0IsSUFBRyxHQUFHLEtBQUssc0JBQWMsRUFBRSxDQUFDO1lBQ3hCLE9BQU8sSUFBSSxDQUFDO1FBQ2hCLENBQUM7UUFFRCxJQUFHLEdBQUcsS0FBSyxzQkFBYyxFQUFFLENBQUM7WUFDeEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQ3ZCLENBQUM7UUFFRCxPQUFPLElBQUksS0FBSyxDQUFDLEVBQVMsRUFBRSxJQUFJLFVBQVUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxFQUFFO1lBQy9DLE9BQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQVMsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUMxQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ1IsQ0FBQztDQUNKO0FBakJELGdDQWlCQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsYUFBYSxDQUFDLEtBQVUsRUFBRSxHQUFRO0lBQzlDLElBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDO1FBQ3RCLE1BQU0sTUFBTSxHQUFTLEtBQUssQ0FBQztRQUMzQixJQUFHLE1BQU0sQ0FBQyxzQkFBYyxDQUFDLEVBQUUsQ0FBQztZQUN4QixNQUFNLEVBQUUsR0FBbUIsTUFBTSxDQUFDLHNCQUFjLENBQUMsQ0FBQztZQUNsRCxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNuQixDQUFDO0lBQ0wsQ0FBQztJQUNELE9BQU8sS0FBSyxDQUFDO0FBQ2pCLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBudXRpbCBmcm9tICdub2RlOnV0aWwvdHlwZXMnO1xyXG5cclxuZXhwb3J0IHR5cGUgT25lQXJnRm48VD4gPSAoYXJnOiBhbnkpID0+IFQ7XHJcblxyXG4vKipcclxuICogU3ltYm9sIHRoYXQgdW5pcXVlbHkgZGVzaWduYXRlcyB0aGF0IGEgcGFydGljdWxhciBwcm94eSBpcyBpbnN0YW5jZSBvZiBvdXIgRHVtbXlQcm94eVxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IGlzRHluYW1pY1Byb3h5ID0gU3ltYm9sKFwiaXNEeW5hbWljUHJveHlcIik7XHJcblxyXG4vKipcclxuICogU3ltYm9sIHRoYXQgcmV0cmlldmVzIHRoZSBzb3VyY2UgZnVuY3Rpb24gZnJvbSB0aGUgcHJveHkuIFRoaXMgZnVuY3Rpb24gaXMgZXhwZWN0ZWQgdG8gY3JlYXRlIHRoZSByZXF1aXJlZCB0YXJnZXQgKGUuZy4gcmVzb3VyY2UpLlxyXG4gKi9cclxuZXhwb3J0IGNvbnN0IHNvdXJjZUZ1bmN0aW9uID0gU3ltYm9sKFwic291cmNlRnVuY3Rpb25cIik7XHJcblxyXG4vKipcclxuICogU2ltcGxlIHByb3h5IGltcGxlbWVudGF0aW9uIHRoYXQgd2lsbCByZXF1aXJlIHJlc29sdXRpb24gYXQgcnVudGltZSAoZW5hYmxlcyBsYXp5IGxvYWRpbmcpLlxyXG4gKiBVbmxpa2UgZHluYW1pYyBwcm94eSB0aGF0IGNhbiBjcmVhdGUgdGFyZ2V0IG9uIHRoZSBmbHksIHRoaXMgcHJveHlcclxuICoganVzdCBhIHBsYWNlLWhvbGRlciB0aGF0IHN1cHBsaWVzIHRoZSBmdW5jdGlvbiB0aGF0IGNhbiBiZSB1c2VkIHRvIHJlc29sdmUgdGhlIHRhcmdldC4gXHJcbiAqIFNpbmNlIG1vc3QgQ0RLIGNvbnN0cnVjdHMgYXJlIG5vdCBpZGVtcG90ZW50IChtZWFuaW5nIHlvdSBjYW4gbm90IGNhbGwgYSBjcmVhdGUgZnVuY3Rpb24gdHdpY2UsIHRoZSBzZWNvbmQgd2lsbCBmYWlsKVxyXG4gKiB0aGlzIGRlc2lnbiBjaG9pY2Ugd2FzIHRoZSBzaW1wbGVzdCB0byBzdXBwb3J0IGRlY2xhcmF0aXZlIHJlc291cmNlcy4gXHJcbiAqIEN1c3RvbWVycyBjYW4gY2xvbmUgdGhlIHN1cHBsaWVkIEpTT04gc3RydWN0dXJlIHdpdGggY2xvbmVEZWVwIGFuZCByZXBsYWNlIHByb3hpZXMgd2l0aCB0aGUgYWN0dWFsIHRhcmdldHMgYXMgcGFydCBvZiB0aGF0IHByb2Nlc3MuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgRHVtbXlQcm94eTxUIGV4dGVuZHMgb2JqZWN0PiBpbXBsZW1lbnRzIFByb3h5SGFuZGxlcjxUPiB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBzb3VyY2UgOiBPbmVBcmdGbjxUPikge31cclxuXHJcbiAgICBwdWJsaWMgZ2V0KF86IFQsIGtleTogUHJvcGVydHlLZXkpOiBhbnkge1xyXG4gICAgICAgIGlmKGtleSA9PT0gaXNEeW5hbWljUHJveHkpIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIFxyXG4gICAgICAgIGlmKGtleSA9PT0gc291cmNlRnVuY3Rpb24pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc291cmNlO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm94eSh7fSBhcyBhbnksIG5ldyBEdW1teVByb3h5KChhcmcpID0+IHtcclxuICAgICAgICAgICAgcmV0dXJuICh0aGlzLnNvdXJjZShhcmcpIGFzIGFueSlba2V5XTtcclxuICAgICAgICB9KSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBGdW5jdGlvbiByZXNvbHZlcyB0aGUgcHJveHkgd2l0aCB0aGUgdGFyZ2V0LCB0aGF0IGVuYWJsZXMgbGF6eSBsb2FkaW5nIHVzZSBjYXNlcy5cclxuICogQHBhcmFtIHZhbHVlIHBvdGVudGlhbCBwcm94eSB0byByZXNvbHZlXHJcbiAqIEBwYXJhbSBhcmcgcmVwcmVzZW50cyB0aGUgYXJndW1lbnQgdGhhdCBzaG91bGQgYmUgcGFzc2VkIHRvIHRoZSByZXNvbHV0aW9uIGZ1bmN0aW9uIChzb3VyY2VGdW5jdGlvbikuXHJcbiAqIEByZXR1cm5zIFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIHJlc29sdmVUYXJnZXQodmFsdWU6IGFueSwgYXJnOiBhbnkpIHtcclxuICAgIGlmKG51dGlsLmlzUHJveHkodmFsdWUpKSB7XHJcbiAgICAgICAgY29uc3Qgb2JqZWN0IDogYW55ID0gdmFsdWU7XHJcbiAgICAgICAgaWYob2JqZWN0W2lzRHluYW1pY1Byb3h5XSkge1xyXG4gICAgICAgICAgICBjb25zdCBmbjogT25lQXJnRm48YW55PiAgPSBvYmplY3Rbc291cmNlRnVuY3Rpb25dO1xyXG4gICAgICAgICAgICByZXR1cm4gZm4oYXJnKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gdmFsdWU7XHJcbn1cclxuXHJcbiJdfQ==