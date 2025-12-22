# Job Market Intelligence
An end-to-end Job Market Intelligence platform that analyzes job postings using Natural Language Processing (NLP) to extract, classify,
and aggregate required skills — both per job and across the market.

The system consists of:
*	A Dockerized FastAPI backend deployed on Render
*	A Vite-based frontend deployed on Netlify
* A pretrained NLP pipeline using TF-IDF and pattern-based extraction


Live Demo
https://job-market-int.netlify.app

## Project Architecture


### Backend (FastAPI + Docker + Render)

Why Docker Was Used

The backend is deployed to Render using Docker to ensure:
* Identical environments between local development and production
* Reliable packaging of NLP models (.pkl files)
*	No runtime model downloads or retraining
*	Reproducible, production-grade ML deployment

This mirrors real-world ML system deployment practices.

**Render automatically:
	1.	Detects the Dockerfile
	2.	Builds the image
	3.	Runs the container as a managed web service

⸻

## Backend API Responsibilities
* Serve job listings
* Perform NLP inference
*	Return skill breakdowns
*	Aggregate skills across multiple jobs

⸻

# NLP Pipeline (Core Intelligence)

The NLP system is precomputed offline and loaded at runtime.

Steps
## Text preprocessing
* Lowercasing
* Tokenization
* Noise removal
##	TF-IDF Vectorization
* Captures keyword importance across job descriptions
* Used for similarity and relevance scoring
##	Skill Extraction
*	Keyword & pattern-based matching
* Mapped into categories:
* Programming
* Data / SQL
* ML / AI
* Cloud / DevOps
* Visualization
## Precomputed Artifacts
* tfidf_vectorizer.pkl
* tfidf_matrix.pkl
* jobs_reference.pkl



## Frontend (Netlify)
* Built with React
* Communicates with the backend via REST API
* Deployed as a static site on Netlify
* Backend URL configured via environment variables

# Understanding the Visualizations


## Job-Level Skill Intelligence

<img width="1445" height="742" alt="job" src="https://github.com/user-attachments/assets/3d10dad2-109d-428d-87df-bb920da93e9d" />

What you see:
*	A selected job (e.g. Senior Data Scientist)
*	Skill breakdown for that specific job
* Detected skills shown as tags

What’s happening under the hood:
* NLP is applied to one job description
* Skills are extracted and categorized
* Counts represent how often skills appear in that job

Purpose:

Helps candidates understand exactly what skills a specific role demands


<img width="1444" height="750" alt="work" src="https://github.com/user-attachments/assets/6d3893d7-6be5-4f39-a6e9-d000f2b2a2c6" />

What you see:
*	Skills aggregated across multiple jobs (e.g. 50)
* Frequency-based ranking of top skills
* Category-level distributions


What’s happening under the hood:
* NLP runs across all currently loaded jobs
* Skill mentions are aggregated
* Results show market demand, not a single role

Purpose:

Helps users understand what the market is actually asking for, not just one job
Tech Stack

##Backend
* FastAPI
*	Render

## Frontend
* React 
* JavaScript
* Axios
* Netlify


## Summary

Job Market Intelligence is a full-stack NLP system that turns raw job descriptions into actionable insights,
using production-ready ML deployment practices.











