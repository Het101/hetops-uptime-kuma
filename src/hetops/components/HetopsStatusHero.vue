<template>
    <section class="ho-master" :class="'is-' + tone" aria-live="polite">
        <div class="ho-master-lamp" aria-hidden="true">
            <span class="lamp"><font-awesome-icon :icon="icon" /></span>
            <small>Master</small>
        </div>

        <div class="ho-master-say">
            <p class="ho-kick">{{ eyebrow }}</p>
            <h2>{{ headline }}</h2>
            <p class="ho-master-sub">{{ subline }}</p>
        </div>

        <dl class="ho-master-read">
            <div>
                <dt>Uptime · 24 h</dt>
                <dd>{{ uptimeText }}</dd>
                <span class="ho-gauge" aria-hidden="true"><i :style="{ width: gauge }"></i></span>
            </div>
            <div>
                <dt>Services up</dt>
                <dd>
                    {{ counts.up }}
                    <small>/ {{ counts.total }}</small>
                </dd>
                <span class="ho-ticks" aria-hidden="true">
                    <i v-for="m in monitors" :key="m.id" :class="'t-' + keyOf(m)"></i>
                </span>
            </div>
            <div>
                <dt>Next check</dt>
                <dd>{{ refreshIn || "–" }}</dd>
                <span class="ho-read-note">checked {{ agoText }}</span>
            </div>
        </dl>
    </section>
</template>

<script>
import dayjs from "dayjs";
import {
    STATUS_PAGE_ALL_DOWN,
    STATUS_PAGE_ALL_UP,
    STATUS_PAGE_PARTIAL_DOWN,
    STATUS_PAGE_MAINTENANCE,
} from "../../util.ts";
import { stateOf, pct } from "./pulse.js";

// The master caution panel: one lamp and one sentence answer "is it working?", then three
// readings (24 h uptime, services up, next check). The lamp is never colour alone: it carries an
// icon, and the sentence says the same thing.
export default {
    props: {
        state: { type: Number, default: null },
        groups: { type: Array, default: () => [] },
        lastUpdate: { type: Object, default: null },
        refreshIn: { type: String, default: null },
    },
    data() {
        return { now: Date.now(), timer: null };
    },
    computed: {
        monitors() {
            return this.groups.flatMap((g) => g.monitorList || []);
        },
        counts() {
            const c = { total: this.monitors.length, up: 0, down: 0, pending: 0, maint: 0 };
            for (const m of this.monitors) {
                const k = this.keyOf(m);
                if (k in c) {
                    c[k]++;
                }
            }
            return c;
        },
        tone() {
            return (
                {
                    [STATUS_PAGE_ALL_UP]: "up",
                    [STATUS_PAGE_PARTIAL_DOWN]: "warn",
                    [STATUS_PAGE_ALL_DOWN]: "down",
                    [STATUS_PAGE_MAINTENANCE]: "maint",
                }[this.state] || "idle"
            );
        },
        icon() {
            return (
                { up: "check-circle", warn: "exclamation-circle", down: "times-circle", maint: "wrench" }[this.tone] ||
                "heartbeat"
            );
        },
        headline() {
            if (!this.monitors.length) {
                return "Waiting for the first checks";
            }
            return (
                {
                    up: "All systems operational",
                    warn:
                        this.counts.down === 1
                            ? "One service is having trouble"
                            : `${this.counts.down || "Some"} services are having trouble`,
                    down: "Major outage",
                    maint: "Scheduled maintenance in progress",
                }[this.tone] || "Checking services"
            );
        },
        subline() {
            const trouble = this.monitors.filter((m) => !["up", "unknown"].includes(this.keyOf(m)));
            if (trouble.length) {
                const names = trouble.map((m) => m.name);
                return `${names.slice(0, 3).join(", ")}${names.length > 3 ? ` and ${names.length - 3} more` : ""}: see the panel below.`;
            }
            return this.monitors.length ? "Every service answered its last check." : "Checks start within a minute.";
        },
        eyebrow() {
            return (
                { up: "Live status", warn: "Investigating", down: "Incident", maint: "Maintenance" }[this.tone] ||
                "Live status"
            );
        },
        uptime() {
            const vals = this.monitors
                .map((m) => this.$root.uptimeList[`${m.id}_24`])
                .filter((v) => typeof v === "number");
            return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
        },
        uptimeText() {
            return pct(this.uptime);
        },
        gauge() {
            // The last 1% is where uptime lives, so the gauge spans 99 to 100.
            return `${Math.max(2, Math.min(100, ((this.uptime ?? 0) - 0.99) * 10000))}%`;
        },
        agoText() {
            if (!this.lastUpdate) {
                return "just now";
            }
            const s = Math.max(0, Math.round((this.now - dayjs(this.lastUpdate).valueOf()) / 1000));
            return s < 5 ? "just now" : s < 60 ? `${s} s ago` : `${Math.round(s / 60)} min ago`;
        },
    },
    mounted() {
        this.timer = setInterval(() => (this.now = Date.now()), 1000);
    },
    beforeUnmount() {
        clearInterval(this.timer);
    },
    methods: {
        keyOf(m) {
            return stateOf(this.$root.heartbeatList[m.id]).key;
        },
    },
};
</script>
