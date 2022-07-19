import { User } from "./store";

export async function login(username, password) {
    
}

export async function logout() {
    User.set(undefined);
}