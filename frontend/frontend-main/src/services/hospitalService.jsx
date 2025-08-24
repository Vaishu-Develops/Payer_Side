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
    const [hospital, metrics, specialties, equipment, doctors] = await Promise.all([
      api.get(`/hospitals/${id}`),
      api.get(`/hospital_metrics`, { params: { hospital_id: id } }),
      api.get(`/hospitals/${id}/specialties`),
      api.get(`/hospitals/${id}/equipment`),
      api.get(`/hospitals/${id}/doctors`)
    ]);

    return {
      hospital: hospital.data,
      metrics: metrics.data,
      specialties: specialties.data,
      equipment: equipment.data,
      doctors: doctors.data
    };
  } catch (error) {
    console.error('❌ Error fetching hospital profile:', error);
    throw error;
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
    getEquipmentMatrix
};
