
import { helpText } from "../source/cli.mjs";
import fs from "fs";
import stripAnsi from "strip-ansi"

const readmePath = "./README.md";

const plainHelp = stripAnsi(helpText)

const readmeAppendix = "```\n" + plainHelp + "\n```";

const readme = fs.readFileSync(readmePath, { encoding: "utf8" });
const readmeSnip = readme.split("<!-- SNIP -->")[0];

const readmeWithHelp = readmeSnip + "<!-- SNIP -->\n\n" + readmeAppendix;

fs.writeFileSync(readmePath, readmeWithHelp, { encoding: "utf8" });

