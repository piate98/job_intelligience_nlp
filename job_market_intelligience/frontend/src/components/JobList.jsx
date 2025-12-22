export default function JobList({ jobs, selectedJobId, onSelect }) {
  if (!jobs?.length) return <p>No jobs found.</p>;

  return (
    <div style={{ border: "1px solid #eee", borderRadius: 8, overflow: "hidden" }}>
      {jobs.map((job) => {
        const isSelected = selectedJobId === job.job_id;
        return (
          <button
            key={job.job_id}
            onClick={() => onSelect(job)}
            style={{
              width: "100%",
              textAlign: "left",
              padding: "12px 14px",
              border: "none",
              borderBottom: "1px solid #f1f1f1",
              background: isSelected ? "#f5f7ff" : "white",
              cursor: "pointer",
            }}
          >
            <div style={{ fontWeight: 700 }}>{job.job_title || "Untitled role"}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              {job.company_name_clean || "Unknown company"} • {job.location || "Unknown location"}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>
              {job.job_family || "Unknown family"} • {job.seniority || "Unknown seniority"}
            </div>
          </button>
        );
      })}
    </div>
  );
}