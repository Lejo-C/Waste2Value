from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.session import Base, engine
from app.models import SensorReading, DispatchRun
from app.api.routes import router

app = FastAPI(title="Waste2Value API", version="0.1.0")
origins = [x.strip() for x in settings.cors_origins.split(",") if x.strip()]
app.add_middleware(CORSMiddleware, allow_origins=origins, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
Base.metadata.create_all(bind=engine)
app.include_router(router, prefix="/api")

@app.get("/")
def root():
    return {"name": "Waste2Value", "status": "running"}
