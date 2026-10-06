<template>
    <router-link to="/dashboard" class="ho-pill" :class="'is-' + tone" :title="title">
        <span class="ho-pill-dot" aria-hidden="true"></span>
        {{ text }}
    </router-link>
</template>

<script>
// The header's one-glance answer, live from the same stats the dashboard uses.
export default {
    computed: {
        tone() {
            const s = this.$root.stats;
            return s.down ? "down" : s.pending ? "warn" : s.maintenance ? "maint" : s.up ? "up" : "idle";
        },
        text() {
            const s = this.$root.stats;
            if (s.down) {
                return `${s.down} down`;
            }
            if (s.pending) {
                return `${s.pending} degraded`;
            }
            if (s.maintenance) {
                return `${s.maintenance} in maintenance`;
            }
            return s.up ? "All systems normal" : "Waiting for checks";
        },
        title() {
            const s = this.$root.stats;
            return `${s.up} up, ${s.down} down, ${s.pending} pending, ${s.maintenance} maintenance, ${s.pause} paused`;
        },
    },
};
</script>
