# konamon-master/backend/Dockerfile
FROM python:3.9-slim-buster

WORKDIR /code

COPY backend/requirements.txt backend/requirements.txt

RUN pip install --no-cache-dir -r backend/requirements.txt

# アプリケーションのソースコードをコピーします
# これにより、`backend`ディレクトリがコンテナのWORKDIR(/code)内に作成されます
COPY backend/ backend/

ENV PYTHONPATH=/app

EXPOSE 5000

CMD ["flask", "run", "--host=0.0.0.0", "--port=5000"]