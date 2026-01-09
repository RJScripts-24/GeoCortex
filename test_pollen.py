
import requests
import json

def test_pollen():
    url = "http://localhost:5000/api/check_pollen"
    # Coordinator for a location (e.g., somewhere with pollen data)
    data = {
        "lat": 37.7749, # San Francisco
        "lng": -122.4194
    }
    
    try:
        response = requests.post(url, json=data)
        print(f"Status: {response.status_code}")
        print("Response:", json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Test failed: {e}")

if __name__ == "__main__":
    test_pollen()
