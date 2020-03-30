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
const inquirer = __importStar(require("inquirer"));
const program = commander.program;
program
    .version("0.0.1")
    .option('-r, --region <region>', "AWS Region")
    .option('--profile <profile>', "AWS Profile")
    .option('--access-key <access key>', "AWS Access Key")
    .on("option:region", (r) => {
    client_1.AWSClient.conf.region = r;
});
program.command("list <name>")
    .alias('ls')
    .action(async (name = '') => {
});
program.command('test')
    .action(() => {
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
    try {
        let prompt = inquirer.createPromptModule();
        let questions = [
            {
                type: 'checkbox',
                name: 'test',
                choices: builder_1.PackerBuilder.inquirerlist(),
                message: 'testing message'
            }
        ];
        prompt(questions).then((r) => {
            console.log(r);
        });
    }
    catch (error) {
        console.log("ERR", error);
    }
});
program.command('run')
    .option('-b, --build <build>', "Packer builder")
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
        await builder_1.PackerBuilder.bootstrapBuilds();
    }).catch((err) => {
        console.log("ERR: ", err);
    });
});
program.parse(process.argv);
//# sourceMappingURL=cli.js.map