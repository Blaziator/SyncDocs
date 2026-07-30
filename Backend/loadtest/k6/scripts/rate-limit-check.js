import http from 'k6/http';
import { check, sleep } from 'k6';
import { htmlReport } from "../libs/bundle.js";
import { textSummary } from "../libs/summary.js";

export const options = {
    vus: 1,
    iterations: 25,
};

const BASE_URL = __ENV.TARGET_URL || 'http://localhost:8080/api';

export default function () {
    const res = http.post(`${BASE_URL}/documents/guest`);

    check(res, {
        'status is 201 or 429': (r) => r.status === 201 || r.status === 429,
    });

    if (__ITER >= 20) {
        check(res, {
            'request beyond limit correctly rejected with 429': (r) => r.status === 429,
        });
    }

    sleep(0.2);
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString()
    .replace(/T/, '-')
    .replace(/\..+/, '')   
    .replace(/[:]/g, '');

  const environment = __ENV.ENVIRONMENT || "baseline";
  const basePath = `results/${environment}/rate-limit/report-${timestamp}`;

  return {
    [`${basePath}.html`]: htmlReport(data),
    [`${basePath}.txt`]: textSummary(data, { indent: " ", enableColors: false }), 
    "stdout": textSummary(data, { indent: " ", enableColors: true }),
  };
}