<template>
    <div class="ho-incidents">
        <div class="ho-panel-head">
            <h3>Incidents</h3>
            <span>{{ summary }}</span>
        </div>
        <ol v-if="rows.length" class="ho-inc-list">
            <li v-for="(r, i) in rows" :key="r.monitorID + r.start" :class="{ open: !r.end }" :style="{ '--i': i }">
                <span class="ho-inc-mark" aria-hidden="true"></span>
                <div class="ho-inc-body">
                    <p class="ho-inc-title">
                        <router-link :to="'/dashboard/' + r.monitorID">{{ name(r.monitorID) }}</router-link>
                        <span class="ho-inc-dur">{{ r.end ? "down " + human(r.ms) : "down for " + human(r.ms) }}</span>
                    </p>
                    <p class="ho-inc-msg" :title="r.msg">{{ r.msg || "No error message" }}</p>
                    <p class="ho-inc-when">
                        {{ when(r.start) }}
                        <template v-if="r.end">→ {{ clock(r.end) }} · resolved</template>
                        <template v-else>
                            ·
                            <b>ongoing</b>
                        </template>
                    </p>
                </div>
            </li>
        </ol>
        <div v-else class="ho-inc-empty">
            <font-awesome-icon icon="check-circle" />
            <p>
                <b>No incidents on record.</b>
                Every monitor has stayed up through its recent checks.
            </p>
        </div>
    </div>
</template>

<script>
import dayjs from "dayjs";
import { human } from "./pulse.js";

// Status changes paired into outages, newest first: what broke, for how long, and why.
export default {
    props: {
        incidents: { type: Array, default: () => [] },
        limit: { type: Number, default: 6 },
    },
    computed: {
        rows() {
            return this.incidents.slice(0, this.limit);
        },
        week() {
            const since = dayjs().subtract(7, "day");
            return this.incidents.filter((r) => dayjs.utc(r.start).isAfter(since));
        },
        summary() {
            const n = this.week.length;
            if (!n) {
                return "none in 7 days";
            }
            const total = this.week.reduce((a, r) => a + r.ms, 0);
            return n === 1
                ? `1 in 7 days · ${human(total)} down`
                : `${n} in 7 days · ${human(total)} down · ${human(total / n)} avg to recover`;
        },
    },
    methods: {
        human,
        name(id) {
            return this.$root.monitorList[id]?.name || `Monitor ${id}`;
        },
        when(t) {
            const d = dayjs.utc(t).local();
            return d.isSame(dayjs(), "day") ? `Today ${d.format("HH:mm")}` : d.format("D MMM HH:mm");
        },
        clock(t) {
            return dayjs.utc(t).local().format("HH:mm");
        },
    },
};
</script>
