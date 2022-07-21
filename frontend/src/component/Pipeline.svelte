<script>
    // Import required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";
    import PipelineEdit from "./PipelineEdit.svelte";
    import PipelineBlock from "./PipelineBlock.svelte";
    import PipelineRun from "./PipelineRun.svelte";
    import PipelineRuns from "./PipelineRuns.svelte";

    // Which pipeline to show.
    export let pipelineId;
    export let pipelineName;
    
    // Activity depends on the state of the pipeline, only show if we have a pipeline selected.
    $: active = pipelineId !== undefined;

    // The promise that loads the actual pipeline.
    $: promise = loadPipeline(pipelineId);

    // Keep track of the modals.
    let showRun = false;
    let showConfig = false;

    async function loadPipeline(id) {
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve({
                    public: true,
                    lastRuns: [
                        {
                            id: "3421fa3a",
                            start: 1017309600000,
                            finish: 1017309900000,
                            artifacts: [
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
                            artifacts: [
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
                            artifacts: [
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
                            artifacts: [
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
                            artifacts: [
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
</script>

<Modal {active} on:closeModal>
    <div class="card">
        <header class="card-header">
            <p class="card-header-title">
                {pipelineName} (ID: {pipelineId})
            </p>
        </header>
        <div class="card-content">
            <div class="content">
                {#await promise}
                    <Loading />
                {:then pipeline}
                    <PipelineBlock title={"Recent Runs"} subtitle={"The last 5 are shown"}>
                        <PipelineRuns runs={pipeline.lastRuns}/>
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
                    <PipelineRun active={showRun} requiredParameters={pipeline.required_parameters} on:closeModal={() => showRun = false}/>
                    <PipelineEdit active={showConfig} {pipelineId} on:closeModal={() => {showConfig = false}}/>
                    <div class="field is-grouped mt-5">
                        <p class="control">
                            <button class="button is-black" on:click|preventDefault={() => showRun = true}>Run</button>
                        </p>
                        <p class="control">
                            <button class="button is-light" on:click|preventDefault={() => showConfig = true}>Edit Configuration</button>
                        </p>
                    </div>
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