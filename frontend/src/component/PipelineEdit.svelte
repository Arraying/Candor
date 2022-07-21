<script>
    // Import the required components.
    import Modal from "./Modal.svelte";
    import WorkButton from "./WorkButton.svelte";

    // Import requests.
    import { call } from "../requests";

    // The required variables.
    export let active, pipelineId;
    
    // Whether or not the edit is in progress.
    let editProgress, modal, binding = "Loading...", disabled = true, errorText;

    $: {
        // Re-load every time this gets activated.
        if (active) {
            load(pipelineId);
        }
    }

    /**
     * Loads the config.
     */
    async function load(pipelineId) {
        const response = await call("GET", `/api/pipelines/${pipelineId}/config`);
        if (response.status === 200) {
            binding = JSON.stringify(await response.json(), null, 2);
            disabled = false;
        } else {
            errorText = `Internal error: ${response.status}`;
        }
    };

    /**
     * Saves the config.
     */
    const save = () => {
        if (!binding) {
            errorText = "The config may not be empty!";
            return;
        }
        let config;
        try {
            config = JSON.parse(binding);
        } catch (_) {
            errorText = "The config is not valid JSON!";
            return;
        }
        editProgress = true;
        call("POST", `/api/pipelines/${pipelineId}/config`, config)
            .then(_ => {
                modal.closeModal();
            })
            .catch(error => {
                console.log(error);
            })
            .finally(() => {
                editProgress = false;
            });
    };
</script>

<Modal {active} closeable={false} on:closeModal bind:this={modal}>
    <form on:submit|preventDefault={save} class="box">
        <div class="field">
            <label for="" class="label">
                Configuration
            </label>
            <div class="control">
                <textarea class="textarea is-small" bind:value={binding} rows="20" {disabled}/>
            </div>
            {#if errorText}
                <p class="help is-danger">
                    {errorText}
                </p>
            {/if}
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
    </form>
</Modal>