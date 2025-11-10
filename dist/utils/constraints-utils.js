"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InternetHostStringConstraint = exports.CompositeConstraint = exports.GenericRegexStringConstraint = exports.ArrayConstraint = exports.NumberConstraint = exports.UrlStringConstraint = exports.StringConstraint = void 0;
exports.validateConstraints = validateConstraints;
const zod_1 = require("zod");
/**
 * This validates if the given string (value) is within the bounds of min to max inclusive. If not a detailed Zod Error is thrown also utilizing the identifier for context.
 */
class StringConstraint {
    min;
    max;
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    validate(key, value, identifier) {
        if (value != undefined)
            zod_1.z.string()
                .min(this.min ?? 0, { message: `${key} (${identifier}: ${value}) must be no less than ${this.min} characters long.` })
                .max(this.max ?? 63, { message: `${key} (${identifier}: ${value}) must be no more than ${this.max} characters long.` })
                .parse(value);
    }
}
exports.StringConstraint = StringConstraint;
/**
 * This is the same as StringConstraint, but also checks if the given string is a correctly formatted URL. If not a detailed Zod Error is thrown also utilizing the identifier for context.
 */
class UrlStringConstraint {
    min;
    max;
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    validate(key, value, identifier) {
        if (value != undefined) {
            zod_1.z.string().url({ message: `${key} (${identifier}: ${value}) must be a URL formatted correctly.` }).parse(value);
            zod_1.z.string()
                .min(this.min ?? 0, { message: `${key} (${identifier}: ${value}) must be a URL no less than ${this.min} characters long.` })
                .max(this.max ?? 100, { message: `${key} (${identifier}: ${value}) must be a URL no more than ${this.max} characters long.` })
                .parse(value);
        }
    }
}
exports.UrlStringConstraint = UrlStringConstraint;
/**
 * This class checks if the given number (value) is within the bounds of the given min and max inclusive number bounds. If not a detailed Zod Error is thrown also utilizing the identifier for context.
 */
class NumberConstraint {
    min;
    max;
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    validate(key, value, identifier) {
        if (value != undefined)
            zod_1.z.number()
                .gte(this.min ?? 1, { message: `${key} (${identifier}: ${value}) must be no less than ${this.min} nodes.` })
                .lte(this.max ?? 3, { message: `${key} (${identifier}: ${value}) must be no more than ${this.max} nodes.` })
                .parse(value);
    }
}
exports.NumberConstraint = NumberConstraint;
/**
 * This works just like NumberConstraint but checks the length of the given value for an expected array. If not a detailed Zod Error is thrown also utilizing the identifier for context.
 */
class ArrayConstraint {
    min;
    max;
    constructor(min, max) {
        this.min = min;
        this.max = max;
    }
    validate(key, value, identifier) {
        if (value != undefined)
            zod_1.z.number()
                .gte(this.min ?? 1, { message: `${key} (${identifier} of length: ${value.length}) must be no less than ${this.min} node groups.` })
                .lte(this.max ?? 3, { message: `${key} (${identifier} of length: ${value.length}) must be no more than ${this.max} node groups.` })
                .parse(value.length);
    }
}
exports.ArrayConstraint = ArrayConstraint;
/**
 * Checks whether a given string matches the regex.  If not, a detailed Zod Error is thrown.
 */
class GenericRegexStringConstraint {
    regex;
    constructor(regex) {
        this.regex = regex;
    }
    validate(key, value, identifier) {
        if (value != undefined)
            zod_1.z.string()
                .regex(this.regex ?? new RegExp('.*'), { message: `${key} (${identifier}) must match regular expression ${this.regex}.` })
                .parse(value);
    }
}
exports.GenericRegexStringConstraint = GenericRegexStringConstraint;
/**
 * Contains a list of constraints and checks whether a given value meets each constraint.  If not, a detailed Zod Error is thrown for that constraint.
 */
class CompositeConstraint {
    constraints;
    constructor(...constraints) {
        this.constraints = constraints;
    }
    validate(key, value, identifier) {
        this.constraints.forEach(constraint => {
            constraint.validate(key, value, identifier);
        });
    }
}
exports.CompositeConstraint = CompositeConstraint;
/**
 * Checks whether a given string matches the regex for RFC 1123.  If not, a detailed Zod Error is thrown.
 */
