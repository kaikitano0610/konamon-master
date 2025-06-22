# konamon-master/backend/Dockerfile
FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# backendディレクトリ内の全てのソースコードをコピー
# .env.backend は volumes でマウントするので、ここでは COPY しない
COPY . .

ENV PYTHONPATH=/app

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]