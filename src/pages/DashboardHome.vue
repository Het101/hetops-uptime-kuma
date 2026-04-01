<template>
    <transition ref="tableContainer" name="slide-fade" appear>
        <div v-if="$route.name === 'DashboardHome'">
            <h1 class="mb-3">
                {{ $t("Quick Stats") }}
            </h1>

            <div class="stats-container mb-4">
                <div class="stat-card glass-card shadow-box card-up">
                    <div class="stat-icon-wrap up-icon"><font-awesome-icon icon="circle-check" /></div>
                    <div class="stat-label">{{ $t("Up") }}</div>
                    <div class="num up-num" :class="$root.stats.up === 0 && 'text-secondary'">
                        {{ $root.stats.up }}
                    </div>
                </div>
                <div class="stat-card glass-card shadow-box card-down">
                    <div class="stat-icon-wrap down-icon"><font-awesome-icon icon="circle-xmark" /></div>
                    <div class="stat-label">{{ $t("Down") }}</div>
                    <div class="num text-danger">
                        {{ $root.stats.down }}
                    </div>
                </div>
                <div class="stat-card glass-card shadow-box card-maintenance">
                    <div class="stat-icon-wrap maintenance-icon"><font-awesome-icon icon="wrench" /></div>
                    <div class="stat-label">{{ $t("Maintenance") }}</div>
                    <div class="num text-maintenance">
                        {{ $root.stats.maintenance }}
                    </div>
                </div>
                <div class="stat-card glass-card shadow-box card-unknown">
                    <div class="stat-icon-wrap unknown-icon"><font-awesome-icon icon="circle-question" /></div>
                    <div class="stat-label">{{ $t("Unknown") }}</div>
                    <div class="num text-secondary">{{ $root.stats.unknown }}</div>
                </div>
                <div class="stat-card glass-card shadow-box card-paused">
                    <div class="stat-icon-wrap paused-icon"><font-awesome-icon icon="circle-pause" /></div>
                    <div class="stat-label">{{ $t("Pause") }}</div>
                    <div class="num text-secondary">{{ $root.stats.pause }}</div>
                </div>
            </div>

            <InfrastructureMap />

            <div class="shadow-box table-wrapper p-4">
                <div class="mb-3 text-end">
                    <button
                        class="btn btn-sm btn-outline-danger"
                        :disabled="clearingAllEvents"
                        @click="clearAllEventsDialog"
                    >
                        {{ $t("Clear All Events") }}
                    </button>
                </div>
                <table class="table table-borderless table-hover">
                    <thead>
                        <tr>
                            <th v-if="showGroupColumn">{{ $t("Group Name") }}</th>
                            <th class="name-column">{{ $t("Name") }}</th>
                            <th>{{ $t("Status") }}</th>
                            <th>{{ $t("DateTime") }}</th>
                            <th>{{ $t("Message") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(beat, index) in displayedRecords"
                            :key="index"
                            :class="{ 'shadow-box': $root.windowWidth <= 550 }"
                        >
                            <td v-if="showGroupColumn">
                                <router-link
                                    v-if="getGroupName(beat.monitorID)"
                                    :to="`/dashboard/${getGroupId(beat.monitorID)}`"
                                >
                                    {{ getGroupName(beat.monitorID) }}
                                </router-link>
                                <span v-else class="text-secondary">—</span>
                            </td>
                            <td class="name-column">
                                <router-link :to="`/dashboard/${beat.monitorID}`">
                                    {{ $root.monitorList[beat.monitorID]?.name }}
                                </router-link>
                            </td>
                            <td><Status :status="beat.status" /></td>
                            <td :class="{ 'border-0': !beat.msg }"><Datetime :value="beat.time" /></td>
                            <td class="border-0">{{ beat.msg }}</td>
                        </tr>

                        <tr v-if="importantHeartBeatListLength === 0">
                            <td :colspan="tableColumnCount">
                                {{ $t("No important events") }}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div class="d-flex justify-content-center kuma_pagination">
                    <pagination
                        v-model="page"
                        :records="importantHeartBeatListLength"
                        :per-page="perPage"
                        :options="paginationConfig"
                    />
                </div>
            </div>
        </div>
    </transition>
    <Confirm
        ref="confirmClearEvents"
        btn-style="btn-danger"
        :yes-text="$t('Yes')"
        :no-text="$t('No')"
        @yes="clearAllEvents"
    >
        {{ $t("clearAllEventsMsg") }}
    </Confirm>
    <router-view ref="child" />
</template>

<script>
import Status from "../components/Status.vue";
import Datetime from "../components/Datetime.vue";
import Pagination from "v-pagination-3";
import Confirm from "../components/Confirm.vue";
import InfrastructureMap from "../components/InfrastructureMap.vue";

export default {
    components: {
        Datetime,
        Status,
        Pagination,
        Confirm,
        InfrastructureMap,
    },
    props: {
        calculatedHeight: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            page: 1,
            perPage: 25,
            initialPerPage: 25,
            paginationConfig: {
                hideCount: true,
                chunksNavigation: "scroll",
            },
            importantHeartBeatListLength: 0,
            displayedRecords: [],
            clearingAllEvents: false,
        };
    },
    computed: {
        showGroupColumn() {
            return Object.values(this.$root.monitorList).some((m) => m.parent != null);
        },
        tableColumnCount() {
            return this.showGroupColumn ? 5 : 4;
        },
    },
    watch: {
        perPage() {
            this.$nextTick(() => {
                this.getImportantHeartbeatListPaged();
            });
        },

        page() {
            this.getImportantHeartbeatListPaged();
        },
    },

    mounted() {
        this.getImportantHeartbeatListLength();

        this.$root.emitter.on("newImportantHeartbeat", this.onNewImportantHeartbeat);

        this.initialPerPage = this.perPage;

        window.addEventListener("resize", this.updatePerPage);
        this.updatePerPage();
    },

    beforeUnmount() {
        this.$root.emitter.off("newImportantHeartbeat", this.onNewImportantHeartbeat);

        window.removeEventListener("resize", this.updatePerPage);
    },

    methods: {
        /**
         * Returns the group (parent) name for a monitor, or empty string if none.
         * @param {number} monitorID - The monitor ID.
         * @returns {string} The group name or empty string.
         */
        getGroupName(monitorID) {
            const monitor = this.$root.monitorList[monitorID];
            if (!monitor || monitor.parent == null) {
                return "";
            }
            const parent = this.$root.monitorList[monitor.parent];
            return parent ? parent.name : "";
        },

        /**
         * Returns the group (parent) ID for a monitor, or null if none.
         * @param {number} monitorID - The monitor ID.
         * @returns {number|null} The group monitor ID or null.
         */
        getGroupId(monitorID) {
            const monitor = this.$root.monitorList[monitorID];
            return monitor && monitor.parent != null ? monitor.parent : null;
        },

        /**
         * Updates the displayed records when a new important heartbeat arrives.
         * @param {object} heartbeat - The heartbeat object received.
         * @returns {void}
         */
        onNewImportantHeartbeat(heartbeat) {
            if (this.page === 1) {
                this.displayedRecords.unshift(heartbeat);
                if (this.displayedRecords.length > this.perPage) {
                    this.displayedRecords.pop();
                }
                this.importantHeartBeatListLength += 1;
            }
        },

        /**
         * Retrieves the length of the important heartbeat list for all monitors.
         * @returns {void}
         */
        getImportantHeartbeatListLength() {
            this.$root.getSocket().emit("monitorImportantHeartbeatListCount", null, (res) => {
                if (res.ok) {
                    this.importantHeartBeatListLength = res.count;
                    this.getImportantHeartbeatListPaged();
                }
            });
        },

        /**
         * Retrieves the important heartbeat list for the current page.
         * @returns {void}
         */
        getImportantHeartbeatListPaged() {
            const offset = (this.page - 1) * this.perPage;
            this.$root.getSocket().emit("monitorImportantHeartbeatListPaged", null, offset, this.perPage, (res) => {
                if (res.ok) {
                    this.displayedRecords = res.data;
                }
            });
        },

        /**
         * Updates the number of items shown per page based on the available height.
         * @returns {void}
         */
        updatePerPage() {
            const tableContainer = this.$refs.tableContainer;
            const tableContainerHeight = tableContainer.offsetHeight;
            const availableHeight = window.innerHeight - tableContainerHeight;
            const additionalPerPage = Math.floor(availableHeight / 58);

            if (additionalPerPage > 0) {
                this.perPage = Math.max(this.initialPerPage, this.perPage + additionalPerPage);
            } else {
                this.perPage = this.initialPerPage;
            }
        },

        clearAllEventsDialog() {
            this.$refs.confirmClearEvents.show();
        },
        clearAllEvents() {
            this.clearingAllEvents = true;
            const monitorIDs = Object.keys(this.$root.monitorList);
            let failed = 0;
            const total = monitorIDs.length;

            if (total === 0) {
                this.clearingAllEvents = false;
                this.$root.toastError(this.$t("No monitors found"));
                return;
            }

            monitorIDs.forEach((monitorID) => {
                this.$root.getSocket().emit("clearEvents", monitorID, (res) => {
                    if (!res || !res.ok) {
                        failed++;
                    }
                });
            });
            this.clearingAllEvents = false;
            this.page = 1;
            this.getImportantHeartbeatListLength();
            if (failed === 0) {
                this.$root.toastSuccess(this.$t("Events cleared successfully"));
            } else {
                this.$root.toastError(
                    this.$t("Could not clear events", {
                        failed,
                        total,
                    })
                );
            }
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars";

.stats-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    width: 100%;
}

.stat-card {
    padding: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 20px;
    min-height: 140px;
    border-top: 2px solid transparent;
    transition: all 0.25s ease;

    .stat-icon-wrap {
        font-size: 18px;
        margin-bottom: 10px;
        opacity: 0.7;
    }

    .stat-label {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: #6b7280;
        margin-bottom: 6px;
    }

    .num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 44px;
        line-height: 1;
        font-weight: 700;

        &.up-num {
            color: $status-up;
            text-shadow: 0 0 20px rgba(16, 185, 129, 0.35);
        }
    }

    // Status-specific top borders and icon colors
    &.card-up {
        border-top-color: $status-up;
        .up-icon { color: $status-up; }
        &:hover { border-color: rgba(16, 185, 129, 0.4); }
    }
    &.card-down {
        border-top-color: $status-down;
        .down-icon { color: $status-down; }
        &:hover { border-color: rgba(239, 68, 68, 0.4); }
    }
    &.card-maintenance {
        border-top-color: $status-maintenance;
        .maintenance-icon { color: $status-maintenance; }
        &:hover { border-color: rgba(167, 139, 250, 0.4); }
    }
    &.card-unknown {
        border-top-color: $status-paused;
        .unknown-icon { color: $status-paused; }
        &:hover { border-color: rgba(107, 114, 128, 0.4); }
    }
    &.card-paused {
        border-top-color: $status-paused;
        .paused-icon { color: $status-paused; }
        &:hover { border-color: rgba(107, 114, 128, 0.4); }
    }

    &:hover {
        transform: translateY(-4px);
        box-shadow: $premium-shadow-light;

        .dark & {
            box-shadow: $premium-shadow-dark;
        }
    }
}

.table-wrapper {
    border-radius: 20px;
}

table {
    font-size: 14px;
    
    thead th {
        color: #6b7280;
        font-weight: 600;
        text-transform: uppercase;
        font-size: 12px;
        letter-spacing: 0.05em;
        padding: 16px 12px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);

        .dark & {
            border-bottom-color: rgba(255, 255, 255, 0.05);
        }
    }

    tbody td {
        padding: 16px 12px;
        vertical-align: middle;
        
        a {
            text-decoration: none;
            color: inherit;
            font-weight: 500;
            transition: color 0.2s ease;
            
            &:hover {
                color: $primary;
            }
        }
    }

    tr {
        transition: background-color 0.2s ease;

        &:hover {
            background-color: rgba(0, 0, 0, 0.02);

            .dark & {
                background-color: rgba(255, 255, 255, 0.02);
            }
        }
    }

    @media (max-width: 550px) {
        table-layout: fixed;
        overflow-wrap: break-word;
    }
}

@media screen and (max-width: 1280px) {
    .name-column {
        min-width: 150px;
    }
}

@media screen and (min-aspect-ratio: 4/3) {
    .name-column {
        min-width: 200px;
    }
}
</style>
