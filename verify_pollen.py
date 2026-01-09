
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GOOGLE_POLLEN_API_KEY', '')
if key is None:
    print("Key is None!")
    exit(1)

key = key.strip()
print(f"Key loaded. Length: {len(key)}")
if len(key) > 5:
    print(f"Key start: {key[:5]}...")
else:
    print("Key too short.")

# Check for quote wrapper
if (key.startswith('"') and key.endswith('"')) or (key.startswith("'") and key.endswith("'")):
    print("Key has quotes! Removing them.")
    key = key[1:-1]

print("Testing GET mapTypes...")
url_get = f"https://pollen.googleapis.com/v1/mapTypes?key={key}"
try:
    r = requests.get(url_get)
    print(f"GET mapTypes status: {r.status_code}")
except Exception as e:
    print(f"GET failed: {e}")

print("Testing POST forecast:lookup...")
url_post = f"https://pollen.googleapis.com/v1/forecast:lookup?key={key}"
data = {
    "location": {"latitude": 37.7749, "longitude": -122.4194},
    "days": 1,
    "plantsDescription": True
}
try:
    r = requests.post(url_post, json=data)
    print(f"POST forecast:lookup status: {r.status_code}")
    if r.status_code != 200:
        print("Response body preview:")
        print(r.text[:300])
except Exception as e:
    print(f"POST failed: {e}")
