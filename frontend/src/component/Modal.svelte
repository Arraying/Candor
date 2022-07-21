<script>
    // Import the event dispatcher such that we can close the modal when the button is clicked.
    import { createEventDispatcher } from 'svelte';

    // Keep track of if it is active.
    export let active;
    export let closeable = true;

    // Dispatcher to notify parents that the modal was closed.
    const dispatch = createEventDispatcher();

    /**
     * Closes the modal.
     */
    export const closeModal = () => {
        active = false;
        dispatch("closeModal");
    };

    /**
     * Only close the modal if it is closeable.
     */
    const closeModalSoft = () => {
        if (closeable) {
            closeModal();
        }
    }

</script>

<div class="modal is-clipped" class:is-active={active}>
    <div class="modal-background" on:click={closeModalSoft} on:keydown={closeModalSoft}/>
    <div class="modal-content">
        <div class="container">
            <slot />
        </div>
    </div>
    {#if closeable}
        <button class="is-large modal-close" aria-label="close" on:click={closeModal}/>
    {/if}
</div>