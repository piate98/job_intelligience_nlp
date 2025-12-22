import SimilarJobs from "./SimilarJobs";

export default function JobDetails({ job }) {
  if (!job) {
    return (
      <div>
        <h2>Details</h2>
        <p>Select a job to see details and similar roles.</p>
      </div>
    );
  }

  return (
    <div>
      <h2>{job.job_title}</h2>
      <p>
        <strong>{job.company_name_clean}</strong>
      </p>
      <p>{job.location}</p>

      <hr />

      <p>
        <strong>Family:</strong> {job.job_family}
      </p>
      <p>
        <strong>Seniority:</strong> {job.seniority}
      </p>

      {/* NEW: Similar jobs */}
      <SimilarJobs jobId={job.job_id} />
    </div>
  );
}