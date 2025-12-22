from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Optional, List, Any, Dict, Tuple

import re
import numpy as np
import pandas as pd
import joblib
import pickle


# Artifacts

@dataclass
class Artifacts:
    jobs: pd.DataFrame
    vectorizer: Any
    tfidf_matrix: Any  # sparse matrix
    text_col: str      # which column contains the text we extract skills from


def _load_any(path: Path):
    # joblib first, then pickle fallback
    try:
        return joblib.load(path)
    except Exception:
        with open(path, "rb") as f:
            return pickle.load(f)


def load_artifacts(models_dir: Path) -> Artifacts:
    models_dir = Path(models_dir)

    jobs_path = models_dir / "jobs_reference.pkl"
    vectorizer_path = models_dir / "tfidf_vectorizer.pkl"
    matrix_path = models_dir / "tfidf_matrix.pkl"

    for p in [jobs_path, vectorizer_path, matrix_path]:
        if not p.exists():
            raise FileNotFoundError(f"Missing artifact: {p}")

    jobs_obj = _load_any(jobs_path)
    jobs_df = jobs_obj["jobs"] if isinstance(jobs_obj, dict) and "jobs" in jobs_obj else jobs_obj
    if not isinstance(jobs_df, pd.DataFrame):
        raise ValueError("jobs_reference.pkl must contain a pandas DataFrame (or dict with key 'jobs').")

    candidate_text_cols = ["job_description", "description", "job_desc", "text", "combined_text", "clean_text"]
    text_col = ""
    for c in candidate_text_cols:
        if c in jobs_df.columns:
            text_col = c
            break

    vectorizer = _load_any(vectorizer_path)
    tfidf_matrix = _load_any(matrix_path)

    jobs_df = jobs_df.reset_index(drop=True)
    return Artifacts(jobs=jobs_df, vectorizer=vectorizer, tfidf_matrix=tfidf_matrix, text_col=text_col)


def _ensure_cols(df: pd.DataFrame, cols: List[str]) -> pd.DataFrame:
    for c in cols:
        if c not in df.columns:
            df[c] = ""
    return df



# Jobs filter

def filter_jobs(
    jobs: pd.DataFrame,
    q: Optional[str] = None,
    job_family: Optional[str] = None,
    seniority: Optional[str] = None,
    location: Optional[str] = None,
    limit: int = 50,
) -> pd.DataFrame:
    df = jobs.copy()
    df = _ensure_cols(df, ["job_title", "company_name_clean", "location", "job_family", "seniority"])

    for c in ["job_title", "company_name_clean", "location", "job_family", "seniority"]:
        df[c] = df[c].astype(str)

    if q and q.strip():
        qq = q.strip().lower()
        hay = (
            df["job_title"].str.lower()
            + " "
            + df["company_name_clean"].str.lower()
            + " "
            + df["location"].str.lower()
        )
        df = df[hay.str.contains(qq, na=False)]

    if job_family and job_family.strip():
        jf = job_family.strip().lower()
        df = df[df["job_family"].str.lower() == jf]

    if seniority and seniority.strip():
        se = seniority.strip().lower()
        df = df[df["seniority"].str.lower() == se]

    if location and location.strip():
        loc = location.strip().lower()
        df = df[df["location"].str.lower().str.contains(loc, na=False)]

    return df.head(int(limit))



# Similar jobs 

def similar_jobs(art: Artifacts, job_id: int, top_n: int = 5) -> pd.DataFrame:
    jobs = art.jobs.reset_index(drop=True)
    if job_id < 0 or job_id >= len(jobs):
        raise ValueError(f"job_id out of range (0..{len(jobs)-1})")

    X = art.tfidf_matrix
    x_i = X[job_id]

    prod = X @ x_i.T
    scores = prod.toarray().ravel() if hasattr(prod, "toarray") else np.asarray(prod).ravel()

    if hasattr(X, "multiply"):
        row_norms = np.sqrt(X.multiply(X).sum(axis=1)).A1
    else:
        row_norms = np.sqrt((X * X).sum(axis=1))

    i_norm = row_norms[job_id] if row_norms[job_id] != 0 else 1.0
    denom = row_norms * i_norm
    denom = np.where(denom == 0, 1.0, denom)

    cos = scores / denom
    cos[job_id] = -1

    idx = np.argsort(cos)[::-1][: int(top_n)]
    out = jobs.loc[idx].copy()
    out["similarity"] = cos[idx]
    return out.reset_index(drop=True)


