
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GOOGLE_POLLEN_API_KEY', '').strip()

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
    if r.status_code == 200:
        data = r.json()
        print("Full Response:")
        print(json.dumps(data, indent=2))
        
        # Check structure
        if 'dailyInfo' in data and data['dailyInfo']:
            day_info = data['dailyInfo'][0]
            pollen_types = day_info.get('pollenTypeInfo', [])
            
            print("\n\nPollen Type Details:")
            for ptype in pollen_types:
                code = ptype.get('code')
                index_info = ptype.get('indexInfo', {})
                print(f"{code}: category={index_info.get('category')}, value={index_info.get('value')}")
    else:
        print(f"Error {r.status_code}: {r.text[:300]}")
except Exception as e:
    print(f"Exception: {e}")
