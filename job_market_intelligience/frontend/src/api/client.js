const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, params = {}) {
  const url = new URL(API_URL + path);

  // add query params
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      url.searchParams.set(k, v);
    }
  });

  const res = await fetch(url.toString());
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

export const api = {
  health: () => request("/health"),
  jobs: (filters) => request("/jobs", filters),
  similarJobs: (jobId, top_n = 5) => request(`/jobs/${jobId}/similar`, { top_n }),
  skills: (job_family, top_n = 15) => request("/skills", { job_family, top_n }),
};