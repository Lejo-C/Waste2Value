from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select, desc
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models import SensorReading
from app.schemas.schemas import SensorReadingCreate, SensorReadingOut, DispatchRequest, DispatchResponse
from app.services.simulator import generate_reading
from app.services.optimizer import optimize_dispatch
from app.services.report import build_report

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "service": "Waste2Value API"}

@router.get("/sensors/latest", response_model=list[SensorReadingOut])
def latest_sensors(limit: int = 60, db: Session = Depends(get_db)):
    rows = db.scalars(select(SensorReading).order_by(desc(SensorReading.timestamp)).limit(limit)).all()
    return list(reversed(rows))

@router.post("/sensors", response_model=SensorReadingOut)
def ingest_sensor(payload: SensorReadingCreate, db: Session = Depends(get_db)):
    item = SensorReading(**payload.model_dump(exclude_none=True), timestamp=payload.timestamp or datetime.now(timezone.utc))
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/sensors/simulate", response_model=SensorReadingOut)
def simulate_sensor(db: Session = Depends(get_db)):
    item = SensorReading(**generate_reading())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.post("/dispatch", response_model=DispatchResponse)
def dispatch(payload: DispatchRequest):
    return optimize_dispatch(**payload.model_dump())

@router.get("/report")
def report():
    metrics = optimize_dispatch()
    stream = build_report(metrics)
    return StreamingResponse(stream, media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=waste2value_report.pdf"})
