import axios, { AxiosResponse } from "axios";
import crypto from "crypto";
import { Request } from "express";
import { AppDataSource } from "./data-source";
import { Pipeline } from "./entities/Pipeline";
import { Run } from "./entities/Run";
import { Runner } from "./entities/Runner";

/**
 * Contains all pipeline IDs of pipelines currently in progress.
 */
export const running = new Set<number>();

/**
 * Checks if the pipeline can run (not running and exists).
 * This does not check if runners exist and/or are available.
 * @param req The request.
 * @returns True if it can run.
 */
export async function canRun(req: Request): Promise<boolean> {
    // Ensure that it exists and can be run.
    return req.pipeline != null && !running.has(req.pipeline.id);
}

/**
 * Runs the pipeline and saves the result.
 * The actual heavylifting is done in another method.
 * @param req The request that triggered the run.
 * @returns A promise of nothing.
 */
export async function run(req: Request): Promise<void> {
    // This should never be the case.
    if (!req.pipeline) {
        return;
    }
    const pipeline = req.pipeline!;
    const parameters: object = req.query;
    // Create the run ID.
    const runId = crypto.randomBytes(4).toString("hex");
    console.log(`[${runId}] Preparing`);
    try {
        running.add(pipeline.id);
        // Perform the run.
        const run = await performRun(runId, pipeline, parameters);
        console.log(`[${runId}] Complete`);
        // Save the run.
        await AppDataSource.getRepository(Run).save(run);
    } catch(error) {
        console.error(`[${runId}] Failure: ${error}`);
    } finally {
        console.log(`[${runId}] Done`);
        running.delete(pipeline.id);
    }
}

/**
 * Requests a log from the runner.
 * @param runner The runner.
 * @param runId The run ID.
 * @returns A promise containing the response.
 */
export function log(runner: Runner, runId: string): Promise<AxiosResponse> {
    return axios.get(getRunnerEndpoint(runner, `/logs/${runId}`), {
        headers: {
            Authorization: `Bearer ${process.env.RUNNER_TOKEN}`,
        },
        // Use a stream to pipe, and we also want to validate statuses.
        responseType: "stream",
    });
}

/**
 * Performs the actual run.
 * This will select a compatible runner, and attempt to run.
 * The result of this is returned as a run object to be saved.
 * @param runId The run ID.
 * @param pipeline The pipeline to run.
 * @param parameters The parameters to use.
 * @returns A promise of a run object.
 */
async function performRun(runId: string, pipeline: Pipeline, parameters: any): Promise<Run> {
    const pipelineId = pipeline.id;
    // Get a compatible runner, if possible.
    const runner = await getCompatibleRunner();
    if (!runner) {
        // Delegate failure.
        return makeFailedRun(pipelineId, runId, "Get Runner");
    }
    // Get the plan.
    const plan = await generateRequestData(runId, pipeline.plan, parameters);
    // Wrap communicating with the runner in a try/catch, you never know.
    let runnerResponse;
    const start = Date.now();
    try {
        runnerResponse = await axios.post(getRunnerEndpoint(runner, "/run"), plan, {
            headers: {
                Authorization: `Bearer ${process.env.RUNNER_TOKEN}`,
            },
            validateStatus: null // Don't error!
        });
    } catch (error) {
        // Wrap the error and delegate it again.
        console.error(error);
        return makeFailedRun(pipelineId, runId, "Connect Runner");
    }
    const finish = Date.now();
    // Status code 400 means the token or plan is invalid.
    // This should technically never happen.
    if (runnerResponse.status === 400) {
        console.log(runnerResponse);
        // Delegate.
        return makeFailedRun(pipelineId, runId, `Error ${runnerResponse.status}`);
    }
    // Status code 401 means the token is incorrect.
    if (runnerResponse.status === 401) {
        // Delegate.
        return makeFailedRun(pipelineId, runId, "Auth Runner");
    }
    const outcome = runnerResponse.data;
    // Turn this outcome into a real run.
    const run = new Run();
    run.pipeline = pipelineId;
    run.run_id = runId;
    run.runner = runner.id;
    run.start = start.toString();
    run.finish = finish.toString();
    run.outcome = outcome;
    return run;
}

/**
 * Attempts to get a compatible runner.
 * This will query all runners in the database, and if the query fails return undefined.
 * Then in a random order, it will take the first runner where the healthcheck returns 200 OK.
 * @returns A runner, or undefined.
 */
async function getCompatibleRunner(): Promise<Runner | undefined> {
    try {
        // Attempts to get the runner from the repository.
        const repository = AppDataSource.getRepository(Runner);
        // Query a random runner.
        const runners = await repository.createQueryBuilder()
            .select("*")
            .from(Runner, "runners")
            .orderBy("RANDOM()")
            .execute();
        // Try find the first compatible runner.
        for (const runnerRaw of runners) {
            const runner = <Runner> runnerRaw;
            // Try to see if this runner is online.
            try {
                // Healthcheck URL.
                const response = await axios.get(getRunnerEndpoint(runner, "/"));
                if (response.status !== 200) {
                    throw new Error();
                }
                // Seems to be online.
                return runner;
            } catch { }; // Ignore errors.
        }
        // At this point, no runners are available.
        return undefined;
    } catch (error) {
        console.error(error);
        // Delegate handling to calling function.
        return undefined;
    }
}

/**
 * Converts a pipeline config to a run plan.
 * @param runId The run ID.
 * @param config The pipeline config.
 * @param parameters The run parameters,
 * @returns A pipeline plan.
 */
async function generateRequestData(runId: string, config: any, parameters: any) {
    // Make a quick helper function.
    const replacer = (input?: string): string | undefined => {
        // If the input does not exist, ignore it.
        if (!input) {
            return input;
        }
        // 
        Object.keys(parameters).forEach((parameter: string) => {
            input = input!.replaceAll(`%${parameter}%`, parameters[parameter]);
        });
        return input;
    }
    // Here, the JSON is guaranteed to be valid.
    config.stages.forEach((stage: any) => {
        // Replace every parameter.
        stage.name = replacer(stage.name);
        stage.image = replacer(stage.image);
        stage.runtime = replacer(stage.runtime);
        // If the environment exists, replace.
        const environments = stage.environment || [];
        for (const [i, environment] of environments.entries()) {
            stage.environment[i] = replacer(environment);
        }
        // If the script exists, replace
        const scripts = stage.script || [];
        for (const [i, script] of scripts.entries()) {
            stage.script[i] = replacer(script);
        }
    });
    return {
        runId: runId,
        plan: config,
    };
}

/**
 * Creates a fake failed run for a generic configuration issue.
 * @param pipelineId The pipeline ID.
 * @param runId The run ID.
 * @param whatFailed A short description of what failed, this will become a stage.
 * @returns A run.
 */
function makeFailedRun(pipelineId: number, runId: string, whatFailed: string): Run {
    const run = new Run();
    run.pipeline = pipelineId;
    run.run_id = runId;
    const time = Date.now().toString();
    run.start = time;
    run.finish = time;
    run.outcome = {
        status: "Failed",
        stages: [{
            name: whatFailed,
            status: "Failed",
            exitCode: -1,
        }],
    };
    return run;
}

/**
 * Formats an endpoint into a complete URL for a given runner.
 * @param runner The runner.
 * @param endpoint The API endpoint.
 * @returns A correctly formatted endpoint.
 */
function getRunnerEndpoint(runner: Runner, endpoint: string): string {
    return `http://${runner.hostname}:${runner.port}${endpoint}`;
}