import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { Run } from "../entities/Run";
import { Runner } from "../entities/Runner";
import { User } from "../entities/User";
import { log, run, running } from "../running";
import { isConfigValid } from "../validation";

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
    status?: "Passed" | "Failed" | "Error"
    stages?: ("Success" | "Failed" | "Error" | "Skipped")[]
    lastSuccess?: number
    lastFailure?: number
}

/**
 * An object that represents the summary of a pipeline in details.
 * Returns a single object with the following fields:
 * - assigned: If the current user is assigned to it, false when not logged in.
 * - id: The ID of the pipeline.
 * - name: The name of the pipeline.
 * - running: Whether this pipeline is running at the moment.
 * - public: Whether the pipeline is public.
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
    public: boolean
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
    const pipelinesRaw = allPipelines
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
        });
    // Promise wizardry.
    const pipelines = await Promise.all(pipelinesRaw.map(async (pipeline: Pipeline): Promise<PipelineListEntry> => {
        // Query the runs.
        const runs = await AppDataSource.getRepository(Run).find({
            // Get runs from this pipeline.
            where: {
                pipeline: pipeline.id,
            },
            // Order by most recent finish time first.
            order: {
                finish: "DESC",
            },
        });
        // Turn into single runs.
        const lastRun = runs[0];
        const lastSuccess = runs.find((run: Run): boolean => run.outcome.status === "Passed");
        const lastFailure = runs.find((run: Run): boolean => run.outcome.status === "Failed");
        return {
            // Basic information.
            id: pipeline.id,
            name: pipeline.name,
            // Only if it has run before.
            status: lastRun?.outcome.status,
            stages: lastRun?.outcome.stages.map((stage: any): string => stage.status),
            // Again, only if applicable.
            lastSuccess: lastSuccess ? parseInt(lastSuccess.finish) : undefined,
            lastFailure: lastFailure ? parseInt(lastFailure.finish) : undefined,
        };
    }));
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
    });
    // Ensure the user has access, if need be.
    if (!queriedPipeline.public && !isUserAssigned) {
        res.sendStatus(403);
        return;
    }
    // Extract the required parameters.
    const parameterObject = (queriedPipeline.plan as any)?.parameters;
    const parameters = parameterObject ? Object.keys(parameterObject) : [];
    // Get the last few runs.
    const runsRaw = await AppDataSource.getRepository(Run).find({
        // Get runs from this pipeline.
        where: {
            pipeline: queriedPipeline.id,
        },
        order: {
            finish: "DESC",
        },
        // Limit to 5.
        take: 5,
    });
    // Convert the runs to the correct format.
    const runs = runsRaw.map((run: Run): PipelineRunEntry => {
        return {
            id: run.run_id,
            start: parseInt(run.start),
            finish: parseInt(run.finish),
            status: run.outcome.status,
            stages: run.outcome.stages || [],
            archived: run.outcome.archived || [],
        };
    })
    // Make the pipeline.
    const pipeline: PipelineDetailEntity = {
        assigned: isUserAssigned,
        id: queriedPipeline.id,
        name: queriedPipeline.name,
        running: running.has(queriedPipeline.id),
        public: queriedPipeline.public,
        lastRuns: runs,
        trigger: isUserAssigned ? queriedPipeline.token : "hidden",
        assignees: queriedPipeline.assignees.map((user: User): string => user.name),
        requiredParameters: parameters,
    };
    res.send(pipeline);
}

/**
 * Gets a pipeline's config. The user needs to be assigned to see this.
 * @param req The request.
 * @param res The response.
 */
export async function getPipelineConfig(req: Request, res: Response) {
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

export async function getPipelineArchive(req: Request, res: Response) {
    // TODO: Implement.
    // TODO: Permissions.
    res.download(__filename);
}

/**
 * Gets the pipeline log by requesting the runner than ran it.
 * @param req The request.
 * @param res The response.
 */
export async function getPipelineLog(req: Request, res: Response) {
    // Constants.
    const pipelineId = req.pipeline?.id;
    const runId = req.params.runId;
    try {
        // See if the run actually exists.
        const run = await AppDataSource.getRepository(Run).findOneBy({
            pipeline: pipelineId,
            run_id: runId,
        });
        // If not, relay that.
        if (!run) {
            throw new Error("Run does not exist");
        }
        if (!run.runner) {
            throw new Error("Runner no longer exists");
        }
        // Get the runner.
        const runner = await AppDataSource.getRepository(Runner).findOneBy({
            id: run.runner,
        });
        // Unlikely, but you never know.
        if (!runner) {
            throw new Error("Runner could not be found");
        }
        // Request the logs from the runner.
        const logRequest = log(runner, runId);
        logRequest
            // Axios wizardry.
            // Pipe the response from the runner directly into this response.
            .then(response => {
                response.data.pipe(res);
            })
            // Could happen, make sure to handle.
            .catch(error => {
                if (error.response && error.response.status === 404) {
                    res.send("No log could be found (deleted on server)");
                } else {
                    console.error(error);
                    res.send("An error occurred");
                }
            })

    } catch (error) {
        console.warn(`[${runId}] ${error}`);
        res.send("No log could be found");
    }
}