<script>
    export let pipeline;
</script>

<tr class="is-clickable">
    <td>{pipeline.name}</td>
    <td>{pipeline.status}</td>
    <td>
        {#each pipeline.stages as stage}
            {#if stage === "Passed"}
                <span class="icon has-text-success">
                    <i class="fas fa-check-circle"></i>
                </span>
            {:else if stage === "Failed"}
                <span class="icon has-text-danger">
                    <i class="fas fa-times-circle"></i>
                </span>
            {:else if stage === "Skipped"}
                <span class="icon has-text-grey-light">
                    <i class="fas fa-minus-circle"></i>
                </span>
            {:else if stage === "Error"}
                <span class="icon has-text-danger">
                    <i class="fas fa-bug"></i>
                </span>
            {/if}
        {/each}
    </td>
    <td>{pipeline.lastSuccess}</td>
    <td>{pipeline.lastFailure}</td>
</tr>