# FastAPI 관련 import는 모델 로드 후에 수행 (가설 H: import 시점에 내부 상태 변경)
from config import SERVER_HOST, SERVER_PORT, API_VERSION, SERVICE_NAME


def create_app():
    """FastAPI 앱 생성 함수 (모델 로드 후 호출)"""
    # #region agent log
    import json
    import time
    import threading
    from pathlib import Path
    log_path = Path(__file__).parent.parent / ".cursor" / "debug.log"
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
        except: pass
    debug_log("main.py:create_app", "CREATE_APP CALLED", {"thread_id": threading.get_ident()}, "H")
    # #endregion
    
    # FastAPI import를 함수 내부로 이동 (모델 로드 후에만 실행)
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from routes import visualize
    from schemas import VisualizeRequest, VisualizeResponse
    
    # #region agent log
    debug_log("main.py:create_app", "AFTER FastAPI IMPORTS", {}, "H")
    # #endregion
    
    app = FastAPI(title=SERVICE_NAME, version=API_VERSION)
    
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  
        allow_credentials=False, 
        allow_methods=["GET", "POST"],
        allow_headers=["*"],
    )
    
    @app.on_event("startup")
    async def startup_event():
        """Print server information on startup"""
        # #region agent log
        import json
        import time
        import threading
        import os
        from pathlib import Path
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
                    f.flush()
            except Exception as e:
                print(f"[DEBUG LOG ERROR] {e}")
        debug_log("main.py:startup_event", "STARTUP_EVENT ENTRY", {"thread_id": threading.get_ident(), "thread_name": threading.current_thread().name}, "J")
        # #endregion
        
        import sys
        from model import llama, GGUF_PATH
        
        # #region agent log
        debug_log("main.py:startup_event", "AFTER IMPORT MODEL", {"llama_is_none": llama is None}, "J")
        # #endregion
        
        model_loaded = llama is not None
        model_source_info = "LOCAL" if GGUF_PATH.exists() else "Not Found"
        
        # #region agent log
        debug_log("main.py:startup_event", "BEFORE MODEL CHECK", {"model_loaded": model_loaded, "model_source_info": model_source_info}, "J")
        # #endregion
        
        if model_loaded:
            model_size = GGUF_PATH.stat().st_size / (1024 * 1024)
            print(f"[STARTUP] Model loaded successfully from {model_source_info}")
            print(f"[STARTUP] Model path: {GGUF_PATH}")
            print(f"[STARTUP] Model size: {model_size:.2f} MB")
            # #region agent log
            debug_log("main.py:startup_event", "MODEL CHECK SUCCESS", {"model_size_mb": model_size}, "J")
            # #endregion
        else:
            print(f"[STARTUP] ERROR: Model failed to load")
            print(f"[STARTUP] Server will exit because model is required")
            # #region agent log
            debug_log("main.py:startup_event", "MODEL CHECK FAILED - EXITING", {}, "J")
            # #endregion
            sys.exit(1)
        
        host_display = SERVER_HOST if SERVER_HOST != "0.0.0.0" else "localhost"
        print(f"\n{'='*60}")
        print(f"{SERVICE_NAME} Server Started")
        print(f"Version: {API_VERSION}")
        print(f"Host: {SERVER_HOST}")
        print(f"Port: {SERVER_PORT}")
        print(f"Model Status: {'Loaded' if model_loaded else 'Not Loaded'}")
        if model_loaded:
            print(f"Model Source: {model_source_info}")
        print(f"API URL: http://{host_display}:{SERVER_PORT}")
        print(f"Health Check: http://{host_display}:{SERVER_PORT}/health")
        print(f"{'='*60}\n")
        
        # #region agent log
        debug_log("main.py:startup_event", "STARTUP_EVENT EXIT", {}, "J")
        # #endregion
    
    @app.get("/health")
    async def health_check():
        """Health check endpoint"""
        from model import llama
        return {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": API_VERSION,
            "model_loaded": llama is not None
        }
    
    @app.post("/api/visualize", response_model=VisualizeResponse)
    async def visualize_endpoint(request: VisualizeRequest):
        """Visualize endpoint"""
        return await visualize(request)
    
    # #region agent log
    debug_log("main.py:create_app", "CREATE_APP COMPLETE", {"app_created": app is not None}, "F")
    # #endregion
    
    return app


