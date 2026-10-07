// Sets up HetOps monitoring on a running HetOps Status (Uptime Kuma) instance:
// creates the monitors below (reusing any that already watch the same URL) and fills the status page.
//
// Usage, from the repo root:
//   node extra/hetops-setup.mjs https://status.hetops.dev [--slug deck] [--dry-run]
//
// It asks for your username, password and (if enabled) 2FA code in this terminal. Nothing is stored.
import { io } from "socket.io-client";
import readline from "node:readline";

const args = process.argv.slice(2);
const base = (args.find((a) => a.startsWith("http")) || "https://status.hetops.dev").replace(/\/$/, "");
const slugArg = args.indexOf("--slug");
const slug = slugArg >= 0 ? args[slugArg + 1] : "deck";
const dryRun = args.includes("--dry-run");

const json = (path, op, expected) => ({
    type: "json-query",
    jsonPath: path,
    jsonPathOperator: op,
    expectedValue: expected,
});

// group: status page group, or null for monitors that stay on the dashboard only.
const MONITORS = [
    {
        group: "Products",
        name: "DNS Intelligence",
        url: "https://dns.hetops.dev/api/health",
        ...json("status", "==", "ok"),
    },
    { group: "Products", name: "Radar Cloud", url: "https://radar.hetops.dev/api/health", ...json("ok", "==", "true") },
    { group: "Products", name: "Dev Toolkit", url: "https://tools.hetops.dev" },
    { group: "Sites and infrastructure", name: "hetops.dev", url: "https://hetops.dev" },
    { group: "Sites and infrastructure", name: "Dashboard", url: "https://dash.hetops.dev" },
    {
        group: "Sites and infrastructure",
        name: "Analytics",
        url: "https://analytics.hetops.dev/api/heartbeat",
        ...json("ok", "==", "true"),
    },
    // Restore Drill restores the newest backups every 6 h; "ok" is false if any restore fails.
    {
        group: "Sites and infrastructure",
        name: "Backups (restore-tested)",
        url: "https://drill.hetops.dev/api/health",
        ...json("ok", "==", "true"),
    },
    { group: null, name: "Hub (Coolify)", url: "https://hub.hetops.dev" },
    { group: null, name: "n8n", url: "https://n8n.hetops.dev/healthz", ...json("status", "==", "ok") },
    { group: null, name: "Tallybank", url: "https://tally.hetops.dev" },
    // Backups: the nightly job reports into each app's health payload; check it hourly.
    {
        group: null,
        name: "DNS Intelligence backup",
        url: "https://dns.hetops.dev/api/health",
        interval: 3600,
        ...json("backup.ok and backup.offsite = 'uploaded'", "==", "true"),
    },
    {
        group: null,
        name: "Radar Cloud backup",
        url: "https://radar.hetops.dev/api/health",
        interval: 3600,
        ...json("backup.ok and backup.offsite = 'uploaded'", "==", "true"),
    },
];

// Same defaults the "Add New Monitor" form sends.
const DEFAULTS = {
    type: "http",
    parent: null,
    method: "GET",
    interval: 60,
    // Seconds. Without it the server derives one from the interval, which breaks hourly checks.
    timeout: 48,
    retryInterval: 60,
    resendInterval: 0,
    maxretries: 1,
    retryOnlyOnStatusCodeFailure: false,
    notificationIDList: {},
    ignoreTls: false,
    upsideDown: false,
    expiryNotification: true,
    domainExpiryNotification: true,
    maxredirects: 10,
    accepted_statuscodes: ["200-299"],
    saveResponse: false,
    saveErrorResponse: true,
    responseMaxLength: 1024,
    dns_resolve_type: "A",
    dns_resolve_server: "",
    proxyId: null,
    authMethod: null,
    httpBodyEncoding: "json",
    kafkaProducerBrokers: [],
    kafkaProducerSaslOptions: { mechanism: "None" },
    cacheBust: false,
    rabbitmqNodes: [],
    conditions: [],
    jsonPathOperator: "==",
};

// One readline for the whole run; while muted, typed characters are not echoed.
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
let muted = false;
rl._writeToOutput = (s) => {
    if (!muted) {
        rl.output.write(s);
    }
};
// Buffered, so answers piped in before a question is asked aren't lost.
const lines = rl[Symbol.asyncIterator]();
/**
 * Prompts in the terminal and returns the trimmed answer.
 * @param {string} question Prompt text
 * @param {boolean} hidden Do not echo what is typed (passwords)
 * @returns {Promise<string>} The answer
 */
