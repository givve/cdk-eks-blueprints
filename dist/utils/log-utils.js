"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.userLog = void 0;
const tslog_1 = require("tslog");
/**
 * User log is a logger for user info. Does not display callstack
 */
exports.userLog = new tslog_1.Logger({
    stylePrettyLogs: true,
    name: "user",
    hideLogPositionForProduction: true,
    prettyLogTemplate: "{{logLevelName}} ",
    minLevel: 2 // info
});
/**
 * Standard developer logger for troubleshooting. Will leverage sourcemap support.
 */
exports.logger = new tslog_1.Logger({
    stylePrettyLogs: true,
    type: "pretty",
    name: "main",
    minLevel: 3 // info 
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nLXV0aWxzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vbGliL3V0aWxzL2xvZy11dGlscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBK0I7QUFFL0I7O0dBRUc7QUFDVSxRQUFBLE9BQU8sR0FBRyxJQUFJLGNBQU0sQ0FBQztJQUM5QixlQUFlLEVBQUUsSUFBSTtJQUNyQixJQUFJLEVBQUUsTUFBTTtJQUNaLDRCQUE0QixFQUFFLElBQUk7SUFDbEMsaUJBQWlCLEVBQUUsbUJBQW1CO0lBQ3RDLFFBQVEsRUFBRSxDQUFDLENBQUMsT0FBTztDQUN0QixDQUFDLENBQUM7QUFFSDs7R0FFRztBQUNVLFFBQUEsTUFBTSxHQUFHLElBQUksY0FBTSxDQUFDO0lBQzdCLGVBQWUsRUFBRSxJQUFJO0lBQ3JCLElBQUksRUFBRSxRQUFRO0lBQ2QsSUFBSSxFQUFFLE1BQU07SUFDWixRQUFRLEVBQUUsQ0FBQyxDQUFDLFFBQVE7Q0FDdkIsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTG9nZ2VyIH0gZnJvbSBcInRzbG9nXCI7XHJcblxyXG4vKipcclxuICogVXNlciBsb2cgaXMgYSBsb2dnZXIgZm9yIHVzZXIgaW5mby4gRG9lcyBub3QgZGlzcGxheSBjYWxsc3RhY2tcclxuICovXHJcbmV4cG9ydCBjb25zdCB1c2VyTG9nID0gbmV3IExvZ2dlcih7XHJcbiAgICBzdHlsZVByZXR0eUxvZ3M6IHRydWUsXHJcbiAgICBuYW1lOiBcInVzZXJcIixcclxuICAgIGhpZGVMb2dQb3NpdGlvbkZvclByb2R1Y3Rpb246IHRydWUsXHJcbiAgICBwcmV0dHlMb2dUZW1wbGF0ZTogXCJ7e2xvZ0xldmVsTmFtZX19IFwiLFxyXG4gICAgbWluTGV2ZWw6IDIgLy8gaW5mb1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBTdGFuZGFyZCBkZXZlbG9wZXIgbG9nZ2VyIGZvciB0cm91Ymxlc2hvb3RpbmcuIFdpbGwgbGV2ZXJhZ2Ugc291cmNlbWFwIHN1cHBvcnQuXHJcbiAqL1xyXG5leHBvcnQgY29uc3QgbG9nZ2VyID0gbmV3IExvZ2dlcih7XHJcbiAgICBzdHlsZVByZXR0eUxvZ3M6IHRydWUsXHJcbiAgICB0eXBlOiBcInByZXR0eVwiLFxyXG4gICAgbmFtZTogXCJtYWluXCIsXHJcbiAgICBtaW5MZXZlbDogMyAvLyBpbmZvIFxyXG59KTtcclxuIl19