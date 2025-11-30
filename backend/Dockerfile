# Use a small Python image
FROM python:3.12-slim

# Prevent Python from writing .pyc files and buffering logs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Set workdir inside the container
WORKDIR /app

# Install system deps (optional but useful for some libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . /app

# Fly will send secrets as env vars – we DON'T copy .env
# Container will listen on port 8080
ENV PORT=8080

# Use gunicorn to serve the Flask app (backend.py -> app)
CMD ["gunicorn", "-b", "0.0.0.0:8080", "backend:app"]
