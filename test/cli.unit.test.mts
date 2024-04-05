
import { getCli, c, Option } from "../source/cli.mjs";
import {describe, it, expect, beforeEach, afterEach } from "vitest";
import sinon from 'sinon';
import stripAnsi from "strip-ansi";

describe("CLI tests", () => {

    it("--dest flag", () => {
        process.argv = ["node", "cli.mts", "--dest", "test", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.dest]).toBe("test");
    });

    it("--list flag", () => {
        process.argv = ["node", "cli.mts", "--list", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.list]).toBe(true);
    });

    it("--conflictsOnly flag", () => {
        process.argv = ["node", "cli.mts", "--conflictsOnly", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.conflictsOnly]).toBe(true);
    });

    it("--caseInsensitive flag", () => {
        process.argv = ["node", "cli.mts", "--caseInsensitive", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.caseInsensitive]).toBe(true);
    });

    it("--quiet flag", () => {
        process.argv = ["node", "cli.mts", "--quiet", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.quiet]).toBe(true);
    });

    it("--echoPaths flag sets correctly and also triggers quiet", () => {
        process.argv = ["node", "cli.mts", "--echo-paths", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.echoPaths]).toBe(true);
        expect(cli.flags[Option.quiet]).toBe(true);
    });

    it("should throw an error if no path is given", () => {
        process.argv = ["node", "cli.mts"];
        expect(() => getCli()).toThrow();
    });

    it("should throw an error if an unrecognised option is given", () => {
        process.argv = ["node", "cli.mts", "--yooooooooo-goooooooooooo", "some/path"];
        expect(() => getCli()).toThrow();
    });

    it("options have the correct defaults when no options / option values are given", () => {
        process.argv = ["node", "cli.mts", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.dest]).toBe(process.cwd());
        expect(cli.flags[Option.list]).toBeFalsy();
        expect(cli.flags[Option.conflictsOnly]).toBeFalsy();
        expect(cli.flags[Option.caseInsensitive]).toBeFalsy();
        expect(cli.flags[Option.quiet]).toBe(false);
        expect(cli.flags[Option.echoPaths]).toBeFalsy();
    });

});

describe("Color var tests", async () => {

    // ----------------- Colors ------------ //

    const importedGetCli = async (envVar: string) => {
        process.argv = ["node", "cli.mts", "some/path"];
        process.env.NO_COLOR = envVar;
        const getCli = await import("../source/cli.mjs").then(m => m.getCli);
        const cli = getCli();
        return cli;
    }

    for (const positive of ["true", "yes", "on"]) {
        it(`when NO_COLOR environment variable is equal to ${positive}, colors flag default should be false`, async () => {

            const cli = await importedGetCli(positive);
            expect(cli.flags[Option.colors]).toBe(false);
        });
    }

    it("when NO_COLOR environment variable is undefined colors flag default should be true", async () => {

        process.argv = ["node", "cli.mts", "some/path"];

        // @ts-expect-error testing
        const cli = await importedGetCli(undefined);
        expect(cli.flags[Option.colors]).toBe(true);
    });

    
    it("--colors flag", () => {
        process.argv = ["node", "cli.mts", "--colors", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.colors]).toBe(true);
    });

    it("--no-colors flag", () => {
        process.argv = ["node", "cli.mts", "--no-colors", "some/path"];
        const cli = getCli();
        expect(cli.flags[Option.colors]).toBe(false);
    });

});


describe('color printer tests', () => {

    const testCases = [
        'error',
        'warning',
        'success',
        'info',
        'strong',
        'careful',
        'example',
        'binColor',
    ];

    testCases.forEach((method) => {
        it(`should correctly log the ${method} with color`, () => {
            c.showColor = true;
            // @ts-expect-error testing
            const stripped = stripAnsi(c[method]('test'));
            expect(stripped).to.match(/test/);
        });

        it(`should correctly log ${method} without color`, () => {
            c.showColor = false;
            // @ts-expect-error testing
            const stripped = stripAnsi(c[method]('test'));
            expect(stripped).to.match(/test/);
        });
    });
});