// src/services/hospitalService.jsx
import api from './api';

// Individual API endpoint functions for backend integration
export const getHospitals = async (params = {}) => {
  try {
    console.log('📤 Sending request to /hospitals endpoint with params:', params);
    const response = await api.get('/hospitals', { params });
    console.log('📥 Received response from /hospitals endpoint:', response.status);
    return response;
  } catch (error) {
    console.error('❌ Error in getHospitals:', error.message);
    throw error;
  }
};

export const getAllHospitals = () => api.get('/hospitals');
export const getAllMetrics = () => api.get('/hospital_metrics');
export const getAllDoctors = () => api.get('/doctors');

export const getHospitalDetails = (id) => 
  api.get(`/hospitals/${id}`);

export const getHospitalMetrics = (id) => 
  api.get(`/hospital_metrics`, { params: { hospital_id: id } });

export const getHospitalCertifications = (id) => 
  api.get(`/hospitals/${id}/certifications`);

export const getHospitalEquipment = (id, category = null) => 
  api.get(`/hospitals/${id}/equipment`, { 
    params: category ? { category } : {} 
  });

export const getHospitalAddresses = (id) =>
  api.get(`/hospitals/${id}/addresses`);

export const getHospitalSpecialties = (id) =>
  api.get(`/hospitals/${id}/specialties`);

export const getHospitalDoctors = (id) =>
  api.get(`/hospitals/${id}/doctors`);

export const getHospitalInfrastructure = (id) =>
  api.get(`/hospitals/${id}/infrastructure`);

export const getHospitalContacts = (id) =>
  api.get(`/hospitals/${id}/contacts`);

export const getWardData = (id) =>
  api.get(`/hospitals/${id}/wards`);

export const getHospitalProfile = async (id) => {
  if (!id) {
    throw new Error('Hospital ID is required');
  }

  try {
    console.log(`🔄 Fetching hospital profile for ID: ${id}`);
    
    // Use global endpoints for more reliable data availability
    const [hospitalRes, certificationsRes, contactsRes, addressesRes, equipmentRes] = await Promise.all([
      api.get(`/hospitals/${id}`),
      // Always use global endpoints and filter, as they seem more reliable
      api.get(`/hospital_certifications`).then(res => ({
        ...res,
        data: { certifications: Array.isArray(res.data) ? res.data.filter(cert => cert.hospital_id == id) : [] }
      })),
      api.get(`/hospital_contacts`).then(res => ({
        ...res,
        data: { contacts: Array.isArray(res.data) ? res.data.filter(contact => contact.hospital_id == id) : [] }
      })),
      api.get(`/hospitals/${id}/addresses`).catch(err => {
        console.warn('Addresses specific endpoint failed, trying global:', err.message);
        return api.get(`/hospital_addresses`).then(res => ({
          ...res,
          data: { addresses: Array.isArray(res.data) ? res.data.filter(address => address.hospital_id == id) : [] }
        }));
      }),
      api.get(`/hospitals/${id}/equipment`).catch(err => {
        console.warn('Equipment specific endpoint failed, trying global:', err.message);
        return api.get(`/hospital_equipment`).then(res => ({
          ...res,
          data: { equipment: Array.isArray(res.data) ? res.data.filter(equipment => equipment.hospital_id == id) : [] }
        }));
      })
    ]);

    // Extract data from responses, handling different endpoint structures
    const certifications = certificationsRes.data?.certifications || certificationsRes.data || [];
    const contacts = contactsRes.data?.contacts || contactsRes.data || [];
    const addresses = addressesRes.data?.addresses || addressesRes.data || [];
    const equipment = equipmentRes.data?.equipment || equipmentRes.data || [];

    // Process equipment data to create summary - ensure equipment is an array
    const equipmentArray = Array.isArray(equipment) ? equipment : [];
    const equipmentSummary = {
      diagnostic_count: equipmentArray.filter(eq => eq.category === 'Diagnostic').length,
      critical_care_count: equipmentArray.filter(eq => eq.category === 'Critical Care').length,
      surgical_count: equipmentArray.filter(eq => eq.category === 'Surgery').length,
      laboratory_count: equipmentArray.filter(eq => eq.category === 'Laboratory').length,
      cardiology_count: equipmentArray.filter(eq => eq.category === 'Cardiology').length
    };

    console.log(`✅ Successfully fetched hospital profile for ID: ${id}`);
    console.log(`📊 Profile data summary:`, {
      hospital: !!hospitalRes.data,
      certifications: certifications.length,
      contacts: contacts.length,
      addresses: addresses.length,
      equipment: equipmentArray.length
    });
    
    return {
      hospital: hospitalRes.data,
      certifications: certifications,
      contacts: contacts,
      addresses: addresses,
      equipment: equipmentArray,
      equipment_summary: equipmentSummary
    };
  } catch (error) {
    console.error('❌ Error fetching hospital profile:', error);
    throw new Error(`Failed to fetch hospital profile: ${error.message}`);
  }
};

export const fetchAllData = async () => {
    try {
        const [hospitals, metrics, doctors] = await Promise.all([
            getAllHospitals(),
            getAllMetrics(),
            getAllDoctors()
        ]);
        
        console.log('📥 fetchAllData - hospitals response:', hospitals?.data);
        console.log('📥 fetchAllData - metrics response:', metrics?.data);
        console.log('📥 fetchAllData - doctors response:', doctors?.data);
        
        return {
            hospitals: hospitals?.data?.hospitals || hospitals?.data || [],
            metrics: metrics?.data?.metrics || metrics?.data || [],
            doctors: doctors?.data || []
        };
    } catch (error) {
        console.error('❌ Error in fetchAllData:', error);
        throw error;
    }
};

export const getEquipmentMatrix = (equipment_type = null) =>
  api.get('/analytics/equipment-matrix', { 
    params: equipment_type ? { equipment_type } : {} 
  });

// Function to get hospital name by ID from the backend data
export const getHospitalNameById = async (hospitalId) => {
  try {
    const response = await api.get('/hospitals');
    const hospitals = response.data?.hospitals || response.data || [];
    
    const hospital = hospitals.find(h => h.id === parseInt(hospitalId));
    return hospital ? hospital.name : `Hospital ${hospitalId}`;
  } catch (error) {
    console.error(`Error fetching hospital name for ID ${hospitalId}:`, error);
    return `Hospital ${hospitalId}`;
  }
};

export const hospitalService = {
    fetchAllData,
    getHospitals,
    getAllHospitals,
    getAllMetrics,
    getAllDoctors,
    getHospitalDetails,
    getHospitalMetrics,
    getHospitalCertifications,
    getHospitalEquipment,
    getHospitalAddresses,
    getHospitalSpecialties,
    getHospitalDoctors,
    getHospitalInfrastructure,
    getHospitalContacts,
    getWardData,
    getHospitalProfile,
    getEquipmentMatrix,
    getHospitalNameById
};