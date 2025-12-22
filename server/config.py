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

