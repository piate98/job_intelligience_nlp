export default function JobCard({ job, onSelect }) {
  return (
    <div
      onClick={onSelect}
      style={{
        border: "1px solid #2a2a2a",
        borderRadius: 14,
        padding: 14,
        marginBottom: 12,
        cursor: "pointer",
        background: "#0f0f0f",
        transition: "all 0.15s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#161616";
        e.currentTarget.style.borderColor = "#444";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "#0f0f0f";
        e.currentTarget.style.borderColor = "#2a2a2a";
      }}
    >
      {/* Job title */}
      <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
        {job.job_title}
      </div>

      {/* Company + location */}
      <div style={{ fontSize: 13, opacity: 0.85 }}>
        {job.company_name_clean || "Unknown company"}
        {" • "}
        {job.location || "Unknown location"}
      </div>

      {/* Metadata tags */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginTop: 8,
          flexWrap: "wrap",
        }}
      >
        {job.job_family && (
          <span style={tagStyle}>
            {job.job_family}
          </span>
        )}

        {job.seniority && (
          <span style={tagStyle}>
            {job.seniority}
          </span>
        )}
      </div>
    </div>
  );
}

const tagStyle = {
  fontSize: 12,
  padding: "4px 8px",
  borderRadius: 999,
  background: "#1f1f1f",
  border: "1px solid #333",
  opacity: 0.9,
};