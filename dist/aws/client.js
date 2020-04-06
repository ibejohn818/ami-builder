"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const AWS = __importStar(require("aws-sdk"));
class AWSClient {
    static config() {
        if (Object.keys(AWSClient.conf).length <= 0) {
            return;
        }
        if (AWSClient.conf.profile) {
            // set profile credentials
        }
        else {
            AWS.config.update(AWSClient.conf);
        }
    }
    /**
     * Return an AWS Service client with
     * the credentials stored in AWSClient.conf
     *
     * @param name (string): The name of the service
     */
    static client(name, conf) {
        AWSClient.config();
        let cprops = {};
        if (conf != undefined) {
            cprops = { ...AWSClient.conf, ...conf };
        }
        let c = new AWS[name](cprops);
        return c;
    }
}
exports.AWSClient = AWSClient;
AWSClient.conf = {};
exports.clientFactory = (service, conf = {}) => {
    console.log("TYPE: ", T & Function.name);
    let cprops = {};
    if (conf != undefined) {
        cprops = { ...AWSClient.conf, ...conf };
    }
    //let c = new (<any>AWS)[name](cprops) as T
    let c = new AWS[service](cprops);
    return c;
};
//# sourceMappingURL=client.js.map