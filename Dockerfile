# Stage 1: Build React Frontend
FROM node:18 AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install
COPY . .
RUN npm run build &&\
    mkdir -p /app/static && \
    cp -r /app/dist/* /app/static/

# Stage 2: Python Backend
FROM python:3.9
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends gcc python3-dev && \
    pip install --no-cache-dir gunicorn && \
    rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY . .

# Copy built React files
COPY --from=frontend-builder /app/dist /app/static

# Expose port and run
EXPOSE 8000
CMD ["gunicorn", "--bind", "0.0.0.0:80", "--access-logfile", "-", "--error-logfile", "-", "app:app"]