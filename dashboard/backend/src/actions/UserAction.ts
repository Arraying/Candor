import bcrypt from "bcrypt";
import prompts, { PromptObject } from "prompts";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";
import { UserService } from "../services/UserService";
import { BaseAction } from "./BaseAction";

export class UserAction extends BaseAction<User> {

    constructor() {
        const service = new UserService();
        super(service, "user", 64);
    }

    protected prettyPrint(user: User): void {
        // Get pipeline names.
        const names = user.pipelines.map((pipeline: Pipeline): string => pipeline.name).join(", ");
        console.log(`==> ID: ${user.id}\n    Name: ${user.name}\n    Assigned: ${names}`);
    }

    protected createPrompts(): PromptObject<string>[] {
        return [promptPassword()];
    }

    protected async createValidateInput(_: any): Promise<string | null> {
        return null;
    }

    protected async createBuildEntity(response: any): Promise<User> {
        const user = new User();
        // Hash the password.
        user.token = await hashPassword(response.password);
        return user;
    }

    protected createInfoMessage(): string {
        return "";
    }

    /**
     * Updates an existing user's password.
     */
    async actionUpdatePassword(): Promise<void> {
        await this.actionUpdate({
            prompts: [promptPassword()],
            update: updatePassword,
        });
    }

}

/**
 * Updates the user's password.
 * @param user The user.
 * @param response The response containing the plaintext password.
 */
async function updatePassword(user: User, response: any) {
    user.token = await hashPassword(response.password);
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
        },
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