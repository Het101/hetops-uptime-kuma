<template>
    <div class="ho-fleet">
        <div class="ho-panel-head">
            <h3>Response time, every service</h3>
            <span>last {{ n }} checks · hover to compare</span>
        </div>
        <div ref="plot" class="ho-fleet-plot" @pointermove="onMove" @pointerleave="hover = null">
            <svg :viewBox="`0 0 ${W} ${H}`" preserveAspectRatio="none" role="img" :aria-label="summary">
                <line v-for="g in grid" :key="g.y" class="grid" x1="0" :x2="W" :y1="g.y" :y2="g.y" />
                <path
                    v-for="s in series"
                    :key="s.id"
                    class="line"
                    :class="{ dim: focus !== null && focus !== s.id }"
                    :d="s.d"
                    :style="{ stroke: s.color }"
                />
                <line v-if="hover !== null" class="cross" :x1="xAt(hover)" :x2="xAt(hover)" y1="0" :y2="H" />
            </svg>
            <div class="ho-fleet-axis">
                <span v-for="g in grid" :key="g.y" :style="{ top: (g.y / H) * 100 + '%' }">{{ g.label }}</span>
            </div>
            <div
                v-if="hover !== null && tip.length"
                class="ho-fleet-tip"
                :style="{ left: Math.min(84, (hover / (n - 1)) * 100) + '%' }"
            >
                <b>{{ tipTime }}</b>
                <span v-for="t in tip" :key="t.id">
                    <i :style="{ background: t.color }"></i>
                    {{ t.name }}
                    <em>{{ t.ms }}</em>
                </span>
            </div>
        </div>
        <ul class="ho-fleet-legend">
            <li v-for="s in series" :key="s.id" @mouseenter="focus = s.id" @mouseleave="focus = null">
                <i :style="{ background: s.color }"></i>
                <span>{{ s.name }}</span>
                <b>
                    {{ s.now }}
                    <small v-if="s.now !== '–'">ms</small>
                </b>
            </li>
        </ul>
    </div>
</template>

<script>
import dayjs from "dayjs";
import { SERIES } from "./pulse.js";

const W = 600;
const H = 180;

// One chart for the whole fleet: which service is slow, and since when, at a glance.
export default {
    props: {
        monitors: { type: Array, default: () => [] },
        points: { type: Number, default: 60 },
    },
    data() {
        return { W, H, hover: null, focus: null };
    },
    computed: {
        raw() {
            return this.monitors.map((m, i) => {
                const beats = (this.$root.heartbeatList[m.id] || []).slice(-this.points);
                return { id: m.id, name: m.name, color: SERIES[i % SERIES.length], beats };
            });
        },
        // Scale to the history we actually have, so a young monitor doesn't leave half the chart empty.
        n() {
            return Math.max(2, ...this.raw.map((r) => r.beats.length));
        },
        max() {
            let mx = 0;
            for (const r of this.raw) {
                for (const b of r.beats) {
                    if (b.status === 1 && typeof b.ping === "number") {
                        mx = Math.max(mx, b.ping);
                    }
                }
            }
            // Round the ceiling up to a readable step.
            const step = mx > 2000 ? 1000 : mx > 500 ? 250 : mx > 100 ? 50 : 25;
            return Math.max(step, Math.ceil(mx / step) * step);
        },
        grid() {
            return [0, 0.5, 1].map((f) => ({ y: 8 + (H - 16) * (1 - f), label: `${Math.round(this.max * f)} ms` }));
        },
        series() {
            return this.raw.map((r) => {
                const offset = this.n - r.beats.length;
                let d = "";
                let pen = false;
                r.beats.forEach((b, i) => {
                    if (b.status !== 1 || typeof b.ping !== "number") {
                        pen = false;
                        return;
                    }
                    const x = this.xAt(offset + i);
                    const y = 8 + (H - 16) * (1 - b.ping / this.max);
                    d += `${pen ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
                    pen = true;
                });
                const last = r.beats[r.beats.length - 1];
                return {
                    id: r.id,
                    name: r.name,
                    color: r.color,
                    d,
                    now: last && last.status === 1 && typeof last.ping === "number" ? Math.round(last.ping) : "–",
                };
            });
        },
        tip() {
            if (this.hover === null) {
                return [];
            }
            return this.raw
                .map((r) => {
                    const b = r.beats[this.hover - (this.n - r.beats.length)];
                    return b
                        ? {
                              id: r.id,
                              name: r.name,
                              color: r.color,
                              ms: b.status === 1 && typeof b.ping === "number" ? `${Math.round(b.ping)} ms` : "down",
                              time: b.time,
                          }
                        : null;
                })
                .filter(Boolean)
                .sort((a, b) => (parseInt(b.ms) || 1e9) - (parseInt(a.ms) || 1e9));
        },
        tipTime() {
            const t = this.tip.find((x) => x.time);
            return t ? dayjs.utc(t.time).local().format("D MMM HH:mm") : "";
        },
        summary() {
            return this.series.map((s) => `${s.name} ${s.now} ms`).join(", ");
        },
    },
    methods: {
        xAt(i) {
            return (i / (this.n - 1)) * W;
        },
        onMove(e) {
            const r = this.$refs.plot.querySelector("svg").getBoundingClientRect();
            const f = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
            this.hover = Math.round(f * (this.n - 1));
        },
    },
};
</script>
