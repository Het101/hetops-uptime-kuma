<template>
    <div class="infrastructure-map-wrapper shadow-box mb-4">
        <div class="map-header">
            <h3>{{ $t("System Infrastructure") }}</h3>
            <div class="map-legend">
                <span class="legend-item"><span class="dot up"></span> {{ $t("Up") }}</span>
                <span class="legend-item"><span class="dot down"></span> {{ $t("Down") }}</span>
                <span class="legend-item"><span class="dot maintenance"></span> {{ $t("Maintenance") }}</span>
            </div>
        </div>
        
        <div class="map-container">
            <div class="isometric-grid">
                <div
                    v-for="monitor in monitors"
                    :key="monitor.id"
                    class="node-wrapper"
                    @click="$router.push(`/dashboard/${monitor.id}`)"
                >
                    <div class="node-3d" :class="statusClass(monitor.id)">
                        <div class="face top"></div>
                        <div class="face front"></div>
                        <div class="face side"></div>
                        
                        <!-- Tooltip -->
                        <div class="node-tooltip">
                            <div class="tooltip-name">{{ monitor.name }}</div>
                            <div class="tooltip-status">{{ statusText(monitor.id) }}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    computed: {
        monitors() {
            return Object.values(this.$root.monitorList).filter(m => m.active);
        }
    },
    methods: {
        statusClass(monitorID) {
            const status = this.$root.lastHeartbeatList[monitorID]?.status;
            if (status === 1) {
                return "status-up";
            }
            if (status === 0) {
                return "status-down";
            }
            if (status === 3) {
                return "status-maintenance";
            }
            return "status-unknown";
        },
        statusText(monitorID) {
            const status = this.$root.lastHeartbeatList[monitorID]?.status;
            if (status === 1) {
                return this.$t("Up");
            }
            if (status === 0) {
                return this.$t("Down");
            }
            if (status === 3) {
                return this.$t("Maintenance");
            }
            return this.$t("Unknown");
        }
    }
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.infrastructure-map-wrapper {
    padding: 30px !important;
    overflow: hidden;
}

.map-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    
    h3 {
        font-size: 18px;
        font-weight: 700;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
}

.map-legend {
    display: flex;
    gap: 20px;
    font-size: 12px;
    font-weight: 600;
    
    .legend-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #6b7280;
    }
    
    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        
        &.up {
            background: $primary;
            box-shadow: 0 0 10px $primary;
        }

        &.down {
            background: $danger;
            box-shadow: 0 0 10px $danger;
        }

        &.maintenance {
            background: $maintenance;
            box-shadow: 0 0 10px $maintenance;
        }
    }
}

.map-container {
    perspective: 1000px;
    padding: 50px 0;
    display: flex;
    justify-content: center;
    min-height: 300px;
}

.isometric-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    gap: 40px;
    width: 100%;
    max-width: 900px;
    transform: rotateX(55deg) rotateZ(-45deg);
    transform-style: preserve-3d;
}

.node-wrapper {
    width: 40px;
    height: 40px;
    position: relative;
    transform-style: preserve-3d;
    cursor: pointer;
}

.node-3d {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
    transition: all 0.4s $easing-smooth;
    animation: node-entry 0.8s ease-out backwards;

    @for $i from 1 through 50 {
        &:nth-child(#{$i}) { animation-delay: $i * 0.05s; }
    }

    &:hover {
        transform: translateZ(20px);
        
        .node-tooltip {
            opacity: 1;
            transform: rotateZ(45deg) rotateX(-55deg) translateY(-60px) scale(1);
        }
    }
}

.face {
    position: absolute;
    width: 40px;
    height: 40px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.top {
    transform: translateZ(20px);
    background: rgba(255, 255, 255, 0.1);
}

.front {
    transform: rotateX(-90deg) translateY(10px) translateZ(20px);
    height: 20px;
}

.side {
    transform: rotateY(90deg) translateX(10px) translateZ(20px);
    width: 20px;
}

// Status Colors
.status-up {
    .top {
        background: rgba($primary, 0.6);
        box-shadow: 0 0 20px rgba($primary, 0.4);
    }

    .front {
        background: darken($primary, 20%);
        opacity: 0.8;
    }

    .side {
        background: darken($primary, 30%);
        opacity: 0.8;
    }
}

.status-down {
    .top {
        background: rgba($danger, 0.6);
        box-shadow: 0 0 20px rgba($danger, 0.4);
        animation: node-pulse-red 1s infinite;
    }

    .front {
        background: darken($danger, 20%);
        opacity: 0.8;
    }

    .side {
        background: darken($danger, 30%);
        opacity: 0.8;
    }
}

.status-maintenance {
    .top {
        background: rgba($maintenance, 0.6);
    }

    .front {
        background: darken($maintenance, 20%);
        opacity: 0.8;
    }

    .side {
        background: darken($maintenance, 30%);
        opacity: 0.8;
    }
}

.status-unknown {
    .top {
        background: rgba(107, 114, 128, 0.6);
    }

    .front {
        background: darken(#6b7280, 20%);
        opacity: 0.8;
    }

    .side {
        background: darken(#6b7280, 30%);
        opacity: 0.8;
    }
}

.node-tooltip {
    position: absolute;
    top: 0;
    left: 50%;
    transform: rotateZ(45deg) rotateX(-55deg) translateY(-40px) scale(0.8);
    background: $glass-bg-dark;
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid $glass-border-dark;
    color: #fff;
    font-size: 11px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: all 0.3s $easing-smooth;
    z-index: 100;
    box-shadow: $premium-shadow-dark;
    text-align: center;

    .tooltip-name {
        font-weight: 700;
        margin-bottom: 2px;
    }

    .tooltip-status {
        opacity: 0.7;
        font-family: 'JetBrains Mono', monospace;
    }
}

@keyframes node-entry {
    from {
        opacity: 0;
        transform: translateZ(-100px) scale(0);
    }

    to {
        opacity: 1;
        transform: translateZ(0) scale(1);
    }
}

@keyframes node-pulse-red {
    0%,
    100% {
        transform: translateZ(0);
    }

    50% {
        transform: translateZ(5px);
        background: rgba($danger, 0.8);
    }
}

@media (max-width: 768px) {
    .isometric-grid {
        gap: 25px;
        grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    }
    .node-wrapper, .face {
        width: 30px;
        height: 30px;
    }
}
</style>
