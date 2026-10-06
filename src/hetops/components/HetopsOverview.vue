<template>
    <section class="ho-ov">
        <div class="ho-ov-top">
            <div class="ho-donut-card">
                <div class="ho-donut-wrap">
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
                </div>
                <div class="ho-donut-side">
                    <p class="ho-verdict" :class="'is-' + verdict.tone">{{ verdict.text }}</p>
                    <ul class="ho-legend">
                        <li v-for="seg in legend" :key="seg.key" :class="'s-' + seg.key">
                            <i></i>
                            {{ seg.label }}
                            <b>{{ seg.n }}</b>
                        </li>
                    </ul>
                </div>
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
                    <em>across {{ active.length }} active monitors</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="exclamation-circle" />
                        Slowest right now
                    </span>
                    <b :class="{ warn: slowest && slowest.ms > 1000 }">
                        {{ slowest ? slowest.ms : "–" }}
                        <small v-if="slowest">ms</small>
                    </b>
                    <em>{{ slowest ? slowest.name : "No data yet" }}</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="check-circle" />
                        Uptime · 24 h
                    </span>
                    <b :class="{ warn: fleet24 !== null && fleet24 < 0.995 }">{{ pct(fleet24) }}</b>
                    <em>fleet average</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="check-circle" />
                        Uptime · 30 days
                    </span>
                    <b :class="{ warn: fleet30 !== null && fleet30 < 0.995 }">{{ pct(fleet30) }}</b>
                    <em>{{ budget }}</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="certificate" />
                        Next cert expiry
                    </span>
                    <b :class="{ warn: cert && cert.days <= 14, bad: cert && cert.days <= 3 }">
                        {{ cert ? cert.days : "–" }}
                        <small v-if="cert">days</small>
                    </b>
                    <em>{{ cert ? cert.name : "No TLS monitors" }}</em>
                </div>
                <div class="ho-kpi">
                    <span>
                        <font-awesome-icon icon="times-circle" />
                        Incidents · 7 days
                    </span>
                    <b :class="{ bad: openIncidents > 0 }">{{ week.length }}</b>
                    <em>{{ openIncidents ? openIncidents + " ongoing" : "none ongoing" }}</em>
                </div>
            </div>
        </div>

        <div class="ho-ov-mid">
            <HetopsFleetChart class="ho-panel" :monitors="active" />
            <HetopsIncidents class="ho-panel" :incidents="incidents" />
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
                        {{ t.up24 }}
                        <small>24 h</small>
                    </span>
                    <span>
                        {{ t.up30 }}
                        <small>30 d</small>
                    </span>
                    <span>
                        {{ t.ping }}
                        <small v-if="t.ping !== '–'">ms</small>
                    </span>
                </span>
                <span class="ho-tile-ago">{{ t.ago }}</span>
            </router-link>
        </div>
    </section>
</template>

<script>
import dayjs from "dayjs";
import { stateOf, sparkline, pct, incidentsFrom, human } from "./pulse.js";
import HetopsFleetChart from "./HetopsFleetChart.vue";
import HetopsIncidents from "./HetopsIncidents.vue";

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

// The admin home: how healthy is everything, how it has been, what broke, then every monitor.
export default {
    components: { HetopsFleetChart, HetopsIncidents },
    data() {
        return {
            short: { up: "Up", down: "Down", pending: "Pending", maint: "Maint.", unknown: "–" },
            events: [],
            now: Date.now(),
            timer: null,
            poll: null,
        };
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
        verdict() {
            if (this.s.down) {
                return {
                    tone: "down",
                    text: `${this.s.down} ${this.s.down === 1 ? "monitor is" : "monitors are"} down`,
                };
            }
            if (this.s.pending) {
                return { tone: "warn", text: `${this.s.pending} degraded` };
            }
            return this.s.up ? { tone: "up", text: "Everything is up" } : { tone: "idle", text: "Waiting for checks" };
        },
        donutLabel() {
            return `${this.s.up} of ${this.total} monitors up, ${this.s.down} down`;
        },
        active() {
            return Object.values(this.$root.monitorList)
                .filter((m) => m.active && m.type !== "group")
                .sort((a, b) => a.name.localeCompare(b.name));
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
        fleet24() {
            return this.avgUptime("24");
        },
        fleet30() {
            return this.avgUptime("720");
        },
        budget() {
            // Downtime the 30-day figure implies, so "99.65%" reads as minutes, not decimals.
            if (this.fleet30 === null) {
                return "no data yet";
            }
            const mins = Math.round((1 - this.fleet30) * 30 * 24 * 60);
            return mins <= 0 ? "no downtime" : `≈ ${human(mins * 60000)} down per monitor`;
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
        incidents() {
            return incidentsFrom(this.events);
        },
        week() {
            const since = dayjs().subtract(7, "day");
            return this.incidents.filter((r) => dayjs.utc(r.start).isAfter(since));
        },
        openIncidents() {
            return this.incidents.filter((r) => !r.end).length;
        },
        tiles() {
            const rank = { down: 0, pending: 1, maint: 2, unknown: 3, up: 4 };
            return this.active
                .map((m) => {
                    const beats = this.$root.heartbeatList[m.id] || [];
                    const last = beats[beats.length - 1];
                    const secs = last
                        ? Math.max(0, Math.round((this.now - dayjs.utc(last.time).valueOf()) / 1000))
                        : null;
                    return {
                        id: m.id,
                        name: m.name,
                        state: stateOf(beats),
                        up24: pct(this.$root.uptimeList[`${m.id}_24`]),
                        up30: pct(this.$root.uptimeList[`${m.id}_720`]),
                        ping: last && typeof last.ping === "number" ? Math.round(last.ping) : "–",
                        ago:
                            secs === null
                                ? "not checked yet"
                                : secs < 60
                                  ? `checked ${secs} s ago`
                                  : `checked ${Math.round(secs / 60)} min ago`,
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
    mounted() {
        this.timer = setInterval(() => (this.now = Date.now()), 5000);
        this.load();
        this.poll = setInterval(this.load, 60000);
    },
    beforeUnmount() {
        clearInterval(this.timer);
        clearInterval(this.poll);
    },
    methods: {
        pct,
        avgUptime(span) {
            const v = this.active
                .map((m) => this.$root.uptimeList[`${m.id}_${span}`])
                .filter((x) => typeof x === "number");
            return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
        },
        // The same status-change history the events table below uses.
        load() {
            const socket = this.$root.getSocket && this.$root.getSocket();
            if (!socket) {
                return;
            }
            socket.emit("monitorImportantHeartbeatListPaged", null, 0, 300, (res) => {
                if (res && res.ok) {
                    this.events = res.data;
                }
            });
        },
    },
};
</script>
