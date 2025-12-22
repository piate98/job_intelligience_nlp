FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

# Copy backend folder contents: app/, models/, etc.
COPY . /app

RUN test -f /app/models/jobs_reference.pkl && \
    test -f /app/models/tfidf_vectorizer.pkl && \
    test -f /app/models/tfidf_matrix.pkl

ENV PORT=8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]