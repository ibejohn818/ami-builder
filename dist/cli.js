#!/usr/bin/env node
"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander = __importStar(require("commander"));
const client_1 = require("./aws/client");
const path = __importStar(require("path"));
const builder_1 = require("./packer/builder");
const runner = __importStar(require("./packer/runner"));
const tagger = __importStar(require("./ami/tagger"));
const cdk = __importStar(require("./ami/cdk"));
const clib = __importStar(require("./cli/build"));
const handleList = (csv) => {
    return csv.split(",");
};
const program = commander.program;
program
    .version("0.0.1")
    .option('-r, --region <region>', "AWS Region")
    .option('--profile <profile>', "AWS Profile")
    .option('--access-key <access key>', "AWS Access Key")
    .on("option:region", (r) => {
    client_1.AWSClient.conf.region = r;
});
program.command("list")
    .arguments("<buildjs>")
    .alias('ls')
    .action(async (cmd) => {
    console.log(cmd);
    let p = path.resolve(path.normalize(cmd));
    Promise.resolve().then(() => __importStar(require(p))).then(async (res) => {
        let t = [];
        let builds = builder_1.AmiBuildQueue.bootstrap();
        for (var i in builds) {
            let b = builds[i];
            let at = new tagger.AmiList(b.name, b.region);
            let imgs = await at.getAmis();
            imgs.forEach((v) => {
                t.push(v);
            });
        }
        console.table(t);
    }).catch((err) => {
        console.log("ERR: ", err);
    });
});
program.command('test')
    .action(async () => {
    let res = await cdk.AmiMapper.map("Web", builder_1.Regions.USWEST2);
    console.log();
    // let at = new tagger.AmiBuilder.AmiTagger(
    //   Regions.USWEST2,
    //   "Web",
    //   "ami-0874c2497a84da9fb"
    // )
    // await at.setTags()
    // await at.getTags()
    //    const ls = await child.spawn( 'packer', [] );
    //     ls.stdout.on( 'data', data => {
    //         console.log( `stdout: ${data}` );
    //     } );
    //     ls.stderr.on( 'data', data => {
    //         console.log( `stderr: ${data}` );
    //     } );
    //     ls.on( 'close', code => {
    //         console.log( `child process exited with code ${code}` );
    //     } ); 
    //try {
    //let prompt = inquirer.createPromptModule();
    //let questions = [
    //{
    //type: 'checkbox',
    //name: 'test',
    //choices: PackerBuilder.inquirerlist(),
    //message: 'testing message'
    //}
    //]
    //prompt(questions).then(
    //(r) => {
    //console.log(r)
    //}
    //);
    //} catch (error) {
    //console.log("ERR", error)
    //}
});
program.command('run')
    .option('-b, --build <build>', "Packer builder")
    .option('-n, --names <names>', "Comma separated list of ami names", handleList)
    .action(async (cmd, o) => {
    let p = path.resolve(path.normalize(cmd.build));
    console.log(cmd.build, p);
    Promise.resolve().then(() => __importStar(require(p))).then(async (res) => {
        // console.log(res)
        // // console.log("AMIS: ", PackerBuilder.amis)
        // term.terminal.red("TEST").bold("Test").noFormat(" Testing")
        // term.terminal.grabInput({safe: true})
        // term.terminal.on( 'key' , function(key: any, msg: any, data: any) {  
        //     console.log( "'key' event:" , key ) ;
        //     console.log("MSG: ", msg)
        //     console.log("DATA: ", data)
        //     // Detect CTRL-C and exit 'manually'
        //     if ( key === 'CTRL_C' ) { process.exit() ; }
        // } ) ;
        let builds = builder_1.AmiBuildQueue.bootstrap();
        console.log(builds);
        let r = [];
        for (var i in builds) {
            let b = builds[i];
            b.packerAmi.generate(b.region);
        }
    }).catch((err) => {
        console.log("ERR: ", err);
    });
});
program.command('try')
    .arguments("<buildjs> [names...]")
    .option('-y, --yes', "Bypass yes confirmation", false)
    .action(async (cmd, names) => {
    let p = path.resolve(path.normalize(cmd));
    Promise.resolve().then(() => __importStar(require(p))).then(async (res) => {
        let builds = builder_1.AmiBuildQueue.bootstrap();
        let r = [];
        if (names.length > 0) {
            r = clib.fuzzyFilter(builds, names);
            console.log("R: ", r);
        }
        else {
            r = await clib.amiCheckbox(builds);
            console.log("R: ", r);
        }
        // console.log(builds)
        if (r.length > 0) {
            r.forEach(async (v) => {
                let t = await v.packerAmi.generate(v.region);
                let b = new runner.AmiBuildRunner(t);
                b.execute();
            });
        }
    }).catch((err) => {
        console.log("ERR: ", err);
    });
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map