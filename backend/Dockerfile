FROM python:3.12-slim

WORKDIR /app

# Dépendances (couche cache séparée du code)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Code applicatif
COPY app ./app

# Dossier de données (base SQLite persistée via volume)
RUN mkdir -p /app/data

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
