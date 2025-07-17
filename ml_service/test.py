import requests
import json

BASE_URL = "http://localhost:8000"  # Change if your ML service runs elsewhere

# Example polygon: a small square in [lng, lat] order, closed ring
EXAMPLE_POLYGON = [
    [
        
    [82.2385883331299, 17.08492748494417],
    [82.2521495819092, 17.085419742347106],
    [82.25266456604005, 17.075902535558296],
    [82.24030494689943, 17.07614867633502],
    [82.2385883331299, 17.08492748494417]
    ]
]

PLOT_ID = "test-plot-1"
headers = {"Content-Type": "application/json"}

def test_health_check():
    print("\nTesting /health-check...")
    r = requests.get(f"{BASE_URL}/health-check")
    print("Status:", r.status_code)
    print("Response:", r.json())

def test_detect_change():
    print("\nTesting /detect-change...")
    payload = {"plotId": PLOT_ID, "coordinates": EXAMPLE_POLYGON}
    r = requests.post(f"{BASE_URL}/detect-change", headers=headers, data=json.dumps(payload))
    print("Status:", r.status_code)
    print("Response:", r.json())

def test_latest_image():
    print("\nTesting /latest-image...")
    payload = {"plotId": PLOT_ID, "coordinates": EXAMPLE_POLYGON}
    r = requests.post(f"{BASE_URL}/latest-image", headers=headers, data=json.dumps(payload))
    print("Status:", r.status_code)
    try:
        resp = r.json()
        print("Response:", resp)
        if 'best_thumbnail_url' in resp and resp['best_thumbnail_url']:
            print("Thumbnail URL:", resp['best_thumbnail_url'])
        elif 'imageUrl' in resp and resp['imageUrl']:
            print("Image URL:", resp['imageUrl'])
    except Exception:
        print("Non-JSON response (likely a file or error)")

def test_download_latest_image():
    print("\nTesting /download-latest-image...")
    payload = {"plotId": PLOT_ID, "coordinates": EXAMPLE_POLYGON}
    r = requests.post(f"{BASE_URL}/download-latest-image", headers=headers, data=json.dumps(payload))
    print("Status:", r.status_code)
    try:
        resp = r.json()
        print("Response:", resp)
    except Exception:
        print("Non-JSON response (likely a file or error)")

if __name__ == "__main__":
    test_health_check()
    test_detect_change()
    test_latest_image()
    test_download_latest_image() 