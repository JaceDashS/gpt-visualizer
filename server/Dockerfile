FROM python:3.11-slim

WORKDIR /app

# 빌드 의존성 설치 (llama-cpp-python 빌드에 필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 런타임 라이브러리 설치 (llama-cpp-python 실행에 필요)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# 빌드 도구 제거 (이미지 크기 최적화)
RUN apt-get purge -y \
    gcc \
    g++ \
    build-essential \
    && apt-get autoremove -y \
    && apt-get clean

# 서버 코드 복사
COPY main.py .
COPY model.py .
COPY routes.py .
COPY utils.py .
COPY schemas.py .
COPY config.py .

# 모델 파일 복사
COPY models/ ./models/

# 포트 노출
EXPOSE 8000

# 환경 변수 설정
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=8000

# 서버 실행
CMD ["python", "main.py"]

