
import os
import requests
import io
import random
from groq import Groq
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
import math

# Calculate area from bounding box coordinates
def calculate_area_sqm(bounds):
    """Calculate approximate area in square meters from lat/lng bounds"""
    lat1, lng1 = bounds['south'], bounds['west']
    lat2, lng2 = bounds['north'], bounds['east']
    
    # Haversine formula for approximate area
    R = 6371000  # Earth radius in meters
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    lng_diff = math.radians(lng2 - lng1)
    
    width = R * lng_diff * math.cos((lat1_rad + lat2_rad) / 2)
    height = R * (lat2_rad - lat1_rad)
    area = abs(width * height)
    return round(area, 2)

# Enhanced Solar Analysis with Groq AI
def analyze_solar_potential_with_ai(lat, lng, bounds, solar_api_key, groq_api_key):
    """
    Comprehensive solar analysis combining Google Solar API and Groq AI
    Returns formatted HTML for display in AI Consultant popup
    """
    area_sqm = calculate_area_sqm(bounds)
    area_sqft = round(area_sqm * 10.764, 2)
    url = f"https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude={lat}&location.longitude={lng}&requiredQuality=HIGH&key={solar_api_key}"
    print(f"[DEBUG] Calling Google Solar API: {url[:100]}...")
    is_simulated = False
    try:
        response = requests.get(url)
        print(f"[DEBUG] Google Solar API response status: {response.status_code}")
        data = response.json()
        print(f"[DEBUG] Google Solar API response keys: {list(data.keys())}")
        if "error" in data:
            print("Region not supported, switching to Simulation Mode")
            solar_potential = generate_mock_solar_data()
            is_simulated = True
        else:
            solar_potential = data.get("solarPotential", {})
            if not solar_potential:
                print("No solarPotential in response, switching to Simulation Mode")
                solar_potential = generate_mock_solar_data()
                is_simulated = True
        panels_count = solar_potential.get("maxArrayPanelsCount", 0)
        yearly_energy = solar_potential.get("yearlyEnergyDcKwh", 0)
        panel_capacity_watts = solar_potential.get("panelCapacityWatts", 400)
        install_cost = panels_count * 25000
        annual_savings = yearly_energy * 8
        breakeven_years = round(install_cost / annual_savings, 1) if annual_savings > 0 else 0
        co2_saved = round(yearly_energy * 0.4, 1)
        client = Groq(api_key=groq_api_key)
        prompt = f"""Analyze this rooftop solar installation opportunity in India:

Location: {lat}, {lng}
Selected Area: {area_sqm} m² ({area_sqft} sq ft)
Max Solar Panels: {panels_count} panels
Panel Capacity: {panel_capacity_watts}W each
Yearly Energy Generation: {yearly_energy} kWh
Installation Cost: ₹{install_cost:,}
Annual Savings: ₹{annual_savings:,}
Break-even: {breakeven_years} years
CO2 Offset: {co2_saved} kg/year

Provide a concise analysis with:
1. Is this a good investment? (Yes/No and why)
2. Key benefits for this specific installation
3. Three actionable next steps for the property owner

Keep it brief, practical, and India-focused."""
        ai_response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )
        ai_analysis = ai_response.choices[0].message.content
        sim_banner = ""
        if is_simulated:
            sim_banner = (
                '<div style="color:#ff3333;font-weight:bold;font-size:1.1rem;margin-bottom:10px">'
                '[DEMO MODE: SIMULATED DATA]<br>'
                '<span style="font-size:0.95rem;font-weight:normal">'
                'Solar data for this region is not yet available from Google. This is a simulated analysis for demonstration purposes. '
                'As Google expands coverage in India, this feature will become fully operational.</span></div>'
            )
        html_output = f"""
        {sim_banner}
        <div style="font-size:1.2rem;font-weight:bold;line-height:2;">☀️ <span style='font-size:1.3rem;'>Solar Energy Analysis</span></div>
        <div style="margin-top:1rem;">
            <div style="font-size:1.1rem;font-weight:bold;">📍 Location:</div>
            <div style="font-size:1rem;margin-bottom:0.5rem;">{lat}, {lng}</div>
            <div style="font-size:1.1rem;font-weight:bold;">📐 Selected Area:</div>
            <div style="font-size:1rem;margin-bottom:0.5rem;">{area_sqm} m² ({area_sqft} sq ft)</div>
            <div style="font-size:1.1rem;font-weight:bold;">⚡ Solar Potential:</div>
            <div style="font-size:1rem;margin-bottom:0.5rem;">
                • Max Panels: <b>{panels_count}</b><br>
                • Yearly Generation: <b>{yearly_energy:,} kWh</b><br>
                • CO₂ Offset: <b>{co2_saved} kg/year</b>
            </div>
            <div style="font-size:1.1rem;font-weight:bold;">💰 Financial Analysis:</div>
            <div style="font-size:1rem;margin-bottom:0.5rem;">
                • Installation Cost: <b style="color:#ff8b13;">₹{install_cost:,}</b><br>
                • Annual Savings: <b style="color:#3ae237;">₹{annual_savings:,}</b><br>
                • Break-even: <b>{breakeven_years} years</b>
            </div>
        </div>
        <div style="font-size:1.1rem;font-weight:bold;margin-top:1rem;">🤖 AI Investment Analysis:</div>
        <div style="font-size:1rem;line-height:1.6;margin-top:0.5rem;">{ai_analysis.replace(chr(10), '<br/>')}</div>
        """
        raw_data = data if not is_simulated else {"simulated": True, "solarPotential": solar_potential}
        return html_output, None, raw_data
    except Exception as e:
        return None, str(e), None


