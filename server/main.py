"""
HTTP Server for GPT Token Visualizer
Entry point for the visualization server using Python's built-in HTTP server.
"""
import json
import sys
from typing import Dict, Any
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse

from config import SERVER_HOST, SERVER_PORT, API_VERSION, SERVICE_NAME
from model import ensure_model_loaded, llama, GGUF_PATH


class VisualizeHandler(BaseHTTPRequestHandler):
    """HTTP handler for visualization endpoints"""
    
    def _set_cors_headers(self):
        """Set CORS headers"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def do_OPTIONS(self):
        """Handle OPTIONS request for CORS"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/health':
            self._handle_health()
        else:
            self._send_error(404, "Not Found")
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/visualize':
            self._handle_visualize()
        else:
            self._send_error(404, "Not Found")
    
    def _handle_health(self):
        """Handle health check endpoint"""
        from model import llama
        response = {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": API_VERSION,
            "model_loaded": llama is not None
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
                self._send_error(400, "input_text is required")
                return
            
            # Ensure model is loaded
            if not ensure_model_loaded():
                self._send_error(503, "Model is not loaded. Please try again later.")
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
            
        except json.JSONDecodeError:
            self._send_error(400, "Invalid JSON in request body")
        except Exception as e:
            print(f"[ERROR] Visualize endpoint error: {e}")
            import traceback
            traceback.print_exc()
            self._send_error(500, f"Internal server error: {str(e)}")
    
    def _send_json_response(self, status_code: int, data: Dict[str, Any]):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        
        response_json = json.dumps(data, ensure_ascii=False)
        self.wfile.write(response_json.encode('utf-8'))
    
    def _send_error(self, status_code: int, message: str):
        """Send error response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self._set_cors_headers()
        self.end_headers()
        
        error_response = {"error": message, "status_code": status_code}
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
