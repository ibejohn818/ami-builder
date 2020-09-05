"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IPackerAmi = exports.Provisioner = exports.Regions = void 0;
var Regions;
(function (Regions) {
    Regions["USWEST1"] = "us-west-1";
    Regions["USWEST2"] = "us-west-2";
    Regions["USEAST1"] = "us-east-1";
    Regions["USEAST2"] = "us-east-2";
})(Regions = exports.Regions || (exports.Regions = {}));
/*
 * Packer provisioner implementation
 */
class Provisioner {
    constructor(aName, aProvisionerType) {
        this._name = aName;
        this._provisionerType = aProvisionerType;
    }
    get provisionerType() {
        return this._provisionerType;
    }
    get name() {
        return this._name;
    }
}
exports.Provisioner = Provisioner;
class IPackerAmi {
}
exports.IPackerAmi = IPackerAmi;
//# sourceMappingURL=types.js.map