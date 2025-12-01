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

ENV FLASK_APP=manage:app
ENV FLASK_ENV=production

# Use the `manage` module which exposes a module-level `app` variable
# so Gunicorn can import the WSGI application as `manage:app`.
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "manage:app"]
