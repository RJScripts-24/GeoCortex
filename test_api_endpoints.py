
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GOOGLE_POLLEN_API_KEY', '').strip()

print(f"Testing with API key (length: {len(key)})")

# Test different endpoint formats based on Google API patterns
endpoints = [
    # Standard REST format
    ("POST with key param", "https://pollen.googleapis.com/v1/forecast:lookup", {"key": key}),
    # Header-based auth
    ("POST with header", "https://pollen.googleapis.com/v1/forecast:lookup", None),
]

payload = {
    "location": {
        "latitude": 37.7749,
        "longitude": -122.4194
    },
    "days": 1
}

for name, url, params in endpoints:
    print(f"\n{name}: {url}")
    try:
        headers = {'Content-Type': 'application/json'}
        if params is None:
            headers['X-Goog-Api-Key'] = key
            r = requests.post(url, json=payload, headers=headers)
        else:
            r = requests.post(url, json=payload, params=params)
        
        print(f"Status: {r.status_code}")
        if r.status_code != 200:
            print(f"Error preview: {r.text[:200]}")
        else:
            print("SUCCESS!")
            print(f"Response keys: {list(r.json().keys())}")
    except Exception as e:
        print(f"Exception: {e}")

# Check if API is enabled by testing a simpler endpoint
print("\n\nTesting mapTypes endpoint (simpler, no POST body):")
try:
    r = requests.get("https://pollen.googleapis.com/v1/mapTypes", params={"key": key})
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("MapTypes works! API is enabled.")
    else:
        print(f"Error: {r.text[:200]}")
except Exception as e:
    print(f"Exception: {e}")
