import fs from "fs";
import path from "path";

const stage = process.argv[2];
const test = process.argv[3];

if (!stage || !test) {
    console.log("\nUsage:");
    console.log("node generate-summary.js <stage> <test>");
    console.log("\nExample:");
    console.log("node generate-summary.js baseline auth\n");
    process.exit(1);
}

const folder = path.join(
    process.cwd(),
    "results",
    stage,
    test
);

if (!fs.existsSync(folder)) {
    console.error(`Folder not found:\n${folder}`);
    process.exit(1);
}

const txtFiles = fs
    .readdirSync(folder)
    .filter(file => file.startsWith("report-") && file.endsWith(".txt"))
    .sort();

if (txtFiles.length === 0) {
    console.error("No report txt files found.");
    process.exit(1);
}

console.log(`\nStage : ${stage}`);
console.log(`Test  : ${test}`);
console.log(`Found ${txtFiles.length} report(s).\n`);

const metrics = [];

for (const file of txtFiles) {

    const text = fs.readFileSync(path.join(folder, file), "utf8");

    const avg =
        text.match(/http_req_duration.*?avg=([\d.]+)ms/)?.[1];

    const p95 =
        text.match(/http_req_duration.*?p\(95\)=([\d.]+)ms/)?.[1];

    const reqs =
        text.match(/http_reqs.*?([\d.]+)\/s/)?.[1];

    const failed =
        text.match(/http_req_failed.*?([\d.]+)%/)?.[1];

    metrics.push({
        file,
        avg: Number(avg),
        p95: Number(p95),
        reqs: Number(reqs),
        failed: Number(failed),
    });
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

const avgLatency = average(metrics.map(m => m.avg));
const avgP95 = average(metrics.map(m => m.p95));
const avgReqs = average(metrics.map(m => m.reqs));
const avgFailed = average(metrics.map(m => m.failed));

const w = { file: 29, avg: 16, p95: 8, reqs: 12, failed: 10 };

for (const metric of metrics) {
    metric.score =
        Math.abs(metric.avg - avgLatency) +
        Math.abs(metric.p95 - avgP95) +
        Math.abs(metric.reqs - avgReqs);
}

metrics.sort((a, b) => a.score - b.score);

const representative = metrics[0];

const representativeHtml = representative.file.replace(".txt", ".html");

let markdown = `# ${test.toUpperCase()} Benchmark (${stage})

Generated: ${new Date().toLocaleString()}

---

## Environment

- Stage: **${stage}**
- Test: **${test}**
- Total Runs: **${metrics.length}**

---

## Individual Runs

| ${"Report".padEnd(w.file)} | ${"Avg Latency (ms)".padStart(w.avg)} | ${"P95 (ms)".padStart(w.p95)} | ${"Requests/sec".padStart(w.reqs)} | ${"Failed (%)".padStart(w.failed)} |
| :${"-".repeat(w.file - 1)} | ${"-".repeat(w.avg - 1)}: | ${"-".repeat(w.p95 - 1)}: | ${"-".repeat(w.reqs - 1)}: | ${"-".repeat(w.failed - 1)}: |
`;

for (const m of metrics) {
    const fileStr   = m.file.padEnd(w.file);
    const avgStr    = m.avg.toFixed(2).padStart(w.avg || w.avg);
    const p95Str    = m.p95.toFixed(2).padStart(w.p95);
    const reqsStr   = m.reqs.toFixed(2).padStart(w.reqs);
    const failedStr = m.failed.toFixed(2).padStart(w.failed);

    markdown += `| ${fileStr} | ${avgStr} | ${p95Str} | ${reqsStr} | ${failedStr} |\n`;
}
markdown += `

---

## Average Results

| Metric          | Average       |
|-----------------|--------------:|
| Avg Latency     | **${avgLatency.toFixed(2)} ms** |
| P95 Latency     | **${avgP95.toFixed(2)} ms** |
| Requests/sec    | **${avgReqs.toFixed(2)}** |
| Failed Requests | **${avgFailed.toFixed(2)} %** |

---

## Conclusion

These averages represent the benchmark baseline for the **${test}** test in the **${stage}** environment.`;

const outputFile = path.join(
    folder,
    `${test}-${stage}.md`
);

fs.writeFileSync(outputFile, markdown);

console.log("==========================================");
console.log("Benchmark Summary");
console.log("==========================================");

console.log(`Average Latency : ${avgLatency.toFixed(2)} ms`);
console.log(`Average P95     : ${avgP95.toFixed(2)} ms`);
console.log(`Average Req/sec : ${avgReqs.toFixed(2)}`);
console.log(`Failed Requests : ${avgFailed.toFixed(2)} %`);

console.log("\nRepresentative Files");

console.log(`HTML : ${representativeHtml}`);
console.log(`TXT  : ${representative.file}`);

console.log(`Score: ${representative.score.toFixed(2)}`);

console.log(`\nMarkdown written to:\n${outputFile}`);