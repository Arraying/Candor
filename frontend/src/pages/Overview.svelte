<script>
    // Import all the pipeline overviews.
    import { PipelineOverviewStore } from "../store";
    import { fade } from "svelte/transition";

    function loadPipelines() {
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve($PipelineOverviewStore);
            }, 500);
        });
    }

    // Attempt to click on the pipeline.
    const selectPipeline = (pipelineId) => {
        console.log("Selected " + pipelineId);
    };
</script>

<section class="section">
    <div class="container">
        <h1 class="title">Pipelines</h1>
        <h2 class="subtitle has-text-weight-light">All pipelines visible to you</h2>
        {#await loadPipelines()}
            <nav class="level">
                <div class="level-item has-text-centered">
                    <span class="icon is-large">
                        <i class="fas fa-spinner fa-pulse"></i>
                    </span>
                </div>
            </nav>
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
                            <tr class="is-clickable" on:click={() => selectPipeline(pipelineOverview.id)}>
                                <td>{pipelineOverview.name}</td>
                                <td>{pipelineOverview.status}</td>
                                <td>
                                    {#each pipelineOverview.stages as stage}
                                        {#if stage === "Passed"}
                                            <span class="icon has-text-success">
                                                <i class="fas fa-check-circle"></i>
                                            </span>
                                        {:else if stage === "Failed"}
                                            <span class="icon has-text-danger">
                                                <i class="fas fa-times-circle"></i>
                                            </span>
                                        {:else if stage === "Skipped"}
                                            <span class="icon has-text-grey-light">
                                                <i class="fas fa-minus-circle"></i>
                                            </span>
                                        {:else if stage === "Error"}
                                            <span class="icon has-text-danger">
                                                <i class="fas fa-bug"></i>
                                            </span>
                                        {/if}
                                    {/each}
                                </td>
                                <td>{pipelineOverview.lastSuccess}</td>
                                <td>{pipelineOverview.lastFailure}</td>
                            </tr>
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