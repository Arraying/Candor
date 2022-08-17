<script>
    // Import required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";

    // Utility for requests.
    import { call, throttler } from "../requests";

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
        const request = call("GET", `/api/runs/${pipelineId}/${runId}/log`);
        const responseRaw = await Promise.all([request, throttler(200)]);
        const response = responseRaw[0];
        // Handle non 200.
        if (response.status !== 200) {
            console.error(`Received status ${response.status} loading pipeline ${pipelineId} build ${buildId} logs`);
            throw new Error(`Get pipeline response status ${response.status}`);
        }
        // Return it as plain text
        return response.text();
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
        font-family: monospace;
        overflow: scroll;
        scroll-padding: 1.25rem;
        white-space: pre-wrap;
    }
</style>