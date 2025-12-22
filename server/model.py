import os
from pathlib import Path
from llama_cpp import Llama
from huggingface_hub import hf_hub_download

# Hugging Face 모델 설정
HF_REPO_ID = "bartowski/Llama-3.2-1B-Instruct-GGUF"
HF_FILENAME = "Llama-3.2-1B-Instruct-Q4_K_M.gguf"

# 로컬 모델 저장 경로
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)
GGUF_PATH = MODELS_DIR / HF_FILENAME


def download_model_from_hf():
    """Download model from Hugging Face"""
    # 로컬 파일 체크 (주석처리 - 무조건 Hugging Face에서 다운로드)
    # if GGUF_PATH.exists():
    #     print(f"Model already exists: {GGUF_PATH}")
    #     return str(GGUF_PATH)
    
    print(f"Downloading model from Hugging Face: {HF_REPO_ID}/{HF_FILENAME}")
    try:
        model_path = hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=HF_FILENAME,
            local_dir=str(MODELS_DIR),
            local_dir_use_symlinks=False,
        )
        print(f"Model download completed: {model_path}")
        return model_path
    except Exception as e:
        print(f"Model download failed: {e}")
        raise


def load_gguf_model():
    """Load GGUF model"""
    print("Loading GGUF model...")
    
    # 무조건 Hugging Face에서 다운로드
    download_model_from_hf()
    
    # 로컬 파일 체크 (주석처리 - 무조건 Hugging Face에서 다운로드)
    # if not GGUF_PATH.exists():
    #     download_model_from_hf()
    
    llama = Llama(
        model_path=str(GGUF_PATH),
        n_ctx=4096,
        n_threads=os.cpu_count() or 4,
        n_gpu_layers=0,
        chat_format="llama-3",
        embedding=True,  # Enable embedding extraction
        verbose=False,
    )
    
    print("Model loading completed")
    return llama


# Load model
llama = None
try:
    llama = load_gguf_model()
except Exception as e:
    print(f"Model load failed: {e}")
    llama = None

