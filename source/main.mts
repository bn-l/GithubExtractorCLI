
import { c } from "./cli.mjs";

import pico from "picomatch";
import GithubExtractor, { Typo, ListOptions, DownloadToOptions } from "github-extractor";
import { ReadEntry } from "tar";


export function normalizePath(rPath: string) {
    rPath = rPath.trim();
    if (rPath.startsWith("/")) {
        rPath = rPath.slice(1);
    }
    if (rPath.endsWith("/")) {
        rPath += "**";
    }
    return rPath;
}


export function destructurePath(normedPath: string): [string | undefined, string | undefined, string | undefined] {

    let [owner, repo, ...rest] = normedPath.split("/");
    let innnerRepoPath = rest.join("/");

    if (owner?.startsWith("!")) {
        owner = owner.slice(1);
        
        if (!innnerRepoPath || innnerRepoPath === "**") {
            throw new Error("Cannot negate the entire repo.");
        }
        else if (innnerRepoPath) {
            innnerRepoPath = "!" + innnerRepoPath; 
        }   
    }
    // if no inner path or path is just **, only need the owner/repo
    if (!innnerRepoPath || innnerRepoPath === "**") return [owner, repo, undefined];
    else return [owner, repo, innnerRepoPath];
}


//                                                                paths[] 
export interface OwnerGroup { [owner: string]: { [repo: string]: string[] } }

export function groupByOwner({ paths }:{ paths: string[] }): OwnerGroup {
    
    if (paths.length === 0) throw new Error("No paths were provided.");

    const ownerGroup: OwnerGroup = {};

    for (const rPath of paths) {

        const badArgsMessage = `Invalid path. Must be in the format: "owner/repo/path" or just "owner/repo". Received "${ rPath }" when parsing the arguments:` + process.argv.slice(2).map(a => `"${ a }"`).join(", ");
        
        const normedPath = normalizePath(rPath);
        if (!normedPath) throw new Error(badArgsMessage);
        if (normedPath.match(/\s/)) throw new Error("Paths with spaces are not supported."); 
        
        const split = destructurePath(normedPath);
        
        const [owner, repo, innerRepoPath] = split;
        if (!owner || !repo) throw new Error(badArgsMessage);

        ownerGroup[owner] ??= {};
        ownerGroup[owner]![repo] ??= [];
        if (innerRepoPath) ownerGroup[owner]![repo]!.push(innerRepoPath);
    }
    return ownerGroup;
}

export interface ParsedGroup {
    gheInstance: GithubExtractor;
    selectedFiles?: string[];
    regex?: RegExp;
}

// The backing class takes a single regex match argument so paths with globs need to be 
//  converte to regex.

export function parseOwnerGroups(
    { ownerGrouping, listMode, caseInsensitive }: 
    { ownerGrouping: OwnerGroup; listMode: boolean; caseInsensitive: boolean }

): ParsedGroup[] {
    const parsedGroups: ParsedGroup[] = [];

    for (const owner of Object.keys(ownerGrouping)) {
        for (const repo of Object.keys(ownerGrouping[owner]!)) {

            const rawPaths = ownerGrouping[owner]![repo]!;

            const gheInstance = new GithubExtractor({ owner, repo, caseInsensitive });

            if (rawPaths.length === 0) {
                
                parsedGroups.push({ gheInstance });
            }
            else if (listMode || rawPaths.some(rPath => pico.scan(rPath).isGlob)) {

                // List method on backing class has no "selectedFiles". So all paths become a regex.
                // Also, If just one path contains a glob in an array of selections, then all 
                // must be converted to regexp and then combined into one big regex.

                const regexes = rawPaths.map(rPath => pico.compileRe(pico.parse(rPath), {
                    nocase: caseInsensitive,
                }));
                const combinedSources = regexes.map(r => r.source).join("|");
                const combinedFlags = [...(new Set(regexes.map(r => r.flags)))].join("");
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


export async function executeParsedGroups(
    { listMode, conflictsOnly, parsedGroups, dest, quiet, prefix, force, echoPaths, strip }: 
    { listMode: boolean; conflictsOnly: boolean; parsedGroups: ParsedGroup[]; dest: string; quiet: boolean; prefix: boolean; force: boolean; echoPaths: boolean; strip: number | undefined }

): Promise<string[]> {

    const onFileWritten = (entry: ReadEntry) => console.log(entry.path);

    const typoMessages = [];

    for (const group of parsedGroups) {

        if (listMode) {
            const outPrefix = prefix ? 
                `${ group.gheInstance.owner }/${ group.gheInstance.repo }/` : 
                "";
            const opts: ListOptions = { conflictsOnly, dest, match: group.regex!, streamOptions: { prefix: outPrefix } };
            await group.gheInstance.list(opts);
            continue;
        }
        else {
            const opts: DownloadToOptions = {
                dest,
                ...(group.selectedFiles && { selectedPaths: group.selectedFiles }),
                ...(group.regex && { match: group.regex }),
                extractOptions: {
                    strip,
                    "keep-existing": !force,
                },
                ...(echoPaths && { onFileWritten }),
            };

            const typos = await group.gheInstance.downloadTo(opts);
            if (typos.length) {
                typoMessages.push(typos.map(t => `${ c.warning(t[0]) } -> ${ c.success(t[1]) }`).join("\n"));
            }
        }
    }

    return typoMessages;
}
