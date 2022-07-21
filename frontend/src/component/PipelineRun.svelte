<script>
    // Import the required modal component.
    import Modal from "./Modal.svelte";

    // The required variables.
    export let active;
    export let requiredParameters;
    
    // Whether or not the run is in progress.
    let runProgress;
    let parameterBindings = {};

    /**
     * Runs the pipeline with the provided parameters.
     */
    const run = () => {
        // TODO: Actually run.
        // Reset everything.
        active = false;
        parameterBindings = {};
    };
</script>

<Modal {active} on:closeModal>
    <form on:submit|preventDefault={run} class="box">
        {#each requiredParameters as requiredParameter}
            <div class="field">
                <label for="" class="label">
                    {requiredParameter}
                </label>
                <div class="control">
                    <input type="text" class="input" bind:value={parameterBindings[requiredParameter]} required>
                </div>
            </div>
        {/each}
        <div class="field">
            <button class="button" class:is-black={!runProgress} class:is-light={runProgress} disabled={runProgress}>
            {#if runProgress}
                <span class="icon">
                    <i class="fas fa-spinner fa-pulse"></i>
                </span>
            {/if}
            <span>
                {#if runProgress}
                    Staring...
                {:else}
                    Run
                {/if}
            </span>
            </button>
        </div>
    </form>
</Modal>