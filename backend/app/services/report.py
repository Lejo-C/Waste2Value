from io import BytesIO
from datetime import datetime, timezone
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


def build_report(metrics: dict) -> BytesIO:
    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    c.setTitle("Waste2Value Compliance Report")
    c.setFillColorRGB(0.231, 0.255, 0.235)
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, 790, "Waste2Value Compliance Report")
    c.setFont("Helvetica", 10)
    c.setFillColorRGB(0.35, 0.38, 0.36)
    c.drawString(50, 770, datetime.now(timezone.utc).strftime("Generated %Y-%m-%d %H:%M UTC"))
    rows = [
        ("Total heat available", f"{metrics['total_heat_available']:.1f} kWh"),
        ("Heat stored", f"{metrics['total_stored']:.1f} kWh"),
        ("Heat released", f"{metrics['total_released']:.1f} kWh"),
        ("Heat boosted", f"{metrics['total_boosted']:.1f} kWh"),
        ("Heat vented", f"{metrics['total_vented']:.1f} kWh"),
        ("Baseline cost", f"₹{metrics['baseline_cost']:.2f}"),
        ("Optimized cost", f"₹{metrics['optimized_cost']:.2f}"),
        ("Estimated cost saved", f"₹{metrics['cost_saved']:.2f}"),
        ("Estimated CO2 avoided", f"{metrics['carbon_avoided_kg']:.2f} kg"),
    ]
    y = 710
    for label, value in rows:
        c.setFillColorRGB(0.96, 0.97, 0.96)
        c.rect(50, y - 5, 495, 28, fill=1, stroke=0)
        c.setFillColorRGB(0.15, 0.16, 0.15)
        c.setFont("Helvetica", 10)
        c.drawString(62, y + 5, label)
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(530, y + 5, value)
        y -= 36
    c.setFillColorRGB(0.231, 0.255, 0.235)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, 350, "Note")
    c.setFillColorRGB(0.35, 0.38, 0.36)
    c.setFont("Helvetica", 9)
    c.drawString(50, 332, "Values are generated from the prototype dispatch model and sensor/simulation inputs.")
    c.drawString(50, 318, "Use site-specific measurement and regulatory definitions for production reporting.")
    c.save()
    buffer.seek(0)
    return buffer