if __name__ == "__main__":
    import uvicorn
    import sys
    import threading
    from pathlib import Path
    from model import ensure_model_loaded, GGUF_PATH
    
    # #region agent log
    import os
    # 절대 경로 사용하여 로그 파일 생성
    project_root = Path(__file__).resolve().parent.parent
    log_dir = project_root / ".cursor"
    log_dir.mkdir(exist_ok=True)
    log_path = log_dir / "debug.log"
    # 각 실행마다 로그 파일 초기화 (덮어쓰기 모드로 시작)
    if log_path.exists():
        log_path.unlink()  # 기존 로그 파일 삭제
    print(f"[DEBUG] Log path: {log_path}")  # 디버깅용 출력
    def debug_log(location, message, data, hypothesis_id):
        try:
            import json
            import time
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
    debug_log("main.py:131", "MAIN BLOCK START", {"thread_id": threading.get_ident(), "thread_name": threading.current_thread().name, "log_path": str(log_path)}, "H")
    # #endregion
    
    print(f"\n{'='*60}")
    print(f"Starting {SERVICE_NAME} server...")
    print(f"Host: {SERVER_HOST}")
    print(f"Port: {SERVER_PORT}")
    print(f"API URL: http://{SERVER_HOST if SERVER_HOST != '0.0.0.0' else 'localhost'}:{SERVER_PORT}")
    print(f"{'='*60}\n")
    
    # #region agent log
    debug_log("main.py:135", "BEFORE MODEL LOAD (NO FASTAPI IMPORTS YET)", {"gguf_path": str(GGUF_PATH), "gguf_exists": GGUF_PATH.exists()}, "H")
    # #endregion
    
    # FastAPI 앱 생성 전에 모델 로드 (chat_llama_q4km.py와 동일한 환경)
    print("[MAIN] Loading model BEFORE FastAPI app creation...")
    print(f"GGUF_PATH: {GGUF_PATH}")
    
    # #region agent log
    debug_log("main.py:143", "CALLING ensure_model_loaded (BEFORE FASTAPI IMPORTS)", {}, "H")
    # #endregion
    
    if not ensure_model_loaded():
        # #region agent log
        debug_log("main.py:161", "MODEL LOAD FAILED (BEFORE FASTAPI IMPORTS)", {}, "H")
        # #endregion
        print(f"[MAIN] ERROR: Failed to load model from {GGUF_PATH}")
        print("[MAIN] Server will not start")
        sys.exit(1)
    
    # #region agent log
    debug_log("main.py:154", "MODEL LOAD SUCCESS (BEFORE FASTAPI IMPORTS)", {"model_loaded": True}, "H")
    debug_log("main.py:156", "BEFORE create_app() CALL (FASTAPI IMPORTS WILL HAPPEN INSIDE)", {}, "H")
    # #endregion
    
    # 모델 로드 성공 후 FastAPI 앱 생성 (FastAPI import는 create_app() 내부에서 수행)
    # #region agent log
    debug_log("main.py:159", "BEFORE create_app() CALL", {}, "H")
    # #endregion
    app = create_app()
    
    # #region agent log
    debug_log("main.py:163", "AFTER create_app() CALL", {"app_created": app is not None}, "H")
    debug_log("main.py:165", "BEFORE UVICORN.RUN", {}, "H")
    # #endregion
    
    print("[MAIN] Model loaded successfully, creating FastAPI app and starting server...")
    
    # #region agent log
    import json
    import time
    import threading
    import os
    from pathlib import Path
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
                f.flush()
        except Exception as e:
            print(f"[DEBUG LOG ERROR] {e}")
    debug_log("main.py:186", "CALLING UVICORN.RUN", {"host": SERVER_HOST, "port": SERVER_PORT, "thread_id": threading.get_ident()}, "I")
    # #endregion
    
    try:
        # Hypothesis M: uvicorn Server 객체를 직접 생성하여 더 세밀한 제어
        # uvicorn.run() 대신 Server 객체를 사용하여 서버 시작 과정을 더 자세히 추적
        # #region agent log
        debug_log("main.py:uvicorn.run", "UVICORN CONFIG", {"workers": None, "loop": "asyncio", "log_level": "info"}, "L")
        debug_log("main.py:uvicorn.run", "BEFORE UVICORN IMPORT", {}, "M")
        # #endregion
        
        from uvicorn import Server, Config
        
        # #region agent log
        debug_log("main.py:uvicorn.run", "AFTER UVICORN IMPORT", {}, "M")
        debug_log("main.py:uvicorn.run", "BEFORE CONFIG CREATION", {"host": SERVER_HOST, "port": SERVER_PORT}, "M")
        # #endregion
        
        # workers=None으로 설정하여 단일 프로세스 모드로 실행 (멀티프로세싱 비활성화)
        config = Config(
            app=app,
            host=SERVER_HOST,
            port=SERVER_PORT,
            workers=None,  # None으로 설정하여 단일 프로세스 모드
            loop="asyncio",
            log_level="info"
        )
        
        # #region agent log
        debug_log("main.py:uvicorn.run", "AFTER CONFIG CREATION", {"config_created": config is not None}, "M")
        debug_log("main.py:uvicorn.run", "BEFORE SERVER CREATION", {}, "M")
        # #endregion
        
        server = Server(config)
        
        # #region agent log
        debug_log("main.py:uvicorn.run", "AFTER SERVER CREATION", {"server_created": server is not None}, "M")
        debug_log("main.py:uvicorn.run", "BEFORE SERVER.RUN()", {"thread_id": threading.get_ident()}, "M")
        # #endregion
        
        # 서버 실행 시도 (이 시점에서 크래시 발생 가능)
        import sys
        print("[DEBUG] About to call server.run()...")
        sys.stdout.flush()  # 출력 버퍼 강제 플러시
        
        server.run()
        
        # #region agent log
        debug_log("main.py:uvicorn.run", "AFTER SERVER.RUN()", {}, "M")
        # #endregion
    except KeyboardInterrupt:
        # #region agent log
        debug_log("main.py:uvicorn.run", "KEYBOARD INTERRUPT", {}, "M")
        # #endregion
        raise
    except SystemExit as e:
        # #region agent log
        debug_log("main.py:uvicorn.run", "SYSTEM EXIT", {"exit_code": e.code}, "M")
        # #endregion
        raise
    except Exception as e:
        # #region agent log
        debug_log("main.py:uvicorn.run", "UVICORN.RUN EXCEPTION", {
            "error_type": type(e).__name__, 
            "error_message": str(e), 
            "error_repr": repr(e),
            "error_args": e.args if hasattr(e, 'args') else None
        }, "I")
        # #endregion
        import traceback
        traceback.print_exc()
        raise
    except BaseException as e:
        # access violation 같은 경우 BaseException으로 잡힐 수 있음
        # #region agent log
        debug_log("main.py:uvicorn.run", "BASE EXCEPTION", {
            "error_type": type(e).__name__, 
            "error_message": str(e), 
            "error_repr": repr(e)
        }, "M")
        # #endregion
        import traceback
        traceback.print_exc()
        raise
