<script>
    // Import various components to help abstract.
    import Status from "./Status.svelte";
    // Keep track of the runs.
    export let runs;
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
                <td class="table-time"><em>{run.time}</em></td>
                <td>
                    <div class="tags">
                        {#each run.artifacts as artifact}
                            <span class="tag is-link is-light">{artifact}</span>
                        {/each}
                    </div>
                </td>
                <td>
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <a>Log</a>
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