<template>
    <div class="ho-board">
        <section v-for="(group, gi) in groups" :key="group.id || group.name" class="ho-group" :style="{ '--gi': gi }">
            <header class="ho-group-head">
                <h2>{{ group.name }}</h2>
                <span class="ho-group-sum" :class="groupTone(group)">{{ groupSummary(group) }}</span>
            </header>

            <div class="ho-cards">
                <article
                    v-for="(m, mi) in group.monitorList"
                    :key="m.id"
                    class="ho-card"
                    :class="'is-' + view(m).state.key"
                    :style="{ '--mi': mi }"
                >
                    <div class="ho-card-top">
                        <h3 :title="m.name">{{ m.name }}</h3>
                        <span class="ho-state">
                            <font-awesome-icon :icon="view(m).state.icon" />
                            {{ view(m).state.label }}
                        </span>
                    </div>

                    <div class="ho-card-mid">
                        <dl class="ho-figures">
                            <div>
                                <dt>Uptime 24 h</dt>
                                <dd>{{ view(m).uptime }}</dd>
                            </div>
                            <div>
                                <dt>Response</dt>
                                <dd>
                                    {{ view(m).ping }}
                                    <small v-if="view(m).ping !== '–'">ms</small>
                                </dd>
                            </div>
                        </dl>
                        <svg class="ho-spark" viewBox="0 0 160 44" preserveAspectRatio="none" aria-hidden="true">
                            <path class="area" :d="view(m).spark.area" />
                            <path class="line" :d="view(m).spark.line" />
                        </svg>
                    </div>

                    <div class="ho-beats" role="img" :aria-label="view(m).beatsLabel">
                        <i
                            v-for="(b, bi) in view(m).beats"
                            :key="bi"
                            :class="b ? 'b-' + b.k : 'b-empty'"
                            :title="b ? b.title : ''"
                        ></i>
                    </div>

                    <p class="ho-card-foot">
                        <span>{{ view(m).forText }}</span>
                        <span v-if="showCertificateExpiry && m.certExpiryDaysRemaining" class="ho-cert">
                            <font-awesome-icon icon="certificate" />
                            {{ m.certExpiryDaysRemaining }} days
                        </span>
                    </p>
                </article>
            </div>
        </section>
    </div>
</template>

<script>
import dayjs from "dayjs";
import { STATE, stateOf, stateFor, sparkline, pct } from "./pulse.js";

const BEATS = 40;

// Every service as a card: its state in words and an icon (never colour alone), the two numbers
// people check, a latency sparkline and the last forty checks.
export default {
    props: {
        groups: { type: Array, default: () => [] },
        showCertificateExpiry: { type: Boolean, default: false },
    },
    methods: {
        view(m) {
            const beats = this.$root.heartbeatList[m.id] || [];
            const state = stateOf(beats);
            const last = beats[beats.length - 1];
            const recent = beats.slice(-BEATS);
            const strip = Array.from({ length: BEATS - recent.length }, () => null).concat(
                recent.map((b) => ({
                    k: (STATE[b.status] || { key: "unknown" }).key,
                    title: `${dayjs.utc(b.time).local().format("D MMM HH:mm")} · ${(STATE[b.status] || { label: "Unknown" }).label}${typeof b.ping === "number" ? ` · ${b.ping} ms` : ""}`,
                }))
            );
            const dur = stateFor(beats);
            return {
                state,
                uptime: pct(this.$root.uptimeList[`${m.id}_24`]),
                ping: last && typeof last.ping === "number" ? Math.round(last.ping) : "–",
                spark: sparkline(
                    beats.slice(-30).map((b) => (b.status === 1 ? b.ping : null)),
                    160,
                    44
                ),
                beats: strip,
                beatsLabel: `Last ${recent.length} checks: ${recent.filter((b) => b.status === 1).length} up`,
                forText: dur ? `${state.key === "up" ? "Up" : state.label} for ${dur}` : "Waiting for the first check",
            };
        },
        groupCounts(group) {
            const c = { up: 0, other: 0 };
            for (const m of group.monitorList || []) {
                stateOf(this.$root.heartbeatList[m.id]).key === "up" ? c.up++ : c.other++;
            }
            return c;
        },
        groupSummary(group) {
            const c = this.groupCounts(group);
            const n = (group.monitorList || []).length;
            return c.other === 0 ? `${n} operational` : `${c.other} of ${n} need attention`;
        },
        groupTone(group) {
            return this.groupCounts(group).other ? "warn" : "ok";
        },
    },
};
</script>
