import { User } from "./store";

export async function login(username, password) {
    return new Promise((resolve, _) => {
        let timeout = setTimeout(() => {
            clearTimeout(timeout);
            if (username === "foo" && password === "bar") {
                resolve(200);
                User.set({
                    name: "root",
                })
            } else {
                resolve(401);
            }
        }, 500);
    });
}

export async function logout() {
    User.set(undefined);
}