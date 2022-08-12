import { Runner } from "../entities/Runner";
import { RunnerService } from "../services/RunnerService";
import { promptName, promptList, unanswered } from "./actions-utils";
import prompts from "prompts";
import axios from "axios";

const service = new RunnerService();

/**
 * Lists all runners.
 */
export async function runnerList() {
    const runners = await service.getAll();
    if (runners === "error") {
        console.log("An error occurred listing all runners");
        return;
    }
    if (runners.length === 0) {
        console.log("There are no runners.");
        return;
    }
    for (const runner of runners) {
        console.log(`==> ID: ${runner.id}\n    Name: ${runner.name}\n    Host: ${runner.hostname}\n    Port: ${runner.port}`);
    }
}

/**
 * Adds a new runner.
 */
export async function runnerAdd() {
    const questions = [
        promptName(32, (name: string): Promise<boolean> => service.doesNameExist(name)), 
        ...promptHost()
    ];
    const response = await prompts(questions);
    // Check if we need to return early.
    if (unanswered(response)) {
        return;
    }
    const host = buildHost(response.protocol, response.domain);
    // Check if the host is reachable.
    if (!await testHost(host)) {
        console.log(`Could not establish a connection to ${host}.`);
        return;
    }
    const runner = new Runner();
    runner.name = response.name;
    runner.hostname = host;
    // TODO: Remove.
    runner.port = 3001;
    const status = await service.create(runner);
    console.log(status === "success" 
        ? "The runner has been created. Please ensure that it uses the same secret."
        : "An error occurred creating the runner."
    );
}

/**
 * Changes the hostname of a runner.
 */
export async function runnerHost() {
    const runners = await service.getAll();
    if (runners === "error") {
        console.log("An error occurred getting all runners.");
        return;
    }
    if (runners.length === 0) {
        console.log("There are no runners.");
        return;
    }
    const names = runners.map((runner: Runner): string => runner.name);
    let response = await prompts(promptList("Which runner should be updated?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Get the runner by name.
    const runner = await service.getOne(response.name);
    response = await prompts(promptHost());
    if (unanswered(response)) {
        return;
    }
    // Update the host. Don't perform any validation.
    const host = buildHost(response.protocol, response.domain);
    runner.hostname = host;
    const status = await service.update(runner);
    console.log(status === "success" 
        ? "The runner has been updated."
        : "An error occurred updating the runner."
    );
}

/**
 * Deletes an existing runner.
 */
export async function runnerDel() {
    const runners = await service.getAll();
    if (runners === "error") {
        console.log("An error occurred getting all runners.");
        return;
    }
    if (runners.length === 0) {
        console.log("There are no runners.");
        return;
    }
    const names = runners.map((runner: Runner): string => runner.name);
    const response = await prompts(promptList("Which runner should be deleted?", names));
    // Check for early return.
    if (unanswered(response)) {
        return;
    }
    // Delete by name.
    const status = await service.delete(response.name);
    console.log(status === "success" 
        ? "The runner has been deleted."
        : "An error occurred deleting the runner."
    );
}

/**
 * Gets all prompts to figure out the host.
 * @returns The prompts for the host.
 */
function promptHost(): prompts.PromptObject[] {
    return [
        {
            type: "toggle",
            name: "protocol",
            message: "What is the protocol of the runner?",
            initial: false,
            active: "https://",
            inactive: "http://",
        },
        {
            type: "text",
            name: "domain",
            message: "What is the domain (incl. port) of the runner?",
            initial: "localhost",
            validate: (input: string): boolean | string => {
                if (!input) {
                    return "The domain cannot be empty";
                }
                return true;
            }
        }
    ];
}

/**
 * Tests the connection to a host.
 * @param host The host string.
 * @returns True if it is successful, false otherwise.
 */
async function testHost(host: string): Promise<boolean> {
    try {
        const response = await axios.get(host);
        return response.status === 200;
    } catch (error) {
        return false;
    }
}

/**
 * Builds the host string.
 * @param protocol True for HTTPS, false for HTTP.
 * @param domain The domain including port.
 * @returns The full host.
 */
function buildHost(protocol: boolean, domain: string): string {
    return `${protocol ? "https" : "http"}://${domain}`;
}

