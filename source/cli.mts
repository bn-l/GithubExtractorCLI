
import { packageJson } from "./getPackageJson.mjs";

import ghe from "github-extractor";
// import { Command } from "commander";
import chalk from "chalk";
import { Command, Option } from "@commander-js/extra-typings";


const red = chalk.red;

const { version, description, name, bin } = packageJson;

const program = new Command()
    .name(name)
    .version(version)
    .description(description)
    .configureHelp({
        visibleArguments: () => [],
        helpWidth: 80,
    })
    .addHelpText("before", "---- before ----\n") // to add intro blurb
    .usage("custom usage string")
    .addHelpText("after", "\n---- after ----") // to add usage info for options
    .argument("<owner/repo>", "The path in the format owner/repo")
    .addOption(new Option("-f, --file <file_path...>"))
    .addOption(new Option("-q, --quiet", "Don't highlight conflicts").conflicts("conflicts"))
    .option("-c, --conflicts", "show conflicts only");


// ! create a separate command for download and make it the default command
// + configure show help on error.
// ! can set conflicts in option options
// !! Add glob patterns to GithubExtractor. Remove typos feature and instead warn about some files
//  not being found (with an option to suppress warnings)

// glob pattern 

// program.parse(["NOTSHOWN", "NOTSHOWN", "-l", "ownerrepo"]);
// program.parse(["NOTSHOWN", "ghe", "-c", "owner/repo"]);
program.parse(["NOTSHOWN", "ghe", "--help"]);

const options = program.opts();
const args = program.args;

console.log("args", args, "options", options);

export function getArgs() {
    program.parse();
    const options = program.opts();
    const args = program.args;
    const helpText = program.helpInformation();
    return { args, options, helpText };
}
