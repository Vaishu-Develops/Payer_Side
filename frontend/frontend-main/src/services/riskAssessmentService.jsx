import dataService from './dataService';

/**
 * Fetches all necessary data for the risk assessment dashboard.
 * This includes hospital certifications and operational metrics.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing certifications and metrics data.
 */
export const fetchRiskData = async () => {
  try {
    // We use Promise.all to fetch all three datasets in parallel for better performance.
    const [certificationsResponse, metricsResponse, hospitalsResponse] = await Promise.all([
      dataService.getAllHospitalCertifications(), // Fetches hospital_certifications.json
      dataService.getHospitalMetrics(),          // Fetches hospital_metrics.json
      dataService.getHospitals()                 // Fetches hospitals.json for hospital names
    ]);

    // Validate the responses to ensure they are successful and contain data.
    if (!certificationsResponse.success || !metricsResponse.success || !hospitalsResponse.success) {
      throw new Error("Failed to fetch all required risk data.");
    }
    
    // Create a hospital lookup map for efficient name resolution
    const hospitalMap = new Map();
    if (Array.isArray(hospitalsResponse.data)) {
      hospitalsResponse.data.forEach(hospital => {
        hospitalMap.set(hospital.id, hospital.name);
      });
    }
    
    // Enrich certification data with hospital names
    const certificationsWithNames = Array.isArray(certificationsResponse.data) 
      ? certificationsResponse.data.map(cert => ({
          ...cert,
          name: hospitalMap.get(cert.hospital_id) || `Hospital ${cert.hospital_id}`
        }))
      : [];
    
    // Return a structured object with validated data, providing empty arrays as a fallback.
    // The backend returns the data directly as arrays, not nested under additional keys
    return {
      certifications: certificationsWithNames,
      metrics: Array.isArray(metricsResponse.data) ? metricsResponse.data : [],
    };
  } catch (error) {
    console.error("Error in fetchRiskData service:", error);
    // Propagate the error to be handled by the UI component.
    throw error;
  }
};


