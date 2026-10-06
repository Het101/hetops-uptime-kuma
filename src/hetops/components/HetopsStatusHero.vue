<template>
    <section class="ho-hero" :class="'is-' + tone" aria-live="polite">
        <div class="ho-hero-main">
            <div class="ho-beacon" aria-hidden="true">
                <span class="ring r1"></span>
                <span class="ring r2"></span>
                <span class="ring r3"></span>
                <span class="core">
                    <font-awesome-icon :icon="icon" />
                </span>
            </div>
            <div>
                <p class="ho-eyebrow">{{ eyebrow }}</p>
                <h2 class="ho-headline">{{ headline }}</h2>
                <p class="ho-meta">
                    <span>
                        <b>{{ counts.total }}</b>
                        services
                    </span>
                    <span v-if="counts.up">
                        <b>{{ counts.up }}</b>
                        operational
                    </span>
                    <span v-if="counts.down" class="bad">
                        <b>{{ counts.down }}</b>
                        down
                    </span>
                    <span v-if="counts.pending" class="warn">
                        <b>{{ counts.pending }}</b>
                        degraded
                    </span>
                    <span v-if="counts.maint">
                        <b>{{ counts.maint }}</b>
                        in maintenance
                    </span>
                </p>
            </div>
        </div>

        <div class="ho-hero-side">
            <div class="ho-ring" role="img" :aria-label="'Average uptime over 24 hours: ' + uptimeText">
                <svg viewBox="0 0 120 120">
                    <circle class="track" cx="60" cy="60" r="52" />
                    <circle
                        class="fill"
                        cx="60"
                        cy="60"
                        r="52"
                        :style="{ strokeDasharray: circumference, strokeDashoffset: offset }"
                    />
                </svg>
                <div class="ho-ring-label">
                    <b>{{ uptimeText }}</b>
                    <span>uptime · 24 h</span>
                </div>
            </div>
            <p class="ho-fresh">
                <span class="dot" aria-hidden="true"></span>
                Checked {{ agoText }}
                <template v-if="refreshIn">· next in {{ refreshIn }}</template>
            </p>
        </div>
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

// The answer comes first: one sentence, one colour, one icon, then the numbers behind it.
export default {
    props: {
        state: { type: Number, default: null },
        groups: { type: Array, default: () => [] },
        lastUpdate: { type: Object, default: null },
        refreshIn: { type: String, default: null },
    },
    data() {
        return { now: Date.now(), timer: null, circumference: 2 * Math.PI * 52 };
    },
    computed: {
        monitors() {
            return this.groups.flatMap((g) => g.monitorList || []);
        },
        counts() {
            const c = { total: this.monitors.length, up: 0, down: 0, pending: 0, maint: 0 };
            for (const m of this.monitors) {
                const k = stateOf(this.$root.heartbeatList[m.id]).key;
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
        offset() {
            return this.circumference * (1 - (this.uptime ?? 0));
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
};
</script>
