import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";
import { UserService } from "../services/UserService";
import { promptName, promptList, unanswered } from "./actions-utils";
import bcrypt from "bcrypt";
import prompts from "prompts";

const service = new UserService();

/**
 * Lists all users.
 */
export async function userList() {
    const users = await service.getAll();
    if (users === "error") {
        console.log("An error occurred listing all users.");
        return;
    }
    if (users.length === 0) {
        console.log("There are no users.");
        return;
    }
    for (const user of users) {
        // Get pipeline names.
        const names = user.pipelines.map((pipeline: Pipeline): string => pipeline.name).join(", ");
        console.log(`==> ID: ${user.id}\n    Name: ${user.name}\n    Assigned: ${names}`);
    }
}

/**
 * Adds a new user.
 */
 export async function userAdd() {
    const questions = [
        promptName(64, (name: string): Promise<boolean> => service.doesNameExist(name)), 
        promptPassword(),
    ];
    const response = await prompts(questions);
    // Check if we need to return early.
    if (unanswered(response)) {
        return;
    }
    const user = new User();
    user.name = response.name;
    // Hash the password.
    user.token = await hashPassword(response.password);
    const status = await service.create(user);
    console.log(status === "success" 
        ? "The user has been created."
        : "An error occurred creating the user."
    );
}

/**
 * Resets a user's password.
 */
export async function userReset() {
    const users = await service.getAll();
    if (users === "error") {
        console.log("An error occurred getting all users.");
        return;
    }
    if (users.length === 0) {
        console.log("There are no users.");
        return;
    }
    const names = users.map((user: User): string => user.name);
    let response = await prompts(promptList("Which user should have their password reset?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Get the user by name.
    const user = await service.getOne(response.name);
    response = await prompts(promptPassword());
    if (unanswered(response)) {
        return;
    }
    // Update the visibility.
    user.token = await hashPassword(response.password);
    const status = await service.update(user);
    console.log(status === "success" 
        ? "The user has been updated."
        : "An error occurred updating the user."
    );
}

/**
 * Deletes an existing user.
 */
 export async function userDel() {
    const users = await service.getAll();
    if (users === "error") {
        console.log("An error occurred getting all users.");
        return;
    }
    if (users.length === 0) {
        console.log("There are no users.");
        return;
    }
    const names = users.map((user: User): string => user.name);
    const response = await prompts(promptList("Which user should be deleted?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Delete by name.
    const status = await service.delete(response.name);
    console.log(status === "success" 
        ? "The user has been deleted."
        : "An error occurred deleting the user."
    );
}

/**
 * The prompt that asks for the user's password.
 * @returns A prompt.
 */
function promptPassword(): prompts.PromptObject {
    return {
        type: "password",
        name: "password",
        message: "Enter the desired password",
        validate: (input: string): boolean | string => {
            if (!input) {
                return "Password cannot be empty.";
            }
            return true;
        }
    };
}

/**
 * Hashes a password.
 * @param password The password in plain text.
 * @returns A hash of the password.
 */
async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}