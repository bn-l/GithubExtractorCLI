
// export { GithubExtractor as default } from "./GithubExtractor.mjs";

import { getCli, Option, c } from "./cli.mjs";

import pico from "picomatch";
import GithubExtractor, { Typo } from "github-extractor";
import { rimrafSync } from "rimraf";
import fs from "node:fs";
import pathe from "pathe";
import indentString from "indent-string";


// //// debug ////////////////
// const flag = "-d";
// const flagArg = "./.tmp";

// const path1 = "bn-l/repo/*";
// const path2 = "bn-l/repo/somefile.txt";

// process.argv = ["PLACEHOLDER", "PLACEHOLDER", "-l", "bn-l/repo"];

// ///////////////////////////

const { input: paths, flags } = getCli();
c.showColor = flags.colors;

// Organise:
// Sets to false if undefined
let { list: listMode = false, quiet = false, dest, keepIf, caseInsensitive = false, conflictsOnly = false } = flags;

const ownerGrouping: OwnerGroup = groupByOwner({ paths });
const parsedGroups: ParsedGroup[] = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

// Execute:

try {
    await executeParsedGroups({ conflictsOnly, listMode, parsedGroups, dest, keepIf });
    if (!flags.list && !flags.quiet) {
        console.log(c.success(`Successfully downloaded to ${ pathe.resolve(flags.dest) }`));
    }
}
catch (error) {
    if (error instanceof Error && !flags.quiet) {
        console.log(c.error(`\n${ error.message }\n`));
    }
}

// // // !! Debug
// console.log(" Got:\n------");
// fs.readdirSync("./.tmp/", { recursive: true }).forEach(file => {
//     console.log(file);
// });
// rimrafSync("./.tmp/");
// fs.mkdirSync("./.tmp/");


export function normalizePath(rPath: string) {
    rPath = rPath.trim();
    if (rPath.startsWith("/")) rPath = rPath.slice(1);
    if (rPath.endsWith("/")) rPath = rPath + "**";
    return rPath;
}

//                                                         paths[] 
interface OwnerGroup { [owner: string]: { [repo: string]: string[] } }

export function groupByOwner({ paths }:{ paths: string[] }): OwnerGroup {
    
    if (paths.length === 0) throw new Error("No paths were provided.");

    const ownerGroup: OwnerGroup = {};

    for (const rPath of paths) {

        const errorMessage = `Invalid path. Must be in the format: owner/repo/path or owner/repo. Received ${ rPath.length ? rPath : "an empty string" } when parsing the arguments: ${ process.argv.slice(2) }`;
        
        if (!rPath) throw new Error(errorMessage);

        const normedPath = normalizePath(rPath);
        if (normedPath.match(/\s/)) {
            throw new Error("Paths with spaces are not supported."); 
        }

        const [owner, repo, ...rest] = normedPath.split("/");

        if (!owner || !repo) throw new Error(errorMessage);

        ownerGroup[owner] ??= {};
        ownerGroup[owner]![repo] ??= [];
        if (rest.length) ownerGroup[owner]![repo]!.push(rest.join("/"));
    }
    return ownerGroup;
}

interface ParsedGroup {
    gheInstance: GithubExtractor;
    selectedFiles?: string[];
    regex?: RegExp;
}

export function parseOwnerGroups(
    { ownerGrouping, listMode, caseInsensitive }: 
    { ownerGrouping: OwnerGroup; listMode: boolean; caseInsensitive: boolean }

): ParsedGroup[] {
    const parsedGroups: ParsedGroup[] = [];

    for (const owner in ownerGrouping) {
        for (const repo in ownerGrouping[owner]) {

            let rawPaths = ownerGrouping[owner]![repo]!;

            const gheInstance = new GithubExtractor({ owner, repo, caseInsensitive });

            // List method on backing class has no "selectedFiles". So all paths become a regex.
            // Also, If just one path contains a glob in an array of selections, then all must be 
            //  converted to regexp and then combined into one big regex.
            if (listMode || rawPaths.some(rPath => pico.scan(rPath).isGlob)) {

                const regexes = rawPaths.map(rPath => pico.compileRe(pico.parse(rPath), {
                    nocase: caseInsensitive,
                }));
                const combinedSources = regexes.map(r => r.source).join("|");
                const combinedFlags = regexes.map(r => r.flags).join("");
                const regex = new RegExp(combinedSources, combinedFlags);

                parsedGroups.push({ gheInstance, regex });
            }
            else {
                parsedGroups.push({ gheInstance, selectedFiles: rawPaths });
            }
        }
    }
    return parsedGroups;
}


function handleTypos(typos: Typo[]) {
    // type Typo = [original: string, correction: string];

    if (!flags.quiet) {
        const header = `\
            Found the following possible typos:
            (original -> suggested correction)

        `;
        let body = typos.map(t => `${ c.warning(t[0]) } -> ${ c.success(t[1]) }`).join("\n");
        console.log(indentString(header + body, 2));
    }
}

export async function executeParsedGroups(
    { listMode, conflictsOnly, parsedGroups, dest, keepIf }: 
    { listMode: boolean; conflictsOnly: boolean; parsedGroups: ParsedGroup[]; dest: string; keepIf: string | undefined }

): Promise<void> {
    for (const group of parsedGroups) {

        if (listMode) {

            const opts = { conflictsOnly, dest, match: group.regex! };
            await group.gheInstance.list(opts);
            continue;
        }
        else {
            const opts = {
                dest,
                ...(group.selectedFiles && { selectedPaths: group.selectedFiles }),
                ...(group.regex && { match: group.regex }),
                extractOptions: {
                    "keep-existing": keepIf && keepIf === "existing" ? true : undefined,
                    "keep-newer": keepIf && keepIf === "newer" ? true : undefined,
                },
            };
            const typos = await group.gheInstance.downloadTo(opts);
            handleTypos(typos);
        }
    }
}

