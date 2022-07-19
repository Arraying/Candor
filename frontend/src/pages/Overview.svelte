<script>
    // Import the things required.
    import Loading from "../component/Loading.svelte";
    import PipelineList from "../component/PipelineList.svelte";
    import { User, PipelineOverviewStore } from "../store";

    // Keep track of the username.
    let username;
    User.subscribe(value => username = (value ? value.name : "anonymous"));

    /**
     * Loads all pipelines.
     * Currently has a fake timeout to mock latency.
     */
    function loadPipelines() {
        return new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve($PipelineOverviewStore);
            }, 500);
        });
    }
</script>

<section class="section">
    <div class="container">
        <h1 class="title">Pipelines</h1>
        <h2 class="subtitle has-text-weight-light">All pipelines visible to <span class="has-text-weight-semibold">@{username}</span></h2>
        {#await loadPipelines()}
            <Loading />
        {:then overviews}
            <PipelineList {overviews}/>
        {/await}
    </div>
</section>