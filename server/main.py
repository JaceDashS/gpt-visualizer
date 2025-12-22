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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": API_VERSION
    }


@app.post("/api/visualize", response_model=VisualizeResponse)
async def visualize_endpoint(request: VisualizeRequest):
    """Visualize endpoint"""
    return await visualize(request)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=SERVER_HOST, port=SERVER_PORT)
