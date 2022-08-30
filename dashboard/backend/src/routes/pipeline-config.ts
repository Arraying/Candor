import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { isConfigValid } from "../validation";
import { Pipeline } from "../entities/Pipeline";

/**
 * Gets a pipeline's config. The user needs to be assigned to see this.
 * @param req The request.
 * @param res The response.
 */
export async function getPipelineConfig(req: Request, res: Response) {
    // eslint-disable-next-line
    const queriedPipeline = req.pipeline!;
    // Return the config.
    res.send(queriedPipeline.plan);
}

/**
 * Sets a pipeline's config. The user needs to be assigned to do this.
 * @param req The request.
 * @param res The response.
 */
export async function setPipelineConfig(req: Request, res: Response) {
    const repository = AppDataSource.getRepository(Pipeline);
    // eslint-disable-next-line
    const queriedPipeline = req.pipeline!;
    const newPlan = req.body;
    // Make sure it is valid first!
    if (!isConfigValid(newPlan)) {
        res.send({ valid: false });
        return;
    }
    // Update!
    queriedPipeline.plan = newPlan;
    await repository.save(queriedPipeline);
    res.send({ valid: true });
}