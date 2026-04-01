<template>
    <div :class="classes">
        <div v-if="!$root.socket.connected && !$root.socket.firstConnect" class="lost-connection">
            <div class="container-fluid">
                {{ $root.connectionErrorMsg }}
                <div v-if="$root.showReverseProxyGuide">
                    {{ $t("Using a Reverse Proxy?") }}
                    <a href="https://github.com/louislam/uptime-kuma/wiki/Reverse-Proxy" target="_blank">
                        {{ $t("Check how to config it for WebSocket") }}
                    </a>
                </div>
            </div>
        </div>

        <!-- Desktop Sidebar (HetOps Tools Style) -->
        <aside v-if="!$root.isMobile" class="hetops-sidebar d-flex flex-column p-4">
            <!-- Sidebar Logo (Unified SVG standard) -->
            <router-link to="/dashboard" class="sidebar-logo d-flex flex-column mb-5 text-decoration-none" style="padding: 10px 0;">
                <div style="display: flex; align-items: center; justify-content: flex-start;">
                    <img src="/icon.svg" style="width: 140px; height: auto; display: block;" alt="HetOps Logo" />
                    <span style="color: #6b7280; font-size: 12px; line-height: 16px; margin-left: 8px; font-family: 'Fira Code', monospace; font-weight: bold; font-style: italic; margin-top: 4px;">STATUS</span>
                </div>
                <!-- App Subtitle matching Tools -->
                <div style="color: #9ca3af; font-size: 10px; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.1em; font-family: 'Fira Code', monospace; font-style: normal; font-weight: normal;">HANDY TOOLS FOR DEVOPS</div>
            </router-link>

            <!-- Sidebar Navigation -->
            <ul class="nav nav-pills flex-column mb-auto gap-3">
                <li v-if="$root.loggedIn" class="nav-item">
                    <router-link to="/dashboard" class="nav-link d-flex align-items-center gap-3">
                        <font-awesome-icon icon="tachometer-alt" class="sidebar-icon" />
                        {{ $t("Dashboard") }}
                    </router-link>
                </li>
                <li v-if="$root.loggedIn" class="nav-item">
                    <router-link to="/manage-status-page" class="nav-link d-flex align-items-center gap-3">
                        <font-awesome-icon icon="stream" class="sidebar-icon" />
                        {{ $t("Status Pages") }}
                    </router-link>
                </li>
                <li v-if="$root.loggedIn" class="nav-item">
                    <router-link to="/maintenance" class="nav-link d-flex align-items-center gap-3" :class="{ active: $route.path.includes('manage-maintenance') }">
                        <font-awesome-icon icon="wrench" class="sidebar-icon" />
                        {{ $t("Maintenance") }}
                    </router-link>
                </li>
                <li v-if="$root.loggedIn" class="nav-item">
                    <router-link to="/settings/general" class="nav-link d-flex align-items-center gap-3" :class="{ active: $route.path.includes('settings') }">
                        <font-awesome-icon icon="cog" class="sidebar-icon" />
                        {{ $t("Settings") }}
                    </router-link>
                </li>
            </ul>

            <!-- Sidebar Footer (Profile / Logout) -->
            <div v-if="$root.loggedIn" class="dropdown dropdown-profile-pic mt-5 pt-3 border-top border-secondary">
                <div class="nav-link d-flex align-items-center gap-3" data-bs-toggle="dropdown" style="cursor: pointer;">
                    <div class="profile-pic">{{ $root.usernameFirstChar }}</div>
                    <div class="d-flex flex-column text-start" style="min-width: 0;">
                        <strong v-if="$root.username != null" class="username-text" style="font-size: 14px; line-height: 1;">{{ $root.username }}</strong>
                        <span style="font-size: 11px; color: #a0a0a0; margin-top: 4px;">Admin</span>
                    </div>
                </div>

                <ul class="dropdown-menu shadow">
                    <li>
                        <a href="https://github.com/louislam/uptime-kuma/wiki" class="dropdown-item" target="_blank">
                            <font-awesome-icon icon="info-circle" /> {{ $t("Help") }}
                        </a>
                    </li>
                    <li v-if="$root.socket.token !== 'autoLogin'">
                        <button class="dropdown-item text-danger" @click="$root.logout">
                            <font-awesome-icon icon="sign-out-alt" /> {{ $t("Logout") }}
                        </button>
                    </li>
                </ul>
            </div>
            
            <a v-if="hasNewVersion" target="_blank" href="https://github.com/louislam/uptime-kuma/releases" class="btn btn-primary mt-3 w-100 btn-sm">
                <font-awesome-icon icon="arrow-alt-circle-up" /> {{ $t("New Update") }}
            </a>
        </aside>

        <!-- Mobile header (Unified SVG standard) -->
        <header v-else class="d-flex flex-wrap justify-content-center pt-3 pb-3 mb-3 border-bottom shadow-sm" style="background: rgba(10,10,10,0.8); backdrop-filter: blur(10px);">
            <router-link to="/dashboard" class="d-flex align-items-center text-dark text-decoration-none">
                <div style="display: flex; align-items: center; justify-content: center;">
                    <img src="/icon.svg" style="width: 140px; height: auto; display: block;" alt="HetOps Logo" />
                    <span style="color: #6b7280; font-size: 12px; line-height: 16px; margin-left: 8px; font-family: 'Fira Code', monospace; font-weight: bold; font-style: italic; margin-top: 4px;">STATUS</span>
                </div>
            </router-link>
        </header>

        <!-- Main Content Area -->
        <main class="hetops-main-content">
            <div class="container-fluid py-4" style="max-width: 1400px;">
                <router-view v-if="$root.loggedIn" />
                <Login v-if="!$root.loggedIn && $root.allowLoginDialog" />
            </div>
        </main>

        <!-- Mobile Only Bottom Nav -->
        <div v-if="$root.isMobile" style="width: 100%; height: calc(60px + env(safe-area-inset-bottom))" />
        <nav v-if="$root.isMobile && $root.loggedIn" class="bottom-nav">
            <router-link to="/dashboard" class="nav-link">
                <div><font-awesome-icon icon="tachometer-alt" /></div>
                {{ $t("Home") }}
            </router-link>

            <router-link to="/list" class="nav-link">
                <div><font-awesome-icon icon="list" /></div>
                {{ $t("List") }}
            </router-link>

            <router-link to="/add" class="nav-link">
                <div><font-awesome-icon icon="plus" /></div>
                {{ $t("Add") }}
            </router-link>

            <router-link to="/settings" class="nav-link">
                <div><font-awesome-icon icon="cog" /></div>
                {{ $t("Settings") }}
            </router-link>
        </nav>

        <button
            v-if="numActiveToasts != 0"
            type="button"
            class="btn btn-normal clear-all-toast-btn"
            @click="clearToasts"
        >
            <font-awesome-icon icon="times" />
        </button>

        <!-- HetOps Global Footer -->
        <footer v-if="!$root.isMobile" class="hetops-footer">
            <div class="footer-left">
                <span class="footer-badge normal-badge"><font-awesome-icon icon="terminal" /> NORMAL</span>
                <span class="footer-text hidden-sm">hetops/uptime-kuma</span>
                <span class="footer-text branch-text"><font-awesome-icon icon="code-branch" /> main</span>
                <span class="footer-text warning-text"><font-awesome-icon icon="exclamation-circle" /> 0</span>
            </div>
            <div class="footer-right">
                <span class="footer-text hidden-sm font-bold" id="kuma-footer-time">00:00:00</span>
                <span class="footer-text success-text"><font-awesome-icon icon="check-circle" /> ALL_SYSTEMS_OPTIMAL</span>
                <span class="footer-text hidden-lg">UTF-8</span>
                <span class="footer-text hidden-lg">Prettier</span>
            </div>
        </footer>
    </div>
