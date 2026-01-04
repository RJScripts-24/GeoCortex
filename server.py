import os
import json
import ee
import google.generativeai as genai
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
        
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"Analyze the urban heat island effect at latitude {lat} and longitude {lng}. Provide a concise analysis of the area's vulnerability and suggest three actionable mitigation strategies."
        
        response = model.generate_content(prompt)
        
        return jsonify({'analysis': response.text})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)