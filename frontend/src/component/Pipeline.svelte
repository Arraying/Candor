<script>
    // Import required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";

    // Which pipeline to show.
    export let pipelineId;
    export let pipelineName;
    
    // Activity depends on the state of the pipeline, only show if we have a pipeline selected.
    $: active = pipelineId !== undefined;

    // The promise that loads the actual pipeline.
    $: promise = loadPipeline(pipelineId);

    async function loadPipeline(id) {
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve({
                    public: true,
                    status: "Passed",
                    lastRuns: [
                        {
                            id: "3421fa3a",
                            time: "2 days ago",
                            artifacts: [
                                "server.jar",
                                "client.jar",
                            ],
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
                            time: "2 days ago",
                            artifacts: [
                                "server.jar",
                                "client.jar",
                                "instructions.md",
                            ],
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
                            time: "2 days ago",
                            artifacts: [
                                "server.jar",
                                "client.jar",
                            ],
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
                            time: "2 days ago",
                            artifacts: [
                                "server.jar",
                            ],
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
                            time: "2 days ago",
                            artifacts: [
                                "server.jar",
                            ],
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
                    assignees: [
                        "phubner",
                        "jsmith",
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
                    <h1 class="title is-size-5">Recent Runs</h1>
                    <h2 class="subtitle is-size-6 has-text-weight-light mb-2">The last 5 are shown</h2>
                    <table class="table is-fullwidth">
                        <tbody>
                            {#each pipeline.lastRuns as run}
                                <tr>
                                    <td class="table-run">
                                        {#if pipeline.status === "Passed"}
                                            <span class="icon has-text-success">
                                                <i class="fas fa-check-circle"></i>
                                            </span>
                                        {:else if pipeline.status === "Failed"}
                                            <span class="icon has-text-danger">
                                                <i class="fas fa-times-circle"></i>
                                            </span>
                                        {:else if pipeline.status === "Error"}
                                            <span class="icon has-text-danger">
                                                <i class="fas fa-bug"></i>
                                            </span>
                                        {/if}
                                        <span>
                                            <strong>#{run.id}</strong>
                                        </span>
                                    </td>
                                    <td class="table-stages">
                                        <div class="tags">
                                            {#each run.stages as stage}
                                                <span class="tag">
                                                    <span>{stage.name}</span>
                                                    {#if stage.status === "Success"}
                                                        <span class="icon has-text-success">
                                                            <i class="fas fa-check-circle"></i>
                                                        </span>
                                                    {:else if stage.status === "Failed"}
                                                        <span class="icon has-text-danger">
                                                            <i class="fas fa-times-circle"></i>
                                                        </span>
                                                    {:else if stage.status === "Skipped"}
                                                        <span class="icon has-text-grey-light">
                                                            <i class="fas fa-minus-circle"></i>
                                                        </span>
                                                    {:else if stage.status === "Error"}
                                                        <span class="icon has-text-danger">
                                                            <i class="fas fa-bug"></i>
                                                        </span>
                                                    {/if}
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
                    <h1 class="title is-size-5">Trigger URL</h1>
                    <h2 class="subtitle is-size-6 has-text-weight-light mb-2">Runs this pipeline</h2>
                    <blockquote>
                        https://candor-is-cool.xyz/trigger/h32g432rgh32vj23fgk2gf2k3hfgk
                    </blockquote>
                    <h1 class="title is-size-5">Visibility</h1>
                    <h2 class="subtitle is-size-6 has-text-weight-light mb-2">Who can see and modify this pipeline</h2>
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
                {/await}
                <div class="field is-grouped mt-5">
                    <p class="control">
                        <button class="button is-black">Run</button>
                    </p>
                    <p class="control">
                        <button class="button is-light">Edit Configuration</button>
                    </p>
                </div>
            </div>
        </div>
    </div>
</Modal>

<style>
    .card {
        border-radius: 0;
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