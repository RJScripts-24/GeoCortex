import os
import requests
from dotenv import load_dotenv

load_dotenv()

# Check if API key exists
api_key = os.getenv('VITE_GOOGLE_AERIAL_VIEW_KEY') or os.getenv('GOOGLE_AERIAL_VIEW_API_KEY') or os.getenv('GOOGLE_MAPS_API_KEY')

print(f"API Key found: {'Yes' if api_key else 'No'}")
if api_key:
    print(f"API Key (first 10 chars): {api_key[:10]}...")
    print(f"API Key length: {len(api_key)}")

# Test with a known working address (Google HQ)
test_address = "1600 Amphitheatre Pkwy, Mountain View, CA 94043"

url = "https://aerialview.googleapis.com/v1/videos:lookupVideo"
params = {
    'key': api_key,
    'address': test_address
}

print(f"\nTesting Aerial View API with: {test_address}")
print(f"URL: {url}")

try:
    response = requests.get(url, params=params)
    print(f"\nStatus Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
except Exception as e:
    print(f"Error: {e}")
