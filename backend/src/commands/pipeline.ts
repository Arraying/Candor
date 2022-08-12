import crypto from "crypto";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

/**
 * Lists all pipelines.
 * @param _ Ignored.
 * @returns Always true.
 */
export async function pipelineList(_: string[]): Promise<boolean> {
    const repository = AppDataSource.manager.getRepository(Pipeline);
    const pipelines = await repository.find({
        relations: ["assignees"],
    });
    console.log("Here is a list of pipelines:")
    for (const pipeline of pipelines) {
        pipelinePrint(pipeline);
    }
    return true;
}

/**
 * Creates a pipeline by name if it does not exist yet.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function pipelineAdd(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(Pipeline);
    if (await repository.findOneBy({
        name: args[0],
    })) {
        console.log("A pipeline with that name already exists");
        return true;
    }
    const pipeline = new Pipeline();
    pipeline.name = args[0];
    pipeline.token = await crypto.randomBytes(16).toString('hex');
    await repository.insert(pipeline);
    console.log("The pipeline has been added");
    return true;
}

/**
 * Deletes a pipeline by name if it already exists.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function pipelineDel(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(Pipeline);
    const pipeline = await repository.findOneBy({
        name: args[0],
    });
    if (pipeline) {
        await repository.remove(pipeline);
        console.log("The pipeline has been deleted");
    } else {
        console.log("A pipeline with that name does not exist");
    }
    return true;
}

/**
 * Sets the pipeline's public status.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function pipelinePublic(args: string[]): Promise<boolean> {
    if (!args[0] || !args[1]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(Pipeline);
    const pipeline = await repository.findOneBy({
        name: args[0],
    });
    if (pipeline) {
        pipeline.public = args[1] === "true";
        await repository.save(pipeline);
        console.log(`The pipeline public status has been set to: ${pipeline.public}`);
    } else {
        console.log("A pipeline with that name does not exist");
    }
    return true;
}

export async function run(args: string[]): Promise<boolean> {
    return false;
}

/**
 * Pretty prints a pipeline.
 * @param pipeline The pipeline.
 */
function pipelinePrint(pipeline: Pipeline) {
    const label = pipeline.public ? "Public" : "Private";
    // Get assignee names.
    const names = pipeline.assignees.map((assignee: User): string => assignee.name).join(", ");
    // Stringify and hack due to lack of replaceAll.
    let stringPlan = JSON.stringify(pipeline.plan, null, 2).split("\n").join("\n    ");
    console.log(`==> ID: ${pipeline.id}\n    Name: ${pipeline.name}\n    Status: ${label}\n    Assignees: ${names}\n    Token: ${pipeline.token}\n    Plan:\n    ${stringPlan}`);
}