import path from "path";

import {
    getTimestamp,
    saveFile,
    formatMemory,
    formatDuration
} from "./utils.js";


export function generateReport({
    stage,
    clients,
    rounds,
    duration,
    joinLatency,
    propagationLatency,
    updatesSent,
    updatesReceived,
    droppedUpdates,
    throughput,
    memory
}) {

    const timestamp = getTimestamp();

    const report = `# Collaboration Benchmark (${stage})

Generated: ${new Date().toLocaleString()}

---

## Test Configuration

| Setting | Value |
|---------|------:|
| Clients | ${clients} |
| Rounds | ${rounds} |

---

## Join Latency

| Metric | Value |
|--------|------:|
| Average | ${joinLatency.avg.toFixed(2)} ms |
| Median | ${joinLatency.p50.toFixed(2)} ms |
| P95 | ${joinLatency.p95.toFixed(2)} ms |
| Max | ${joinLatency.max.toFixed(2)} ms |

---

## Update Propagation

| Metric | Value |
|--------|------:|
| Average | ${propagationLatency.avg.toFixed(2)} ms |
| Median | ${propagationLatency.p50.toFixed(2)} ms |
| P95 | ${propagationLatency.p95.toFixed(2)} ms |
| Max | ${propagationLatency.max.toFixed(2)} ms |

---

## Update Statistics

| Metric | Value |
|--------|------:|
| Updates Sent | ${updatesSent} |
| Updates Received | ${updatesReceived} |
| Dropped Updates | ${droppedUpdates} |
| Throughput | ${throughput.toFixed(2)} updates/sec |

---

## Memory Usage

| Metric | Before | After | Delta |
|--------|-------:|------:|------:|
| RSS | ${formatMemory(memory.before.rss)} | ${formatMemory(memory.after.rss)} | ${formatMemory(memory.after.rss - memory.before.rss)} |
| Heap Used | ${formatMemory(memory.before.heapUsed)} | ${formatMemory(memory.after.heapUsed)} | ${formatMemory(memory.after.heapUsed - memory.before.heapUsed)} |

---

## Test Duration

${formatDuration(duration)}

`;

    const filePath = path.join(
       "results", stage, "merge-latency", `report-${timestamp}-${clients}clients.md`
    );

    saveFile(filePath, report);

}