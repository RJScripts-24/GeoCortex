
import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()
key = os.getenv('GOOGLE_POLLEN_API_KEY', '').strip()

def check_url(url, label):
    print(f"Testing {label}: {url}")
    try:
        r = requests.post(url, json={
            "location": {"latitude": 37.7, "longitude": -122.4},
            "days": 1
        }, params={'key': key})
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            print("SUCCESS!")
            return True
    except Exception as e:
        print(f"Failed: {e}")
    return False

# 1. Check Discovery BaseURL FULLY
try:
    d = requests.get("https://pollen.googleapis.com/$discovery/rest?version=v1").json()
    print("Discovery BaseURL:", d.get('baseUrl'))
    print("Discovery RootURL:", d.get('rootUrl'))
    print("Discovery ServicePath:", d.get('servicePath'))
except:
    print("Discovery failed")

# 2. Brute Force
candidates = [
    "https://pollen.googleapis.com/v1/forecast:lookup",
    "https://pollen.googleapis.com/v1/forecast/lookup",
    "https://pollen.googleapis.com/forecast:lookup", # No v1?
    "https://pollen.googleapis.com/v1/currentConditions:lookup" # Try airquality style?
]

for c in candidates:
    if check_url(c, c):
        break
