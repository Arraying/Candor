<script>
    export let inProgress, titleNormal, titleInProgress;
</script>

<button class="button" class:is-black={!inProgress} class:is-light={inProgress} disabled={inProgress}>
    {#if inProgress}
        <span class="icon">
            <i class="fas fa-spinner fa-pulse"></i>
        </span>
    {/if}
    <span>
        {#if inProgress}
            {titleInProgress}
        {:else}
            {titleNormal}
        {/if}
    </span>
</button>