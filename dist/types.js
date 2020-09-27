"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Regions;
(function (Regions) {
    Regions["USWEST1"] = "us-west-1";
    Regions["USWEST2"] = "us-west-2";
    Regions["USEAST1"] = "us-east-1";
    Regions["USEAST2"] = "us-east-2";
})(Regions = exports.Regions || (exports.Regions = {}));
var EditOption;
(function (EditOption) {
    EditOption[EditOption["None"] = 0] = "None";
    EditOption[EditOption["Promote"] = 1] = "Promote";
    EditOption[EditOption["Description"] = 2] = "Description";
})(EditOption = exports.EditOption || (exports.EditOption = {}));
/**
* Interface of a the PackerAmi instance that generates
* the packer file and it's build assets
*/
class IPackerAmi {
}
exports.IPackerAmi = IPackerAmi;
class IPackerBuild {
}
exports.IPackerBuild = IPackerBuild;
exports.ShortDateFormat = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
class AmiDate extends Date {
    prettyDate() {
        return exports.ShortDateFormat.format(this);
    }
}
exports.AmiDate = AmiDate;
/*
 * Packer provisioner implementation
 */
class Provisioner {
    constructor(aName, aProvisionerType) {
        this._packerVars = [];
        this._name = aName;
        this._provisionerType = aProvisionerType;
    }
    get provisionerType() {
        return this._provisionerType;
    }
    get name() {
        return this._name;
    }
    get safeName() {
        return this._name.replace(' ', '-');
    }
    randSeed(length = 16) {
        let ops = "123456789abcdefghijklmnopqrstuvwxyz";
        let seed = "";
        for (var i = 1; i <= length; i++) {
            var rand = Math.floor(Math.random() * ops.length);
            seed += ops[rand];
        }
        return seed;
    }
}
exports.Provisioner = Provisioner;
//# sourceMappingURL=types.js.map