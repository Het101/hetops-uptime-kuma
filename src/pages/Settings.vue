<template>
    <div>
        <div v-if="$root.isMobile" class="shadow-box mb-3">
            <router-link to="/manage-status-page" class="nav-link">
                <font-awesome-icon icon="stream" />
                {{ $t("Status Pages") }}
            </router-link>
            <router-link to="/maintenance" class="nav-link">
                <font-awesome-icon icon="wrench" />
                {{ $t("Maintenance") }}
            </router-link>
        </div>

        <h1 v-show="show" class="mb-3">
            {{ $t("Settings") }}
        </h1>

        <div class="shadow-box shadow-box-settings">
            <div class="row">
                <div v-if="showSubMenu" class="settings-menu col-lg-3 col-md-5">
                    <router-link v-for="(item, key) in subMenus" :key="key" :to="`/settings/${key}`">
                        <div class="menu-item">
                            {{ item.title }}
                        </div>
                    </router-link>

                    <!-- Logout Button -->
                    <a
                        v-if="$root.isMobile && $root.loggedIn && $root.socket.token !== 'autoLogin'"
                        class="logout"
                        @click.prevent="$root.logout"
                    >
                        <div class="menu-item">
                            <font-awesome-icon icon="sign-out-alt" />
                            {{ $t("Logout") }}
                        </div>
                    </a>
                </div>
                <div class="settings-content col-lg-9 col-md-7">
                    <div v-if="currentPage" class="settings-content-header">
                        {{ subMenus[currentPage].title }}
                    </div>
                    <div class="mx-3">
                        <router-view v-slot="{ Component }">
                            <transition name="slide-fade" mode="out-in" appear>
                                <component :is="Component" :key="$route.path" />
                            </transition>
                        </router-view>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { useRoute } from "vue-router";
import { computed } from "vue";

export default {
    provide() {
        return {
            settingsComponent: this,
        };
    },

    data() {
        return {
            show: true,
            settings: {},
            settingsLoaded: false,
        };
    },

    computed: {
        currentPage() {
            let pathSplit = useRoute().path.split("/");
            let pathEnd = pathSplit[pathSplit.length - 1];
            if (!pathEnd || pathEnd === "settings") {
                return null;
            }
            return pathEnd;
        },

        showSubMenu() {
            if (this.$root.isMobile) {
                return !this.currentPage;
            } else {
                return true;
            }
        },

        subMenus() {
            return {
                general: {
                    title: this.$t("General"),
                },
                appearance: {
                    title: this.$t("Appearance"),
                },
                notifications: {
                    title: this.$t("Notifications"),
                },
                "reverse-proxy": {
                    title: this.$t("Reverse Proxy"),
                },
                tags: {
                    title: this.$t("Tags"),
                },
                "monitor-history": {
                    title: this.$t("Monitor History"),
                },
                "docker-hosts": {
                    title: this.$t("Docker Hosts"),
                },
                "remote-browsers": {
                    title: this.$t("Remote Browsers"),
                },
                security: {
                    title: this.$t("Security"),
                },
                "api-keys": {
                    title: this.$t("API Keys"),
                },
                proxies: {
                    title: this.$t("Proxies"),
                },
                about: {
                    title: this.$t("About"),
                },
            };
        },
    },

    watch: {
        "$root.isMobile"() {
            this.loadGeneralPage();
        },
    },

    mounted() {
        this.loadSettings();
        this.loadGeneralPage();
    },

    methods: {
        /**
         * Load the general settings page
         * For desktop only, on mobile do nothing
         * @returns {void}
         */
        loadGeneralPage() {
            if (!this.currentPage && !this.$root.isMobile) {
                this.$router.push("/settings/general");
            }
        },

        /**
         * Load settings from server
         * @returns {void}
         */
        loadSettings() {
            this.$root.getSocket().emit("getSettings", (res) => {
                this.settings = res.data;

                if (this.settings.checkUpdate === undefined) {
                    this.settings.checkUpdate = true;
                }

                if (this.settings.searchEngineIndex === undefined) {
                    this.settings.searchEngineIndex = false;
                }

                if (this.settings.entryPage === undefined) {
                    this.settings.entryPage = "dashboard";
                }

                if (this.settings.nscd === undefined) {
                    this.settings.nscd = true;
                }

                if (this.settings.keepDataPeriodDays === undefined) {
                    this.settings.keepDataPeriodDays = 180;
                }

                if (this.settings.tlsExpiryNotifyDays === undefined) {
                    this.settings.tlsExpiryNotifyDays = [7, 14, 21];
                }

                if (this.settings.domainExpiryNotifyDays === undefined) {
                    this.settings.domainExpiryNotifyDays = [7, 14, 21];
                }

                if (this.settings.trustProxy === undefined) {
                    this.settings.trustProxy = false;
                }

                this.settingsLoaded = true;
            });
        },

        /**
         * Callback for saving settings
         * @callback saveSettingsCB
         * @param {object} res Result of operation
         * @returns {void}
         */

        /**
         * Save Settings
         * @param {saveSettingsCB} callback Callback for socket response
         * @param {string} currentPassword Only need for disableAuth to true
         * @returns {void}
         */
        saveSettings(callback, currentPassword) {
            let valid = this.validateSettings();
            if (valid.success) {
                this.$root.getSocket().emit("setSettings", this.settings, currentPassword, (res) => {
                    this.$root.toastRes(res);
                    this.loadSettings();

                    if (callback) {
                        callback();
                    }
                });
            } else {
                this.$root.toastError(valid.msg);
            }
        },

        /**
         * Ensure settings are valid
         * @returns {object} Contains success state and error msg
         */
        validateSettings() {
            if (this.settings.keepDataPeriodDays < 0) {
                return {
                    success: false,
                    msg: this.$t("dataRetentionTimeError"),
                };
            }
            return {
                success: true,
                msg: "",
            };
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.shadow-box-settings {
    padding: 30px;
    min-height: calc(100vh - 155px);
    border-radius: 24px !important;
}

.settings-menu {
    border-right: 1px solid rgba(0, 0, 0, 0.05);
    padding-right: 20px;

    .dark & {
        border-right-color: rgba(255, 255, 255, 0.05);
    }

    a {
        text-decoration: none !important;
        color: inherit;
    }

    .menu-item {
        border-radius: 12px;
        margin: 4px 0;
        padding: 12px 16px;
        cursor: pointer;
        transition: all $transition-time $easing-smooth;
        font-weight: 500;
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 12px;
        border: 1px solid transparent;
    }

    .menu-item:hover {
        background: rgba(0, 0, 0, 0.03);
        transform: translateX(4px);

        .dark & {
            background: rgba(255, 255, 255, 0.03);
        }
    }

    .router-link-active .menu-item {
        background: rgba(96, 165, 250, 0.08);
        color: $primary;
        font-weight: 700;
        border-color: rgba(96, 165, 250, 0.2);
        box-shadow: 0 4px 15px rgba(96, 165, 250, 0.1);

        .dark & {
            background: rgba(96, 165, 250, 0.1);
        }
    }
}

.settings-content {
    padding-left: 30px;

    .settings-content-header {
        font-family: Inter, sans-serif;
        font-weight: 800;
        font-size: 28px;
        letter-spacing: -0.02em;
        margin-bottom: 30px;
        padding-bottom: 15px;
        border-bottom: 1px solid rgba(0, 0, 0, 0.05);

        .dark & {
            border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        .mobile & {
            padding: 15px 0;
            border-bottom: none;
        }
    }
}

.logout {
    color: $danger !important;
}
</style>
