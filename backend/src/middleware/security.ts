import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

/**
 * Ensures the pipeline exists and the user is allowed to interact with it.
 * @param req The request.
 * @param res The response.
 * @param next The next handler in the middleware chain.
 */
export async function pipelineInteract(req: Request, res: Response, next: () => void) {
    const queriedPipeline = await getPipelineFromRequest(req);
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
}

/**
 * Gets the potential pipeline either by :pipelineId or :token.
 * @param req The request.
 * @returns A promise of a pipeline or null, depending on if it is found.
 */
async function getPipelineFromRequest(req: Request): Promise<Pipeline | null> {
    // Search possible through ID or token.
    const search = req.params.pipelineId ? { id: parseInt(req.params.pipelineId) } : { token: req.params.token };
    // Get the pipeline.
    const repository = AppDataSource.manager.getRepository(Pipeline);
    return await repository.findOne({
        where: search,
        relations: ["assignees"],
    });
}