import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
});

export const getHealth = () => api.get("/health");

export const getJobs = ({ q = "", limit = 100, job_family = "", seniority = "", location = "" } = {}) =>
  api.get("/jobs", {
    params: {
      q: q || undefined,
      limit,
      job_family: job_family || undefined,
      seniority: seniority || undefined,
      location: location || undefined,
    },
  });

export const getJobSkills = (jobId, top_n = 20) =>
  api.get(`/jobs/${jobId}/skills`, { params: { top_n } });