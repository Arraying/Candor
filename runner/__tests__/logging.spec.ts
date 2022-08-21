import { mkdirSync } from "fs";
import { makeLogDirectory, promiseWrite, verifyPath } from "../src/logging";

jest.mock("fs", () => ({
    mkdirSync: jest.fn(),
    createWriteStream: jest.fn(),
}));

describe("Logger tests", () => {
    const env = process.env;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...env };
    });
    afterEach(() => {
        process.env = env;
    });
    test("Fails when the directory cannot be created", () => {
        // @ts-ignore
        mkdirSync.mockImplementation(() => {
            throw new Error("test error");
        });
        expect(makeLogDirectory).toThrowError();
    });
    test("Fails when someone is trying to access a file not in the logger path", () => {
        process.env.RUNNER_LOGS = "/var/candor/logs";
        expect(verifyPath("../../www/html/index.html")).toBeFalsy();
    });
    test("Handles write errors correctly", async () => {
        const fakeWriter = {
            write(_: any, callback?: (error: Error | null | undefined) => void): boolean {
                const error = new Error("test error");
                if (callback) {
                    callback(error);
                }
                return false;
            },
        }
        try {
            // @ts-ignore
            await promiseWrite(fakeWriter, "text");
            fail();
        } catch (error) {
            expect(error).toBeInstanceOf(Error);
        }
    });
});