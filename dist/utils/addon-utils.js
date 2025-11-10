"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutoModeConflictType = void 0;
exports.getAddOnNameOrId = getAddOnNameOrId;
exports.isOrderedAddOn = isOrderedAddOn;
exports.dependable = dependable;
exports.conflictsWith = conflictsWith;
exports.conflictsWithAutoMode = conflictsWithAutoMode;
exports.mustRunOnAutoMode = mustRunOnAutoMode;
const assert = require("assert");
require("reflect-metadata");
const semver = require("semver");
const log_utils_1 = require("./log-utils");
/**
 * Returns AddOn Id if defined else returns the class name
 * @param addOn
 * @returns string
 */
function getAddOnNameOrId(addOn) {
    return addOn.id ?? addOn.constructor.name;
}
function isOrderedAddOn(addOn) {
    return Reflect.getMetadata("ordered", addOn.constructor) ?? Reflect.getMetadata("ordered", addOn) ?? false;
}
/**
 * Decorator function that accepts a list of AddOns and
 * ensures addons are scheduled to be added as well as
 * add them as dependencies
 * @param addOns
 * @returns
 */
function dependable(...addOns) {
    return function (target, key, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const dependencies = Array();
            const clusterInfo = args[0];
            const stack = clusterInfo.cluster.stack.stackName;
            addOns.forEach((addOn) => {
                if (clusterInfo.autoMode && isAutoModeAddon(addOn)) {
                    return;
                }
                const dep = clusterInfo.getScheduledAddOn(addOn);
                let targetString = target?.constructor?.toString().split("\n")[0] ?? "unknown";
                assert(dep, `Missing a dependency for ${addOn} for ${stack} and target ${targetString}`);
                dependencies.push(dep);
            });
            const result = originalMethod.apply(this, args);
            Promise.all(dependencies.values()).then((constructs) => {
                constructs.forEach((construct) => {
                    result.then((resource) => {
                        resource.node.addDependency(construct);
                    });
                });
            }).catch(err => { throw new Error(err); });
            return result;
        };
        return descriptor;
    };
}
/**
 * Decorator function that accepts a list of AddOns and
 * throws error if those addons are scheduled to be added as well
 * As they should not be deployed with
 * @param addOns
 * @returns
 */
