import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { createUser } from "../database";

export async function makeAdmin(req: Request, res: Response): Promise<void> {
    const secret = process.env.SECRET;
    // Make sure the header is actually set. Or, if the secret is not set, always block.
    if (!req.headers.authorization || !secret) {
        res.sendStatus(401);
        return;
    }
    // Compare the token.
    if (req.headers.authorization !== `Bearer ${secret}`) {
        res.sendStatus(401);
        return;
    }
    // Ensure that the username and password meet requirements.
    const username = req.body.username;
    const password = req.body.password;
    if (username == null || username.length === 0 || username.length > 32) {
        res.sendStatus(400);
        return;
    }
    if (password == null || password.length === 0) {
        res.sendStatus(400);
        return;
    }
    // Hash password with salt.
    const hash = await bcrypt.hash(password, 10);
    try {
        await createUser(username, hash);
        res.sendStatus(204);
    } catch (exception: any) {
        // On username conflict, relay to user.
        if (exception.code != null && exception.code === "23505") {
            res.sendStatus(409);
        } else {
            console.error(exception);
            res.sendStatus(500);
        }

    }
}