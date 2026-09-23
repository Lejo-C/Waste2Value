from datetime import datetime
from pydantic import BaseModel, Field

class SensorReadingCreate(BaseModel):
    timestamp: datetime | None = None
    hot_temp: float
    cold_temp: float
    voltage: float
    current_ma: float = 0
    power_mw: float
    it_load_kw: float = 0
    heat_available_kwh: float = 0
    electricity_price: float = 0
    heating_demand_kwh: float = 0

class SensorReadingOut(SensorReadingCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True

class DispatchRequest(BaseModel):
    horizon_hours: int = Field(default=24, ge=1, le=168)
    storage_start_kwh: float = Field(default=40, ge=0)
    storage_capacity_kwh: float = Field(default=100, gt=0)
    heat_pump_capacity_kwh: float = Field(default=25, gt=0)
    erf_minimum: float = Field(default=0.10, ge=0, le=1)

class DispatchPoint(BaseModel):
    hour: int
    heat_available: float
    charge: float
    release: float
    boost: float
    vent: float
    storage: float
    price: float
    demand: float

class DispatchResponse(BaseModel):
    horizon_hours: int
    points: list[DispatchPoint]
    total_heat_available: float
    total_stored: float
    total_released: float
    total_boosted: float
    total_vented: float
    baseline_cost: float
    optimized_cost: float
    cost_saved: float
    carbon_avoided_kg: float
