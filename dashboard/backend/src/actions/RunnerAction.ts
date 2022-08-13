import { Runner } from "../entities/Runner";
import { RunnerService } from "../services/RunnerService";
import { BaseAction } from "./BaseAction";
import axios from "axios";
import prompts, { PromptObject } from "prompts";

export class RunnerAction extends BaseAction<Runner> {

    constructor() {
        const service = new RunnerService();
        super(service, "runner", 32);
    }

    protected prettyPrint(runner: Runner): void {
        console.log(`==> ID: ${runner.id}\n    Name: ${runner.name}\n    Host: ${runner.hostname}`);
    }

    protected createPrompts(): PromptObject<string>[] {
        return promptHost();
    }

    protected async createValidateInput(response: any): Promise<string | null> {
        const host = buildHost(response.protocol, response.domain);
        // Check if the host is reachable.
        if (!await testHost(host)) {
            return `Could not establish a connection to ${host}, so the runner has not been added.`;
        }
        return null;
    }

    protected async createBuildEntity(response: any): Promise<Runner> {
        const host = buildHost(response.protocol, response.domain);
        const runner = new Runner();
        runner.hostname = host;
        return runner;
    }

    protected createInfoMessage(): string {
        return "Please ensure that it uses the same secret.";
    }

    /**
     * Updates an existing runner's host.
     */
    async actionUpdateHost(): Promise<void> {
        await this.actionUpdate({
            prompts: promptHost(),
            update: updateHost,
        });
    }
}

/**
 * Updates the new host.
 * @param runner The runner.
 * @param response The response.
 */
function updateHost(runner: Runner, response: any) {
    // Update the host. Don't perform any validation.
    const host = buildHost(response.protocol, response.domain);
    runner.hostname = host;
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
        },
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