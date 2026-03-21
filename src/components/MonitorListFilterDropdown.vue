<template>
    <div tabindex="-1" class="dropdown" @focusin="openMenu" @focusout="handleFocusOut">
        <button type="button" class="filter-dropdown-status" :class="{ active: filterActive }" tabindex="0">
            <div class="px-1 d-flex align-items-center">
                <slot name="status"></slot>
            </div>
            <span class="px-1">
                <font-awesome-icon icon="angle-down" />
            </span>
        </button>
        <ul class="filter-dropdown-menu" :class="{ open: open }">
            <slot name="dropdown"></slot>
        </ul>
    </div>
</template>

<script>
export default {
    components: {},
    props: {
        filterActive: {
            type: Boolean,
            required: true,
        },
    },
    emits: ["openMenu"],
    data() {
        return {
            open: false,
        };
    },
    methods: {
        openMenu() {
            this.$emit("openMenu");
            this.open = true;
        },

        handleFocusOut(e) {
            if (e.relatedTarget != null && this.$el.contains(e.relatedTarget)) {
                return;
            }
            this.open = false;
        },
    },
};
</script>

<style lang="scss" scoped>
@import "../assets/vars.scss";

.filter-dropdown-menu {
    z-index: 1100;
    transition: opacity 0.2s $easing-smooth, transform 0.2s $easing-smooth;
    padding: 8px 0 !important;
    border-radius: 16px;
    overflow: hidden;

    position: absolute;
    top: 100%;
    right: 0; 
    left: auto;
    margin-top: 10px;
    min-width: 220px;
    box-shadow: $premium-shadow-light;
    display: none; // Completely remove from layout when closed
    list-style: none;
    opacity: 0;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.08);
    transform: translateY(10px);

    &.open {
        display: block; // Add to layout
        opacity: 1;
        transform: translateY(0);
    }

    .dark & {
        background: #111111;
        border-color: rgba(255, 255, 255, 0.1);
        box-shadow: $premium-shadow-dark;
    }
}

.filter-dropdown-status {
    display: flex;
    align-items: center;
    padding: 8px 14px;
    border-radius: 20px;
    background: rgba(0, 0, 0, 0.03);
    border: 1px solid rgba(0, 0, 0, 0.05);
    color: inherit;
    font-size: 13px;
    font-weight: 600;
    transition: all $transition-time $easing-smooth;
    cursor: pointer;
    white-space: nowrap;

    .dark & {
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.08);
        color: $dark-font-color;
    }

    &:hover {
        background: rgba(0, 0, 0, 0.05);
        border-color: rgba(0, 255, 65, 0.2);
        
        .dark & {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(0, 255, 65, 0.3);
        }
    }

    &.active {
        background: rgba(0, 255, 65, 0.08);
        border-color: $primary;
        color: $primary;
        box-shadow: 0 0 15px rgba(0, 255, 65, 0.1);

        .dark & {
            background: rgba(0, 255, 65, 0.1);
        }
    }

    &:active {
        transform: scale(0.96);
    }
}

.filter-active {
    color: $primary;
}
</style>
