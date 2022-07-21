<script>
    // Import various components to help abstract.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";
    import Status from "./Status.svelte";
    import { relativeTimeDifference } from "../utils";



    // Keep track of the runs.
    export let pipelineId, runs;

    // Keep track of the logs modal.
    let showLog;
    let logRunId;
    $: logPromise = loadLog(logRunId);

    // Calculate all of the runs.
    runs.forEach(run => {
        run.started = new Date(run.start).toString();
        run.duration = relativeTimeDifference(run.finish, run.start);
    });

    /**
     * Opens the log.
     * @param runId The run ID.
     */
    const log = (runId) => {
        showLog = true;
        logRunId = runId;
    };

    /**
     * Loads a log by run ID.
     * @param runId The run ID.
     */
    async function loadLog(runId) {
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve(("abcdefgh".repeat(20) + "\n").repeat(120));
            }, 1000);
        });
    }
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
                            <a href="/api/pipeline/{pipelineId}/archived" download="{pipelineId}-{run.id}-archive.tar.gz" class="tag is-link is-light">{archived}</a>
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
<Modal active={showLog} on:closeModal={() => showLog = false}>
    <div class="card">
        <header class="card-header">
            <p class="card-header-title">
                Logs (Run: {logRunId})
            </p>
        </header>
        
    </div>
    <div class="box logs">
        {#await logPromise}
            <Loading />
        {:then log} 
            {log}
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