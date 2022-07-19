<script>
    // Import required Svelte features.
    import { fade } from "svelte/transition";

    // Import required components.
    import Loading from "./Loading.svelte";
    import PipelineListEntry from "./PipelineListEntry.svelte";
    import { User, Pipelines } from "../store";

    // Keep track of the username.
    let username;
    User.subscribe(value => username = (value ? value.name : "anonymous"));

    /**
     * Loads all pipelines.
     * Currently has a fake timeout to mock latency.
     */
    function loadPipelines() {
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve($Pipelines);
            }, 500);
        });
    }
</script>

<section class="section">
    <div class="container">
        <h1 class="title">Pipelines</h1>
        <h2 class="subtitle has-text-weight-light">All pipelines visible to <span class="has-text-weight-semibold">@{username}</span></h2>
        {#await loadPipelines()}
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
        {/await}
    </div>
</section>

<style>
    .overflow-container {
        overflow-x: auto;
    }
</style>