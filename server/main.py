"""
HTTP Server for GPT Token Visualizer
Entry point for the visualization server using Python's built-in HTTP server.
"""
import json
import sys
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from datetime import datetime

from config import SERVER_HOST, SERVER_PORT, API_VERSION, SERVICE_NAME
from model import ensure_model_loaded, llama, GGUF_PATH


class VisualizeHandler(BaseHTTPRequestHandler):
    """HTTP handler for visualization endpoints"""
    
    def _log_request(self, method: str, path: str, status_code: int = None, reason: str = None):
        """Log all incoming requests with details"""
        client_ip = self.client_address[0] if self.client_address else 'unknown'
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        log_msg = f"[{timestamp}] {method} {path} | IP: {client_ip}"
        if status_code:
            log_msg += f" | Status: {status_code}"
        if reason:
            log_msg += f" | Reason: {reason}"
        
        print(log_msg)
        
        # Log headers for debugging
        if self.headers:
            headers_info = []
            for key, value in self.headers.items():
                if key.lower() in ['content-type', 'content-length', 'user-agent', 'host', 'origin', 'referer']:
                    headers_info.append(f"{key}: {value}")
            if headers_info:
                print(f"  Headers: {', '.join(headers_info)}")
    
    def _set_cors_headers(self):
        """Set CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        """Handle OPTIONS request for CORS"""
        parsed_path = urlparse(self.path)
        self._log_request('OPTIONS', parsed_path.path, 200, 'CORS preflight')
        
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        self._log_request('GET', parsed_path.path)
        
        if parsed_path.path == '/health' or parsed_path.path == '/':
            self._handle_health()
        else:
            reason = f"Path '{parsed_path.path}' is not supported. Supported paths: /, /health"
            self._send_error(404, "Not Found", reason)
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        self._log_request('POST', parsed_path.path)
        
        if parsed_path.path == '/api/visualize':
            self._handle_visualize()
        else:
            reason = f"Path '{parsed_path.path}' is not supported. Supported paths: /api/visualize"
            self._send_error(404, "Not Found", reason)
    
    def _handle_health(self):
        """Handle health check endpoint"""
        from model import llama, GGUF_PATH
        from pathlib import Path
        import os
        
        # 모델 파일 정보 확인
        model_exists = GGUF_PATH.exists()
        model_file_size = None
        model_built_at = None
        model_built_at_build_time = False
        
        if model_exists:
            model_file_size = GGUF_PATH.stat().st_size / (1024 * 1024)  # MB
            
            # 빌드 타임 마커 파일 확인
            build_marker = GGUF_PATH.parent / ".model_built_at"
            if build_marker.exists():
                model_built_at_build_time = True
                try:
                    with open(build_marker, 'r') as f:
                        model_built_at = f.read().strip()
                except Exception:
                    pass
        
        response = {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": API_VERSION,
            "model_loaded": llama is not None,
            "model": {
                "exists": model_exists,
                "built_at_build_time": model_built_at_build_time,
                "built_at": model_built_at,
                "file_size_mb": round(model_file_size, 2) if model_file_size else None,
                "path": str(GGUF_PATH)
            }
        }
        self._send_json_response(200, response)
    
    def _handle_visualize(self):
        """Handle visualize endpoint"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # Parse JSON request
            request_data = json.loads(body.decode('utf-8'))
            input_text = request_data.get('input_text', '')
            
            if not input_text:
                reason = "Request body must contain 'input_text' field with a non-empty value"
                self._send_error(400, "input_text is required", reason)
                return
            
            # Ensure model is loaded
            if not ensure_model_loaded():
                reason = "The AI model is not currently loaded. The server may still be initializing."
                self._send_error(503, "Model is not loaded. Please try again later.", reason)
                return
            
            # Import visualization logic (visualize_sync will use model.llama internally)
            from routes import visualize_sync
            from schemas import VisualizeRequest
            
            # Create request object
            request = VisualizeRequest(input_text=input_text)
            
            # Call synchronous visualization function
            response = visualize_sync(request)
            
            # Convert response to dict
            response_dict = {
                "tokens": [
                    {
                        "token": token.token,
                        "destination": token.destination,
                        "is_input": token.is_input
                    }
                    for token in response.tokens
                ]
            }
            
            self._send_json_response(200, response_dict)
            
        except json.JSONDecodeError as e:
            reason = f"Request body is not valid JSON: {str(e)}"
            self._send_error(400, "Invalid JSON in request body", reason)
        except Exception as e:
            print(f"[ERROR] Visualize endpoint error: {e}")
            import traceback
            traceback.print_exc()
            reason = f"An unexpected error occurred while processing the request: {str(e)}"
            self._send_error(500, f"Internal server error: {str(e)}", reason)
    
    def _send_json_response(self, status_code: int, data: Dict[str, Any]):
        """Send JSON response"""
        parsed_path = urlparse(self.path)
        self._log_request(self.command, parsed_path.path, status_code, 'Success')
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        
        response_json = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
    
    def _send_error(self, status_code: int, message: str, reason: str = None):
        """Send error response with detailed reason"""
        parsed_path = urlparse(self.path)
        
        error_response = {
            "error": message,
            "status_code": status_code,
            "path": parsed_path.path,
            "method": self.command
        }
        
        if reason:
            error_response["reason"] = reason
        
        # Add supported endpoints information for 404 errors
        if status_code == 404:
            if self.command == 'GET':
                error_response["supported_paths"] = ["/", "/health"]
            elif self.command == 'POST':
                error_response["supported_paths"] = ["/api/visualize"]
        
        self._log_request(self.command, parsed_path.path, status_code, reason or message)
        
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        
        response_json = json.dumps(error_response, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
    
    def log_message(self, format, *args):
        """Override to customize log format"""
        print(f"[HTTP] {format % args}")


def main():
    """Main entry point for the server"""
    print(f"\n{'='*60}")
    print(f"Starting {SERVICE_NAME} Server")
    print(f"Host: {SERVER_HOST}")
    print(f"Port: {SERVER_PORT}")
    print(f"{'='*60}\n")
    
    # Load model
    print("[SERVER] Loading model...")
    if not ensure_model_loaded():
        print(f"[SERVER] ERROR: Failed to load model from {GGUF_PATH}")
        print("[SERVER] Server will not start")
        sys.exit(1)
    
    if llama is not None:
        model_size = GGUF_PATH.stat().st_size / (1024 * 1024)
        print(f"[SERVER] Model loaded successfully")
        print(f"[SERVER] Model path: {GGUF_PATH}")
        print(f"[SERVER] Model size: {model_size:.2f} MB")
    
    # Create and start server
    server_address = (SERVER_HOST, SERVER_PORT)
    httpd = HTTPServer(server_address, VisualizeHandler)
    
    host_display = SERVER_HOST if SERVER_HOST != "0.0.0.0" else "localhost"
    print(f"\n{'='*60}")
    print(f"{SERVICE_NAME} Server Started")
    print(f"Version: {API_VERSION}")
    print(f"Host: {SERVER_HOST}")
    print(f"Port: {SERVER_PORT}")
    print(f"Model Status: {'Loaded' if llama is not None else 'Not Loaded'}")
    print(f"API URL: http://{host_display}:{SERVER_PORT}")
    print(f"Health Check: http://{host_display}:{SERVER_PORT}/health")
    print(f"{'='*60}\n")
    
    try:
        print(f"[SERVER] Server running on http://{SERVER_HOST}:{SERVER_PORT}")
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[SERVER] Shutting down server...")
        httpd.shutdown()
    except Exception as e:
        print(f"[SERVER] Server error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
