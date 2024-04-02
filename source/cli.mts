
import config from "../getConfig.mjs";

import chalk from "chalk";
import minimist from "minimist";
import wrapAnsi from "wrap-ansi";
import meow, { Result } from "meow";


const errorColor = chalk.hex("#e64553");
const warningColor = chalk.hex("#fe640b");
const successColor = chalk.hex("#40a02b");
const infoColor = chalk.hex("#04a5e5");
const strong = chalk.hex("#7287fd");
const careful = chalk.hex("#d20f39");
const example = chalk.hex("#4c4f69");
const binColor = warningColor;

export function show(type: "error" | "warning" | "success" | "info", message: string) {
    const color = {
        error: errorColor,
        warning: warningColor,
        success: successColor,
        info: infoColor,
    }[type];

    console.error(color(message));
}

const { name, docsUrl } = config;

export enum Option {
    dest = "dest",
    list = "list",
    noColor = "noColor",
    caseInsensitive = "caseInsensitive",
    conflicts = "conflicts",
    keepIf = "keepIf",
}

// const argv = process.argv.slice(2);
const argv: string[] = ["-h"];
// const argv = ["-d", "local/dest", "owner/repo"];

export function getCli() {
    
    const cli = meow(`
        ${ strong("Usage:") } ${ binColor(name) } [options] <paths...>

        ${ strong("Arguments:") }
           paths                      One or more path to download. Can be a whole 
                                       repo, a folder, or a file. ${ strong("Supports globs") }.
                                       To exclude use a negative glob ("!" at the beginning).
                                       Can mix paths from different repos (conflicts resolved
                                       left to right). A traling slash means a whole folder.
        ${ strong("Options:") }
          -l, --list                  List files. Useful as a dry run. Will not download. To
                                       view conflicts, supply the -d / --dest option. 
          -c, --conflicts             Only show conflicts when listing.
          -d, --dest <folder>         Destination folder. Defaults to the current directory.
          -i, --case-insensitive      Ignores case when checking for conflicts. Default is        
                                       case-sensitive.
          -k, --keep-if <condition>   "newer" | "existing". Will keep conflicting files 
                                       if they exist or are newer. ${ careful("WARNING:") } The
                                       default is to overwrite existing silently.
          --no-color                  Suppress ansi escape characters used to color output.
                                       default is the NO_COLOR env var if set or false. 

        ${ strong("Download Examples:") }
          Entire repo          ${ binColor(name) + example(" facebook/react") }
          Specific folder      ${ binColor(name) + example(" facebook/react/packages/react/*") }
          Specify destination  ${ binColor(name) + example(" -d local/dest facebook/react") }
          Specific files       ${ binColor(name) + example(" facebook/react/.circleci/config.yml  facebook/react/.github/stale.yml") }
          Different repos      ${ binColor(name) + example(" facebook/react  micromatch/picomatch") }

        ${ strong("List Examples:") }
          Only conflicts       ${ binColor(name) + " -lc -d local/dest  facebook/react" }
          Specific folder      ${ binColor(name) + " -l facebook/react/.circleci/*" }

        For a video demo of usage see: ${ strong(docsUrl) }

    `, {
        importMeta: import.meta,
        flags: {
            [Option.dest]: {
                type: "string",
                shortFlag: "d",
                default: process.cwd(),
                isRequired: (flags) => !!flags[Option.conflicts],
            },
            [Option.list]: {
                type: "boolean",
                shortFlag: "l",
            },
            [Option.noColor]: {
                type: "boolean",
                default: Boolean(process.env.NO_COLOR ?? false),
                isRequired: (flags) => !!flags[Option.conflicts],                
            },
            [Option.conflicts]: {
                type: "boolean",
                shortFlag: "c",
            },
            [Option.caseInsensitive]: {
                type: "boolean",
                shortFlag: "i",
            },
            [Option.keepIf]: {
                type: "string",
                choices: ["newer", "existing"],
            },
            help: {
                type: "boolean",
                shortFlag: "h",
            },
            version: {
                type: "boolean",
                shortFlag: "v",
            },
        },
        argv,
        inferType: true,
        helpIndent: 3,
    });

    if (cli.input.length === 0) {
        show("error", `   Error: Need at least one path. Run ${ name } -h to show help.`);
        process.exit(1);
    }
    return cli;
}

const cli = getCli();
const { input, flags } = cli;
console.log(input, flags);

