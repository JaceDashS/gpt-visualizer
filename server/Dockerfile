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

# 모델 디렉토리 생성
RUN mkdir -p models

# 모델 다운로드를 위해 model.py 먼저 복사 (다운로드 함수 사용)
COPY model.py .

# 빌드 타임에 모델 다운로드
# download_model_from_hf() 함수가 로컬에 파일이 있으면 스킵하므로
# 로컬 models/ 폴더에 모델이 있으면 빌드 컨텍스트에 포함되어 COPY로 복사 가능
# (models/ 폴더가 .dockerignore에 없으면 빌드 컨텍스트에 포함됨)
# 로컬에 모델이 없으면 Hugging Face에서 다운로드
RUN python -c "from model import download_model_from_hf; download_model_from_hf()"

# 나머지 서버 코드 복사
COPY main.py .
COPY routes.py .
COPY utils.py .
COPY schemas.py .
COPY config.py .

# 도커 포트 설정
EXPOSE 7860
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=7860

# 모델 스레드 설정 (도커 환경에서는 1스레드 사용)
ENV LLAMA_N_THREADS=1

# Python 기본 HTTP 서버 사용
CMD ["python", "main.py"]
