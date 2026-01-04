import os
import json
import ee
from google import genai
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

service_account_file = 'credentials.json'

try:
    with open(service_account_file) as f:
        creds_data = json.load(f)
        service_account_email = creds_data['client_email']

    credentials = ee.ServiceAccountCredentials(
        email=service_account_email,
        key_file=service_account_file
    )
    ee.Initialize(credentials)
except Exception:
    pass

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'online'})

@app.route('/get-heat-layer', methods=['POST'])
def get_heat_layer():
    try:
        data = request.json
        year = data.get('year', 2024)
        
        dataset = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2') \
            .filterDate(f'{year}-01-01', f'{year}-12-31') \
            .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) \
            .median()

        thermal = dataset.select('ST_B10').multiply(0.00341802).add(149.0).subtract(273.15)
        
        vis_params = {
            'min': 20,
            'max': 50,
            'palette': ['blue', 'yellow', 'orange', 'red']
        }
        
        map_id = thermal.getMapId(vis_params)
        
        return jsonify({
            'tileUrl': map_id['tile_fetcher'].url_format
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_location():
    try:
        data = request.json
        lat = data.get('lat')
        lng = data.get('lng')
        
        client = genai.Client(api_key=os.getenv("AIzaSyC6V4mJQ9lANXKW0GVdgSxW0EZ10wqftiw"))
        prompt = f"Act as a civil engineer. Analyze coordinates {lat}, {lng}. Suggest 3 distinct mitigation strategies for urban heat islands in this specific location."
        
        response = client.models.generate_content(
            model="gemini-1.5-pro",
            contents=prompt
        )
        
        return jsonify({'analysis': response.text})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
