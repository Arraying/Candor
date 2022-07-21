<script>
    // Import required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";
    import PipelineEdit from "./PipelineEdit.svelte";
    import PipelineBlock from "./PipelineBlock.svelte";
    import PipelineRun from "./PipelineRun.svelte";
    import PipelineRuns from "./PipelineRuns.svelte";
    import WorkButton from "./WorkButton.svelte";

    // Which pipeline to show.
    export let pipelineId, pipelineName;
    
    // Activity depends on the state of the pipeline, only show if we have a pipeline selected.
    $: active = pipelineId !== undefined;

    // The promise that loads the actual pipeline.
    $: promise = loadPipeline(pipelineId);

    // Keep track of the modals.
    let showRun = false, showConfig = false;

    // Refresh task to run in the background.
    let refreshTask = undefined;

    // Create the refresher reactively.
    $: {
        // Only refresh when the following conditions are met:
        // - The modal is active, so a pipeline is open.
        // - showRun is false, so it is not being executed right now.
        // - showConfig is false, so it is not being modified right now.
        // The latter two will cause issues with the UI since the variables get cleared for a short time on the refresh.
        // It's probably possible to run these in the background but that is not worth the workaround.
        if (active && !showRun && !showConfig) {
            refreshTask = createRefresher();
        } else {
            clearInterval(refreshTask);
            refreshTask = undefined;
        }
    }

    async function loadPipeline(id) {
        // At this point no pipeline is selected, just reject the promise
        if (!id) {
            return new Promise((_, reject) => reject());
        }
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve({
                    id: 1, // Ignored
                    name: "Foo", // Ignored
                    public: true,
                    running: false,
                    lastRuns: [
                        {
                            id: "3421fa3a",
                            start: 1017309600000,
                            finish: 1017309900000,
                            archived: [
                                "server.jar",
                                "client.jar",
                            ],
                            status: "Passed",
                            stages: [
                                {
                                    name: "Test",
                                    status: "Success",
                                },
                                {
                                    name: "Compile",
                                    status: "Success",
                                },
                                {
                                    name: "Publish",
                                    status: "Success",
                                },
                            ],
                        },
                        {
                            id: "3bc0969a",
                            start: 1017309600000,
                            finish: 1017309900000,
                            archived: [
                                "server.jar",
                                "client.jar",
                                "instructions.md",
                            ],
                            status: "Passed",
                            stages: [
                                {
                                    name: "Test",
                                    status: "Success",
                                },
                                {
                                    name: "Compile",
                                    status: "Success",
                                },
                                {
                                    name: "Publish",
                                    status: "Success",
                                },
                            ],
                        },
                        {
                            id: "b21152cc",
                            start: 1017309600000,
                            finish: 1017309900000,
                            archived: [
                                "server.jar",
                                "client.jar",
                            ],
                            status: "Passed",
                            stages: [
                                {
                                    name: "Test",
                                    status: "Success",
                                },
                                {
                                    name: "Compile",
                                    status: "Success",
                                },
                            ],
                        },
                        {
                            id: "60bc7afa",
                            start: 1017309600000,
                            finish: 1017309900000,
                            archived: [
                                "server.jar",
                            ],
                            status: "Passed",
                            stages: [
                                {
                                    name: "Test",
                                    status: "Success",
                                },
                                {
                                    name: "Compile",
                                    status: "Success",
                                },
                            ],
                        },
                        {
                            id: "a93675a2",
                            start: 1017309600000,
                            finish: 1017309900000,
                            archived: [
                                "server.jar",
                            ],
                            status: "Passed",
                            stages: [
                                {
                                    name: "Test",
                                    status: "Success",
                                },
                                {
                                    name: "Compile",
                                    status: "Success",
                                },
                            ],
                        },
                    ],
                    trigger: "324j32gjfg3gjhgf2jf",
                    assignees: [
                        "phubner",
                        "jsmith",
                    ],
                    required_parameters: [
                        "test",
                        "hello"
                    ],
                });
            }, 200);
        });
    }

    /**
     * Creates a task that will refresh the pipeline periodically.
     */
    function createRefresher() {
        return setInterval(() => {
            executePipelineRefresh();
        }, 5000);
    }

    /**
     * Refresh the pipeline right now.
     */
    function executePipelineRefresh() {
        // Get a new promise that refreshes the data.
        const refreshedPromise = loadPipeline(pipelineId);
        // Wait for the promise to complete, and then use it as a drop-in replacement.
        // This will make it so the old information is still displayed while everything is being loaded.
        refreshedPromise
            .catch(() => {}) // Ignore this.
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
                <span>???</span>
            {/await}
        </header>
        <div class="card-content">
            <div class="content">
                {#await promise}
                    <Loading />
                {:then pipeline}
                    <PipelineBlock title={"Recent Runs"} subtitle={"The last 5 completed runs are shown"}>
                        <PipelineRuns {pipelineId} runs={pipeline.lastRuns}/>
                    </PipelineBlock>
                    <PipelineBlock title={"Trigger URL"} subtitle={"Runs this pipeline"}>
                        <blockquote>
                            {window.location.origin}/trigger/{pipeline.trigger}
                        </blockquote>
                    </PipelineBlock>
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
                    <PipelineRun active={showRun} trigger={pipeline.trigger} requiredParameters={pipeline.required_parameters} on:closeModal={() => showRun = false} on:pipelineRun={executePipelineRefresh}/>
                    <PipelineEdit active={showConfig} {pipelineId} on:closeModal={() => {showConfig = false}}/>
                    <div class="field is-grouped mt-5">
                        <p class="control">
                            <WorkButton inProgress={pipeline.running} titleInProgress={"Run in progress..."} titleNormal={"Run"} on:click={() => showRun = true}/>
                        </p>
                        <p class="control">
                            <button class="button is-light" on:click|preventDefault={() => showConfig = true}>Edit Configuration</button>
                        </p>
                    </div>
                {:catch}
                    <span>Pipeline ID not selected!</span>
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