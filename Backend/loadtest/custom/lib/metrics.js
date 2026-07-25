export function average(values) {
    if (!values.length) return 0;

    return (
        values.reduce((sum, value) => sum + value, 0) /
        values.length
    );
}

export function median(values) {
    if (!values.length) return 0;

    const sorted = [...values].sort((a, b) => a - b);

    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

export function percentile(values, p) {
    if (!values.length) return 0;

    const sorted = [...values].sort((a, b) => a - b);

    const index = Math.ceil((p / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
}

export function maximum(values) {
    if (!values.length) return 0;

    return Math.max(...values);
}

export function minimum(values) {
    if (!values.length) return 0;

    return Math.min(...values);
}

export function throughput(totalOperations, durationMs) {
    if (durationMs === 0) return 0;

    return totalOperations / (durationMs / 1000);
}

export function memoryUsage() {

    const memory = process.memoryUsage();

    return {
        rss: memory.rss,
        heapTotal: memory.heapTotal,
        heapUsed: memory.heapUsed,
        external: memory.external
    };
}