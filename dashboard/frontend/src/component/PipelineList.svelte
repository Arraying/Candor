<script>
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
     * Updates the list of pipelines.
     */
    export function update() {
        const refreshedPromise = loadPipelines();
        // Only update later to avoid flashes.
        refreshedPromise            
            .catch(error => console.error(error))
            .finally(() => {
                promise = refreshedPromise;
            });
    }

    /**
     * Loads all pipelines.
     * Currently has a fake timeout to mock latency.
     */
    async function loadPipelines() {
        const response = await call("GET", "/api/pipelines");
        // If non 200, handle this.
        if (response.status !== 200) {
            console.error(`Received status ${response.status} loading pipelines`);
            return [];
        }
        // Define the pipelines so they can be sorted.
        const pipelines = await response.json();
        return pipelines.sort((left, right) => left.name.localeCompare(right.name));
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
                <table class="table is-size-5 is-fullwidth is-hoverable">
                    <thead>
                        <tr>
                            <th>
                                <span class="is-pulled-left">
                                    Name
                                </span>
                            <th>
                                <span class="is-pulled-left">
                                    <abbr title="Aggregated over all stages">
                                        Status
                                    </abbr>
                                </span>
                            </th>
                            <th>
                                <span class="is-pulled-left">
                                    Stages
                                </span>
                            </th>
                            <th>
                                <span class="is-pulled-left">
                                    Last success
                                </span>
                            </th>
                            <th>
                                <span class="is-pulled-left">
                                    Last failure
                                </span>
                            </th>
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