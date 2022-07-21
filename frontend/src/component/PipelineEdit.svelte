<script>
    // Import the required components.
    import Loading from "./Loading.svelte";
    import Modal from "./Modal.svelte";
    import WorkButton from "./WorkButton.svelte";

    // The required variables.
    export let active;
    export let pipelineId;
    
    // Whether or not the edit is in progress.
    let editProgress;
    let modal;
    let binding;

    // The promise for loading.
    $: promise = load(pipelineId);

    /**
     * Loads the config.
     */
    async function load(pipelineId) {
        binding = await new Promise((resolve, _) => {
            let timeout = setTimeout(() => {
                clearTimeout(timeout);
                resolve(JSON.stringify({
                    a: "a",
                    b: "b",
                }, null, 2));
            }, 500);
        });
    };

    /**
     * Saves the config.
     */
    const save = () => {

    };
</script>

<Modal {active} on:closeModal bind:this={modal}>
    <form on:submit|preventDefault={save} class="box">
        {#await promise}
            <Loading />
        {:then} 
            <div class="field">
                <label for="" class="label">
                    Configuration
                </label>
                <div class="control">
                    <input type="textarea" class="input" bind:value={binding}>
                </div>
            </div>
            <div class="field is-grouped">
                <div class="control">
                    <WorkButton inProgress={editProgress} titleInProgress={"Saving..."} titleNormal={"Save"}/>
                </div>
                <div class="control">
                    <button class="button is-light" on:click|preventDefault={modal.closeModal()}>
                        Cancel
                    </button>
                </div>
            </div>
        {/await}
    </form>
</Modal>