
import chalk from "chalk";
import meow from "meow";


const noColor = () => Boolean(process.env.NO_COLOR && ["true", "yes", "on", true].includes(process.env.NO_COLOR.toLowerCase().trim()));

export const c = {
    showColor: true,
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


const { name, docsUrl } = { name: "ghex", docsUrl: "https://bn-l.github.io/GithubExtractor/cli.html" };

export enum Option {
    list = "list",
    conflictsOnly = "conflictsOnly",
    dest = "dest",
    caseInsensitive = "caseInsensitive",
    force = "force",
    unwrap = "unwrap",
    echoPaths = "echoPaths",
    strip = "strip",
    quiet = "quiet",
    prefix = "prefix",
    colors = "colors",
    debug = "debug",
    help = "help",
    version = "version",
}

export const helpText = `
        Usage: ${ c.binColor(name) } [options] <paths...>

        ${ c.strong("Arguments:") }
        paths                   One or more paths to download. Can be a whole repo, or a 
                                 folder or a file within it. ${ c.strong("Supports globs") } but the path 
                                 should be quoted. To exclude use a negative glob ("!" at 
                                 the beginning). Can mix paths from different repos 
                                 (conflicts resolved left to right). A trailing slash means
                                 a whole folder. ${ c.strong("Conflicting files are skipped by default") }.
        ${ c.strong("Options:") }
        -l, --list              List files. Useful as a dry run and with fzf. Does not
                                 download. Will show show conflicts for the current working
                                 directory or -d / --dest.
        -c, --conflicts-only    Only show conflicts when listing.
        -d, --dest <folder>     Destination folder. Defaults to the current directory.
        -i, --case-insensitive  Ignores case when checking for conflicts. Default is        
                                 case-sensitive--i.e. casing matters.
        -f, --force             Overwrite all existing conflicting files. Default false.
        -e, --echo-paths        After writing, outputs the path of each file plus a new line.
                                Useful for piping to other commands. Sets --quiet & --no-color.
        -s, --strip <number>    Strip the first n directories from paths. If a path doesn't 
                                have enough directories to strip, it's skipped.
        -q, --quiet             No success or error messages.      
        --no-prefix             Remove the owner/repo prefix from the path in list output
        --no-colors             Strip ansi escape characters used to color output.
                                ${ name } respects the NO_COLOR env var if set also. 

        ${ c.strong("Download Examples:") }
        Entire repo             ${ c.binColor(name) + " facebook/react" }
        Specific folder         ${ c.binColor(name) + " \"facebook/react/packages/*\"" }
        Specify destination     ${ c.binColor(name) + " -d local/dest facebook/react" }
        Specific files          ${ c.binColor(name) + " facebook/react/.circleci/config.yml  facebook/react/.github/stale.yml" }
        Different repos mixed   ${ c.binColor(name) + " facebook/react  micromatch/picomatch" }

        ${ c.strong("List Examples:") }
        Only conflicts          ${ c.binColor(name) + " -lc -d local/dest  facebook/react" }
        Specific folder         ${ c.binColor(name) + " -l \"facebook/react/.circleci/*\"" }

        For a video demo of usage see: ${ c.strong(docsUrl) }
`;


export function getCli(argv?: string[]) {
    
    const cli = meow(helpText, {
        importMeta: import.meta,
        flags: {
            [Option.list]: {
                type: "boolean",
                shortFlag: "l",
            },
            [Option.conflictsOnly]: {
                type: "boolean",
                shortFlag: "c",
            },
            [Option.dest]: {
                type: "string",
                shortFlag: "d",
                default: process.cwd(),
            },
            [Option.caseInsensitive]: {
                type: "boolean",
                shortFlag: "i",
            },
            [Option.force]: {
                type: "boolean",
                shortFlag: "f",
            },
            [Option.unwrap]: {
                type: "boolean",
                shortFlag: "u",
            },
            [Option.echoPaths]: {
                type: "boolean",
                shortFlag: "e",
            },
            [Option.strip]: {
                type: "number",
                shortFlag: "s",
            },
            [Option.quiet]: {
                type: "boolean",
                shortFlag: "q",
                default: false,
            },
            [Option.prefix]: {
                type: "boolean",
                default: true,
            },
            [Option.colors]: {
                type: "boolean",
                default: !noColor(),   
            },
            [Option.debug]: {
                type: "boolean",
            },
            [Option.help]: {
                type: "boolean",
                shortFlag: "h",
            },
            [Option.version]: {
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

    if (cli.flags.echoPaths) { 
        cli.flags.quiet = true;
        cli.flags.colors = false;
    }

    for (const flag of Object.keys(cli.flags)) {
        if (!(flag in Option)) {
            console.error(`\nError: Uknown flag "${ flag }". Run ${ name } -h to show help.\n`);
            process.exit(1);
        }
    }

    if (cli.input.length === 0) {
        console.error(`\nError: Need at least one path. Run ${ name } -h to show help.\n`);
        process.exit(2);
    }
    return cli;
}
