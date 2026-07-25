import { io } from "socket.io-client";
import * as Y from "yjs";

import {
  average,
  median,
  percentile,
  maximum,
  minimum,
  throughput,
  memoryUsage,
} from "../lib/metrics.js";
import { generateReport } from "../lib/reportGenerator.js";

const SERVER_URL = process.env.LOADTEST_SERVER_URL || "http://localhost:8080";
const API_URL = `${SERVER_URL}/api`;

const STAGE = process.argv[2] || "baseline";
const NUM_CLIENTS = Number(process.argv[3]) || 10;
const NUM_ROUNDS = Number(process.argv[4]) || 20;

const TEST_EMAIL = `loadtest_${Date.now()}@example.com`;
const TEST_PASSWORD = "loadtest12345";

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
  if (setCookie) {
    sessionCookie = setCookie.split(";")[0];
  }

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function setupTestDocument() {
  console.log("→ Registering test user...");
  await apiCall("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: "Load Test",
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  console.log("→ Creating test document...");
  const createRes = await apiCall("/documents/create", {
    method: "POST",
    body: JSON.stringify({ title: `Benchmark Doc (${STAGE})` }),
  });
  const docId = createRes.data.doc._id;

  console.log("→ Generating share link and enabling edit access...");
  await apiCall(`/documents/${docId}/share`, { method: "POST" });
  await apiCall(`/documents/${docId}/share-permission`, {
    method: "PATCH",
    body: JSON.stringify({ permission: "edit" }),
  });

  console.log(`✔ Test document ready: ${docId}\n`);
  return docId;
}

function createBenchmarkState() {
  return {
    joinLatencies: [],
    joinSuccess: 0,
    joinFailures: 0,
    propagationLatencies: [],
    updatesSent: 0,
    updatesReceived: 0,
    droppedUpdates: 0,
    startTime: null,
    endTime: null,
  };
}

function createClient(docId, clientLabel, state) {
  return new Promise((resolve) => {
    const ydoc = new Y.Doc();
    const ytext = ydoc.getText("bench-log");

    const socket = io(SERVER_URL, { withCredentials: true });
    const receivedLatencies = [];

    const connectStart = Date.now();

    const timeout = setTimeout(() => {
      state.joinFailures++;
      socket.disconnect();
      resolve(null);
    }, 10000);

    socket.on("connect", () => {
      socket.emit("join-document", docId, clientLabel);
    });

    socket.on("connect_error", () => {
      state.joinFailures++;
    });

    socket.on("yjs-sync", (fullState) => {
      const joinLatency = Date.now() - connectStart;
      state.joinLatencies.push(joinLatency);
      state.joinSuccess++;

      Y.applyUpdate(ydoc, new Uint8Array(fullState), "remote");
      clearTimeout(timeout);
      resolve({ ydoc, ytext, socket, receivedLatencies, clientLabel });
    });

    socket.on("yjs-update", (update) => {
      Y.applyUpdate(ydoc, new Uint8Array(update), "remote");
    });

    ydoc.on("update", (update, origin) => {
      if (origin === "remote") {
        const lines = ytext.toString().trim().split("\n");
        const lastLine = lines[lines.length - 1];
        const [senderLabel, sentAtStr] = lastLine.split(":");

        if (senderLabel !== clientLabel) {
          const sentAt = Number(sentAtStr);
          const latency = Date.now() - sentAt;
          if (!isNaN(latency) && latency >= 0) {
            receivedLatencies.push(latency);
            state.propagationLatencies.push(latency);
            state.updatesReceived++;
          }
        }
      } else {
        socket.emit("yjs-update", docId, update);
      }
    });
  });
}

async function runEditRounds(clients, docId, state) {
  for (let round = 0; round < NUM_ROUNDS; round++) {
    const sender = clients[round % clients.length];
    const marker = `${sender.clientLabel}:${Date.now()}\n`;

    sender.ytext.insert(sender.ytext.length, marker);
    state.updatesSent++;

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  await new Promise((resolve) => setTimeout(resolve, 1000));
}

async function runBenchmark() {
  console.log("============================================");
  console.log(" SyncDocs Real-Time Collaboration Benchmark");
  console.log("============================================");
  console.log(`Stage:        ${STAGE}`);
  console.log(`Clients:      ${NUM_CLIENTS}`);
  console.log(`Rounds:       ${NUM_ROUNDS}`);
  console.log(`Server:       ${SERVER_URL}`);
  console.log("============================================\n");

  const state = createBenchmarkState();
  const memoryBefore = memoryUsage();
  state.startTime = Date.now();

  const docId = await setupTestDocument();

  console.log(`→ Spawning ${NUM_CLIENTS} clients...`);
  const clientResults = await Promise.all(
    Array.from({ length: NUM_CLIENTS }, (_, i) =>
      createClient(docId, `client-${i}`, state),
    ),
  );
  const clients = clientResults.filter(Boolean);

  if (state.joinFailures > 0) {
    console.log(`⚠ ${state.joinSuccess}/${NUM_CLIENTS} clients connected (${state.joinFailures} failed)\n`);
  } else {
    console.log(`✔ All ${NUM_CLIENTS} clients connected and synchronized.\n`);
  }
  console.log("→ Warming up...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  console.log("✔ Warm-up complete.\n");
  console.log(`→ Running ${NUM_ROUNDS} edit rounds...`);
  await runEditRounds(clients, docId, state);
  console.log("✔ Edit rounds complete.\n");

  state.endTime = Date.now();

  const expectedReceives = state.updatesSent * (clients.length - 1);
  const joinSuccessRate = (state.joinSuccess / NUM_CLIENTS) * 100;
  state.droppedUpdates = Math.max(0, expectedReceives - state.updatesReceived);

  clients.forEach((c) => c.socket.disconnect());

  const duration = state.endTime - state.startTime;

  const joinLatency = {
    avg: average(state.joinLatencies),
    p50: median(state.joinLatencies),
    p95: percentile(state.joinLatencies, 95),
    max: maximum(state.joinLatencies),
    min: minimum(state.joinLatencies),
  };

  const propagationLatency = {
    avg: average(state.propagationLatencies),
    p50: median(state.propagationLatencies),
    p95: percentile(state.propagationLatencies, 95),
    max: maximum(state.propagationLatencies),
    min: minimum(state.propagationLatencies),
  };

  const throughputValue = throughput(state.updatesReceived, duration);
  const memoryAfter = memoryUsage();
  const memory = {
    before: memoryBefore,
    after: memoryAfter,
  };

  generateReport({
    stage: STAGE,
    clients: NUM_CLIENTS,
    rounds: NUM_ROUNDS,
    duration,
    joinLatency,
    joinSuccess: state.joinSuccess,
    joinFailures: state.joinFailures,
    joinSuccessRate,
    propagationLatency,
    updatesSent: state.updatesSent,
    updatesReceived: state.updatesReceived,
    droppedUpdates: state.droppedUpdates,
    throughput: throughputValue,
    memory,
  });

  console.log("============================================");
  console.log(" Benchmark Results");
  console.log("============================================");
  console.log(
    `Join Latency (avg / p95):        ${joinLatency.avg.toFixed(2)}ms / ${joinLatency.p95.toFixed(2)}ms`,
  );
  console.log(
    `Propagation Latency (avg / p95): ${propagationLatency.avg.toFixed(2)}ms / ${propagationLatency.p95.toFixed(2)}ms`,
  );
  console.log(`Updates Sent:                     ${state.updatesSent}`);
  console.log(`Updates Received:                 ${state.updatesReceived}`);
  console.log(`Dropped Updates:                  ${state.droppedUpdates}`);
  console.log(
    `Join Success Rate:                ${joinSuccessRate.toFixed(2)}%`
  );

  console.log(
    `Join Failures:                    ${state.joinFailures}`
  );
  console.log(
    `Throughput:                       ${throughputValue.toFixed(2)} updates/sec`,
  );
  console.log(
    `Total Duration:                   ${(duration / 1000).toFixed(2)}s`,
  );
  console.log("============================================\n");

  process.exit(0);
}

runBenchmark().catch((err) => {
  console.error("Benchmark failed:", err);
  process.exit(1);
});
