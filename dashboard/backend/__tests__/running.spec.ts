import { constraintsMet, constraintsMetBody, constraintsMetHeader, extractJSPathParameters, generateRequestData, getRunnerEndpoint, makeFailedRun } from "../src/running";
import { Pipeline } from "../src/entities/Pipeline";
import { Request } from "express";
import { Run } from "../src/entities/Run";
import { Runner } from "../src/entities/Runner";

describe("Checks if constraints are met", () => {
    test("Vacuously true", async () => {
        const pipeline = new Pipeline();
        pipeline.plan = {};
        expect(await constraintsMet({ pipeline: pipeline } as Request)).toBeTruthy();
    });
    test("False if there is no plan", async () => {
        expect(await constraintsMet({} as Request)).toBeFalsy();
    });
    test("True if both header and body constraints are met", async () => {
        const pipeline = new Pipeline();
        pipeline.plan = {
            constrainHeaders: {
                foo: "bar",
            },
            constrainBody: {
                ".lorem": ["ipsum"],
            },
        };
        const request = {
            pipeline: pipeline,
            headers: {
                foo: "bar",
            },
            body: {
                lorem: "ipsum",
            },
        };
        expect(await constraintsMet(request as unknown as Request)).toBeTruthy();
    });
    test("False if only header constraints are met", async () => {
        const pipeline = new Pipeline();
        pipeline.plan = {
            constrainHeaders: {
                foo: "bar",
            },
            constrainBody: {
                ".lorem": ["ipsum"],
            },
        };
        const request = {
            pipeline: pipeline,
            headers: {
                foo: "bar",
            },
        };
        expect(await constraintsMet(request as unknown as Request)).toBeFalsy();
    });
    test("False if only body constraints are met", async () => {
        const pipeline = new Pipeline();
        pipeline.plan = {
            constrainHeaders: {
                foo: "bar",
            },
            constrainBody: {
                ".lorem": ["ipsum"],
            },
        };
        const request = {
            pipeline: pipeline,
            headers: {},
            body: {
                lorem: "ipsum",
            },
        };
        expect(await constraintsMet(request as unknown as Request)).toBeFalsy();
    });
});
describe("Checks if header constraints are met", () => {
    test("Single value is met", async () => {
        const request = {
            headers: {
                foo: "bar",
            },
        };
        expect(await constraintsMetHeader(request as unknown as Request, { foo: "bar" })).toBeTruthy();
    });
    test("Single value is not met", async () => {
        const request = {
            headers: {},
        };
        expect(await constraintsMetHeader(request as unknown as Request, { foo: "bar" })).toBeFalsy();
    });
    test("Multiple single values are met", async () => {
        const request = {
            headers: {
                foo: "bar",
                lorem: "ipsum",
            },
        };
        expect(await constraintsMetHeader(request as unknown as Request, { foo: "bar", lorem: "ipsum" })).toBeTruthy();
    });
    test("Muliple values are met", async () => {
        const request = {
            headers: {
                foo: "bar",
            },
        };
        expect(await constraintsMetHeader(request as unknown as Request, { foo: ["bar", "baz"] })).toBeTruthy();
    });
    test("Muliple values are not met", async () => {
        const request = {
            headers: {
                foo: "hello",
            },
        };
        expect(await constraintsMetHeader(request as unknown as Request, { foo: ["bar", "baz"] })).toBeFalsy();
    });
});
describe("Checks if body constraints are met", () => {
    test("Single value is met", async () => {
        const request = {
            body: {
                foo: "bar",
            },
        };
        expect(await constraintsMetBody(request as unknown as Request, { ".foo": ["bar"] })).toBeTruthy();
    });
    test("Single value is not met", async () => {
        const request = {
            body: {},
        };
        expect(await constraintsMetBody(request as unknown as Request, { ".foo": ["bar"] })).toBeFalsy();
    });
    test("Multiple values are met", async () => {
        const request = {
            body: {
                foo: "bar",
                lorem: "ipsum",
            },
        };
        expect(await constraintsMetBody(request as unknown as Request, { ".foo": ["bar"], ".lorem": ["ipsum"] })).toBeTruthy();
    });
    test("Muliple values are not met", async () => {
        const request = {
            body: {
                foo: "bar",
                lorem: "hi",
            },
        };
        expect(await constraintsMetBody(request as unknown as Request, { ".foo": ["bar"], ".lorem": ["ipsum"] })).toBeFalsy();
    });
});
describe("Generating the run request", () => {
    test("Correctly injects parameters", async () => {
        const config = {
            parameters: undefined,
            stages: [
                {
                    name: "hello %foo%",
                    image: "bar %foo%",
                    runtime: "%foo%",
                    environment: [
                        "LOREM=this is %foo%",
                        "IPSUM=this is not replaced",
                    ],
                    script: [
                        "echo \"%foo%\"",
                    ],
                },
                {
                    name: "fantastic",
                    image: "world",
                },
            ],
        };
        const expected = {
            runId: "abcdef",
            plan: {
                stages: [
                    {
                        name: "hello bar",
                        image: "bar bar",
                        runtime: "bar",
                        environment: [
                            "LOREM=this is bar",
                            "IPSUM=this is not replaced",
                        ],
                        script: [
                            "echo \"bar\"",
                        ],
                    },
                    {
                        name: "fantastic",
                        image: "world",
                    },
                ],
            },
        };
        expect(await generateRequestData("abcdef", config, { foo: "bar" })).toEqual(expected);
    });
});
describe("Fake failed run maker", () => {
    test("Makes a failed run", () => {
        const time = Date.now();
        const expected = new Run();
        expected.pipeline = 1;
        expected.run_id = "123abc";
        expected.start = time.toString();
        expected.finish = time.toString();
        expected.outcome = {
            status: "Failed",
            stages: [{
                name: "Foo Bar",
                status: "Failed",
                exitCode: -1,
            }],
        };
        expect(makeFailedRun(1, "123abc", "Foo Bar", time)).toEqual(expected);
    });
});
describe("Parameter extractor", () => {
    test("Returns an empty object when there are no parameters", () => {
        const plan = { 
            parameters: undefined,
            stages: [],
        };
        expect(extractJSPathParameters(plan, { hello: "world" })).toEqual({});
    });
    test("Returns correct parameters", () => {
        const plan = {
            parameters: {
                foo: ".bar",
            },
            stages: [],
        };
        const body = {
            bar: "baz",
            lorem: "ipsum",
        };
        expect(extractJSPathParameters(plan, body)).toEqual({ foo: "baz" });
    });
    test("Returns correct and undefined parameters", () => {
        const plan = {
            parameters: {
                foo: ".bar",
                lorem: ".ipsum",
                hello: null,
            },
            stages: [],
        };
        const body = {
            bar: "baz",
        };
        expect(extractJSPathParameters(plan, body)).toEqual({ foo: "baz", lorem: undefined });
    });
    test("Ignores invalid JSPath", () => {
        const plan = {
            parameters: {
                foo: ".bar",
                lorem: "--123--",
            },
            stages: [],
        };
        const body = {
            bar: "baz",
            hello: "world",
        };
        expect(extractJSPathParameters(plan, body)).toEqual({ foo: "baz" });
    });
});
describe("Endpoint creator", () => {
    test("Concatenates a string", async () => {
        const runner = new Runner();
        runner.id = 1;
        runner.name = "Usain Bolt";
        runner.hostname = "http://127.0.0.1:3001";
        expect(getRunnerEndpoint(runner, "/test")).toEqual("http://127.0.0.1:3001/test");
    });
});