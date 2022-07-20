import { User } from "./store";
import { call } from "./requests";

/**
 * Gets self information and saves it in the store if applicable.
 */
export async function me() {
    let self;
    try {
        const response = await call("GET", "/me");
        if (response.status === 200) {
            self = await response.json();
        }
    } catch (error) {
        console.log(error);
    }
    User.set(self);
}

/**
 * Attempts to log in with username and password.
 * This will also set the user.
 * @param {string} username The username.
 * @param {string} password The password.
 * @returns The status code of the login endpoint.
 */
export async function login(username, password) {
    try {
        const response = await call("POST", "/login", {
            username: username,
            password: password,
        });
        if (response.status === 200) {
            await me();
        }
        return response.status;
    } catch (error) {
        console.log(error);
        return "request failed";
    }
}

/**
 * Destroys any existing session.
 */
export async function logout() {
    await call("POST", "/logout");
    User.set(undefined);
}