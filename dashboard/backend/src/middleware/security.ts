import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

type Middleware = (req: Request, res: Response, next: () => void) => Promise<void>;

/**
 * Middleware that ensures the pipeline exists and the user is allowed to inspect it.
 * This means public pipeline or assigned to private pipeline.
 * @param extractor The extractor.
 * @returns A middleware that performs as describes.
 */
export function pipelineInspectBuilder(extractor: (req: Request) => Promise<Pipeline | null>): Middleware {
    return async (req: Request, res: Response, next: () => void) => {
        const queriedPipeline = await extractor(req);
        // If the pipeline does not exist, error.
        if (!queriedPipeline) {
            res.sendStatus(404);
            return;
        }
        // See if the user is assigned.
        const isUserAssigned = queriedPipeline.assignees.some((user: User): boolean => {
            return user.id === req.session.user?.id;
        });
        // Reject if the user is not assigned.
        if (!queriedPipeline.public && !isUserAssigned) {
            res.sendStatus(403);
            return;
        }
        // Everything is okay, set the pipeline and go to next in middleware.
        req.pipeline = queriedPipeline;
        next();
    };
}

/**
 * Ensures the pipeline exists and the user is allowed to interact with it.
 * @param extractor The extractor.
 * @return A middleware that performs as described.
 */
export function pipelineInteractBuilder(extractor: (req: Request) => Promise<Pipeline | null>): Middleware {
    return async (req: Request, res: Response, next: () => void) => {
        const queriedPipeline = await extractor(req);
        // If the pipeline does not exist, error.
        if (!queriedPipeline) {
            res.sendStatus(404);
            return;
        }
        // See if the user is assigned.
        const isUserAssigned = queriedPipeline.assignees.some((user: User): boolean => {
            return user.id === req.session.user?.id;
        });
        // Reject if the user is not assigned.
        if (!isUserAssigned) {
            res.sendStatus(403);
            return;
        }
        // Everything is okay, set the pipeline and go to next in middleware.
        req.pipeline = queriedPipeline;
        next();
    };
}

/**
 * Gets the potential pipeline either by :pipelineId or :token.
 * @param req The request.
 * @returns A promise of a pipeline or null, depending on if it is found.
 */
export async function getPipelineFromRequest(req: Request): Promise<Pipeline | null> {
    console.log("This is the original function that is being called!")
    // Search possible through ID or token.
    const search = req.params.pipelineId ? { id: parseInt(req.params.pipelineId) } : { token: req.params.token };
    // Get the pipeline.
    const repository = AppDataSource.manager.getRepository(Pipeline);
    return await repository.findOne({
        where: search,
        relations: ["assignees"],
    });
}