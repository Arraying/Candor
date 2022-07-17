// TODO:
// - List all pipleines (name, last status, last stages, last success, last failure)
// - List a single pipeline (name, last 5 builds + artifacts)

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

/**
 * An object that represents the summary of a pipeline in a tabular format.
 */
interface PipelineListEntry {
    name: string,
    status: "Passed" | "Failed" | "Error",
    stages: ("Passed" | "Failed" | "Error" | "Skipped")[]
    lastSuccess: string
    lastFailure: string
}

interface PipelineDetailEntity {

}

/**
 * Gets all pipelines that the currently logged in user has access to.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export async function listPipelines(req: Request, res: Response) {
    // Obtain all pipelines that are publically accessible.
    const repository = AppDataSource.manager.getRepository(Pipeline);
    const pipelines = await repository.findBy({
        public: true,
    });
    // Obtain all pipelines that the user has access to, if they are logged in.
    if (req.session.user) {
        // Load in the user object which has the pipelines.
        const userRepository = AppDataSource.manager.getRepository(User);
        const user = await userRepository.findOne({
            where: {
                id: req.session.user.id,
            },
            relations: ["pipelines"],
        });
        // Only push oens that have not been included yet.
        for (const pipeline of user?.pipelines || []) {
            if (!pipelines.find((existing: Pipeline): boolean => existing.id === pipeline.id)) {
                pipelines.push(pipeline);
            }
        }
    }
    // Get all the information on the last build.
    // TODO.
    const result = pipelines.map((pipeline: Pipeline): PipelineListEntry => {
        return {
            name: pipeline.name,
            status: "Passed", // TODO.
            stages: ["Passed", "Passed", "Passed"], // TODO.
            lastSuccess: "28.03.2002 10:00", // TODO.
            lastFailure: "-", // TODO.
        }
    });
    res.send(result);
}
