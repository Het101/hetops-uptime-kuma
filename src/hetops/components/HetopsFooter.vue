<template>
    <footer class="ho-footer">
        <!-- eslint-disable vue/no-v-html -- footerHtml is sanitised with DOMPurify by the status page -->
        <div v-if="footerHtml" class="ho-footer-note" v-html="footerHtml"></div>
        <!-- eslint-enable vue/no-v-html -->
        <div class="ho-footer-row">
            <a class="ho-footer-brand" href="https://hetops.dev" target="_blank" rel="noopener">
                <img src="/icon.svg" width="22" height="22" alt="" />
                <span>
                    HetOps
                    <b>Status</b>
                </span>
            </a>
            <nav class="ho-footer-links" aria-label="Status page links">
                <a :href="`/status/${slug}/rss`">RSS feed</a>
                <a href="https://hetops.dev" target="_blank" rel="noopener">hetops.dev</a>
            </nav>
            <p class="ho-footer-fresh">
                <span class="dot" aria-hidden="true"></span>
                Updated {{ updated }}
                <template v-if="refreshIn">· refresh in {{ refreshIn }}</template>
            </p>
        </div>
    </footer>
</template>

<script>
import dayjs from "dayjs";

// Public page footer: the brand, where to follow along, and how fresh this page is.
export default {
    props: {
        slug: { type: String, required: true },
        footerHtml: { type: String, default: "" },
        lastUpdate: { type: Object, default: null },
        refreshIn: { type: String, default: "" },
    },
    computed: {
        updated() {
            return this.lastUpdate ? dayjs(this.lastUpdate).format("HH:mm:ss") : "–";
        },
    },
};
</script>
