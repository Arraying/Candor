import axios, { AxiosResponse } from "axios";
import { AppDataSource } from "./data-source";
import crypto from "crypto";
import jspath from "jspath";
import { logger } from "./logger";
import { Pipeline } from "./entities/Pipeline";
import { Request } from "express";
import { Run } from "./entities/Run";
import { Runner } from "./entities/Runner";

/**
 * Represents a partial config that can be used for a plan too.
 */
type PartialConfig = {
    parameters: Record<string, string | null | undefined> | undefined
    stages: Record<string, unknown>[]
}

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
 * Whether or not the constraints are met.
 * @param req The request.
 * @returns True if they are, false otherwise.
 */
export async function constraintsMet(req: Request): Promise<boolean> {
    // This should never be the case.
    if (!req.pipeline) {
        return false;
    }
    // Defines the variables.
    const plan = req.pipeline.plan;
    const headers = plan.constrainHeaders as Record<string, string | string[]> || {};
    const body = plan.constrainBody as Record<string, string[]> || {};
    return (await constraintsMetHeader(req, headers)) && (await constraintsMetBody(req, body));
}

/**
 * Ensures header constraints are met.
 * @param req The request.
 * @param headers The header constraints.
 * @returns True iff the header constraints are met.
 */
export async function constraintsMetHeader(req: Request, headers: Record<string, string | string[]>): Promise<boolean> {
    // See if header constraints are met.
    for (const required in headers) {
        const compare = headers[required];
        const actual = req.headers[required.toLowerCase()];
        const expected = Array.isArray(compare) ? compare : [compare];
        // If it's not met, reject.
        if (!actual) {
            return false;
        }
        // Array handling.
        if (Array.isArray(actual) && !actual.find((actualSingle: string): boolean => expected.includes(actualSingle))) {
            return false;
        } else if (!Array.isArray(actual) && !expected.includes(actual)) {
            return false;
        }
    }
    return true;
}

/**
 * Ensures body constraints are met.
 * @param req The request.
 * @param body The body constraints.
 * @returns True iff the body constraints are met.
 */
