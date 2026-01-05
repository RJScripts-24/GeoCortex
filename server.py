import os
import json
import ee
from groq import Groq
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from dotenv import load_dotenv
from solar_engine import analyze_solar_potential, analyze_solar_potential_with_ai

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

# --- Solar analysis endpoint is disabled ---
# @app.route('/api/analyze_solar', methods=['POST'])
# def solar_analysis():
#     """
#     Solar analysis endpoint that combines Google Solar API + Groq AI
#     Returns HTML-formatted analysis for AI Consultant popup
#     """
#     print(f"[DEBUG] /api/analyze_solar endpoint called")
#     try:
#         data = request.json
#         print(f"[DEBUG] Received data: {data}")
#         lat = data.get('lat')
#         lng = data.get('lng')
#         bounds = data.get('bounds')  # {north, south, east, west}
#         
#         if not lat or not lng or not bounds:
#             return jsonify({"error": "Coordinates and bounds required"}), 400
#         
#         solar_api_key = os.getenv('GOOGLE_SOLAR_API_KEY')
#         groq_api_key = os.getenv('GROQ_API_KEY')
#         
#         if not solar_api_key or not groq_api_key:
#             return jsonify({"error": "API keys not configured"}), 500
#         
#         # Call the enhanced analysis function
#         print(f"[DEBUG] Calling analyze_solar_potential_with_ai with lat={lat}, lng={lng}, bounds={bounds}")
#         html_result, error, raw_data = analyze_solar_potential_with_ai(
#             lat, lng, bounds, solar_api_key, groq_api_key
#         )
#         
#         print(f"[DEBUG] Analysis result - error: {error}, html_result length: {len(html_result) if html_result else 0}")
#         
#         if error:
#             print(f"[DEBUG] Returning 404 with error: {error}")
#             return jsonify({"error": error}), 404
#         
#         return jsonify({
#             "analysis": html_result,
#             "coordinates": {"lat": lat, "lng": lng},
#             "building_polygon": raw_data.get("solarPotential", {}).get("roofSegmentStats", [{}])[0].get("boundingPolygon") if raw_data else None
#         })
#         
#     except Exception as e:
#         print(f"Error in solar_analysis: {e}")
#         import traceback
#         traceback.print_exc()
#         return jsonify({"error": str(e)}), 500

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

        # ------------------ Reverse Geocoding ------------------
        location_name = "Unknown Location"
        try:
            geocode_url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lng}&zoom=18&addressdetails=1"
            headers = {'User-Agent': 'GeoCortex/1.0'}
            r = requests.get(geocode_url, headers=headers, timeout=5)
            if r.ok:
                g = r.json()
                addr = g.get('address', {})
                parts = [addr[k] for k in ['neighbourhood','suburb','road','city','town','state'] if k in addr]
                location_name = ', '.join(parts) if parts else g.get('display_name', location_name)
        except Exception:
            pass

        # ------------------ Temperature ------------------
        temperature_c = None
        try:
            point = ee.Geometry.Point([lng, lat])
            image = ee.ImageCollection('MODIS/061/MOD11A2') \
                .filter(ee.Filter.date('2025-01-01', '2025-12-31')) \
                .select('LST_Day_1km') \
                .mean()
            lst = image.sample(point, scale=1000).first().get('LST_Day_1km').getInfo()
            if lst is not None:
                temperature_c = (lst * 0.02) - 273.15
        except Exception:
            pass

        # ------------------ Zone Logic ------------------
        zone_name, zone_status = "Unknown", "Unknown"
        if temperature_c is not None:
            if temperature_c < 26:
                zone_name, zone_status = "Blue Zone (Cool Areas)", "Healthy / Protected"
            elif temperature_c < 27.5:
                zone_name, zone_status = "Cyan Zone (Comfortable Urban Areas)", "Stable"
            elif temperature_c < 28.7:
                zone_name, zone_status = "Green Zone (Transition Areas)", "At Risk"
            elif temperature_c < 29.5:
                zone_name, zone_status = "Yellow/Orange Zone (Warning Zone)", "Mitigation Required"
            else:
                zone_name, zone_status = "Red Zone (Critical Heat Island)", "CRITICAL INTERVENTION"

        # ------------------ PROMPT (CORRECT) ------------------
        prompt = f"""
You are an environmental assessment system.

Analyze the Urban Heat Island effect for the location below and FILL ALL FIELDS.

Location: {location_name}
Coordinates: {lat}, {lng}
Land Surface Temperature: {round(temperature_c,2) if temperature_c is not None else "N/A"} °C
Zone: {zone_name}
Status: {zone_status}

Return ONLY valid JSON matching this schema:

{{
  "title": "Urban Heat Island Assessment",
  "location": {{
    "name": "{location_name}",
    "coordinates": "{lat}, {lng}"
  }},
  "temperature": {{
    "value": {round(temperature_c,2) if temperature_c is not None else 0},
    "unit": "°C",
    "classification": "{zone_name}"
  }},
  "zone": "{zone_name}",
  "status": "{zone_status}",
  "analysis": {{
    "summary": "2–3 concise sentences",
    "causes": ["cause 1", "cause 2", "cause 3"],
    "actions": ["action 1", "action 2", "action 3"]
  }}
}}

Rules:
- Use plain ASCII text only
- Causes must be urban / land-use related
- Actions must be actionable and location-specific
"""

        client = Groq(api_key=os.getenv("GROQ_API_KEY"))
        res = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )

        # ------------------ SAFE JSON PARSE ------------------
        raw = res.choices[0].message.content.strip()
        structured = json.loads(raw)

        # ------------------ UI HTML ------------------
        html = f"""
<div style="font-size:1.4rem;font-weight:bold;">🌡️ Urban Heat Analysis</div>

<div><b>Location:</b> {structured['location']['name']}</div>
<div><b>Temperature:</b> {structured['temperature']['value']} °C</div>
<div><b>Zone:</b> {structured['zone']}</div>
<div><b>Status:</b> {structured['status']}</div>

<hr/>

<b>Summary</b>
<div style="margin-bottom:0.75rem;">
{structured['analysis']['summary']}
</div>

<b>Key Causes</b>
<ul>
{''.join(f"<li>{c}</li>" for c in structured['analysis']['causes'])}
</ul>

<b>Recommended Actions</b>
<ol>
{''.join(f"<li>{a}</li>" for a in structured['analysis']['actions'])}
</ol>
"""


        return jsonify({
            "analysis": html,                      # UI
            "structured_analysis": structured,     # PDF
            "temperature": structured["temperature"]["value"],
            "coordinates": {"lat": lat, "lng": lng},
            "location_name": location_name,
            "zone": structured["zone"],
            "zone_status": structured["status"]
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/api/static-map")
def static_map():
    import requests
    from flask import Response

    params = request.args.to_dict()
    params["key"] = os.getenv("GOOGLE_MAPS_API_KEY")

    r = requests.get(
        "https://maps.googleapis.com/maps/api/staticmap",
        params=params,
        timeout=10
    )

    return Response(r.content, mimetype="image/png")

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')


# Chatbot endpoint for AI consultant
@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    try:
        data = request.json
        question = data.get('question')
        lat = data.get('lat')
        lng = data.get('lng')
        year = data.get('year', 2030)
        trees = data.get('trees', 0)

        if not question or lat is None or lng is None:
            return jsonify({'error': 'Question, lat, and lng required'}), 400

        # Predict LST for the given year and location
        point = ee.Geometry.Point([lng, lat])
        image = ee.ImageCollection('MODIS/061/MOD11A2') \
            .filter(ee.Filter.date(f'{year}-01-01', f'{year}-12-31')) \
            .select('LST_Day_1km') \
            .mean()
        try:
            lst_value = image.sample(point, scale=1000).first().get('LST_Day_1km').getInfo()
            if lst_value is not None and lst_value > 0:
                temperature_k = lst_value * 0.02
                temperature_c = temperature_k - 273.15
            else:
                temperature_c = None
        except Exception as e:
            temperature_c = None

        # Simulate tree planting impact (simple model: each tree reduces LST by 0.05°C)
        tree_impact = trees * 0.05
        predicted_lst = temperature_c - tree_impact if temperature_c is not None else None

        # Compose prompt for Groq API
        prompt = (
            f"User question: {question}\n"
            f"Location: ({lat}, {lng})\n"
            f"Year: {year}\n"
            f"Predicted LST (before trees): {round(temperature_c,2) if temperature_c is not None else 'N/A'}°C\n"
            f"Number of trees to plant: {trees}\n"
            f"Predicted LST (after trees): {round(predicted_lst,2) if predicted_lst is not None else 'N/A'}°C\n"
            "Answer the user's question using the above data, Google Earth Engine prediction, and explain the impact of tree planting on LST."
        )

        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            return jsonify({'error': 'GROQ_API_KEY not set'}), 500
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.1-8b-instant",
        )
        answer = response.choices[0].message.content
        return jsonify({
            'answer': answer,
            'predicted_lst': round(predicted_lst,2) if predicted_lst is not None else None,
            'temperature_c': round(temperature_c,2) if temperature_c is not None else None
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Print all registered routes for debugging
    print("\n=== Registered Flask Routes ===")
    for rule in app.url_map.iter_rules():
        print(f"{rule.rule} -> {rule.endpoint} [{', '.join(rule.methods)}]")
    print("================================\n")
    app.run(debug=True, port=5000)