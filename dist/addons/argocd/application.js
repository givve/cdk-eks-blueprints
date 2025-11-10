"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArgoApplication = void 0;
const dot = require("dot-object");
const utils_1 = require("../../utils");
/**
 * Argo Application is a utility class that can generate an ArgoCD application
 * from generic GitOps application properties.
 */
class ArgoApplication {
    bootstrapRepo;
    constructor(bootstrapRepo) {
        this.bootstrapRepo = bootstrapRepo;
    }
    generate(deployment, syncOrder) {
        const normalizedValues = this.normalizeValues(deployment.values);
        const flatValues = dot.dot(normalizedValues);
        const nameValues = [];
        for (let key in flatValues) {
            // Avoid passing the undefined values
            if (flatValues[key] !== undefined) {
                // Avoid passing the empty objects, e.g. {}
                if (Object.getPrototypeOf(flatValues[key]) !== Object.prototype) {
                    nameValues.push({ name: key, value: `${flatValues[key]}` });
                }
                else if (Object.getPrototypeOf(flatValues[key]) === Object.prototype && Object.keys(flatValues[key]).length != 0) {
                    nameValues.push({ name: key, value: `${flatValues[key]}` });
                }
            }
        }
        const repository = deployment.repository ?? this.generateDefaultRepo(deployment.name);
        return {
            apiVersion: "argoproj.io/v1alpha1",
            kind: "Application",
            metadata: {
                name: deployment.name,
                namespace: 'argocd',
                annotations: {
                    "argocd.argoproj.io/sync-wave": syncOrder == undefined ? "-1" : `${syncOrder}`
                }
            },
            spec: {
                destination: {
                    namespace: deployment.namespace,
                    server: "https://kubernetes.default.svc"
                },
                project: "default", //TODO: make project configurable
                source: {
                    helm: {
                        valueFiles: ["values.yaml"],
                        parameters: nameValues,
                    },
                    path: repository.path,
                    repoURL: repository.repoUrl,
                    targetRevision: repository.targetRevision ?? 'HEAD'
                },
                syncPolicy: {
                    automated: {
                        prune: true,
                        selfHeal: true,
                        allowEmpty: true,
                    }
                }
            }
        };
    }
    /**
     * Creates an opinionated path.
     * @param name
     * @returns
     */
    generateDefaultRepo(name) {
        if (this.bootstrapRepo) {
            return {
                name: this.bootstrapRepo.name,
                repoUrl: this.bootstrapRepo.repoUrl,
                path: this.bootstrapRepo.path + `/${name}`,
                targetRevision: this.bootstrapRepo.targetRevision
            };
        }
        throw new Error("With GitOps configuration management enabled either specify GitOps repository for each add-on or provide a bootstrap application to the ArgoCD add-on.");
    }
    /**
     * Iterate an argo Values object to normalize the string format before sending to argocd.
     * For example, escaping the dot from certain keys: "ingress.annotations.kubernetes\\.io/tls-acme"
     * @param values
     * @returns
     */
    normalizeValues(obj) {
        Object.keys(obj).forEach(key => {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                obj[key] = this.normalizeValues(obj[key]);
            }
            const escapedKey = (0, utils_1.escapeDots)(key);
            if (escapedKey != key) {
                obj[escapedKey] = obj[key];
                delete obj[key];
            }
        });
        return obj;
    }
}
exports.ArgoApplication = ArgoApplication;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwbGljYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2FyZ29jZC9hcHBsaWNhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxrQ0FBa0M7QUFFbEMsdUNBQXlDO0FBRXpDOzs7R0FHRztBQUNILE1BQWEsZUFBZTtJQUVLO0lBQTdCLFlBQTZCLGFBQWlEO1FBQWpELGtCQUFhLEdBQWIsYUFBYSxDQUFvQztJQUFJLENBQUM7SUFFNUUsUUFBUSxDQUFDLFVBQXVDLEVBQUUsU0FBa0I7UUFFdkUsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUVqRSxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsR0FBRyxDQUFDLGdCQUFnQixDQUFDLENBQUM7UUFFN0MsTUFBTSxVQUFVLEdBQUcsRUFBRSxDQUFDO1FBRXRCLEtBQUssSUFBSSxHQUFHLElBQUksVUFBVSxFQUFFLENBQUM7WUFDekIscUNBQXFDO1lBQ3JDLElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLFNBQVMsRUFBRSxDQUFDO2dCQUNoQywyQ0FBMkM7Z0JBQzNDLElBQUksTUFBTSxDQUFDLGNBQWMsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxNQUFNLENBQUMsU0FBUyxFQUFFLENBQUM7b0JBQzlELFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLEtBQUssRUFBRSxHQUFHLFVBQVUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDaEUsQ0FBQztxQkFBTSxJQUFJLE1BQU0sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssTUFBTSxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLE1BQU0s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QUFDO0lBQ2YsQ0FBQztDQUNKO0FBbEdELDBDQWtHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGRvdCBmcm9tICdkb3Qtb2JqZWN0JztcclxuaW1wb3J0IHsgR2l0T3BzQXBwbGljYXRpb25EZXBsb3ltZW50LCBHaXRSZXBvc2l0b3J5UmVmZXJlbmNlLCBWYWx1ZXMgfSBmcm9tICcuLi8uLi9zcGknO1xyXG5pbXBvcnQgeyBlc2NhcGVEb3RzIH0gZnJvbSAnLi4vLi4vdXRpbHMnO1xyXG5cclxuLyoqXHJcbiAqIEFyZ28gQXBwbGljYXRpb24gaXMgYSB1dGlsaXR5IGNsYXNzIHRoYXQgY2FuIGdlbmVyYXRlIGFuIEFyZ29DRCBhcHBsaWNhdGlvblxyXG4gKiBmcm9tIGdlbmVyaWMgR2l0T3BzIGFwcGxpY2F0aW9uIHByb3BlcnRpZXMuXHJcbiAqL1xyXG5leHBvcnQgY2xhc3MgQXJnb0FwcGxpY2F0aW9uIHtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIHJlYWRvbmx5IGJvb3RzdHJhcFJlcG86IEdpdFJlcG9zaXRvcnlSZWZlcmVuY2UgfCB1bmRlZmluZWQpIHsgfVxyXG5cclxuICAgIHB1YmxpYyBnZW5lcmF0ZShkZXBsb3ltZW50OiBHaXRPcHNBcHBsaWNhdGlvbkRlcGxveW1lbnQsIHN5bmNPcmRlcj86IG51bWJlcikge1xyXG5cclxuICAgICAgICBjb25zdCBub3JtYWxpemVkVmFsdWVzID0gdGhpcy5ub3JtYWxpemVWYWx1ZXMoZGVwbG95bWVudC52YWx1ZXMpO1xyXG5cclxuICAgICAgICBjb25zdCBmbGF0VmFsdWVzID0gZG90LmRvdChub3JtYWxpemVkVmFsdWVzKTtcclxuXHJcbiAgICAgICAgY29uc3QgbmFtZVZhbHVlcyA9IFtdO1xyXG5cclxuICAgICAgICBmb3IgKGxldCBrZXkgaW4gZmxhdFZhbHVlcykge1xyXG4gICAgICAgICAgICAvLyBBdm9pZCBwYXNzaW5nIHRoZSB1bmRlZmluZWQgdmFsdWVzXHJcbiAgICAgICAgICAgIGlmIChmbGF0VmFsdWVzW2tleV0gIT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgLy8gQXZvaWQgcGFzc2luZyB0aGUgZW1wdHkgb2JqZWN0cywgZS5nLiB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihmbGF0VmFsdWVzW2tleV0pICE9PSBPYmplY3QucHJvdG90eXBlKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgbmFtZVZhbHVlcy5wdXNoKHsgbmFtZToga2V5LCB2YWx1ZTogYCR7ZmxhdFZhbHVlc1trZXldfWAgfSk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKE9iamVjdC5nZXRQcm90b3R5cGVPZihmbGF0VmFsdWVzW2tleV0pID09PSBPYmplY3QucHJvdG90eXBlICYmIE9iamVjdC5rZXlzKGZsYXRWYWx1ZXNba2V5XSkubGVuZ3RoICE9IDApIHtcclxuICAgICAgICAgICAgICAgICAgICBuYW1lVmFsdWVzLnB1c2goeyBuYW1lOiBrZXksIHZhbHVlOiBgJHtmbGF0VmFsdWVzW2tleV19YCB9KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBjb25zdCByZXBvc2l0b3J5ID0gZGVwbG95bWVudC5yZXBvc2l0b3J5ID8/IHRoaXMuZ2VuZXJhdGVEZWZhdWx0UmVwbyhkZXBsb3ltZW50Lm5hbWUpO1xyXG4gICAgICAgIHJldHVybiB7XHJcbiAgICAgICAgICAgIGFwaVZlcnNpb246IFwiYXJnb3Byb2ouaW8vdjFhbHBoYTFcIixcclxuICAgICAgICAgICAga2luZDogXCJBcHBsaWNhdGlvblwiLFxyXG4gICAgICAgICAgICBtZXRhZGF0YToge1xyXG4gICAgICAgICAgICAgICAgbmFtZTogZGVwbG95bWVudC5uYW1lLFxyXG4gICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnYXJnb2NkJyxcclxuICAgICAgICAgICAgICAgIGFubm90YXRpb25zOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgXCJhcmdvY2QuYXJnb3Byb2ouaW8vc3luYy13YXZlXCI6IHN5bmNPcmRlciA9PSB1bmRlZmluZWQgPyBcIi0xXCIgOiBgJHtzeW5jT3JkZXJ9YFxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICBzcGVjOiB7XHJcbiAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbjoge1xyXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZTogZGVwbG95bWVudC5uYW1lc3BhY2UsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VydmVyOiBcImh0dHBzOi8va3ViZXJuZXRlcy5kZWZhdWx0LnN2Y1wiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgcHJvamVjdDogXCJkZWZhdWx0XCIsIC8vVE9ETzogbWFrZSBwcm9qZWN0IGNvbmZpZ3VyYWJsZVxyXG4gICAgICAgICAgICAgICAgc291cmNlOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgaGVsbToge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YWx1ZUZpbGVzOiBbXCJ2YWx1ZXMueWFtbFwiXSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyczogbmFtZVZhbHVlcyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHBhdGg6IHJlcG9zaXRvcnkucGF0aCxcclxuICAgICAgICAgICAgICAgICAgICByZXBvVVJMOiByZXBvc2l0b3J5LnJlcG9VcmwsXHJcbiAgICAgICAgICAgICAgICAgICAgdGFyZ2V0UmV2aXNpb246IHJlcG9zaXRvcnkudGFyZ2V0UmV2aXNpb24gPz8gJ0hFQUQnXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgc3luY1BvbGljeToge1xyXG4gICAgICAgICAgICAgICAgICAgIGF1dG9tYXRlZDoge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBwcnVuZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZkhlYWw6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGFsbG93RW1wdHk6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZXMgYW4gb3BpbmlvbmF0ZWQgcGF0aC5cclxuICAgICAqIEBwYXJhbSBuYW1lXHJcbiAgICAgKiBAcmV0dXJuc1xyXG4gICAgICovXHJcbiAgICBnZW5lcmF0ZURlZmF1bHRSZXBvKG5hbWU6IHN0cmluZyk6IEdpdFJlcG9zaXRvcnlSZWZlcmVuY2Uge1xyXG4gICAgICAgIGlmICh0aGlzLmJvb3RzdHJhcFJlcG8pIHtcclxuICAgICAgICAgICAgcmV0dXJuIHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IHRoaXMuYm9vdHN0cmFwUmVwby5uYW1lLFxyXG4gICAgICAgICAgICAgICAgcmVwb1VybDogdGhpcy5ib290c3RyYXBSZXBvLnJlcG9VcmwsXHJcbiAgICAgICAgICAgICAgICBwYXRoOiB0aGlzLmJvb3RzdHJhcFJlcG8ucGF0aCArIGAvJHtuYW1lfWAsXHJcbiAgICAgICAgICAgICAgICB0YXJnZXRSZXZpc2lvbjogdGhpcy5ib290c3RyYXBSZXBvLnRhcmdldFJldmlzaW9uXHJcbiAgICAgICAgICAgIH07XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIldpdGggR2l0T3BzIGNvbmZpZ3VyYXRpb24gbWFuYWdlbWVudCBlbmFibGVkIGVpdGhlciBzcGVjaWZ5IEdpdE9wcyByZXBvc2l0b3J5IGZvciBlYWNoIGFkZC1vbiBvciBwcm92aWRlIGEgYm9vdHN0cmFwIGFwcGxpY2F0aW9uIHRvIHRoZSBBcmdvQ0QgYWRkLW9uLlwiKTtcclxuICAgIH1cclxuXHJcbiAgICAvKipcclxuICAgICAqIEl0ZXJhdGUgYW4gYXJnbyBWYWx1ZXMgb2JqZWN0IHRvIG5vcm1hbGl6ZSB0aGUgc3RyaW5nIGZvcm1hdCBiZWZvcmUgc2VuZGluZyB0byBhcmdvY2QuXHJcbiAgICAgKiBGb3IgZXhhbXBsZSwgZXNjYXBpbmcgdGhlIGRvdCBmcm9tIGNlcnRhaW4ga2V5czogXCJpbmdyZXNzLmFubm90YXRpb25zLmt1YmVybmV0ZXNcXFxcLmlvL3Rscy1hY21lXCJcclxuICAgICAqIEBwYXJhbSB2YWx1ZXNcclxuICAgICAqIEByZXR1cm5zXHJcbiAgICAgKi9cclxuICAgIG5vcm1hbGl6ZVZhbHVlcyhvYmo6IFZhbHVlcyk6IFZhbHVlcyB7XHJcbiAgICAgICAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGtleSA9PiB7XHJcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygb2JqW2tleV0gPT09ICdvYmplY3QnICYmIG9ialtrZXldICE9PSBudWxsKSB7XHJcbiAgICAgICAgICAgICAgICBvYmpba2V5XSA9IHRoaXMubm9ybWFsaXplVmFsdWVzKG9ialtrZXldKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgY29uc3QgZXNjYXBlZEtleSA9IGVzY2FwZURvdHMoa2V5KTtcclxuICAgICAgICAgICAgaWYgKGVzY2FwZWRLZXkgIT0ga2V5KSB7XHJcbiAgICAgICAgICAgICAgICBvYmpbZXNjYXBlZEtleV0gPSBvYmpba2V5XTtcclxuICAgICAgICAgICAgICAgIGRlbGV0ZSBvYmpba2V5XTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICByZXR1cm4gb2JqO1xyXG4gICAgfVxyXG59XHJcbiJdfQ==