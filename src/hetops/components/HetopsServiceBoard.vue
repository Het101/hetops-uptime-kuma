<template>
    <div class="ho-deck">
        <!-- Annunciator: one lit plate per service, grouped as on the status page. -->
        <section v-for="(group, gi) in groups" :key="group.id || group.name" class="ho-annun" :style="{ '--gi': gi }">
            <div class="ho-annun-head">
                <h2>{{ group.name }}</h2>
                <span :class="groupTone(group)">{{ groupSummary(group) }}</span>
            </div>
            <div class="ho-plates">
                <article
                    v-for="(m, mi) in group.monitorList"
                    :key="m.id"
                    class="ho-plate"
                    :class="'is-' + plate(m).state.key"
                    :style="{ '--mi': mi }"
                >
                    <h3 :title="m.name">
                        <i class="lamp" aria-hidden="true"></i>
                        {{ m.name }}
                    </h3>
                    <p class="ho-plate-word">
                        <font-awesome-icon :icon="plate(m).state.icon" />
                        {{ plate(m).word }}
                    </p>
                    <p class="ho-plate-read">
                        <span>
                            <b>{{ plate(m).ping }}</b>
                            ms
                        </span>
                        <span>
                            <b>{{ plate(m).uptime }}</b>
                            24 h
                        </span>
                    </p>
                    <p class="ho-plate-for">
                        {{ plate(m).forText }}
                        <span v-if="showCertificateExpiry && m.certExpiryDaysRemaining" class="ho-cert">
                            <font-awesome-icon icon="certificate" />
                            {{ m.certExpiryDaysRemaining }} d
                        </span>
                    </p>
                </article>
            </div>
        </section>

        <!-- Flight recorder: every service on one time axis, so a shared failure reads as a column. -->
        <section v-if="rows.length" class="ho-recorder" aria-labelledby="ho-rec-h">
            <div class="ho-rec-head">
                <h2 id="ho-rec-h">Flight recorder</h2>
                <p>
                    The last {{ WINDOW_MIN }} minutes of checks, one row per service. Bar height is response time, on
                    one scale for every row; a failure that lines up across rows has a shared cause.
                </p>
            </div>
            <div class="ho-rec">
                <div v-for="r in rows" :key="r.id" class="ho-rec-row" :class="'is-' + r.state">
                    <span class="ho-rec-name" :title="r.name">{{ r.name }}</span>
                    <div class="ho-rec-track" role="img" :aria-label="r.label">
                        <i
                            v-for="(c, ci) in r.cells"
                            :key="ci"
                            :class="'c-' + c.k"
                            :style="{ height: c.h }"
                            :title="c.title"
                        ></i>
                    </div>
                    <span class="ho-rec-now">{{ r.now }}</span>
                </div>
                <div class="ho-rec-axis" aria-hidden="true">
                    <span></span>
                    <div>
                        <span>−{{ WINDOW_MIN }} min</span>
                        <span>−{{ (WINDOW_MIN * 2) / 3 }}</span>
                        <span>−{{ WINDOW_MIN / 3 }}</span>
                        <span>now</span>
                    </div>
                    <span></span>
                </div>
            </div>
            <ul class="ho-rec-key" aria-hidden="true">
                <li class="c-up">Up</li>
                <li class="c-pending">Degraded</li>
                <li class="c-down">Down</li>
                <li class="c-held">Between checks</li>
            </ul>
        </section>
    </div>
</template>

<script>
import { stateOf, stateFor, pct, recorderCells, WINDOW_MIN } from "./pulse.js";

const WORD = { up: "Normal", pending: "Degraded", down: "Down", maint: "Maintenance", unknown: "No data" };

// The public page as a flight deck: an annunciator plate per service (lamp, state in words,
// response and 24 h uptime), then a flight recorder that lines every service up on one time axis.
export default {
    props: {
        groups: { type: Array, default: () => [] },
        showCertificateExpiry: { type: Boolean, default: false },
    },
    data() {
        return { WINDOW_MIN, now: Date.now(), timer: null };
    },
    computed: {
        rows() {
            return this.groups
                .flatMap((g) => g.monitorList || [])
                .map((m) => {
                    const beats = this.$root.heartbeatList[m.id] || [];
                    const { cells, up, down } = recorderCells(beats, this.now);
                    const last = beats[beats.length - 1];
                    return {
                        id: m.id,
                        name: m.name,
                        state: stateOf(beats).key,
                        cells,
                        now: last && typeof last.ping === "number" ? `${Math.round(last.ping)} ms` : "–",
                        label: `${m.name}, last ${WINDOW_MIN} minutes: ${up} checks up, ${down} down`,
                    };
                });
        },
    },
    mounted() {
        this.timer = setInterval(() => (this.now = Date.now()), 30000);
    },
    beforeUnmount() {
        clearInterval(this.timer);
    },
    methods: {
        plate(m) {
            const beats = this.$root.heartbeatList[m.id] || [];
            const state = stateOf(beats);
            const last = beats[beats.length - 1];
            const dur = stateFor(beats);
            return {
                state,
                word: WORD[state.key] || state.label,
                uptime: pct(this.$root.uptimeList[`${m.id}_24`]),
                ping: last && typeof last.ping === "number" ? Math.round(last.ping) : "–",
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
            return c.other === 0 ? `${n} normal` : `${c.other} of ${n} need attention`;
        },
        groupTone(group) {
            return this.groupCounts(group).other ? "warn" : "ok";
        },
    },
};
</script>
