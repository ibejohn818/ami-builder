#!/usr/bin/env node
import * as chalk from 'chalk'
import * as commander from 'commander'
import {AWSClient} from './aws/client'
import * as AWS from 'aws-sdk'
import * as child from 'child_process'
import * as path from 'path'
import {Regions, AmiBuildQueue, AmiQueuedBuild} from './packer/builder'
import * as runner from './packer/runner'
import * as term from 'terminal-kit'
import * as inquirer from 'inquirer'
import { listenerCount } from 'cluster'
import * as tagger from './ami/tagger'
import * as cdk from './ami/cdk'
import * as clib from './cli/build'
import * as readline from 'readline'


const handleList = (csv: string): string[] => {
    return csv.split(",")
}

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
    .action(async () => {

      cdk.AmiBuilder.AmiMap.allRegions("Web")


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

    })

program.command('run')
    .option('-b, --build <build>', "Packer builder")
    .option('-n, --names <names>', "Comma separated list of ami names", handleList)
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
            let builds = AmiBuildQueue.bootstrap()

            console.log(builds)

            let r = []

            for (var i in builds) {
                let b= builds[i]
                b.packerAmi.generate(b.region)
            }
  
        }).catch((err) => {
            console.log("ERR: ", err)
        })


    })

program.command('try')
    .arguments("<buildjs> [names...]")
    .option('-y, --yes', "Bypass yes confirmation", false)
    .action(async (cmd, names) => {
        let p = path.resolve(path.normalize(cmd))
        import(p).then(async (res) => {
            let builds = AmiBuildQueue.bootstrap()
            let r: AmiQueuedBuild[] = []
            if (names.length > 0) {
                r = clib.fuzzyFilter(builds, names)
                console.log("R: ", r)
            } else {
                r = await clib.amiCheckbox(builds)
                console.log("R: ", r)
            }
            // console.log(builds)

            if (r.length > 0) {

                r.forEach(async (v) => {
                    let t = await v.packerAmi.generate(v.region)
                    let b = new runner.AmiBuildRunner(t)
                    b.execute()
                })
               
            }

        }).catch((err) => {
            console.log("ERR: ", err)
        })


    })

program.parse(process.argv)

