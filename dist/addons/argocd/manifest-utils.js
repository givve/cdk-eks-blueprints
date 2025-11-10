"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSecretRef = createSecretRef;
exports.createSshSecretRef = createSshSecretRef;
exports.createUserNameSecretRef = createUserNameSecretRef;
const __1 = require("..");
/**
 * Creates CsiSecretProps that contains secret template for ssh/username/pwd credentials.
 * In each case, the secret is expected to be a JSON structure containing url and either sshPrivateKey
 * or username and password attributes.
 * @param credentialsType SSH | USERNAME | TOKEN
 * @param secretName
 * @returns
 */
function createSecretRef(credentialsType, secretName) {
    switch (credentialsType) {
        case "SSH":
            return createSshSecretRef(secretName);
        case "USERNAME":
        case "TOKEN":
            return createUserNameSecretRef(secretName);
        default:
            throw new Error(`credentials type ${credentialsType} is not supported by ArgoCD add-on.`);
    }
}
/**
 * Local function to create a secret reference for SSH key.
 * @param url
 * @param secretName
 * @returns
 */
function createSshSecretRef(secretName) {
    return {
        secretProvider: new __1.LookupSecretsManagerSecretByName(secretName),
        jmesPath: [{ path: "url", objectAlias: "url" }, { path: "sshPrivateKey", objectAlias: "sshPrivateKey" }],
        kubernetesSecret: {
            secretName: secretName,
            labels: { "argocd.argoproj.io/secret-type": "repo-creds" },
            data: [
                { key: "url", objectName: "url" },
                { key: "sshPrivateKey", objectName: "sshPrivateKey" }
            ]
        }
    };
}
/**
 * Local function to a secret reference for username/pwd or username/token key.
 * @param url
 * @param secretName
 * @returns
 */
