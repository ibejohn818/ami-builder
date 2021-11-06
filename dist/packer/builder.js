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
exports.AmiBuildQueue = exports.PackerBuilder = exports.Ubuntu14Ami = exports.Ubuntu16Ami = exports.Ubuntu18Ami = exports.Ubuntu20Ami = exports.AmazonLinuxAmi = exports.PackerAmiByID = exports.AmazonLinux2ArmAmi = exports.AmazonLinux2Ami = exports.PackerAmi = exports.PackerBuild = void 0;
const prov = __importStar(require("./provisioners"));
const ami_module = __importStar(require("../ami/ami"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const vpc = __importStar(require("../aws/vpc"));
class PackerBuild {
    constructor(aName, aSshUser) {
        this.provisioners = [];
        this.path = path.normalize(path.join("./", "__packer__"));
        this.volumeSize = 20;
        this.volumeType = 'gp2';
        this.packerJson = {
            builders: [],
            provisioners: []
        };
        this.validateName(aName);
        this._name = aName;
        this.sshUser = aSshUser;
    }
    get name() {
        return this._name.replace(" ", "");
    }
    validateName(aName) {
    }
    async getAmiId(region) {
        throw Error("Not Implemented");
        return "Not Implemented";
    }
    generate(region, path) {
        throw Error("Must implement generate");
    }
    /**
     * Add a provisioner to the AMI
     */
    addProvisioner(aIndex, aProv) {
        let idxChk = true;
        while (idxChk) {
            idxChk = false;
            this.provisioners.forEach((v) => {
                // check if index matches
                // if so increment and reset
                // loop to check again
                if (v.index == aIndex) {
                    aIndex++;
                    idxChk = true;
                }
            });
        }
        this.provisioners.push({
            index: aIndex,
            provisioner: aProv
        });
        return aProv;
    }
}
exports.PackerBuild = PackerBuild;
class PackerAmi extends PackerBuild {
    constructor(aName, aSshUser, props = {}) {
        super(aName, aSshUser);
        this.props = {};
        this.props = props;
    }
    async getAmiId(region) {
        throw Error("Not Implemented");
        return "Not Implemented";
    }
    prependProvisioner(aProv) {
        for (var i in this.provisioners) {
            this.provisioners[i].index += 1;
        }
        return this.addProvisioner(0, aProv);
    }
    get buildPath() {
        return path.normalize(path.join(this.path, this.name));
    }
    generateAmiPath() {
        if (fs.existsSync(this.buildPath)) {
            // rimraf.sync(this.buildPath)
        }
        fs.mkdirSync(this.buildPath, { recursive: true });
    }
    async packerBuilder(region) {
        var _a;
        var ami;
        try {
            ami = await this.getAmiId(region);
        }
        catch (err) {
            throw err;
        }
        let builder = {
            type: "amazon-ebs",
            instance_type: (_a = this.props.instanceType) !== null && _a !== void 0 ? _a : "c5.large",
            communicator: "ssh",
            ssh_pty: "true",
            ssh_username: this.sshUser,
            ami_name: `AMI ${this.name} ${+new Date()}`,
            region: region,
            vpc_id: await vpc.VPC.defaultVpc(region),
            source_ami: ami,
        };
        this.packerJson['builders'] = [builder];
    }
    resetPacker() {
        this.packerJson = {
            builders: [],
            provisioners: []
        };
    }
    /**
     *
     * @param region The region in-scope
     * @param path The path to save all generate files to (DEFAULT: ./__packer__/{AMI_NAME})
     */
    async generate(region, path) {
        if (path != undefined) {
            this.path = path;
        }
        // check if we need ansible
        this.addAnsibleInstaller();
        // clear and create dir
        this.generateAmiPath();
        // generate the amazon builder
        await this.packerBuilder(region);
        // create the provisioner assets
        let file = await this.writeAssets(region);
        // set packer json
        this.resetPacker();
        return {
            name: this.name,
            packerFile: file,
            region: region,
            path: this.buildPath
        };
    }
    /**
     *  Write all generated files to disk and generate all the provisioners in the packer file
     * @param region The region in-scope
     */
    async writeAssets(region) {
        let p = path.join(this.buildPath, `packer-${region}.json`);
        // sort the provisioners
        this.provisioners.sort((a, b) => {
            return a.index > b.index ? 1 : -1;
        });
        for (var i in this.provisioners) {
            let pv = this.provisioners[i];
            let res = await pv.provisioner.generate_asset(pv.index, region, this.buildPath);
            this.packerJson.provisioners.push(res);
        }
        const res = fs.writeFileSync(p, JSON.stringify(this.packerJson, null, 4));
        return p;
    }
    /**
     * Check if the build needs to add a shell provisioner to install ansible
     */
    addAnsibleInstaller() {
        let go = false;
        let hasInstaller = false;
        for (var i in this.provisioners) {
            let pr = this.provisioners[i].provisioner;
            if (pr instanceof prov.AnsibleProvisioner) {
                go = true;
            }
            if (pr.name == "Ansible Installer") {
                hasInstaller = true;
            }
        }
        if (!go || hasInstaller) {
            return;
        }
        if (this.constructor.name.match(/ubuntu/i)) {
            let shell = new prov.ShellProvisioner("Ansible Installer");
            shell.add([
                "sudo apt-add-repository ppa:ansible/ansible -y",
                "sudo apt-get update",
                "sudo apt-get install ansible -y",
            ]);
            this.prependProvisioner(shell);
        }
        else if (this.constructor.name.match(/amazon/i)) {
            let shell = new prov.ShellProvisioner("Ansible Installer");
            shell.add([
                "/bin/echo 'repo_upgrade: none' | sudo tee -a /etc/cloud/cloud.cfg.d/disable-yum.conf",
                "sudo amazon-linux-extras install epel ansible2 -y",
                "sudo yum install libselinux-python -y",
            ]);
            this.prependProvisioner(shell);
        }
    }
}
exports.PackerAmi = PackerAmi;
class AmazonLinux2Ami extends PackerAmi {
    constructor(aName, props = {}) {
        super(aName, "ec2-user", props);
    }
    async getAmiId(region) {
        return await ami_module.defaultAwsLinux2Ami(region);
    }
}
exports.AmazonLinux2Ami = AmazonLinux2Ami;
class AmazonLinux2ArmAmi extends PackerAmi {
    constructor(aName, props = {}) {
        super(aName, "ec2-user", props);
    }
    async getAmiId(region) {
        return await ami_module.defaultAwsLinux2ArmAmi(region);
    }
}
exports.AmazonLinux2ArmAmi = AmazonLinux2ArmAmi;
class PackerAmiByID extends PackerAmi {
    constructor(amiIdMap, amiName, sshUserName) {
        super(amiName, sshUserName);
        this.amiLookupMap = amiIdMap;
    }
    async getAmiId(region) {
        return this.amiLookupMap[region];
    }
}
exports.PackerAmiByID = PackerAmiByID;
class AmazonLinuxAmi extends PackerAmi {
    constructor(aName) {
        super(aName, "ec2-user");
    }
    async getAmiId(region) {
        return await ami_module.defaultAwsLinuxAmi(region);
    }
}
exports.AmazonLinuxAmi = AmazonLinuxAmi;
class Ubuntu20Ami extends PackerAmi {
    constructor(aName) {
        super(aName, "ubuntu");
    }
    async getAmiId(region) {
        let res = await ami_module.defaultUbuntu20(region);
        return res;
    }
}
exports.Ubuntu20Ami = Ubuntu20Ami;
class Ubuntu18Ami extends PackerAmi {
    constructor(aName) {
        super(aName, "ubuntu");
    }
    async getAmiId(region) {
        let res = await ami_module.defaultUbuntu18(region);
        return res;
    }
}
exports.Ubuntu18Ami = Ubuntu18Ami;
class Ubuntu16Ami extends PackerAmi {
    constructor(aName) {
        super(aName, "ubuntu");
    }
    async getAmiId(region) {
        return await ami_module.defaultUbuntu16(region);
    }
}
exports.Ubuntu16Ami = Ubuntu16Ami;
class Ubuntu14Ami extends PackerAmi {
    constructor(aName) {
        super(aName, "ubuntu");
    }
    async getAmiId(region) {
        return await ami_module.defaultUbuntu16(region);
    }
}
exports.Ubuntu14Ami = Ubuntu14Ami;
class PackerBuilder {
    static add(ami) {
        for (var i in PackerBuilder.amis) {
            let name = PackerBuilder.amis[i].name;
            if (name == ami.name) {
                throw Error(`${ami.name} AMI name already in-use `);
            }
        }
        PackerBuilder.amis.push(ami);
        return ami;
    }
    static setRegions(...regions) {
        PackerBuilder.regions = regions;
    }
    /**
     * Initiate all ami builds.
     * Will generate the packer build file and (if applicable) the ansible playbook
     * for each AMI+REGION combination
     */
    static async bootstrapBuilds() {
        let builds = [];
        for (var i in PackerBuilder.amis) {
            let ami = PackerBuilder.amis[i];
            for (var ii in PackerBuilder.regions) {
                let region = PackerBuilder.regions[ii];
                builds.push(await ami.generate(region));
            }
        }
        console.log("BUID:", builds);
        return builds;
        // let cmd = ["-machine-readable"]
        // let packerFile = `${this.buildPath}/packer.json`
        // console.log("FILE: ", packerFile)
        // let res = spawn(`packer build ${packerFile}`, cmd, {shell: true})
        // res.stdout.on('data', (data) => {
        //     console.log(`stdout: ${data}`);
        // });
        // res.on("disconnect", () => {
        //     res.kill()
        // })
    }
    static inquirerlist() {
        let res = [];
        for (var i in PackerBuilder.amis) {
            let a = PackerBuilder.amis[i];
            res.push({ name: a.name });
        }
        return res;
    }
}
exports.PackerBuilder = PackerBuilder;
PackerBuilder.amis = [];
PackerBuilder.images = {};
PackerBuilder.regions = [];
class AmiBuildQueue {
    /**
     *
     * @param ami The ami to add ot the queue
     */
    static add(ami) {
        for (var i in PackerBuilder.amis) {
            let name = PackerBuilder.amis[i].name;
            if (name == ami.name) {
                throw Error(`${ami.name} AMI name already in the build queue`);
            }
        }
        AmiBuildQueue.amis.push(ami);
        return ami;
    }
    static setRegions(...regions) {
        AmiBuildQueue.regions = regions;
    }
    static bootstrap() {
        let builds = [];
        for (var i in AmiBuildQueue.amis) {
            let ami = AmiBuildQueue.amis[i];
            for (var ii in AmiBuildQueue.regions) {
                let region = AmiBuildQueue.regions[ii];
                builds.push({
                    packerAmi: ami,
                    name: ami.name,
                    region: region
                });
            }
        }
        return builds;
    }
}
exports.AmiBuildQueue = AmiBuildQueue;
AmiBuildQueue.amis = [];
AmiBuildQueue.regions = [];
//# sourceMappingURL=builder.js.map