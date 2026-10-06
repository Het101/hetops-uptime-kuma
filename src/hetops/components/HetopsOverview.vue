<template>
    <section class="ho-ov">
        <div class="ho-ov-top">
            <div class="ho-donut-card">
                <svg class="ho-donut" viewBox="0 0 140 140" role="img" :aria-label="donutLabel">
                    <circle class="track" cx="70" cy="70" r="56" />
                    <circle
                        v-for="seg in segments"
                        :key="seg.key"
                        class="seg"
                        :class="'s-' + seg.key"
                        cx="70"
                        cy="70"
                        r="56"
                        :style="{ strokeDasharray: seg.dash, strokeDashoffset: seg.offset }"
                    />
                </svg>
                <div class="ho-donut-center">
                    <b>
                        {{ s.up }}
                        <span>/{{ total }}</span>
                    </b>
                    <small>up</small>
                </div>
                <ul class="ho-legend">
                    <li v-for="seg in legend" :key="seg.key" :class="'s-' + seg.key">
                        <i></i>
                        {{ seg.label }}
                        <b>{{ seg.n }}</b>
                    </li>
                </ul>
            </div>

            <div class="ho-kpis">
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="heartbeat" />
                        Average response
                    </span>
                    <b>
                        {{ avgPing }}
                        <small v-if="avgPing !== '–'">ms</small>
                    </b>
                    <em>across {{ s.active }} active monitors</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="exclamation-circle" />
                        Slowest right now
                    </span>
                    <b>
                        {{ slowest ? slowest.ms : "–" }}
                        <small v-if="slowest">ms</small>
                    </b>
                    <em>{{ slowest ? slowest.name : "No data yet" }}</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="certificate" />
                        Next certificate expiry
                    </span>
                    <b :class="{ warn: cert && cert.days <= 14 }">
                        {{ cert ? cert.days : "–" }}
                        <small v-if="cert">days</small>
                    </b>
                    <em>{{ cert ? cert.name : "No TLS monitors" }}</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="times-circle" />
                        Outages in recent checks
                    </span>
                    <b :class="{ bad: outages > 0 }">{{ outages }}</b>
                    <em>{{ s.down ? s.down + " down now" : "none down now" }}</em>
                </div>
            </div>
        </div>

        <div class="ho-tiles">
            <router-link
                v-for="(t, i) in tiles"
                :key="t.id"
                :to="'/dashboard/' + t.id"
                class="ho-tile"
                :class="'is-' + t.state.key"
                :style="{ '--i': i }"
            >
                <span class="ho-tile-top">
                    <span class="ho-dot" aria-hidden="true"></span>
                    <b :title="t.name">{{ t.name }}</b>
                    <span class="ho-state-sm">{{ short[t.state.key] }}</span>
                </span>
                <svg class="ho-spark" viewBox="0 0 160 40" preserveAspectRatio="none" aria-hidden="true">
                    <path class="area" :d="t.spark.area" />
                    <path class="line" :d="t.spark.line" />
                </svg>
                <span class="ho-tile-foot">
                    <span>
                        {{ t.uptime }}
                        <small>24 h</small>
                    </span>
                    <span>
                        {{ t.ping }}
                        <small v-if="t.ping !== '–'">ms</small>
                    </span>
                </span>
            </router-link>
        </div>
    </section>
</template>

<script>
import { DOWN } from "../../util.ts";
import { stateOf, sparkline, pct } from "./pulse.js";

const R = 56;
const C = 2 * Math.PI * R;
const ORDER = [
    ["up", "Up"],
    ["down", "Down"],
    ["pending", "Pending"],
    ["maintenance", "Maintenance"],
    ["pause", "Paused"],
    ["unknown", "Unknown"],
];

// The admin home: how healthy is everything, what's slow, what expires next, then every monitor.
export default {
    data() {
        return { short: { up: "Up", down: "Down", pending: "Pending", maint: "Maint.", unknown: "–" } };
    },
    computed: {
        s() {
            return this.$root.stats;
        },
        total() {
            return ORDER.reduce((n, [k]) => n + (this.s[k] || 0), 0);
        },
        segments() {
            let at = 0;
            const out = [];
            for (const [k] of ORDER) {
                const n = this.s[k] || 0;
                if (!n || !this.total) {
                    continue;
                }
                const len = (n / this.total) * C;
                out.push({ key: k, dash: `${Math.max(0, len - 2)} ${C}`, offset: -at });
                at += len;
            }
            return out;
        },
        legend() {
            return ORDER.map(([k, label]) => ({ key: k, label, n: this.s[k] || 0 })).filter(
                (x) => x.n || x.key === "up" || x.key === "down"
            );
        },
        donutLabel() {
            return `${this.s.up} of ${this.total} monitors up, ${this.s.down} down`;
        },
        active() {
            return Object.values(this.$root.monitorList).filter((m) => m.active && m.type !== "group");
        },
        avgPing() {
            const v = this.active
                .map((m) => this.$root.avgPingList[m.id])
                .filter((x) => typeof x === "number" && x > 0);
            return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : "–";
        },
        slowest() {
            let best = null;
            for (const m of this.active) {
                const beats = this.$root.heartbeatList[m.id] || [];
                const last = beats[beats.length - 1];
                if (last && last.status === 1 && typeof last.ping === "number" && (!best || last.ping > best.ms)) {
                    best = { name: m.name, ms: Math.round(last.ping) };
                }
            }
            return best;
        },
        cert() {
            let best = null;
            for (const m of this.active) {
                const days = this.$root.tlsInfoList[m.id]?.certInfo?.daysRemaining;
                if (typeof days === "number" && (!best || days < best.days)) {
                    best = { name: m.name, days };
                }
            }
            return best;
        },
        outages() {
            let n = 0;
            for (const beats of Object.values(this.$root.heartbeatList)) {
                n += (beats || []).filter((b) => b.important && b.status === DOWN).length;
            }
            return n;
        },
        tiles() {
            const rank = { down: 0, pending: 1, maint: 2, unknown: 3, up: 4 };
            return this.active
                .map((m) => {
                    const beats = this.$root.heartbeatList[m.id] || [];
                    const last = beats[beats.length - 1];
                    return {
                        id: m.id,
                        name: m.name,
                        state: stateOf(beats),
                        uptime: pct(this.$root.uptimeList[`${m.id}_24`]),
                        ping: last && typeof last.ping === "number" ? Math.round(last.ping) : "–",
                        spark: sparkline(
                            beats.slice(-30).map((b) => (b.status === 1 ? b.ping : null)),
                            160,
                            40
                        ),
                    };
                })
                .sort((a, b) => rank[a.state.key] - rank[b.state.key] || a.name.localeCompare(b.name));
        },
    },
};
</script>
