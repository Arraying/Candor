<script>
    // Import helper to throw an event when the log is opened.
    import { createEventDispatcher } from "svelte";

    // Import various components to help abstract.
    import Status from "./Status.svelte";

    // Keep track of the runs.
    export let pipelineId, runs;

    // Keep track of the logs dispatcher.
    const dispatch = createEventDispatcher();

    /**
     * Opens the log.
     * @param runId The run ID.
     */
    const log = (runId) => {
        dispatch("showLog", { runId: runId });
    };
    console.log(runs);
</script>

<table class="table is-fullwidth">
    <tbody>
        {#each runs as run}
            <tr>
                <td class="table-run">
                    <Status status={run.status}/>
                    <span>
                        <strong>#{run.id}</strong>
                    </span>
                </td>
                <td class="table-stages">
                    <div class="tags">
                        {#each run.stages as stage}
                            <span class="tag">
                                <span>{stage.name}</span>
                                <Status status={stage.status}/>
                            </span>
                        {/each}
                    </div>
                </td>
                <td class="table-time">
                    <abbr title={run.started}>
                        <em>{run.duration}</em>
                    </abbr>
                </td>
                <td>
                    <div class="tags">
                        {#each run.archived as archived}
                            <a href="/api/runs/{pipelineId}/${run.id}/archived" download="{pipelineId}-{run.id}-archive.tar.gz" class="tag is-link is-light">{archived}</a>
                        {/each}
                    </div>
                </td>
                <td>
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <a on:click|preventDefault={() => log(run.id)}>Log</a>
                </td>
            </tr>
        {/each}
    </tbody>
</table>


<style>
    .table-run {
        width: 30%;
    }

    .table-stages {
        width: 20%;
    }

    .table-time {
        width: 15%;
    }
</style>