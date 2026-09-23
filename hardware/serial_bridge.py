"""Optional USB serial bridge.

Reads the ESP32 CSV stream and posts readings to the FastAPI backend.
Change COM3 and add the API URL before running.
"""
import time
import requests
import serial

SERIAL_PORT = "COM3"
BAUD = 115200
API_URL = "http://localhost:8000/api/sensors"

with serial.Serial(SERIAL_PORT, BAUD, timeout=2) as ser:
    while True:
        line = ser.readline().decode(errors="ignore").strip()
        if not line:
            continue
        try:
            hot, cold, voltage, current, power = map(float, line.split(","))
            payload = {
                "hot_temp": hot,
                "cold_temp": cold,
                "voltage": voltage,
                "current_ma": current,
                "power_mw": power,
                "it_load_kw": 0,
                "heat_available_kwh": max(0, (hot - cold) * 0.42),
                "electricity_price": 6.0,
                "heating_demand_kwh": 10.0,
            }
            requests.post(API_URL, json=payload, timeout=2)
        except (ValueError, requests.RequestException):
            time.sleep(0.1)
