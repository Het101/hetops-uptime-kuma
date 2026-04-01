<template>
    <div class="filter-container">
        <MonitorListFilterDropdown :filterActive="filterState.status?.length > 0 || filterState.active?.length > 0">
            <template #status>
                <Status
                    v-if="filterState.status?.length === 1 && !filterState.active?.length"
                    :status="filterState.status[0]"
                />
                <span
                    v-else-if="!filterState.status?.length && filterState.active?.length === 1"
                    class="badge status-pill"
                    :class="filterState.active[0] ? 'running' : 'paused'"
                >
                    <font-awesome-icon :icon="filterState.active[0] ? 'play' : 'pause'" class="icon-small" />
                    {{ filterState.active[0] ? $t("Running") : $t("filterActivePaused") }}
                </span>
                <span v-else>
                    {{ $t("Status") }}
                </span>
            </template>
            <template #dropdown>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(1)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="1" />
                            <span class="ps-3">
                                {{ $root.stats.up }}
                                <span v-if="filterState.status?.includes(1)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(0)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="0" />
                            <span class="ps-3">
                                {{ $root.stats.down }}
                                <span v-if="filterState.status?.includes(0)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(2)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="2" />
                            <span class="ps-3">
                                {{ $root.stats.pending }}
                                <span v-if="filterState.status?.includes(2)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleStatusFilter(3)">
                        <div class="d-flex align-items-center justify-content-between">
                            <Status :status="3" />
                            <span class="ps-3">
                                {{ $root.stats.maintenance }}
                                <span v-if="filterState.status?.includes(3)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleActiveFilter(true)">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="badge status-pill running">
                                <font-awesome-icon icon="play" class="icon-small" />
                                {{ $t("Running") }}
                            </span>
                            <span class="ps-3">
                                {{ $root.stats.active }}
                                <span v-if="filterState.active?.includes(true)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="dropdown-item" tabindex="0" @click.stop="toggleActiveFilter(false)">
                        <div class="d-flex align-items-center justify-content-between">
                            <span class="badge status-pill paused">
                                <font-awesome-icon icon="pause" class="icon-small" />
                                {{ $t("filterActivePaused") }}
                            </span>
                            <span class="ps-3">
                                {{ $root.stats.pause }}
                                <span v-if="filterState.active?.includes(false)" class="px-1 filter-active">
                                    <font-awesome-icon icon="check" />
                                </span>
                            </span>
                        </div>
                    </div>
                </li>
            </template>
        </MonitorListFilterDropdown>
        <MonitorListFilterDropdown :filterActive="filterState.tags?.length > 0" @open-menu="getExistingTags">
            <template #status>
                <Tag
                    v-if="filterState.tags?.length === 1"
                    :item="tagsList.find((tag) => tag.id === filterState.tags[0])"
                    :size="'sm'"
                />
                <span v-else>
                    {{ $t("Tags") }}
                </span>
            </template>
            <template #dropdown>
                <li class="list-unstyled m-0 p-0">
                    <div class="tags-dropdown-scroll">
                        <ul class="list-unstyled m-0 p-0">
                            <li v-for="tag in tagsList" :key="tag.id">
                                <div class="dropdown-item" tabindex="0" @click.stop="toggleTagFilter(tag)">
                                    <div class="d-flex align-items-center justify-content-between">
                                        <span><Tag :item="tag" :size="'sm'" /></span>
                                        <span class="ps-3">
                                            {{ getTaggedMonitorCount(tag) }}
                                            <span v-if="filterState.tags?.includes(tag.id)" class="px-1 filter-active">
                                                <font-awesome-icon icon="check" />
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </li>
                            <li v-if="tagsList.length === 0">
                                <div class="dropdown-item disabled px-3">
                                    {{ $t("No tags found.") }}
                                </div>
                            </li>
                        </ul>
                    </div>
                </li>
            </template>
        </MonitorListFilterDropdown>
        <button
            v-if="hasGroups"
            type="button"
            class="btn btn-outline-normal btn-collapse-all"
            :title="allCollapsed ? $t('Expand All Groups') : $t('Collapse All Groups')"
            @click="$emit('toggle-collapse-all')"
        >
            <font-awesome-icon :icon="allCollapsed ? 'folder' : 'folder-open'" fixed-width />
        </button>
    </div>
