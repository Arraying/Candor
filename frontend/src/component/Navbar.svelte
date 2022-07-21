<script>
    // Needed to dispatch navigation events.
    import { createEventDispatcher } from "svelte";

    // Use the user store and session info.
    import { logout } from "../session";
    import { User } from "../store";

    // Keep track of the user object.
    let user;
    User.subscribe(newUser => user = newUser);

    // Create the event dispatcher.
    const dispatch = createEventDispatcher();
</script>
<nav class="navbar is-black" aria-label="main navigation">
    <div class="navbar-brand">
        <a href="/" class="navbar-item is-size-4" on:click|preventDefault={() => dispatch("goPipelines")}>
            <strong>Candor</strong>
        </a>
        <a href="/" role="button" class="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
            <span aria-hidden="true"></span>
        </a>
    </div>
    <div id="navbar" class="navbar-menu">
        <div class="navbar-start">
            <a href="/" class="navbar-item" on:click|preventDefault={() => dispatch("goPipelines")}>
                Pipelines
            </a>
            <a href="/" class="navbar-item" on:click|preventDefault={() => dispatch("goAbout")}>
                About
            </a>
        </div>
          <div class="navbar-end">
            {#if user}
                <a href="/" class="navbar-item" on:click|preventDefault={logout}>
                    Logout
                </a>
            {:else}
                <a href="/" class="navbar-item" on:click|preventDefault={() => dispatch("goLogin")}>
                    Login
                </a>
            {/if}
            <div class="navbar-item">
                <a href="https://github.com/Arraying/Candor" class="button" target="_blank">
                    <span class="icon">
                        <i class="fab fa-github"></i>
                    </span>
                    <span>GitHub</span>
                </a>
            </div>
          </div>
    </div>
</nav>