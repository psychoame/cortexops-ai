from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.logs import router as logs_router
from routes.analysis import router as analysis_router

app = FastAPI(title="CortexOps AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(logs_router, prefix="/api")
app.include_router(analysis_router, prefix="/api")

@app.get("/health")
def health():
    return {"status": "operational", "service": "CortexOps AI"}