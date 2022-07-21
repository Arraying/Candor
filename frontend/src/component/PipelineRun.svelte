<script>
    // Import the event dispatcher such that we can update the pipeline.
    import { createEventDispatcher } from 'svelte';

    // Import the required modal component.
    import Modal from "./Modal.svelte";
    import WorkButton from "./WorkButton.svelte";

    // Import requests.
    import { call } from "../requests";

    // The required variables.
    export let active, trigger, requiredParameters;

    // Dispatcher to notify parents that the pipeline state has changed.
    const dispatch = createEventDispatcher();
    
    // Whether or not the run is in progress.
    let runProgress, modal, parameterBindings = {};

    /**
     * Runs the pipeline with the provided parameters.
     */
    const run = () => {
        runProgress = true;
        // Convert to queryString.
        const queryString = requiredParameters.length > 0 ? `?${new URLSearchParams(parameterBindings).toString()}` : "";
        // Execute request.
        call("POST", `/trigger/${trigger}${queryString}`)
            .then(_ => {
                modal.closeModal();
                dispatch("pipelineRun");
            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                runProgress = false;
                parameterBindings = {};
            });
    };
</script>

<Modal {active} on:closeModal bind:this={modal}>
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