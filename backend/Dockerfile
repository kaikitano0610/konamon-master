# konamon-master/backend/Dockerfile
FROM python:3.9-slim-buster

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# backendディレクトリ内の全てのソースコードをコピー
# .env.backend は volumes でマウントするので、ここでは COPY しない
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]