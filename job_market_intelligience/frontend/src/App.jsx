import React, { useEffect, useMemo, useRef, useState } from "react";
import { getHealth, getJobs, getJobSkills } from "./api/api";
import SkillOverview from "./components/SkillOverview";
import "./App.css";

// Small concurrency limiter (to avoid spamming the backend)
async function mapWithConcurrency(items, concurrency, mapper) {
  const results = [];
  let idx = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (idx < items.length) {
      const i = idx++;
      try {
        results[i] = await mapper(items[i], i);
      } catch (e) {
        results[i] = null;
      }
    }
  });

  await Promise.all(workers);
  return results;
}

export default function App() {
  const [backendStatus, setBackendStatus] = useState("loading...");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(100);

  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);

  // Toggle: "job" vs "market"
  const [viewMode, setViewMode] = useState("job"); // "job" | "market"

  // This job skills
  const [jobSkills, setJobSkills] = useState([]);
  const [jobSkillsMeta, setJobSkillsMeta] = useState({ source: "", text_col: "" });

  // Market aggregated skills
  const [marketLoading, setMarketLoading] = useState(false);
  const [marketSkillsAll, setMarketSkillsAll] = useState([]);
  const [marketTopSkills, setMarketTopSkills] = useState([]);

  // Cache: jobId -> skills array
  const skillsCacheRef = useRef(new Map());

  useEffect(() => {
    getHealth()
      .then((res) => setBackendStatus(res.data.status))
      .catch(() => setBackendStatus("backend not reachable"));
  }, []);

  async function fetchJobs() {
    try {
      const res = await getJobs({ q, limit });
      const list = res.data?.jobs || [];
      setJobs(list);

      // auto-select first job
      if (list.length > 0) {
        setSelectedJob(list[0]);
      } else {
        setSelectedJob(null);
        setJobSkills([]);
        setMarketSkillsAll([]);
        setMarketTopSkills([]);
      }
    } catch (e) {
      console.error(e);
      setJobs([]);
      setSelectedJob(null);
    }
  }

  // Load jobs at startup
  useEffect(() => {
    fetchJobs();
  }, []);

  // When selected job changes, load its skills (job view)
  useEffect(() => {
    if (!selectedJob) return;

    const jobId = selectedJob.job_id;

    // cached?
    if (skillsCacheRef.current.has(jobId)) {
      const cached = skillsCacheRef.current.get(jobId);
      setJobSkills(cached.skills || []);
      setJobSkillsMeta({ source: cached.source || "", text_col: cached.text_col || "" });
      return;
    }

    getJobSkills(jobId, 20)
      .then((res) => {
        const payload = res.data || {};
        const skills = payload.skills || [];
        const meta = { source: payload.source || "", text_col: payload.text_col || "" };

        skillsCacheRef.current.set(jobId, { skills, ...meta });
        setJobSkills(skills);
        setJobSkillsMeta(meta);
      })
      .catch((err) => {
        console.error(err);
        setJobSkills([]);
        setJobSkillsMeta({ source: "", text_col: "" });
      });
  }, [selectedJob]);

  // Build market view when toggled ON
  useEffect(() => {
    if (viewMode !== "market") return;
    if (!jobs || jobs.length === 0) return;

    let cancelled = false;

    async function buildMarket() {
      setMarketLoading(true);

      const jobIds = jobs.map((j) => j.job_id);

      const results = await mapWithConcurrency(jobIds, 10, async (jobId) => {
        if (skillsCacheRef.current.has(jobId)) {
          return skillsCacheRef.current.get(jobId).skills || [];
        }
        const res = await getJobSkills(jobId, 20);
        const payload = res.data || {};
        const skills = payload.skills || [];
        skillsCacheRef.current.set(jobId, {
          skills,
          source: payload.source || "",
          text_col: payload.text_col || "",
        });
        return skills;
      });

      if (cancelled) return;

      const flat = results
        .filter(Boolean)
        .flat()
        .map((s) => String(s).toLowerCase().trim())
        .filter(Boolean);

      const counts = new Map();
      for (const s of flat) counts.set(s, (counts.get(s) || 0) + 1);

      const top = Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([skill, count]) => ({ skill, count }));

      setMarketSkillsAll(flat);
      setMarketTopSkills(top);
      setMarketLoading(false);
    }

    buildMarket();
    return () => {
      cancelled = true;
    };
  }, [viewMode, jobs]);

  const headerSubtitle = useMemo(() => {
    if (!selectedJob) return "";
    const t = selectedJob.job_title || "Job";
    const c = selectedJob.company_name_clean || "";
    const l = selectedJob.location || "";
    const jf = selectedJob.job_family || "";
    const se = selectedJob.seniority || "";
    return `${t}${c ? ` — ${c}` : ""}${l ? ` • ${l}` : ""}${jf ? ` • ${jf}` : ""}${se ? ` • ${se}` : ""}`;
  }, [selectedJob]);

  return (
    <div className="appPage" style={{ padding: "24px", maxWidth: 1200, margin: "0 auto" }}>
      <h1 className="appTitle" style={{ marginBottom: 6 }}>
        Job Market Intelligence
      </h1>
      <div className="backendStatus" style={{ opacity: 0.8, marginBottom: 14 }}>
        Backend status: {backendStatus}
      </div>

      {/* Search Row */}
      <div className='card'>
        <div
        className="searchRow"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto auto auto",
          gap: 10,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <input
          className="searchInput"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search job title, company, keywords..."
          style={{ padding: "12px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.2)" }}
        />

        <button
          className="searchBtn"
          onClick={fetchJobs}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.25)",
            background: "black",
            color: "white",
          }}
        >
          Search
        </button>

        <button
          className="resetBtn"
          onClick={() => {
            setQ("");
            setLimit(500);
            setViewMode("job");
            fetchJobs();
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.25)",
            background: "white",
          }}
        >
          Reset
        </button>

        <div className="limitWrap" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ opacity: 0.8 }}>Limit</div>
          <select
            className="limitSelect"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid rgba(0,0,0,0.25)" }}
          >
            {[50, 100, 200, 300, 500].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      </div>
      </div>

      {/* Toggle */}
      <div className="toggleRow" style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button
          className={`toggleBtn ${viewMode === "job" ? "active" : ""}`}
          onClick={() => setViewMode("job")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.25)",
            background: viewMode === "job" ? "black" : "white",
            color: viewMode === "job" ? "white" : "black",
          }}
        >
          This job
        </button>

        <button
          className={`toggleBtn ${viewMode === "market" ? "active" : ""}`}
          onClick={() => setViewMode("market")}
          style={{
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid rgba(0,0,0,0.25)",
            background: viewMode === "market" ? "black" : "white",
            color: viewMode === "market" ? "white" : "black",
          }}
        >
          Market (current results)
        </button>

        {viewMode === "market" ? (
          <div className="marketMeta" style={{ alignSelf: "center", opacity: 0.75 }}>
            {marketLoading ? "Building market skills…" : `Aggregated across ${jobs.length} jobs`}
          </div>
        ) : null}
      </div>

      {/* Main Layout */}
      <div className="mainGrid" style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 18 }}>
        {/* Jobs list */}
        <div className="panel jobsPanel" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <h2 style={{ margin: 0 }}>Jobs</h2>
          </div>

          <div
            className="jobsList"
            style={{ display: "grid", gap: 10, maxHeight: 560, overflow: "auto", paddingRight: 6 }}
          >
            {jobs.map((j) => {
              const active = selectedJob?.job_id === j.job_id;
              return (
                <button
                  key={j.job_id}
                  onClick={() => setSelectedJob(j)}
                  className={`jobCard ${active ? "active" : ""}`}
                  style={{
                    textAlign: "left",
                    padding: 12,
                    borderRadius: 12,
                    border: active ? "2px solid rgba(0,0,0,0.7)" : "1px solid rgba(0,0,0,0.15)",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{j.job_title}</div>
                  <div style={{ opacity: 0.85 }}>
                    {j.company_name_clean} • {j.location}
                  </div>
                  <div style={{ opacity: 0.75, fontSize: 12 }}>
                    {j.job_family} • {j.seniority}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Skills panel */}
        <div className="panel skillsPanel" style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: 14 }}>
          {viewMode === "job" ? (
            <SkillOverview
              mode="job"
              headerTitle="Required skills"
              headerSubtitle={
                selectedJob
                  ? `${headerSubtitle}\n(extraction: ${jobSkillsMeta.source || "unknown"})`
                  : "Select a job"
              }
              skills={jobSkills}
            />
          ) : (
            <SkillOverview
              mode="market"
              headerTitle="Market skills (from current results)"
              headerSubtitle={`Based on the jobs currently loaded`}
              skills={marketSkillsAll}
              topSkills={marketTopSkills}
            />
          )}
        </div>
      </div>
    </div>
  );
}