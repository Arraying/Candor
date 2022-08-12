import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";
import { PipelineService } from "../services/PipelineService";
import { promptName, promptList, unanswered } from "./actions-utils";
import crypto from "crypto";
import prompts from "prompts";

const service = new PipelineService();

/**
 * Lists all pipelines.
 */
 export async function pipelineList() {
    const pipelines = await service.getAll();
    if (pipelines === "error") {
        console.log("An error occurred listing all pipelines");
        return;
    }
    if (pipelines.length === 0) {
        console.log("There are no pipelines.");
        return;
    }
    for (const pipeline of pipelines) {
        const label = pipeline.public ? "Public" : "Private";
        // Get assignee names.
        const names = pipeline.assignees.map((assignee: User): string => assignee.name).join(", ");
        // Stringify and hack due to lack of replaceAll.
        let stringPlan = JSON.stringify(pipeline.plan, null, 2).split("\n").join("\n    ");
        console.log(`==> ID: ${pipeline.id}\n    Name: ${pipeline.name}\n    Status: ${label}\n    Assignees: ${names}\n    Token: ${pipeline.token}\n    Config:\n    ${stringPlan}`);
    }
}

/**
 * Adds a new pipeline.
 */
export async function pipelineAdd() {
    const questions = [
        promptName(64, (name: string): Promise<boolean> => service.doesNameExist(name)), 
        promptVisibility(),
    ];
    const response = await prompts(questions);
    // Check if we need to return early.
    if (unanswered(response)) {
        return;
    }
    const pipeline = new Pipeline();
    pipeline.name = response.name;
    pipeline.token = await randomToken();
    pipeline.public = response.public;
    const status = await service.create(pipeline);
    console.log(status === "success" 
        ? "The pipeline has been created. It can be managed through the dashboard."
        : "An error occurred creating the pipeline."
    );
}

/**
 * Edits a pipeline's public visibility.
 */
export async function pipelinePublic() {
    const pipelines = await service.getAll();
    if (pipelines === "error") {
        console.log("An error occurred getting all pipelines.");
        return;
    }
    if (pipelines.length === 0) {
        console.log("There are no pipelines.");
        return;
    }
    const names = pipelines.map((pipeline: Pipeline): string => pipeline.name);
    let response = await prompts(promptList("Which pipeline should be updated?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Get the pipeline by name.
    const pipeline = await service.getOne(response.name);
    response = await prompts(promptVisibility());
    if (unanswered(response)) {
        return;
    }
    // Update the visibility.
    pipeline.public = response.public;
    const status = await service.update(pipeline);
    console.log(status === "success" 
        ? "The pipeline has been updated."
        : "An error occurred updating the pipeline."
    );
}

/**
 * Rerolls a pipeline's token.
 */
export async function pipelineReroll() {
    const pipelines = await service.getAll();
    if (pipelines === "error") {
        console.log("An error occurred getting all pipelines.");
        return;
    }
    if (pipelines.length === 0) {
        console.log("There are no pipelines.");
        return;
    }
    const names = pipelines.map((pipeline: Pipeline): string => pipeline.name);
    let response = await prompts(promptList("Which pipeline should be re-rolled?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Get the pipeline by name.
    const pipeline = await service.getOne(response.name);
    // Update the token.
    pipeline.token = await randomToken();
    const status = await service.update(pipeline);
    console.log(status === "success" 
        ? "The pipeline has been updated."
        : "An error occurred updating the pipeline."
    );
}

/**
 * Deletes an existing pipeline.
 */
export async function pipelineDel() {
    const pipelines = await service.getAll();
    if (pipelines === "error") {
        console.log("An error occurred getting all pipelines.");
        return;
    }
    if (pipelines.length === 0) {
        console.log("There are no pipelines.");
        return;
    }
    const names = pipelines.map((pipeline: Pipeline): string => pipeline.name);
    const response = await prompts(promptList("Which pipeline should be deleted?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Delete by name.
    const status = await service.delete(response.name);
    console.log(status === "success" 
        ? "The pipeline has been deleted."
        : "An error occurred deleting the pipeline."
    );
}

/**
 * The prompt that asks for the pipeline visibility.
 * @returns A prompt.
 */
function promptVisibility(): prompts.PromptObject {
    return {
        type: "toggle",
        name: "public",
        message: "Enter the desired visibility",
        initial: false,
        active: "Public",
        inactive: "Private",
    };
}

/**
 * Generates a cryptographically secure random token.
 * @returns A random token.
 */
async function randomToken(): Promise<string> {
   return crypto.randomBytes(16).toString('hex');
}