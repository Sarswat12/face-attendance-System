FROM python:3.11-slim

# System deps for building native extensions
RUN apt-get update \
     && apt-get install -y --no-install-recommends \
         build-essential cmake libboost-all-dev \
         libmariadb-dev-compat libmariadb-dev python3-dev \
         pkg-config libssl-dev libffi-dev \
     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

COPY . /app

ENV FLASK_ENV=production
ENV PYTHONUNBUFFERED=1

# Gunicorn directly runs the create_app factory from backend.app module.
# The manage module at repo root exposes: app = create_app()
# Gunicorn imports it as: manage:app
# Keep worker count low to fit Render's 512Mi service tier.
CMD ["gunicorn", "-w", "1", "--threads", "2", "-b", "0.0.0.0:8000", "--timeout", "60", "--access-logfile", "-", "--error-logfile", "-", "manage:app"]
