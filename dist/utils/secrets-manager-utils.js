"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecretValue = getSecretValue;
exports.validateSecret = validateSecret;
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
/**
 * Gets secret value from AWS Secret Manager. Requires access rights to the secret, specified by the secretName parameter.
 * @param secretName name of the secret to retrieve
 * @param region
 * @returns
*/
async function getSecretValue(secretName, region) {
    const secretManager = new client_secrets_manager_1.SecretsManager({ region });
    let secretString = "";
    try {
        let response = await secretManager.getSecretValue({ SecretId: secretName });
        if (response) {
            if (response.SecretString) {
                secretString = response.SecretString;
            }
            else if (response.SecretBinary) {
                throw new Error(`Invalid secret format for ${secretName}. Expected string value, received binary.`);
            }
        }
        return secretString;
    }
    catch (error) {
        console.log(`error getting secret ${secretName}: ` + error);
        throw error;
    }
}
/**
 * Throws an error if secret is undefined in the target region.
 * @returns ARN of the secret if exists.
 */
async function validateSecret(secretName, region) {
    const secretManager = new client_secrets_manager_1.SecretsManager({ region });
    try {
        const response = await secretManager.describeSecret({ SecretId: secretName });
        return response.ARN;
    }
    catch (error) {
        console.log(`Secret ${secretName} is not defined: ` + error);
        throw error;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic2VjcmV0cy1tYW5hZ2VyLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3V0aWxzL3NlY3JldHMtbWFuYWdlci11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU9DLHdDQWtCQTtBQU1ELHdDQVVDO0FBekNELDRFQUFpRTtBQUNqRTs7Ozs7RUFLRTtBQUNNLEtBQUssVUFBVSxjQUFjLENBQUMsVUFBa0IsRUFBRSxNQUFjO0lBQ3BFLE1BQU0sYUFBYSxHQUFHLElBQUksdUNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDckQsSUFBSSxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3RCLElBQUksQ0FBQztRQUNELElBQUksUUFBUSxHQUFHLE1BQU0sYUFBYSxDQUFDLGNBQWMsQ0FBQyxFQUFFLFFBQVEsRUFBRSxVQUFVLEVBQUUsQ0FBQyxDQUFDO1FBQzVFLElBQUksUUFBUSxFQUFFLENBQUM7WUFDWCxJQUFJLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDeEIsWUFBWSxHQUFHLFFBQVEsQ0FBQyxZQUFZLENBQUM7WUFDekMsQ0FBQztpQkFBTSxJQUFJLFFBQVEsQ0FBQyxZQUFZLEVBQUUsQ0FBQztnQkFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyw2QkFBNkIsVUFBVSwyQ0FBMkMsQ0FBQyxDQUFDO1lBQ3hHLENBQUM7UUFDTCxDQUFDO1FBQ0QsT0FBTyxZQUFZLENBQUM7SUFDeEIsQ0FBQztJQUNELE9BQU8sS0FBSyxFQUFFLENBQUM7UUFDWCxPQUFPLENBQUMsR0FBRyxDQUFDLHdCQUF3QixVQUFVLElBQUksR0FBSSxLQUFLLENBQUMsQ0FBQztRQUM3RCxNQUFNLEtBQUssQ0FBQztJQUNoQixDQUFDO0FBQ0wsQ0FBQztBQUVEOzs7R0FHRztBQUNJLEtBQUssVUFBVSxjQUFjLENBQUMsVUFBa0IsRUFBRSxNQUFjO0lBQ25FLE1BQU0sYUFBYSxHQUFHLElBQUksdUNBQWMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxDQUFDLENBQUM7SUFDckQsSUFBSSxDQUFDO1FBQ0QsTUFBTSxRQUFRLEdBQUcsTUFBTSxhQUFhLENBQUMsY0FBYyxDQUFDLEVBQUUsUUFBUSxFQUFFLFVBQVUsRUFBRSxDQUFDLENBQUM7UUFDOUUsT0FBTyxRQUFRLENBQUMsR0FBSSxDQUFDO0lBQ3pCLENBQUM7SUFDRCxPQUFPLEtBQUssRUFBRSxDQUFDO1FBQ1gsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFVLFVBQVUsbUJBQW1CLEdBQUksS0FBSyxDQUFDLENBQUM7UUFDOUQsTUFBTSxLQUFLLENBQUM7SUFDaEIsQ0FBQztBQUNMLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBTZWNyZXRzTWFuYWdlciB9IGZyb20gXCJAYXdzLXNkay9jbGllbnQtc2VjcmV0cy1tYW5hZ2VyXCI7XHJcbi8qKlxyXG4gKiBHZXRzIHNlY3JldCB2YWx1ZSBmcm9tIEFXUyBTZWNyZXQgTWFuYWdlci4gUmVxdWlyZXMgYWNjZXNzIHJpZ2h0cyB0byB0aGUgc2VjcmV0LCBzcGVjaWZpZWQgYnkgdGhlIHNlY3JldE5hbWUgcGFyYW1ldGVyLlxyXG4gKiBAcGFyYW0gc2VjcmV0TmFtZSBuYW1lIG9mIHRoZSBzZWNyZXQgdG8gcmV0cmlldmVcclxuICogQHBhcmFtIHJlZ2lvbiBcclxuICogQHJldHVybnMgXHJcbiovXHJcbiBleHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U2VjcmV0VmFsdWUoc2VjcmV0TmFtZTogc3RyaW5nLCByZWdpb246IHN0cmluZyk6IFByb21pc2U8c3RyaW5nPiB7XHJcbiAgICBjb25zdCBzZWNyZXRNYW5hZ2VyID0gbmV3IFNlY3JldHNNYW5hZ2VyKHsgcmVnaW9uIH0pO1xyXG4gICAgbGV0IHNlY3JldFN0cmluZyA9IFwiXCI7XHJcbiAgICB0cnkge1xyXG4gICAgICAgIGxldCByZXNwb25zZSA9IGF3YWl0IHNlY3JldE1hbmFnZXIuZ2V0U2VjcmV0VmFsdWUoeyBTZWNyZXRJZDogc2VjcmV0TmFtZSB9KTtcclxuICAgICAgICBpZiAocmVzcG9uc2UpIHtcclxuICAgICAgICAgICAgaWYgKHJlc3BvbnNlLlNlY3JldFN0cmluZykge1xyXG4gICAgICAgICAgICAgICAgc2VjcmV0U3RyaW5nID0gcmVzcG9uc2UuU2VjcmV0U3RyaW5nO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLlNlY3JldEJpbmFyeSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBJbnZhbGlkIHNlY3JldCBmb3JtYXQgZm9yICR7c2VjcmV0TmFtZX0uIEV4cGVjdGVkIHN0cmluZyB2YWx1ZSwgcmVjZWl2ZWQgYmluYXJ5LmApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBzZWNyZXRTdHJpbmc7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgZXJyb3IgZ2V0dGluZyBzZWNyZXQgJHtzZWNyZXROYW1lfTogYCAgKyBlcnJvcik7XHJcbiAgICAgICAgdGhyb3cgZXJyb3I7XHJcbiAgICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaHJvd3MgYW4gZXJyb3IgaWYgc2VjcmV0IGlzIHVuZGVmaW5lZCBpbiB0aGUgdGFyZ2V0IHJlZ2lvbi5cclxuICogQHJldHVybnMgQVJOIG9mIHRoZSBzZWNyZXQgaWYgZXhpc3RzLlxyXG4gKi9cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHZhbGlkYXRlU2VjcmV0KHNlY3JldE5hbWU6IHN0cmluZywgcmVnaW9uOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZz4ge1xyXG4gICAgY29uc3Qgc2VjcmV0TWFuYWdlciA9IG5ldyBTZWNyZXRzTWFuYWdlcih7IHJlZ2lvbiB9KTtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBzZWNyZXRNYW5hZ2VyLmRlc2NyaWJlU2VjcmV0KHsgU2VjcmV0SWQ6IHNlY3JldE5hbWUgfSk7XHJcbiAgICAgICAgcmV0dXJuIHJlc3BvbnNlLkFSTiE7XHJcbiAgICB9XHJcbiAgICBjYXRjaCAoZXJyb3IpIHtcclxuICAgICAgICBjb25zb2xlLmxvZyhgU2VjcmV0ICR7c2VjcmV0TmFtZX0gaXMgbm90IGRlZmluZWQ6IGAgICsgZXJyb3IpO1xyXG4gICAgICAgIHRocm93IGVycm9yO1xyXG4gICAgfVxyXG59Il19