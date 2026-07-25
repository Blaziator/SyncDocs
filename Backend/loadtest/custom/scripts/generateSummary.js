import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const STAGE = process.argv[2];
const TEST = process.argv[3]; 

if (!STAGE || !TEST) {
    console.log("\nUsage: node generateSummary.js <stage> <test>");
    console.log("Example: node generateSummary.js baseline connection-scale\n");
    process.exit(1);
}

const folder = path.join(__dirname, "..", "results", STAGE, TEST);

if (!fs.existsSync(folder)) {
    console.error(`Folder not found: ${folder}`);
    process.exit(1);
}

const txtFiles = fs.readdirSync(folder)
    .filter((f) => f.startsWith("report-") && f.endsWith(".txt"))
    .sort();

if (txtFiles.length === 0) {
    console.error("No report txt files found.");
    process.exit(1);
}

function parseReport(filePath) {
    const text = fs.readFileSync(filePath, "utf8");
    const get = (label) => {
        const match = text.match(new RegExp(`${label}.*?:\\s*([\\d.]+)`));
        return match ? Number(match[1]) : 0;
    };

    return {
        file: path.basename(filePath),
        successRate: get("success_rate"),
        joinLatencyAvg: get("join_latency_avg"),
        joinLatencyP95: get("join_latency_p95"),
        peakConnections: get("peak_concurrent_connections"),
    };
}

const runs = txtFiles.map((f) => parseReport(path.join(folder, f)));

const avg = (arr) => arr.reduce((s, v) => s + v, 0) / arr.length;
const avgSuccess = avg(runs.map((r) => r.successRate));
const avgLatency = avg(runs.map((r) => r.joinLatencyAvg));
const avgP95 = avg(runs.map((r) => r.joinLatencyP95));
const avgPeak = avg(runs.map((r) => r.peakConnections));

runs.forEach((r) => {
    r.score = Math.abs(r.successRate - avgSuccess)
        + Math.abs(r.joinLatencyAvg - avgLatency)
        + Math.abs(r.joinLatencyP95 - avgP95);
});
runs.sort((a, b) => a.score - b.score);
const best = runs[0];

const md = `# ${TEST.toUpperCase()} Benchmark (${STAGE})

Generated: ${new Date().toLocaleString()}

---

## Individual Runs

| Report | Success Rate (%) | Join Latency Avg (ms) | Join Latency P95 (ms) | Peak Connections |
| :--- | ---: | ---: | ---: | ---: |
${runs.map((r) => `| ${r.file} | ${r.successRate.toFixed(2)} | ${r.joinLatencyAvg.toFixed(2)} | ${r.joinLatencyP95.toFixed(2)} | ${r.peakConnections} |`).join("\n")}

---

## Average Results

| Metric | Average |
|---|---:|
| Success Rate | **${avgSuccess.toFixed(2)}%** |
| Join Latency Avg | **${avgLatency.toFixed(2)} ms** |
| Join Latency P95 | **${avgP95.toFixed(2)} ms** |
| Peak Connections | **${avgPeak.toFixed(0)}** |

---

## Representative Run

**${best.file}** — closest to the average across all metrics, recommended for documentation.

---

## Conclusion

These results represent the connection-scale benchmark for the **${TEST}** test in the **${STAGE}** environment.
`;

const outputFile = path.join(folder, `${TEST}-${STAGE}.md`);
fs.writeFileSync(outputFile, md);

console.log(`\n✔ Summary generated from ${runs.length} runs`);
console.log(`Representative: ${best.file}`);
console.log(`Written to: ${outputFile}\n`);