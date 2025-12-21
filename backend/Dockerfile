# LinkedIn Post Bot - Backend Dockerfile
# Build: docker build -t linkedin-bot-backend .
# Run:   docker run -p 8000:8000 --env-file ../.env linkedin-bot-backend

FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (better caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy services directory from parent (mounted at runtime or copied in CI)
# Note: In production, ensure services/ is available at /app/services
COPY ../services /app/services 2>/dev/null || true

# Add parent directory to Python path for services imports
ENV PYTHONPATH=/app:/app/..

# Create directory for SQLite databases
RUN mkdir -p /data

# Environment variables (override with -e or --env-file)
ENV PORT=8000
ENV TOKEN_DB_PATH=/data/tokens.db
ENV USER_SETTINGS_DB_PATH=/data/user_settings.db
ENV POST_HISTORY_DB_PATH=/data/post_history.db

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run the application
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
