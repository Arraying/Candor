import * as readline from "readline";
import { runnerList, runnerInfo, runnerAdd, runnerDel } from "./commands/runner";
import { pipelineList, pipelineInfo, pipelineAdd, pipelineDel, pipelinePublic, run } from "./commands/pipeline";
import { userList, userInfo, userAdd, userDel, userReset } from "./commands/user";
import { assign, unassign } from "./commands/permission";

/**
 * Runs the comamnd line interface.
 */
export async function cli() {
    await help([]);
    // Console input and output client.
    // We do not close the client since it is open for the lifetime of the program.
    const client = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    // Question asking loop.
    while (true) {
        // Try to read command input.
        const input = await ask(client);
        // Find the command for which the input starts with said command name.
        const command = Array.from(commands.entries())
            .find((entry: [string, Command]): boolean => input.toLowerCase().startsWith(entry[0]));
        // Add the padding.
        console.log("");
        // If the command is not found, let the user know.
        if (!command) {
            console.log('Unknown command, Type "help" for a list of commands');
            continue;
        }
        // Get the arguments.
        const argsString = input.substring(command[0].length).trim();
        const args = argsString.split(" ");
        // Attempt to execute the command.
        const result = await command[1].executor(args);
        // Print usage if the command was not successful.
        if (!result) {
            console.log(`Incorrect usage! Proper usage: ${command[0]} ${command[1].usage}`);
        }
    }
}

/**
 * Represents a runnable command. Has:
 * 1. The usage (arguments).
 * 2. The description, for more information.
 * 3. An executor that executes it.
 */
interface Command {
    description: string
    usage: string
    executor: CommandExecutor
}

/**
 * The type that every command excutor will have.
 * It will take in the arguments and return true if the command was successful,
 * and false if the usage should be printed.
 */
type CommandExecutor = (args: string[]) => Promise<boolean>

/**
 * All available commands.
 */
const commands = new Map<string, Command>([
    ["help", {
        description: "Shows all commands available to run.",
        usage: "",
        executor: help,
    }],
    ["runner ls", {
        description: "Lists all pipeline runners.",
        usage: "",
        executor: runnerList,
    }],
    ["runner info", {
        description: "Shows information on a pipeline runner.",
        usage: "<name>",
        executor: runnerInfo,
    }],
    ["runner add", {
        description: "Registers a new pipeline runner.",
        usage: "<name> <host:port>",
        executor: runnerAdd,
    }],
    ["runner del", {
        description: "Unregisters an existing pipeline runner.",
        usage: "<name>",
        executor: runnerDel,
    }],
    ["pipeline ls", {
        description: "Lists all pipelines.",
        usage: "",
        executor: pipelineList,
    }],
    ["pipeline info", {
        description: "Shows information on a pipeline.",
        usage: "<name>",
        executor: pipelineInfo,
    }],
    ["pipeline add", {
        description: "Creates a new pipeline.",
        usage: "<name>",
        executor: pipelineAdd,
    }],
    ["pipeline del", {
        description: "Deletes a pipeline.",
        usage: "<name>",
        executor: pipelineDel,
    }],
    ["pipeline pub", {
        description: "Sets the pipeline public visibility",
        usage: "<name> true|false",
        executor: pipelinePublic,
    }],
    ["pipeline run", {
        description: "Runs a pipeline (optionally on a specified runner).",
        usage: "<name> [runner]",
        executor: run,
    }],
    ["user ls", {
        description: "Lists all users.",
        usage: "",
        executor: userList,
    }],
    ["user info", {
        description: "Shows information on a user.",
        usage: "<name>",
        executor: userInfo,
    }],
    ["user add", {
        description: "Creates a new user and prints their token.",
        usage: "<name>",
        executor: userAdd,
    }],
    ["user del", {
        description: "Deletes a user.",
        usage: "<name>",
        executor: userDel,
    }],
    ["user reset", {
        description: "Resets a users's token and prints the new one.",
        usage: "<name>",
        executor: userReset,
    }],
    ["assign", {
        description: "Grants a user access to a pipeline.",
        usage: "<user> <pipeline>",
        executor: assign,
    }],
    ["unassign", {
        description: "Revokes a user's access from a pipleine.",
        usage: "<user> <pipeline>",
        executor: unassign,
    }],
    ["exit", {
        description: "Shuts down the server.",
        usage: "",
        executor: exit,
    }],
]);

/**
 * Shows the help screen.
 * @param _ Ignored.
 * @returns Always true.
 */
async function help(_: string[]): Promise<boolean> {
    // Print the splash screen.
    splash();
    console.log("\nAvailable commands:");
    // Compute what the longest command usage is.
    const lengths = Array.from(commands.entries())
        .map((entry: [string, Command]): number => entry[0].length + entry[1].usage.length + 1);
    const longest = Math.max(...lengths);
    // Iterate through all commands and print usage information.
    for (const [name, object] of commands.entries()) {
        // Calculate the padding to use based on the longest.
        const pad = "".padStart(longest - name.length - object.usage.length - 1, " ");
        console.log(`${name} ${object.usage}${pad}\t${object.description}`)
    }
    console.log("\nLicensed under MIT license.");
    return true;
}

/**
 * Shuts down the server.
 * @param _ Ignored.
 */
async function exit(_: string[]): Promise<boolean> {
    process.exit(0);
}

/**
 * Turns the readline API into a promise.
 * This is due to the promise readline API not being available on Node v16.
 * @param client The readline interface.
 * @returns A promise of the input.
 */
async function ask(client: readline.Interface): Promise<string> {
    return new Promise((resolve, _) => {
        client.question("\n> ", (answer: string) => resolve(answer));
    });
}

/**
 * Shows ASCII art of Candor.
 */
function splash() {
    console.log(">> Welcome to Candor! <<");
}