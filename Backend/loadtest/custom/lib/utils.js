import fs from "fs";
import path from "path";

export function getTimestamp() {
    return new Date()
        .toISOString()
        .replace("T", "-")
        .replace(/\..+/, "")
        .replace(/:/g, "");
}

export function ensureDirectory(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

export function formatMemory(bytes) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDuration(milliseconds) {
    return `${(milliseconds / 1000).toFixed(2)} sec`;
}

export function saveFile(filePath, content) {

    ensureDirectory(path.dirname(filePath));

    fs.writeFileSync(filePath, content, "utf8");

    console.log(`✔ Report saved -> ${filePath}`);
}