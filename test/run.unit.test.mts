
import { normalizePath, groupByOwner } from "../source/run.mjs";
import {describe, it, expect} from "vitest";


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
            owner1: { repo1: ["**"] },
            owner2: { repo1: ["**"] }
        });
    });

    it("should handle paths with leading slashes", () => {
        const paths = ["/owner1/repo1", "/owner2/repo1"];
        const result = groupByOwner({ paths });
        expect(result).to.deep.equal({
            owner1: { repo1: ["**"] },
            owner2: { repo1: ["**"] }
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
            owner1: { repo1: ["**"] },
            owner2: { repo1: [] }
        });
    });

});