</template>

<script>
import Login from "../components/Login.vue";
import compareVersions from "compare-versions";
import { useToast } from "vue-toastification";
const toast = useToast();

export default {
    components: {
        Login,
    },

    data() {
        return {
            toastContainer: null,
            numActiveToasts: 0,
            toastContainerObserver: null,
        };
    },

    computed: {
        // Theme or Mobile
        classes() {
            const classes = {};
            classes[this.$root.theme] = true;
            classes["mobile"] = this.$root.isMobile;
            return classes;
        },

        hasNewVersion() {
            if (this.$root.info.latestVersion && this.$root.info.version) {
                return compareVersions(this.$root.info.latestVersion, this.$root.info.version) >= 1;
            } else {
                return false;
            }
        },
    },

    watch: {},

    mounted() {
        this.toastContainer = document.querySelector(".bottom-right.toast-container");

        // Watch the number of active toasts
        this.toastContainerObserver = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === "childList") {
                    this.numActiveToasts = mutation.target.children.length;
                }
            }
        });

        if (this.toastContainer != null) {
            this.toastContainerObserver.observe(this.toastContainer, { childList: true });
        }

        // Clock logic for Footer
        setInterval(() => {
            const timeElement = document.getElementById("kuma-footer-time");
            if (timeElement) {
                timeElement.innerText = new Date().toLocaleTimeString();
            }
        }, 1000);
    },

    beforeUnmount() {
        this.toastContainerObserver.disconnect();
    },

    methods: {
        /**
         * Clear all toast notifications.
         * @returns {void}
         */
        clearToasts() {
            toast.clear();
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.nav-link {
    position: relative;
    &:hover {
        background-color: transparent;
        color: $primary;

        .dark & {
            background-color: transparent;
            color: $primary;
        }

        &.active {
            background-color: transparent;
        }
    }

    &.active {
        color: $primary !important;
        position: relative;
        background-color: transparent !important;
    }

    &.status-page {
        background-color: rgba(255, 255, 255, 0.1);
    }
}

.bottom-nav {
    z-index: 1000;
    position: fixed;
    bottom: 0;
    height: calc(60px + env(safe-area-inset-bottom));
    width: 100%;
    left: 0;
    background-color: #fff;
    box-shadow:
        0 15px 47px 0 rgba(0, 0, 0, 0.05),
        0 5px 14px 0 rgba(0, 0, 0, 0.05);
    text-align: center;
    white-space: nowrap;
    padding: 0 10px env(safe-area-inset-bottom);

    a {
        text-align: center;
        width: 25%;
        display: inline-block;
        height: 100%;
        padding: 8px 10px 0;
        font-size: 13px;
        color: #c1c1c1;
        overflow: hidden;
        text-decoration: none;

        &.router-link-exact-active,
        &.active {
            color: $primary;
            font-weight: bold;
        }

        div {
            font-size: 20px;
        }
    }
}

main {
    min-height: calc(100vh - 160px);
}

.title {
    font-weight: bold;
}

.nav {
    margin-right: 25px;
}

.lost-connection {
    padding: 5px;
    background-color: crimson;
    color: white;
    position: fixed;
    width: 100%;
    z-index: 99999;
}

// Profile Pic Button with Dropdown
.dropdown-profile-pic {
    user-select: none;

    .nav-link {
        cursor: pointer;
        display: flex;
        gap: 6px;
        align-items: center;
        background-color: rgba(200, 200, 200, 0.2);
        padding: 0.5rem 0.8rem;

        &:hover {
            background-color: rgba(255, 255, 255, 0.2);
        }
    }

    .dropdown-menu {
        transition: all 0.2s;
        padding: 0.5rem 0;
        margin-top: 8px !important;
        border-radius: 16px;
        overflow: hidden;
        background: transparent; // Rely on global theme or light mode default

        .dropdown-divider {
            margin: 0.5rem 0;
            border-top: 1px solid rgba(0, 0, 0, 0.05);
        }

        .dropdown-item {
            padding: 0.6rem 1.2rem;
        }
    }

    .profile-pic {
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        background-color: $primary;
        width: 24px;
        height: 24px;
        margin-right: 5px;
        border-radius: 50rem;
        font-weight: bold;
        font-size: 10px;
        flex-shrink: 0; // Prevent distortion from long flex siblings
    }

    .username-text {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 160px;
    }
}

// Common structural layout styles
.hetops-sidebar {
    width: 280px;
    height: calc(100vh - 30px);
    position: fixed;
    top: 0;
    left: 0;
    z-index: 1050;
    overflow-y: auto;
    background: rgba(252, 252, 252, 0.88);
    backdrop-filter: blur(24px);
    border-right: 1px solid rgba(0, 0, 0, 0.06);
    border-top: 3px solid $primary; // blue accent bar
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    .sidebar-logo {
        transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        &:hover { opacity: 0.8; }
    }

    .nav-pills {
        .nav-item {
            width: 100%;
            
            .nav-link {
                color: #555;
                padding: 12px 20px;
                border-radius: 12px;
                font-size: 14px;
                font-weight: 500;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                background: transparent;
                
                &:hover {
                    color: $primary;
                    background: rgba(0, 0, 0, 0.03);
                }
                
                &.active {
                    color: $primary !important;
                    background: rgba(96, 165, 250, 0.05) !important;
                    position: relative;

                    // Vertical side indicator
                    &::before {
                        content: '';
                        position: absolute;
                        left: -16px;
                        top: 50%;
                        transform: translateY(-50%);
                        height: 60%;
                        width: 3px;
                        background: $primary;
                        border-radius: 0 4px 4px 0;
                        box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
                    }

                    // Hide old bottom underline
                    &::after { display: none; }
                }
                
                .sidebar-icon {
                    width: 18px;
                    opacity: 0.8;
                }
            }
        }
    }
}

.hetops-main-content {
    margin-left: 280px; // Offset by precise tools sidebar width
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 26px; // Match HetOps Tools content padding
    padding-bottom: 80px; // Extra offset for footers
    background: linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 767.98px) {
        margin-left: 0;
        padding: 15px;
        padding-bottom: 100px;
        min-height: calc(100vh - 80px); // Account for mobile header
    }
}

.hetops-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 30px;
    background-color: rgba(248, 249, 250, 0.85);
    backdrop-filter: blur(20px);
    border-top: 1px solid #dee2e6;
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: #6b7280;
    box-shadow: 0 -2px 10px rgba(0,0,0,0.02);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    @media (max-width: 767.98px) {
        left: 0;
        width: 100%;
    }

    svg {
        width: 12px;
        height: 12px;
    }

    .footer-left, .footer-right {
        display: flex;
        align-items: center;
        gap: 16px;
    }

    .footer-badge {
        background-color: $primary;
        color: #fff;
        padding: 2px 8px;
        font-weight: bold;
        border-radius: 4px;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .footer-text {
        display: flex;
        align-items: center;
        gap: 6px;

        &.branch-text { color: #2563eb; }
        &.warning-text { color: #d97706; }
        &.success-text { color: #059669; }
    }

    @media (max-width: 768px) {
        .hidden-sm { display: none !important; }
    }
    @media (max-width: 1024px) {
        .hidden-lg { display: none !important; }
    }
}

.dark {
    background-color: #020202;

    // Dark overrides for Sidebar
    .hetops-sidebar {
        background: rgba(5, 5, 5, 0.88);
        border-right: 1px solid rgba(255, 255, 255, 0.08);
        border-top: 3px solid $primary; // keep accent in dark too

        .nav-pills .nav-item .nav-link {
            color: #8c8c8c;
            
            &:hover {
                color: #fff;
                background: rgba(255, 255, 255, 0.05);
            }

            &.active {
                color: #60a5fa !important;
                background: rgba(96, 165, 250, 0.05) !important;
                &::before {
                    box-shadow: 0 0 10px #60a5fa;
                }
            }
        }
    }
    
    // Dark overrides for Main Content
    .hetops-main-content {
        background: linear-gradient(135deg, #020202 0%, #0a0a0a 50%, #111 100%);
    }

    // Dark overrides for Footer
    .hetops-footer {
        background-color: rgba(10, 10, 10, 0.85);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
        color: #9ca3af;
        box-shadow: 0 -5px 20px rgba(0,0,0,0.5);

        .footer-text {
            &.branch-text { color: #60a5fa; }
            &.warning-text { color: #ffbd2e; }
            &.success-text { color: #10b981; }
        }
    }

    .bottom-nav {
        background-color: rgba(2, 2, 2, 0.85);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
}

.clear-all-toast-btn {
    position: fixed;
    right: 1em;
    bottom: 1em;
    font-size: 1.2em;
    padding: 9px 15px;
    width: 48px;
    box-shadow: 2px 2px 30px rgba(0, 0, 0, 0.2);
    z-index: 100;

    .dark & {
        box-shadow: 2px 2px 30px rgba(0, 0, 0, 0.5);
    }
}

@media (max-width: 770px) {
    .clear-all-toast-btn {
        bottom: 72px;
    }
}
</style>
