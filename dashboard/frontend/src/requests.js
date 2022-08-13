/**
 * Performs a HTTP request with boilerplate.
 * @param {string} method The HTTP method.
 * @param {string} path The path, requires leading /.
 * @returns A promise of the response.
 */
export async function call(method, path, body) {
    return fetch(`CANDOR_BASE_URL${path}`, {
        method: method,
        mode: "cors",
        credentials: "include",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * A promise that will automatically resolve after a set time.
 * @param {nunber} millis The number of milliseconds.
 * @returns A promise that resolves in the specified time.
 */
export function throttler(millis) {
    if (isNaN(millis) || millis < 0) {
        return Promise.resolve();
    }
    return new Promise((resolve, _) => {
        setTimeout(() => {
            resolve();
        }, millis);
    });
}