<script>
    let username, password;
    let loginError;

    /**
     * Attempts a login.
     */
    const attemptLogin = () => {
        if (username === "test" && password === "test") {
            loginError = "Login success"
        } else {
            loginError = "Invalid username or password!";
        }
    }
</script>


<form on:submit|preventDefault={attemptLogin} class="box">
    <div class="field">
        <label for="" class="label">Username</label>
        <div class="control has-icons-left">
            <input type="text" class="input" bind:value={username} required>
            <span class="icon is-small is-left">
                <i class="fa fa-user"></i>
            </span>
        </div>
    </div>
    <div class="field">
        <label for="" class="label">Password</label>
        <div class="control has-icons-left">
            <input type="password" class="input" bind:value={password} required>
            <span class="icon is-small is-left">
                <i class="fa fa-lock"></i>
            </span>
        </div>
    </div>
    <div class="field">
        <button class="button is-black">Login</button>
    </div>
    {#if loginError}
        <p class="error-text">
            { loginError }
        </p>
    {/if}
</form>

<style>
    .box {
        border-radius: 0;
        box-shadow: none;
    }

    .error-text {
        color: red;
    }
</style>