"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const cp = __importStar(require("child_process"));
const fs = __importStar(require("fs"));
const tagger_1 = require("../ami/tagger");
class Logger {
    constructor(aBuild) {
        this._logCreated = false;
        this._build = aBuild;
    }
    createStream() {
        this.logHandle = fs.createWriteStream(`${this._build.path}/${this.genFileName()}`, {
            flags: 'a'
        });
        this._logCreated = true;
    }
    genFileName() {
        let ts = new Date().getTime() / 1000;
        let name = `${this._build.name}-${this._build.region}-${ts}.log`;
        return name;
    }
    write(data, from) {
        if (!this.logHandle) {
            this.createStream();
        }
        if (this.logHandle) {
            let d = new Date().toISOString();
            let p = `[${d}]` + ((from) ? ` (${from}) ` : "");
            data = data.replace(/\n$/, '');
            this.logHandle.write(p + data + "\n");
        }
    }
    close() {
        if (this.logHandle)
            this.logHandle.end();
    }
}
class AmiBuildRunner {
    constructor(task, props) {
        this._proc = undefined;
        this.idFound = false;
        this.msgData = "";
        this.msgTarget = "";
        this.msgType = "";
        this._isTagging = false;
        this._taggingAttemps = 0;
        this._task = task;
        this._props = props !== null && props !== void 0 ? props : {};
        this._logger = new Logger(this._task);
    }
    get props() {
        return this._props;
    }
    get logger() {
        return this._logger;
    }
    get task() {
        return this._task;
    }
    get newAmiId() {
        return this._newAmiId;
    }
    get isTagging() {
        return this._isTagging;
    }
    get consoleAmiLink() {
        // https://us-west-2.console.aws.amazon.com/ec2/v2/home?region=us-west-2#Images:visibility=owned-by-me;search=ami-07badf6f66dacbc7a;sort=name
        let uri = `https://${this.task.region}.console.aws.amazon.com`;
        uri += `/ec2/v2/home?region=${this.task.region}`;
        uri += `#Images:visibility=owned-by-me;search=${this._newAmiId}`;
        return uri;
    }
    async execute() {
        var args = AmiBuildRunner.packerOps.concat(AmiBuildRunner.packerExtraOps);
        var cmd = `${AmiBuildRunner.packerExe} build ${this._task.packerFile} `;
        var proc = cp.spawn(cmd, args, { shell: true });
        var $this = this;
        this.props.isStarted = true;
        this.props.isActive = true;
        proc.stdout.on('data', (data) => {
            let line = `${data}`;
            this.logger.write(line, "Packer");
            this.parseLine(line);
            line = line.replace(/\n$/, '');
            this._props.currentLogLine = line;
            //console.log(line)
        });
        proc.on('disconnect', () => {
            this.logger.close();
            proc.kill();
        });
        proc.on('exit', (code) => {
            this.tagAmi().then((res) => {
                $this._props.isTagged = true;
            });
            this.props.isActive = false;
            this.logger.close();
        });
        this._proc = proc;
    }
    /**
     * Parse packer machine-readable output.
     * Spec: https://packer.io/docs/commands/index.html
     */
    parseLine(lineIn) {
        let out = "";
        const l = lineIn.split(",");
        const ts = l[0];
        const target = l[1].trim();
        const type = l[2].trim();
        const data = l.splice(3, (l.length - 1)).join(" ").trim();
        this._props.logTarget = target;
        this._props.logLine = this.formatPackerData(data);
        this._props.logType = type;
        switch (target) {
            case "amazon-ebs":
                this.parseAmiId(data);
                break;
        }
        return out;
    }
    formatPackerData(data) {
        data = data.replace("%!(PACKER_COMMA)", ",");
        return data;
    }
    parseSay(sayIn) {
        let o = "";
        return o;
    }
    parseMessage(msgIn) {
        let o = "";
        let msg = msgIn[4].trim();
        return o;
    }
    async parseAmiId(data) {
        // check if we already found an AMI ID
        if (this.idFound) {
            return;
        }
        let re = new RegExp(/(.*?)([a-z]{2}-[a-z]{1,}-[0-9]{1})(:)(\s?)(ami)(-)([a-z0-9]{5,})$/, 'mi');
        if (re.test(data) && this._newAmiId == undefined) {
            let res = data.match(re);
            if (res === null) {
                return;
            }
            this._newAmiId = `${res[5]}${res[6]}${res[7]}`;
            this.idFound = true;
        }
    }
    async tagAmi() {
        if (this._newAmiId) {
            try {
                var $this = this;
                this._isTagging = true;
                this._props.currentLogLine = `Tagging AMI: ${this._newAmiId}. Attempts: ${this._taggingAttemps}`;
                let tags = [];
                if (this.props.description) {
                    tags.push({
                        key: "user:description",
                        value: this.props.description
                    });
                }
                let tagger = new tagger_1.AmiTagger(this._task.region, this._task.name, this._newAmiId);
                await tagger.setTags(this.props.promoteActive, tags);
                //this.logger.write(`Tagging ${this._taggingAttemps}`)
            }
            catch (err) {
                if (this._taggingAttemps > 5) {
                    throw err;
                }
                this._taggingAttemps++;
                let msg = `Tagging error attempt: ${this._taggingAttemps}: ${err.toString()}`;
                //this.logger.write(msg, "AmiRunner::Tagging")
                await this.tagAmi();
            }
        }
        else {
            throw Error("Attemping to tag ami without ami-id");
        }
    }
}
exports.AmiBuildRunner = AmiBuildRunner;
AmiBuildRunner.packerExe = "packer";
AmiBuildRunner.packerOps = ['-machine-readable'];
AmiBuildRunner.packerExtraOps = [];
//# sourceMappingURL=runner.js.map