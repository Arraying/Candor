<script>
    // Import all the pipeline overviews.
    import { PipelineOverviewStore } from "../store";

    // Attempt to click on the pipeline.
    const selectPipeline = (pipelineId) => {
        console.log("Selected " + pipelineId);
    };
</script>

<section class="section">
    <div class="container">
        <h1 class="title">Pipelines</h1>
        <h2 class="subtitle has-text-weight-light">All pipelines visible to you</h2>
        <table class="table is-size-5 is-fullwidth is-hoverable">
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
                {#each $PipelineOverviewStore as pipelineOverview (pipelineOverview.id)}
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
</section>