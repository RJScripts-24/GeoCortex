
import requests
import json

def check_discovery():
    url = "https://pollen.googleapis.com/$discovery/rest?version=v1"
    print(f"Fetching {url}...")
    try:
        r = requests.get(url)
        if r.status_code == 200:
            data = r.json()
            print("rootUrl:", data.get('rootUrl'))
            print("servicePath:", data.get('servicePath'))
            print("baseUrl:", data.get('baseUrl'))
            
            # Construct example URL
            root = data.get('rootUrl', 'https://pollen.googleapis.com/')
            path = data.get('servicePath', 'v1/')
            print(f"Constructed Base: {root}{path}")
            
            # Check methods
            if 'resources' in data and 'forecast' in data['resources']:
                 print("Methods for forecast:", list(data['resources']['forecast']['methods'].keys()))
        else:
            print(f"Error {r.status_code}: {r.text[:300]}")
    except Exception as e:
        print("Failed:", e)

if __name__ == "__main__":
    check_discovery()