# --- Simulation Fallback for Demo Mode ---
def generate_mock_solar_data():
    """Generate realistic, slightly randomized solar data for demo purposes."""
    panels_count = random.randint(15, 40)
    panel_capacity_watts = 400
    yearly_energy = panels_count * random.randint(420, 480)  # kWh per panel
    install_cost = panels_count * 25000
    annual_savings = yearly_energy * 8
    breakeven_years = round(install_cost / annual_savings, 1) if annual_savings > 0 else 0
    co2_saved = round(yearly_energy * 0.4, 1)
    return {
        "maxArrayPanelsCount": panels_count,
        "yearlyEnergyDcKwh": yearly_energy,
        "panelCapacityWatts": panel_capacity_watts,
        "install_cost": install_cost,
        "annual_savings": annual_savings,
        "breakeven_years": breakeven_years,
        "co2_saved": co2_saved
    }

def analyze_solar_potential(lat, lng, api_key):
    """PDF generation function with simulation fallback."""
    url = f"https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude={lat}&location.longitude={lng}&requiredQuality=HIGH&key={api_key}"
    is_simulated = False
    try:
        response = requests.get(url)
        data = response.json()
        if "error" in data:
            print("Region not supported, switching to Simulation Mode")
            solar_data = generate_mock_solar_data()
            is_simulated = True
        else:
            solar_potential = data.get("solarPotential", {})
            solar_data = {
                "maxArrayPanelsCount": solar_potential.get("maxArrayPanelsCount", 0),
                "yearlyEnergyDcKwh": solar_potential.get("yearlyEnergyDcKwh", 0),
                "panelCapacityWatts": solar_potential.get("panelCapacityWatts", 400),
            }
            solar_data["install_cost"] = solar_data["maxArrayPanelsCount"] * 25000
            solar_data["annual_savings"] = solar_data["yearlyEnergyDcKwh"] * 8
            solar_data["breakeven_years"] = round(solar_data["install_cost"] / solar_data["annual_savings"], 1) if solar_data["annual_savings"] > 0 else 0
            solar_data["co2_saved"] = round(solar_data["yearlyEnergyDcKwh"] * 0.4, 1)
        buffer = generate_pdf(lat, lng, solar_data, is_simulated)
        return buffer, None
    except Exception as e:
        print(f"[ERROR] analyze_solar_potential: {e}")
        # Fallback to simulation if any error occurs
        solar_data = generate_mock_solar_data()
        is_simulated = True
        buffer = generate_pdf(lat, lng, solar_data, is_simulated)
        return buffer, None

def generate_pdf(lat, lng, solar_data, is_simulated=False):
    """Generate a PDF report, marking DEMO MODE if simulated."""
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    y = 750
    if is_simulated:
        p.setFont("Helvetica-Bold", 14)
        p.setFillColor(colors.red)
        p.drawString(100, y, "[DEMO MODE: SIMULATED DATA]")
        p.setFillColor(colors.black)
        y -= 30
    p.setFont("Helvetica-Bold", 16)
    p.drawString(100, y, "GeoCortex Solar Intelligence Report")
    y -= 30
    p.setFont("Helvetica", 12)
    p.drawString(100, y, f"Location Analysis: {lat}, {lng}")
    y -= 10
    p.line(100, y, 500, y)
    y -= 30
    p.drawString(100, y, "SOLAR POTENTIAL SUMMARY:")
    y -= 20
    p.drawString(120, y, f"• Max Panels Fit: {solar_data['maxArrayPanelsCount']}")
    y -= 20
    p.drawString(120, y, f"• Yearly Generation: {solar_data['yearlyEnergyDcKwh']} kWh")
    y -= 20
    p.drawString(120, y, f"• CO2 Offset: {solar_data['co2_saved']} kg/year")
    y -= 40
    p.drawString(100, y, "FINANCIAL ESTIMATION (India):")
    y -= 20
    p.drawString(120, y, f"• Est. Installation Cost: ₹ {solar_data['install_cost']:,}")
    y -= 20
    p.drawString(120, y, f"• Annual Bill Savings: ₹ {solar_data['annual_savings']:,}")
    y -= 20
    p.drawString(120, y, f"• ROI / Break-even: {solar_data['breakeven_years']} Years")
    y -= 40
    p.setFont("Helvetica-Oblique", 10)
    p.drawString(100, y, "Generated by GeoCortex AI Engine using Google Solar API")
    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer
