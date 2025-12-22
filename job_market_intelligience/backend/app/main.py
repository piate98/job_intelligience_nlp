# backend/app/main.py
from __future__ import annotations

from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .nlp import load_artifacts, filter_jobs, similar_jobs, job_skills

app = FastAPI(title="Job Market Intelligence API", version="1.0.0")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODELS_DIR = Path(__file__).resolve().parents[1] / "models"

try:
    ART = load_artifacts(MODELS_DIR)
except Exception as e:
    ART = None
    STARTUP_ERROR = str(e)


@app.get("/health")
def health():
    if ART is None:
        return {"status": "error", "detail": STARTUP_ERROR}
    return {"status": "ok", "jobs": int(len(ART.jobs))}


@app.get("/jobs")
def list_jobs(
    q: Optional[str] = Query(default=None, description="keyword search"),
    job_family: Optional[str] = Query(default=None),
    seniority: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
):
    if ART is None:
        raise HTTPException(status_code=500, detail=STARTUP_ERROR)

    df = filter_jobs(
        ART.jobs,
        q=q,
        job_family=job_family,
        seniority=seniority,
        location=location,
        
    )

    cols = [c for c in ["job_title", "company_name_clean", "location", "job_family", "seniority"] if c in df.columns]
    out = df[cols].copy()
    out.insert(0, "job_id", range(len(out)))

    return {"count": len(out), "jobs": out.to_dict(orient="records")}


@app.get("/jobs/{job_id}/skills")
def get_job_skills(job_id: int, top_n: int = Query(default=20, ge=5, le=60)):
    if ART is None:
        raise HTTPException(status_code=500, detail=STARTUP_ERROR)

    try:
        payload = job_skills(ART, job_id=job_id, top_n=top_n)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"job_id": job_id, "top_n": top_n, **payload}


@app.get("/jobs/{job_id}/similar")
def get_similar(job_id: int, top_n: int = Query(default=5, ge=1, le=20)):
    if ART is None:
        raise HTTPException(status_code=500, detail=STARTUP_ERROR)

    try:
        sim = similar_jobs(ART, job_id=job_id, top_n=top_n)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    cols = [c for c in ["job_title", "company_name_clean", "location", "job_family", "seniority", "similarity"] if c in sim.columns]
    out = sim[cols].copy()

    return {"job_id": job_id, "top_n": top_n, "results": out.to_dict(orient="records")}