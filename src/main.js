import "bootstrap";
import { createApp, h } from "vue";
import contenteditable from "vue-contenteditable";
import Toast from "vue-toastification";
import "vue-toastification/dist/index.css";
import App from "./App.vue";
import "./assets/app.scss";
import "./assets/vue-datepicker.scss";
// HetOps Status theme: the whole visual layer, kept in one file so upstream merges stay clean.
import "./hetops/theme.scss";
import "./hetops/components.scss";
import HetopsStatusHero from "./hetops/components/HetopsStatusHero.vue";
import HetopsServiceBoard from "./hetops/components/HetopsServiceBoard.vue";
import HetopsOverview from "./hetops/components/HetopsOverview.vue";
import HetopsLivePill from "./hetops/components/HetopsLivePill.vue";
import HetopsMonitorInsight from "./hetops/components/HetopsMonitorInsight.vue";
import { i18n } from "./i18n";
import { FontAwesomeIcon } from "./icon.js";
import datetime from "./mixins/datetime";
import mobile from "./mixins/mobile";
import publicMixin from "./mixins/public";
import socket from "./mixins/socket";
import theme from "./mixins/theme";
import lang from "./mixins/lang";
import { router } from "./router";
import { appName } from "./util.ts";
import dayjs from "dayjs";
import timezone from "./modules/dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import relativeTime from "dayjs/plugin/relativeTime";
import { loadToastSettings } from "./util-frontend";
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);

const app = createApp({
    mixins: [socket, theme, mobile, datetime, publicMixin, lang],
    data() {
        return {
            appName: appName,
        };
    },
    render: () => h(App),
});

// HetOps Status components, mounted from a few one-line hooks in upstream pages (see HETOPS.md).
app.component("HetopsStatusHero", HetopsStatusHero);
app.component("HetopsServiceBoard", HetopsServiceBoard);
app.component("HetopsOverview", HetopsOverview);
app.component("HetopsLivePill", HetopsLivePill);
app.component("HetopsMonitorInsight", HetopsMonitorInsight);
app.use(router);
app.use(i18n);

app.use(Toast, loadToastSettings());
app.component("Editable", contenteditable);
app.component("FontAwesomeIcon", FontAwesomeIcon);

app.mount("#app");

// Service Worker
// Mainly for Webpush notification
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/serviceWorker.js", { scope: "/" }).catch((error) => {
        console.error("Service worker registration failed:", error);
    });
}

// Expose the vue instance for development
if (process.env.NODE_ENV === "development") {
    console.log("Dev Only: window.app is the vue instance");
    window.app = app._instance;
}
