<template>
    <section v-if="monitors.length" class="ho-pub-pulse ho-ov-mid">
        <HetopsFleetChart class="ho-panel" :monitors="monitors" />
        <HetopsIncidents
            class="ho-panel"
            title="Recent disruptions"
            :incidents="incidents"
            :link="false"
            :limit="4"
            :window-label="windowLabel"
            empty-title="No disruptions."
            :empty-text="`Every service answered every check in the last ${windowLabel || 'few minutes'}.`"
        />
    </section>
</template>

<script>
import dayjs from "dayjs";
import { incidentsFrom, human } from "./pulse.js";
import HetopsFleetChart from "./HetopsFleetChart.vue";
import HetopsIncidents from "./HetopsIncidents.vue";

// Public page, second row: how fast every service answers, and what broke in the checks we have.
// Visitors only receive the latest checks per service, so the window is stated, not implied.
export default {
    components: { HetopsFleetChart, HetopsIncidents },
    computed: {
        monitors() {
            return Object.values(this.$root.publicMonitorList).sort((a, b) => a.name.localeCompare(b.name));
        },
        beats() {
            return this.monitors.flatMap((m) =>
                (this.$root.heartbeatList[m.id] || []).map((b) => ({ ...b, monitorID: m.id }))
            );
        },
        incidents() {
            return incidentsFrom(this.beats);
        },
        windowLabel() {
            let oldest = null;
            for (const b of this.beats) {
                const t = dayjs.utc(b.time).valueOf();
                if (oldest === null || t < oldest) {
                    oldest = t;
                }
            }
            return oldest === null ? "" : human(Date.now() - oldest);
        },
    },
};
</script>
