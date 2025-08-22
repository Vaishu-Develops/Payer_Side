import dataService from './dataService';

/**
 * NOTE: For this service to work, new methods `getMedicalSpecialties` and `getDoctors`
 * should be added to your existing `src/services/dataService.js` file.
 *
 * Example additions to dataService.js:
 *
 * class DataService {
 *   // ... existing methods
 *
 *   async getMedicalSpecialties() {
 *     return this.handleRequest('/medical_specialties'); // Serves medical_specialties.json
 *   }
 *
 *   async getDoctors() {
 *     return this.handleRequest('/doctors'); // Serves doctors.json
 *   }
 * }
 */

/**
 * Fetches all data required for the specialty distribution analysis.
 *
 * @returns {Promise<Object>} An object containing lists of specialties, doctors, and hospitals.
 * @throws {Error} If any of the API calls fail or return invalid data.
 */
export const fetchSpecialtyData = async () => {
  try {
    // Fetch all required datasets concurrently for better performance.
    const [specialtiesResponse, doctorsResponse, hospitalsResponse] = await Promise.all([
      dataService.getMedicalSpecialties(),
      dataService.getDoctors(),
      dataService.getHospitals(),
    ]);

    // Validate that all API calls were successful.
    if (!specialtiesResponse.success || !doctorsResponse.success || !hospitalsResponse.success) {
      throw new Error('Failed to fetch one or more required datasets.');
    }

    // Safely extract arrays from the responses, handling various possible structures.
    const specialties = Array.isArray(specialtiesResponse.data) ? specialtiesResponse.data : [];
    const doctors = Array.isArray(doctorsResponse.data) ? doctorsResponse.data : [];
    const hospitals = hospitalsResponse.data?.hospitals || (Array.isArray(hospitalsResponse.data) ? hospitalsResponse.data : []);

    return { specialties, doctors, hospitals };
    
  } catch (error) {
    console.error("Error in specialtyService:", error);
    // Propagate the error to be handled by the UI component.
    throw error;
  }
};
