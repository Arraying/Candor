<script>
    export let millis;
</script>

{millis ? new Date(millis).toLocaleString("de-DE") : "-"}