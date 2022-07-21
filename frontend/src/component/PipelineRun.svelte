<script>
    // Import the required modal component.
    import Modal from "./Modal.svelte";
    import WorkButton from "./WorkButton.svelte";

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
            <WorkButton inProgress={runProgress} titleInProgress={"Starting..."} titleNormal={"Run"}/>
        </div>
    </form>
</Modal>