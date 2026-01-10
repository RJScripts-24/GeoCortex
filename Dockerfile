# GeoCortex Backend - Google Cloud Run Dockerfile
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies for some Python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for better Docker layer caching)
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source files
COPY server.py solar_engine.py ./




# Copy .env file for environment variables
# Note: For production, use Cloud Run environment variables instead
COPY .env ./

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Run the server
CMD ["python", "server.py"]
