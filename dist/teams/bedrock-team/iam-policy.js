"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBedrockPolicyDocument = getBedrockPolicyDocument;
function getBedrockPolicyDocument() {
    const result = [
        {
            "Effect": "Allow",
            "Action": [
                "bedrock:*",
            ],
            "Resource": "*"
        }
    ];
    return result;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaWFtLXBvbGljeS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL2xpYi90ZWFtcy9iZWRyb2NrLXRlYW0vaWFtLXBvbGljeS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQU1BLDREQVdDO0FBWEQsU0FBZ0Isd0JBQXdCO0lBQ3BDLE1BQU0sTUFBTSxHQUFnQjtRQUN4QjtZQUNJLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLFFBQVEsRUFBRTtnQkFDTixXQUFXO2FBQ2Q7WUFDRCxVQUFVLEVBQUUsR0FBRztTQUNsQjtLQUNKLENBQUM7SUFDRixPQUFPLE1BQU0sQ0FBQztBQUNsQixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW50ZXJmYWNlIFN0YXRlbWVudCB7XHJcbiAgICBFZmZlY3Q6IHN0cmluZztcclxuICAgIEFjdGlvbjogc3RyaW5nIHwgc3RyaW5nW107XHJcbiAgICBSZXNvdXJjZTogc3RyaW5nIHwgc3RyaW5nW107XHJcbn1cclxuXHJcbmV4cG9ydCBmdW5jdGlvbiBnZXRCZWRyb2NrUG9saWN5RG9jdW1lbnQoKSA6IFN0YXRlbWVudFtdIHtcclxuICAgIGNvbnN0IHJlc3VsdDogU3RhdGVtZW50W10gPSBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXHJcbiAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcclxuICAgICAgICAgICAgICAgIFwiYmVkcm9jazoqXCIsXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIqXCJcclxuICAgICAgICB9XHJcbiAgICBdO1xyXG4gICAgcmV0dXJuIHJlc3VsdDtcclxufVxyXG4iXX0=