function createUserNameSecretRef(secretName) {
    return {
        secretProvider: new __1.LookupSecretsManagerSecretByName(secretName),
        jmesPath: [{ path: "url", objectAlias: "url" }, { path: "username", objectAlias: "username" }, { path: "password", objectAlias: "password" }],
        kubernetesSecret: {
            secretName: secretName,
            labels: { "argocd.argoproj.io/secret-type": "repo-creds" },
            data: [
                { key: "url", objectName: "url" },
                { key: "username", objectName: "username" },
                { key: "password", objectName: "password" }
            ]
        }
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFuaWZlc3QtdXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9saWIvYWRkb25zL2FyZ29jZC9tYW5pZmVzdC11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQVVBLDBDQVVDO0FBUUQsZ0RBYUM7QUFRRCwwREFjQztBQS9ERCwwQkFBc0U7QUFFdEU7Ozs7Ozs7R0FPRztBQUNILFNBQWdCLGVBQWUsQ0FBQyxlQUF1QixFQUFFLFVBQWtCO0lBQ3ZFLFFBQVEsZUFBZSxFQUFFLENBQUM7UUFDdEIsS0FBSyxLQUFLO1lBQ04sT0FBTyxrQkFBa0IsQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQyxLQUFLLFVBQVUsQ0FBQztRQUNoQixLQUFLLE9BQU87WUFDUixPQUFPLHVCQUF1QixDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQy9DO1lBQ0ksTUFBTSxJQUFJLEtBQUssQ0FBQyxvQkFBb0IsZUFBZSxxQ0FBcUMsQ0FBQyxDQUFDO0lBQ2xHLENBQUM7QUFDTCxDQUFDO0FBRUQ7Ozs7O0dBS0c7QUFDSCxTQUFnQixrQkFBa0IsQ0FBQyxVQUFrQjtJQUNqRCxPQUFPO1FBQ0gsY0FBYyxFQUFFLElBQUksb0NBQWdDLENBQUMsVUFBVSxDQUFDO1FBQ2hFLFFBQVEsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsZUFBZSxFQUFFLFdBQVcsRUFBRSxlQUFlLEVBQUUsQ0FBQztRQUN4RyxnQkFBZ0IsRUFBRTtZQUNkLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLE1BQU0sRUFBRSxFQUFFLGdDQUFnQyxFQUFFLFlBQVksRUFBRTtZQUMxRCxJQUFJLEVBQUU7Z0JBQ0YsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7Z0JBQ2pDLEVBQUUsR0FBRyxFQUFFLGVBQWUsRUFBRSxVQUFVLEVBQUUsZUFBZSxFQUFFO2FBQ3hEO1NBQ0o7S0FDSixDQUFDO0FBQ04sQ0FBQztBQUVEOzs7OztHQUtHO0FBQ0gsU0FBZ0IsdUJBQXVCLENBQUMsVUFBa0I7SUFDdEQsT0FBTztRQUNILGNBQWMsRUFBRSxJQUFJLG9DQUFnQyxDQUFDLFVBQVUsQ0FBQztRQUNoRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsV0FBVyxFQUFFLEtBQUssRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxXQUFXLEVBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxJQUFJLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxVQUFVLEVBQUUsQ0FBQztRQUM3SSxnQkFBZ0IsRUFBRTtZQUNkLFVBQVUsRUFBRSxVQUFVO1lBQ3RCLE1BQU0sRUFBRSxFQUFDLGdDQUFnQyxFQUFFLFlBQVksRUFBQztZQUN4RCxJQUFJLEVBQUU7Z0JBQ0YsRUFBRSxHQUFHLEVBQUUsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLEVBQUU7Z0JBQ2pDLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFO2dCQUMzQyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsVUFBVSxFQUFFLFVBQVUsRUFBRTthQUM5QztTQUNKO0tBQ0osQ0FBQztBQUNOLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDc2lTZWNyZXRQcm9wcywgTG9va3VwU2VjcmV0c01hbmFnZXJTZWNyZXRCeU5hbWUgfSBmcm9tIFwiLi5cIjtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIENzaVNlY3JldFByb3BzIHRoYXQgY29udGFpbnMgc2VjcmV0IHRlbXBsYXRlIGZvciBzc2gvdXNlcm5hbWUvcHdkIGNyZWRlbnRpYWxzLlxyXG4gKiBJbiBlYWNoIGNhc2UsIHRoZSBzZWNyZXQgaXMgZXhwZWN0ZWQgdG8gYmUgYSBKU09OIHN0cnVjdHVyZSBjb250YWluaW5nIHVybCBhbmQgZWl0aGVyIHNzaFByaXZhdGVLZXlcclxuICogb3IgdXNlcm5hbWUgYW5kIHBhc3N3b3JkIGF0dHJpYnV0ZXMuXHJcbiAqIEBwYXJhbSBjcmVkZW50aWFsc1R5cGUgU1NIIHwgVVNFUk5BTUUgfCBUT0tFTlxyXG4gKiBAcGFyYW0gc2VjcmV0TmFtZSBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlU2VjcmV0UmVmKGNyZWRlbnRpYWxzVHlwZTogc3RyaW5nLCBzZWNyZXROYW1lOiBzdHJpbmcpOiBDc2lTZWNyZXRQcm9wcyB7XHJcbiAgICBzd2l0Y2ggKGNyZWRlbnRpYWxzVHlwZSkge1xyXG4gICAgICAgIGNhc2UgXCJTU0hcIjpcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVNzaFNlY3JldFJlZihzZWNyZXROYW1lKTtcclxuICAgICAgICBjYXNlIFwiVVNFUk5BTUVcIjpcclxuICAgICAgICBjYXNlIFwiVE9LRU5cIjpcclxuICAgICAgICAgICAgcmV0dXJuIGNyZWF0ZVVzZXJOYW1lU2VjcmV0UmVmKHNlY3JldE5hbWUpO1xyXG4gICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgY3JlZGVudGlhbHMgdHlwZSAke2NyZWRlbnRpYWxzVHlwZX0gaXMgbm90IHN1cHBvcnRlZCBieSBBcmdvQ0QgYWRkLW9uLmApO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogTG9jYWwgZnVuY3Rpb24gdG8gY3JlYXRlIGEgc2VjcmV0IHJlZmVyZW5jZSBmb3IgU1NIIGtleS5cclxuICogQHBhcmFtIHVybCBcclxuICogQHBhcmFtIHNlY3JldE5hbWUgXHJcbiAqIEByZXR1cm5zIFxyXG4gKi9cclxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVNzaFNlY3JldFJlZihzZWNyZXROYW1lOiBzdHJpbmcpOiBDc2lTZWNyZXRQcm9wcyB7XHJcbiAgICByZXR1cm4ge1xyXG4gICAgICAgIHNlY3JldFByb3ZpZGVyOiBuZXcgTG9va3VwU2VjcmV0c01hbmFnZXJTZWNyZXRCeU5hbWUoc2VjcmV0TmFtZSksXHJcbiAgICAgICAgam1lc1BhdGg6IFt7IHBhdGg6IFwidXJsXCIsIG9iamVjdEFsaWFzOiBcInVybFwiIH0sIHsgcGF0aDogXCJzc2hQcml2YXRlS2V5XCIsIG9iamVjdEFsaWFzOiBcInNzaFByaXZhdGVLZXlcIiB9XSxcclxuICAgICAgICBrdWJlcm5ldGVzU2VjcmV0OiB7XHJcbiAgICAgICAgICAgIHNlY3JldE5hbWU6IHNlY3JldE5hbWUsXHJcbiAgICAgICAgICAgIGxhYmVsczogeyBcImFyZ29jZC5hcmdvcHJvai5pby9zZWNyZXQtdHlwZVwiOiBcInJlcG8tY3JlZHNcIiB9LFxyXG4gICAgICAgICAgICBkYXRhOiBbXHJcbiAgICAgICAgICAgICAgICB7IGtleTogXCJ1cmxcIiwgb2JqZWN0TmFtZTogXCJ1cmxcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBrZXk6IFwic3NoUHJpdmF0ZUtleVwiLCBvYmplY3ROYW1lOiBcInNzaFByaXZhdGVLZXlcIiB9XHJcbiAgICAgICAgICAgIF1cclxuICAgICAgICB9XHJcbiAgICB9O1xyXG59XHJcblxyXG4vKipcclxuICogTG9jYWwgZnVuY3Rpb24gdG8gYSBzZWNyZXQgcmVmZXJlbmNlIGZvciB1c2VybmFtZS9wd2Qgb3IgdXNlcm5hbWUvdG9rZW4ga2V5LlxyXG4gKiBAcGFyYW0gdXJsIFxyXG4gKiBAcGFyYW0gc2VjcmV0TmFtZSBcclxuICogQHJldHVybnMgXHJcbiAqL1xyXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlVXNlck5hbWVTZWNyZXRSZWYoc2VjcmV0TmFtZTogc3RyaW5nKTogQ3NpU2VjcmV0UHJvcHMge1xyXG4gICAgcmV0dXJuIHtcclxuICAgICAgICBzZWNyZXRQcm92aWRlcjogbmV3IExvb2t1cFNlY3JldHNNYW5hZ2VyU2VjcmV0QnlOYW1lKHNlY3JldE5hbWUpLFxyXG4gICAgICAgIGptZXNQYXRoOiBbeyBwYXRoOiBcInVybFwiLCBvYmplY3RBbGlhczogXCJ1cmxcIiB9LCB7IHBhdGg6IFwidXNlcm5hbWVcIiwgb2JqZWN0QWxpYXM6IFwidXNlcm5hbWVcIiB9LCB7IHBhdGg6IFwicGFzc3dvcmRcIiwgb2JqZWN0QWxpYXM6IFwicGFzc3dvcmRcIiB9XSxcclxuICAgICAgICBrdWJlcm5ldGVzU2VjcmV0OiB7XHJcbiAgICAgICAgICAgIHNlY3JldE5hbWU6IHNlY3JldE5hbWUsXHJcbiAgICAgICAgICAgIGxhYmVsczoge1wiYXJnb2NkLmFyZ29wcm9qLmlvL3NlY3JldC10eXBlXCI6IFwicmVwby1jcmVkc1wifSxcclxuICAgICAgICAgICAgZGF0YTogW1xyXG4gICAgICAgICAgICAgICAgeyBrZXk6IFwidXJsXCIsIG9iamVjdE5hbWU6IFwidXJsXCIgfSxcclxuICAgICAgICAgICAgICAgIHsga2V5OiBcInVzZXJuYW1lXCIsIG9iamVjdE5hbWU6IFwidXNlcm5hbWVcIiB9LFxyXG4gICAgICAgICAgICAgICAgeyBrZXk6IFwicGFzc3dvcmRcIiwgb2JqZWN0TmFtZTogXCJwYXNzd29yZFwiIH1cclxuICAgICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgIH07XHJcbn1cclxuIl19