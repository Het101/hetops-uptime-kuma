// Shared helpers for the HetOps Status components: status names, sparkline paths, durations.
import dayjs from "dayjs";
import { UP, DOWN, PENDING, MAINTENANCE } from "../../util.ts";

export const STATE = {
    [UP]: { key: "up", label: "Operational", icon: "check-circle" },
    [DOWN]: { key: "down", label: "Down", icon: "times-circle" },
    [PENDING]: { key: "pending", label: "Degraded", icon: "exclamation-circle" },
    [MAINTENANCE]: { key: "maint", label: "Maintenance", icon: "wrench" },
};
export const UNKNOWN = { key: "unknown", label: "No data yet", icon: "question-circle" };

/**
 * The state of a monitor from its latest beat.
 * @param {object[]} beats Heartbeats, oldest first
 * @returns {{key: string, label: string, icon: string}} State
 */
export function stateOf(beats) {
    const last = beats && beats.length ? beats[beats.length - 1] : null;
    return last ? STATE[last.status] || UNKNOWN : UNKNOWN;
}

/**
 * How long the monitor has been in its current state, e.g. "12 min".
 * @param {object[]} beats Heartbeats, oldest first (time in UTC)
 * @returns {string|null} Duration, or null when unknown
 */
export function stateFor(beats) {
    if (!beats || !beats.length) {
        return null;
    }
    const now = beats[beats.length - 1].status;
    let since = beats[beats.length - 1].time;
    for (let i = beats.length - 1; i >= 0 && beats[i].status === now; i--) {
        since = beats[i].time;
    }
    const mins = Math.max(0, dayjs().diff(dayjs.utc(since), "minute"));
    if (mins < 1) {
        return "under a minute";
    }
    if (mins < 60) {
        return `${mins} min`;
    }
    const h = Math.floor(mins / 60);
    return h < 48 ? `${h} h ${mins % 60} min` : `${Math.floor(h / 24)} days`;
}

/**
 * SVG path data for a sparkline of response times.
 * @param {number[]} values Response times in ms (nulls are skipped)
 * @param {number} w Width
 * @param {number} h Height
 * @returns {{line: string, area: string}} Path data
 */
export function sparkline(values, w, h) {
    const pts = values.filter((v) => typeof v === "number" && v >= 0);
    if (pts.length < 2) {
        return { line: "", area: "" };
    }
    const max = Math.max(...pts);
    const min = Math.min(...pts);
    const span = max - min || 1;
    const step = w / (pts.length - 1);
    const xy = pts.map((v, i) => [i * step, h - 3 - ((v - min) / span) * (h - 6)]);
    const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
    return { line, area: `${line} L${w},${h} L0,${h} Z` };
}

/**
 * Uptime ratio (0..1) as a short percentage string.
 * @param {number|undefined} ratio Ratio
 * @returns {string} e.g. "99.97%"
 */
export function pct(ratio) {
    if (typeof ratio !== "number") {
        return "–";
    }
    const p = ratio * 100;
    return `${p >= 99.995 ? "100" : p.toFixed(p >= 99 ? 2 : 1)}%`;
}
