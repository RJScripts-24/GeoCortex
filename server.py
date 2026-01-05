import os
import json
import ee
from groq import Groq
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='client/dist', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Earth Engine
try:
    # Use credentials.json file in the project directory
    credentials_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
    with open(credentials_path, 'r') as f:
        credentials_data = json.load(f)
    
    creds = ee.ServiceAccountCredentials(
        credentials_data['client_email'],
        key_data=json.dumps(credentials_data)
    )
    ee.Initialize(creds)
    print("Earth Engine initialized successfully")
except Exception as e:
    print(f"Earth Engine initialization failed: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'online'})

@app.route('/api/heat/<int:year>')
def get_heat_layer(year):
    try:
        # Define Bangalore bounding box (approximate)
        bangalore_bbox = ee.Geometry.Rectangle([77.4, 12.8, 77.75, 13.15])
        image = ee.ImageCollection('MODIS/061/MOD11A2') \
            .filter(ee.Filter.date(f'{year}-01-01', f'{year}-12-31')) \
            .select('LST_Day_1km') \
            .mean()

        # Compute min/max for Bangalore (LST is in Kelvin*100)
        stats = image.reduceRegion(
            reducer=ee.Reducer.minMax(),
            geometry=bangalore_bbox,
            scale=1000,
            maxPixels=1e9
        )
        min_val = stats.get('LST_Day_1km_min')
        max_val = stats.get('LST_Day_1km_max')
        # Fallback if stats are not available
        min_val = ee.Algorithms.If(min_val, min_val, 13000)
        max_val = ee.Algorithms.If(max_val, max_val, 16500)

        vis_params = {
            'min': min_val,
            'max': max_val,
            'palette': [
                "040274", "040281", "0502a3", "0502b8", "0502ce", "0502e6",
                "0602ff", "235cb1", "307ef3", "269db1", "30c8e2", "32d3ef",
                "3be285", "3ff38f", "86e26f", "3ae237", "b5e22e", "d6e21f",
                "fff705", "ffd611", "ffb613", "ff8b13", "ff6e08", "ff500d",
                "ff0000", "de0101", "c21301", "a71001", "911001"
            ]
        }
        map_id = image.getMapId(vis_params)
        tile_url = map_id['tile_fetcher'].url_format

        # Return a proxy URL for tiles
        proxy_tile_url = f"/api/heat/tile/{year}/{{z}}/{{x}}/{{y}}"
        return jsonify({'tileUrl': proxy_tile_url})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Proxy endpoint for Earth Engine tiles
import requests
@app.route('/api/heat/tile/<int:year>/<int:z>/<int:x>/<int:y>')
def proxy_heat_tile(year, z, x, y):
    try:
        bangalore_bbox = ee.Geometry.Rectangle([77.4, 12.8, 77.75, 13.15])
        image = ee.ImageCollection('MODIS/061/MOD11A2') \
            .filter(ee.Filter.date(f'{year}-01-01', f'{year}-12-31')) \
            .select('LST_Day_1km') \
            .mean()
        stats = image.reduceRegion(
            reducer=ee.Reducer.minMax(),
            geometry=bangalore_bbox,
            scale=1000,
            maxPixels=1e9
        )
        min_val = stats.get('LST_Day_1km_min')
        max_val = stats.get('LST_Day_1km_max')
        min_val = ee.Algorithms.If(min_val, min_val, 13000)
        max_val = ee.Algorithms.If(max_val, max_val, 16500)
        vis_params = {
            'min': min_val,
            'max': max_val,
            'palette': [
                "040274", "040281", "0502a3", "0502b8", "0502ce", "0502e6",
                "0602ff", "235cb1", "307ef3", "269db1", "30c8e2", "32d3ef",
                "3be285", "3ff38f", "86e26f", "3ae237", "b5e22e", "d6e21f",
                "fff705", "ffd611", "ffb613", "ff8b13", "ff6e08", "ff500d",
                "ff0000", "de0101", "c21301", "a71001", "911001"
            ]
        }
        map_id = image.getMapId(vis_params)
        tile_url = map_id['tile_fetcher'].url_format
        real_tile_url = tile_url.replace('{z}', str(z)).replace('{x}', str(x)).replace('{y}', str(y))
        r = requests.get(real_tile_url)
        return Response(r.content, content_type=r.headers.get('Content-Type', 'image/png'))
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/analyze', methods=['POST'])
def analyze_location():
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')

        # Get actual location name using reverse geocoding
        location_name = "Unknown Location"
        try:
            geocode_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=18&addressdetails=1"
            geocode_headers = {'User-Agent': 'GeoCortex/1.0'}
            geocode_response = requests.get(geocode_url, headers=geocode_headers, timeout=5)
            if geocode_response.ok:
                geocode_data = geocode_response.json()
                address = geocode_data.get('address', {})
                # Build location name from address components
                parts = []
                if 'neighbourhood' in address:
                    parts.append(address['neighbourhood'])
                elif 'suburb' in address:
                    parts.append(address['suburb'])
                elif 'road' in address:
                    parts.append(address['road'])
                if 'city' in address:
                    parts.append(address['city'])
                elif 'town' in address:
                    parts.append(address['town'])
                if 'state' in address:
                    parts.append(address['state'])
                location_name = ', '.join(parts) if parts else geocode_data.get('display_name', 'Unknown Location')
                print(f"Reverse geocoded location: {location_name}")
        except Exception as geo_error:
            print(f"Geocoding error: {geo_error}")

        temperature_c = None
        try:
            # Get temperature from Earth Engine for the given point
            point = ee.Geometry.Point([lng, lat])
            
            # Get the same image collection used for visualization
            image = ee.ImageCollection('MODIS/061/MOD11A2') \
                .filter(ee.Filter.date(f'{data.get("year", 2025)}-01-01', f'{data.get("year", 2025)}-12-31')) \
                .select('LST_Day_1km') \
                .mean()
            
            # Sample temperature at the clicked point
            lst_value = image.sample(point, scale=1000).first().get('LST_Day_1km').getInfo()
            
            if lst_value is not None and lst_value > 0:
                # Convert to Celsius (MODIS LST scale factor is 0.02)
                temperature_k = lst_value * 0.02
                temperature_c = temperature_k - 273.15
                
                print(f"LST raw value: {lst_value}, Kelvin: {temperature_k}, Celsius: {temperature_c}")
        except Exception as ee_error:
            print(f"Earth Engine error: {ee_error}")

        # Use Groq API key from environment only
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise RuntimeError("GROQ_API_KEY is not set in the environment. Please add it to your .env file.")
        client = Groq(api_key=api_key)
        
        # Zone classification based on ACTUAL TEMPERATURE
        # Updated thresholds to match real-world heat conditions
        zone = None
        zone_info = None
        temp_c = temperature_c if temperature_c is not None else None
        
        if temp_c is not None:
            if temp_c < 18:  # Very cool - water bodies, deep shade
                zone = 1
                zone_info = {
                    "name": "Blue Zone (Water & Deep Shade)",
                    "status": "✅ Healthy / Protected",
                    "color": "#0502ff",
                    "suggestions": [
                        "Preservation: Maintain the current state of this area.",
                        "Monitor Water Quality (if water body present).",
                        "Prevent Encroachment (no new construction).",
                        "Biodiversity Check (high ecological value)."
                    ]
                }
            elif temp_c < 24:  # Comfortable - well-shaded urban areas
                zone = 2
                zone_info = {
                    "name": "Cyan Zone (Comfortable Urban Areas)",
                    "status": "🟢 Stable",
                    "color": "#30c8e2",
                    "suggestions": [
                        "Maintain Green Cover (protect existing trees).",
                        "Rainwater Harvesting (groundwater recharge)."
                    ]
                }
            elif temp_c < 28:  # Warming - transition areas with sparse vegetation
                zone = 3
                zone_info = {
                    "name": "Green Zone (Transition Areas)",
                    "status": "⚠️ At Risk",
                    "color": "#3ae237",
                    "suggestions": [
                        "Canopy Upgrade (plant tall trees, not just grass).",
                        "Soil Moisture Retention (mulching, prevent drying)."
                    ]
                }
            elif temp_c < 34:  # Hot - roads, dense residential, parking lots
                zone = 4
                zone_info = {
                    "name": "Yellow/Orange Zone (Warning Zone)",
                    "status": "🟠 Mitigation Required",
                    "color": "#ff8b13",
                    "suggestions": [
                        "Street Avenue Planting (trees along roads).",
                        "Cool Pavements (replace asphalt with permeable pavers).",
                        "Vertical Gardens (green walls on pillars/fences)."
                    ]
                }
            else:  # Extreme heat - industrial, large roofs, highways
                zone = 5
                zone_info = {
                    "name": "Red Zone (Critical Heat Island)",
                    "status": "🚨 CRITICAL INTERVENTION",
                    "color": "#ff0000",
                    "suggestions": [
                        "Priority 1: Cool Roofing (paint black roofs white).",
                        "Priority 2: Miyawaki Forest (ultra-dense forest buffer if possible).",
                        "Priority 3: Mist Cooling Systems (for plazas where trees can't grow)."
                    ]
                }
        # Enhanced prompt with actual location name and zone suggestions
        prompt = (
            f"Analyze the urban heat island effect at {location_name} (coordinates: {lat}, {lng}).\n\n"
            f"Land Surface Temperature: {round(temperature_c, 2) if temperature_c is not None else 'N/A'}°C\n"
            + (
                f"\nGeoCortex Zone: {zone_info['name']}\nStatus: {zone_info['status']}\nAI Suggestions for this zone:\n- "
                + "\n- ".join(zone_info['suggestions']) + "\n" if zone_info else ""
            )
            + "\nPlease provide:\n"
            "1. Current temperature analysis.\n"
            "2. What is causing heat in this region (urban factors, land use, etc.).\n"
            "3. Three specific actionable ways to reduce heat in this region.\n\n"
            "Keep the response concise and specific to this location."
        )
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )

        # Format AI Insights with emojis, font sizes, and bold for frontend display
        ai_content = response.choices[0].message.content
        zone_label = zone_info['name'] if zone_info else 'Unknown Zone'
        zone_status = zone_info['status'] if zone_info else ''
        zone_color = zone_info.get('color', '#888888') if zone_info else '#888888'
        zone_color_emoji = {
            1: '💧',
            2: '🟦',
            3: '🟩',
            4: '🟨',
            5: '🟥'
        }.get(zone, '❓')
        # Compose a styled HTML block for AI Insights with color indicator
        ai_insights_html = f"""
        <div style='font-size:1.25rem;font-weight:bold;margin-bottom:0.5rem;'>🤖 <span style='font-size:1.4rem;'>AI Insights</span></div>
        <div style='font-size:1.1rem;margin-bottom:0.5rem;'><b>Zone:</b> <span style='font-size:1.15rem;'>{zone_color_emoji} {zone_label}</span> <span style='display:inline-block;width:20px;height:20px;background:{zone_color};border-radius:50%;margin-left:8px;vertical-align:middle;border:2px solid #fff;'></span></div>
        <div style='font-size:1rem;margin-bottom:0.5rem;'><b>Status:</b> {zone_status}</div>
        <div style='font-size:1rem;line-height:1.7;margin-top:0.5rem;white-space:pre-line;'>{ai_content}</div>
        """
        return jsonify({
            'analysis': ai_insights_html,
            'temperature': round(temperature_c, 2) if temperature_c is not None else None,
            'coordinates': {'lat': lat, 'lng': lng},
            'location_name': location_name,
            'zone': zone_label,
            'zone_status': zone_status
        })
    except Exception as e:
        print(f"Error in analyze_location: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)