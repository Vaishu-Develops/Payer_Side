from fastapi import FastAPI, APIRouter, HTTPException, Path, Body
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import List, Dict, Any

# Create a router for document endpoints
router = APIRouter()

# Function to load data from JSON file
def load_json_data(filename: str) -> List[Dict]:
    file_path = os.path.join("data", filename)
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Data file {filename} not found")
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail=f"Invalid JSON in {filename}")

@router.get("/document-uploads", tags=["Documents"])
def get_document_uploads():
    """Get all document uploads"""
    documents = load_json_data("document_uploads.json")
    return documents

@router.get("/document-verification", tags=["Documents"])
def get_document_verification():
    """Get document verification status with proper hospital names"""
    documents = load_json_data("document_uploads.json")
    hospitals = load_json_data("hospitals.json")
    
    # Create a mapping from hospital ID to hospital name
    hospital_names = {}
    for hospital in hospitals:
        hospital_names[hospital['hospital_id']] = hospital['name']
    
    # Also create a fallback mapping for the entity_ids in documents that don't match hospitals
    # We'll create synthetic names for these since they don't exist in hospitals.json
    unique_entity_ids = list(set([doc['entity_id'] for doc in documents]))
    
    # Hospital name mapping for entity_ids that don't exist in hospitals.json
    synthetic_hospital_names = {
        121: "Apollo Hospitals Delhi",
        122: "Fortis Healthcare Mumbai", 
        123: "Max Super Speciality Hospital Gurgaon",
        124: "AIIMS New Delhi",
        125: "Medanta - The Medicity Gurgaon",
        126: "Manipal Hospitals Bangalore",
        127: "Narayana Health Bangalore",
        128: "Artemis Hospital Gurgaon",
        129: "Kokilaben Dhirubhai Ambani Hospital Mumbai",
        130: "Jaslok Hospital Mumbai",
        131: "Sir Ganga Ram Hospital Delhi",
        132: "BLK-Max Super Speciality Hospital Delhi",
        133: "Indraprastha Apollo Hospitals Delhi",
        134: "Lilavati Hospital Mumbai",
        135: "Global Hospital Chennai"
    }
    
    # Process the data
    total_verified = 0
    total_pending = 0 
    total_rejected = 0
    
    # Group documents by hospital
    hospital_map = {}
    
    for doc in documents:
        # Count document statuses
        if doc.get('is_verified'):
            total_verified += 1
        elif doc.get('verification_notes') == 'rejected':
            total_rejected += 1
        else:
            total_pending += 1
        
        # Get hospital info
        entity_id = doc['entity_id']
        
        # Try to get name from hospitals.json first, then use synthetic names
        hospital_name = hospital_names.get(entity_id) or synthetic_hospital_names.get(entity_id) or f"Hospital {entity_id}"
        
        # Group by hospital
        if entity_id not in hospital_map:
            hospital_map[entity_id] = {
                "id": entity_id,
                "name": hospital_name,
                "documents": []
            }
        
        hospital_map[entity_id]["documents"].append({
            "id": doc['id'],
            "document_type": doc['document_type'],
            "is_verified": doc.get('is_verified', False),
            "verification_status": 'verified' if doc.get('is_verified') else ('rejected' if doc.get('verification_notes') == 'rejected' else 'pending'),
            "upload_date": doc.get('upload_date'),
            "expiry_date": doc.get('expiry_date')
        })
    
    return {
        "totalVerified": total_verified,
        "totalPending": total_pending, 
        "totalRejected": total_rejected,
        "hospitals": list(hospital_map.values())
    }

@router.get("/documents/{document_id}", tags=["Documents"])
def get_document(document_id: int = Path(..., description="The ID of the document to get")):
    """Get document by ID"""
    documents = load_json_data("document_uploads.json")
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return document

@router.patch("/documents/{document_id}/verify", tags=["Documents"])
def verify_document(
    document_id: int = Path(..., description="The ID of the document to verify"),
    verification_data: Dict[str, Any] = Body(...)
):
    """Verify a document (mock endpoint)"""
    documents = load_json_data("document_uploads.json")
    document = next((doc for doc in documents if doc["id"] == document_id), None)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # In a real implementation, we would update the document in the database
    # For this mock API, we'll just return a success response
    return {
        "success": True,
        "document_id": document_id,
        "message": "Document verified successfully"
    }

# Function to register these routes with the main app
def register_document_routes(app: FastAPI):
    app.include_router(router)
