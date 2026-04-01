<template>
    <transition name="slide-fade" appear>
        <div v-if="monitor">
            <div class="monitor-hero-section mb-4">
                <div class="hero-watermark">{{ monitor.id }}</div>
                <div class="hero-content">
                    <router-link v-if="group !== ''" :to="monitorURL(monitor.parent)" class="group-breadcrumb">
                        <font-awesome-icon icon="folder-open" class="me-1" /> {{ group }}
                    </router-link>
                    
                    <div class="hero-title-row">
                        <h1 class="hero-title">
                            {{ monitor.name }}
                        </h1>
                        <div class="monitor-status-pill">
                            <Status :status="lastHeartBeat.status" />
                        </div>
                    </div>

                    <!-- eslint-disable-next-line vue/no-v-html-->
                    <p v-if="monitor.description" class="hero-description" v-html="descriptionHTML"></p>
                    
                    <div class="hero-meta">
                        <div class="tags">
                            <Tag v-for="tag in monitor.tags" :key="tag.id" :item="tag" :size="'sm'" />
                        </div>
                        
                        <div class="url-container">
                            <div class="live-line"></div>
                            <a
                                v-if="
                                    monitor.type === 'http' ||
                                    monitor.type === 'keyword' ||
                                    monitor.type === 'json-query' ||
                                    monitor.type === 'real-browser' ||
                                    monitor.type === 'websocket-upgrade'
                                "
                                :href="monitor.url"
                                class="hero-url"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <font-awesome-icon icon="link" class="me-2" />
                                {{ filterPassword(monitor.url) }}
                            </a>
                            <span v-else class="hero-url text-secondary">
                                <font-awesome-icon icon="terminal" class="me-2" />
                                <span v-if="monitor.type === 'port'">TCP Port {{ monitor.hostname }}:{{ monitor.port }}</span>
                                <span v-if="monitor.type === 'ping'">Ping: {{ monitor.hostname }}</span>
                                <span v-if="monitor.type === 'docker'">Docker: {{ monitor.docker_container }}</span>
                                <span v-if="monitor.type === 'push'">Push Monitor</span>
                                <span v-else>{{ monitor.type.toUpperCase() }}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="functions mb-4">
                <div class="btn-group" role="group">
                    <button v-if="monitor.active" class="btn btn-normal" @click="pauseDialog">
                        <font-awesome-icon icon="pause" />
                        {{ $t("Pause") }}
                    </button>
                    <button
                        v-if="!monitor.active"
                        class="btn btn-primary"
                        :disabled="monitor.forceInactive"
                        @click="resumeMonitor"
                    >
                        <font-awesome-icon icon="play" />
                        {{ $t("Resume") }}
                    </button>
                    <router-link :to="'/edit/' + monitor.id" class="btn btn-normal">
                        <font-awesome-icon icon="edit" />
                        {{ $t("Edit") }}
                    </router-link>
                    <router-link :to="'/clone/' + monitor.id" class="btn btn-normal">
                        <font-awesome-icon icon="clone" />
                        {{ $t("Clone") }}
                    </router-link>
                    <button class="btn btn-normal text-danger" @click="deleteDialog">
                        <font-awesome-icon icon="trash" />
                        {{ $t("Delete") }}
                    </button>
                </div>
            </div>

            <div class="shadow-box">
                <div class="row">
                    <div class="col-md-8">
                        <HeartbeatBar :monitor-id="monitor.id" />
                        <span class="word">
                            {{ $t("checkEverySecond", [monitor.interval]) }} ({{
                                secondsToHumanReadableFormat(monitor.interval)
                            }})
                        </span>
                    </div>
                    <div class="col-md-4 text-center">
                        <span
                            class="badge rounded-pill"
                            :class="'bg-' + status.color"
                            style="font-size: 30px"
                            data-testid="monitor-status"
                        >
                            {{ status.text }}
                        </span>
                    </div>
                </div>
            </div>

            <!-- Push Examples -->
            <div v-if="monitor.type === 'push'" class="shadow-box big-padding">
                <a href="#" @click="pushMonitor.showPushExamples = !pushMonitor.showPushExamples">
                    {{ $t("pushViewCode") }}
                </a>

                <transition name="slide-fade" appear>
                    <div v-if="pushMonitor.showPushExamples" class="mt-3">
                        <select id="push-current-example" v-model="pushMonitor.currentExample" class="form-select">
                            <optgroup :label="$t('programmingLanguages')">
                                <option value="csharp">C#</option>
                                <option value="go">Go</option>
                                <option value="java">Java</option>
                                <option value="javascript-fetch">JavaScript (fetch)</option>
                                <option value="php">PHP</option>
                                <option value="python">Python</option>
                                <option value="typescript-fetch">TypeScript (fetch)</option>
                            </optgroup>
                            <optgroup :label="$t('pushOthers')">
                                <option value="bash-curl">Bash (curl)</option>
                                <option value="powershell">PowerShell</option>
                                <option value="docker">Docker</option>
                            </optgroup>
                        </select>

                        <prism-editor
                            v-model="pushMonitor.code"
                            class="css-editor mt-3"
                            :highlight="pushExampleHighlighter"
                            line-numbers
                            readonly
                        ></prism-editor>
                    </div>
                </transition>
            </div>

            <!-- Stats -->
            <div class="stats-grid mb-4">
                <div v-if="monitor.type !== 'group'" class="stat-card shadow-box">
                    <h4 class="stat-title">{{ pingTitle() }}</h4>
                    <p class="stat-label">({{ $t("Current") }})</p>
                    <span class="num">
                        <a href="#" @click.prevent="showPingChartBox = !showPingChartBox">
                            <CountUp :value="ping" />
                        </a>
                    </span>
                </div>
                
                <div v-if="monitor.type !== 'group'" class="stat-card shadow-box">
                    <h4 class="stat-title">{{ pingTitle(true) }}</h4>
                    <p class="stat-label">({{ $t("hours", 24) }})</p>
                    <span class="num">
                        <CountUp :value="avgPing" />
                    </span>
                </div>

                <!-- Uptime (24-hour) -->
                <div class="stat-card shadow-box">
                    <h4 class="stat-title">{{ $t("Uptime") }}</h4>
                    <p class="stat-label">({{ $t("hours", 24) }})</p>
                    <span class="num">
                        <Uptime :monitor="monitor" type="24" />
                    </span>
                </div>

                <!-- Uptime (30-day) -->
                <div class="stat-card shadow-box">
                    <h4 class="stat-title">{{ $t("Uptime") }}</h4>
                    <p class="stat-label">({{ $t("days", 30) }})</p>
                    <span class="num">
                        <Uptime :monitor="monitor" type="720" />
                    </span>
                </div>

                <!-- Uptime (1-year) -->
                <div class="stat-card shadow-box">
                    <h4 class="stat-title">{{ $t("Uptime") }}</h4>
                    <p class="stat-label">({{ $t("years", 1) }})</p>
                    <span class="num">
                        <Uptime :monitor="monitor" type="1y" />
                    </span>
                </div>

                <div v-if="tlsInfo" class="stat-card shadow-box">
                    <h4 class="stat-title">{{ $t("Cert Exp.") }}</h4>
                    <p class="stat-label">
                        (<Datetime :value="tlsInfo.certInfo.validTo" date-only />)
                    </p>
                    <span class="num">
                        <a href="#" @click.prevent="toggleCertInfoBox = !toggleCertInfoBox">
                            {{ $t("days", tlsInfo.certInfo.daysRemaining) }}
                        </a>
                        <font-awesome-icon
                            v-if="tlsInfo.hostnameMatchMonitorUrl === false"
                            class="cert-info-warn"
                            icon="exclamation-triangle"
                            :title="$t('certHostnameMismatch')"
                        />
                    </span>
                </div>

                <div v-if="domainInfo" class="stat-card shadow-box">
                    <h4 class="stat-title">{{ $t("labelDomainExpiry") }}</h4>
                    <p class="stat-label">
                        (<Datetime :value="domainInfo.expiresOn" date-only />)
                    </p>
                    <span class="num">
                        {{ $t("days", domainInfo.daysRemaining) }}
                    </span>
                </div>
            </div>

            <!-- Cert Info Box -->
            <transition name="slide-fade" appear>
                <div v-if="showCertInfoBox" class="shadow-box big-padding text-center">
                    <div class="row">
                        <div class="col">
                            <certificate-info :certInfo="tlsInfo.certInfo" :valid="tlsInfo.valid" />
                        </div>
                    </div>
                </div>
            </transition>

            <!-- Ping Chart -->
            <div v-if="showPingChartBox" class="shadow-box big-padding text-center ping-chart-wrapper">
                <div class="row">
                    <div class="col">
                        <PingChart :monitor-id="monitor.id" />
                    </div>
                </div>
            </div>

            <!-- Screenshot -->
            <div v-if="monitor.type === 'real-browser'" class="shadow-box">
                <div class="row">
                    <div class="col-md-6 zoom-cursor">
                        <img
                            :src="screenshotURL"
                            style="width: 100%"
                            alt="screenshot of the website"
                            @click="showScreenshotDialog"
                        />
                    </div>
                    <ScreenshotDialog ref="screenshotDialog" :imageURL="screenshotURL" />
                </div>
            </div>

            <div class="shadow-box table-shadow-box">
                <div class="dropdown dropdown-clear-data">
                    <button
                        class="btn btn-sm btn-outline-danger dropdown-toggle"
                        type="button"
                        data-bs-toggle="dropdown"
                    >
                        <font-awesome-icon icon="trash" />
                        {{ $t("Clear Data") }}
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <button type="button" class="dropdown-item" @click="clearEventsDialog">
                                {{ $t("Events") }}
                            </button>
                        </li>
                        <li>
                            <button type="button" class="dropdown-item" @click="clearHeartbeatsDialog">
                                {{ $t("Heartbeats") }}
                            </button>
                        </li>
                    </ul>
                </div>
                <table class="table table-borderless table-hover">
                    <thead>
                        <tr>
                            <th>{{ $t("Status") }}</th>
                            <th>{{ $t("DateTime") }}</th>
                            <th>{{ $t("Message") }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="(beat, index) in displayedRecords" :key="index" style="padding: 10px">
                            <td><Status :status="beat.status" /></td>
                            <td :class="{ 'border-0': !beat.msg }">
                                <Datetime :value="beat.time" />
                            </td>
                            <td class="border-0">{{ beat.msg }}</td>
                        </tr>

                        <tr v-if="importantHeartBeatListLength === 0">
                            <td colspan="3">
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

            <Confirm ref="confirmPause" :yes-text="$t('Yes')" :no-text="$t('No')" @yes="pauseMonitor">
                {{ $t("pauseMonitorMsg") }}
            </Confirm>

            <Confirm
                ref="confirmDelete"
                btn-style="btn-danger"
                :yes-text="$t('Yes')"
                :no-text="$t('No')"
                @yes="deleteMonitor"
            >
                <div v-if="monitor && monitor.type === 'group'">
                    <div>{{ $t("deleteGroupMsg") }}</div>
                    <div v-if="hasChildren" class="form-check">
                        <input
                            id="delete-children-checkbox"
                            v-model="deleteChildrenMonitors"
                            class="form-check-input"
                            type="checkbox"
                        />
                        <label class="form-check-label" for="delete-children-checkbox">
                            {{ $t("deleteChildrenMonitors", childrenCount) }}
                        </label>
                    </div>
                </div>
                <div v-else>
                    {{ $t("deleteMonitorMsg") }}
                </div>
            </Confirm>

            <Confirm
                ref="confirmClearEvents"
                btn-style="btn-danger"
                :yes-text="$t('Yes')"
                :no-text="$t('No')"
                @yes="clearEvents"
            >
                {{ $t("clearEventsMsg") }}
            </Confirm>

            <Confirm
                ref="confirmClearHeartbeats"
                btn-style="btn-danger"
                :yes-text="$t('Yes')"
                :no-text="$t('No')"
                @yes="clearHeartbeats"
            >
                {{ $t("clearHeartbeatsMsg") }}
            </Confirm>
        </div>
    </transition>
</template>

<script>
import { defineAsyncComponent } from "vue";
import { useToast } from "vue-toastification";
const toast = useToast();
import Confirm from "../components/Confirm.vue";
import HeartbeatBar from "../components/HeartbeatBar.vue";
import Status from "../components/Status.vue";
import Datetime from "../components/Datetime.vue";
import CountUp from "../components/CountUp.vue";
import Uptime from "../components/Uptime.vue";
import Pagination from "v-pagination-3";
const PingChart = defineAsyncComponent(() => import("../components/PingChart.vue"));
import Tag from "../components/Tag.vue";
import CertificateInfo from "../components/CertificateInfo.vue";
import { getMonitorRelativeURL } from "../util.ts";
import { URL } from "whatwg-url";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { getResBaseURL, timeDurationFormatter } from "../util-frontend";
import { highlight, languages } from "prismjs/components/prism-core";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-css";
import { PrismEditor } from "vue-prism-editor";
import "vue-prism-editor/dist/prismeditor.min.css";
import ScreenshotDialog from "../components/ScreenshotDialog.vue";

export default {
    components: {
        Uptime,
        CountUp,
        Datetime,
        HeartbeatBar,
        Confirm,
        Status,
        Pagination,
        PingChart,
        Tag,
        CertificateInfo,
        PrismEditor,
        ScreenshotDialog,
    },
    data() {
        return {
            page: 1,
            perPage: 25,
            heartBeatList: [],
            toggleCertInfoBox: false,
            showPingChartBox: true,
            paginationConfig: {
                hideCount: true,
                chunksNavigation: "scroll",
            },
            cacheTime: Date.now(),
            importantHeartBeatListLength: 0,
            displayedRecords: [],
            pushMonitor: {
                showPushExamples: false,
                currentExample: "javascript-fetch",
                code: "",
            },
            deleteChildrenMonitors: false,
        };
    },
    computed: {
        monitor() {
            let id = this.$route.params.id;
            return this.$root.monitorList[id];
        },

        /**
         * Get the count of children monitors for this group
         * @returns {number} Number of children monitors
         */
        childrenCount() {
            if (!this.monitor || this.monitor.type !== "group") {
                return 0;
            }
            const children = Object.values(this.$root.monitorList).filter((m) => m.parent === this.monitor.id);
            return children.length;
        },

        /**
         * Check if the monitor is a group and has children
         * @returns {boolean} True if monitor is a group with children
         */
        hasChildren() {
            return this.childrenCount > 0;
        },

        lastHeartBeat() {
            // Also trigger screenshot refresh here
            // eslint-disable-next-line vue/no-side-effects-in-computed-properties
            this.cacheTime = Date.now();

            if (this.monitor.id in this.$root.lastHeartbeatList && this.$root.lastHeartbeatList[this.monitor.id]) {
                return this.$root.lastHeartbeatList[this.monitor.id];
            }

            return {
                status: -1,
            };
        },

        ping() {
            if (this.lastHeartBeat.ping || this.lastHeartBeat.ping === 0) {
                return this.lastHeartBeat.ping;
            }

            return this.$t("notAvailableShort");
        },

        avgPing() {
            if (this.$root.avgPingList[this.monitor.id] || this.$root.avgPingList[this.monitor.id] === 0) {
                return this.$root.avgPingList[this.monitor.id];
            }

            return this.$t("notAvailableShort");
        },

        status() {
            if (this.$root.statusList[this.monitor.id]) {
                return this.$root.statusList[this.monitor.id];
            }

            return {};
        },

        tlsInfo() {
            // Add: this.$root.tlsInfoList[this.monitor.id].certInfo
            // Fix: TypeError: Cannot read properties of undefined (reading 'validTo')
            // Reason: TLS Info object format is changed in 1.8.0, if for some reason, it cannot connect to the site after update to 1.8.0, the object is still in the old format.
            if (this.$root.tlsInfoList[this.monitor.id] && this.$root.tlsInfoList[this.monitor.id].certInfo) {
                return this.$root.tlsInfoList[this.monitor.id];
            }

            return null;
        },

        domainInfo() {
            return this.$root.domainInfoList[this.monitor.id] || null;
        },

        showCertInfoBox() {
            return this.tlsInfo != null && this.toggleCertInfoBox;
        },

        group() {
            return this.monitor.path.slice(0, -1).join(" / ");
        },

        pushURL() {
            return this.$root.baseURL + "/api/push/" + this.monitor.pushToken + "?status=up&msg=OK&ping=";
        },

        screenshotURL() {
            return getResBaseURL() + this.monitor.screenshot + "?time=" + this.cacheTime;
        },

        descriptionHTML() {
            if (this.monitor.description != null) {
                return DOMPurify.sanitize(marked(this.monitor.description));
            } else {
                return "";
            }
        },
    },

    watch: {
        page(to) {
            this.getImportantHeartbeatListPaged();
        },

        monitor(to) {
            this.getImportantHeartbeatListLength();
        },
        "monitor.type"() {
            if (this.monitor && this.monitor.type === "push") {
                this.loadPushExample();
            }
        },
        "pushMonitor.currentExample"() {
            this.loadPushExample();
        },
    },

    mounted() {
        this.getImportantHeartbeatListLength();

        this.$root.emitter.on("newImportantHeartbeat", this.onNewImportantHeartbeat);

        if (this.monitor && this.monitor.type === "push") {
            if (this.lastHeartBeat.status === -1) {
                this.pushMonitor.showPushExamples = true;
            }
            this.loadPushExample();
        }
    },

    beforeUnmount() {
        this.$root.emitter.off("newImportantHeartbeat", this.onNewImportantHeartbeat);
    },

    methods: {
        getResBaseURL,
        /**
         * Request a test notification be sent for this monitor
         * @returns {void}
         */
        testNotification() {
            this.$root.getSocket().emit("testNotification", this.monitor.id);
            this.$root.toastSuccess("Test notification is requested.");
        },

        /**
         * Show dialog to confirm pause
         * @returns {void}
         */
        pauseDialog() {
            this.$refs.confirmPause.show();
        },

        /**
         * Resume this monitor
         * @returns {void}
         */
        resumeMonitor() {
            this.$root.getSocket().emit("resumeMonitor", this.monitor.id, (res) => {
                this.$root.toastRes(res);
            });
        },

        /**
         * Request that this monitor is paused
         * @returns {void}
         */
        pauseMonitor() {
            this.$root.getSocket().emit("pauseMonitor", this.monitor.id, (res) => {
                this.$root.toastRes(res);
            });
        },

        /**
         * Show dialog to confirm deletion
         * @returns {void}
         */
        deleteDialog() {
            this.$refs.confirmDelete.show();
        },

        /**
         * Show Screenshot Dialog
         * @returns {void}
         */
        showScreenshotDialog() {
            this.$refs.screenshotDialog.show();
        },

        /**
         * Show dialog to confirm clearing events
         * @returns {void}
         */
        clearEventsDialog() {
            this.$refs.confirmClearEvents.show();
        },

        /**
         * Show dialog to confirm clearing heartbeats
         * @returns {void}
         */
        clearHeartbeatsDialog() {
            this.$refs.confirmClearHeartbeats.show();
        },

        /**
         * Request that this monitor is deleted
         * @returns {void}
         */
        deleteMonitor() {
            this.$root.deleteMonitor(this.monitor.id, this.deleteChildrenMonitors, (res) => {
                this.$root.toastRes(res);
                if (res.ok) {
                    this.$router.push("/dashboard");
                }
            });
        },

        /**
         * Request that this monitors events are cleared
         * @returns {void}
         */
        clearEvents() {
            this.$root.clearEvents(this.monitor.id, (res) => {
                if (res.ok) {
                    this.getImportantHeartbeatListLength();
                } else {
                    toast.error(res.msg);
                }
            });
        },

        /**
         * Request that this monitors heartbeats are cleared
         * @returns {void}
         */
        clearHeartbeats() {
            this.$root.clearHeartbeats(this.monitor.id, (res) => {
                if (!res.ok) {
                    toast.error(res.msg);
                }
            });
        },

        /**
         * Return the correct title for the ping stat
         * @param {boolean} average Is the statistic an average?
         * @returns {string} Title formatted dependent on monitor type
         */
        pingTitle(average = false) {
            let translationPrefix = "";
            if (average) {
                translationPrefix = "Avg. ";
            }

            if (this.monitor.type === "http" || this.monitor.type === "keyword" || this.monitor.type === "json-query") {
                return this.$t(translationPrefix + "Response");
            }

            return this.$t(translationPrefix + "Ping");
        },

        /**
         * Get URL of monitor
         * @param {number} id ID of monitor
         * @returns {string} Relative URL of monitor
         */
        monitorURL(id) {
            return getMonitorRelativeURL(id);
        },

        /**
         * Filter and hide password in URL for display
         * @param {string} urlString URL to censor
         * @returns {string} Censored URL
         */
        filterPassword(urlString) {
            try {
                let parsedUrl = new URL(urlString);
                if (parsedUrl.password !== "") {
                    parsedUrl.password = "******";
                }
                return parsedUrl.toString();
            } catch (e) {
                // Handle SQL Server
                return urlString.replaceAll(/Password=(.+);/gi, "Password=******;");
            }
        },

        /**
         * Retrieves the length of the important heartbeat list for this monitor.
         * @returns {void}
         */
        getImportantHeartbeatListLength() {
            if (this.monitor) {
                this.$root.getSocket().emit("monitorImportantHeartbeatListCount", this.monitor.id, (res) => {
                    if (res.ok) {
                        this.importantHeartBeatListLength = res.count;
                        this.getImportantHeartbeatListPaged();
                    }
                });
            }
        },

        /**
         * Retrieves the important heartbeat list for the current page.
         * @returns {void}
         */
        getImportantHeartbeatListPaged() {
            if (this.monitor) {
                const offset = (this.page - 1) * this.perPage;
                this.$root
                    .getSocket()
                    .emit("monitorImportantHeartbeatListPaged", this.monitor.id, offset, this.perPage, (res) => {
                        if (res.ok) {
                            this.displayedRecords = res.data;
                        }
                    });
            }
        },

        /**
         * Updates the displayed records when a new important heartbeat arrives.
         * @param {object} heartbeat - The heartbeat object received.
         * @returns {void}
         */
        onNewImportantHeartbeat(heartbeat) {
            if (heartbeat.monitorID === this.monitor?.id) {
                if (this.page === 1) {
                    this.displayedRecords.unshift(heartbeat);
                    if (this.displayedRecords.length > this.perPage) {
                        this.displayedRecords.pop();
                    }
                    this.importantHeartBeatListLength += 1;
                }
            }
        },

        /**
         * Highlight the example code
         * @param {string} code Code
         * @returns {string} Highlighted code
         */
        pushExampleHighlighter(code) {
            return highlight(code, languages.js);
        },

        loadPushExample() {
            this.pushMonitor.code = "";
            this.$root.getSocket().emit("getPushExample", this.pushMonitor.currentExample, (res) => {
                let code = res.code
                    .replace("60", this.monitor.interval)
                    .replace("https://example.com/api/push/key?status=up&msg=OK&ping=", this.pushURL);
                this.pushMonitor.code = code;
            });
        },

        secondsToHumanReadableFormat(seconds) {
            return timeDurationFormatter.secondsToHumanReadableFormat(seconds);
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.form-check {
    margin-top: 16px;
}

@media (max-width: 767px) {
    .badge {
        margin-top: 14px;
    }
}

@media (max-width: 550px) {
    .ping-chart-wrapper {
        padding: 10px !important;
    }

    .dropdown-clear-data {
        margin-bottom: 10px;
    }
}

@media (max-width: 450px) {
    .btn {
        padding-top: 10px;
        font-size: 0.9em;
    }

    .btn-group {
        width: 100%;

        .btn,
        a.btn {
            display: inline-flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            padding-left: 10px;
            padding-right: 10px;
        }
    }
}

@media (max-width: 400px) {
    .dropdown-clear-data {
        button {
            display: block;
            padding-top: 4px;
        }
    }
}

.monitor-hero-section {
    position: relative;
    padding: 40px;
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 100%);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    overflow: hidden;
    box-shadow: $premium-shadow-light;

    .dark & {
        background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%);
        border-color: rgba(255, 255, 255, 0.08);
        box-shadow: $premium-shadow-dark;
    }
}

.hero-watermark {
    position: absolute;
    right: -20px;
    bottom: -40px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 180px;
    font-weight: 900;
    color: rgba(0, 0, 0, 0.03);
    pointer-events: none;
    line-height: 1;
    z-index: 0;

    .dark & {
        color: rgba(255, 255, 255, 0.02);
    }
}

.hero-content {
    position: relative;
    z-index: 1;
}

.group-breadcrumb {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #6b7280;
    text-decoration: none;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    transition: color 0.2s ease;

    &:hover {
        color: $primary;
    }
}

.hero-title-row {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 16px;
    flex-wrap: wrap;
}

.hero-title {
    font-size: 42px;
    font-weight: 800;
    margin: 0;
    letter-spacing: -0.02em;
    color: inherit;
}

.hero-description {
    font-size: 16px;
    color: #4b5563;
    max-width: 800px;
    margin-bottom: 24px;

    .dark & {
        color: #9ca3af;
    }
}

.hero-meta {
    display: flex;
    align-items: center;
    gap: 30px;
    flex-wrap: wrap;
}

.url-container {
    position: relative;
    padding: 8px 0;
}

.hero-url {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: $primary;
    text-decoration: none;
    display: flex;
    align-items: center;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
}

.live-line {
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 40px;
    background: $primary;
    box-shadow: 0 0 10px $primary;
    animation: live-scan 3s infinite ease-in-out;
}

@keyframes live-scan {
    0% {
        left: 0;
        width: 10px;
        opacity: 0;
    }

    20% {
        opacity: 1;
        width: 40px;
    }

    80% {
        opacity: 1;
        width: 40px;
    }

    100% {
        left: 100%;
        width: 10px;
        opacity: 0;
    }
}

@media (max-width: 768px) {
    .monitor-hero-section {
        padding: 24px;
    }

    .hero-title {
        font-size: 28px;
    }
}

.functions {
    display: flex;
    justify-content: flex-start;
}

.shadow-box {
    padding: 20px;
    margin-top: 25px;
}

.word {
    color: $secondary-text;
    font-size: 14px;
}

table {
    font-size: 14px;

    tr {
        transition: all ease-in-out 0.2ms;
    }
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-top: 25px;
}

.stat-card {
    padding: 16px !important;
    margin-top: 0 !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    border-radius: 16px;
    transition: all $transition-time $easing-smooth;

    &:hover {
        transform: translateY(-3px);
        box-shadow: $premium-shadow-light;
        border-color: rgba(96, 165, 250, 0.2);

        .dark & {
            box-shadow: $premium-shadow-dark;
            border-color: rgba(96, 165, 250, 0.3);
        }
    }

    .stat-title {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        margin-bottom: 4px;
    }

    .stat-label {
        font-size: 11px !important;
        color: $secondary-text !important;
        margin-bottom: 8px !important;
    }

    .num {
        font-family: 'JetBrains Mono', monospace;
        font-size: 24px;
        font-weight: 700;
        line-height: 1;
        color: inherit;

        a {
            text-decoration: none;
            color: inherit;
            transition: color 0.2s ease;
            &:hover { color: $primary; }
        }
    }
}

@media (max-width: 550px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
    }
    
    .stat-card {
        padding: 12px !important;
        .num { font-size: 20px; }
    }
}

.keyword {
    color: black;
}

.dropdown-clear-data {
    float: right;

    ul {
        width: 100%;
        min-width: unset;
        padding-left: 0;
    }
}

.dark {
    .keyword {
        color: $dark-font-color;
    }

    .keyword-inverted {
        color: $dark-font-color;
    }

    .dropdown-clear-data {
        ul {
            background-color: $dark-bg;
            border-color: $dark-bg2;
            border-width: 2px;

            li button {
                color: $dark-font-color;
            }

            li button:hover {
                background-color: $dark-bg2;
            }
        }
    }
}

.tags {
    margin-bottom: 0.5rem;
}

.tags > div:first-child {
    margin-left: 0 !important;
}

.monitor-id {
    display: inline-flex;
    font-size: 0.7em;
    margin-left: 0.3em;
    color: $secondary-text;
    flex-direction: row;
    flex-wrap: nowrap;

    .hash {
        user-select: none;
    }

    .dark & {
        opacity: 0.7;
    }
}

.cert-info-warn {
    margin-left: 4px;
    opacity: 0.5;

    .dark & {
        opacity: 0.7;
    }
}
</style>
