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
    status: "Passed" | "Failed" | "Error"
    stages: ("Success" | "Failed" | "Error" | "Skipped")[]
    lastSuccess: number
    lastFailure: number
}

/**
 * An object that represents the summary of a pipeline in details.
 * Returns a single object with the following fields:
 * - assigned: If the current user is assigned to it, false when not logged in.
 * - id: The ID of the pipeline.
 * - name: The name of the pipeline.
 * - running: Whether this pipeline is running at the moment.
 * - lastRuns: A list of the last 5 pipeline runs.
 * - trigger: The secret trigger, only visible to assignees.
 * - assignees: A list of assignee names.
 * - requiredParameters: A list of variables in the pipeline config as of now.
 */
interface PipelineDetailEntity {
    assigned: boolean
    id: number
    name: string
    running: boolean
    lastRuns: PipelineRunEntry[]
    trigger: string
    assignees: string[]
    requiredParameters: string[]
}

/**
 * An object that represents a pipeline run.
 * Consists of the following fields:
 * - id: The ID of the pipeline run.
 * - start: The start of the run in unix milliseconds.
 * - finish: The end of the run in unix milliseconds.
 * - status: The overall status of the run.
 * - stages: The stages of the run.
 * - archived: A list of file names that were archived.
 */
interface PipelineRunEntry {
    id: string
    start: number
    finish: number
    status: "Passed" | "Failed" | "Error"
    stages: PipelineStageEntry[]
    archived: string[]
}

/**
 * An object that represents a pipeline stage of a run.
 * Consists of the following fields:
 * - name: The name of the stage at the time.
 * - status: The outcome of the stage.
 */
interface PipelineStageEntry {
    name: string
    status: "Success" | "Failed" | "Error" | "Skipped"
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
                status: <"Passed"> lastBuild.status,
                stages: lastBuild.stages.map((stage: any) => stage.status),
                lastSuccess: -1,
                lastFailure: -1,
            };
        });
    res.send(pipelines);
}

/**
 * Gets information on a pipeline.
 * Returns an array of a detailed pipeline.
 * @param req The request.
 * @param res The response.
 */
export async function getPipeline(req: Request, res: Response) {
    const repository = AppDataSource.manager.getRepository(Pipeline);
    const queriedPipeline = await repository.findOne({
        where: {
            id: parseInt(req.params.pipelineId),
        },
        relations: ["assignees"],
    });
    // Ensure the pipeline actually exists.
    if (!queriedPipeline) {
        res.sendStatus(404);
        return;
    }
    // Ensure the user is logged in, if need be.
    if (!queriedPipeline.public && !req.session.user) {
        res.sendStatus(403);
        return;
    }
    // See if the user is assigned.
    const isUserAssigned = queriedPipeline.assignees.some((user: User): boolean => {
        return user.id === req.session.user?.id;
    })
    // Ensure the user has access, if need be.
    if (!queriedPipeline.public && !isUserAssigned) {
        res.sendStatus(403);
        return;
    }
    // Extract the required parameters.
    const parameterObject = (queriedPipeline.plan as any)?.parameters;
    const parameters = parameterObject ? Object.keys(parameterObject) : [];
    // Make the pipeline.
    const pipeline: PipelineDetailEntity = {
        assigned: isUserAssigned,
        id: queriedPipeline.id,
        name: queriedPipeline.name,
        running: false, // TODO
        lastRuns: [], // TODO
        trigger: isUserAssigned ? queriedPipeline.token : "hidden",
        assignees: queriedPipeline.assignees.map((user: User): string => user.name),
        requiredParameters: parameters,
    };
    res.send(pipeline);
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