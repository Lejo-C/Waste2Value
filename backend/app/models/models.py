from datetime import datetime
from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from app.db.session import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    hot_temp: Mapped[float] = mapped_column(Float)
    cold_temp: Mapped[float] = mapped_column(Float)
    voltage: Mapped[float] = mapped_column(Float)
    current_ma: Mapped[float] = mapped_column(Float)
    power_mw: Mapped[float] = mapped_column(Float)
    it_load_kw: Mapped[float] = mapped_column(Float)
    heat_available_kwh: Mapped[float] = mapped_column(Float)
    electricity_price: Mapped[float] = mapped_column(Float)
    heating_demand_kwh: Mapped[float] = mapped_column(Float)

class DispatchRun(Base):
    __tablename__ = "dispatch_runs"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    horizon_hours: Mapped[int] = mapped_column(Integer)
    total_heat_available: Mapped[float] = mapped_column(Float)
    total_stored: Mapped[float] = mapped_column(Float)
    total_released: Mapped[float] = mapped_column(Float)
    total_boosted: Mapped[float] = mapped_column(Float)
    total_vented: Mapped[float] = mapped_column(Float)
    baseline_cost: Mapped[float] = mapped_column(Float)
    optimized_cost: Mapped[float] = mapped_column(Float)
    carbon_avoided_kg: Mapped[float] = mapped_column(Float)
