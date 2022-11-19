import { Request, Response } from "express";
import { pipelineInspectBuilder, pipelineInteractBuilder } from "../src/middleware/security";
import { Pipeline } from "../src/entities/Pipeline";
import { User } from "../src/entities/User";

describe("Inspecting the pipeline", () => {
    test("Gets a public pipeline without being a user", async () => {
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = true;
        pipeline.assignees = [];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, _] = variables();
        await pipelineInspectBuilder(extractor)(req, res, next);
        expect(next).toBeCalled();
    });
    test("Rejects a nonexistent pipeline", async () => {
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(null);
        const [req, res, next, sendStatus] = variables();
        await pipelineInspectBuilder(extractor)(req, res, next);
        expect(next).not.toBeCalled();
        expect(sendStatus).toBeCalledWith(404);
    });
    test("Gets a public pipeline with being a user", async () => {
        const user = new User();
        user.id = 1;
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = false;
        pipeline.assignees = [user];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, _] = variables(user);
        await pipelineInspectBuilder(extractor)(req, res, next);
        expect(next).toBeCalled();
    });
    test("Rejects a private pipeline without being a user", async () => {
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = false;
        pipeline.assignees = [];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, sendStatus] = variables();
        await pipelineInspectBuilder(extractor)(req, res, next);
        expect(next).not.toBeCalled();
        expect(sendStatus).toBeCalledWith(403);
    });
    test("Rejects a private pipeline with being a user", async () => {
        const user1 = new User();
        user1.id = 1;
        const user2 = new User();
        user2.id = 2;
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = false;
        pipeline.assignees = [user1];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, sendStatus] = variables(user2);
        await pipelineInspectBuilder(extractor)(req, res, next);
        expect(next).not.toBeCalled();
        expect(sendStatus).toBeCalledWith(403);
    });
});

describe("Interacting with a pipeline", () => {
    test("Gets a private pipeline with being a user", async () => {
        const user = new User();
        user.id = 1;
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = false;
        pipeline.assignees = [user];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, _] = variables(user);
        await pipelineInteractBuilder(extractor)(req, res, next);
        expect(next).toBeCalled();
    });
    test("Rejects a nonexistant pipeline", async () => {
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(null);
        const [req, res, next, sendStatus] = variables();
        await pipelineInteractBuilder(extractor)(req, res, next);
        expect(next).not.toBeCalled();
        expect(sendStatus).toBeCalledWith(404);
    });
    test("Rejects a private pipeline without being a user", async () => {
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = false;
        pipeline.assignees = [];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, sendStatus] = variables();
        await pipelineInteractBuilder(extractor)(req, res, next);
        expect(next).not.toBeCalled();
        expect(sendStatus).toBeCalledWith(403);
    });
    test("Rejects a private pipeline with being a user", async () => {
        const user1 = new User();
        user1.id = 1;
        const user2 = new User();
        user2.id = 2;
        const pipeline = new Pipeline();
        pipeline.id = 1;
        pipeline.name = "Test";
        pipeline.plan = {};
        pipeline.public = false;
        pipeline.assignees = [user1];
        pipeline.token = "token";
        const extractor = (_: Request): Promise<Pipeline | null> => Promise.resolve(pipeline);
        const [req, res, next, sendStatus] = variables(user2);
        await pipelineInteractBuilder(extractor)(req, res, next);
        expect(next).not.toBeCalled();
        expect(sendStatus).toBeCalledWith(403);
    });
});

// eslint-disable-next-line
function variables(user?: User): [Request, Response, jest.Mock<any, any>, jest.Mock<any, any>] {
    const status = jest.fn();
    const req = {
        session: {
            user: user,
        }
    } as Request;
    const res = {
        sendStatus: status,
        // eslint-disable-next-line
    } as any as Response;
    const next = jest.fn();
    return [req, res, next, status];
}