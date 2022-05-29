<script>
    import PipelineListEntry from "./PipelineListEntry.svelte";
    import { fade } from "svelte/transition";
    export let overviews;
</script>

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
                <PipelineListEntry pipeline={pipelineOverview} />
            {/each}
        </tbody>
    </table>
</div>

<style>
    .overflow-container {
        overflow-x: auto;
    }
</style>