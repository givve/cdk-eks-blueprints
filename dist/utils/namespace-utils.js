"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNamespace = createNamespace;
const aws_eks_1 = require("aws-cdk-lib/aws-eks");
/**
  * Creates namespace
  * (a prerequisite for serviceaccount and helm chart execution for many add-ons).
  * @param name
  * @param cluster
  * @param overwrite
  * @param prune
  * @returns KubernetesManifest
  */
function createNamespace(name, cluster, overwrite, prune, annotations, labels) {
    if (name === "kube-system") {
        return cluster.clusterSecurityGroup; // a construct that is populated for the cluster l
    }
    return new aws_eks_1.KubernetesManifest(cluster.stack, `${name}-namespace-struct`, {
        cluster: cluster,
        manifest: [{
                apiVersion: 'v1',
                kind: 'Namespace',
                metadata: {
                    name: name,
                    annotations,
                    labels
                }
            }],
        overwrite: overwrite ?? true,
        prune: prune ?? true
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmFtZXNwYWNlLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3V0aWxzL25hbWVzcGFjZS11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQWFBLDBDQWtCQztBQS9CRCxpREFBeUQ7QUFJekQ7Ozs7Ozs7O0lBUUk7QUFDSixTQUFnQixlQUFlLENBQUMsSUFBWSxFQUFFLE9BQXFCLEVBQUUsU0FBbUIsRUFBRSxLQUFlLEVBQUUsV0FBb0IsRUFBRSxNQUFnQjtJQUM3SSxJQUFHLElBQUksS0FBSyxhQUFhLEVBQUUsQ0FBQztRQUN4QixPQUFPLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDLGtEQUFrRDtJQUMzRixDQUFDO0lBQ0QsT0FBTyxJQUFJLDRCQUFrQixDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsR0FBRyxJQUFJLG1CQUFtQixFQUFFO1FBQ3JFLE9BQU8sRUFBRSxPQUFPO1FBQ2hCLFFBQVEsRUFBRSxDQUFDO2dCQUNQLFVBQVUsRUFBRSxJQUFJO2dCQUNoQixJQUFJLEVBQUUsV0FBVztnQkFDakIsUUFBUSxFQUFFO29CQUNOLElBQUksRUFBRSxJQUFJO29CQUNWLFdBQVc7b0JBQ1gsTUFBTTtpQkFDVDthQUNKLENBQUM7UUFDRixTQUFTLEVBQUUsU0FBUyxJQUFJLElBQUk7UUFDNUIsS0FBSyxFQUFFLEtBQUssSUFBSSxJQUFJO0tBQ3ZCLENBQUMsQ0FBQztBQUNQLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBLdWJlcm5ldGVzTWFuaWZlc3QgfSBmcm9tIFwiYXdzLWNkay1saWIvYXdzLWVrc1wiO1xyXG5pbXBvcnQgKiBhcyBla3MgZnJvbSBcImF3cy1jZGstbGliL2F3cy1la3NcIjtcclxuaW1wb3J0IHsgVmFsdWVzIH0gZnJvbSBcIi4uL3NwaVwiO1xyXG5cclxuLyoqXHJcbiAgKiBDcmVhdGVzIG5hbWVzcGFjZVxyXG4gICogKGEgcHJlcmVxdWlzaXRlIGZvciBzZXJ2aWNlYWNjb3VudCBhbmQgaGVsbSBjaGFydCBleGVjdXRpb24gZm9yIG1hbnkgYWRkLW9ucykuXHJcbiAgKiBAcGFyYW0gbmFtZVxyXG4gICogQHBhcmFtIGNsdXN0ZXJcclxuICAqIEBwYXJhbSBvdmVyd3JpdGVcclxuICAqIEBwYXJhbSBwcnVuZSBcclxuICAqIEByZXR1cm5zIEt1YmVybmV0ZXNNYW5pZmVzdFxyXG4gICovXHJcbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVOYW1lc3BhY2UobmFtZTogc3RyaW5nLCBjbHVzdGVyOiBla3MuSUNsdXN0ZXIsIG92ZXJ3cml0ZT86IGJvb2xlYW4sIHBydW5lPzogYm9vbGVhbiwgYW5ub3RhdGlvbnM/OiBWYWx1ZXMsIGxhYmVscz8gOiBWYWx1ZXMpIHtcclxuICAgIGlmKG5hbWUgPT09IFwia3ViZS1zeXN0ZW1cIikge1xyXG4gICAgICAgIHJldHVybiBjbHVzdGVyLmNsdXN0ZXJTZWN1cml0eUdyb3VwOyAvLyBhIGNvbnN0cnVjdCB0aGF0IGlzIHBvcHVsYXRlZCBmb3IgdGhlIGNsdXN0ZXIgbFxyXG4gICAgfVxyXG4gICAgcmV0dXJuIG5ldyBLdWJlcm5ldGVzTWFuaWZlc3QoY2x1c3Rlci5zdGFjaywgYCR7bmFtZX0tbmFtZXNwYWNlLXN0cnVjdGAsIHtcclxuICAgICAgICBjbHVzdGVyOiBjbHVzdGVyLFxyXG4gICAgICAgIG1hbmlmZXN0OiBbe1xyXG4gICAgICAgICAgICBhcGlWZXJzaW9uOiAndjEnLFxyXG4gICAgICAgICAgICBraW5kOiAnTmFtZXNwYWNlJyxcclxuICAgICAgICAgICAgbWV0YWRhdGE6IHtcclxuICAgICAgICAgICAgICAgIG5hbWU6IG5hbWUsXHJcbiAgICAgICAgICAgICAgICBhbm5vdGF0aW9ucyxcclxuICAgICAgICAgICAgICAgIGxhYmVsc1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgb3ZlcndyaXRlOiBvdmVyd3JpdGUgPz8gdHJ1ZSxcclxuICAgICAgICBwcnVuZTogcHJ1bmUgPz8gdHJ1ZVxyXG4gICAgfSk7XHJcbn0iXX0=