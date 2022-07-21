<script>
    // Import required Svelte features.
    import { fade } from "svelte/transition";

    // Import required components.
    import Loading from "./Loading.svelte";
    import PipelineListEntry from "./PipelineListEntry.svelte";

    // Keep track of state variables and requests.
    import { User } from "../store";
    import { call } from "../requests";

    // Keep track of the pipeline loading.
    let promise = loadPipelines();

    // Keep track of the username.
    let username;
    User.subscribe(newUser => {
        // Update the new username.
        username = newUser ? newUser.name : "anonymous";
        // Also fetch new pipelines.
        // The short loading flash is okay here.
        promise = loadPipelines();
    });

    /**
     * Loads all pipelines.
     * Currently has a fake timeout to mock latency.
     */
    async function loadPipelines() {
        const response = await call("GET", "/api/pipelines");
        if (response.status !== 200) {
            console.error(`Received status ${response.status} loading pipelines`);
            return [];
        }
        return await response.json();
    }
</script>

<section class="section">
    <div class="container">
        <h1 class="title">Pipelines</h1>
        <h2 class="subtitle has-text-weight-light">All pipelines visible to <span class="has-text-weight-semibold">@{username}</span></h2>
        {#await promise}
            <Loading />
        {:then overviews}
            <div class="overflow-container">
                <table class="table is-size-5 is-fullwidth is-hoverable" transition:fade|local>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th><abbr title="Aggregated over all stages">Status</abbr></th>
                            <th>Stages</th>
                            <th>Last success</th>
                            <th>Last failure</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each overviews as pipelineOverview (pipelineOverview.id)}
                            <PipelineListEntry pipeline={pipelineOverview} on:pipelineSelect/>
                        {/each}
                    </tbody>
                </table>
            </div>
        {:catch}
            No pipelines could be loaded!
        {/await}
    </div>
</section>

<style>
    .overflow-container {
        overflow-x: auto;
    }
</style>