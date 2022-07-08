import { Request, Response } from "express";

/**
 * Security middleware that requires the user to be logged in.
 */
export default (req: Request, res: Response, next: () => void) => {
    // Ensure the user is logged in.
    if (!req.session.user) {
        // Send 401, this will tell the frontend to re-log in.
        res.sendStatus(401);
        return;
    }
    // If yes, continue.
    next();
} 