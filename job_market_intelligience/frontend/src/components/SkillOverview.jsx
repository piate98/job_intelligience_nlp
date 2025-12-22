
import React from "react";

const CATEGORY_ORDER = [
  "Programming",
  "Data / SQL",
  "ML / AI",
  "Cloud / DevOps",
  "Visualization",
  "Other",
];


function skillToCategory(skill) {
  const s = String(skill || "").toLowerCase();

  // Programming
  if (["python", "java", "c++", "javascript", "typescript", "git", "linux"].includes(s)) return "Programming";

  // Data / SQL
  if (
    ["sql", "postgresql", "mysql", "mongodb", "snowflake", "bigquery", "dbt", "etl", "spark", "airflow", "pandas", "numpy", "excel"].includes(s)
  )
    return "Data / SQL";

  // ML / AI
  if (
    ["machine learning", "deep learning", "nlp", "pytorch", "tensorflow", "scikit-learn", "xgboost", "lightgbm", "transformers", "bert", "llm", "hugging face"].includes(s)
  )
    return "ML / AI";

  // Cloud / DevOps
  if (["aws", "gcp", "azure", "docker", "kubernetes", "fastapi", "flask", "rest", "graphql"].includes(s)) return "Cloud / DevOps";

  // Visualization
  if (["tableau", "power bi"].includes(s)) return "Visualization";

  return "Other";
}

function buildCategoryCounts(skills = []) {
  const counts = {};
  for (const c of CATEGORY_ORDER) counts[c] = 0;

  for (const sk of skills) {
    const cat = skillToCategory(sk);
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return counts;
}

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 50px", gap: "10px", alignItems: "center", margin: "8px 0" }}>
      <div style={{ fontSize: 13, opacity: 0.9 }}>{label}</div>
      <div style={{ height: 10, background: "rgba(0,0,0,0.08)", borderRadius: 999 }}>
        <div style={{ width: `${pct}%`, height: 10, borderRadius: 999, background: "rgba(20,80,200,0.75)" }} />
      </div>
      <div style={{ textAlign: "right", fontSize: 12, opacity: 0.75 }}>{value}</div>
    </div>
  );
}

export default function SkillOverview({
  mode = "job", // "job" | "market"
  headerTitle = "Required skills",
  headerSubtitle = "",
  skills = [],
  topSkills = [], // [{skill, count}]
}) {
  const categoryCounts = buildCategoryCounts(skills);
  const total = skills.length;

  const catMax = Math.max(...Object.values(categoryCounts), 0);

  return (
    <div>
      <h2 style={{ margin: "0 0 8px 0" }}>{headerTitle}</h2>
      {headerSubtitle ? <div style={{ marginBottom: 12, opacity: 0.8 }}>{headerSubtitle}</div> : null}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        {/* Left: category breakdown */}
        <div style={{ padding: 14, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            {mode === "job" ? "Skill breakdown (this job)" : "Skill breakdown (market — current results)"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 10 }}>
            {mode === "job"
              ? `Total detected: ${total}`
              : `Total skill mentions aggregated: ${total}`}
          </div>

          {CATEGORY_ORDER.map((c) => (
            <BarRow key={c} label={c} value={categoryCounts[c] || 0} max={catMax} />
          ))}
        </div>

        {/* Right: Top skills list */}
        <div style={{ padding: 14, border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 10 }}>
            {mode === "job" ? "Detected skills" : "Top skills (frequency)"}
          </div>

          {mode === "job" ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {skills.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No skills detected for this job.</div>
              ) : (
                skills.map((s) => (
                  <span key={s} style={{ padding: "6px 10px", borderRadius: 999, border: "1px solid rgba(0,0,0,0.15)", fontSize: 12 }}>
                    {s}
                  </span>
                ))
              )}
            </div>
          ) : (
            <div>
              {topSkills.length === 0 ? (
                <div style={{ opacity: 0.7 }}>No market skills computed yet.</div>
              ) : (
                topSkills.map(({ skill, count }) => (
                  <BarRow key={skill} label={skill} value={count} max={topSkills[0]?.count || 1} />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}