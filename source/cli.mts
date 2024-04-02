
import config from "../getConfig.mjs";

import chalk from "chalk";
import minimist from "minimist";
import wrapAnsi from "wrap-ansi";
import meow, { Result } from "meow";


const noColor = Boolean(process.env.NO_COLOR && ["true", "yes", "on"].includes(process.env.NO_COLOR.toLowerCase().trim()));

export const c = {
    showColor: !noColor,
    colorize: (color: string, str: string): string => {
        return c.showColor ? chalk.hex(color)(str) : str;
    },
    error: (str: string) => c.colorize("#e64553", str),
    warning: (str: string) => c.colorize("#fe640b", str),
    success: (str: string) => c.colorize("#40a02b", str),
    info: (str: string) => c.colorize("#04a5e5", str),
    strong: (str: string) => c.colorize("#7287fd", str),
    careful: (str: string) => c.colorize("#d20f39", str),
    example: (str: string) => c.colorize("#ffffff", str),
    binColor: (str: string) => c.colorize("#04a5e5", str),
};


const { name, docsUrl } = config;

export enum Option {
    dest = "dest",
    list = "list",
    colors = "colors",
    caseInsensitive = "caseInsensitive",
    conflictsOnly = "conflictsOnly",
    keepIf = "keepIf",
    quiet = "quiet",
}


export function getCli(argv?: string[]) {
    
    const cli = meow(`
        ${ c.strong("Usage:") } ${ c.binColor("name") } [options] <paths...>

        ${ c.strong("Arguments:") }
           paths                      One or more path to download. Can be a whole 
                                       repo, a folder, or a file. ${ c.strong("Supports globs") }.
                                       To exclude use a negative glob ("!" at the beginning).
                                       Can mix paths from different repos (conflicts resolved
                                       left to right). A traling slash means a whole folder.
        ${ c.strong("Options:") }
          -l, --list                  List files. Useful as a dry run. Will not download. To
                                       view conflicts, supply the -d / --dest option. 
          -c, --conflicts-only        Only show conflicts when listing.
          -d, --dest <folder>         Destination folder. Defaults to the current directory.
          -i, --case-insensitive      Ignores case when checking for conflicts. Default is        
                                       case-sensitive.
          -k, --keep-if <condition>   "newer" | "existing". Will keep conflicting files 
                                       if they exist or are newer. ${ c.careful("WARNING:") } The
                                       default is to overwrite existing silently.
          -q, --quiet                 No success or error messages.                   
          --colors                    Use ansi escape characters to color output.
                                       default true and respects the NO_COLOR env var if set. 

        ${ c.strong("Download Examples:") }
          Entire repo          ${ c.binColor("name") + " facebook/react" }
          Specific folder      ${ c.binColor("name") + " facebook/react/packages/react/*" }
          Specify destination  ${ c.binColor("name") + " -d local/dest facebook/react" }
          Specific files       ${ c.binColor("name") + " facebook/react/.circleci/config.yml  facebook/react/.github/stale.yml" }
          Different repos      ${ c.binColor("name") + " facebook/react  micromatch/picomatch" }

        ${ c.strong("List Examples:") }
          Only conflicts       ${ c.binColor("name") + " -lc -d local/dest  facebook/react" }
          Specific folder      ${ c.binColor("name") + " -l facebook/react/.circleci/*" }

        For a video demo of usage see: ${ c.strong(docsUrl) }
    `, {
        importMeta: import.meta,
        flags: {
            [Option.dest]: {
                type: "string",
                shortFlag: "d",
                default: process.cwd(),
                isRequired: (flags) => !!flags[Option.conflictsOnly],
            },
            [Option.list]: {
                type: "boolean",
                shortFlag: "l",
            },
            [Option.colors]: {
                type: "boolean",
                default: !noColor,   
            },
            [Option.conflictsOnly]: {
                type: "boolean",
                shortFlag: "c",
            },
            [Option.caseInsensitive]: {
                type: "boolean",
                shortFlag: "i",
            },
            [Option.quiet]: {
                type: "boolean",
                shortFlag: "q",
                default: false,
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
        inferType: true,
        helpIndent: 3,
        // if argv is defined, return an object to be spread. If not, expression evaluates
        //  to undefined--which the spread operator ignores.
        ...(argv && { argv }),
    });

    if (cli.input.length === 0) {
        console.error(`\nError: Need at least one path. Run ${ name } -h to show help.\n`);
        process.exit(1);
    }
    return cli;
}


// const argv = process.argv.slice(2);
// const argv: string[] = ["-h"];
// const argv = ["-l", "bn-l/repo"];

// const cli = getCli();
// const { input, flags } = cli;
// console.log(input, flags);

