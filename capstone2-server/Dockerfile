FROM python:3.10

# Set environment variables
ENV PYTHONUNBUFFERED=1 

# Install system dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends build-essential gcc curl wget postgresql-client && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt requirements.txt

# Create and activate virtual environment
RUN python -m venv /venv
ENV PATH="/venv/bin:$PATH"

# Install Python dependencies into the virtual environment
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application code
COPY . .

# Keep the container running
CMD ["tail", "-f", "/dev/null"]
