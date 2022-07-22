import axios from "axios";
import crypto from "crypto";
import { Request } from "express";
import { AppDataSource } from "./data-source";
import { Run } from "./entities/Run";
import { Runner } from "./entities/Runner";

/**
 * Contains all pipeline IDs of pipelines currently in progress.
 */
export const running = new Set<number>();

export async function canRun(req: Request): Promise<boolean> {
    // Ensure the pipeline exists and is not running.
    if (!req.pipeline || running.has(req.pipeline.id)) {
        return false;
    }
    // Ensure that the pipeline config is valid.
    // Ensure that the pipeline can actually run on somewhere.
    try {
        return (await AppDataSource.getRepository(Runner).find()).length !== 0;
    } catch (error) {
        return false;
    }
}

export async function run(req: Request): Promise<void> {
    // This should never be the case.
    if (!req.pipeline) {
        return;
    }
    const pipeline = req.pipeline!;
    const parameters: object = req.query;
    try {
        running.add(pipeline.id);
        // Get a random runner and create the run ID.
        const runner = await getRunner();
        const runId = generateRunId();
        // Get the body to send to the runner.
        const requestBody = await generateRequestData(runId, pipeline.plan, parameters);
        // Start the timer and post.
        const start = Date.now();
        const response = await axios.post(`http://${runner.hostname}:${runner.port}/run`, requestBody, {
            headers: {
                Authorization: `Bearer ${process.env.RUNNER_TOKEN}`,
            },
            validateStatus: null // Don't error!
        });
        // Stop timer.
        const finish = Date.now();
        const outcome = response.data;
        // Write to database.
        const run = new Run();
        try {
            run.run_id = runId;
            run.runner = runner.id;
            run.start = start.toString();
            run.finish = finish.toString();
            run.outcome = outcome;
            await AppDataSource.getRepository(Run).save(run);
        } catch (error) {
            console.error(error);
            console.log(run);
        }
    } finally {
        running.delete(pipeline.id);
    }
}

async function getRunner(): Promise<Runner> {
    const repository = AppDataSource.getRepository(Runner);
    // Query a random runner.
    const runners = await repository.createQueryBuilder()
        .select("*")
        .from(Runner, "runners")
        .orderBy("RANDOM()")
        .limit(1)
        .execute();
    return <Runner> runners[0];
}

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
        runid: runId,
        plan: config,
    };
}

function generateRunId(): string {
    return crypto.randomBytes(4).toString("hex");
}