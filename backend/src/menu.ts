import { pipelineList, pipelineAdd, pipelinePublic, pipelineDel } from "./actions/actions-pipeline";
import { userList, userAdd, userReset, userDel } from "./actions/actions-user";
import { runnerList, runnerAdd, runnerHost, runnerDel } from "./actions/actions-runner";
import prompts from "prompts";

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
            { title: "List pipelines", description: "Lists all pipelines.", value: pipelineList },
            { title: "New pipeline", description: "Creates a new pipeline.", value: pipelineAdd },
            { title: "Modify pipeline visibility", description: "Modifies whether or not the pipeline is visible.", value: pipelinePublic },
            { title: "Delete pipeline", description: "Deletes an existing pipeline.", value: pipelineDel },
            { title: "List users", description: "Lists all users.", value: userList },
            { title: "New user", description: "Creates a new user.", value: userAdd },
            { title: "Reset user password", description: "Resets an existing user's password.", value: userReset},
            { title: "Delete user", description: "Deletes an existing user.", value: userDel },
            { title: "List runners", description: "Lists all runners.", value: runnerList },
            { title: "New runner", description: "Registers a new runner.", value: runnerAdd },
            { title: "Modify runner host", description: "Changes the runner's host.", value: runnerHost },
            { title: "Delete runner", description: "Deletes an existing runner.", value: runnerDel },
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
