#!/usr/bin/env python3
import requests
import json

def test_hospitals_api():
    try:
        print("🔍 Testing hospitals API...")
        response = requests.get('http://localhost:8001/api/hospitals')
        
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Success! Got {data.get('count', 'unknown')} hospitals")
            
            if data.get('hospitals'):
                first_hospital = data['hospitals'][0]
                print(f"🏥 First hospital: {first_hospital.get('name', 'No name')}")
                print(f"📍 Coordinates: lat={first_hospital.get('latitude', 'missing')}, lng={first_hospital.get('longitude', 'missing')}")
                print(f"🏢 Type: {first_hospital.get('hospital_type', 'unknown')}")
                print(f"🛏️ Beds: {first_hospital.get('beds_registered', 'unknown')}")
                
                # Count how many hospitals have coordinates
                with_coords = sum(1 for h in data['hospitals'] if h.get('latitude') and h.get('longitude'))
                print(f"📊 Hospitals with coordinates: {with_coords}/{len(data['hospitals'])}")
            else:
                print("❌ No hospitals data in response")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_hospitals_api()
