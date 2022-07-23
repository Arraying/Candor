import { Request, Response } from "express";
import { authorizationMiddleware } from "../src/middleware";

describe("Authorization middleware", () => {
    test("Reject when no token is provided", () => {
        process.env.RUNNER_TOKEN = "Foo";
        const [req, res, next, status] = variables(undefined);
        authorizationMiddleware(req, res, next);
        expect(status).toBeCalledWith(400);
        expect(next).toBeCalledTimes(0);
    });
    test("Reject when no token is setup", () => {
        process.env.RUNNER_TOKEN = undefined;
        const [req, res, next, status] = variables("Bearer Foo");
        authorizationMiddleware(req, res, next);
        expect(status).toBeCalledWith(401);
        expect(next).toBeCalledTimes(0);
    });
    test("Reject when no valid token is provided", () => {
        process.env.RUNNER_TOKEN = "";
        const [req, res, next, status] = variables("Bearer Foo");
        authorizationMiddleware(req, res, next);
        expect(status).toBeCalledWith(401);
        expect(next).toBeCalledTimes(0);
    });
    test("Reject when token does not start with Bearer", () => {
        process.env.RUNNER_TOKEN = "Foo";
        const [req, res, next, status] = variables("Foo");
        authorizationMiddleware(req, res, next);
        expect(status).toBeCalledWith(401);
        expect(next).toBeCalledTimes(0);
    });
    test("Reject when token does not match", () => {
        process.env.RUNNER_TOKEN = "Foo";
        const [req, res, next, status] = variables("Bearer Bar");
        authorizationMiddleware(req, res, next);
        expect(status).toBeCalledWith(401);
        expect(next).toBeCalledTimes(0);
    });
    test("Pass when token is correct", () => {
        process.env.RUNNER_TOKEN = "Foo";
        const [req, res, next, status] = variables("Bearer Foo");
        authorizationMiddleware(req, res, next);
        expect(status).toBeCalledTimes(0);
        expect(next).toBeCalled();
    });
});

// eslint-disable-next-line
function variables(token?: string): [Request, Response, jest.Mock<any, any>, jest.Mock<any, any>] {
    const status = jest.fn();
    const req = {
        headers: {
            authorization: token,
        },
    } as Request;
    const res = {
        sendStatus: status,
        // eslint-disable-next-line
    } as any as Response;
    const next = jest.fn();
    return [req, res, next, status];
}