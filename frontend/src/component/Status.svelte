<script>
    // The actual status.
    export let status;
    console.log(status);
</script>

<span 
    class="icon" 
    class:has-text-success={status === "Passed" || status === "Success"}
    class:has-text-danger={status === "Failed" || status === "Error"}
    class:has-text-grey-light={status === "Skipped"}
>
    <i
        class="fas"
        class:fa-check-circle={status === "Passed" || status === "Success"}
        class:fa-times-circle={status === "Failed"}
        class:fa-minus-circle={status === "Skipped"}
        class:fa-bug={status === "Error"}
    />
</span>