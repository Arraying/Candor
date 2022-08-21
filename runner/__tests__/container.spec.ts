import { getOverrideConfig, getTimeoutPromise, StageTimeoutError } from "../src/management/container";

describe("Timeout parsing tests", () => {
    const env = process.env;
    beforeEach(() => {
        jest.resetModules();
        process.env = { ...env };
    });
    afterEach(() => {
        process.env = env;
    });
    test("Returns null when not specified", () => {
        expect(getTimeoutPromise()).toBeNull();
    })
    test("Returns null when < 0", () => {
        process.env.RUNNER_CONTAINER_TIMEOUT = "-234";
        expect(getTimeoutPromise()).toBeNull();
    });
    test("Returns promise when specified", async () => {
        process.env.RUNNER_CONTAINER_TIMEOUT = "1";
        const promise = getTimeoutPromise();
        expect(promise).not.toBeNull();
        try {
            // This will never resolve.
            await promise;
            fail();
        } catch (error) {
            expect(error).toBeInstanceOf(StageTimeoutError);
        }
    });
});

describe("Overridge config tests", () => {
    test("Returns an empty object when unspecified", () => {
        expect(getOverrideConfig()).toStrictEqual({});
    });
    test("Returns an object when specified", () => {
        const object = {
            Labels: {"foo": "bar"},
        };
        const objectString = JSON.stringify(object);
        const objectBase64 = Buffer.from(objectString).toString("base64");
        process.env.RUNNER_CONTAINER_CONFIG_B = objectBase64;
        expect(getOverrideConfig()).toStrictEqual(object);
    });
    test("Returns nothing when invalid JSON", () => {
        process.env.RUNNER_CONTAINER_CONFIG_B = "hello world";
        expect(getOverrideConfig()).toStrictEqual({});
    });
});