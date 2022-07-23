import { Request, Response, } from "express";

/**
 * Ensures that only authorized requests may trigger actions.
 * @param req The incoming request.
 * @param res The response.
 * @param next The next handler in the middleware chain.
 */
export function authorizationMiddleware(req: Request, res: Response, next: () => void): void {
    // Ensure the authorization header is set.
    if (!req.headers.authorization) {
        res.sendStatus(400);
        return;
    }
    // Get the tokens.
    const actualToken = process.env.RUNNER_TOKEN;
    const potentialToken = req.headers.authorization;
    // If there is no actual token set, deny it.
    if (actualToken == null || actualToken === "") {
        res.sendStatus(401);
        return;
    }
    // If the token does not match, deny it.
    if (`Bearer ${actualToken}` !== potentialToken) {
        res.sendStatus(401);
        return;
    }
    // Everything is good here, let the request through.
    next();
}
