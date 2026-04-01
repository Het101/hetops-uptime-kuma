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
                return "up";
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

    &.bg-up {
        background-color: rgba(16, 185, 129, 0.1) !important;
        color: #10b981 !important;
        border-color: rgba(16, 185, 129, 0.25);
    }

    &.bg-danger {
        background-color: rgba(239, 68, 68, 0.1) !important;
        color: #ef4444 !important;
        border-color: rgba(239, 68, 68, 0.25);
    }

    &.bg-warning {
        background-color: rgba(245, 158, 11, 0.1) !important;
        color: #f59e0b !important;
        border-color: rgba(245, 158, 11, 0.25);
    }

    &.bg-maintenance {
        background-color: rgba(167, 139, 250, 0.1) !important;
        color: #a78bfa !important;
        border-color: rgba(167, 139, 250, 0.25);
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

    &.dot-up {
        background: #10b981;
        &::after { animation: pulse-up 2s infinite; }
    }

    &.dot-danger {
        background: #ef4444;
        &::after { animation: pulse-down 1s infinite linear; }
    }

    &.dot-warning {
        background: #f59e0b;
        &::after { animation: pulse-pending 2s infinite; }
    }

    &.dot-maintenance {
        background: #a78bfa;
        &::after { animation: pulse-maintenance 3s infinite ease-in-out; }
    }

    &.dot-secondary {
        background: #6b7280;
    }
}

@keyframes pulse-up {
    0%   { transform: scale(1); opacity: 0.8; }
    70%  { transform: scale(3); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
}

@keyframes pulse-down {
    0%   { transform: scale(1); opacity: 1; box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
    70%  { transform: scale(1.5); opacity: 0; box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
    100% { transform: scale(1); opacity: 0; }
}

@keyframes pulse-pending {
    0%   { transform: scale(1); opacity: 0.8; }
    50%  { transform: scale(2); opacity: 0.4; }
    100% { transform: scale(1); opacity: 0.8; }
}

@keyframes pulse-maintenance {
    0%   { transform: scale(1); opacity: 0.5; }
    50%  { transform: scale(2.5); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
}
</style>
