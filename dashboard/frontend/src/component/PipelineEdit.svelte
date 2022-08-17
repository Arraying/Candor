<script>
    // Import the event dispatcher such that we can update the pipeline parameters.
    import { createEventDispatcher } from 'svelte';

    // Import YAML library. 
    import yaml from "js-yaml";

    // Import the required components.
    import Modal from "./Modal.svelte";
    import WorkButton from "./WorkButton.svelte";

    // Import requests.
    import { call } from "../requests";

    // The required variables.
    export let active, pipelineId;

    // Dispatcher to notify parents that the pipeline config has changed.
    const dispatch = createEventDispatcher();
    
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
            const json = await response.json();
            // Debug in case of future deserialization issues.
            console.debug(json);
            binding = yaml.dump(json);
            disabled = false;
        } else {
            errorText = `Internal error: ${response.status}`;
        }
    };

    /**
     * Saves the config.
     */
    const save = async () => {
        if (!binding) {
            errorText = "The config may not be empty!";
            return;
        }
        let config;
        try {
            config = yaml.load(binding, { json: true });
        } catch (error) {
            errorText = error.message;
        }
        // Debug in case of future serialization issues.
        console.debug(config);
        editProgress = true;
        const response = await call("POST", `/api/pipelines/${pipelineId}/config`, config);
        const validity = await response.json();
        if (validity.valid) {
            dispatch("pipelineEdit");
            modal.closeModal();
            errorText = undefined;
            disabled = true;
        } else {
            errorText = "The config schema is invalid!";
        }
        editProgress = false;
    };
</script>

<Modal {active} closeable={false} on:closeModal bind:this={modal}>
    <form on:submit|preventDefault={save} class="box">
        <div class="field">
            <label for="" class="label">
                Configuration
            </label>
            <div class="control">
                <textarea class="yaml textarea is-small" bind:value={binding} rows="20" {disabled}/>
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

<style>
    .box {
        border-radius: 0;
    }

    .yaml {
        font-family: monospace;
        font-size: 1em;
    }
</style>