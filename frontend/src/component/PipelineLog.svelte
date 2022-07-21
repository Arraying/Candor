<script>
    // Import required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";

    // Export the required variables.
    export let active, pipelineId, runId;

    // Keep track of the promise.
    let promise;
    $: {
        // Only fetch if activated.
        if (active) {
            promise = loadLog(pipelineId, runId);
        }
    }

    /**
     * Loads the log.
     * @param pipelineId The pipeline ID.
     * @param runId The run ID.
     */
    async function loadLog(pipelineId, runId) {
        return Promise.resolve("Log");
    }
</script>

<Modal {active} on:closeModal>
    <div class="card">
        <header class="card-header">
            <p class="card-header-title">
                Logs (Run: {runId})
            </p>
        </header>
        
    </div>
    <div class="box logs">
        {#await promise}
            <Loading />
        {:then log} 
            {log}
        {:catch}
            Could not load log!
        {/await}
    </div>
</Modal>

<style>
    .card {
        border-radius: 0;
    }

    .logs {
        border-radius: 0;
        overflow: scroll;
        scroll-padding: 1.25rem;
        white-space: pre-wrap;
    }
</style>