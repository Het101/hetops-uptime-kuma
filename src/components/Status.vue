<template>
    <span class="badge rounded-pill status-badge" :class="'bg-' + color">
        <span class="status-dot" :class="'dot-' + color"></span>
        {{ text }}
    </span>
</template>

<script>
export default {
    props: {
        /** Current status of monitor */
        status: {
            type: Number,
            default: 0,
        },
    },

    computed: {
        color() {
            if (this.status === 0) {
                return "danger";
            }

            if (this.status === 1) {
                return "primary";
            }

            if (this.status === 2) {
                return "warning";
            }

            if (this.status === 3) {
                return "maintenance";
            }

            return "secondary";
        },

        text() {
            if (this.status === 0) {
                return this.$t("Down");
            }

            if (this.status === 1) {
                return this.$t("Up");
            }

            if (this.status === 2) {
                return this.$t("Pending");
            }

            if (this.status === 3) {
                return this.$t("statusMaintenance");
            }

            return this.$t("Unknown");
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.status-badge {
    min-width: 85px;
    padding: 6px 12px;
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all $transition-time $easing-smooth;
    border: 1px solid rgba(0, 0, 0, 0.05);

    .dark & {
        border-color: rgba(255, 255, 255, 0.05);
    }

    &.bg-primary {
        background-color: rgba(0, 255, 65, 0.1) !important;
        color: #00ff41 !important;
        border-color: rgba(0, 255, 65, 0.2);
    }

    &.bg-danger {
        background-color: rgba(255, 64, 54, 0.1) !important;
        color: #ff4036 !important;
        border-color: rgba(255, 64, 54, 0.2);
    }

    &.bg-warning {
        background-color: rgba(255, 189, 46, 0.1) !important;
        color: #ffbd2e !important;
        border-color: rgba(255, 189, 46, 0.2);
    }

    &.bg-maintenance {
        background-color: rgba(52, 152, 219, 0.1) !important;
        color: #3498db !important;
        border-color: rgba(52, 152, 219, 0.2);
    }
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    position: relative;

    &::after {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: inherit;
        opacity: 0.4;
    }

    &.dot-primary {
        background: #00ff41;
        &::after { animation: status-pulse-green 2s infinite; }
    }

    &.dot-danger {
        background: #ff4036;
        &::after { animation: status-pulse-red 1s infinite linear; }
    }

    &.dot-warning {
        background: #ffbd2e;
        &::after { animation: status-pulse-yellow 2s infinite; }
    }

    &.dot-maintenance {
        background: #3498db;
        &::after { animation: status-pulse-blue 3s infinite ease-in-out; }
    }
}

@keyframes status-pulse-green {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }

    70% {
        transform: scale(3);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}

@keyframes status-pulse-red {
    0% {
        transform: scale(1);
        opacity: 1;
        box-shadow: 0 0 0 0 rgba(255, 64, 54, 0.7);
    }

    70% {
        transform: scale(1.5);
        opacity: 0;
        box-shadow: 0 0 0 10px rgba(255, 64, 54, 0);
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}

@keyframes status-pulse-yellow {
    0% {
        transform: scale(1);
        opacity: 0.8;
    }

    50% {
        transform: scale(2);
        opacity: 0.4;
    }

    100% {
        transform: scale(1);
        opacity: 0.8;
    }
}

@keyframes status-pulse-blue {
    0% {
        transform: scale(1);
        opacity: 0.5;
    }

    50% {
        transform: scale(2.5);
        opacity: 0;
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}
</style>