export async function constraintsMetBody(req: Request, body: Record<string, string[]>): Promise<boolean> {
    // See if the body constraints are met.
    for (const required in body) {
        const expected = body[required];
        try {
            const actual = jspath.apply(required, req.body);
            // If it's not met, reject.
            if (JSON.stringify(actual) !== JSON.stringify(expected)) {
                return false;
            }
        } catch (error) {
            logger.warn(`[JSPath]: ${required} raised exception`);
            return false;
        }
    }
    return true;
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
    // eslint-disable-next-line
    const pipeline = req.pipeline!;
    const parameters = extractJSPathParameters(pipeline.plan as PartialConfig, req.body);
    // Overwrite the parameters with any querystrings.
    Object.assign(parameters, req.query);
    // Create the run ID.
    const runId = crypto.randomBytes(4).toString("hex");
    logger.info(`[${runId}] Preparing`);
    try {
        running.add(pipeline.id);
        // Perform the run.
        const run = await performRun(runId, pipeline, parameters);
        logger.info(`[${runId}] Complete`);
        // Save the run.
        await AppDataSource.getRepository(Run).save(run);
    } catch(error) {
        logger.error(`[${runId}] Failure: ${error}`);
    } finally {
        logger.info(`[${runId}] Done`);
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
async function performRun(runId: string, pipeline: Pipeline, parameters: Record<string, string>): Promise<Run> {
    const pipelineId = pipeline.id;
    // Get a compatible runner, if possible.
    const runner = await getCompatibleRunner();
    if (!runner) {
        // Delegate failure.
        return makeFailedRun(pipelineId, runId, "Get Runner", Date.now());
    }
    // Get the plan.
    const plan = await generateRequestData(runId, pipeline.plan as PartialConfig, parameters);
    // Wrap communicating with the runner in a try/catch, you never know.
    let runnerResponse;
    const start = Date.now();
    try {
        runnerResponse = await axios.post(getRunnerEndpoint(runner, "/run"), plan, {
            headers: {
                Authorization: `Bearer ${process.env.RUNNER_TOKEN}`,
            },
            validateStatus: null, // Don't error!
        });
    } catch (error) {
        // Wrap the error and delegate it again.
        console.error(error);
        return makeFailedRun(pipelineId, runId, "Connect Runner", Date.now());
    }
    const finish = Date.now();
    // Status code 400 means the token or plan is invalid.
    // This should technically never happen.
    if (runnerResponse.status === 400) {
        logger.error(runnerResponse);
        // Delegate.
        return makeFailedRun(pipelineId, runId, `Error ${runnerResponse.status}`, Date.now());
    }
    // Status code 401 means the token is incorrect.
    if (runnerResponse.status === 401) {
        // Delegate.
        return makeFailedRun(pipelineId, runId, "Auth Runner", Date.now());
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
export async function getCompatibleRunner(): Promise<Runner | undefined> {
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
            } catch {
                // eslint-disable-next-line
            }
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
export async function generateRequestData(runId: string, config: PartialConfig, parameters: Record<string, string>) {
    // Make a quick helper function.
    const replacer = (input: string | undefined): string | undefined => {
        // If the input does not exist, ignore it.
        if (!input) {
            return input;
        }
        Object.keys(parameters).forEach((parameter: string) => {
            // eslint-disable-next-line
            input = input!.replaceAll(`%${parameter}%`, parameters[parameter]);
        });
        return input;
    }
    // Here, the JSON is guaranteed to be valid.
    config.stages.forEach((stage: Record<string, unknown>) => {
        // Replace every parameter.
        stage.name = replacer(stage.name as string);
        stage.image = replacer(stage.image as string);
        stage.runtime = replacer(stage.runtime as string);
        // If the environment exists, replace.
        const environments = stage.environment as (string | undefined)[] || [];
        for (const [i, environment] of environments.entries()) {
            environments[i] = replacer(environment);
        }
        // If the script exists, replace
        const scripts = stage.script as (string | undefined)[] || [];
        for (const [i, script] of scripts.entries()) {
            scripts[i] = replacer(script);
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
 * @param whenFailed When the pipeline failed.
 * @returns A run.
 */
export function makeFailedRun(pipelineId: number, runId: string, whatFailed: string, whenFailed: number): Run {
    const run = new Run();
    run.pipeline = pipelineId;
    run.run_id = runId;
    const time = whenFailed.toString();
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
 * Extracts parameters from the request body using JSPath.
 * @param plan The pipeline plan.
 * @param body The request body.
 * @returns An object of all the parameters.
 */
export function extractJSPathParameters(plan: PartialConfig, body: Record<string, unknown>): Record<string, string> {
    // If none are specified, that's fine too.
    if (!plan.parameters) {
        return {};
    }
    const map = new Map<string, string>();
    // Go through each parameter.
    for (const parameter in plan.parameters) {
        const path = plan.parameters[parameter]
        // If this is a manual variable, skip.
        if (!path) {
            continue;
        }
        try {
            const result = jspath.apply(path, body);
            // Always use the first one, even if it is an array.
            // Also convert to string, because otherwise this will be a headache.
            map.set(parameter, result ? result[0].toString() : undefined);
        } catch (error) {
            logger.warn(`[JSPath]: ${parameter} raised exception`);
        }
    }
    // Return the result.
    return Object.fromEntries(map);
}

/**
 * Formats an endpoint into a complete URL for a given runner.
 * @param runner The runner.
 * @param endpoint The API endpoint.
 * @returns A correctly formatted endpoint.
 */
export function getRunnerEndpoint(runner: Runner, endpoint: string): string {
    return `${runner.hostname}${endpoint}`;
}