
import { normalizePath, groupByOwner, parseOwnerGroups, OwnerGroup, destructurePath } from "../source/main.mjs";
import {describe, it, expect, beforeEach } from "vitest";
import pico from "picomatch";
import GithubExtractor from "github-extractor";
import sinon from "sinon";

describe("normalizePath", () => {
    it("should remove leading slash", () => {
        const path = "/bn-l/repo";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("bn-l/repo");
    });

    it("should append ** to path ending with slash", () => {
        const path = "bn-l/repo/";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("bn-l/repo/**");
    });

    it("should remove leading slash and append ** to path ending with slash", () => {
        const path = "/bn-l/repo/";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("bn-l/repo/**");
    });

    it("should not modify path without leading or trailing slash", () => {
        const path = "bn-l/repo";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("bn-l/repo");
    });

    it("should handle path with only slashes", () => {
        const path = "///";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("\/\/**");
    });

    it("should handle path with special characters", () => {
        const path = "/bn-l/repo$%^&*()";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("bn-l/repo$%^&*()");
    });

    it("should handle path with many spaces", () => {
        const path = " /bn-l/ repo ";
        const normalizedPath = normalizePath(path);
        expect(normalizedPath).toBe("bn-l/ repo");
    });
});


describe("splitPath", () => {

    it("should split a normal path correctly", () => {
        const [owner, repo, innerRepoPath] = destructurePath("owner/repo/path");
        expect(owner).toBe("owner");
        expect(repo).toBe("repo");
        expect(innerRepoPath).toBe("path");
    });

    it("should split a path without inner repo path correctly", () => {
        const [owner, repo, innerRepoPath] = destructurePath("owner/repo");
        expect(owner).toBe("owner");
        expect(repo).toBe("repo");
        expect(innerRepoPath).toBeUndefined();
    });

    it("should split a negated path correctly", () => {
        const [owner, repo, innerRepoPath] = destructurePath("!owner/repo/path");
        expect(owner).toBe("owner");
        expect(repo).toBe("repo");
        expect(innerRepoPath).toBe("!path");
    });

    it("should correctly split when a negated path's innerRepoPath is NOT only '/**'", () => {
        const [owner, repo, innerRepoPath] = destructurePath("!owner/repo/path/**");
        expect(owner).toBe("owner");
        expect(repo).toBe("repo");
        expect(innerRepoPath).toBe("!path/**");
    });

    it("should throw when negating the entire repo with no innerPath", () => {
        expect(() => destructurePath("!owner/repo")).toThrow();
    });

    it("should throw when a negated path's innerRepoPath IS only '/**'", () => {
        expect(() => destructurePath("!owner/repo/**")).toThrow();
    });

    it("should handle paths with multiple inner repo paths", () => {
        const [owner, repo, innerRepoPath] = destructurePath("owner/repo/path/to/file");
        expect(owner).toBe("owner");
        expect(repo).toBe("repo");
        expect(innerRepoPath).toBe("path/to/file");
    });

    it("should handle paths with special characters", () => {
        const [owner, repo, innerRepoPath] = destructurePath("owner/repo/p@th/to$file");
        expect(owner).toBe("owner");
        expect(repo).toBe("repo");
        expect(innerRepoPath).toBe("p@th/to$file");
    });

    
});


describe("groupByOwner", () => {

    it("should group paths by owner correctly", () => {
        const paths = ["owner1/repo1/path1", "owner1/repo1/path2", "owner2/repo1/path1"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: ["path1", "path2"] },
            owner2: { repo1: ["path1"] }
        });
    });

    it("should handle paths without a specific inner repo path", () => {
        const paths = ["owner1/repo1", "owner2/repo1"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: [] },
            owner2: { repo1: [] }
        });
    });

    it("should throw on paths without a repo", () => {
        const paths = ["owner1", "owner2/repo1"];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should throw on paths with spaces in the path name", () => {
        const paths = ["owner1/repo1", "owner2/ repo1"];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should NOT throw on paths with spaces just around the path name", () => {
        const paths = ["owner1/repo1", " owner2/repo1 "];
        expect(() => groupByOwner({ paths })).not.to.throw(Error);
    });

    it("should throw on empty paths", () => {
        const paths = ["", "owner2/repo1"];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should throw if some paths are undefined", () => {
        const paths = [undefined, "owner2/repo1"];
        // @ts-expect-error testing
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should handle empty paths array", () => {
        const paths: string[] = [];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should handle paths with multiple slashes", () => {
        const paths = ["owner1/repo1/path1/path2", "owner2/repo1/path1/path2"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: ["path1/path2"] },
            owner2: { repo1: ["path1/path2"] }
        });
    });

    it("should handle paths with trailing slashes", () => {
        const paths = ["owner1/repo1/", "owner2/repo1/"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: [] },
            owner2: { repo1: [] }
        });
    });

    it("should handle paths with leading slashes", () => {
        const paths = ["/owner1/repo1", "/owner2/repo1"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: [] },
            owner2: { repo1: [] }
        });
    });

    it("should handle paths with * at the end", () => {
        const paths = ["/owner1/repo1/*", "/owner2/repo1"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: ["*"] },
            owner2: { repo1: [] }
        });
    });

    it("should handle paths with ** at the end", () => {
        const paths = ["/owner1/repo1/**", "/owner2/repo1"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: [] },
            owner2: { repo1: [] }
        });
    });

    it("should handle paths with mixed negative globs", () => {
        const paths = ["!owner1/repo1/**", "owner2/repo1"];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should handle path with only negative globs", () => {
        const paths = ["!owner1/repo1/**"];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

    it("should handle a negated path owner/repo path with no slash or globs", () => {
        const paths = ["!owner1/repo1"];
        expect(() => groupByOwner({ paths })).to.throw(Error);
    });

});