</template>

<script>
import MonitorListFilterDropdown from "./MonitorListFilterDropdown.vue";
import Status from "./Status.vue";
import Tag from "./Tag.vue";

export default {
    components: {
        MonitorListFilterDropdown,
        Status,
        Tag,
    },
    props: {
        filterState: {
            type: Object,
            required: true,
        },
        allCollapsed: {
            type: Boolean,
            default: true,
        },
        hasGroups: {
            type: Boolean,
            default: false,
        },
    },
    emits: ["updateFilter", "toggle-collapse-all"],
    data() {
        return {
            tagsList: [],
        };
    },
    computed: {
        numFiltersActive() {
            let num = 0;

            Object.values(this.filterState).forEach((item) => {
                if (item != null && item.length > 0) {
                    num += 1;
                }
            });

            return num;
        },
    },
    mounted() {
        this.getExistingTags();
    },
    methods: {
        toggleStatusFilter(status) {
            let newFilter = {
                ...this.filterState,
            };

            if (newFilter.status == null) {
                newFilter.status = [status];
            } else {
                if (newFilter.status.includes(status)) {
                    newFilter.status = newFilter.status.filter((item) => item !== status);
                } else {
                    newFilter.status.push(status);
                }
            }
            this.$emit("updateFilter", newFilter);
        },
        toggleActiveFilter(active) {
            let newFilter = {
                ...this.filterState,
            };

            if (newFilter.active == null) {
                newFilter.active = [active];
            } else {
                if (newFilter.active.includes(active)) {
                    newFilter.active = newFilter.active.filter((item) => item !== active);
                } else {
                    newFilter.active.push(active);
                }
            }
            this.$emit("updateFilter", newFilter);
        },
        toggleTagFilter(tag) {
            let newFilter = {
                ...this.filterState,
            };

            if (newFilter.tags == null) {
                newFilter.tags = [tag.id];
            } else {
                if (newFilter.tags.includes(tag.id)) {
                    newFilter.tags = newFilter.tags.filter((item) => item !== tag.id);
                } else {
                    newFilter.tags.push(tag.id);
                }
            }
            this.$emit("updateFilter", newFilter);
        },
        clearFilters() {
            this.$emit("updateFilter", {
                status: null,
            });
        },
        getExistingTags() {
            this.$root.getSocket().emit("getTags", (res) => {
                if (res.ok) {
                    this.tagsList = res.tags;
                }
            });
        },
        getTaggedMonitorCount(tag) {
            return Object.values(this.$root.monitorList).filter((monitor) => {
                return monitor.tags.find((monitorTag) => monitorTag.tag_id === tag.id);
            }).length;
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.filter-container {
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 1050; // Above monitor list items but below main overlays
}

.dropdown-item {
    cursor: pointer;
    padding: 10px 16px;
    border-radius: 8px;
    margin: 2px 8px;
    transition: all $transition-time $easing-smooth;

    &:hover {
        background: rgba(96, 165, 250, 0.08) !important;
        transform: translateX(4px);
    }
}

.status-pill {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    display: inline-flex;
    align-items: center;
    gap: 6px;

    &.running {
        background-color: rgba(16, 185, 129, 0.1) !important;
        color: #10b981 !important;
        border: 1px solid rgba(16, 185, 129, 0.25);
    }

    &.paused {
        background-color: rgba(107, 114, 128, 0.1) !important;
        color: #6b7280 !important;
        border: 1px solid rgba(107, 114, 128, 0.2);
    }

    .icon-small {
        font-size: 10px;
    }
}

.dropdown-divider {
    margin: 8px 0;
    border-top: 1px solid rgba(0, 0, 0, 0.05);

    .dark & {
        border-top-color: rgba(255, 255, 255, 0.05);
    }
}

.btn-collapse-all {
    width: 42px;
    height: 42px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.tags-dropdown-scroll {
    max-height: min(50vh, 320px);
    overflow-y: auto;
}
</style>
