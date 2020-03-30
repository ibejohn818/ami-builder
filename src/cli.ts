#!/usr/bin/env node
import * as chalk from 'chalk'
import * as commander from 'commander'
import {AWSClient} from './aws/client'
import * as AWS from 'aws-sdk'
import * as child from 'child_process'
import * as path from 'path'
import {PackerBuilder} from './packer/builder'
import * as term from 'terminal-kit'
import * as inquirer from 'inquirer'
import { listenerCount } from 'cluster'



const program = commander.program
program
    .version("0.0.1")
    .option('-r, --region <region>', "AWS Region")
    .option('--profile <profile>', "AWS Profile")
    .option('--access-key <access key>', "AWS Access Key")
    .on("option:region", (r: string) => {
        AWSClient.conf.region = r
    })

program.command("list <name>")
        .alias('ls')
        .action(async (name='') => {
        })

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
                    choices: PackerBuilder.inquirerlist(),
                    message: 'testing message'

                }
            ]
            prompt(questions).then(
                (r) => {
                    console.log(r)
                }
            );
        } catch (error) {
            
            console.log("ERR", error)
        }

    })

program.command('run')
    .option('-b, --build <build>', "Packer builder")
    .action(async (cmd, o) => {
        let p = path.resolve(path.normalize(cmd.build))
        console.log(cmd.build, p)
        import(p).then(async (res) => {
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
            await PackerBuilder.bootstrapBuilds()

  
        }).catch((err) => {
            console.log("ERR: ", err)
        })


    })

program.parse(process.argv)
