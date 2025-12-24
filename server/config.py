import os

# 서버 설정
SERVER_HOST = os.getenv("SERVER_HOST", "0.0.0.0") #모든 네트워크 인터페이스에서 수신 가능
SERVER_PORT = int(os.getenv("SERVER_PORT", "7860"))

# CORS 설정
CORS_ORIGINS = [
    "http://localhost:3000", 
    # 프로덕션 환경에서는 실제 도메인 추가
]

# API 설정
API_VERSION = "1.0.0"
SERVICE_NAME = "GPT Visualizer"

# 모델 스레드 설정
# 환경변수 LLAMA_N_THREADS로 오버라이드 가능 (Docker에서는 ENV로 설정)
# 기본값: 1 (로컬과 Docker 모두)
LLAMA_N_THREADS = int(os.getenv("LLAMA_N_THREADS", "1"))

