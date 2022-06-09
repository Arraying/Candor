import { AppDataSource } from "../data-source";
import { Assignment } from "../entities/Assignment";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

/**
 * Small helper type for assignment action.
 */
type Action = "assign" | "unassign";

/**
 * Assigns a user to a pipeline.
 * @param args The first argument must be the user, the second the pipeline.
 * @returns True if the user and pipeline are provided.
 */
export async function assign(args: string[]): Promise<boolean> {
    return await perform(args, "assign");
}

/**
 * Unassigns a user from a pipeline.
 * @param args The first argument must be the user, the second the pipeline.
 * @returns True if the user and pipeline are provided.
 */
export async function unassign(args: string[]): Promise<boolean> {
    return await perform(args, "unassign");
}

/**
 * Either assigns or unassigns a user to/from a pipeline.
 * @param args The first argument must be the user, the second the pipeline.
 * @param action The action to perform.
 * @returns True if the user and pipeline are provided.
 */
async function perform(args: string[], action: Action): Promise<boolean> {
    if (!args[0] || !args[1]) {
        return false;
    }
    const user = await AppDataSource.manager.getRepository(User).findOneBy({
        name: args[0],
    });
    if (!user) {
        console.log("A user by that name does not exist");
        return true;
    }
    const pipeline = await AppDataSource.manager.getRepository(Pipeline).findOneBy({
        name: args[1]
    });
    if (!pipeline) {
        console.log("A pipeline by that name does not exist");
        return true;
    }
    const repository = AppDataSource.manager.getRepository(Assignment);
    const assignment = await repository.findOneBy({
        user: user.id,
        pipeline: pipeline.id
    });
    if (!assignment && action === "assign") {
        const newAssignment = new Assignment();
        newAssignment.user = user.id;
        newAssignment.pipeline = pipeline.id;
        await repository.save(newAssignment);
        console.log("The user has been assigned")
    } else if (assignment && action === "assign") {
        console.log("This user was already assigned to that pipeline");
    } else if (assignment && action === "unassign") {
        await repository.delete(assignment);
        console.log("The user has been unassigned")
    } else if (!assignment && action === "unassign") {
        console.log("This user was never assigned to that pipeline");
    } else {
        console.log("No action was performed");
    }
    return true;
}