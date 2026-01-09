
import os
import requests
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GOOGLE_POLLEN_API_KEY', '').strip()

data = {
    "location": {"latitude": 37.7749, "longitude": -122.4194},
    "days": 1,
    "plantsDescription": True
}
headers = {
    'Content-Type': 'application/json',
    'X-Goog-Api-Key': key
}

print("Try 1: Header auth, standard URL")
url1 = "https://pollen.googleapis.com/v1/forecast:lookup"
try:
    r = requests.post(url1, json=data, headers=headers)
    print(f"Status: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")

print("Try 2: Header auth, encoded URL")
url2 = "https://pollen.googleapis.com/v1/forecast%3Alookup"
try:
    r = requests.post(url2, json=data, headers=headers)
    print(f"Status: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")

print("Try 3: Query auth, encoded URL")
url3 = f"https://pollen.googleapis.com/v1/forecast%3Alookup?key={key}"
try:
    r = requests.post(url3, json=data)
    print(f"Status: {r.status_code}")
except Exception as e:
    print(f"Error: {e}")
