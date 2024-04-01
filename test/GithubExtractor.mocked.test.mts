
import { GithubExtractor } from "../source/GithubExtractor.mjs";
import { APIFetchError } from "../source/custom-errors.mjs";

import { describe, expect, it, vi, beforeEach, afterEach, afterAll, beforeAll, VitestUtils } from "vitest";
import sinon, { SinonSpy } from "sinon";


const TEST_OWNER = "octocat";
const TEST_REPO = "Spoon-Knife";


beforeAll(() => {
    sinon.restore();
    vi.restoreAllMocks();
});

beforeEach(() => {
    sinon.restore();
    vi.restoreAllMocks();
});

afterEach(() => {
    // sinon.restore();
    // vi.restoreAllMocks();
});


describe("makeRequest and handleBadResponse", () => {

    it("should call request with the right args", async() => {

        const fakeReqFn = sinon.fake.resolves({
            statusCode: 200,
            body: "test",
            headers: {
                "content-type": "text/plain",
            },
        });

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        ghe["requestFn"] = fakeReqFn;
        
        const res = await ghe["makeRequest"]("someurl");
 
        expect(fakeReqFn.firstCall.args[0]).toBe("someurl");

        expect(res.statusCode).toBe(200);
        expect(res.headers).toEqual({ "content-type": "text/plain" });
        expect(res.body).toBe("test");
        expect(res.url).toBe("someurl");
        
    });

    it("should handle a 404 response correctly", async() => {

        const fakeReqFn = sinon.fake.resolves({
            statusCode: 404,
            body: { text: sinon.fake.resolves("test") },
            headers: {
                "content-type": "text/plain",
            },
        });

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        ghe["requestFn"] = fakeReqFn;
            
        await expect(ghe["makeRequest"]("someurl")).rejects.toThrow(APIFetchError);

        expect(fakeReqFn.firstCall.args[0]).toBe("someurl");
    });

    it("should notify if the rate limit is exceeded", async() => {

        const fakeReqFn = sinon.fake.resolves({
            statusCode: 404,
            body: { text: sinon.fake.resolves("test") },
            headers: {
                "x-ratelimit-remaining": 0,
                "x-ratelimit-reset": "1234567890",
            },
        });

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        ghe["requestFn"] = fakeReqFn;

        try {
            await ghe["makeRequest"]("someurl");
        }
        catch (error) {
            expect(error).toBeInstanceOf(APIFetchError);
            // @ts-expect-error testing
            expect(error.message).toMatch(/Rate limit exceeded/i);
        }

        expect(fakeReqFn.firstCall.args[0]).toBe("someurl");
    });

    it("should handle the reset number being unreconizable", async() => {

        const fakeReqFn = sinon.fake.resolves({
            statusCode: 404,
            body: { text: sinon.fake.resolves("test") },
            headers: {
                "x-ratelimit-remaining": 0,
                "x-ratelimit-reset": undefined,
            },
        });

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        ghe["requestFn"] = fakeReqFn;

        try {
            await ghe["makeRequest"]("someurl");
        }
        catch (error) {
            expect(error).toBeInstanceOf(APIFetchError);
            // @ts-expect-error testing
            expect(error.message).toMatch(/Rate limit exceeded/i);
        }

        expect(fakeReqFn.firstCall.args[0]).toBe("someurl");
    });


    it("should handle when request throws", async() => {

        const fakeReqFn = sinon.fake.rejects(new Error("test"));

        const ghe = new GithubExtractor({
            owner: TEST_OWNER,
            repo: TEST_REPO,
        });

        ghe["requestFn"] = fakeReqFn;
            
        await expect(ghe["makeRequest"]("someurl")).rejects.toThrow(/Error getting/i);

        expect(fakeReqFn.firstCall.args[0]).toBe("someurl");
    });

});

