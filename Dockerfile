FROM python:3.11-slim

# System deps for building native extensions
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       build-essential cmake libboost-all-dev libmysqlclient-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt

COPY . /app

ENV FLASK_APP=backend.app:create_app
ENV FLASK_ENV=production

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "backend.app:create_app()"]
