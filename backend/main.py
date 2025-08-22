from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import List, Optional, Dict, Any
from collections import defaultdict

import sys
import os
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Initialize FastAPI app
app = FastAPI(
    title="Hospital Mock API for Payer Dashboard",
    description="Mock API server with Indian hospital data for payer dashboard development",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5174",  # Vite dev server alternate port
        "http://localhost:5175",  # Vite dev server alternate port 2
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://127.0.0.1:5174",  # Alternative localhost
        "http://127.0.0.1:5175",  # Alternative localhost
        "http://localhost:3000",  # Create React App fallback
        "http://localhost:64286"  # VS Code Simple Browser
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

def load_json_data(filename: str) -> Any:
    """Load JSON data from file without caching and with structure normalization"""
    file_path = os.path.join("data", filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Normalize data structure by extracting the list from the top-level key
            if isinstance(data, dict):
                # Common top-level keys that hold a list of items
                for key in ["hospitals", "documents", "certifications", "users", "contacts", "equipment", "specialties", "wards", "rooms", "metrics"]:
                    if key in data and isinstance(data[key], list):
                        print(f"✅ Loaded {filename} and extracted list from '{key}' key")
                        return data[key]
                
                # If no common list key is found, return the dictionary as is
                print(f"✅ Loaded {filename} with custom dictionary structure")
                return data
            
            elif isinstance(data, list):
                print(f"✅ Loaded {filename} with list structure: {len(data)} items")
                return data
            else:
                print(f"⚠️ Unexpected data type in {filename}: {type(data)}")
                return data

    except FileNotFoundError:
        print(f"❌ File not found: {filename}")
        raise HTTPException(status_code=404, detail=f"Data file {filename} not found")
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error in {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Invalid JSON in {filename}")
    except Exception as e:
        print(f"❌ Unexpected error loading {filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading {filename}")

def get_list_from_data(data: Any) -> List[Dict]:
    """Helper to ensure we get a list from loaded JSON data"""
    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        # Check for common keys that might contain the list
        for key in ["hospitals", "documents", "certifications", "users", "contacts", "equipment", "specialties", "wards", "rooms", "metrics"]:
            if key in data and isinstance(data[key], list):
                return data[key]
    return [] # Return empty list if no list is found

# ================================
# HOSPITAL ENDPOINTS
# ================================

@app.get("/", tags=["Info"])
def root():
    """API Information"""
    return {
        "message": "Hospital Mock API for Payer Dashboard Development",
        "version": "1.0.0",
        "total_hospitals": 20,
        "total_records": "1800+",
        "documentation": "/docs",
    }

@app.get("/hospitals", tags=["Hospitals"])
def get_all_hospitals(
    city: Optional[str] = Query(None, description="Filter by city"),
    hospital_type: Optional[str] = Query(None, description="Filter by hospital type"),
    min_beds: Optional[int] = Query(None, description="Minimum bed count")
):
    """Get all hospitals with optional filtering"""
    
    
    hospitals = load_json_data("hospitals.json")
    addresses = load_json_data("hospital_addresses.json")
    
    print(f"✅ Loaded {len(hospitals) if isinstance(hospitals, list) else 'non-list'} hospitals")
    if hospitals:
        sample_hospital = hospitals[0] if isinstance(hospitals, list) else hospitals
        print(f"✅ Sample hospital: {sample_hospital.get('name', 'NO_NAME')}")
        print(f"✅ Sample coordinates: lat={sample_hospital.get('latitude')}, lng={sample_hospital.get('longitude')}")
    else:
        print("❌ No hospitals data loaded!")
    
    # Ensure we have list data
    hospitals = get_list_from_data(hospitals)
    addresses = get_list_from_data(addresses)
    
    hospital_list = []
    for hospital in hospitals:
        # Skip incomplete hospital records that only have center_of_excellence
        if not hospital.get("name"):
            continue
            
        primary_address = next(
            (addr for addr in addresses if str(addr.get("hospital_id")) == str(hospital.get("id")) and addr.get("address_type") == "Primary"),
            None
        )
        
        hospital_summary = {
            "id": hospital.get("id"),
            "name": hospital.get("name"),
            "hospital_type": hospital.get("hospital_type"),
            "beds_registered": hospital.get("beds_registered"),
            "beds_operational": hospital.get("beds_operational"),
            "city": primary_address.get("city_town") if primary_address else None,
            "state": primary_address.get("state") if primary_address else None,
            "pin_code": primary_address.get("pin_code") if primary_address else None,
            "phone": hospital.get("telephone"),
            "website": hospital.get("website_url"),
            "registration_number": hospital.get("registration_number"),
            "provider_code": hospital.get("provider_code"),
            "category": hospital.get("category"),
            "center_of_excellence": hospital.get("center_of_excellence"),
            "ownership_type": hospital.get("ownership_type"),
            "latitude": hospital.get("latitude"),
            "longitude": hospital.get("longitude")
        }
        
        # Apply filters
        if city and (not primary_address or primary_address.get("city_town", "").lower() != city.lower()):
            continue
        if hospital_type and hospital.get("hospital_type", "").lower() != hospital_type.lower():
            continue
        if min_beds and hospital.get("beds_registered", 0) < min_beds:
            continue
            
        hospital_list.append(hospital_summary)
    
    # Debug: Check how many hospitals have coordinates
    hospitals_with_coords = sum(1 for h in hospital_list if h.get('latitude') and h.get('longitude'))
    print(f"🗺️ Hospitals with coordinates: {hospitals_with_coords}/{len(hospital_list)}")
    
    if hospital_list:
        sample = hospital_list[0]
        print(f"🏥 First hospital sample: {sample.get('name')} - lat: {sample.get('latitude')}, lng: {sample.get('longitude')}")
    
    return {
        "count": len(hospital_list),
        "hospitals": hospital_list
    }

@app.get("/hospitals/{hospital_id}", tags=["Hospitals"])
def get_hospital_details(hospital_id: str):
    """Get complete hospital details"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    
    hospital = next((h for h in hospitals if str(h.get("hospital_id")) == hospital_id or str(h.get("id")) == hospital_id), None)
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    
    return hospital

@app.get("/hospital_addresses", tags=["Hospitals"])
def get_all_hospital_addresses():
    """Get all hospital addresses"""
    return load_json_data("hospital_addresses.json")

@app.get("/hospitals/{hospital_id}/addresses", tags=["Hospitals"])
def get_hospital_addresses(hospital_id: str):
    """Get hospital addresses"""
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    hospital_addresses = [addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id]
    
    if not hospital_addresses:
        raise HTTPException(status_code=404, detail="No addresses found for hospital")
    
    return {"addresses": hospital_addresses}

# ================================
# MEDICAL CAPABILITIES
# ================================

@app.get("/hospitals/{hospital_id}/specialties", tags=["Medical"])
def get_hospital_specialties(hospital_id: str):
    """Get medical specialties for a hospital"""
    specialties = get_list_from_data(load_json_data("medical_specialties.json"))
    hospital_specialties = [spec for spec in specialties if str(spec.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_specialties),
        "specialties": hospital_specialties
    }

@app.get("/hospitals/{hospital_id}/doctors", tags=["Medical"])
def get_hospital_doctors(
    hospital_id: str,
    specialty: Optional[str] = Query(None, description="Filter by specialty")
):
    """Get doctors for a hospital"""
    doctors = get_list_from_data(load_json_data("doctors.json"))
    specialties = get_list_from_data(load_json_data("medical_specialties.json"))
    
    hospital_doctors = [doc for doc in doctors if str(doc.get("hospital_id")) == hospital_id]
    
    for doctor in hospital_doctors:
        specialty_info = next(
            (spec for spec in specialties if str(spec.get("id")) == str(doctor.get("specialty_id"))),
            None
        )
        doctor["specialty_name"] = specialty_info.get("specialty_name") if specialty_info else "Unknown"
    
    if specialty:
        hospital_doctors = [doc for doc in hospital_doctors if specialty.lower() in doc.get("specialty_name", "").lower()]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_doctors),
        "doctors": hospital_doctors
    }

@app.get("/hospitals/{hospital_id}/equipment", tags=["Infrastructure"])
def get_hospital_equipment(
    hospital_id: str,
    category: Optional[str] = Query(None, description="Filter by equipment category")
):
    """Get equipment for a hospital"""
    equipment = get_list_from_data(load_json_data("hospital_equipment.json"))
    hospital_equipment = [eq for eq in equipment if str(eq.get("hospital_id")) == hospital_id]
    
    if category:
        hospital_equipment = [eq for eq in hospital_equipment if category.lower() in eq.get("category", "").lower()]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_equipment),
        "equipment": hospital_equipment
    }

# ================================
# FACILITIES & INFRASTRUCTURE
# ================================

@app.get("/hospitals/{hospital_id}/infrastructure", tags=["Infrastructure"])
def get_hospital_infrastructure(hospital_id: str):
    """Get infrastructure details"""
    infrastructure = get_list_from_data(load_json_data("hospital_infrastructure.json"))
    hospital_infra = [infra for infra in infrastructure if str(infra.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_infra),
        "infrastructure": hospital_infra
    }

@app.get("/hospitals/{hospital_id}/operation-theaters", tags=["Infrastructure"])
def get_hospital_ots(hospital_id: str):
    """Get operation theater details"""
    ots = get_list_from_data(load_json_data("operation_theaters.json"))
    hospital_ots = [ot for ot in ots if str(ot.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_ots),
        "operation_theaters": hospital_ots
    }

@app.get("/hospitals/{hospital_id}/icu-facilities", tags=["Infrastructure"])
def get_hospital_icus(hospital_id: str):
    """Get ICU facilities"""
    icus = get_list_from_data(load_json_data("icu_facilities.json"))
    hospital_icus = [icu for icu in icus if str(icu.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_icus),
        "icu_facilities": hospital_icus
    }

@app.get("/hospitals/{hospital_id}/wards", tags=["Infrastructure"])
def get_hospital_wards(hospital_id: str):
    """Get ward/room details"""
    wards = get_list_from_data(load_json_data("wards_rooms.json"))
    hospital_wards = [ward for ward in wards if str(ward.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_wards),
        "wards": hospital_wards
    }

# ================================
# CONTACTS
# ================================

@app.get("/hospital-contacts", tags=["Contacts"])
def get_hospital_contacts():
    """Get all hospital contacts"""
    return load_json_data("hospital_contacts.json")

@app.get("/hospitals/{hospital_id}/contacts", tags=["Contacts"])
def get_hospital_contacts_by_id(hospital_id: str):
    """Get contacts for a specific hospital"""
    contacts = get_list_from_data(load_json_data("hospital_contacts.json"))
    hospital_contacts = [contact for contact in contacts if str(contact.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_contacts),
        "contacts": hospital_contacts
    }

# ================================
# SERVICES & COMPLIANCE
# ================================

@app.get("/hospitals/{hospital_id}/diagnostic-services", tags=["Services"])
def get_diagnostic_services(hospital_id: str):
    """Get diagnostic services"""
    services = get_list_from_data(load_json_data("diagnostic_services.json"))
    hospital_services = [svc for svc in services if str(svc.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_services),
        "diagnostic_services": hospital_services
    }

@app.get("/hospitals/{hospital_id}/support-services", tags=["Services"])
def get_support_services(hospital_id: str):
    """Get support services (Pharmacy, Blood Bank, etc.)"""
    services = get_list_from_data(load_json_data("support_services.json"))
    hospital_services = [svc for svc in services if str(svc.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_services),
        "support_services": hospital_services
    }

@app.get("/hospitals/certifications", tags=["Certifications"])
def get_all_hospital_certifications():
    """Get certifications for all hospitals"""
    try:
        # Direct file access to avoid the caching mechanism
        file_path = os.path.join("data", "hospital_certifications.json")
        with open(file_path, 'r', encoding='utf-8') as f:
            certification_data = json.load(f)
            print(f"✅ Successfully loaded hospital_certifications.json directly")
            return certification_data  # Return the complete JSON structure with hospitals key
    except FileNotFoundError:
        print(f"❌ File not found: hospital_certifications.json")
        raise HTTPException(status_code=404, detail=f"Certification data not found")
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error in hospital_certifications.json: {e}")
        raise HTTPException(status_code=500, detail=f"Invalid certification data format")
    except Exception as e:
        print(f"❌ Unexpected error loading certifications: {e}")
        raise HTTPException(status_code=500, detail=f"Error loading certification data")


@app.get("/analytics/hospital-metrics", tags=["Analytics"])
def get_hospital_metrics_summary():
    """Get hospital performance metrics summary"""
    metrics = get_list_from_data(load_json_data("hospital_metrics.json"))
    
    return {
        "currentMetrics": {
            "financial": {"revenue": 45000000, "operatingMargin": 12.5, "costPerPatient": 8500, "target": {"revenue": 48000000, "operatingMargin": 15.0, "costPerPatient": 8000}},
            "quality": {"patientSatisfaction": 85, "readmissionRate": 8.2, "safetyRating": "A", "target": {"patientSatisfaction": 90, "readmissionRate": 7.0, "safetyRating": "A+"}},
            "operational": {"bedOccupancy": 78, "avgLengthOfStay": 4.2, "nursePatientRatio": 1.4, "target": {"bedOccupancy": 85, "avgLengthOfStay": 3.8, "nursePatientRatio": 1.2}}
        },
        "monthlyTrends": [
            {"month": "Jan", "revenue": 4200000, "satisfaction": 82, "bedOccupancy": 75, "operatingMargin": 11.2},
            {"month": "Feb", "revenue": 3900000, "satisfaction": 84, "bedOccupancy": 73, "operatingMargin": 10.8},
            {"month": "Mar", "revenue": 4100000, "satisfaction": 83, "bedOccupancy": 76, "operatingMargin": 11.5},
            {"month": "Apr", "revenue": 3800000, "satisfaction": 85, "bedOccupancy": 74, "operatingMargin": 10.9},
            {"month": "May", "revenue": 4300000, "satisfaction": 86, "bedOccupancy": 79, "operatingMargin": 12.1},
            {"month": "Jun", "revenue": 4500000, "satisfaction": 87, "bedOccupancy": 81, "operatingMargin": 12.8},
            {"month": "Jul", "revenue": 4600000, "satisfaction": 85, "bedOccupancy": 80, "operatingMargin": 13.2},
            {"month": "Aug", "revenue": 4400000, "satisfaction": 84, "bedOccupancy": 78, "operatingMargin": 12.5},
            {"month": "Sep", "revenue": 4200000, "satisfaction": 86, "bedOccupancy": 77, "operatingMargin": 12.0},
            {"month": "Oct", "revenue": 4700000, "satisfaction": 88, "bedOccupancy": 82, "operatingMargin": 13.5},
            {"month": "Nov", "revenue": 4800000, "satisfaction": 87, "bedOccupancy": 83, "operatingMargin": 13.8},
            {"month": "Dec", "revenue": 4900000, "satisfaction": 85, "bedOccupancy": 78, "operatingMargin": 12.5}
        ],
        "metrics": metrics
    }

@app.get("/document-verification", tags=["Documents"])
def get_document_verification():
    """Get document verification data"""
    uploads_data = load_json_data("document_uploads.json")
    
    # Ensure we have a list of uploads
    if isinstance(uploads_data, dict) and "documents" in uploads_data:
        uploads = uploads_data["documents"]
    else:
        uploads = get_list_from_data(uploads_data)
    
    # Count documents by status
    verified = 0
    pending = 0
    rejected = 0
    
    for doc in uploads:
        status = doc.get("status", "").lower()
        if status == "verified":
            verified += 1
        elif status == "pending":
            pending += 1
        elif status == "rejected":
            rejected += 1
    
    return {
        "total": len(uploads),
        "verified": verified,
        "pending": pending,
        "rejected": rejected,
        "documents": uploads
    }

@app.get("/hospitals/{hospital_id}/certifications", tags=["Certifications"])
def get_hospital_certifications(hospital_id: str):
    """Get certifications (NABH, ISO, JCI)"""
    certifications = get_list_from_data(load_json_data("hospital_certifications.json"))
    
    # Find the hospital and its certifications
    hospital_certs_data = next((h for h in certifications if str(h.get("hospital_id")) == hospital_id), None)
    
    if not hospital_certs_data:
        raise HTTPException(status_code=404, detail="Certifications not found for hospital")

    return {
        "hospital_id": hospital_id,
        "name": hospital_certs_data.get("name"),
        "location": hospital_certs_data.get("location"),
        "count": len(hospital_certs_data.get("certifications", [])),
        "certifications": hospital_certs_data.get("certifications", []),
        "ratings": hospital_certs_data.get("ratings", {})
    }

@app.get("/hospitals/{hospital_id}/compliance", tags=["Quality"])
def get_compliance_licenses(hospital_id: str):
    """Get compliance licenses"""
    licenses = get_list_from_data(load_json_data("compliance_licenses.json"))
    hospital_licenses = [lic for lic in licenses if str(lic.get("hospital_id")) == hospital_id]
    
    return {
        "hospital_id": hospital_id,
        "count": len(hospital_licenses),
        "compliance_licenses": hospital_licenses
    }

@app.get("/hospitals/{hospital_id}/metrics", tags=["Analytics"])
def get_hospital_metrics(hospital_id: str):
    """Get hospital performance metrics"""
    metrics = get_list_from_data(load_json_data("hospital_metrics.json"))
    hospital_metric = next((m for m in metrics if str(m.get("hospital_id")) == hospital_id), None)
    
    if not hospital_metric:
        raise HTTPException(status_code=404, detail="Metrics not found for hospital")
    
    return hospital_metric

# ================================
# ANALYTICS & SEARCH ENDPOINTS
# ================================

@app.get("/search/hospitals", tags=["Search"])
def search_hospitals(
    q: str = Query(..., description="Search query"),
    limit: int = Query(10, description="Maximum results")
):
    """Search hospitals by name, city, or specialty"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    
    results = []
    query_lower = q.lower()
    
    for hospital in hospitals:
        hospital_id = str(hospital.get("hospital_id", hospital.get("id")))
        
        if query_lower in hospital.get("name", "").lower():
            primary_address = next((addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id and addr.get("address_type") == "Primary"), {})
            results.append({
                "hospital_id": hospital_id,
                "name": hospital.get("name"),
                "hospital_type": hospital.get("type"),
                "city": primary_address.get("city_town"),
                "match_type": "name"
            })
        
        hospital_addresses = [addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id]
        for addr in hospital_addresses:
            if addr.get("city_town") and query_lower in addr["city_town"].lower():
                results.append({
                    "hospital_id": hospital_id,
                    "name": hospital.get("name"),
                    "hospital_type": hospital.get("type"),
                    "city": addr.get("city_town"),
                    "match_type": "city"
                })
                break
    
    seen = set()
    unique_results = [r for r in results if r['hospital_id'] not in seen and not seen.add(r['hospital_id'])]
    
    return {
        "query": q,
        "count": len(unique_results),
        "results": unique_results[:limit]
    }

@app.get("/analytics/summary", tags=["Analytics"])
def get_analytics_summary():
    """Get overall analytics summary"""
    hospitals_data = load_json_data("hospitals.json")
    doctors_data = load_json_data("doctors.json")
    equipment_data = load_json_data("hospital_equipment.json")
    certifications_data = load_json_data("hospital_certifications.json")
    
    # Extract hospitals list
    if isinstance(hospitals_data, dict) and "hospitals" in hospitals_data:
        hospitals = hospitals_data["hospitals"]
    else:
        hospitals = get_list_from_data(hospitals_data)
    
    # Extract doctors list
    doctors = get_list_from_data(doctors_data)
    
    # Extract equipment list
    equipment = get_list_from_data(equipment_data)
    
    # Extract certifications list and count unique hospitals
    if isinstance(certifications_data, dict) and "hospitals" in certifications_data:
        cert_hospitals = set()
        for hospital in certifications_data["hospitals"]:
            if "hospital_id" in hospital:
                cert_hospitals.add(str(hospital["hospital_id"]))
        cert_count = len(cert_hospitals)
    else:
        cert_count = len(set(str(cert.get("hospital_id", "")) for cert in get_list_from_data(certifications_data) if "hospital_id" in cert))
    
    # Get hospital types and beds
    hospital_types = []
    total_beds = 0
    count_with_beds = 0
    
    for h in hospitals:
        # Extract hospital type
        if "type" in h:
            hospital_types.append(h["type"])
        elif "hospital_type" in h:
            hospital_types.append(h["hospital_type"])
        
        # Extract bed count
        if "beds" in h:
            total_beds += int(h["beds"])
            count_with_beds += 1
        elif "beds_registered" in h:
            total_beds += int(h["beds_registered"])
            count_with_beds += 1
    
    avg_beds = round(total_beds / count_with_beds, 1) if count_with_beds > 0 else 0
    
    return {
        "total_hospitals": len(hospitals),
        "total_doctors": len(doctors),
        "total_equipment": len(equipment),
        "certified_hospitals": cert_count,
        "hospital_types": list(set(hospital_types)),
        "average_beds": avg_beds
    }

@app.get("/analytics/hospitals-by-state", tags=["Analytics"])
def get_hospitals_by_state():
    """Get hospital distribution by state with bed totals"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    
    state_data = defaultdict(lambda: {"hospital_count": 0, "total_beds": 0, "operational_beds": 0, "hospitals": []})
    
    for hospital in hospitals:
        hospital_id = str(hospital.get("hospital_id", hospital.get("id")))
        primary_address = next((addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id), None)
        
        if primary_address and primary_address.get("state"):
            state = primary_address["state"]
            beds = int(hospital.get("beds", hospital.get("beds_registered", 0)))
            
            state_data[state]["hospital_count"] += 1
            state_data[state]["total_beds"] += beds
            state_data[state]["operational_beds"] += int(beds * 0.85)
            state_data[state]["hospitals"].append({
                "id": hospital_id,
                "name": hospital.get("name"),
                "type": hospital.get("type", hospital.get("hospital_type")),
                "beds": beds,
                "city": primary_address.get("city_town")
            })
    
    result = [
        {
            "state": state,
            "hospital_count": data["hospital_count"],
            "total_beds": data["total_beds"],
            "operational_beds": data["operational_beds"],
            "bed_utilization": round((data["operational_beds"] / data["total_beds"]) * 100, 2) if data["total_beds"] > 0 else 0,
            "hospitals": data["hospitals"]
        }
        for state, data in state_data.items()
    ]
    
    return {
        "total_states": len(result),
        "state_distribution": sorted(result, key=lambda x: x["hospital_count"], reverse=True)
    }

@app.get("/analytics/geographic-distribution", tags=["Analytics"])
def get_geographic_distribution():
    """Get hospitals with geographic coordinates for mapping"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    
    geo_data = []
    for hospital in hospitals:
        hospital_id = str(hospital.get("hospital_id", hospital.get("id")))
        primary_address = next((addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id and addr.get("address_type") == "Primary"), None)
        
        geo_data.append({
            "id": hospital_id,
            "name": hospital.get("name"),
            "hospital_type": hospital.get("type"),
            "beds_registered": hospital.get("beds"),
            "beds_operational": int(hospital.get("beds", 0) * 0.85),
            "latitude": hospital.get("latitude"),
            "longitude": hospital.get("longitude"),
            "city": primary_address.get("city_town") if primary_address else None,
            "state": primary_address.get("state") if primary_address else None,
            "address": primary_address.get("street") if primary_address else None
        })
    
    return {
        "total_hospitals": len(geo_data),
        "hospitals": geo_data
    }

@app.get("/analytics/hospital-rankings", tags=["Analytics"])
def get_hospital_rankings(
    metric: str = Query("doctor_bed_ratio", description="Ranking metric: doctor_bed_ratio, nurse_bed_ratio, beds_registered"),
    limit: int = Query(20, description="Number of results")
):
    """Get ranked hospitals by specified metric"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    metrics = get_list_from_data(load_json_data("hospital_metrics.json"))
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    
    ranking_data = []
    for hospital in hospitals:
        hospital_id = str(hospital.get("hospital_id", hospital.get("id")))
        hospital_metric = next((m for m in metrics if str(m.get("hospital_id")) == hospital_id), None)
        primary_address = next((addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id and addr.get("address_type") == "Primary"), None)
        
        ranking_value = 0
        if metric == "beds_registered":
            ranking_value = int(hospital.get("beds", 0))
        elif metric == "beds_operational":
            ranking_value = int(hospital.get("beds", 0) * 0.85)
        elif hospital_metric:
            ranking_value = hospital_metric.get(metric, 0)
        
        ranking_data.append({
            "rank": 0,
            "hospital_id": hospital_id,
            "name": hospital.get("name"),
            "hospital_type": hospital.get("type"),
            "city": primary_address.get("city_town") if primary_address else None,
            "state": primary_address.get("state") if primary_address else None,
            "metric_name": metric,
            "metric_value": ranking_value,
            "beds_registered": int(hospital.get("beds", 0)),
            "beds_operational": int(hospital.get("beds", 0) * 0.85)
        })
    
    ranking_data.sort(key=lambda x: x["metric_value"], reverse=True)
    
    for i, item in enumerate(ranking_data):
        item["rank"] = i + 1
    
    return {
        "metric": metric,
        "total_hospitals": len(ranking_data),
        "rankings": ranking_data[:limit]
    }

@app.get("/analytics/benchmarks", tags=["Analytics"])
def get_network_benchmarks():
    """Get network-wide benchmark statistics"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    metrics = get_list_from_data(load_json_data("hospital_metrics.json"))
    certifications = get_list_from_data(load_json_data("hospital_certifications.json"))
    
    total_hospitals = len(hospitals)
    total_beds = sum(int(h.get("beds_registered", 0)) for h in hospitals)
    
    doctor_ratios = [m.get("doctor_bed_ratio", 0) for m in metrics if m.get("doctor_bed_ratio")]
    nurse_ratios = [m.get("nurse_bed_ratio", 0) for m in metrics if m.get("nurse_bed_ratio")]
    
    certified_hospitals = len(set(str(cert.get("hospital_id")) for cert in certifications))
    certification_coverage = (certified_hospitals / total_hospitals) * 100 if total_hospitals > 0 else 0
    
    return {
        "network_summary": {
            "total_hospitals": total_hospitals,
            "total_beds": total_beds,
            "average_beds_per_hospital": round(total_beds / total_hospitals, 2) if total_hospitals > 0 else 0,
            "certification_coverage_percent": round(certification_coverage, 2)
        },
        "staffing_benchmarks": {
            "doctor_bed_ratio": {"average": round(sum(doctor_ratios) / len(doctor_ratios), 3) if doctor_ratios else 0},
            "nurse_bed_ratio": {"average": round(sum(nurse_ratios) / len(nurse_ratios), 3) if nurse_ratios else 0}
        }
    }

@app.get("/analytics/equipment-matrix", tags=["Analytics"])
def get_equipment_matrix(
    equipment_type: str = Query(None, description="Filter by specific equipment type")
):
    """Get equipment availability matrix across hospitals"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    equipment = get_list_from_data(load_json_data("hospital_equipment.json"))
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    
    if equipment_type:
        equipment = [eq for eq in equipment if equipment_type.lower() in eq.get("equipment_name", "").lower()]
    
    equipment_matrix = []
    for hospital in hospitals:
        hospital_id = str(hospital.get("hospital_id", hospital.get("id")))
        primary_address = next((addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id), None)
        hospital_equipment = [eq for eq in equipment if str(eq.get("hospital_id")) == hospital_id]
        
        equipment_by_category = defaultdict(list)
        for eq in hospital_equipment:
            category = eq.get("category", "Uncategorized")
            equipment_by_category[category].append({
                "name": eq.get("equipment_name"), "brand": eq.get("brand_model"),
                "quantity": eq.get("quantity"), "available": eq.get("is_available")
            })
        
        equipment_matrix.append({
            "hospital_id": hospital_id,
            "hospital_name": hospital.get("name"),
            "hospital_type": hospital.get("type"),
            "city": primary_address.get("city_town") if primary_address else None,
            "state": primary_address.get("state") if primary_address else None,
            "total_equipment": len(hospital_equipment),
            "equipment_by_category": equipment_by_category,
            "available_equipment_count": sum(1 for eq in hospital_equipment if eq.get("is_available"))
        })
    
    all_equipment_types = set(eq.get("equipment_name") for eq in equipment)
    category_summary = defaultdict(int)
    for eq in equipment:
        category_summary[eq.get("category")] += 1
        
    return {
        "filter": equipment_type,
        "total_hospitals": len(equipment_matrix),
        "total_equipment_types": len(all_equipment_types),
        "equipment_categories": category_summary,
        "hospitals": equipment_matrix
    }

@app.get("/analytics/specialty-coverage", tags=["Analytics"])
def get_specialty_coverage(
    specialty_name: str = Query(None, description="Filter by specific specialty")
):
    """Get specialty coverage matrix across cities and hospitals"""
    hospitals = get_list_from_data(load_json_data("hospitals.json"))
    specialties = get_list_from_data(load_json_data("medical_specialties.json"))
    addresses = get_list_from_data(load_json_data("hospital_addresses.json"))
    
    if specialty_name:
        specialties = [spec for spec in specialties if specialty_name.lower() in spec.get("specialty_name", "").lower()]
    
    city_coverage = defaultdict(lambda: {"hospitals": [], "specialties": set()})
    specialty_coverage = defaultdict(lambda: {"cities": set(), "hospitals": []})

    for hospital in hospitals:
        hospital_id = str(hospital.get("hospital_id", hospital.get("id")))
        primary_address = next((addr for addr in addresses if str(addr.get("hospital_id")) == hospital_id), None)
        
        if not primary_address: continue
        
        city = primary_address.get("city_town", "Unknown")
        hospital_specialties = [spec for spec in specialties if str(spec.get("hospital_id")) == hospital_id]
        
        city_coverage[city]["hospitals"].append({"id": hospital_id, "name": hospital.get("name"), "type": hospital.get("type"), "specialty_count": len(hospital_specialties)})
        
        for spec in hospital_specialties:
            specialty = spec.get("specialty_name")
            city_coverage[city]["specialties"].add(specialty)
            specialty_coverage[specialty]["cities"].add(city)
            specialty_coverage[specialty]["hospitals"].append({
                "hospital_id": hospital["id"],
                "hospital_name": hospital["name"],
                "city": city
            })
            specialty_coverage[specialty]["total_availability"] += 1
    
    # Convert sets to lists and counts
    city_matrix = []
    for city, data in city_coverage.items():
        city_matrix.append({
            "city": city,
            "hospital_count": len(data["hospitals"]),
            "specialty_count": len(data["specialties"]),
            "hospitals": data["hospitals"],
            "available_specialties": list(data["specialties"])
        })
    
    specialty_matrix = []
    for specialty, data in specialty_coverage.items():
        specialty_matrix.append({
            "specialty_name": specialty,
            "city_count": len(data["cities"]),
            "hospital_count": len(data["hospitals"]),
            "cities": list(data["cities"]),
            "hospitals": data["hospitals"]
        })
    
    return {
        "filter": specialty_name,
        "total_cities": len(city_matrix),
        "total_specialties": len(specialty_matrix),
        "city_coverage": sorted(city_matrix, key=lambda x: x["specialty_count"], reverse=True),
        "specialty_coverage": sorted(specialty_matrix, key=lambda x: x["hospital_count"], reverse=True)
    }

# ================================
# ADDITIONAL ENDPOINTS
# ================================

@app.get("/document_uploads", tags=["Documents"])
def get_document_uploads():
    """Get all document uploads"""
    return load_json_data("document_uploads.json")

@app.get("/hospital_contacts", tags=["Contacts"])
def get_hospital_contacts():
    """Get all hospital contacts"""
    return load_json_data("hospital_contacts.json")

@app.get("/hospital_certifications", tags=["Certifications"])
def get_hospital_certifications():
    """Get all hospital certifications"""
    file_path = os.path.join("data", "hospital_certifications.json")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON")

@app.get("/hospital_equipment", tags=["Equipment"])
def get_hospital_equipment():
    """Get all hospital equipment"""
    return load_json_data("hospital_equipment.json")

@app.get("/hospital_infrastructure", tags=["Infrastructure"])
def get_hospital_infrastructure_all():
    """Get all hospital infrastructure data"""
    return load_json_data("hospital_infrastructure.json")

@app.get("/hospital_metrics", tags=["Metrics"])
def get_hospital_metrics_all():
    """Get all hospital metrics"""
    file_path = os.path.join("data", "hospital_metrics.json")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Data file not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid JSON")

@app.get("/wards_rooms", tags=["Wards"])
def get_wards_rooms():
    """Get all wards and rooms data"""
    return load_json_data("wards_rooms.json")

@app.get("/medical_specialties", tags=["Medical"])
def get_medical_specialties():
    """Get all medical specialties"""
    return load_json_data("medical_specialties.json")

@app.get("/doctors", tags=["Medical"])  
def get_doctors():
    """Get all doctors"""
    return load_json_data("doctors.json")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
