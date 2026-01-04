import os
import json
import ee
from google import genai
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__, static_folder='client/dist', static_url_path='')
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Initialize Earth Engine
try:
    creds = ee.ServiceAccountCredentials(
        os.getenv('EE_ACCOUNT'),
        key_data=os.getenv('EE_PRIVATE_KEY')
    )
    ee.Initialize(creds)
except Exception as e:
    print(f"Earth Engine initialization failed: {e}")

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'online'})

@app.route('/api/heat/<int:year>')
def get_heat_layer(year):
    try:
        image = ee.ImageCollection('MODIS/061/MOD11A2') \
            .filter(ee.Filter.date(f'{year}-01-01', f'{year}-12-31')) \
            .select('LST_Day_1km') \
            .mean()

        vis_params = {
            'min': 13000.0,
            'max': 16500.0,
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

        return jsonify({'tileUrl': tile_url})

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