function conflictsWith(...addOns) {
    return function (target, key, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            // const dependencies: (Promise<Construct> | undefined)[] = [];
            const clusterInfo = args[0];
            const stack = clusterInfo.cluster.stack.stackName;
            addOns.forEach((addOn) => {
                const dep = clusterInfo.getScheduledAddOn(addOn);
                if (dep) {
                    throw new Error(`Deploying ${stack} failed due to conflicting add-on: ${addOn}.`);
                }
            });
            return originalMethod.apply(this, args);
        };
        return descriptor;
    };
}
function compareAddonEksVersions(version1, version2) {
    // Extract semver and build number from both versions
    const [semver1, build1] = parseEksVersion(version1);
    const [semver2, build2] = parseEksVersion(version2);
    // Compare semver parts first
    const semverCompare = semver.compare(semver1, semver2);
    if (semverCompare !== 0)
        return semverCompare;
    // If semver parts are equal, compare build numbers
    return build1 - build2;
}
// Helper function to parse EKS version
function parseEksVersion(version) {
    const match = version.match(/^v?(\d+\.\d+\.\d+)(?:-eksbuild\.(\d+))?$/);
    if (!match) {
        throw new Error(`Invalid EKS version format: ${version}`);
    }
    return [match[1], parseInt(match[2] || '0', 10)];
}
var AutoModeConflictType;
(function (AutoModeConflictType) {
    AutoModeConflictType["VERSION_MISMATCH"] = "version-mismatch";
    AutoModeConflictType["VERSION_UNKNOWN"] = "version-unknown";
    AutoModeConflictType["ALREADY_INSTALLED"] = "already-installed";
    AutoModeConflictType["NOT_SUPPORTED"] = "not-supported";
})(AutoModeConflictType || (exports.AutoModeConflictType = AutoModeConflictType = {}));
function getAutoModeMessage(conflictType, addonName, version, minVersion) {
    const messages = {
        [AutoModeConflictType.VERSION_MISMATCH]: `Add-on ${addonName} version ${version} is incompatible. Minimum required version: ${minVersion}`,
        [AutoModeConflictType.VERSION_UNKNOWN]: `Add-on ${addonName} version could not be determined. Please verify compatibility at https://docs.aws.amazon.com/eks/latest/userguide/auto-enable-existing.html#auto-addons-required`,
        [AutoModeConflictType.ALREADY_INSTALLED]: `Add-on ${addonName} is already available on the cluster with EKS Auto Mode`,
        [AutoModeConflictType.NOT_SUPPORTED]: `Add-on ${addonName} is not supported on EKS Auto Mode`
    };
    return messages[conflictType];
}
function conflictsWithAutoMode(conflictType, minExpectedVersion) {
    return function (target, key, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const clusterInfo = args[0];
            const stack = clusterInfo.cluster.stack.stackName;
            const addonName = this.constructor.name;
            if (!clusterInfo.autoMode) {
                return originalMethod.apply(this, args);
            }
            let version = null;
            if ('getAddonVersion' in this && typeof this.getAddonVersion === 'function') {
                version = this.getAddonVersion();
            }
            switch (conflictType) {
                case AutoModeConflictType.VERSION_UNKNOWN:
                    log_utils_1.logger.warn(getAutoModeMessage(conflictType, addonName, version, minExpectedVersion));
                    return originalMethod.apply(this, args);
                case AutoModeConflictType.VERSION_MISMATCH:
                    if (version === "auto") {
                        log_utils_1.logger.warn(getAutoModeMessage(AutoModeConflictType.VERSION_UNKNOWN, addonName, version, minExpectedVersion));
                        return originalMethod.apply(this, args);
                    }
                    if (compareAddonEksVersions(version, minExpectedVersion) >= 0) {
                        return originalMethod.apply(this, args);
                    }
                case AutoModeConflictType.NOT_SUPPORTED:
                case AutoModeConflictType.ALREADY_INSTALLED:
                    throw new Error(`Deploying ${stack} failed. ${getAutoModeMessage(conflictType, addonName, version, minExpectedVersion)}`);
            }
        };
        return descriptor;
    };
}
function mustRunOnAutoMode() {
    return function (target, key, descriptor) {
        const originalMethod = descriptor.value;
        descriptor.value = function (...args) {
            const clusterInfo = args[0];
            const stack = clusterInfo.cluster.stack.stackName;
            const addonName = this.constructor.name;
            if (clusterInfo.autoMode) {
                return originalMethod.apply(this, args);
            }
            else {
                throw new Error(`Deploying ${stack} failed. Add-on ${addonName} can only be run on EKS Auto Mode clusters.`);
            }
        };
        return descriptor;
    };
}
/**
 * Checks if the passed addon is part of auto mode and deployed by the EKS CP.
 * @param addOn addOn name to check
 * @returns true if it is one of the addOns that is managed by the EKS in Auto Mode
 */
