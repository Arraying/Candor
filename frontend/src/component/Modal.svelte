<script>
    // Import the event dispatcher such that we can close the modal when the button is clicked.
    import { createEventDispatcher } from 'svelte';

    // Keep track of if it is active.
    export let active;

    // Dispatcher to notify parents that the modal was closed.
    const dispatch = createEventDispatcher();

    /**
     * Closes the modal.
     */
    const closeModal = () => {
        active = false;
        dispatch("closeModal");
    };
</script>

<div class="modal is-clipped" class:is-active={active}>
    <div class="modal-background" />
    <div class="modal-content">
        <div class="container">
            <slot />
        </div>
    </div>
    <button class="is-large modal-close" aria-label="close" on:click={closeModal} />
</div>