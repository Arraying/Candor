import crypto from "crypto";
import prompts, { PromptObject } from "prompts";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";
import { PipelineService } from "../services/PipelineService";
import { UserService } from "../services/UserService";
import { promptList, unanswered } from "./actions-utils";
import { BaseAction } from "./BaseAction";

export class PipelineAction extends BaseAction<Pipeline> {

    constructor() {
        const service = new PipelineService();
        super(service, "pipeline", 64);
    }

    protected prettyPrint(pipeline: Pipeline): void {
        const label = pipeline.public ? "Public" : "Private";
        // Get assignee names.
        const names = pipeline.assignees.map((assignee: User): string => assignee.name).join(", ");
        // Stringify and hack due to lack of replaceAll.
        const stringPlan = JSON.stringify(pipeline.plan, null, 2).split("\n").join("\n    ");
        console.log(`==> ID: ${pipeline.id}\n    Name: ${pipeline.name}\n    Status: ${label}\n    Assignees: ${names}\n    Token: ${pipeline.token}\n    Config:\n    ${stringPlan}`);
    }

    protected createPrompts(): PromptObject<string>[] {
        return [promptVisibility()];
    }

    protected async createValidateInput(response: any): Promise<string | null> {
        return null;
    }

    protected async createBuildEntity(response: any): Promise<Pipeline> {
        const pipeline = new Pipeline();
        pipeline.token = await randomToken();
        pipeline.public = response.public;
        return pipeline;
    }

    protected createInfoMessage(): string {
        return "It can be managed on the web dashboard";
    }

    /**
     * Updates an existing pipeline's visibility (public/private).
     */
    async actionUpdateVisibility(): Promise<void> {
        await this.actionUpdate({
            prompts: [promptVisibility()],
            update: updateVisbility,
        });
    }

    /**
     * Updates an existing pipeline's token (rerolls it).
     */
    async actionUpdateToken(): Promise<void> {
        await this.actionUpdate({
            prompts: [],
            update: updateToken,
        });
    }

    /**
     * Assigns a user to a pipeline.
     */
    async actionAssign(): Promise<void> {
        const pipelines = await this._service.getAll();
        if (pipelines === "error") {
            console.log("An error occurred getting all pipelines.");
            return;
        }
        if (pipelines.length === 0) {
            console.log("There are no pipelines.");
            return;
        }
        const userService = new UserService();
        const users = await userService.getAll();
        if (users === "error") {
            console.log("An error occurred getting all users.");
            return;
        }
        if (users.length === 0) {
            console.log("There are no users");
            return;
        }
        const names = pipelines.map((pipeline: Pipeline): string => pipeline.name);
        let response = await prompts(promptList("Which pipeline should someone be added to?", names));
        // Check for early return.
        if (unanswered(response)) {
            return;
        }
        // Get the pipeline by name.
        const pipeline = await this._service.getOne(response.name);
        // Ask for the user.
        const userNames = users.map((user: User): string => user.name);
        response = await prompts(promptList("Which user should be added to this pipeline?", userNames));
        // Check for early returns.
        if (unanswered(response)) {
            return;
        }
        // Get the user by name.
        const user = await userService.getOne(response.name);
        // Add them.
        pipeline.assignees.push(user);
        const status = await this._service.update(pipeline);
        console.log(status === "success" 
            ? "The user has been assigned."
            : "An error occurred assigning the user."
        );
    }

    /**
     * Unassigns a user from a pipeline.
     */
    async actionUnassign(): Promise<void> {
        const pipelines = await this._service.getAll();
        if (pipelines === "error") {
            console.log("An error occurred getting all pipelines.");
            return;
        }
        if (pipelines.length === 0) {
            console.log("There are no pipelines.");
            return;
        }
        const names = pipelines.map((pipeline: Pipeline): string => pipeline.name);
        let response = await prompts(promptList("Which pipeline should someone be removed from?", names));
        // Get the pipeline by name.
        const pipeline = await this._service.getOne(response.name);
        // Ask for the user.
        const userNames = pipeline.assignees.map((user: User): string => user.name);
        response = await prompts(promptList("Which user should be added to this pipeline?", userNames));
        // Check for early returns.
        if (unanswered(response)) {
            return;
        }
        // Remove them.
        pipeline.assignees = pipeline.assignees.filter((user: User): boolean => user.name !== response.name);
        const status = await this._service.update(pipeline);
        console.log(status === "success" 
            ? "The user has been unassigned."
            : "An error occurred unassigning the user."
        );
    }

}

/**
 * Updates the visibility.
 * @param pipeline The pipeline.
 * @param response The response.
 */
async function updateVisbility(pipeline: Pipeline, response: any) {
    pipeline.public = response.public;
}

/**
 * Updates the token.
 * @param pipeline The pipeline.
 * @param _ The response, ignored.
 */
async function updateToken(pipeline: Pipeline, _: any) {
    pipeline.token = await randomToken();
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
   return crypto.randomBytes(16).toString("hex");
}