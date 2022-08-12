<script>
    // Import useful components.
    import Status from "./Status.svelte";
    import Timestamp from "./Timestamp.svelte";

    // Import the event dispatcher such that we can change the selected pipeline when the row is clicked.
    import { createEventDispatcher } from 'svelte';

    // Keep track of the pipeline this represents.
    export let pipeline;

    // Dispatcher to notify parents that the modal was closed.
    const dispatch = createEventDispatcher();

    /**
     * Selects the current pipeline to be the active one.
     */
    const selectPipeline = () => {
        dispatch("pipelineSelect", {
            id: pipeline.id,
            name: pipeline.name,
        });
    };
</script>

<tr class="is-clickable" on:click={selectPipeline}>
    <td>
        {pipeline.name}
    </td>
    <td>
        {pipeline.status ? pipeline.status : "-"}
    </td>
    <td>
        {#if pipeline.stages}
            {#each pipeline.stages as stage}
                <Status status={stage}/>
            {/each}
        {/if}
    </td>
    <td>
        <Timestamp millis={pipeline.lastSuccess}/>
    </td>
    <td>
        <Timestamp millis={pipeline.lastFailure}/>
    </td>
</tr>