class InternetHostStringConstraint extends CompositeConstraint {
    constructor() {
        super(new GenericRegexStringConstraint(new RegExp('^(?![0-9]+$)(?!.*-$)(?!-)[a-zA-Z0-9-]*$')), new StringConstraint(1, 63));
    }
}
exports.InternetHostStringConstraint = InternetHostStringConstraint;
/**
 * This function validates the given object by the given constraints, and returns an error that uses the given context if needed.
 * @param constraints This is the keys of the object with specified values for validation.
 * @param context Object type name for error context purposes.
 * @param object The given object type, an array of or only a single object, to be validated.
 * @returns throws a Zod Error if validations are broken.
 */
function validateConstraints(constraints, context, ...object) {
    if (object != undefined)
        for (let i = 0; i < object.length; i++) {
            for (let k in constraints) {
                const constraint = constraints[k];
                constraint.validate(context + "." + k, object[i][k], k);
            }
        }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29uc3RyYWludHMtdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvdXRpbHMvY29uc3RyYWludHMtdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBMElBLGtEQVNDO0FBbkpELDZCQUF3QjtBQVN4Qjs7R0FFRztBQUNILE1BQWEsZ0JBQWdCO0lBRUo7SUFBdUI7SUFBNUMsWUFBcUIsR0FBWSxFQUFXLEdBQVk7UUFBbkMsUUFBRyxHQUFILEdBQUcsQ0FBUztRQUFXLFFBQUcsR0FBSCxHQUFHLENBQVM7SUFBSSxDQUFDO0lBRTdELFFBQVEsQ0FBQyxHQUFXLEVBQUUsS0FBVSxFQUFFLFVBQWtCO1FBRWhELElBQUksS0FBSyxJQUFJLFNBQVM7WUFDbEIsT0FBQyxDQUFDLE1BQU0sRUFBRTtpQkFDTCxHQUFHLENBQUMsSUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxPQUFPLEVBQUUsR0FBRyxHQUFHLEtBQUssVUFBVSxLQUFLLEtBQUssMEJBQTBCLElBQUksQ0FBQyxHQUFHLG1CQUFtQixFQUFFLENBQUM7aUJBQ3JILEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxJQUFJLEVBQUUsRUFBRSxFQUFFLE9BQU8sRUFBRSxHQUFHLEdBQUcsS0FBSyxVQUFVLEtBQUssS0FBSywwQkFBMEIsSUFBSSxDQUFDLEdBQUcsbUJBQW1CLEVBQUUsQ0FBQztpQkFDdEgsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQzFCLENBQUM7Q0FDSjtBQVpELDRDQVlDO0FBRUQ7O0dBRUc7QUFDSCxNQUFhLG1CQUFtQjtJQUVQO0lBQXVCO0lBQTVDLFlBQXFCLEdBQVksRUFBVyxHQUFZO1FBQW5DLFFBQUcsR0FBSCxHQUFHLENBQVM7UUFBVyxRQUFHLEdBQUgsR0FBRyxDQUFTO0lBQUksQ0FBQztJQUU3RCxRQUFRLENBQUMsR0FBVyxFQUFFLEtBQVUsRUFBRSxVQUFrQjtRQUVoRCxJQUFJLEtBQUssSUFBSSxTQUFTLEVB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QUM7Z0JBQ3hCLE1BQU0sVUFBVSxHQUFlLFdBQVcsQ0FBQyxDQUFDLENBQUUsQ0FBQztnQkFDL0MsVUFBVSxDQUFDLFFBQVEsQ0FBQyxPQUFPLEdBQUcsR0FBRyxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7WUFDNUQsQ0FBQztRQUNMLENBQUM7QUFDVCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgeiB9IGZyb20gXCJ6b2RcIjtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIGludGVyZmFjZSBmb3IgdGhlIGNvbnN0cmFpbnRzIG5lZWRlZCB0byB0ZXN0IGFza2luZyBmb3IgdGhlIGtleSBuYW1lIG9mIHRoZSBvYmplY3QsIHRoZSB2YWx1ZSBiZWluZyB0ZXN0ZWQsIGFuZCBjb250ZXh0IGZvciBkZXRhaWxlZCBab2QgZXJyb3JzLlxyXG4gKi9cclxuZXhwb3J0IGludGVyZmFjZSBDb25zdHJhaW50IHtcclxuICAgIHZhbGlkYXRlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBpZGVudGlmaWVyOiBzdHJpbmcpOiBhbnk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIHZhbGlkYXRlcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nICh2YWx1ZSkgaXMgd2l0aGluIHRoZSBib3VuZHMgb2YgbWluIHRvIG1heCBpbmNsdXNpdmUuIElmIG5vdCBhIGRldGFpbGVkIFpvZCBFcnJvciBpcyB0aHJvd24gYWxzbyB1dGlsaXppbmcgdGhlIGlkZW50aWZpZXIgZm9yIGNvbnRleHQuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgU3RyaW5nQ29uc3RyYWludCBpbXBsZW1lbnRzIENvbnN0cmFpbnQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJlYWRvbmx5IG1pbj86IG51bWJlciwgcmVhZG9ubHkgbWF4PzogbnVtYmVyKSB7IH1cclxuXHJcbiAgICB2YWxpZGF0ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgaWRlbnRpZmllcjogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHouc3RyaW5nKClcclxuICAgICAgICAgICAgICAgIC5taW4odGhpcy5taW4gPz8gMCwgeyBtZXNzYWdlOiBgJHtrZXl9ICgke2lkZW50aWZpZXJ9OiAke3ZhbHVlfSkgbXVzdCBiZSBubyBsZXNzIHRoYW4gJHt0aGlzLm1pbn0gY2hhcmFjdGVycyBsb25nLmAgfSlcclxuICAgICAgICAgICAgICAgIC5tYXgodGhpcy5tYXggPz8gNjMsIHsgbWVzc2FnZTogYCR7a2V5fSAoJHtpZGVudGlmaWVyfTogJHt2YWx1ZX0pIG11c3QgYmUgbm8gbW9yZSB0aGFuICR7dGhpcy5tYXh9IGNoYXJhY3RlcnMgbG9uZy5gIH0pXHJcbiAgICAgICAgICAgICAgICAucGFyc2UodmFsdWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB0aGUgc2FtZSBhcyBTdHJpbmdDb25zdHJhaW50LCBidXQgYWxzbyBjaGVja3MgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBhIGNvcnJlY3RseSBmb3JtYXR0ZWQgVVJMLiBJZiBub3QgYSBkZXRhaWxlZCBab2QgRXJyb3IgaXMgdGhyb3duIGFsc28gdXRpbGl6aW5nIHRoZSBpZGVudGlmaWVyIGZvciBjb250ZXh0LlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIFVybFN0cmluZ0NvbnN0cmFpbnQgaW1wbGVtZW50cyBTdHJpbmdDb25zdHJhaW50IHtcclxuXHJcbiAgICBjb25zdHJ1Y3RvcihyZWFkb25seSBtaW4/OiBudW1iZXIsIHJlYWRvbmx5IG1heD86IG51bWJlcikgeyB9XHJcblxyXG4gICAgdmFsaWRhdGUoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIGlkZW50aWZpZXI6IHN0cmluZykge1xyXG5cclxuICAgICAgICBpZiAodmFsdWUgIT0gdW5kZWZpbmVkKSB7XHJcblxyXG4gICAgICAgICAgICB6LnN0cmluZygpLnVybCh7IG1lc3NhZ2U6IGAke2tleX0gKCR7aWRlbnRpZmllcn06ICR7dmFsdWV9KSBtdXN0IGJlIGEgVVJMIGZvcm1hdHRlZCBjb3JyZWN0bHkuYCB9KS5wYXJzZSh2YWx1ZSk7XHJcblxyXG4gICAgICAgICAgICB6LnN0cmluZygpXHJcbiAgICAgICAgICAgICAgICAubWluKHRoaXMubWluID8/IDAsIHsgbWVzc2FnZTogYCR7a2V5fSAoJHtpZGVudGlmaWVyfTogJHt2YWx1ZX0pIG11c3QgYmUgYSBVUkwgbm8gbGVzcyB0aGFuICR7dGhpcy5taW59IGNoYXJhY3RlcnMgbG9uZy5gIH0pXHJcbiAgICAgICAgICAgICAgICAubWF4KHRoaXMubWF4ID8/IDEwMCwgeyBtZXNzYWdlOiBgJHtrZXl9ICgke2lkZW50aWZpZXJ9OiAke3ZhbHVlfSkgbXVzdCBiZSBhIFVSTCBubyBtb3JlIHRoYW4gJHt0aGlzLm1heH0gY2hhcmFjdGVycyBsb25nLmAgfSlcclxuICAgICAgICAgICAgICAgIC5wYXJzZSh2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBjbGFzcyBjaGVja3MgaWYgdGhlIGdpdmVuIG51bWJlciAodmFsdWUpIGlzIHdpdGhpbiB0aGUgYm91bmRzIG9mIHRoZSBnaXZlbiBtaW4gYW5kIG1heCBpbmNsdXNpdmUgbnVtYmVyIGJvdW5kcy4gSWYgbm90IGEgZGV0YWlsZWQgWm9kIEVycm9yIGlzIHRocm93biBhbHNvIHV0aWxpemluZyB0aGUgaWRlbnRpZmllciBmb3IgY29udGV4dC5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBOdW1iZXJDb25zdHJhaW50IGltcGxlbWVudHMgQ29uc3RyYWludCB7XHJcblxyXG4gICAgY29uc3RydWN0b3IocmVhZG9ubHkgbWluPzogbnVtYmVyLCByZWFkb25seSBtYXg/OiBudW1iZXIpIHsgfVxyXG5cclxuICAgIHZhbGlkYXRlKGtleTogc3RyaW5nLCB2YWx1ZTogYW55LCBpZGVudGlmaWVyOiBzdHJpbmcpIHtcclxuXHJcbiAgICAgICAgaWYgKHZhbHVlICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgei5udW1iZXIoKVxyXG4gICAgICAgICAgICAgICAgLmd0ZSh0aGlzLm1pbiA/PyAxLCB7IG1lc3NhZ2U6IGAke2tleX0gKCR7aWRlbnRpZmllcn06ICR7dmFsdWV9KSBtdXN0IGJlIG5vIGxlc3MgdGhhbiAke3RoaXMubWlufSBub2Rlcy5gIH0pXHJcbiAgICAgICAgICAgICAgICAubHRlKHRoaXMubWF4ID8/IDMsIHsgbWVzc2FnZTogYCR7a2V5fSAoJHtpZGVudGlmaWVyfTogJHt2YWx1ZX0pIG11c3QgYmUgbm8gbW9yZSB0aGFuICR7dGhpcy5tYXh9IG5vZGVzLmAgfSlcclxuICAgICAgICAgICAgICAgIC5wYXJzZSh2YWx1ZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIHdvcmtzIGp1c3QgbGlrZSBOdW1iZXJDb25zdHJhaW50IGJ1dCBjaGVja3MgdGhlIGxlbmd0aCBvZiB0aGUgZ2l2ZW4gdmFsdWUgZm9yIGFuIGV4cGVjdGVkIGFycmF5LiBJZiBub3QgYSBkZXRhaWxlZCBab2QgRXJyb3IgaXMgdGhyb3duIGFsc28gdXRpbGl6aW5nIHRoZSBpZGVudGlmaWVyIGZvciBjb250ZXh0LlxyXG4gKi9cclxuZXhwb3J0IGNsYXNzIEFycmF5Q29uc3RyYWludCBpbXBsZW1lbnRzIENvbnN0cmFpbnQge1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHJlYWRvbmx5IG1pbj86IG51bWJlciwgcmVhZG9ubHkgbWF4PzogbnVtYmVyKSB7IH1cclxuXHJcbiAgICB2YWxpZGF0ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgaWRlbnRpZmllcjogc3RyaW5nKSB7XHJcblxyXG4gICAgICAgIGlmICh2YWx1ZSAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgICAgIHoubnVtYmVyKClcclxuICAgICAgICAgICAgICAgIC5ndGUodGhpcy5taW4gPz8gMSwgeyBtZXNzYWdlOiBgJHtrZXl9ICgke2lkZW50aWZpZXJ9IG9mIGxlbmd0aDogJHt2YWx1ZS5sZW5ndGh9KSBtdXN0IGJlIG5vIGxlc3MgdGhhbiAke3RoaXMubWlufSBub2RlIGdyb3Vwcy5gIH0pXHJcbiAgICAgICAgICAgICAgICAubHRlKHRoaXMubWF4ID8/IDMsIHsgbWVzc2FnZTogYCR7a2V5fSAoJHtpZGVudGlmaWVyfSBvZiBsZW5ndGg6ICR7dmFsdWUubGVuZ3RofSkgbXVzdCBiZSBubyBtb3JlIHRoYW4gJHt0aGlzLm1heH0gbm9kZSBncm91cHMuYCB9KVxyXG4gICAgICAgICAgICAgICAgLnBhcnNlKHZhbHVlLmxlbmd0aCk7XHJcbiAgICB9XHJcbn1cclxuLyoqXHJcbiAqIENoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gc3RyaW5nIG1hdGNoZXMgdGhlIHJlZ2V4LiAgSWYgbm90LCBhIGRldGFpbGVkIFpvZCBFcnJvciBpcyB0aHJvd24uXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgR2VuZXJpY1JlZ2V4U3RyaW5nQ29uc3RyYWludCBpbXBsZW1lbnRzIENvbnN0cmFpbnQge1xyXG4gICAgY29uc3RydWN0b3IgKHJlYWRvbmx5IHJlZ2V4PzogUmVnRXhwKSB7IH1cclxuXHJcbiAgICB2YWxpZGF0ZShrZXk6IHN0cmluZywgdmFsdWU6IGFueSwgaWRlbnRpZmllcjogc3RyaW5nKSB7XHJcbiAgICAgICAgXHJcbiAgICAgICAgaWYgKHZhbHVlICE9IHVuZGVmaW5lZClcclxuICAgICAgICAgICAgei5zdHJpbmcoKVxyXG4gICAgICAgICAgICAgICAgLnJlZ2V4KHRoaXMucmVnZXggPz8gbmV3IFJlZ0V4cCgnLionKSwgeyBtZXNzYWdlOiBgJHtrZXl9ICgke2lkZW50aWZpZXJ9KSBtdXN0IG1hdGNoIHJlZ3VsYXIgZXhwcmVzc2lvbiAke3RoaXMucmVnZXh9LmB9KVxyXG4gICAgICAgICAgICAgICAgLnBhcnNlKHZhbHVlKTtcclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDb250YWlucyBhIGxpc3Qgb2YgY29uc3RyYWludHMgYW5kIGNoZWNrcyB3aGV0aGVyIGEgZ2l2ZW4gdmFsdWUgbWVldHMgZWFjaCBjb25zdHJhaW50LiAgSWYgbm90LCBhIGRldGFpbGVkIFpvZCBFcnJvciBpcyB0aHJvd24gZm9yIHRoYXQgY29uc3RyYWludC5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBDb21wb3NpdGVDb25zdHJhaW50IGltcGxlbWVudHMgQ29uc3RyYWludCB7XHJcbiAgICByZWFkb25seSBjb25zdHJhaW50czogQXJyYXk8Q29uc3RyYWludD47XHJcbiAgICBjb25zdHJ1Y3RvciAoLi4uY29uc3RyYWludHM6IEFycmF5PENvbnN0cmFpbnQ+KSB7IFxyXG4gICAgICAgIHRoaXMuY29uc3RyYWludHMgPSBjb25zdHJhaW50cztcclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFsaWRhdGUoa2V5OiBzdHJpbmcsIHZhbHVlOiBhbnksIGlkZW50aWZpZXI6IHN0cmluZykge1xyXG4gICAgICAgIHRoaXMuY29uc3RyYWludHMuZm9yRWFjaChjb25zdHJhaW50ID0+IHtcclxuICAgICAgICAgICAgY29uc3RyYWludC52YWxpZGF0ZShrZXksIHZhbHVlLCBpZGVudGlmaWVyKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVja3Mgd2hldGhlciBhIGdpdmVuIHN0cmluZyBtYXRjaGVzIHRoZSByZWdleCBmb3IgUkZDIDExMjMuICBJZiBub3QsIGEgZGV0YWlsZWQgWm9kIEVycm9yIGlzIHRocm93bi5cclxuICovXHJcbmV4cG9ydCBjbGFzcyBJbnRlcm5ldEhvc3RTdHJpbmdDb25zdHJhaW50IGV4dGVuZHMgQ29tcG9zaXRlQ29uc3RyYWludCB7XHJcbiAgICBjb25zdHJ1Y3RvciAoKSB7IFxyXG4gICAgICAgIHN1cGVyKFxyXG4gICAgICAgICAgICBuZXcgR2VuZXJpY1JlZ2V4U3RyaW5nQ29uc3RyYWludChuZXcgUmVnRXhwKCdeKD8hWzAtOV0rJCkoPyEuKi0kKSg/IS0pW2EtekEtWjAtOS1dKiQnKSksIFxyXG4gICAgICAgICAgICBuZXcgU3RyaW5nQ29uc3RyYWludCgxLDYzKSxcclxuICAgICAgICApOyBcclxuICAgIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSB0eXBlIHRoYXQgZGVyaXZlcyBmcm9tIGEgZ2VuZXJpYyBpbnB1dCBzdHJ1Y3R1cmUsIHJldGFpbmluZyB0aGUga2V5cy4gRW5hYmxlcyB0byBkZWZpbmUgbWFwcGluZyBiZXR3ZWVuIHRoZSBpbnB1dCBzdHJ1Y3R1cmUga2V5cyBhbmQgY29uc3RyYWludHMuXHJcbiAqL1xyXG5leHBvcnQgdHlwZSBDb25zdHJhaW50c1R5cGU8VD4gPSBQYXJ0aWFsPFJlY29yZDxrZXlvZiBULCBDb25zdHJhaW50Pj47XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiB2YWxpZGF0ZXMgdGhlIGdpdmVuIG9iamVjdCBieSB0aGUgZ2l2ZW4gY29uc3RyYWludHMsIGFuZCByZXR1cm5zIGFuIGVycm9yIHRoYXQgdXNlcyB0aGUgZ2l2ZW4gY29udGV4dCBpZiBuZWVkZWQuXHJcbiAqIEBwYXJhbSBjb25zdHJhaW50cyBUaGlzIGlzIHRoZSBrZXlzIG9mIHRoZSBvYmplY3Qgd2l0aCBzcGVjaWZpZWQgdmFsdWVzIGZvciB2YWxpZGF0aW9uLlxyXG4gKiBAcGFyYW0gY29udGV4dCBPYmplY3QgdHlwZSBuYW1lIGZvciBlcnJvciBjb250ZXh0IHB1cnBvc2VzLlxyXG4gKiBAcGFyYW0gb2JqZWN0IFRoZSBnaXZlbiBvYmplY3QgdHlwZSwgYW4gYXJyYXkgb2Ygb3Igb25seSBhIHNpbmdsZSBvYmplY3QsIHRvIGJlIHZhbGlkYXRlZC5cclxuICogQHJldHVybnMgdGhyb3dzIGEgWm9kIEVycm9yIGlmIHZhbGlkYXRpb25zIGFyZSBicm9rZW4uXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gdmFsaWRhdGVDb25zdHJhaW50czxUPihjb25zdHJhaW50czogQ29uc3RyYWludHNUeXBlPFQ+LCBjb250ZXh0OiBzdHJpbmcsIC4uLm9iamVjdDogYW55KSB7XHJcblxyXG4gICAgaWYgKG9iamVjdCAhPSB1bmRlZmluZWQpXHJcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBvYmplY3QubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgZm9yIChsZXQgayBpbiBjb25zdHJhaW50cykge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgY29uc3RyYWludDogQ29uc3RyYWludCA9IGNvbnN0cmFpbnRzW2tdITtcclxuICAgICAgICAgICAgICAgIGNvbnN0cmFpbnQudmFsaWRhdGUoY29udGV4dCArIFwiLlwiICsgaywgb2JqZWN0W2ldW2tdLCBrKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxufVxyXG4iXX0=