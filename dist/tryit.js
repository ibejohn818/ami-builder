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
const packer = __importStar(require("./packer"));
const ami = __importStar(require("./ami"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const types_1 = require("./types");
ami.defaultUbuntu20(types_1.Regions.USWEST2);
let p = {
    first: "john",
    last: "hardy",
    middle: "c"
};
const baseAmi = (name) => {
    let ami = new packer.AmazonLinux2Ami(name);
    let ans = new packer.AnsibleProvisioner("Ansible", "/home/jhardy/projects/ansible");
    ami.addProvisioner(1, ans);
    ans.addRole({
        role: "sudo-nopw",
        index: 10
    });
    return [ami, ans];
};
const ubuntuAmi = (name) => {
    let ami = new packer.Ubuntu16Ami(name);
    let ans = new packer.AnsibleProvisioner("Ansible", path.join(os.homedir(), "projects/ansible"));
    ami.addProvisioner(1, ans);
    ans.addRole({
        role: "sudo-nopw",
        index: 10
    });
    return [ami, ans];
};
const pythonAmi = (name) => {
    let ami = new packer.AmazonLinux2Ami(name);
    let ans = new packer.AnsibleProvisioner("Ansible", path.join(os.homedir(), "projects/ansible"));
    ami.addProvisioner(1, ans);
    ans.addRole({
        role: "common-pkgs",
        index: 5
    });
    ans.addRole({
        role: "docker-aws",
        index: 20
    });
    ans.addRole({
        role: "sudo-nopw",
        index: 20
    });
    ans.addRole({
        role: "jch-python-aws2",
        index: 50
    });
    ans.addRole({
        role: "github-users",
        index: 30,
        vars: {
            'githubusers': [
                {
                    username: "ibejohn818",
                    login: "jhardy",
                    groups: 'sudonopw,docker'
                }
            ]
        }
    });
    ans.preTasks = [
        {
            set_fact: {
                tester: 'testing'
            }
        }
    ];
    ami.addProvisioner(1, ans);
    ami.addProvisioner(1, ans);
    ans.addRole({
        role: "ansible-ohmyzsh",
        index: 40
    });
    return ami;
};
const bastionNatInstance = (name) => {
    let ami = new packer.AmazonLinux2Ami(name);
    let ans = new packer.AnsibleProvisioner("Ansible", path.join(os.homedir(), "projects/ansible"));
    ami.addProvisioner(1, ans);
    ans.addRole({
        role: "common-pkgs",
        index: 5,
    });
    ans.addRole({
        role: "ec2ools",
        index: 10
    });
    ans.addRole({
        role: "sudo-nopw",
        index: 20
    });
    ans.addRole({
        role: "github-users",
        index: 30,
        vars: {
            'githubusers': [
                {
                    username: "ibejohn818",
                    login: "jhardy",
                    groups: 'sudonopw'
                }
            ]
        }
    });
    ans.addRole({
        role: "ansible-ohmyzsh",
        index: 40
    });
    return ami;
};
const ubuntu20 = (name) => {
    let ami = new packer.Ubuntu20Ami(name);
    let ans = new packer.AnsibleProvisioner("Ansible", path.join(os.homedir(), "projects/ansible"));
    ami.addProvisioner(1, ans);
    ans.addRole({
        role: "common-pkgs",
        index: 5,
    });
    ans.addRole({
        role: "ec2ools",
        index: 10
    });
    ans.addRole({
        role: "sudo-nopw",
        index: 20
    });
    ans.addRole({
        role: "github-users",
        index: 30,
        vars: {
            'githubusers': [
                {
                    username: "ibejohn818",
                    login: "jhardy",
                    groups: 'sudonopw'
                }
            ]
        }
    });
    ans.addRole({
        role: "ansible-ohmyzsh",
        index: 40
    });
    var s = new packer.ShellProvisioner("Tester");
    s.add("echo 'test'");
    ami.addProvisioner(10, s);
    let ans2 = new packer.AnsibleProvisioner("Ansible", path.join(os.homedir(), "projects/ansible"));
    ami.addProvisioner(10, ans2);
    ans2.addRole({
        role: "common-pkgs",
        index: 5,
    });
    return ami;
};
let web = baseAmi("Nat");
let web2 = baseAmi("StagingWeb");
//let ubu = ubuntuAmi("WebUbuntu")
let webPython = pythonAmi("WebPython3");
let bastionNat = bastionNatInstance("BastionNat");
let ubu20 = ubuntu20("Ubu20");
packer.AmiBuildQueue.add(web[0]);
//packer.AmiBuildQueue.add(ubu[0])
packer.AmiBuildQueue.add(web2[0]);
packer.AmiBuildQueue.add(webPython);
packer.AmiBuildQueue.add(bastionNat);
packer.AmiBuildQueue.add(ubu20);
packer.AmiBuildQueue.add(baseAmi("BaseAmi")[0]);
packer.AmiBuildQueue.add(baseAmi("BaseAnother")[0]);
packer.AmiBuildQueue.add(baseAmi("BaseThree")[0]);
//packer.AmiBuildQueue.add(ubuntuAmi("Docker")[0])
//packer.AmiBuildQueue.add(ubuntuAmi("StagingDocker")[0])
packer.AmiBuildQueue.setRegions(types_1.Regions.USWEST2, types_1.Regions.USWEST1);
//# sourceMappingURL=tryit.js.map