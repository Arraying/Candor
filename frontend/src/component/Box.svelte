<script>
    // Keep track of required variables.
    export let title, subtitle;
</script>

<section class="section box">
    <div class="container">
        <h1 class="title">
            {title}
        </h1>
        <h2 class="subtitle has-text-weight-light">
            {subtitle}
        </h2>
        <p>
            <slot />
        </p>
    </div>
</section>

<style>
    .box {
       border-radius: 0;
    }
</style>