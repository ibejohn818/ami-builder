const chalk = require("chalk")

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
    let so = process.stdout;
    let rows = so.rows;
    for (var i=0; i<rows; i++) {
        so.write("\n");
    }
}

