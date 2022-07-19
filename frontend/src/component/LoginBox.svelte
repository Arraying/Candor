<script>
    // Import the event dispatcher such that we can close the modal when the login is successful.
    import { createEventDispatcher } from 'svelte';
    
    // Import stateful information.
	import { login } from "../session";

    // Keep track of form specific variables.
    let username, password;
    let loginProgress = false, loginError;

    // Dispatcher to notify parents that the login was successful.
    const dispatch = createEventDispatcher();

    /**
     * Attempts a login.
     */
    const attemptLogin = () => {
        // Create the login promise.
        const loginPromise = login(username, password);
        // Set the loading state.
        loginProgress = true;
        // Handle depending on status code.
        loginPromise.then(response => {
            if (response === 200) {
                // Success full login.
                loginError = undefined;
                dispatch("loginSuccess");
            } else if (response === 401) {
                // Invalid credentials.
                loginError = "Incorrect username or password!"
            } else {
                // Unknown.
                loginError = `Internal error ${code}!`;
            }
            // Reset password prompt, but keep username.
            password = undefined;
        });
        // Reset login state.
        loginPromise.finally(() => {
            loginProgress = false;
            loginText = "Login";
        });
    }
</script>

<form on:submit|preventDefault={attemptLogin} class="box">
    <div class="field">
        <label for="" class="label">Username</label>
        <div class="control has-icons-left">
            <input type="text" class="input" class:is-danger={loginError} bind:value={username} required>
            <span class="icon is-small is-left">
                <i class="fa fa-user"></i>
            </span>
        </div>
        {#if loginError}
            <p class="help is-danger">
                { loginError }
            </p>
        {/if}
    </div>
    <div class="field">
        <label for="" class="label">Password</label>
        <div class="control has-icons-left">
            <input type="password" class="input" class:is-danger={loginError} bind:value={password} required>
            <span class="icon is-small is-left">
                <i class="fa fa-lock"></i>
            </span>
        </div>
        {#if loginError}
            <p class="help is-danger">
                { loginError }
            </p>
        {/if}
    </div>
    <div class="field">
        <button class="button" class:is-black={!loginProgress} class:is-light={loginProgress} disabled={loginProgress}>
        {#if loginProgress}
            <span class="icon">
                <i class="fas fa-spinner fa-pulse"></i>
            </span>
        {/if}
        <span>
            {#if loginProgress}
                Logging in...
            {:else}
                Login
            {/if}
        </span>
        </button>
    </div>
</form>

<style>
    .box {
        border-radius: 0;
    }
</style>
