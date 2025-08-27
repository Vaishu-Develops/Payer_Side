//dataService.jsx

// Comprehensive Data Service - Fetches data from the backend API
const API_BASE_URL = '/api';

class DataService {
  async handleRequest(endpoint, options = {}) {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      console.log(`🔄 Fetching data from: ${url}`);
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error(`❌ API Error: ${response.status} ${response.statusText}`, errorData);
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Successfully fetched data from: ${url}`);
      return { success: true, data };
    } catch (error) {
      console.error('❌ DataService fetch error:', error);
      return { success: false, error: error.message };
    }
  }

  // API Methods
  async getHospitals(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.handleRequest(`/hospitals?${queryString}`);
  }

  async getHospitalDetails(hospitalId) {
    return this.handleRequest(`/hospitals/${hospitalId}`);
  }

  async getHospitalCertifications(hospitalId) {
    return this.handleRequest(`/hospitals/${hospitalId}/certifications`);
  }

  async getAllHospitalCertifications() {
    return this.handleRequest('/hospital_certifications');
  }

  async getCertifications() {
    return this.handleRequest('/hospitals/certifications');
  }

  async getEquipmentMatrix(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.handleRequest(`/analytics/equipment-matrix?${queryString}`);
  }

  async getAnalyticsSummary() {
    return this.handleRequest('/analytics/summary');
  }

  async getHospitalsByState() {
    return this.handleRequest('/analytics/hospitals-by-state');
  }

  async getDocumentVerification() {
    return this.handleRequest('/document-verification');
  }

  async getDocumentUploads() {
    return this.handleRequest('/document_uploads');
  }

  async getHospitalContacts() {
    return this.handleRequest('/hospital_contacts');
  }

  async getHospitalAddresses() {
    return this.handleRequest('/hospital_addresses');
  }

  async getHospitalEquipment() {
    return this.handleRequest('/hospital_equipment');
  }

  async getHospitalInfrastructure() {
    return this.handleRequest('/hospital_infrastructure');
  }

  async getWardsRooms() {
    return this.handleRequest('/wards_rooms');
  }

  async getHospitalMetrics() {
    return this.handleRequest('/hospital_metrics');
  }

  async getMedicalSpecialties() {
    return this.handleRequest('/medical_specialties');
  }

  async getDoctors() {
    return this.handleRequest('/doctors');
  }

  async getBedCapacity() {
    // This endpoint doesn't seem to exist in the backend,
    // so we will mock it for now. A proper backend endpoint should be created.
    console.warn('⚠️ Using mocked data for getBedCapacity');
    return Promise.resolve({
        success: true,
        data: {
            hospitals: [
                { id: 1, name: "City General Hospital", total_beds: 500, occupied_beds: 350, available_beds: 150, occupancy_rate: 70 },
                { id: 2, name: "Suburb Medical Center", total_beds: 300, occupied_beds: 220, available_beds: 80, occupancy_rate: 73 },
            ]
        }
    });
  }

  async getWardData(hospitalId) {
    // Since there's no hospital-specific endpoint, get all wards and filter by hospital_id
    const allWardsResponse = await this.handleRequest('/wards_rooms');
    if (allWardsResponse.success) {
      const allWards = allWardsResponse.data;
      const hospitalWards = Array.isArray(allWards) ? 
        allWards.filter(ward => ward.hospital_id == hospitalId) : [];
      return { success: true, data: hospitalWards };
    }
    return allWardsResponse;
  }

  async fetchHospitalsData() {
    return this.handleRequest('/hospitals');
  }
}

// Create singleton instance
const dataService = new DataService();

export default dataService;