function isAutoModeAddon(addOn) {
    const automodeAddons = [
        "EbsCsiDriverAddOn",
        "AwsLoadBalancerControllerAddOn",
        "VpcCniAddOn",
        "CoreDnsAddOn",
        "KubeProxyAddOn",
    ];
    return automodeAddons.includes(addOn);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWRkb24tdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMvYWRkb24tdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBWUEsNENBRUM7QUFFRCx3Q0FFQztBQVNELGdDQXFDQztBQVNELHNDQXFCQztBQXlDRCxzREFvQ0M7QUFFRCw4Q0FvQkM7QUFqTUQsaUNBQWlDO0FBRWpDLDRCQUEwQjtBQUUxQixpQ0FBaUM7QUFDakMsMkNBQXFDO0FBRXJDOzs7O0dBSUc7QUFDSCxTQUFnQixnQkFBZ0IsQ0FBQyxLQUFtQjtJQUNsRCxPQUFPLEtBQUssQ0FBQyxFQUFFLElBQUksS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUM7QUFDNUMsQ0FBQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxLQUFtQjtJQUM5QyxPQUFPLE9BQU8sQ0FBQyxXQUFXLENBQUMsU0FBUyxFQUFFLEtBQUssQ0FBQyxXQUFXLENBQUMsSUFBSSxPQUFPLENBQUMsV0FBVyxDQUFDLFNBQVMsRUFBRSxLQUFLLENBQUMsSUFBSSxLQUFLLENBQUM7QUFDL0csQ0FBQztBQUVEOzs7Ozs7R0FNRztBQUNILFNBQWdCLFVBQVUsQ0FBQyxHQUFHLE1BQWdCO0lBRTVDLE9BQU8sVUFBVSxNQUFXLEVBQUUsR0FBb0IsRUFBRSxVQUE4QjtRQUNoRixNQUFNLGNBQWMsR0FBRyxVQUFVLENBQUMsS0FBSyxDQUFDO1FBRXhDLFVBQVUsQ0FBQyxLQUFLLEdBQUcsVUFBVSxHQUFHLElBQVc7WUFDekMsTUFBTSxZQUFZLEdBQUcsS0FBSyxFQUFzQixDQUFDO1lBQ2pELE1BQU0sV0FBVyxHQUFnQixJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDekMsTUFBTSxLQUFLLEdBQUcsV0FBVyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsU0FBUyxDQUFDO1lBRWxELE1BQU0sQ0FBQyxPQUFPLENBQUUsQ0FBQyxLQUFLLEVBQUUsRUFBRTtnQkFDeEIsSUFBRyxXQUFX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LE9BQU8sY0FBYyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7WUFDMUMsQ0FBQztpQkFBTSxDQUFDO2dCQUNOLE1BQU0sSUFBSSxLQUFLLENBQUMsYUFBYSxLQUFLLG1CQUFtQixTQUFTLDZDQUE2QyxDQUFDLENBQUM7WUFDL0csQ0FBQztRQUNILENBQUMsQ0FBQztRQUVFLE9BQU8sVUFBVSxDQUFDO0lBRXhCLENBQUMsQ0FBQztBQUdKLENBQUM7QUFFRDs7OztHQUlHO0FBQ0gsU0FBUyxlQUFlLENBQUMsS0FBYTtJQUNwQyxNQUFNLGNBQWMsR0FBRztRQUNyQixtQkFBbUI7UUFDbkIsZ0NBQWdDO1FBQ2hDLGFBQWE7UUFDYixjQUFjO1FBQ2QsZ0JBQWdCO0tBQ2pCLENBQUM7SUFDRixPQUFPLGNBQWMsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDeEMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGFzc2VydCBmcm9tIFwiYXNzZXJ0XCI7XHJcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gXCJjb25zdHJ1Y3RzXCI7XHJcbmltcG9ydCBcInJlZmxlY3QtbWV0YWRhdGFcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckFkZE9uLCBDbHVzdGVySW5mbyB9IGZyb20gJy4uL3NwaSc7XHJcbmltcG9ydCAqIGFzIHNlbXZlciBmcm9tIFwic2VtdmVyXCI7XHJcbmltcG9ydCB7IGxvZ2dlciB9IGZyb20gXCIuL2xvZy11dGlsc1wiO1xyXG5cclxuLyoqXHJcbiAqIFJldHVybnMgQWRkT24gSWQgaWYgZGVmaW5lZCBlbHNlIHJldHVybnMgdGhlIGNsYXNzIG5hbWVcclxuICogQHBhcmFtIGFkZE9uXHJcbiAqIEByZXR1cm5zIHN0cmluZ1xyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGdldEFkZE9uTmFtZU9ySWQoYWRkT246IENsdXN0ZXJBZGRPbik6IHN0cmluZyB7XHJcbiAgcmV0dXJuIGFkZE9uLmlkID8/IGFkZE9uLmNvbnN0cnVjdG9yLm5hbWU7XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBpc09yZGVyZWRBZGRPbihhZGRPbjogQ2x1c3RlckFkZE9uKSA6IGJvb2xlYW4ge1xyXG4gICAgcmV0dXJuIFJlZmxlY3QuZ2V0TWV0YWRhdGEoXCJvcmRlcmVkXCIsIGFkZE9uLmNvbnN0cnVjdG9yKSA/PyBSZWZsZWN0LmdldE1ldGFkYXRhKFwib3JkZXJlZFwiLCBhZGRPbikgPz8gZmFsc2U7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBEZWNvcmF0b3IgZnVuY3Rpb24gdGhhdCBhY2NlcHRzIGEgbGlzdCBvZiBBZGRPbnMgYW5kXHJcbiAqIGVuc3VyZXMgYWRkb25zIGFyZSBzY2hlZHVsZWQgdG8gYmUgYWRkZWQgYXMgd2VsbCBhc1xyXG4gKiBhZGQgdGhlbSBhcyBkZXBlbmRlbmNpZXNcclxuICogQHBhcmFtIGFkZE9ucyBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gZGVwZW5kYWJsZSguLi5hZGRPbnM6IHN0cmluZ1tdKSB7XHJcbiAgXHJcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IGFueSwga2V5OiBzdHJpbmcgfCBzeW1ib2wsIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcikge1xyXG4gICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG5cclxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiggLi4uYXJnczogYW55W10pIHtcclxuICAgICAgY29uc3QgZGVwZW5kZW5jaWVzID0gQXJyYXk8UHJvbWlzZTxDb25zdHJ1Y3Q+PigpO1xyXG4gICAgICBjb25zdCBjbHVzdGVySW5mbzogQ2x1c3RlckluZm8gPSBhcmdzWzBdO1xyXG4gICAgICBjb25zdCBzdGFjayA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXIuc3RhY2suc3RhY2tOYW1lO1xyXG5cclxuICAgICAgYWRkT25zLmZvckVhY2goIChhZGRPbikgPT4ge1xyXG4gICAgICAgIGlmKGNsdXN0ZXJJbmZvLmF1dG9Nb2RlICYmIGlzQXV0b01vZGVBZGRvbihhZGRPbikpIHtcclxuICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgY29uc3QgZGVwID0gY2x1c3RlckluZm8uZ2V0U2NoZWR1bGVkQWRkT24oYWRkT24pO1xyXG4gICAgICAgXHJcbiAgICAgICAgbGV0IHRhcmdldFN0cmluZyA9IHRhcmdldD8uY29uc3RydWN0b3I/LnRvU3RyaW5nKCkuc3BsaXQoXCJcXG5cIilbMF0gPz8gXCJ1bmtub3duXCI7XHJcblxyXG4gICAgICAgIGFzc2VydChkZXAsIGBNaXNzaW5nIGEgZGVwZW5kZW5jeSBmb3IgJHthZGRPbn0gZm9yICR7c3RhY2t9IGFuZCB0YXJnZXQgJHt0YXJnZXRTdHJpbmd9YCk7XHJcbiAgICAgICAgZGVwZW5kZW5jaWVzLnB1c2goZGVwISk7XHJcbiAgICAgIH0pO1xyXG5cclxuICAgICAgY29uc3QgcmVzdWx0OiBQcm9taXNlPENvbnN0cnVjdD4gPSBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHJcbiAgICAgIFByb21pc2UuYWxsKGRlcGVuZGVuY2llcy52YWx1ZXMoKSkudGhlbigoY29uc3RydWN0cykgPT4ge1xyXG4gICAgICAgIGNvbnN0cnVjdHMuZm9yRWFjaCgoY29uc3RydWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHJlc3VsdC50aGVuKChyZXNvdXJjZSkgPT4ge1xyXG4gICAgICAgICAgICAgIHJlc291cmNlLm5vZGUuYWRkRGVwZW5kZW5jeShjb25zdHJ1Y3QpO1xyXG4gICAgICAgICAgICB9KTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSkuY2F0Y2goZXJyID0+IHsgdGhyb3cgbmV3IEVycm9yKGVycik7IH0pO1xyXG5cclxuICAgICAgcmV0dXJuIHJlc3VsdDtcclxuICAgIH07XHJcblxyXG4gICAgcmV0dXJuIGRlc2NyaXB0b3I7XHJcbiAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlY29yYXRvciBmdW5jdGlvbiB0aGF0IGFjY2VwdHMgYSBsaXN0IG9mIEFkZE9ucyBhbmRcclxuICogdGhyb3dzIGVycm9yIGlmIHRob3NlIGFkZG9ucyBhcmUgc2NoZWR1bGVkIHRvIGJlIGFkZGVkIGFzIHdlbGxcclxuICogQXMgdGhleSBzaG91bGQgbm90IGJlIGRlcGxveWVkIHdpdGhcclxuICogQHBhcmFtIGFkZE9ucyBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY29uZmxpY3RzV2l0aCguLi5hZGRPbnM6IHN0cmluZ1tdKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uICh0YXJnZXQ6IG9iamVjdCwga2V5OiBzdHJpbmcgfCBzeW1ib2wsIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcikge1xyXG4gICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG5cclxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbiggLi4uYXJnczogYW55W10pIHtcclxuICAgICAgLy8gY29uc3QgZGVwZW5kZW5jaWVzOiAoUHJvbWlzZTxDb25zdHJ1Y3Q+IHwgdW5kZWZpbmVkKVtdID0gW107XHJcbiAgICAgIGNvbnN0IGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyA9IGFyZ3NbMF07XHJcbiAgICAgIGNvbnN0IHN0YWNrID0gY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjay5zdGFja05hbWU7XHJcblxyXG4gICAgICBhZGRPbnMuZm9yRWFjaCggKGFkZE9uKSA9PiB7XHJcbiAgICAgICAgY29uc3QgZGVwID0gY2x1c3RlckluZm8uZ2V0U2NoZWR1bGVkQWRkT24oYWRkT24pO1xyXG4gICAgICAgIGlmIChkZXApe1xyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEZXBsb3lpbmcgJHtzdGFja30gZmFpbGVkIGR1ZSB0byBjb25mbGljdGluZyBhZGQtb246ICR7YWRkT259LmApO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcblxyXG4gICAgICByZXR1cm4gb3JpZ2luYWxNZXRob2QuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgICB9O1xyXG5cclxuICAgIHJldHVybiBkZXNjcmlwdG9yO1xyXG4gIH07XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNvbXBhcmVBZGRvbkVrc1ZlcnNpb25zKHZlcnNpb24xOiBzdHJpbmcsIHZlcnNpb24yOiBzdHJpbmcpOiBudW1iZXIge1xyXG4gIC8vIEV4dHJhY3Qgc2VtdmVyIGFuZCBidWlsZCBudW1iZXIgZnJvbSBib3RoIHZlcnNpb25zXHJcbiAgY29uc3QgW3NlbXZlcjEsIGJ1aWxkMV0gPSBwYXJzZUVrc1ZlcnNpb24odmVyc2lvbjEpO1xyXG4gIGNvbnN0IFtzZW12ZXIyLCBidWlsZDJdID0gcGFyc2VFa3NWZXJzaW9uKHZlcnNpb24yKTtcclxuXHJcbiAgLy8gQ29tcGFyZSBzZW12ZXIgcGFydHMgZmlyc3RcclxuICBjb25zdCBzZW12ZXJDb21wYXJlID0gc2VtdmVyLmNvbXBhcmUoc2VtdmVyMSwgc2VtdmVyMik7XHJcbiAgaWYgKHNlbXZlckNvbXBhcmUgIT09IDApIHJldHVybiBzZW12ZXJDb21wYXJlO1xyXG5cclxuICAvLyBJZiBzZW12ZXIgcGFydHMgYXJlIGVxdWFsLCBjb21wYXJlIGJ1aWxkIG51bWJlcnNcclxuICByZXR1cm4gYnVpbGQxIC0gYnVpbGQyO1xyXG59XHJcblxyXG4gICAgLy8gSGVscGVyIGZ1bmN0aW9uIHRvIHBhcnNlIEVLUyB2ZXJzaW9uXHJcbmZ1bmN0aW9uIHBhcnNlRWtzVmVyc2lvbih2ZXJzaW9uOiBzdHJpbmcpOiBbc3RyaW5nLCBudW1iZXJdIHtcclxuICBjb25zdCBtYXRjaCA9IHZlcnNpb24ubWF0Y2goL152PyhcXGQrXFwuXFxkK1xcLlxcZCspKD86LWVrc2J1aWxkXFwuKFxcZCspKT8kLyk7XHJcbiAgaWYgKCFtYXRjaCkge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIEVLUyB2ZXJzaW9uIGZvcm1hdDogJHt2ZXJzaW9ufWApO1xyXG4gIH1cclxuICByZXR1cm4gW21hdGNoWzFdLCBwYXJzZUludChtYXRjaFsyXSB8fCAnMCcsIDEwKV07XHJcbn1cclxuXHJcbmV4cG9ydCBlbnVtIEF1dG9Nb2RlQ29uZmxpY3RUeXBlIHtcclxuICBWRVJTSU9OX01JU01BVENIID0gXCJ2ZXJzaW9uLW1pc21hdGNoXCIsXHJcbiAgVkVSU0lPTl9VTktOT1dOID0gXCJ2ZXJzaW9uLXVua25vd25cIixcclxuICBBTFJFQURZX0lOU1RBTExFRCA9IFwiYWxyZWFkeS1pbnN0YWxsZWRcIiwgXHJcbiAgTk9UX1NVUFBPUlRFRCA9IFwibm90LXN1cHBvcnRlZFwiXHJcbn1cclxuXHJcbmZ1bmN0aW9uIGdldEF1dG9Nb2RlTWVzc2FnZShjb25mbGljdFR5cGU6IEF1dG9Nb2RlQ29uZmxpY3RUeXBlLCBhZGRvbk5hbWU6IHN0cmluZywgdmVyc2lvbj86IHN0cmluZywgbWluVmVyc2lvbj86IHN0cmluZyk6IHN0cmluZyB7XHJcbiAgY29uc3QgbWVzc2FnZXM6IFJlY29yZDxBdXRvTW9kZUNvbmZsaWN0VHlwZSwgc3RyaW5nPiA9IHtcclxuICAgIFtBdXRvTW9kZUNvbmZsaWN0VHlwZS5WRVJTSU9OX01JU01BVENIXTogYEFkZC1vbiAke2FkZG9uTmFtZX0gdmVyc2lvbiAke3ZlcnNpb259IGlzIGluY29tcGF0aWJsZS4gTWluaW11bSByZXF1aXJlZCB2ZXJzaW9uOiAke21pblZlcnNpb259YCxcclxuICAgIFtBdXRvTW9kZUNvbmZsaWN0VHlwZS5WRVJTSU9OX1VOS05PV05dOiBgQWRkLW9uICR7YWRkb25OYW1lfSB2ZXJzaW9uIGNvdWxkIG5vdCBiZSBkZXRlcm1pbmVkLiBQbGVhc2UgdmVyaWZ5IGNvbXBhdGliaWxpdHkgYXQgaHR0cHM6Ly9kb2NzLmF3cy5hbWF6b24uY29tL2Vrcy9sYXRlc3QvdXNlcmd1aWRlL2F1dG8tZW5hYmxlLWV4aXN0aW5nLmh0bWwjYXV0by1hZGRvbnMtcmVxdWlyZWRgLFxyXG4gICAgW0F1dG9Nb2RlQ29uZmxpY3RUeXBlLkFMUkVBRFlfSU5TVEFMTEVEXTogYEFkZC1vbiAke2FkZG9uTmFtZX0gaXMgYWxyZWFkeSBhdmFpbGFibGUgb24gdGhlIGNsdXN0ZXIgd2l0aCBFS1MgQXV0byBNb2RlYCxcclxuICAgIFtBdXRvTW9kZUNvbmZsaWN0VHlwZS5OT1RfU1VQUE9SVEVEXTogYEFkZC1vbiAke2FkZG9uTmFtZX0gaXMgbm90IHN1cHBvcnRlZCBvbiBFS1MgQXV0byBNb2RlYFxyXG4gIH07XHJcbiAgcmV0dXJuIG1lc3NhZ2VzW2NvbmZsaWN0VHlwZV07XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBjb25mbGljdHNXaXRoQXV0b01vZGUoY29uZmxpY3RUeXBlOiBBdXRvTW9kZUNvbmZsaWN0VHlwZSwgbWluRXhwZWN0ZWRWZXJzaW9uPzogc3RyaW5nKSB7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKHRhcmdldDogb2JqZWN0LCBrZXk6IHN0cmluZyB8IHN5bWJvbCwgZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yKSB7XHJcbiAgICBjb25zdCBvcmlnaW5hbE1ldGhvZCA9IGRlc2NyaXB0b3IudmFsdWU7XHJcblxyXG4gICAgZGVzY3JpcHRvci52YWx1ZSA9IGZ1bmN0aW9uKHRoaXM6IGFueSwgLi4uYXJnczogYW55W10pIHtcclxuICAgICAgY29uc3QgY2x1c3RlckluZm86IENsdXN0ZXJJbmZvID0gYXJnc1swXTtcclxuICAgICAgY29uc3Qgc3RhY2sgPSBjbHVzdGVySW5mby5jbHVzdGVyLnN0YWNrLnN0YWNrTmFtZTtcclxuICAgICAgY29uc3QgYWRkb25OYW1lID0gdGhpcy5jb25zdHJ1Y3Rvci5uYW1lO1xyXG4gICAgICBpZiAoIWNsdXN0ZXJJbmZvLmF1dG9Nb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICB9XHJcbiAgICAgIGxldCB2ZXJzaW9uID0gbnVsbDtcclxuICAgICAgaWYoJ2dldEFkZG9uVmVyc2lvbicgaW4gdGhpcyAmJiB0eXBlb2YgdGhpcy5nZXRBZGRvblZlcnNpb24gPT09ICdmdW5jdGlvbicpe1xyXG4gICAgICAgIHZlcnNpb24gPSB0aGlzLmdldEFkZG9uVmVyc2lvbigpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBzd2l0Y2ggKGNvbmZsaWN0VHlwZSkge1xyXG4gICAgICAgIGNhc2UgQXV0b01vZGVDb25mbGljdFR5cGUuVkVSU0lPTl9VTktOT1dOOlxyXG4gICAgICAgICAgbG9nZ2VyLndhcm4oZ2V0QXV0b01vZGVNZXNzYWdlKGNvbmZsaWN0VHlwZSwgYWRkb25OYW1lLCB2ZXJzaW9uLCBtaW5FeHBlY3RlZFZlcnNpb24pKTtcclxuICAgICAgICAgIHJldHVybiBvcmlnaW5hbE1ldGhvZC5hcHBseSh0aGlzLCBhcmdzKTtcclxuICAgICAgICBjYXNlIEF1dG9Nb2RlQ29uZmxpY3RUeXBlLlZFUlNJT05fTUlTTUFUQ0g6XHJcbiAgICAgICAgICBpZiAodmVyc2lvbiA9PT0gXCJhdXRvXCIpIHtcclxuICAgICAgICAgICAgbG9nZ2VyLndhcm4oZ2V0QXV0b01vZGVNZXNzYWdlKEF1dG9Nb2RlQ29uZmxpY3RUeXBlLlZFUlNJT05fVU5LTk9XTiwgYWRkb25OYW1lLCB2ZXJzaW9uLCBtaW5FeHBlY3RlZFZlcnNpb24pKTtcclxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgaWYgKGNvbXBhcmVBZGRvbkVrc1ZlcnNpb25zKHZlcnNpb24sIG1pbkV4cGVjdGVkVmVyc2lvbiEpID49IDApIHtcclxuICAgICAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIGNhc2UgQXV0b01vZGVDb25mbGljdFR5cGUuTk9UX1NVUFBPUlRFRDpcclxuICAgICAgICBjYXNlIEF1dG9Nb2RlQ29uZmxpY3RUeXBlLkFMUkVBRFlfSU5TVEFMTEVEOlxyXG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBEZXBsb3lpbmcgJHtzdGFja30gZmFpbGVkLiAke2dldEF1dG9Nb2RlTWVzc2FnZShjb25mbGljdFR5cGUsIGFkZG9uTmFtZSwgdmVyc2lvbiwgbWluRXhwZWN0ZWRWZXJzaW9uKX1gKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XHJcbiAgfTtcclxufVxyXG5cclxuZXhwb3J0IGZ1bmN0aW9uIG11c3RSdW5PbkF1dG9Nb2RlKCkge1xyXG4gIHJldHVybiBmdW5jdGlvbih0YXJnZXQ6IG9iamVjdCwga2V5OiBzdHJpbmcgfCBzeW1ib2wsIGRlc2NyaXB0b3I6IFByb3BlcnR5RGVzY3JpcHRvcikge1xyXG4gICAgY29uc3Qgb3JpZ2luYWxNZXRob2QgPSBkZXNjcmlwdG9yLnZhbHVlO1xyXG5cclxuICAgIGRlc2NyaXB0b3IudmFsdWUgPSBmdW5jdGlvbih0aGlzOiBhbnksIC4uLmFyZ3M6IGFueVtdKSB7XHJcbiAgICAgIGNvbnN0IGNsdXN0ZXJJbmZvOiBDbHVzdGVySW5mbyA9IGFyZ3NbMF07XHJcbiAgICAgIGNvbnN0IHN0YWNrID0gY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjay5zdGFja05hbWU7XHJcbiAgICAgIGNvbnN0IGFkZG9uTmFtZSA9IHRoaXMuY29uc3RydWN0b3IubmFtZTtcclxuICAgICAgaWYgKGNsdXN0ZXJJbmZvLmF1dG9Nb2RlKSB7XHJcbiAgICAgICAgcmV0dXJuIG9yaWdpbmFsTWV0aG9kLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihgRGVwbG95aW5nICR7c3RhY2t9IGZhaWxlZC4gQWRkLW9uICR7YWRkb25OYW1lfSBjYW4gb25seSBiZSBydW4gb24gRUtTIEF1dG8gTW9kZSBjbHVzdGVycy5gKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuXHJcbiAgICAgICAgcmV0dXJuIGRlc2NyaXB0b3I7XHJcblxyXG4gIH07XHJcblxyXG5cclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrcyBpZiB0aGUgcGFzc2VkIGFkZG9uIGlzIHBhcnQgb2YgYXV0byBtb2RlIGFuZCBkZXBsb3llZCBieSB0aGUgRUtTIENQLiBcclxuICogQHBhcmFtIGFkZE9uIGFkZE9uIG5hbWUgdG8gY2hlY2tcclxuICogQHJldHVybnMgdHJ1ZSBpZiBpdCBpcyBvbmUgb2YgdGhlIGFkZE9ucyB0aGF0IGlzIG1hbmFnZWQgYnkgdGhlIEVLUyBpbiBBdXRvIE1vZGVcclxuICovXHJcbmZ1bmN0aW9uIGlzQXV0b01vZGVBZGRvbihhZGRPbjogc3RyaW5nKSA6IGJvb2xlYW4ge1xyXG4gIGNvbnN0IGF1dG9tb2RlQWRkb25zID0gW1xyXG4gICAgXCJFYnNDc2lEcml2ZXJBZGRPblwiLFxyXG4gICAgXCJBd3NMb2FkQmFsYW5jZXJDb250cm9sbGVyQWRkT25cIixcclxuICAgIFwiVnBjQ25pQWRkT25cIixcclxuICAgIFwiQ29yZURuc0FkZE9uXCIsXHJcbiAgICBcIkt1YmVQcm94eUFkZE9uXCIsXHJcbiAgXTtcclxuICByZXR1cm4gYXV0b21vZGVBZGRvbnMuaW5jbHVkZXMoYWRkT24pO1xyXG59XHJcblxyXG4iXX0=