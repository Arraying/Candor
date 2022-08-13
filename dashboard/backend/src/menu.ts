import prompts from "prompts";
import { RunnerAction } from "./actions/RunnerAction";
import { UserAction } from "./actions/UserAction";
import { PipelineAction } from "./actions/PipelineActions";

const pipeline = new PipelineAction();
const user = new UserAction();
const runner = new RunnerAction();

/**
 * The main menu loop, this will ensure the menu is always shown.
 */
export async function mainMenuLoop() {
    // Print the main menu.
    console.log("\nCandor by @Arraying");
    console.log("Licensed under the MIT license.");
    while (true) {
        if (await mainMenu()) {
            break;
        }
    }
}

/**
 * Asks the main menu questions and initiates a task.
 * @returns True if the menu should break out of the loop.
 */
async function mainMenu(): Promise<boolean> {
    console.log();
    // Ask the main menu question.
    const response = await prompts({
        type: "select",
        name: "value",
        message: "Please select an action:",
        choices: [
            { title: "List pipelines", description: "Lists all pipelines.", value: () => pipeline.actionList() },
            { title: "New pipeline", description: "Creates a new pipeline.", value: () => pipeline.actionCreate() },
            { title: "Modify pipeline visibility", description: "Modifies whether or not the pipeline is visible.", value: () => pipeline.actionUpdateVisibility() },
            { title: "Reroll pipeline token", description: "Re-generates a new token for the pipeline.", value: () => pipeline.actionUpdateToken() },
            { title: "Assign user to pipeline", description: "Gives a user access to the pipeline.", value: () => pipeline.actionAssign() },
            { title: "Unassign user from pipeline", description: "Removes access of a user from a pipeline.", value: () => pipeline.actionUnassign() },
            { title: "Delete pipeline", description: "Deletes an existing pipeline.", value: () => pipeline.actionDelete() },
            { title: "List users", description: "Lists all users.", value: () => user.actionList() },
            { title: "New user", description: "Creates a new user.", value: () => user.actionCreate() },
            { title: "Reset user password", description: "Resets an existing user's password.", value: () => user.actionUpdatePassword() },
            { title: "Delete user", description: "Deletes an existing user.", value: () => user.actionDelete() },
            { title: "List runners", description: "Lists all runners.", value: () => runner.actionList() },
            { title: "New runner", description: "Registers a new runner.", value: () => runner.actionCreate() },
            { title: "Modify runner host", description: "Changes the runner's host.", value: () => runner.actionUpdateHost() },
            { title: "Delete runner", description: "Deletes an existing runner.", value: () => runner.actionDelete() },
            { title: "Exit", description: "Shuts down the dashboard.", value: shutdown },
        ],
    });
    // Perform the selected action. Can be null.
    if (response.value) {
        await response.value();
        return false;
    }
    return true;
}

async function shutdown() {
    process.exit(0);
}
