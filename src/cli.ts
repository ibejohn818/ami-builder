#!/usr/bin/env node
import * as commander from 'commander'
import {AWSClient} from './aws/client'
import * as AWS from 'aws-sdk'
import * as child from 'child_process'
import * as path from 'path'
import {Regions, AmiQueuedBuild} from './types'
import {AmiBuildQueue} from './packer/builder'
import * as runner from './packer/runner'
import * as term from 'terminal-kit'
import * as inquirer from 'inquirer'
import { listenerCount } from 'cluster'
import * as tagger from './ami/tagger'
import * as cdk from './ami/cdk'
import * as cli_menus from './cli/menus'
import * as readline from 'readline'
import * as os from 'os'
import * as help_txt from './cli/help'
const chalk = require("chalk")

const handleList = (csv: string): string[] => {
    return csv.split(",")
}

const VERSION = require("../package.json").version


const program = commander.program
program
    .version(VERSION)
    .option('-r, --region <region>', "AWS Region")
    .option('--profile <profile>', "AWS Profile")
    .option('--access-key <access key>', "AWS Access Key")
    .on("option:region", (r: string) => {
        AWSClient.conf.region = r
    })

program.command("list")
        .arguments("<buildjs>")
        .alias('ls')
        .action(async (cmd) => {

          console.log(cmd)

          let p = path.resolve(path.normalize(cmd))

          import(p).then(async (res) => {
            let t: tagger.AmiBuildImage[] = []
            let builds = AmiBuildQueue.bootstrap()
            for (var i in builds) {
              let b = builds[i]
              let at = new tagger.AmiList(b.name,
                                          b.region)
              let imgs = await at.getAmis()

              imgs.forEach((v) => {
                  t.push(v)
              })
            }
            console.table(t)
          
          }).catch((err) => {
            console.log("ERR: ", err)
          })

        })

program.command('test')
    .action(async () => {
        //let res = await cdk.AmiMapper.map("Web", Regions.USWEST2)
        console.log(await cdk.AmiMapper.map("WebPython3", Regions.USWEST2))
        console.log(await cdk.AmiMapper.map("BastionNat", Regions.USWEST2))

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

program.command('build')
    .arguments("<buildjs> [names...]")
    .option('-y, --yes', "Bypass yes confirmation", false)
    .option('-a, --activate', "Set build(s) as active")
    .action(async (cmd, names, ops) => {

        // flags
        let activate = (ops.activate) ? true: false
        let yes = (ops.yes) ? true: false

        let p = path.resolve(path.normalize(cmd))
        console.log(chalk.green(p))
        import(p).then(async (res) => {

            // gather the builds in queue
            let builds = AmiBuildQueue.bootstrap()

            // build storage
            let r: AmiQueuedBuild[] = []

            // check if we have a fuzzy search
            if (names.length > 0) {
                r = cli_menus.fuzzyFilter(builds, names)
                let msg = ""
                for (var i in r)
                  msg += chalk.cyan(`${r[i].name} [${r[i].region}] `)
                console.log(msg)
            } else { // no show a select menu
                r = await cli_menus.amiCheckbox(builds)
            }

            // if we have no builds exit
            if (r.length <= 0) {
              console.log(chalk.bold.blue("No builds selected"))
              process.exit(-1)
            }

            console.log(chalk.bold.green(`${r.length} build(s) selected.`))

            let ans = (yes) ? true: await cli_menus.confirm()

            if (!ans) {
              return
            }
            

            if (r.length > 0) {

                r.forEach(async (v) => {
                    let t = await v.packerAmi.generate(v.region)
                    let b = new runner.AmiBuildRunner(t)
                    b.execute()
                })
               
            }

        }).catch((err) => {
            console.log("ERROR: ", chalk.red(err.message))
        })


    })
    .on("--help", () => {
        help_txt.build.map((v) => {
          console.log(v)
        })
    })



program.command("inspect")
  .arguments("<buildjs>")
  .description("Inspects a selected ami. Shows all builds, active state and which ami id's have deployed ec2 instances")
  .action(async (build) => {

    console.log("BUI: ", build)
    let buildPath = path.resolve(build)

    await import(buildPath)

    const builds = AmiBuildQueue.bootstrap()

    const res = await cli_menus.amiList(builds)

    const query = new tagger.AmiList(res.name, res.region)

    const amis = await query.inspectAmiList()
    const active = "✔"
    const showActive = (a: boolean) => {
      return (a)? chalk.green("✔"): chalk.red("✘")
    }
    const hr = () => console.log("----------------")
    const dtfUS = new Intl.DateTimeFormat('en', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',minute: '2-digit', second: '2-digit' });



    console.log("Name: ", chalk.bold.cyan(res.name))
    console.log("Region: ", chalk.bold.blue(res.region))
    hr()
    console.log('Active=', showActive(true), ' In-Active=', showActive(false))
    hr()

    amis.forEach((v) => {
      let format = chalk.bold
      if (v.active) {
        format = chalk.bold.green
      }
      console.log("[" + showActive(v.active) + "]",
                  format(v.id),
                 "(" + chalk.blue(dtfUS.format(v.created)) + ")")
      if (v.activeInstances.length > 0) {
        console.log("     ", chalk.cyan("Deployed Instances"))
        v.activeInstances.forEach((i) => {
          console.log("       - ",
                      chalk.green(i.name),
                      "[" + chalk.blue(i.id) + "]"
                     )
        })
      }
      
    })

  })

program.command("delete")
  .arguments("<buildjs>")
  .action(async (build) => {

  })

program.command("prune")
  .description("Remove all in-active AMI's. Will not remove if an AMI is in-use")
  .arguments("<buildjs>")
  .action(async (build) => {
      const buildPath = path.resolve(build)
      await import(buildPath)
      const builds = AmiBuildQueue.bootstrap()
      const res = await cli_menus.amiCheckbox(builds)

      console.log("RES: ", res)

  })

program.parse(process.argv)
