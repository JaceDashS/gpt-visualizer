import os
from pathlib import Path
from huggingface_hub import hf_hub_download

# llama_cpp는 런타임에 사용되므로 lazy import 사용
_llama_cpp_module = None

def _import_llama_cpp():
    """llama_cpp 모듈을 lazy import"""
    global _llama_cpp_module
    # #region agent log
    import json
    import time
    import threading
    from pathlib import Path
    # 절대 경로 사용하여 로그 파일 생성
    project_root = Path(__file__).resolve().parent.parent
    log_dir = project_root / ".cursor"
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / "debug.log"
    def debug_log(location, message, data, hypothesis_id):
        try:
            log_entry = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": hypothesis_id,
                "location": location,
                "message": message,
                "data": data,
                "timestamp": int(time.time() * 1000)
            }
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
                f.flush()  # 즉시 디스크에 쓰기
        except Exception as e:
            print(f"[DEBUG LOG ERROR] {e}")  # 로그 실패 시 출력
    debug_log("model.py:8", "_import_llama_cpp ENTRY", {"_llama_cpp_module_is_none": _llama_cpp_module is None, "thread_id": threading.get_ident()}, "B")
    # #endregion
    if _llama_cpp_module is None:
        try:
            # #region agent log
            debug_log("model.py:13", "BEFORE import llama_cpp", {}, "B")
            # #endregion
            import llama_cpp
            # #region agent log
            debug_log("model.py:15", "AFTER import llama_cpp", {"llama_cpp_module": str(type(llama_cpp)), "hasattr_Llama": hasattr(llama_cpp, "Llama")}, "B")
            # #endregion
            _llama_cpp_module = llama_cpp
        except ImportError as e:
            # #region agent log
            debug_log("model.py:17", "IMPORT ERROR", {"error": str(e)}, "B")
            # #endregion
            raise ImportError(
                "llama_cpp module not found. "
                "Please ensure llama-cpp-python is installed. "
                "It should be installed from requirements.txt."
            )
    # #region agent log
    debug_log("model.py:21", "_import_llama_cpp EXIT", {"returning_Llama_class": True}, "B")
    # #endregion
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
    # #region agent log
    import json
    import time
    import threading
    import os
    from pathlib import Path
    # 절대 경로 사용하여 로그 파일 생성
    project_root = Path(__file__).resolve().parent.parent
    log_dir = project_root / ".cursor"
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / "debug.log"
    def debug_log(location, message, data, hypothesis_id):
        try:
            log_entry = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": hypothesis_id,
                "location": location,
                "message": message,
                "data": data,
                "timestamp": int(time.time() * 1000)
            }
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
                f.flush()  # 즉시 디스크에 쓰기
        except Exception as e:
            print(f"[DEBUG LOG ERROR] {e}")  # 로그 실패 시 출력
    debug_log("model.py:95", "load_gguf_model ENTRY", {"thread_id": threading.get_ident(), "thread_name": threading.current_thread().name, "os_name": os.name, "cpu_count": os.cpu_count()}, "C")
    # #endregion
    print("Loading GGUF model...")
    
    # llama_cpp import (lazy)
    # #region agent log
    debug_log("model.py:60", "BEFORE _import_llama_cpp", {}, "B")
    # #endregion
    Llama = _import_llama_cpp()
    # #region agent log
    debug_log("model.py:62", "AFTER _import_llama_cpp", {"Llama_class": str(type(Llama))}, "B")
    # #endregion
    
    # 먼저 로컬 models/ 폴더에서 모델 파일 확인
    # #region agent log
    debug_log("model.py:65", "CHECKING MODEL FILE", {"gguf_path": str(GGUF_PATH), "exists": GGUF_PATH.exists(), "is_file": GGUF_PATH.is_file() if GGUF_PATH.exists() else False}, "D")
    # #endregion
    if not GGUF_PATH.exists():
        print(f"Model not found at {GGUF_PATH}")
        print(f"Attempting to download model from Hugging Face...")
        try:
            # 모델이 없으면 Hugging Face에서 자동 다운로드
            downloaded_path = download_model_from_hf()
            print(f"Model downloaded successfully: {downloaded_path}")
        except Exception as e:
            print(f"Failed to download model: {e}")
            raise FileNotFoundError(
                f"Model file not found: {GGUF_PATH}\n"
                f"Automatic download from Hugging Face also failed: {e}\n"
                f"Please check your internet connection and try again."
            )
    else:
        print(f"Using existing model from local models/ folder: {GGUF_PATH}")
    
    print(f"Loading model from: {GGUF_PATH}")
    # 스레드 수 설정: chat_llama_q4km.py 참고 (성공적으로 작동하는 설정)
    # chat_llama_q4km.py에서 n_threads=8로 고정하여 성공적으로 실행됨
    # Windows에서는 access violation 방지를 위해 8로 고정
    n_threads = 8
    print(f"Using {n_threads} threads for model inference")
    
    # #region agent log
    debug_log("model.py:80", "BEFORE Llama() CONSTRUCTOR", {"model_path": str(GGUF_PATH), "n_threads": n_threads, "n_ctx": 4096, "embedding": True}, "C")
    # #endregion
    
    # chat_llama_q4km.py의 성공적인 설정을 정확히 복사 (embedding=True 추가)
    try:
        llama = Llama(
            model_path=str(GGUF_PATH),
            n_ctx=4096,
            n_threads=n_threads,
            n_gpu_layers=0,     # CPU 전용이면 0
            chat_format="llama-3",
            embedding=True,    # Enable embedding extraction (필수)
        )
        # #region agent log
        debug_log("model.py:88", "AFTER Llama() CONSTRUCTOR SUCCESS", {"llama_object": str(type(llama))}, "C")
        # #endregion
    except Exception as e:
        # #region agent log
        debug_log("model.py:90", "Llama() CONSTRUCTOR FAILED", {"error_type": type(e).__name__, "error_message": str(e), "error_repr": repr(e)}, "C")
        # #endregion
        raise
    
    print("Model loading completed")
    # #region agent log
    debug_log("model.py:95", "load_gguf_model EXIT", {"returning_llama": llama is not None}, "C")
    # #endregion
    return llama


