FROM python:3.11-slim

WORKDIR /app

# 빌드 의존성 (llama-cpp-python 빌드용)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc g++ build-essential \
    cmake \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 빌드 도구 제거(선택: 문제 생기면 일단 제거하지 말고 디버깅)
RUN apt-get purge -y gcc g++ build-essential cmake \
    && apt-get autoremove -y \
    && apt-get clean

# 서버 코드 복사
COPY main.py .
COPY model.py .
COPY routes.py .
COPY utils.py .
COPY schemas.py .
COPY config.py .

# 모델 디렉토리 생성 (런타임에 다운로드됨)
RUN mkdir -p models

# 도커 포트 설정
EXPOSE 7860
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=7860

# 모델 스레드 설정 (도커 환경에서는 2스레드 사용)
ENV LLAMA_N_THREADS=2

# FastAPI라면 uvicorn 권장
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
