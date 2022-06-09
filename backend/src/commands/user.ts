import bycrpt from "bcrypt";
import { AppDataSource } from "../data-source";
import { Pipeline } from "../entities/Pipeline";
import { User } from "../entities/User";

/**
 * Lists all users.
 * @param _ Ignored.
 * @returns Always true.
 */
export async function userList(_: string[]): Promise<boolean> {
    const repository = AppDataSource.manager.getRepository(User);
    const users = await repository.find();
    console.log("Here is a list of users:")
    for (const user of users) {
        userPrint(user);
    }
    return true;
}

/**
 * Shows information on a single user.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function userInfo(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(User);
    const user = await repository.findOne({
        where: {
            name: args[0],
        },
        relations: ["pipelines"],
    });
    if (user) {
        userPrint(user);
    } else {
        console.log("A user with that name does not exist");
    }
    return true;
}

/**
 * Creates a user by name if they does not exist yet.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function userAdd(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(User);
    if (await repository.findOneBy({
        name: args[0],
    })) {
        console.log("A user with that name already exists");
        return true;
    }
    const user = new User();
    user.name = args[0];
    user.token = "token"; // The token is hashed and a hash will not be this value.
    await repository.insert(user);
    console.log("The user has been added, please reset their password");
    return true;
}

/**
 * Deletes a user by name if they already exists.
 * @param args The first argument must be the name.
 * @returns True if the name is provided.
 */
export async function userDel(args: string[]): Promise<boolean> {
    if (!args[0]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(User);
    const user = await repository.findOneBy({
        name: args[0],
    });
    if (user) {
        await repository.remove(user);
        console.log("The user has been deleted");
    } else {
        console.log("A user with that name does not exist");
    }
    return true;
}

/**
 * Resets a user's password by name with the provided new password.
 * @param args The first argument must be the name, the second the password.
 * @returns True if the name and password are provided.
 */
export async function userReset(args: string[]): Promise<boolean> {
    if (!args[0] || !args[1]) {
        return false;
    }
    const repository = AppDataSource.manager.getRepository(User);
    const user = await repository.findOneBy({
        name: args[0],
    });
    if (user) {
        const hash = await bycrpt.hash(args[1], 10);
        user.token = hash;
        await repository.save(user);
        console.log("The user's password has been reset");
    } else {
        console.log("A user with that name does not exist");
    }
    return true;
}

/**
 * Pretty prints a user.
 * @param user The user.
 */
function userPrint(user: User) {
    // Get pipeline names.
    const names = user.pipelines.map((pipeline: Pipeline): string => pipeline.name).join(", ");
    console.log(`==> ${user.name} (${user.id})\n    <${names}>`);
}