#!/usr/bin/env node
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
import * as cli_menus from './cli/menus'
import * as readline from 'readline'
import * as os from 'os'
const chalk = require("chalk")

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
      console.log("")
      console.log("Fuzzy search:")
      console.log("[names...] can be multiple string arguments matching ") 
      console.log("the `${name} ${region}` of your ami's (case-sensitive). ") 
      console.log("Strings prefixed with '^' (IE: ^Web) will be a negative ") 
      console.log("match (you may need to escape \\^).") 
      console.log("")
      console.log("Match rules will be evaluated in the order given for each ")
      console.log("ami name + region. The search is not terribly intelligent ")
      console.log("so it would be best to put your negative matches after your ")
      console.log("positive matches.")
      console.log("")
      console.log("Fuzzy search examples:")
      console.log("Say we have the following ami's queued:")
      console.log("ProdWeb us-west-1, StagingWeb us-west-1, ProdWeb us-east-2, StagingWeb us-east-2,")
      console.log("ProdWeb us-west-2, StagingWeb us-west-2")
      console.log("")
      console.log("The command: `ami-builder path/to/build.js Web west ^-2`")
      console.log("Would result in:  ProdWeb us-west-1, StagingWeb us-west-1")
      console.log("")

    })



program.command("inspect")
  .arguments("<buildjs>")
  .action(async (build) => {

    console.log("BUI: ", build)
    let buildPath = path.resolve(build)

    await import(buildPath)

    let builds = AmiBuildQueue.bootstrap()

    let res = await cli_menus.amiList(builds)

    let query = new tagger.AmiList(res.name, res.region)

    let amis = await query.inspectAmiTablized()

    console.table(amis)

  })

program.parse(process.argv)
