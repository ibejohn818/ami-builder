const chalk = require("chalk")

const VERSION = require('../../package.json').version

export const hr = (length: number, char: string = "-"): string => {
  return "".padEnd(length, char)
}

export const chunkString = (str: string, length: number): string[] => {
  let res = str.match(new RegExp('.{1,' + length + '}', 'g'))
  return <string[]>res
}

export const showActive = (a: boolean) => {
  return (a)? chalk.green("✔"): chalk.red("✘")
}

export const clearTerminal = () => {
  const SO = process.stdout
  const ROWS = SO.rows

  for (var i=0; i<ROWS; i++) {
    SO.write("\n");
  }
}


export const drawFooter = (): string[] => {

  const SO = process.stdout
  const ROWS = SO.rows
  const COLS = SO.columns

  let out = []
  let version = " AMI Builder " + VERSION + " ////"

  out.push(hr(COLS, "/"))
  out.push(version.padStart(COLS, "/"))

  return out
}