# -------------------------
# Skill extraction (STRICT)
# -------------------------
# 1) Patterns to detect skills in raw text
SKILL_PATTERNS: List[Tuple[str, str]] = [
    ("python", r"\bpython\b"),
    ("sql", r"\bsql\b"),
    ("r", r"\br\b"),
    ("java", r"\bjava\b"),
    ("c++", r"\bc\+\+\b"),
    ("javascript", r"\bjavascript\b|\bjs\b"),
    ("typescript", r"\btypescript\b|\bts\b"),

    ("machine learning", r"\bmachine learning\b|\bml\b"),
    ("deep learning", r"\bdeep learning\b"),
    ("nlp", r"\bnlp\b|\bnatural language processing\b"),
    ("pytorch", r"\bpytorch\b"),
    ("tensorflow", r"\btensorflow\b"),
    ("scikit-learn", r"\bscikit[- ]learn\b|\bsklearn\b"),
    ("xgboost", r"\bxgboost\b"),
    ("lightgbm", r"\blightgbm\b"),

    ("pandas", r"\bpandas\b"),
    ("numpy", r"\bnumpy\b"),
    ("spark", r"\bspark\b|\bpyspark\b"),
    ("airflow", r"\bairflow\b"),
    ("dbt", r"\bdbt\b"),
    ("etl", r"\betl\b"),

    ("tableau", r"\btableau\b"),
    ("power bi", r"\bpower ?bi\b"),

    ("aws", r"\baws\b|\bamazon web services\b"),
    ("gcp", r"\bgcp\b|\bgoogle cloud\b"),
    ("azure", r"\bazure\b"),
    ("docker", r"\bdocker\b"),
    ("kubernetes", r"\bkubernetes\b|\bk8s\b"),
    ("git", r"\bgit\b"),
    ("linux", r"\blinux\b"),

    ("postgresql", r"\bpostgres(?:ql)?\b"),
    ("mysql", r"\bmysql\b"),
    ("mongodb", r"\bmongo(?:db)?\b"),
    ("snowflake", r"\bsnowflake\b"),
    ("bigquery", r"\bbigquery\b"),
]

# 2) STRICT whitelist for fallback (TF-IDF terms must be one of these to be shown)
# (You can expand this list over time. This is what prevents "internship/semester/time" junk.)
SKILL_WHITELIST = set([name for name, _ in SKILL_PATTERNS] + [
    # common extras (aliases you might want)
    "excel", "statistics", "probability", "regression", "time series",
    "nlp", "transformers", "hugging face", "bert", "llm",
    "fastapi", "flask", "rest", "graphql",
])

# 3) hard blocklist (never show these as “skills”)
BLOCKLIST = {
    "internship", "semester", "time", "student", "degree", "masters", "phd",
    "outstanding communication", "ability thrive", "successful candidates",
    "ideas", "qualities", "ethical standards", "applied", "applied statistics",
    "2020", "spring", "signals", "seeking",
    # generic filler
    "world", "largest", "company", "companies", "position", "candidates",
}


def extract_skills_from_text(text: str, top_n: int = 20) -> List[str]:
    if not text:
        return []
    t = text.lower()

    found: List[str] = []
    for label, pat in SKILL_PATTERNS:
        if re.search(pat, t):
            found.append(label)

    # de-dup preserve order, apply blocklist
    seen = set()
    out = []
    for s in found:
        if s in BLOCKLIST:
            continue
        if s not in seen:
            seen.add(s)
            out.append(s)

    return out[: int(top_n)]


def top_terms_for_job(art: Artifacts, job_id: int, top_n: int = 25) -> List[str]:
    """Raw TF-IDF top terms (keywords). We'll filter these with SKILL_WHITELIST later."""
    if job_id < 0 or job_id >= len(art.jobs):
        raise ValueError(f"job_id out of range (0..{len(art.jobs)-1})")

    vec = art.tfidf_matrix[job_id]

    if hasattr(vec, "tocoo"):
        coo = vec.tocoo()
        idx = coo.col
        val = coo.data
    else:
        arr = np.asarray(vec).ravel()
        idx = np.where(arr != 0)[0]
        val = arr[idx]

    if len(idx) == 0:
        return []

    top = np.argsort(val)[::-1][: int(top_n)]
    feat_idx = idx[top]

    feature_names = art.vectorizer.get_feature_names_out()
    terms = [str(feature_names[i]).lower().strip() for i in feat_idx]

    # basic cleanup
    cleaned = []
    for term in terms:
        term = re.sub(r"\s+", " ", term).strip()
        if not term or term in BLOCKLIST:
            continue
        if len(term) <= 2:
            continue
        # remove pure numbers
        if re.fullmatch(r"\d+", term):
            continue
        cleaned.append(term)

    return cleaned


def _filter_keywords_to_skills(keywords: List[str], top_n: int) -> List[str]:
    """
    Only keep terms that are real skills (in SKILL_WHITELIST).
    This is what removes the “internship / time / semester …” chips.
    """
    out = []
    seen = set()
    for kw in keywords:
        if kw in BLOCKLIST:
            continue
        if kw in SKILL_WHITELIST and kw not in seen:
            seen.add(kw)
            out.append(kw)
        if len(out) >= int(top_n):
            break
    return out


def job_skills(art: Artifacts, job_id: int, top_n: int = 20) -> Dict[str, Any]:
    """
    Primary: skill patterns from job description/text
    Fallback: TF-IDF keywords filtered by whitelist
    If still empty: return none (and UI can show “No skills detected”)
    """
    jobs = art.jobs.reset_index(drop=True)
    if job_id < 0 or job_id >= len(jobs):
        raise ValueError(f"job_id out of range (0..{len(jobs)-1})")

    text = ""
    if art.text_col and art.text_col in jobs.columns:
        text = str(jobs.loc[job_id, art.text_col])

    skills = extract_skills_from_text(text, top_n=top_n)
    if skills:
        return {"skills": skills, "source": "patterns", "text_col": art.text_col}

    # Safe fallback: keywords -> whitelist
    keywords = top_terms_for_job(art, job_id=job_id, top_n=30)
    safe_skills = _filter_keywords_to_skills(keywords, top_n=top_n)

    if safe_skills:
        return {"skills": safe_skills, "source": "tfidf_filtered", "text_col": art.text_col}

    # Final: no skills found
    return {"skills": [], "source": "none", "text_col": art.text_col}