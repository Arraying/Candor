import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import bcrypt from "bcrypt";
import { User } from "../entities/User";

/**
 * Gets the self user, if logged in.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export async function me(req: Request, res: Response) {
    if (!req.session.user) {
        res.sendStatus(401);
        return;
    }
    res.send(getUserInfo(req.session.user));
}

/**
 * Attempts to create a session and log in with the credentials.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export async function login(req: Request, res: Response) {
    if (req.session.user) {
        res.sendStatus(200);
        return;
    }
    const username = req.body.username;
    const password = req.body.password;
    if (!username || !password) {
        res.sendStatus(400);
        return;
    }
    const repository = AppDataSource.manager.getRepository(User);
    const user = await repository.findOneBy({
        name: username,
    });
    if (!user) {
        res.sendStatus(401);
        return;
    }
    const comparison = await bcrypt.compare(password, user.token);
    if (!comparison) {
        res.sendStatus(401);
        return;
    }
    req.session.user = user;
    res.sendStatus(200);
}

/**
 * Destroys the session.
 * @param req The request.
 * @param res The response.
 * @returns Nothing.
 */
export function logout(req: Request, res: Response) {
    // Log out either way.
    req.session.destroy(() => {
        res.sendStatus(200);
    });
}

/**
 * Gets stripped down user info for the user.
 * @param user The user.
 * @returns A stripped down user info.
 */
function getUserInfo(user: User): { id: number, name: string } {
    return {
        id: user.id,
        name: user.name,
    };
}