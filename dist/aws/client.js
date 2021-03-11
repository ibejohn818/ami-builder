"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientFactory = exports.AWSClient = void 0;
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
    //console.log("TYPE: ",  T&Function.name as string)
    let cprops = {};
    if (conf != undefined) {
        cprops = { ...AWSClient.conf, ...conf };
    }
    //let c = new (<any>AWS)[name](cprops) as T
    let c = new AWS[service](cprops);
    return c;
};
//# sourceMappingURL=client.js.map