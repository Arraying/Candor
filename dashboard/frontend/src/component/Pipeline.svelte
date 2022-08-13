<script>
    // Import required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";
    import PipelineBlock from "./PipelineBlock.svelte";
    import PipelineEdit from "./PipelineEdit.svelte";
    import PipelineLog from "./PipelineLog.svelte";
    import PipelineRun from "./PipelineRun.svelte";
    import PipelineRuns from "./PipelineRuns.svelte";
    import WorkButton from "./WorkButton.svelte";

    // Import utility functions.
    import { call, throttler } from "../requests";
    import { relativeTimeDifference } from "../utils";

    // Which pipeline to show.
    export let pipelineId, pipelineName;
    
    // Activity depends on the state of the pipeline, only show if we have a pipeline selected.
    $: active = pipelineId !== undefined;

    // The promise that loads the actual pipeline.
    $: promise = loadPipeline(pipelineId, true);

    // Keep track of the modals.
    let showRun = false, showConfig = false, showLog = false;
    let showLogRun;

    // Refresh task to run in the background.
    let refreshTask = undefined;

    // Create the refresher reactively.
    $: {
        // Only refresh when the following conditions are met:
        // - The modal is active, so a pipeline is open.
        // - showRun is false, so it is not being executed right now.
        // - showConfig is false, so it is not being modified right now.
        // - showLog is false, so it is not being observed right now.
        // The latter will cause issues with the UI since the variables get cleared for a short time on the refresh.
        // It's probably possible to run these in the background but that is not worth the workaround.
        if (active && !showRun && !showConfig && !showLog) {
            refreshTask = createRefresher();
        } else {
            clearInterval(refreshTask);
            refreshTask = undefined;
        }
    }

    /**
     * When a log is requested to be shown.
     * @param event The event.
     */
    const logRequest = (event) => {
        showLog = true;
        showLogRun = event.detail.runId;
    }

    /**
     * Loads the pipeline by ID.
     * @param id The pipeline ID.
     * @param performThrottling Whether or not to throttle the request a bit so the UI does not flash.
     */
    async function loadPipeline(id, performThrottling) {
        // At this point no pipeline is selected, just reject the promise
        if (!id) {
            return new Promise((_, reject) => reject());
        }
        // Fetch it.
        const request = call("GET", `/api/pipelines/${pipelineId}`);
        // Throttle this down a bit otherwise the flash will be uncomfortable to the user.
        const throttle = performThrottling ?  throttler(175) : Promise.resolve();
        const responseRaw = await Promise.all([request, throttle]);
        // Get the actual request.
        const response = responseRaw[0];
        // Handle non 200.
        if (response.status !== 200) {
            console.error(`Received status ${response.status} loading pipeline ${pipelineId}`);
            throw new Error(`Get pipeline response status ${response.status}`);
        }
        // Here, it is a valid pipeline.
        const pipeline = await response.json();
        // Quickly compute durations.
        pipeline.lastRuns.forEach(run => {
            run.started = new Date(run.start).toLocaleString("de-DE");
            run.duration = relativeTimeDifference(run.finish, run.start);
        })
        return pipeline;
    }

    /**
     * Creates a task that will refresh the pipeline periodically.
     */
    function createRefresher() {
        return setInterval(() => {
            executePipelineRefresh();
        }, 2500);
    }

    /**
     * Refresh the pipeline right now.
     */
    function executePipelineRefresh() {
        // Get a new promise that refreshes the data.
        const refreshedPromise = loadPipeline(pipelineId, false);
        // Wait for the promise to complete, and then use it as a drop-in replacement.
        // This will make it so the old information is still displayed while everything is being loaded.
        refreshedPromise
            .catch(error => console.error(error))
            .finally(() => {
                promise = refreshedPromise;
            });
    }
</script>

<Modal {active} on:closeModal>
    <div class="card">
        <header class="card-header">
            <p class="card-header-title">
                <span>{pipelineName} (ID: {pipelineId})</span>
            </p>
            {#await promise then pipeline}
                {#if pipeline.running}
                    <p class="card-header-icon">
                        <span class="tag is-link">
                            <span class="icon">
                                <i class="fas fa-circle-notch fa-spin"></i>
                            </span>
                            <span>Running</span>
                        </span>
                    </p>
                {/if}
            {:catch}
                <span />
            {/await}
        </header>
        <div class="card-content">
            <div class="content">
                {#await promise}
                    <Loading />
                {:then pipeline}
                    <PipelineBlock title={"Recent Runs"} subtitle={"The last 5 completed runs are shown"}>
                        <PipelineRuns {pipelineId} runs={pipeline.lastRuns} on:showLog={logRequest}/>
                    </PipelineBlock>
                    {#if pipeline.assigned}
                        <PipelineBlock title={"Trigger URL"} subtitle={"Runs this pipeline"}>
                            <blockquote>
                                {window.location.origin}/trigger/{pipeline.trigger}
                            </blockquote>
                        </PipelineBlock>
                    {/if}
                    <PipelineBlock title={"Visibility"} subtitle="Who can see and modify the pipeline">
                        <div class="tags">
                            <span class="tag icon-text">
                                <span class="icon">
                                    <i class="fa fa-eye"></i>
                                </span>
                                <span>
                                    {pipeline.public ? "Public" : "Private"}
                                </span>
                            </span>
                            {#each pipeline.assignees as assignee}
                                <span class="tag">{assignee}</span>
                            {/each}
                        </div>
                    </PipelineBlock>
                    <PipelineLog active={showLog} {pipelineId} runId={showLogRun} on:closeModal={() => showLog = false}/>
                    {#if pipeline.assigned}
                        <PipelineRun active={showRun} trigger={pipeline.trigger} requiredParameters={pipeline.requiredParameters} on:closeModal={() => showRun = false} on:pipelineRun={executePipelineRefresh}/>
                        <PipelineEdit active={showConfig} {pipelineId} on:closeModal={() => {showConfig = false}} on:pipelineEdit={executePipelineRefresh}/>
                        <div class="field is-grouped mt-5">
                            <p class="control">
                                <WorkButton inProgress={pipeline.running} titleInProgress={"Run in progress..."} titleNormal={"Run"} on:click={() => showRun = true}/>
                            </p>
                            <p class="control">
                                <button class="button is-light" on:click|preventDefault={() => showConfig = true}>Edit Configuration</button>
                            </p>
                        </div>
                    {/if}
                {:catch}
                    <span>Could not load pipeline!</span>
                {/await}
            </div>
        </div>
    </div>
</Modal>

<style>
    .card {
        border-radius: 0;
    }
</style>