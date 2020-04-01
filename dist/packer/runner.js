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
    constructor(aPath, name) {
        this.path = aPath;
        this.logHandle = fs.createWriteStream(`${this.path}/${name}.log`, {
            flags: 'a'
        });
    }
    write(data) {
        this.logHandle.write(data);
    }
    close() {
        this.logHandle.end();
    }
}
class AmiBuildRunner {
    constructor(task) {
        this._proc = undefined;
        this._task = task;
    }
    async execute() {
        let args = AmiBuildRunner.packerOps.concat(AmiBuildRunner.packerExtraOps);
        let cmd = `${AmiBuildRunner.packerExe} build ${this._task.packerFile} `;
        let proc = cp.spawn(cmd, args, { shell: true });
        let log = new Logger(this._task.path, this._task.name);
        proc.stdout.on('data', (data) => {
            let line = `${data}`;
            log.write(line);
            this.parseLine(line);
            console.log(line.replace(/\n$/, ''));
        });
        proc.on('disconnect', () => {
            console.log("PROC EXIT");
            log.close();
            proc.kill();
        });
        proc.on('exit', () => {
            log.close();
            console.log("PROC EXIT");
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
        console.log("Target: ", target);
        console.log("Type: ", type);
        console.log("Data: ", data);
        switch (target) {
            case "amazon-ebs":
                this.parseAmiId(data);
                break;
        }
        return out;
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
        let re = new RegExp(/(.*)(?!=id)(?!=[a-z]{2}\-[a-z]{1,}\-[0-9]{1})(:)(ami)(\-)([a-z0-9]{5,})$/, 'mi');
        if (re.test(data)) {
            let res = data.match(re);
            if (res === null) {
                return;
            }
            let id = `${res[3]}${res[4]}${res[5]}`;
            let tagger = new tagger_1.AmiTagger(this._task.region, this._task.name, id);
            await tagger.setTags();
            console.log("AMI Tagged: ", id);
        }
    }
}
exports.AmiBuildRunner = AmiBuildRunner;
AmiBuildRunner.packerExe = "packer";
AmiBuildRunner.packerOps = ['-machine-readable'];
AmiBuildRunner.packerExtraOps = [];
//# sourceMappingURL=runner.js.map