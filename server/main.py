from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from config import SERVER_HOST, SERVER_PORT, API_VERSION, SERVICE_NAME
from routes import visualize
from schemas import VisualizeRequest, VisualizeResponse

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
    host_display = SERVER_HOST if SERVER_HOST != "0.0.0.0" else "localhost"
    print(f"\n{'='*60}")
    print(f"{SERVICE_NAME} Server Started")
    print(f"Version: {API_VERSION}")
    print(f"Host: {SERVER_HOST}")
    print(f"Port: {SERVER_PORT}")
    print(f"API URL: http://{host_display}:{SERVER_PORT}")
    print(f"Health Check: http://{host_display}:{SERVER_PORT}/health")
    print(f"{'='*60}\n")


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


if __name__ == "__main__":
    import uvicorn
    print(f"\n{'='*60}")
    print(f"Starting {SERVICE_NAME} server...")
    print(f"Host: {SERVER_HOST}")
    print(f"Port: {SERVER_PORT}")
    print(f"API URL: http://{SERVER_HOST if SERVER_HOST != '0.0.0.0' else 'localhost'}:{SERVER_PORT}")
    print(f"{'='*60}\n")
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