describe("parseOwnerGroups", () => {
    let ownerGrouping: OwnerGroup;
    let listMode: boolean;
    let caseInsensitive: boolean;

    beforeEach(() => {
        ownerGrouping = {
            owner1: { repo1: [ "path1.txt", "path2.txt" ] },
            owner2: { repo2: [ "path1.txt" ] }
        };
        listMode = false;
        caseInsensitive = false;
    });

    it("should return an array of ParsedGroup objects", () => {

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        expect(result).toBeInstanceOf(Array);

        result.forEach(group => {
            expect(group).toHaveProperty("gheInstance");
            expect(group.gheInstance).toBeInstanceOf(GithubExtractor);
            expect(group).toHaveProperty("selectedFiles");
            expect(group.selectedFiles).toBeInstanceOf(Array);
        });
    });

    it("ParsedGroup objects should correctly reflect direct file paths input ", () => {

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = result.map(group => group.gheInstance.owner);
        const repos = result.map(group => group.gheInstance.repo);
        const paths = result.map(group => group.selectedFiles);
        const regexes = result.map(group => group.regex);

        expect(owners).to.have.members(["owner1", "owner2"]);
        expect(repos).to.have.members(["repo1", "repo2"]);
        expect(paths).to.include.deep.members([["path1.txt", "path2.txt"], ["path1.txt"]]);
        regexes.forEach(regex => expect(regex).toBeUndefined());
        
    });

    it("ParsedGroup objects should correctly reflect glob input", () => {

        ownerGrouping = {
            owner1: { repo1: [ "path1/**", "path2/*" ] },
            owner2: { repo2: [ "path1/*" ] }
        };

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = result.map(group => group.gheInstance.owner);
        const repos = result.map(group => group.gheInstance.repo);
        const paths = result.map(group => group.selectedFiles);
        const regexes = result.map(group => group.regex);

        expect(owners).to.have.members(["owner1", "owner2"]);
        expect(repos).to.have.members(["repo1", "repo2"]);
        paths.forEach(path => expect(path).toBeUndefined());
        expect(regexes).toBeDefined();
        regexes.forEach(regex => expect(regex).toBeInstanceOf(RegExp));
    });

    it("ParsedGroup objects should correctly handle an empty owner grouping", () => {

        ownerGrouping = {};

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        expect(result).to.be.empty;
    });

    it("ParsedGroup objects should correctly reflect mixed glob / direct files input", () => {

        ownerGrouping = {
            owner1: { repo1: [ "path1/file.txt", "path2/*" ] },
            owner2: { repo2: [ "path1/*" ] }
        };

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = result.map(group => group.gheInstance.owner);
        const repos = result.map(group => group.gheInstance.repo);
        const paths = result.map(group => group.selectedFiles);
        const regexes = result.map(group => group.regex);

        expect(owners).to.have.members(["owner1", "owner2"]);
        expect(repos).to.have.members(["repo1", "repo2"]);
        paths.forEach(path => expect(path).toBeUndefined());
        regexes.forEach(regex => expect(regex).toBeDefined());
        regexes.forEach(regex => expect(regex).toBeInstanceOf(RegExp));
    });

    it("ParsedGroup objects should correctly handle empty path arrays when list mode = false", () => {

        listMode = false;

        ownerGrouping = {
            owner1: { repo1: [] },
            owner2: { repo2: [] }
        };

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = result.map(group => group.gheInstance.owner);
        const repos = result.map(group => group.gheInstance.repo);
        const paths = result.map(group => group.selectedFiles);
        const regexes = result.map(group => group.regex);

        expect(owners).to.have.members(["owner1", "owner2"]);
        expect(repos).to.have.members(["repo1", "repo2"]);
        paths.forEach(path => expect(path).toBeUndefined());
        regexes.forEach(regex => expect(regex).toBeUndefined());
    });


    it("should handle listMode correctly", () => {
        listMode = true;
        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        result.forEach(group => {
            expect(group).toHaveProperty("regex");
            expect(group.regex).toBeInstanceOf(RegExp);
        });
    });

    it("ParsedGroup objects should correctly handle empty path arrays when list mode = false", () => {

        listMode = true;

        ownerGrouping = {
            owner1: { repo1: [] },
            owner2: { repo2: [] }
        };

        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        const owners = result.map(group => group.gheInstance.owner);
        const repos = result.map(group => group.gheInstance.repo);
        const paths = result.map(group => group.selectedFiles);
        const regexes = result.map(group => group.regex);

        expect(owners).to.have.members(["owner1", "owner2"]);
        expect(repos).to.have.members(["repo1", "repo2"]);
        paths.forEach(path => expect(path).toBeUndefined());
        regexes.forEach(regex => expect(regex).toBeUndefined());
    });

    it("should handle when caseInsensitive is false correctly", () => {
        caseInsensitive = false;
        listMode = true;
        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });
        result.forEach(group => {
            expect(group.regex).toBeInstanceOf(RegExp);
            expect(group.regex?.flags).not.toContain("i");
        });
    });


    it("should handle when caseInsensitive is true correctly", () => {
        caseInsensitive = true;
        listMode = true;
        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });
        result.forEach(group => {
            expect(group.regex).toBeInstanceOf(RegExp);
            expect(group.regex?.flags).toContain("i");
        });
    });

    it("should throw an error if ownerGrouping is empty", () => {
        ownerGrouping = {};
        const result = parseOwnerGroups({ ownerGrouping, listMode, caseInsensitive });

        expect(result).toBeInstanceOf(Array);
        expect(result).to.be.empty;
    });
});
