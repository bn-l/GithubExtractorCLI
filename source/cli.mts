
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


const { name, docsUrl } = meow({ importMeta: import.meta }).pkg as { name: string; docsUrl: string };

export enum Option {
    dest = "dest",
    list = "list",
    colors = "colors",
    caseInsensitive = "caseInsensitive",
    conflictsOnly = "conflictsOnly",
    keepIf = "keepIf",
    quiet = "quiet",
}

export const helpText = `
        Usage: ${ c.binColor(name) } [options] <paths...>

        ${ c.strong("Arguments:") }
        paths                      One or more paths to download. Can be a whole 
                                    repo, a folder or a file. ${ c.strong("Supports globs") }
                                    but the path should be quoted. To exclude use a negative 
                                    glob ("!" at the beginning). Can mix paths from different 
                                    repos (conflicts resolved left to right). A trailing slash
                                    means a whole folder.
        ${ c.strong("Options:") }
        -l, --list                  List files. Useful as a dry run and with fzf. Does not
                                     download. Will show show conflicts for the current 
                                     working directory if -d / --dest is not specified.
        -c, --conflicts-only        Only show conflicts when listing.
        -d, --dest <folder>         Destination folder. Defaults to the current directory.
        -i, --case-insensitive      Ignores case when checking for conflicts. Default is        
                                     case-sensitive--i.e. casing matters.
        -k, --keep-if <condition>   "newer" | "existing". Will keep conflicting files 
                                     if they exist or are newer. ${ c.careful("WARNING:") } The
                                     default is to overwrite existing silently.
        -q, --quiet                 No success or error messages.                   
        --colors                    Use ansi escape characters to color output.
                                     Default true but respects the NO_COLOR env var if set. 

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
            [Option.colors]: {
                type: "boolean",
                default: !noColor(),   
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
            [Option.dest]: {
                type: "string",
                shortFlag: "d",
                default: process.cwd(),
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
