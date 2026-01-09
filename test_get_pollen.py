
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GOOGLE_POLLEN_API_KEY', '').strip()

print(f"Testing GET request with query parameters...")
print(f"API Key length: {len(key)}")

params = {
    'key': key,
    'location.latitude': 37.7749,
    'location.longitude': -122.4194,
    'days': 1,
    'plantsDescription': True
}

url = "https://pollen.googleapis.com/v1/forecast:lookup"

try:
    r = requests.get(url, params=params)
    print(f"Status: {r.status_code}")
    
    if r.status_code == 200:
        data = r.json()
        print("SUCCESS!")
        print(f"Response keys: {list(data.keys())}")
        
        # Check for pollen data
        if 'dailyInfo' in data:
            day_info = data['dailyInfo'][0] if data['dailyInfo'] else {}
            pollen_types = day_info.get('pollenTypeInfo', [])
            print(f"Pollen types available: {[p.get('code') for p in pollen_types]}")
            
            grass = next((p for p in pollen_types if p.get('code') == 'GRASS'), None)
            if grass:
                index_info = grass.get('indexInfo', {})
                print(f"Grass Pollen: {index_info.get('category')} (value: {index_info.get('value')})")
    else:
        print(f"Error: {r.text[:300]}")
except Exception as e:
    print(f"Exception: {e}")
