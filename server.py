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

        temperature_c = None
        try:
            # Get temperature from Earth Engine for the given point
            point = ee.Geometry.Point([lng, lat])
            # Get latest available MODIS LST data
            image = ee.ImageCollection('MODIS/061/MOD11A2') \
                .filterBounds(point) \
                .select('LST_Day_1km') \
                .sort('system:time_start', False) \
                .first()
            
            # MODIS LST scale factor is 0.02 (multiply by 0.02 to get Kelvin)
            lst_value = image.sample(point, scale=1000).first().get('LST_Day_1km').getInfo()
            if lst_value is not None and lst_value > 0:
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
        
        # Enhanced prompt with location details
        prompt = f"""Analyze the urban heat island effect at the coordinates {lat}, {lng}.

    Please provide:
    1. The exact location name (city/area)
    2. Current temperature analysis (Land Surface Temperature: {round(temperature_c, 2) if temperature_c is not None else 'N/A'}°C)
    3. What is causing heat in this region (urban factors, land use, etc.)
    4. Three specific actionable ways to reduce heat in this region

    Keep the response concise and specific to this location."""
        
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
        )

        return jsonify({
            'analysis': response.choices[0].message.content,
            'temperature': round(temperature_c, 2) if temperature_c is not None else None,
            'coordinates': {'lat': lat, 'lng': lng}
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