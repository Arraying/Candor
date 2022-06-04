import { AppDataSource } from "../data-source";
import { Runner } from "../entities/Runner";

/**
 * Lists all runners.
 * @param _ Ignored.
 * @returns Always true.
 */
export async function runnerList(_: string[]): Promise<boolean> {
    const repository = AppDataSource.manager.getRepository(Runner);
    const runners = await repository.find();
    for (const runner of runners) {
        runnerPrint(runner);
        console.log("\n");
    }
    return true;
}

/**
 * Shows information on a single runner.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function runnerInfo(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(Runner);
    const runner = await repository.findOneBy({
        name: args[0],
    });
    if (runner) {
        runnerPrint(runner);
    } else {
        console.log("A runner with that name does not exist");
    }
    return true;
}

/**
 * Creates a runner by name if it does not exist yet.
 * @param args The first argument must be the name, the second the host:port.
 * @returns True if the name and host:port are provided.
 */
export async function runnerAdd(args: string[]): Promise<boolean> {
    if (!args[0] || !args[1]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(Runner);
    if (await repository.findOneBy({
        name: args[0],
    })) {
        console.log("A runner with that name already exists");
        return true;
    }
    try {
        const locations = args[1].split(":");
        if (locations.length != 2) {
            throw new Error();
        }
        const host = locations[0];
        const port = parseInt(locations[1]);
        const runner = new Runner();
        runner.name = args[0];
        runner.hostname = host;
        runner.port = port;
        repository.insert(runner);
        console.log("The runner has been added");
    } catch (exception) {
        console.log("Malformed host and port");
    }
    return true;
}

/**
 * Deletes a runner by name if it already exists.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function runnerDel(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(Runner);
    const runner = await repository.findOneBy({
        name: args[0],
    });
    if (runner) {
        repository.delete(runner);
        console.log("The runner has been deleted");
    } else {
        console.log("A runner with that name does not exist");
    }
    return true;
}

/**
 * Pretty prints a runner.
 * @param runner The runner.
 */
function runnerPrint(runner: Runner) {
    console.log(`${runner.name} (${runner.id})\n  - ${runner.hostname}\n  - ${runner.port}`);
}