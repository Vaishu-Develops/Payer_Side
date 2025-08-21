import dataService from './dataService';

/**
 * NOTE: For this service to work, a new method `getHospitalInfrastructure` should be added
 * to your existing `src/services/dataService.js` file.
 * 
 * Example addition to dataService.js:
 * 
 * class DataService {
 *   // ... existing methods
 * 
 *   async getHospitalInfrastructure() {
 *     // This endpoint should serve the `hospital_infrastructure.json` file.
 *     return this.handleRequest('/hospital_infrastructure');
 *   }
 * 
 *   // ... other methods
 * }
 */

/**
 * Fetches and merges hospital data with their infrastructure details.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of hospitals, each with its infrastructure list.
 * @throws {Error} If API calls fail or data is malformed.
 */
export const fetchInfrastructureData = async () => {
  try {
    // Fetch both datasets in parallel for efficiency.
    const [hospitalsResponse, infrastructureResponse] = await Promise.all([
      dataService.getHospitals(),
      dataService.getHospitalInfrastructure(), // Assumes this new method exists.
    ]);

    // Validate API responses.
    if (!hospitalsResponse.success || !infrastructureResponse.success) {
      throw new Error('Failed to fetch required data from the server.');
    }

    // Safely extract the arrays from the response objects.
    const hospitals = hospitalsResponse.data?.hospitals || (Array.isArray(hospitalsResponse.data) ? hospitalsResponse.data : []);
    const infrastructure = Array.isArray(infrastructureResponse.data) ? infrastructureResponse.data : [];

    if (!hospitals.length || !infrastructure.length) {
      console.warn("One or both data sources (hospitals, infrastructure) are empty.");
      return [];
    }

    // Group infrastructure items by hospital_id for efficient merging.
    const infraByHospital = infrastructure.reduce((acc, item) => {
      const hospitalId = item.hospital_id;
      if (!acc[hospitalId]) {
        acc[hospitalId] = [];
      }
      acc[hospitalId].push(item);
      return acc;
    }, {});

    // Map over hospitals and attach their infrastructure data.
    const mergedData = hospitals.map(hospital => ({
      ...hospital,
      infrastructure: infraByHospital[hospital.id] || [], // Ensure an empty array if no infra data exists.
    }));

    return mergedData;

  } catch (error) {
    console.error('Error in infrastructureService:', error);
    throw error;
  }
};
