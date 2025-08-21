import dataService from './dataService';

/**
 * Fetches hospital data from the API.
 * This function is designed to be robust and handle various possible API response structures.
 *
 * @returns {Promise<Array>} A promise that resolves to an array of hospital objects.
 * @throws {Error} If the API call fails or the response format is invalid.
 */
export const fetchHospitalData = async () => {
  try {
    const response = await dataService.getHospitals(); // Uses the existing method that fetches hospitals.json

    // Defensive check for a successful API call.
    if (!response || !response.success) {
      throw new Error('API request failed to fetch hospital data.');
    }

    // Safely extract the hospital array from the response.
    // It handles cases where the array is nested (e.g., { hospitals: [...] }) or is the direct response.
    const hospitals = response.data?.hospitals || (Array.isArray(response.data) ? response.data : []);

    // Ensure the final result is always an array.
    if (!Array.isArray(hospitals)) {
        console.error("Invalid data structure received. Expected an array of hospitals.", response.data);
        throw new Error("Invalid data format received from the server.");
    }
    
    return hospitals;
  } catch (error) {
    console.error('Error in hospitalTypeService:', error);
    // Propagate the error to be handled by the UI component.
    throw error;
  }
};
