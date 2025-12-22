
/*
// frontend/src/api/api.js

import axios from "axios";

/**
 * Backend URL:
 * - Local dev: http://127.0.0.1:8000
 * - Production: set VITE_API_BASE_URL in Vercel/Railway env vars
 *   Example: VITE_API_BASE_URL=https://your-backend.up.railway.app
 */



/*

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export function getHealth() {
  return api.get("/health");
}

export function getJobs(params = {}) {
  return api.get("/jobs", { params });
}

// calls: GET /jobs/{job_id}/skills?top_n=20
export function getJobSkills(jobId, top_n = 20) {
  return api.get(`/jobs/${jobId}/skills`, { params: { top_n } });
}


*/

// frontend/src/api/api.js

import axios from "axios";

/**
 * Backend URL:
 * - Local dev: http://127.0.0.1:8000
 * - Production: set VITE_API_BASE_URL in Vercel/Railway env vars
 *   Example: VITE_API_BASE_URL=https://your-backend.up.railway.app
 */





const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE,
  timeout: 20000,
});

export function getHealth() {
  return api.get("/health");
}

export function getJobs(params = {}) {
  return api.get("/jobs", { params });
}

// calls: GET /jobs/{job_id}/skills?top_n=20
export function getJobSkills(jobId, top_n = 20) {
  return api.get(`/jobs/${jobId}/skills`, { params: { top_n } });
}