# Load model (lazy loading - will be loaded on first request if not already loaded)
llama = None
_model_loading = False
_model_load_error = None

def ensure_model_loaded():
    """Ensure model is loaded, load if not already loaded"""
    global llama, _model_loading, _model_load_error
    
    # #region agent log
    import json
    import time
    import threading
    from pathlib import Path
    # 절대 경로 사용하여 로그 파일 생성
    project_root = Path(__file__).resolve().parent.parent
    log_dir = project_root / ".cursor"
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / "debug.log"
    def debug_log(location, message, data, hypothesis_id):
        try:
            log_entry = {
                "sessionId": "debug-session",
                "runId": "run1",
                "hypothesisId": hypothesis_id,
                "location": location,
                "message": message,
                "data": data,
                "timestamp": int(time.time() * 1000)
            }
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry) + "\n")
                f.flush()  # 즉시 디스크에 쓰기
        except Exception as e:
            print(f"[DEBUG LOG ERROR] {e}")  # 로그 실패 시 출력
    debug_log("model.py:187", "ensure_model_loaded ENTRY", {"llama_is_none": llama is None, "_model_loading": _model_loading, "_model_load_error": _model_load_error}, "E")
    # #endregion
    
    if llama is not None:
        # #region agent log
        debug_log("model.py:103", "MODEL ALREADY LOADED", {}, "E")
        # #endregion
        return True
    
    if _model_loading:
        # Model is currently loading, wait a bit
        import time
        time.sleep(1)
        return llama is not None
    
    if _model_load_error:
        # Previous load attempt failed
        # #region agent log
        debug_log("model.py:113", "PREVIOUS LOAD ERROR EXISTS", {"error": _model_load_error}, "E")
        # #endregion
        return False
    
    try:
        _model_loading = True
        print("Model not loaded, loading now...")
        # #region agent log
        debug_log("model.py:118", "CALLING load_gguf_model", {}, "E")
        # #endregion
        llama = load_gguf_model()
        _model_loading = False
        # #region agent log
        debug_log("model.py:121", "load_gguf_model SUCCESS", {"llama_loaded": llama is not None}, "E")
        # #endregion
        return True
    except Exception as e:
        _model_loading = False
        _model_load_error = str(e)
        # #region agent log
        debug_log("model.py:125", "load_gguf_model EXCEPTION", {"error_type": type(e).__name__, "error_message": str(e), "error_repr": repr(e)}, "E")
        # #endregion
        print(f"Model load failed: {e}")
        import traceback
        traceback.print_exc()
        return False

# 모듈 레벨에서 자동 로드 제거 - startup_event나 첫 요청 시 로드
# 이렇게 하면 빌드 타임에 download_model_from_hf()만 실행하고 llama_cpp는 import하지 않음
