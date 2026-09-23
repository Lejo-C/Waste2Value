from datetime import datetime, timezone
import math
import random


def generate_reading(step: int = 0) -> dict:
    hour = (datetime.now().hour + step / 30) % 24
    daily = math.sin((hour - 7) / 24 * 2 * math.pi)
    peak = max(0, math.sin((hour - 8) / 12 * math.pi))
    it_load = 450 + 180 * max(0, daily) + random.uniform(-18, 18)
    hot = 68 + 7 * peak + random.uniform(-0.8, 0.8)
    cold = 39 + 4 * peak + random.uniform(-0.6, 0.6)
    voltage = max(0.4, 1.7 + (hot - cold) * 0.045 + random.uniform(-0.06, 0.06))
    current = max(20, 65 + (hot - cold) * 5 + random.uniform(-8, 8))
    power = voltage * current
    heat = max(2, (hot - cold) * 0.42 + random.uniform(-0.5, 0.5))
    price = 4.2 + 2.2 * max(0, math.sin((hour - 8) / 24 * 2 * math.pi)) + (1.8 if 18 <= hour <= 21 else 0)
    demand = max(1, 6 + 8 * peak + random.uniform(-0.8, 0.8))
    return {
        "timestamp": datetime.now(timezone.utc),
        "hot_temp": round(hot, 2),
        "cold_temp": round(cold, 2),
        "voltage": round(voltage, 3),
        "current_ma": round(current, 2),
        "power_mw": round(power, 2),
        "it_load_kw": round(it_load, 2),
        "heat_available_kwh": round(heat, 2),
        "electricity_price": round(price, 2),
        "heating_demand_kwh": round(demand, 2),
    }
