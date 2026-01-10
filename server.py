import os
import json
import ee
from groq import Groq
from flask import Flask, jsonify, request, send_from_directory, Response
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from solar_engine import analyze_solar_potential, analyze_solar_potential_with_ai

# Load .env from the same directory as server.py
env_path = os.path.join(os.path.dirname(__file__), '.env')

# Fix BOM issue: Read file, strip BOM, and write back if needed
try:
    with open(env_path, 'r', encoding='utf-8-sig') as f:  # utf-8-sig automatically strips BOM
        content = f.read()
    # Check if original file has BOM by reading with regular utf-8
    with open(env_path, 'rb') as f:
        raw = f.read(3)
        if raw.startswith(b'\xef\xbb\xbf'):
            print("[DEBUG] BOM detected in .env file, creating clean version...")
            # Write back without BOM
            with open(env_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("[DEBUG] .env file cleaned of BOM")
except Exception as e:
    print(f"[DEBUG] Error handling .env BOM: {e}")

load_dotenv(env_path)
print(f"[DEBUG] GROQ_API_KEY present: {bool(os.getenv('GROQ_API_KEY'))}")
if os.getenv('GROQ_API_KEY'):
    print(f"[DEBUG] GROQ_API_KEY loaded successfully")

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
        # Updated thresholds to match the visual heat map color gradient
        zone = None
        zone_info = None
        temp_c = temperature_c if temperature_c is not None else None
        
        if temp_c is not None:
            if temp_c < 26:  # Cool - water bodies, deep shade, well-vegetated areas (Blue: 20-26°C)
                zone = 1
                zone_info = {
                    "name": "Blue Zone (Cool Areas)",
                    "status": "✅ Healthy / Protected",
                    "color": "#0502ff",
                    "suggestions": [
                        "Preservation: Maintain the current state of this area.",
                        "Monitor Water Quality (if water body present).",
                        "Prevent Encroachment (no new construction).",
                        "Biodiversity Check (high ecological value)."
                    ]
                }
            elif temp_c < 27.5:  # Comfortable - well-shaded urban areas (Cyan: 26-27.5°C)
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
            elif temp_c < 28.7:  # Warming - transition areas with sparse vegetation (Green: 27.5-28.7°C)
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
            elif temp_c < 29.5:  # Hot - roads, dense residential, parking lots (Yellow/Orange: 28.7-29.5°C)
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
            else:  # Extreme heat - industrial, large roofs, highways (Red: >29.5°C)
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
        # Format AI content: bold, emojis, spacing
        import re
        ai_content = response.choices[0].message.content
        # Convert markdown bold to HTML bold
        ai_content = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', ai_content)
        # Add spacing after numbered points
        ai_content = re.sub(r'(\d+\.)', r'<br><span style="font-size:1.1rem;font-weight:bold;">\1</span>', ai_content)
        # Add emoji for each section if not present
        ai_content = re.sub(r'1\.', '1️⃣.', ai_content)
        ai_content = re.sub(r'2\.', '2️⃣.', ai_content)
        ai_content = re.sub(r'3\.', '3️⃣.', ai_content)
        # Add extra spacing between sections
        ai_content = ai_content.replace('<br><span', '<br><br><span')
        # Ensure bullet points are spaced
        ai_content = ai_content.replace('<br>\t*', '<br>&nbsp;&nbsp;• ')
        # Remove double <br>
        ai_content = re.sub(r'(<br>\s*){2,}', '<br><br>', ai_content)
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

@app.route('/api/planning/analyze', methods=['POST'])
def planning_analysis():
    print("[DEBUG] /api/planning/analyze endpoint called")
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')
        # items = [{'label': 'Tree', ...}, ...]
        items = data.get('items', [])
        
        if not lat or not lng:
            return jsonify({"error": "Coordinates required"}), 400
            
        # 1. Get Regional Stats from Earth Engine (5km radius)
        print(f"[DEBUG] Fetching regional stats for {lat}, {lng}")
        region_geometry = ee.Geometry.Point([lng, lat]).buffer(5000) # 5km radius
        
        # Load LST (Latest available year)
        lst_year = 2023 # Use 2023 for stability or current year
        lst_image = ee.ImageCollection('MODIS/061/MOD11A2') \
            .filter(ee.Filter.date(f'{lst_year}-01-01', f'{lst_year}-12-31')) \
            .select('LST_Day_1km') \
            .mean() \
            .multiply(0.02).subtract(273.15) # Convert to Celsius
            
        # Load Land Cover (ESA WorldCover 2021)
        # Class mapping: 10=Tree, 50=Built-up, 80=Water
        landcover = ee.ImageCollection("ESA/WorldCover/v200").first()
        
        # Calculate Mean LST for the whole region
        regional_stats = lst_image.reduceRegion(
            reducer=ee.Reducer.mean(),
            geometry=region_geometry,
            scale=1000,
            maxPixels=1e9
        )
        regional_mean_temp = regional_stats.get('LST_Day_1km').getInfo()
        
        # Calculate Mean LST for specific masks
        def get_class_mean(class_val):
            mask = landcover.eq(class_val)
            masked_lst = lst_image.updateMask(mask)
            stats = masked_lst.reduceRegion(
                reducer=ee.Reducer.mean(),
                geometry=region_geometry,
                scale=1000,
                maxPixels=1e9
            )
            return stats.get('LST_Day_1km').getInfo()

        tree_mean = get_class_mean(10)
        water_mean = get_class_mean(80)
        built_mean = get_class_mean(50)
        
        # Fallbacks if data is missing (e.g., no water in 5km)
        if regional_mean_temp is None: regional_mean_temp = 30.0
        if tree_mean is None: tree_mean = regional_mean_temp - 2.0
        if water_mean is None: water_mean = regional_mean_temp - 3.0
        if built_mean is None: built_mean = regional_mean_temp + 2.0
        
        # Calculate Factors (Impact relative to regional average)
        # Negative = Cooling, Positive = Heating
        tree_factor = tree_mean - regional_mean_temp
        water_factor = water_mean - regional_mean_temp
        built_factor = built_mean - regional_mean_temp
        
        # Add slight damping for single assets (we aren't planting a whole forest pixel)
        # But we want to show the POTENTIAL of that asset type in this region.
        # Let's use the full factor as "Local Efficiency" but scale slightly for total project impact if count is low.
        
        print(f"[DEBUG] Stats: Region={regional_mean_temp:.2f}, Tree={tree_mean:.2f}, Water={water_mean:.2f}, Built={built_mean:.2f}")
        
        # 2. Calculate Total Impact
        total_impact = 0
        item_details = {}
        
        asset_map = {
            'Tree': tree_factor,
            'Plant': tree_factor * 0.5, # Plants are less effective than trees
            'Pond': water_factor,
            'Building': built_factor,
            'Road': built_factor * 1.2 # Roads often hotter than general built-up (asphalt)
        }
        
        for item in items:
            itype = item.get('label')
            if not itype: continue
            
            # Use the calculated local factor
            # We scale it down because one asset != one 1km pixel
            # But we accumulated it. Let's say 1 asset provides 0.05% of the pixel's potential differentiation?
            # Or just sum them up up to a cap?
            # Let's use a weight of 0.1 for visibility.
            
            raw_factor = asset_map.get(itype, 0)
            impact = raw_factor * 0.1 
            
            total_impact += impact
            item_details[itype] = item_details.get(itype, 0) + 1
            
        # Cap the total change to reasonable limits (e.g., +/- 5 degrees C)
        total_impact = max(min(total_impact, 5.0), -5.0)
        projected_temp_c = regional_mean_temp + total_impact
        
        # 3. Generate AI Report via Groq
        api_key = os.getenv("GROQ_API_KEY")
        ai_insights = "AI Insights unavailable."
        
        if not api_key:
            print("[ERROR] GROQ_API_KEY is not set in environment variables")
            ai_insights = "AI Insights unavailable: GROQ_API_KEY is not configured. Please add it to your .env file."
        else:
            client = Groq(api_key=api_key)
            item_summary = ", ".join([f"{v} {k}(s)" for k, v in item_details.items()])
            
            prompt = (
                f"Generate an environmental impact report for a development at {lat}, {lng}.\\n"
                f"Regional Average Temp: {regional_mean_temp:.2f}°C\\n"
                f"Local Vegetation Cooling Potential: {tree_factor:+.2f}°C (Observed difference between trees and avg)\\n"
                f"Local Water Cooling Potential: {water_factor:+.2f}°C\\n"
                f"Local Urban Heating Effect: {built_factor:+.2f}°C\\n"
                f"Planned Assets: {item_summary}\\n"
                f"Estimated Net Temp Change: {total_impact:+.2f}°C\\n\\n"
                "Provide:\n"
                "1. **Local Climate Context**: Interpret the observed cooling/heating potentials (e.g., 'Trees in this area are highly effective...').\n"
                "2. **Project Impact**: How the specific planned assets change the microclimate.\n"
                "3. **Recommendation**: One data-driven suggestion based on the factors."
            )
            
            try:
                response = client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model="llama-3.3-70b-versatile",
                )
                ai_insights = response.choices[0].message.content
            except Exception as e:
                print(f"[ERROR] Groq API Error: {e}")
                import traceback
                traceback.print_exc()
                ai_insights = f"Could not generate AI insights: {str(e)}"

        return jsonify({
            "base_temp": round(regional_mean_temp, 2),
            "projected_temp": round(projected_temp_c, 2),
            "net_change": round(total_impact, 2),
            "factors": {
                "tree": round(tree_factor, 2),
                "water": round(water_factor, 2),
                "built": round(built_factor, 2)
            },
            "item_summary": item_details,
            "ai_report_text": ai_insights
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/check_pollen', methods=['POST'])
def check_pollen():
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')
        
        if not lat or not lng:
            return jsonify({'error': 'Coordinates required'}), 400

        api_key = os.getenv('GOOGLE_POLLEN_API_KEY')
        if not api_key:
            # If key is missing, fail safe? Or block?
            # User specifically asked for this feature, so let's error if missing to alert dev.
            return jsonify({'error': 'Pollen API key not configured'}), 500
            
        api_key = api_key.strip()

        # Pollen API uses GET with query parameters, not POST
        # Format: GET /v1/forecast:lookup?key=KEY&location.latitude=LAT&location.longitude=LNG&days=1
        params = {
            'key': api_key,
            'location.latitude': lat,
            'location.longitude': lng,
            'days': 1,
            'plantsDescription': True
        }
        
        url = "https://pollen.googleapis.com/v1/forecast:lookup"
        
        print(f"[DEBUG] Checking pollen for {lat}, {lng}")
        response = requests.get(url, params=params)
        
        if not response.ok:
            print(f"[DEBUG] Pollen API Error: {response.text}")
            
            # Handle 400 errors (location not covered) gracefully
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    error_msg = error_data.get('error', {}).get('message', 'Location not covered')
                    
                    # Location not covered - default to safe (allow planting)
                    return jsonify({
                        'safe': True,
                        'level': 'Unknown',
                        'value': 0,
                        'message': f'Pollen data unavailable for this location. Planting allowed.'
                    })
                except:
                    pass
            
            return jsonify({'error': 'Failed to fetch pollen data', 'details': response.text}), response.status_code
            
        pollen_data = response.json()
        
        # Extract Grass Pollen Index
        # Response structure: dailyInfo[0] -> pollenTypeInfo -> list of types
        # We look for code: "GRASS"
        
        day_info = pollen_data.get('dailyInfo', [])
        if not day_info:
             return jsonify({'safe': True, 'message': 'No pollen data available for this location', 'level': 'Unknown'})
             
        pollen_types = day_info[0].get('pollenTypeInfo', [])
        
        # Try to find GRASS pollen first
        grass_pollen = next((p for p in pollen_types if p.get('code') == 'GRASS'), None)
        
        # Fallback: if no GRASS, try GRAMINALES (grasses)
        if not grass_pollen:
            grass_pollen = next((p for p in pollen_types if p.get('code') == 'GRAMINALES'), None)
        
        if not grass_pollen:
             # No grass pollen data at all - default to safe
             return jsonify({'safe': True, 'message': 'No grass pollen data available for this location', 'level': 'Unknown'})
        
        # Index info: value (0-5), category (Low, Moderate, High, Very High)
        # UPI (Universal Pollen Index)
        index_info = grass_pollen.get('indexInfo', {})
        value = index_info.get('value')
        category = index_info.get('category')
        
        # Handle None values (no data for this season/location)
        if value is None or category is None:
            print(f"[DEBUG] Grass Pollen data exists but no index values (likely off-season)")
            return jsonify({
                'safe': True,
                'level': 'Low',
                'value': 0,
                'message': 'Grass pollen levels are currently very low (off-season)'
            })
        
        print(f"[DEBUG] Grass Pollen: Value={value}, Category={category}")
        
        # Logic: Safe if value < 3 (Low=0-2? Actually API usually 0-5 scale: 0-1 Low, 2 Moderate, 3 High, 4 Very High, 5 Extreme)
        # User said "High" should be removed.
        # Let's assume High(3), Very High(4), Extreme(5) are unsafe.
        # Moderate(2) and Low(1,0) are safe.
        # Adjust based on standard UPI if needed, but High is usually bad.
        

        is_safe = value < 3 
        
        # Pollen check logic completed
        return jsonify({
            'safe': is_safe,
            'level': category,
            'value': value,
            'message': f"Grass Pollen Level is {category}"
        })

    except Exception as e:
        print(f"Error in check_pollen: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

@app.route('/api/aerial_view', methods=['GET'])
def aerial_view():
    try:
        address = request.args.get('address')
        if not address:
            return jsonify({'error': 'Address required'}), 400

        # Try specific Aerial View key first, then generic Maps key
        api_key = os.getenv('VITE_GOOGLE_AERIAL_VIEW_KEY') or os.getenv('GOOGLE_AERIAL_VIEW_API_KEY') or os.getenv('GOOGLE_MAPS_API_KEY')
        
        if not api_key:
            return jsonify({'error': 'Aerial View API key not configured on server'}), 500
            
        api_key = api_key.strip()
        
        url = "https://aerialview.googleapis.com/v1/videos:lookupVideo"
        params = {
            'key': api_key,
            'address': address
        }
        
        print(f"[DEBUG] Fetching Aerial View for: {address}")
        response = requests.get(url, params=params)
        
        if not response.ok:
            print(f"[ERROR] Aerial View API Error ({response.status_code}): {response.text}")
            # Try to parse error response
            try:
                error_data = response.json()
                return jsonify(error_data), response.status_code
            except:
                return jsonify({'error': f'API request failed with status {response.status_code}', 'details': response.text}), response.status_code
            
        print(f"[DEBUG] Aerial View API Success")
        return jsonify(response.json())
        
    except Exception as e:
        print(f"Error in aerial_view: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Print all registered routes for debugging
    print("\n=== Registered Flask Routes ===")
    for rule in app.url_map.iter_rules():
        print(f"{rule.rule} -> {rule.endpoint} [{', '.join(rule.methods)}]")
    print("================================\n")
    
    # Cloud Run requires listening on 0.0.0.0 and uses PORT env variable
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)