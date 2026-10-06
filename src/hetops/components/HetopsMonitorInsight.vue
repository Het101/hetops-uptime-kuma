<template>
    <section class="ho-insight" :class="'is-' + state.key">
        <div class="ho-insight-state">
            <span class="ho-state">
                <font-awesome-icon :icon="state.icon" />
                {{ state.label }}
            </span>
            <p>{{ forText }}</p>
        </div>
        <dl class="ho-insight-grid">
            <div>
                <dt>Typical response</dt>
                <dd>{{ ms(p50) }}</dd>
                <em>{{ ups.length ? `p50 of the last ${ups.length} checks` : "no successful checks yet" }}</em>
            </div>
            <div>
                <dt>Worst 5%</dt>
                <dd :class="{ warn: p95 !== null && p50 !== null && p95 > p50 * 3 }">{{ ms(p95) }}</dd>
                <em>p95 · slowest {{ ms(max) }}</em>
            </div>
            <div>
                <dt>Error budget · 99.9%</dt>
                <dd
                    :class="{
                        warn: budget.left !== null && budget.left < 50,
                        bad: budget.left !== null && budget.left <= 0,
                    }"
                >
                    {{ budget.text }}
                </dd>
                <em>{{ budget.note }}</em>
            </div>
            <div>
                <dt>Incidents</dt>
                <dd :class="{ bad: openNow }">{{ incidents.length }}</dd>
                <em>{{ lastIncidentText }}</em>
            </div>
        </dl>
    </section>
</template>

<script>
import dayjs from "dayjs";
import { stateOf, stateFor, pct, percentile, incidentsFrom, human } from "./pulse.js";

// The numbers behind a single monitor: how it usually behaves, how bad the bad moments get,
// how reliable it has been, and when it last broke.
export default {
    props: {
        monitorId: { type: Number, required: true },
    },
    data() {
        return { events: [] };
    },
    computed: {
        beats() {
            return this.$root.heartbeatList[this.monitorId] || [];
        },
        state() {
            return stateOf(this.beats);
        },
        forText() {
            const d = stateFor(this.beats);
            return d ? `${this.state.key === "up" ? "Up" : this.state.label} for ${d}` : "Waiting for the first check";
        },
        ups() {
            return this.beats.filter((b) => b.status === 1 && typeof b.ping === "number").map((b) => b.ping);
        },
        p50() {
            return percentile(this.ups, 50);
        },
        p95() {
            return percentile(this.ups, 95);
        },
        max() {
            return this.ups.length ? Math.max(...this.ups) : null;
        },
        // A 99.9% target over 30 days allows 43.2 minutes down; show how much of that is left.
        budget() {
            const up = this.$root.uptimeList[`${this.monitorId}_720`];
            if (typeof up !== "number") {
                return { left: null, text: "–", note: "no 30-day data yet" };
            }
            const allowed = 0.001 * 30 * 24 * 60;
            const used = (1 - up) * 30 * 24 * 60;
            const left = Math.round((1 - used / allowed) * 100);
            return {
                left,
                text: left > 0 ? `${left}% left` : "spent",
                note:
                    left > 0
                        ? `${human(used * 60000)} of 43 min used · 30 d ${pct(up)}`
                        : `43 min allowed · 30 d ${pct(up)}`,
            };
        },
        incidents() {
            return incidentsFrom(this.events);
        },
        openNow() {
            return this.incidents.some((r) => !r.end);
        },
        lastIncidentText() {
            const last = this.incidents[0];
            if (!last) {
                return "none on record";
            }
            const when = dayjs.utc(last.start).local();
            return last.end ? `last ${when.fromNow()}, down ${human(last.ms)}` : `ongoing for ${human(last.ms)}`;
        },
    },
    watch: {
        monitorId: {
            immediate: true,
            handler() {
                this.load();
            },
        },
    },
    methods: {
        ms(v) {
            return v === null ? "–" : `${Math.round(v)} ms`;
        },
        load() {
            const socket = this.$root.getSocket && this.$root.getSocket();
            if (!socket) {
                return;
            }
            socket.emit("monitorImportantHeartbeatListPaged", this.monitorId, 0, 200, (res) => {
                if (res && res.ok) {
                    this.events = res.data;
                }
            });
        },
    },
};
</script>
