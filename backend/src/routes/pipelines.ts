// TODO:
// - List all pipleines (name, last status, last stages, last success, last failure)
// - List a single pipeline (name, last 5 builds + artifacts)

import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

// TODO: Remove.
const dummyLastBuild = {
    status: "Passed",
    stages: [
        {
            name: "Foo",
            status: "Success",
            exitCode: 0,
        },
        {
            name: "Bar",
            status: "Success",
            exitCode: 0,
        },
        {
            name: "Baz",
            status: "Success",
            exitCode: 0,
        },
    ]
};

/**
 * An object that represents the summary of a pipeline in a tabular format.
 * Returns an array of pipelines with the following fields:
 * - id: The ID of the pipeline.
 * - name: The name of the pipeline.
 * - running: Whether this pipeline is running at the moment.
 * - status: The status string of the last run.
 * - stages: Array of status strings for each stage.
 * - lastSuccess: When the last success completed in epoch milliseconds, or -1 if not applicable.
 * - lastFailure: When the last fail completed in epoch milliseconds, or -1 if not applicable.
 */
interface PipelineListEntry {
    id: number
    name: string
    running: boolean
    status: string
    stages: ("Success" | "Failed" | "Error" | "Skipped")[]
    lastSuccess: number
    lastFailure: number
}

interface PipelineDetailEntity {

}

/**
 * Lists all pipelines that are public or assigned to the user if they are logged in.
 * Returns an array of pipelines list entries.
 * @param req The request.
 * @param res The response.
 */
export async function listPipelines(req: Request, res: Response) {
    const repository = AppDataSource.manager.getRepository(Pipeline);
    const allPipelines = await repository.find({
        relations: ["assignees"]
    });
    // Obtain the pipelines.
    const pipelines = allPipelines
        // Get the ones accessible to the user.
        .filter((pipeline: Pipeline): boolean => {
            // If it is public it should definitely be included.
            if (pipeline.public) {
                return true;
            }
            // Otherwise, only if they are assigned.
            return pipeline.assignees.some((user: User): boolean => {
                // If they are not logged in, ignore.
                if (!req.session.user) {
                    return false;
                }
                // Include iff they match up.
                return user.id === req.session.user.id;
            });
        })
        // Extract only required information.
        .map((pipeline: Pipeline): PipelineListEntry => {
            // TODO.
            const lastBuild = dummyLastBuild;
            return {
                id: pipeline.id,
                name: pipeline.name,
                running: false, // TODO
                status: lastBuild.status,
                stages: lastBuild.stages.map((stage: any) => stage.status),
                lastSuccess: -1,
                lastFailure: -1,
            };
        });
    res.send(pipelines);
}

// /**
//  * Gets all pipelines that the currently logged in user has access to.
//  * @param req The request.
//  * @param res The response.
//  * @returns Nothing.
//  */
// export async function listPipelines(req: Request, res: Response) {
//     // Obtain all pipelines that are publically accessible.
//     const repository = AppDataSource.manager.getRepository(Pipeline);
//     const pipelines = await repository.findBy({
//         public: true,
//     });
//     // Obtain all pipelines that the user has access to, if they are logged in.
//     if (req.session.user) {
//         // Load in the user object which has the pipelines.
//         const userRepository = AppDataSource.manager.getRepository(User);
//         const user = await userRepository.findOne({
//             where: {
//                 id: req.session.user.id,
//             },
//             relations: ["pipelines"],
//         });
//         // Only push oens that have not been included yet.
//         for (const pipeline of user?.pipelines || []) {
//             if (!pipelines.find((existing: Pipeline): boolean => existing.id === pipeline.id)) {
//                 pipelines.push(pipeline);
//             }
//         }
//     }
//     // Get all the information on the last build.
//     // TODO.
//     const result = pipelines.map((pipeline: Pipeline): PipelineListEntry => {
//         return {
//             name: pipeline.name,
//             status: "Passed", // TODO.
//             stages: ["Passed", "Passed", "Passed"], // TODO.
//             lastSuccess: "28.03.2002 10:00", // TODO.
//             lastFailure: "-", // TODO.
//         }
//     });
//     res.send(result);
// }

export async function getPipeline(req: Request, res: Response) {
    res.send({});
}

export async function getPipelineConfig(req: Request, res: Response) {
    // TODO: Permissions.
    res.send({
        a: "hello",
        b: "world",
    });
}

export async function setPipelineConfig(req: Request, res: Response) {
    // TODO: Permissions.
    res.sendStatus(200);
}