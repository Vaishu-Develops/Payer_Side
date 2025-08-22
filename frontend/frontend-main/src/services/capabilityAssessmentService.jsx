import dataService from './dataService';

/**
 * Fetches a list of all hospitals for populating a selector.
 * @returns {Promise<Array>} A promise that resolves to a list of hospitals with id and name.
 */
export const fetchHospitalList = async () => {
    try {
        const response = await dataService.getHospitals();
        if (!response.success) {
            throw new Error('Failed to fetch hospital list.');
        }
        // Safely extract the hospitals array
        return response.data?.hospitals || (Array.isArray(response.data) ? response.data : []);
    } catch (error) {
        console.error("Error fetching hospital list:", error);
        throw error;
    }
};


/**
 * Fetches all capability-related data for a specific hospital ID.
 * This includes details, specialties, equipment, and doctors.
 *
 * @param {number | string} hospitalId - The ID of the hospital to fetch data for.
 * @returns {Promise<Object>} A promise resolving to a comprehensive object of the hospital's data.
 * @throws {Error} If any data fetching fails.
 */
export const fetchHospitalCapabilityData = async (hospitalId) => {
  if (!hospitalId) {
    throw new Error("Hospital ID is required.");
  }

  try {
    // Use Promise.all to fetch all data concurrently for better performance.
    const [detailsRes, specialtiesRes, equipmentRes, doctorsRes, infrastructureRes] = await Promise.all([
      dataService.getHospitalDetails(hospitalId),
      dataService.getMedicalSpecialties(), // Fetching all and filtering locally is often more efficient than multiple small API calls
      dataService.getHospitalEquipment(),
      dataService.getDoctors(),
      dataService.getHospitalInfrastructure(),
    ]);

    // Validate all responses
    if (!detailsRes.success || !specialtiesRes.success || !equipmentRes.success || !doctorsRes.success || !infrastructureRes.success) {
      throw new Error(`Failed to fetch complete capability data for hospital ID ${hospitalId}.`);
    }

    // Safely extract and filter data for the selected hospital
    const hospitalDetails = detailsRes.data || {};
    const specialties = (Array.isArray(specialtiesRes.data) ? specialtiesRes.data : []).filter(s => s.hospital_id === hospitalId);
    const equipment = (Array.isArray(equipmentRes.data) ? equipmentRes.data : []).filter(e => e.hospital_id === hospitalId);
    const doctors = (Array.isArray(doctorsRes.data) ? doctorsRes.data : []).filter(d => d.hospital_id === hospitalId);
    const infrastructure = (Array.isArray(infrastructureRes.data) ? infrastructureRes.data : []).filter(i => i.hospital_id === hospitalId);

    return {
      details: hospitalDetails,
      specialties,
      equipment,
      doctors,
      infrastructure
    };

  } catch (error) {
    console.error(`Error fetching capability data for hospital ${hospitalId}:`, error);
    throw error;
  }
};
