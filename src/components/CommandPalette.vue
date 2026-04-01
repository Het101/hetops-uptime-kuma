<template>
    <transition name="command-palette-fade">
        <div v-if="show" class="command-palette-overlay" @click.self="close">
            <div class="command-palette shadow-box">
                <div class="search-input-group">
                    <font-awesome-icon icon="search" class="search-icon" />
                    <input
                        ref="searchInput"
                        v-model="query"
                        type="text"
                        class="form-control palette-input"
                        :placeholder="$t('Search monitors, settings, or tools...')"
                        @keydown.down.prevent="moveSelection(1)"
                        @keydown.up.prevent="moveSelection(-1)"
                        @keydown.enter="executeAction"
                        @keydown.esc="close"
                    />
                    <div class="esc-badge">ESC</div>
                </div>

                <div class="palette-results scrollbar">
                    <div v-if="filteredResults.length === 0" class="no-results">
                        {{ $t("No results found.") }}
                    </div>
                    
                    <div
                        v-for="(result, index) in filteredResults"
                        :key="index"
                        class="result-item"
                        :class="{ active: selectedIndex === index }"
                        @mouseenter="selectedIndex = index"
                        @click="executeAction"
                    >
                        <div class="result-icon">
                            <font-awesome-icon :icon="result.icon" />
                        </div>
                        <div class="result-info">
                            <div class="result-title">{{ result.title }}</div>
                            <div class="result-description">{{ result.description }}</div>
                        </div>
                        <div class="result-shortcut">
                            <font-awesome-icon icon="chevron-right" />
                        </div>
                    </div>
                </div>

                <div class="palette-footer">
                    <div class="footer-tip">
                        <span class="key">↑↓</span> to navigate
                        <span class="key">ENTER</span> to select
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script>
export default {
    data() {
        return {
            show: false,
            query: "",
            selectedIndex: 0,
        };
    },
    computed: {
        allActions() {
            const monitors = Object.values(this.$root.monitorList).map(m => ({
                title: m.name,
                description: `Monitor #${m.id} • ${m.type}`,
                icon: "heartbeat",
                action: () => this.$router.push(`/dashboard/${m.id}`)
            }));

            const tools = [
                { title: "Dashboard", description: "Overview of all monitors", icon: "tachometer-alt", action: () => this.$router.push("/dashboard") },
                { title: "Settings", description: "General and appearance settings", icon: "cog", action: () => this.$router.push("/settings") },
                { title: "Status Pages", description: "Manage public status pages", icon: "stream", action: () => this.$router.push("/status-pages") },
                { title: "Add Monitor", description: "Create a new monitor", icon: "plus-circle", action: () => this.$router.push("/add") },
                { title: "Toggle Theme", description: "Switch between Light and Dark", icon: "adjust", action: () => this.$root.toggleTheme() },
            ];

            return [...tools, ...monitors];
        },
        filteredResults() {
            if (!this.query) {
                return this.allActions.slice(0, 10);
            }
            const q = this.query.toLowerCase();
            return this.allActions.filter(a => 
                a.title.toLowerCase().includes(q) || 
                a.description.toLowerCase().includes(q)
            ).slice(0, 10);
        }
    },
    watch: {
        query() {
            this.selectedIndex = 0;
        },
        show(val) {
            if (val) {
                setTimeout(() => {
                    if (this.$refs.searchInput) {
                        this.$refs.searchInput.focus();
                    }
                }, 100);
            }
        }
    },
    mounted() {
        window.addEventListener("keydown", this.handleKeydown);
    },
    beforeUnmount() {
        window.removeEventListener("keydown", this.handleKeydown);
    },
    methods: {
        handleKeydown(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                this.show = !this.show;
            }
        },
        close() {
            this.show = false;
            this.query = "";
        },
        moveSelection(dir) {
            const count = this.filteredResults.length;
            this.selectedIndex = (this.selectedIndex + dir + count) % count;
        },
        executeAction() {
            const result = this.filteredResults[this.selectedIndex];
            if (result) {
                result.action();
                this.close();
            }
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.command-palette-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    display: flex;
    justify-content: center;
    padding-top: 15vh;
}

.command-palette {
    width: 600px;
    max-width: 90vw;
    background: $glass-bg-light;
    border-radius: 20px !important;
    overflow: hidden;
    padding: 0 !important;
    display: flex;
    flex-direction: column;
    max-height: 60vh;
    box-shadow: $premium-shadow-light;

    .dark & {
        background: $glass-bg-dark;
        box-shadow: $premium-shadow-dark;
    }
}

.search-input-group {
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.05);

    .dark & {
        border-bottom-color: rgba(255, 255, 255, 0.05);
    }

    .search-icon {
        color: $primary;
        font-size: 20px;
    }

    .palette-input {
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        font-size: 18px;
        color: inherit;
        padding: 0;
        height: auto;
        
        &::placeholder {
            color: rgba(107, 114, 128, 0.5);
        }
    }

    .esc-badge {
        font-size: 10px;
        padding: 4px 8px;
        background: rgba(0, 0, 0, 0.05);
        border-radius: 6px;
        color: #6b7280;
        font-weight: bold;

        .dark & {
            background: rgba(255, 255, 255, 0.05);
        }
    }
}

.palette-results {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.result-item {
    padding: 12px 15px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 15px;
    cursor: pointer;
    transition: all 0.2s ease;

    &.active {
        background: rgba(96, 165, 250, 0.1);
        
        .result-title {
            color: $primary;
        }

        .result-icon {
            transform: scale(1.1);
            color: $primary;
        }
    }

    .result-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(0, 0, 0, 0.03);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #6b7280;
        transition: all 0.2s ease;

        .dark & {
            background: rgba(255, 255, 255, 0.03);
        }
    }

    .result-info {
        flex: 1;

        .result-title {
            font-weight: 600;
            font-size: 15px;
        }

        .result-description {
            font-size: 12px;
            color: #6b7280;
        }
    }

    .result-shortcut {
        opacity: 0;
        color: $primary;
        transition: opacity 0.2s;
    }

    &.active .result-shortcut {
        opacity: 1;
    }
}

.no-results {
    padding: 40px;
    text-align: center;
    color: #6b7280;
}

.palette-footer {
    padding: 12px 20px;
    background: rgba(0, 0, 0, 0.02);
    border-top: 1px solid rgba(0, 0, 0, 0.05);
    font-size: 11px;
    color: #6b7280;

    .dark & {
        background: rgba(255, 255, 255, 0.01);
        border-top-color: rgba(255, 255, 255, 0.05);
    }

    .footer-tip {
        display: flex;
        gap: 15px;
        
        .key {
            background: rgba(0, 0, 0, 0.05);
            padding: 2px 6px;
            border-radius: 4px;
            font-weight: bold;
            color: inherit;

            .dark & {
                background: rgba(255, 255, 255, 0.05);
            }
        }
    }
}

.command-palette-fade-enter-active,
.command-palette-fade-leave-active {
    transition: all 0.2s ease;
}

.command-palette-fade-enter-from,
.command-palette-fade-leave-to {
    opacity: 0;
    transform: scale(0.95) translateY(-20px);
}
</style>
