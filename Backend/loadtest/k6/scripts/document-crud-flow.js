import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "../libs/bundle.js";
import { textSummary } from "../libs/summary.js";

export const options = {
    stages: [
        { duration: '10s', target: 5 },
        { duration: '20s', target: 5 },
        { duration: '10s', target: 20 },
        { duration: '20s', target: 20 },
        { duration: '10s', target: 0 },
    ],
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080/api';

export default function () {
    const email = `loadtest_vu${__VU}_${Date.now()}@example.com`;
    const password = "loadtest12345";
    const headers = { 'Content-Type': 'application/json' };

    http.post(`${BASE_URL}/auth/register`, JSON.stringify({
        name: "CRUD Test User", email, password,
    }), { headers });

    sleep(0.5);

    const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
        email, password,
    }), { headers });

    check(loginRes, { 'login succeeded': (r) => r.status === 200 });

    sleep(0.5);

    const createRes = http.post(`${BASE_URL}/documents/create`, JSON.stringify({
        title: "Load Test Doc",
    }), { headers });

    check(createRes, { 'create succeeded': (r) => r.status === 201 });

    const docId = JSON.parse(createRes.body).doc?._id;

    sleep(0.5);

    if (docId) {

        const renameRes = http.patch(`${BASE_URL}/documents/${docId}`, JSON.stringify({
            title: "Renamed Load Test Doc",
        }), { headers });

        check(renameRes, { 'rename succeeded': (r) => r.status === 200 });

        sleep(0.5);
    }

    const dashboardRes = http.get(`${BASE_URL}/documents/dashboard`, { headers });

    check(dashboardRes, { 'dashboard succeeded': (r) => r.status === 200 });

    sleep(0.5);

    if (docId) {

        const deleteRes = http.del(`${BASE_URL}/documents/${docId}`, null, { headers });

        check(deleteRes, { 'delete succeeded': (r) => r.status === 200 });
    }

    sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString()
    .replace(/T/, '-')
    .replace(/\..+/, '')   
    .replace(/[:]/g, '');

  const stage = "baseline/crud";
  const basePath = `results/${stage}/report-${timestamp}`;

  return {
    [`${basePath}.html`]: htmlReport(data),
    [`${basePath}.txt`]: textSummary(data, { indent: " ", enableColors: false }), 
    "stdout": textSummary(data, { indent: " ", enableColors: true }),
  };
}