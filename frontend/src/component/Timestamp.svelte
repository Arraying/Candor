<script>
    export let millis;
</script>

{#if millis !== -1}
    {new Date(millis).toString()}
{:else}
    -
{/if}