import { useEffect, useState } from "react";
import { getSimilarJobs } from "../api/api";

export default function SimilarJobs({ jobId }) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (jobId === undefined || jobId === null) return;

    setLoading(true);
    setErr("");
    getSimilarJobs(jobId, 5)
      .then((res) => setItems(res.data.results || []))
      .catch((e) => setErr(e?.response?.data?.detail || "Failed to load similar jobs"))
      .finally(() => setLoading(false));
  }, [jobId]);

  return (
    <div style={{ marginTop: 16 }}>
      <h3 style={{ marginBottom: 8 }}>Similar roles</h3>

      {loading && <p>Loading similar jobs…</p>}
      {err && <p style={{ color: "crimson" }}>{err}</p>}

      {!loading && !err && items.length === 0 && (
        <p style={{ opacity: 0.7 }}>No similar jobs found.</p>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {items.map((j, idx) => (
          <div
            key={idx}
            style={{
              padding: 12,
              border: "1px solid #ddd",
              borderRadius: 10,
              background: "white",
            }}
          >
            <strong>{j.job_title}</strong>
            <div style={{ opacity: 0.8 }}>
              {j.company_name_clean} · {j.location}
            </div>
            <div style={{ fontSize: 13, opacity: 0.6 }}>
              {j.job_family} · {j.seniority}
            </div>
            {typeof j.similarity === "number" && (
              <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>
                Similarity: {(j.similarity * 100).toFixed(1)}%
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}