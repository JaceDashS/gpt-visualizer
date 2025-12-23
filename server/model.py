import os
from pathlib import Path
from huggingface_hub import hf_hub_download

# llama_cpp는 런타임에 사용되므로 lazy import 사용
_llama_cpp_module = None

def _import_llama_cpp():
    """llama_cpp 모듈을 lazy import"""
    global _llama_cpp_module
    if _llama_cpp_module is None:
        try:
            import llama_cpp
            _llama_cpp_module = llama_cpp
        except ImportError:
            raise ImportError(
                "llama_cpp module not found. "
                "Please ensure llama-cpp-python is installed. "
                "It should be installed from requirements.txt."
            )
    return _llama_cpp_module.Llama

# Hugging Face 모델 설정
HF_REPO_ID = "bartowski/Llama-3.2-1B-Instruct-GGUF"
HF_FILENAME = "Llama-3.2-1B-Instruct-Q4_K_M.gguf"

# 로컬 모델 저장 경로
MODELS_DIR = Path(__file__).parent / "models"
MODELS_DIR.mkdir(exist_ok=True)
GGUF_PATH = MODELS_DIR / HF_FILENAME


def download_model_from_hf():
    """Download model from Hugging Face"""
    # 로컬 파일이 있으면 다운로드 스킵
    if GGUF_PATH.exists():
        print(f"Model already exists: {GGUF_PATH}")
        return str(GGUF_PATH)
    
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
    
    # llama_cpp import (lazy)
    Llama = _import_llama_cpp()
    
    # 먼저 로컬 models/ 폴더에서 모델 파일 확인
    if not GGUF_PATH.exists():
        print(f"Model not found at {GGUF_PATH}, attempting to download from Hugging Face...")
        try:
            download_model_from_hf()
        except Exception as e:
            print(f"Failed to download model: {e}")
            raise FileNotFoundError(
                f"Model file not found: {GGUF_PATH}\n"
                f"Download from Hugging Face also failed: {e}"
            )
    else:
        print(f"Using existing model from local models/ folder: {GGUF_PATH}")
    
    # 모델 파일 존재 확인
    if not GGUF_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {GGUF_PATH}")
    
    print(f"Loading model from: {GGUF_PATH}")
    # 스레드 수 설정: 환경 변수가 있으면 사용, 없으면 CPU 코어 수 또는 기본값 2
    # 허깅페이스가 2vcpu가 프리티어라서 아마 2로하는게 제일 좋을거임
    n_threads = int(os.getenv("LLAMA_N_THREADS", os.cpu_count() or 2))
    print(f"Using {n_threads} threads for model inference")
    llama = Llama(
        model_path=str(GGUF_PATH),
        n_ctx=4096,
        n_threads=n_threads,
        n_gpu_layers=0,
        chat_format="llama-3",
        embedding=True,  # Enable embedding extraction
        verbose=False,
    )
    
    print("Model loading completed")
    return llama


# Load model (lazy loading - will be loaded on first request if not already loaded)
llama = None
_model_loading = False
_model_load_error = None

def ensure_model_loaded():
    """Ensure model is loaded, load if not already loaded"""
    global llama, _model_loading, _model_load_error
    
    if llama is not None:
        return True
    
    if _model_loading:
        # Model is currently loading, wait a bit
        import time
        time.sleep(1)
        return llama is not None
    
    if _model_load_error:
        # Previous load attempt failed
        return False
    
    try:
        _model_loading = True
        print("Model not loaded, loading now...")
        llama = load_gguf_model()
        _model_loading = False
        return True
    except Exception as e:
        _model_loading = False
        _model_load_error = str(e)
        print(f"Model load failed: {e}")
        import traceback
        traceback.print_exc()
        return False

# 모듈 레벨에서 자동 로드 제거 - startup_event나 첫 요청 시 로드
# 이렇게 하면 빌드 타임에 download_model_from_hf()만 실행하고 llama_cpp는 import하지 않음
