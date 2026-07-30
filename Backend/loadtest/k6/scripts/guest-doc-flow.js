import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "../libs/bundle.js";
import { textSummary } from "../libs/summary.js";

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '20s', target: 10 },
        { duration: '10s', target: 50 },
        { duration: '20s', target: 50 },
        { duration: '10s', target: 0 },
    ],
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080/api';

export default function () {
    const res = http.post(`${BASE_URL}/documents/guest`);

    check(res, {
        'status is 201': (r) => r.status === 201,
        'response has docId': (r) => JSON.parse(r.body).docId !== undefined,
    });

    sleep(1);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString()
    .replace(/T/, '-')
    .replace(/\..+/, '')   
    .replace(/[:]/g, '');

  const environment = __ENV.ENVIRONMENT || "baseline";
  const basePath = `results/${environment}/guest/report-${timestamp}`;

  return {
    [`${basePath}.html`]: htmlReport(data),
    [`${basePath}.txt`]: textSummary(data, { indent: " ", enableColors: false }), 
    "stdout": textSummary(data, { indent: " ", enableColors: true }),
  };
}