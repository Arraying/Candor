<script>
    // Keep track of the title and subtitle.
    export let title;
    export let subtitle;
</script>

<h1 class="title is-size-5">
    {title}
</h1>
<h2 class="subtitle is-size-6 has-text-weight-light mb-2">
    {subtitle}
</h2>

<slot />