async function ask(question, hidden = false) {
    process.stdout.write(question);
    muted = hidden;
    const { value = "" } = await lines.next();
    if (hidden) {
        muted = false;
        process.stdout.write("\n");
    }
    return value.trim();
}

const norm = (u) => (u || "").trim().replace(/\/+$/, "").toLowerCase();
// A backup monitor shares its app's health URL, so backups also match on the JSON query;
// any other existing check on the same URL is reused as is.
const isBackup = (jsonPath) => (jsonPath || "").includes("backup");
const sameCheck = (m, want) =>
    norm(m.url) === norm(want.url) && (isBackup(want.jsonPath) ? m.jsonPath === want.jsonPath : !isBackup(m.jsonPath));

const socket = io(base, { transports: ["websocket"], reconnection: false });
const emit = (event, ...a) => new Promise((resolve) => socket.emit(event, ...a, resolve));
let monitorList = null;
socket.on("monitorList", (list) => (monitorList = list));

/**
 * Prints an error and exits.
 * @param {string} msg What went wrong
 * @returns {void}
 */
function fail(msg) {
    console.error(`\n✗ ${msg}`);
    rl.close();
    socket.close();
    process.exit(1);
}

await new Promise((resolve, reject) => {
    socket.once("connect", resolve);
    socket.once("connect_error", (e) => reject(new Error(`Cannot reach ${base}: ${e.message}`)));
}).catch((e) => fail(e.message));

console.log(`Connected to ${base}${dryRun ? " (dry run, nothing will change)" : ""}`);
const username = await ask("Username: ");
const password = await ask("Password: ", true);
let res = await emit("login", { username, password, token: "" });
if (res.tokenRequired) {
    const token = await ask("2FA code: ");
    res = await emit("login", { username, password, token });
}
if (!res.ok) {
    fail(`Login failed: ${res.msg || "check username, password or 2FA code"}`);
}

await emit("getMonitorList");
for (let i = 0; i < 50 && !monitorList; i++) {
    await new Promise((r) => setTimeout(r, 100));
}
const existing = Object.values(monitorList || {});
console.log(`Signed in. ${existing.length} monitors exist.\n`);

const ids = {};
for (const want of MONITORS) {
    const found = existing.find((m) => sameCheck(m, want));
    if (found) {
        ids[want.name] = found.id;
        console.log(`  = ${want.name.padEnd(26)} already monitored as "${found.name}" (#${found.id})`);
        continue;
    }
    if (dryRun) {
        console.log(`  + ${want.name.padEnd(26)} would add  ${want.url}`);
        continue;
    }
    const fields = { ...want };
    delete fields.group;
    const r = await emit("add", { ...DEFAULTS, ...fields });
    if (!r.ok) {
        fail(`Adding ${want.name} failed: ${r.msg}`);
    }
    ids[want.name] = r.monitorID;
    console.log(`  + ${want.name.padEnd(26)} added (#${r.monitorID})`);
}

const page = await emit("getStatusPage", slug);
if (!page.ok) {
    fail(`Status page "${slug}" not found. Create it first, or pass --slug <your-slug>.`);
}
const groups = [];
for (const m of MONITORS.filter((x) => x.group)) {
    let g = groups.find((x) => x.name === m.group);
    if (!g) {
        g = { name: m.group, monitorList: [] };
        groups.push(g);
    }
    if (ids[m.name]) {
        g.monitorList.push({ id: ids[m.name] });
    }
}
console.log(`\nStatus page /status/${slug}: ${groups.map((g) => `${g.name} (${g.monitorList.length})`).join(", ")}`);

if (!dryRun) {
    const config = {
        ...page.config,
        description: page.config.description || "Live status of every HetOps service.",
        showCertificateExpiry: true,
        showPoweredBy: false,
    };
    // Existing groups are replaced: the page shows exactly the groups above.
    const r = await emit("saveStatusPage", slug, config, page.config.icon || "", groups);
    if (!r.ok) {
        fail(`Saving the status page failed: ${r.msg}`);
    }
    console.log("Saved.");
}
console.log(`\nDone. Open ${base}/status/${slug}`);
rl.close();
socket.close();
process.exit(0);
