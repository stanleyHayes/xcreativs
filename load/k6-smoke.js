// k6 load smoke test for the public read paths.
//   BASE_URL=https://api.example.com k6 run load/k6-smoke.js
//
// Targets the spec NFR (p95 < 200 ms from-region); the threshold here is
// relaxed for cross-region CI runs — tighten for in-region load tests.
import http from "k6/http";
import { check, sleep } from "k6";

const BASE = __ENV.BASE_URL || "http://localhost:8081";

export const options = {
  stages: [
    { duration: "20s", target: 20 },
    { duration: "40s", target: 50 },
    { duration: "20s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
  },
};

const paths = [
  "/healthz",
  "/api/v1/pages/home",
  "/api/v1/services",
  "/api/v1/work",
  "/api/v1/insights",
  "/api/v1/search?q=systems",
  "/api/v1/metrics/ticker",
  "/api/v1/visualizations/holding-tree",
];

export default function () {
  const path = paths[Math.floor(Math.random() * paths.length)];
  const res = http.get(`${BASE}${path}`);
  check(res, {
    "status is 2xx": (r) => r.status >= 200 && r.status < 300,
  });
  sleep(1);
}
