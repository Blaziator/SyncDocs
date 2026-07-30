import { io } from "socket.io-client";
import * as Y from "yjs";
import { Awareness, encodeAwarenessUpdate } from "y-protocols/awareness.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import { average, median, percentile, maximum, minimum, memoryUsage } from "../lib/metrics.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SERVER_URL = process.env.LOADTEST_SERVER_URL || "http://localhost:8080";
const API_URL = `${SERVER_URL}/api`;
const STAGE = process.argv[2] || "baseline";

const TEST_EMAIL = `loadtest_scale_${Date.now()}@example.com`;
const TEST_PASSWORD = "loadtest12345";

const PHASES = [
    { name: "Warm up",     durationSec: 20, arrivalRate: 5  },
    { name: "Normal load", durationSec: 30, arrivalRate: 10 },
    { name: "Heavy load",  durationSec: 30, arrivalRate: 20 },
    { name: "Stress test", durationSec: 30, arrivalRate: 30 },
];
const DOCUMENT_POOL_SIZE = 20;

let sessionCookie = "";

async function apiCall(pathSegment, options = {}) {
    const res = await fetch(`${API_URL}${pathSegment}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(sessionCookie ? { Cookie: sessionCookie } : {}),
            ...options.headers,
        },
    });

    const setCookie = res.headers.get("set-cookie");
    if (setCookie) sessionCookie = setCookie.split(";")[0];

    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
}

async function setupTestDocumentPool() {

    console.log("→ Registering test user...");
    await apiCall("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name: "Scale Test", email: TEST_EMAIL, password: TEST_PASSWORD }),
    });

    console.log(`→ Creating ${DOCUMENT_POOL_SIZE} test documents...`);
    const docIds = [];

    for (let i = 0; i < DOCUMENT_POOL_SIZE; i++) {
        const createRes = await apiCall("/documents/create", {
            method: "POST",
            body: JSON.stringify({ title: `Scale Test Doc ${i} (${STAGE})` }),
        });
        const docId = createRes.data.doc._id;

        await apiCall(`/documents/${docId}/share`, { method: "POST" });
        await apiCall(`/documents/${docId}/share-permission`, {
            method: "PATCH",
            body: JSON.stringify({ permission: "edit" }),
        });

        docIds.push(docId);
    }

    console.log(`✔ ${docIds.length} test documents ready\n`);
    return docIds;
}

function createState() {
    return {
        joinLatencies: [],
        joinSuccess: 0,
        joinFailures: 0,
        disconnectsUnexpected: 0,
        totalUpdatesSent: 0,
        totalAwarenessSent: 0,
        peakConcurrentConnections: 0,
        currentConnections: 0,
        perPhase: {}, 
    };
}

function runClientSession(docId, clientLabel, state, phaseName) {
    return new Promise((resolve) => {
        const ydoc = new Y.Doc();
        const ytext = ydoc.getText("bench");
        const awareness = new Awareness(ydoc);

        const socket = io(SERVER_URL, { withCredentials: true });
        const connectStart = Date.now();

        const expectedReasons = [
            "io client disconnect",
            "transport close",
            "ping timeout"
        ];

        let disconnectCounted = false;
        let finished = false;

        const joinTimeout = setTimeout(() => {
            if (finished) return;

            finished = true;

            state.joinFailures++;
            state.perPhase[phaseName].failed++;
            state.currentConnections = Math.max( 0, state.currentConnections - 1);
            socket.disconnect();

            resolve();
        }, 20000);

        socket.on("connect", () => {
            socket.emit("join-document", docId, clientLabel);
        });

        socket.on("connect_error", (err) => {
            if (finished) return;

            finished = true;
            clearTimeout(joinTimeout);

            state.joinFailures++;
            state.perPhase[phaseName].failed++;
            state.currentConnections = Math.max( 0, state.currentConnections - 1);

            resolve();
        });

        socket.on("yjs-sync", async (fullState) => {
            if (finished) return;

            finished = true;
            clearTimeout(joinTimeout);

            const joinLatency = Date.now() - connectStart;
            state.joinLatencies.push(joinLatency);
            state.joinSuccess++;
            state.currentConnections++;
            state.peakConcurrentConnections = Math.max(
                state.peakConcurrentConnections, state.currentConnections
            );
            state.perPhase[phaseName].joined++;

            Y.applyUpdate(ydoc, new Uint8Array(fullState), "remote");

            for (let i = 0; i < 5; i++) {
                awareness.setLocalStateField("user", {
                    name: clientLabel,
                    cursor: ytext.length,
                });
                const update = encodeAwarenessUpdate(awareness, [awareness.clientID]);
                socket.emit("awareness-update", docId, Array.from(update));
                state.totalAwarenessSent++;
                await sleep(randomBetween(1000, 3000));
            }

            for (let i = 0; i < 8; i++) {
                const before = Y.encodeStateVector(ydoc);
                const randomText = Math.random().toString(36).substring(2, 12);
                ytext.insert(ytext.length, `[${i}] ${clientLabel}: ${randomText}\n`);
                const update = Y.encodeStateAsUpdate(ydoc, before);

                socket.emit("yjs-update", docId, Array.from(update));
                state.totalUpdatesSent++;
                await sleep(randomBetween(1000, 4000));
            }

            await sleep(30000);

            awareness.setLocalState(null);
            state.currentConnections = Math.max( 0, state.currentConnections - 1);
            socket.disconnect();
            resolve();
        });

        socket.on("disconnect", (reason) => {

            if (disconnectCounted) return;
            disconnectCounted = true;

            if (!expectedReasons.includes(reason)) {
                state.disconnectsUnexpected++;
            }
        });
    });
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function runPhases(docIds, state) {
    const allSessionPromises = [];
    let clientCounter = 0;

    for (const phase of PHASES) {
        state.perPhase[phase.name] = { joined: 0, failed: 0 };

        console.log(`\n→ Phase: ${phase.name} (${phase.arrivalRate}/sec for ${phase.durationSec}s)`);

        const intervalMs = 1000 / phase.arrivalRate;
        const totalTicks = phase.durationSec * phase.arrivalRate;

        for (let tick = 0; tick < totalTicks; tick++) {
            const label = `scale-client-${clientCounter}`;
            const docId = docIds[clientCounter % docIds.length];
            clientCounter++;

            allSessionPromises.push(runClientSession(docId, label, state, phase.name));
            await sleep(intervalMs);
        }
    }

    console.log("\n→ All phases dispatched. Waiting for remaining sessions to finish...");
    await Promise.all(allSessionPromises);
}

//Report Writing:

function getTimestamp() {
    return new Date().toISOString().replace("T", "-").replace(/\..+/, "").replace(/:/g, "");
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeReport(state, memoryBefore, memoryAfter, durationMs) {
    const resultsDir = path.join(__dirname,"..", "results", STAGE, "connection-scale");
    ensureDir(resultsDir);

    const timestamp = getTimestamp();
    const txtPath = path.join(resultsDir, `report-${timestamp}.txt`);

    const totalAttempts = state.joinSuccess + state.joinFailures;
    const successRate = totalAttempts > 0 ? (state.joinSuccess / totalAttempts) * 100 : 0;

    const joinLatency = {
        avg: average(state.joinLatencies),
        p50: median(state.joinLatencies),
        p95: percentile(state.joinLatencies, 95),
        max: maximum(state.joinLatencies),
        min: minimum(state.joinLatencies),
    };

    const perPhaseLines = Object.entries(state.perPhase)
        .map(([name, data]) => `  ${name.padEnd(15)}: joined=${data.joined}, failed=${data.failed}`)
        .join("\n");

    const content = `Connection Scale Benchmark — ${STAGE}
    Generated: ${new Date().toLocaleString()}

    Document Pool Size: ${DOCUMENT_POOL_SIZE}
    peak_concurrent_connections....: ${state.peakConcurrentConnections}
    total_join_attempts............: ${totalAttempts}
    join_success....................: ${state.joinSuccess}
    join_failures....................: ${state.joinFailures}
    success_rate.....................: ${successRate.toFixed(2)}%
    unexpected_disconnects...........: ${state.disconnectsUnexpected}

    join_latency_avg.................: ${joinLatency.avg.toFixed(2)}ms
    join_latency_p50.................: ${joinLatency.p50.toFixed(2)}ms
    join_latency_p95.................: ${joinLatency.p95.toFixed(2)}ms
    join_latency_max.................: ${joinLatency.max.toFixed(2)}ms

    total_yjs_updates_sent...........: ${state.totalUpdatesSent}
    total_awareness_updates_sent.....: ${state.totalAwarenessSent}

    memory_before_rss.................: ${(memoryBefore.rss / 1024 / 1024).toFixed(2)} MB
    memory_after_rss...................: ${(memoryAfter.rss / 1024 / 1024).toFixed(2)} MB

    total_duration....................: ${(durationMs / 1000).toFixed(2)}s

    Per-Phase Breakdown:
    ${perPhaseLines}
    `;

    fs.writeFileSync(txtPath, content, "utf8");
    return { txtPath, successRate, joinLatency };
}

//Main

async function main() {
    console.log("============================================");
    console.log(" SyncDocs Connection Scale Benchmark");
    console.log("============================================");
    console.log(`Stage: ${STAGE}`);
    console.log(`Document Pool: ${DOCUMENT_POOL_SIZE} documents`);
    console.log(`Phases: ${PHASES.map((p) => `${p.arrivalRate}/s×${p.durationSec}s`).join(" → ")}`);
    console.log("============================================\n");

    const state = createState();
    const memoryBefore = memoryUsage();
    const startTime = Date.now();

    const docIds = await setupTestDocumentPool();

    await runPhases(docIds, state);

    const durationMs = Date.now() - startTime;
    const memoryAfter = memoryUsage();

    const { txtPath, successRate, joinLatency } = writeReport(state, memoryBefore, memoryAfter, durationMs);

    console.log("\n============================================");
    console.log(" Results");
    console.log("============================================");
    console.log(`Peak Concurrent Connections: ${state.peakConcurrentConnections}`);
    console.log(`Join Attempts:               ${state.joinSuccess + state.joinFailures}`);
    console.log(`Success Rate:                ${successRate.toFixed(2)}%`);
    console.log(`Join Latency (avg/p95):      ${joinLatency.avg.toFixed(2)}ms / ${joinLatency.p95.toFixed(2)}ms`);
    console.log(`Unexpected Disconnects:      ${state.disconnectsUnexpected}`);
    console.log(`Report: ${txtPath}`);
    console.log("============================================\n");

    process.exit(0);
}

main().catch((err) => {
    console.error("Benchmark failed:", err);
    process.exit(1);
});