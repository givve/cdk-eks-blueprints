"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageTrackingAddOn = exports.UsageTrackingAddOnProps = void 0;
const utils_1 = require("../../utils");
const eksv2 = require("@aws-cdk/aws-eks-v2-alpha");
/**
 * Properties for UsageTracking
 */
class UsageTrackingAddOnProps {
    /**
     * tags to add to stack description
    */
    tags;
}
exports.UsageTrackingAddOnProps = UsageTrackingAddOnProps;
let UsageTrackingAddOn = class UsageTrackingAddOn {
    props;
    constructor(props) {
        this.props = props;
    }
    deploy(clusterInfo) {
        if (this.props.tags.length == 0) {
            return;
        }
        let stack;
        if (clusterInfo.clusterv2 instanceof eksv2.Cluster) {
            stack = clusterInfo.clusterv2.stack;
        }
        else {
            stack = clusterInfo.cluster.stack;
        }
        const tracking = new TaggedUsageTracking(stack.templateOptions.description || '');
        tracking.addTags(this.props.tags);
        stack.templateOptions.description = tracking.buildDescription();
    }
};
exports.UsageTrackingAddOn = UsageTrackingAddOn;
exports.UsageTrackingAddOn = UsageTrackingAddOn = __decorate([
    utils_1.supportsALL
], UsageTrackingAddOn);
class TaggedUsageTracking {
    static TAGS_REGEX = /\(tag: ([^)]+)\)$/;
    description;
    tags = [];
    constructor(description) {
        this.description = description;
        const tagsMatch = this.description.match(TaggedUsageTracking.TAGS_REGEX);
        if (tagsMatch) {
            const existingTagsString = tagsMatch[1].trim();
            this.tags = existingTagsString.split(',').map(tag => tag.trim());
        }
    }
    addTags(tags) {
        const newTags = Array.isArray(tags) ? tags : [tags];
        this.tags = [...new Set([...this.tags, ...newTags])];
    }
    buildDescription() {
        if (this.tags.length === 0) {
            return this.description.replace(TaggedUsageTracking.TAGS_REGEX, '').trim();
        }
        const tagsString = this.tags.join(', ');
        const tagsMatch = this.description.match(TaggedUsageTracking.TAGS_REGEX);
        let newDescription;
        // if tags section exists, replace, otherwise add new section
        if (tagsMatch) {
            newDescription = this.description.replace(TaggedUsageTracking.TAGS_REGEX, `(tag: ${tagsString})`);
        }
        else {
            newDescription = `${this.description} (tag: ${tagsString})`.trim();
        }
        const byteLength = Buffer.byteLength(newDescription, 'utf16le');
        // if length too long, print error and return to old description
        if (byteLength > 1024) {
            console.error('Stack description is too long. Please remove some tags.');
            return this.description;
        }
        else {
            return newDescription;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL3VzYWdlLXRyYWNraW5nL2luZGV4LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7OztBQUVBLHVDQUEwQztBQUMxQyxtREFBbUQ7QUFFbkQ7O0dBRUc7QUFDSCxNQUFhLHVCQUF1QjtJQUNsQzs7TUFFRTtJQUNPLElBQUksQ0FBVztDQUN6QjtBQUxELDBEQUtDO0FBR00sSUFBTSxrQkFBa0IsR0FBeEIsTUFBTSxrQkFBa0I7SUFFcEIsS0FBSyxDQUEwQjtJQUV4QyxZQUFZLEtBQThCO1FBQ3hDLElBQUksQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0lBQ3JCLENBQUM7SUFFRCxNQUFNLENBQUMsV0FBd0I7UUFFN0IsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFLENBQUM7WUFDaEMsT0FBTztRQUNULENBQUM7UUFDRCxJQUFJLEtBQUssQ0FBQztRQUVWLElBQUksV0FBVyxDQUFDLFNBQVMsWUFBWSxLQUFLLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDbkQsS0FBSyxHQUFHLFdBQVcsQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDO1FBQ3RDLENBQUM7YUFBTSxDQUFDO1lBQ04sS0FBSyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ3BDLENBQUM7UUFDRCxNQUFNLFFBQVEsR0FBRyxJQUFJLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxlQUFlLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ2xGLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUdsQyxLQUFLLENBQUMsZUFBZSxDQUFDLFdBQVcsR0FBRyxRQUFRLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQztJQUNsRSxDQUFDO0NBRUYsQ0FBQTtBQTNCWSxnREFBa0I7NkJBQWxCLGtCQUFrQjtJQUQ5QixtQkFBVztHQUNDLGtCQUFrQixDQTJCOUI7QUFFRCxNQUFNLG1CQUFtQjtJQUV2QixNQUFNLENBQUMsVUFBVSxHQUFHLG1CQUFtQixDQUFDO0lBRXhDLFdBQVcsQ0FBUztJQUVwQixJQUFJLEdBQWEsRUFBRSxDQUFDO0lBRXBCLFlBQVksV0FBbUI7UUFDN0IsSUFBSSxDQUFDLFdBQVcsR0FBRyxXQUFXLENBQUM7UUFDL0IsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDekUsSUFBSSxTQUFTLEVBQUUsQ0FBQztZQUNkLE1BQU0sa0JBQWtCLEdBQUcsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO1lBQy9DLElBQUksQ0FBQyxJQUFJLEdBQUcsa0JBQWtCLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO1FBQ25FLENBQUM7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLElBQXVCO1FBQzdCLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNwRCxJQUFJLENBQUMsSUFBSSxHQUFHLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUN2RCxDQUFDO0lBRUQsZ0JBQWdCO1FBQ2QsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUMzQixPQUFPLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUM3RSxDQUFDO1FBQ0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFFeEMsTUFBTSxTQUFTLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsVUFBVSxDQUFDLENBQUM7UUFFekUsSUFBSSxjQUFzQixDQUFDO1FBQzNCLDZEQUE2RDtRQUM3RCxJQUFJLFNBQVMsRUFBRSxDQUFDO1lBQ2QsY0FBYyxHQUFHLElBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLG1CQUFtQixDQUFDLFVBQVUsRUFBRSxTQUFTLFVBQVUsR0FBRyxDQUFDLENBQUM7UUFDcEcsQ0FBQzthQUFNLENBQUM7WUFDTixjQUFjLEdBQUcsR0FBRyxJQUFJLENBQUMsV0FBVyxVQUFVLFVBQVUsR0FBRyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQ3JFLENBQUM7UUFFRCxNQUFNLFVBQVUsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLGNBQWMsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNoRSxnRUFBZ0U7UUFDaEUsSUFBSSxVQUFVLEdBQUcsSUFBSSxFQUFFLENBQUM7WUFDdEIsT0FBTyxDQUFDLEtBQUssQ0FBQyx5REFBeUQsQ0FBQyxDQUFDO1lBQ3pFLE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUMxQixDQUFDO2FBQU0sQ0FBQztZQUNOLE9BQU8sY0FBYyxDQUFDO1FBQ3hCLENBQUM7SUFDSCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSBcImNvbnN0cnVjdHNcIjtcclxuaW1wb3J0IHsgQ2x1c3RlckFkZE9uLCBDbHVzdGVySW5mbyB9IGZyb20gXCIuLi8uLi9zcGlcIjtcclxuaW1wb3J0IHsgc3VwcG9ydHNBTEwgfSBmcm9tIFwiLi4vLi4vdXRpbHNcIjtcclxuaW1wb3J0ICogYXMgZWtzdjIgZnJvbSBcIkBhd3MtY2RrL2F3cy1la3MtdjItYWxwaGFcIjtcclxuXHJcbi8qKiBcclxuICogUHJvcGVydGllcyBmb3IgVXNhZ2VUcmFja2luZ1xyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFVzYWdlVHJhY2tpbmdBZGRPblByb3BzIHtcclxuICAvKipcclxuICAgKiB0YWdzIHRvIGFkZCB0byBzdGFjayBkZXNjcmlwdGlvblxyXG4gICovXHJcbiAgcmVhZG9ubHkgdGFnczogc3RyaW5nW107XHJcbn1cclxuXHJcbkBzdXBwb3J0c0FMTFxyXG5leHBvcnQgY2xhc3MgVXNhZ2VUcmFja2luZ0FkZE9uIGltcGxlbWVudHMgQ2x1c3RlckFkZE9uIHtcclxuXHJcbiAgcmVhZG9ubHkgcHJvcHM6IFVzYWdlVHJhY2tpbmdBZGRPblByb3BzO1xyXG5cclxuICBjb25zdHJ1Y3Rvcihwcm9wczogVXNhZ2VUcmFja2luZ0FkZE9uUHJvcHMpIHtcclxuICAgIHRoaXMucHJvcHMgPSBwcm9wcztcclxuICB9XHJcblxyXG4gIGRlcGxveShjbHVzdGVySW5mbzogQ2x1c3RlckluZm8pOiBQcm9taXNlPENvbnN0cnVjdD4gfCB2b2lkIHtcclxuXHJcbiAgICBpZiAodGhpcy5wcm9wcy50YWdzLmxlbmd0aCA9PSAwKSB7XHJcbiAgICAgIHJldHVybjtcclxuICAgIH1cclxuICAgIGxldCBzdGFjaztcclxuXHJcbiAgICBpZiAoY2x1c3RlckluZm8uY2x1c3RlcnYyIGluc3RhbmNlb2YgZWtzdjIuQ2x1c3Rlcikge1xyXG4gICAgICBzdGFjayA9IGNsdXN0ZXJJbmZvLmNsdXN0ZXJ2Mi5zdGFjaztcclxuICAgIH0gZWxzZSB7XHJcbiAgICAgIHN0YWNrID0gY2x1c3RlckluZm8uY2x1c3Rlci5zdGFjaztcclxuICAgIH1cclxuICAgIGNvbnN0IHRyYWNraW5nID0gbmV3IFRhZ2dlZFVzYWdlVHJhY2tpbmcoc3RhY2sudGVtcGxhdGVPcHRpb25zLmRlc2NyaXB0aW9uIHx8ICcnKTtcclxuICAgIHRyYWNraW5nLmFkZFRhZ3ModGhpcy5wcm9wcy50YWdzKTtcclxuXHJcbiAgICBcclxuICAgIHN0YWNrLnRlbXBsYXRlT3B0aW9ucy5kZXNjcmlwdGlvbiA9IHRyYWNraW5nLmJ1aWxkRGVzY3JpcHRpb24oKTtcclxuICB9XHJcblxyXG59XHJcblxyXG5jbGFzcyBUYWdnZWRVc2FnZVRyYWNraW5nIHtcclxuXHJcbiAgc3RhdGljIFRBR1NfUkVHRVggPSAvXFwodGFnOiAoW14pXSspXFwpJC87XHJcblxyXG4gIGRlc2NyaXB0aW9uOiBzdHJpbmc7XHJcblxyXG4gIHRhZ3M6IHN0cmluZ1tdID0gW107XHJcblxyXG4gIGNvbnN0cnVjdG9yKGRlc2NyaXB0aW9uOiBzdHJpbmcpIHtcclxuICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjcmlwdGlvbjtcclxuICAgIGNvbnN0IHRhZ3NNYXRjaCA9IHRoaXMuZGVzY3JpcHRpb24ubWF0Y2goVGFnZ2VkVXNhZ2VUcmFja2luZy5UQUdTX1JFR0VYKTtcclxuICAgIGlmICh0YWdzTWF0Y2gpIHtcclxuICAgICAgY29uc3QgZXhpc3RpbmdUYWdzU3RyaW5nID0gdGFnc01hdGNoWzFdLnRyaW0oKTtcclxuICAgICAgdGhpcy50YWdzID0gZXhpc3RpbmdUYWdzU3RyaW5nLnNwbGl0KCcsJykubWFwKHRhZyA9PiB0YWcudHJpbSgpKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGFkZFRhZ3ModGFnczogc3RyaW5nIHwgc3RyaW5nW10pIHtcclxuICAgIGNvbnN0IG5ld1RhZ3MgPSBBcnJheS5pc0FycmF5KHRhZ3MpID8gdGFncyA6IFt0YWdzXTtcclxuICAgIHRoaXMudGFncyA9IFsuLi5uZXcgU2V0KFsuLi50aGlzLnRhZ3MsIC4uLm5ld1RhZ3NdKV07XHJcbiAgfVxyXG5cclxuICBidWlsZERlc2NyaXB0aW9uKCk6IHN0cmluZyB7XHJcbiAgICBpZiAodGhpcy50YWdzLmxlbmd0aCA9PT0gMCkge1xyXG4gICAgICByZXR1cm4gdGhpcy5kZXNjcmlwdGlvbi5yZXBsYWNlKFRhZ2dlZFVzYWdlVHJhY2tpbmcuVEFHU19SRUdFWCwgJycpLnRyaW0oKTtcclxuICAgIH1cclxuICAgIGNvbnN0IHRhZ3NTdHJpbmcgPSB0aGlzLnRhZ3Muam9pbignLCAnKTtcclxuXHJcbiAgICBjb25zdCB0YWdzTWF0Y2ggPSB0aGlzLmRlc2NyaXB0aW9uLm1hdGNoKFRhZ2dlZFVzYWdlVHJhY2tpbmcuVEFHU19SRUdFWCk7XHJcblxyXG4gICAgbGV0IG5ld0Rlc2NyaXB0aW9uOiBzdHJpbmc7XHJcbiAgICAvLyBpZiB0YWdzIHNlY3Rpb24gZXhpc3RzLCByZXBsYWNlLCBvdGhlcndpc2UgYWRkIG5ldyBzZWN0aW9uXHJcbiAgICBpZiAodGFnc01hdGNoKSB7XHJcbiAgICAgIG5ld0Rlc2NyaXB0aW9uID0gdGhpcy5kZXNjcmlwdGlvbi5yZXBsYWNlKFRhZ2dlZFVzYWdlVHJhY2tpbmcuVEFHU19SRUdFWCwgYCh0YWc6ICR7dGFnc1N0cmluZ30pYCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBuZXdEZXNjcmlwdGlvbiA9IGAke3RoaXMuZGVzY3JpcHRpb259ICh0YWc6ICR7dGFnc1N0cmluZ30pYC50cmltKCk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgYnl0ZUxlbmd0aCA9IEJ1ZmZlci5ieXRlTGVuZ3RoKG5ld0Rlc2NyaXB0aW9uLCAndXRmMTZsZScpO1xyXG4gICAgLy8gaWYgbGVuZ3RoIHRvbyBsb25nLCBwcmludCBlcnJvciBhbmQgcmV0dXJuIHRvIG9sZCBkZXNjcmlwdGlvblxyXG4gICAgaWYgKGJ5dGVMZW5ndGggPiAxMDI0KSB7XHJcbiAgICAgIGNvbnNvbGUuZXJyb3IoJ1N0YWNrIGRlc2NyaXB0aW9uIGlzIHRvbyBsb25nLiBQbGVhc2UgcmVtb3ZlIHNvbWUgdGFncy4nKTtcclxuICAgICAgcmV0dXJuIHRoaXMuZGVzY3JpcHRpb247XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4gbmV3RGVzY3JpcHRpb247XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBcclxuXHJcblxyXG59XHJcbiJdfQ==