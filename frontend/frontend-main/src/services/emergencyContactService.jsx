import dataService from './dataService';

/**
 * Fetches and merges hospital and contact data to create a list of emergency contacts.
 * 
 * @returns {Promise<Array>} A promise that resolves to an array of enriched emergency contact objects.
 * @throws {Error} If API calls fail or data is malformed.
 */
export const fetchEmergencyContacts = async () => {
  try {
    // Fetch both datasets in parallel to improve performance.
    const [hospitalsResponse, contactsResponse] = await Promise.all([
      dataService.getHospitals(),          // Fetches hospitals.json
      dataService.getHospitalContacts(),   // Fetches hospital_contacts.json
    ]);

    // Validate that both API calls were successful.
    if (!hospitalsResponse.success || !contactsResponse.success) {
      throw new Error('Failed to fetch required data from the server.');
    }

    // Safely extract the arrays from the response objects.
    // Handles cases where data might be nested (e.g., { hospitals: [...] }) or a direct array.
    const hospitals = hospitalsResponse.data?.hospitals || (Array.isArray(hospitalsResponse.data) ? hospitalsResponse.data : []);
    const contacts = Array.isArray(contactsResponse.data) ? contactsResponse.data : [];

    if (!hospitals.length || !contacts.length) {
      console.warn("One or both data sources (hospitals, contacts) are empty.");
      return [];
    }
    
    // Create a Map of hospitals for efficient lookup (O(1) access) to avoid nested loops.
    const hospitalMap = new Map(hospitals.map(h => [h.id, h.name]));

    // Filter for only "Emergency Contact" types and enrich them with the hospital name.
    const emergencyContacts = contacts
      .filter(contact => contact.contact_type === 'Emergency Contact')
      .map(contact => {
        // Find the hospital name from the map.
        const hospitalName = hospitalMap.get(contact.hospital_id);
        
        // If a hospital name is found, return the merged object.
        if (hospitalName) {
          return {
            ...contact,
            hospital_name: hospitalName, // Add hospital_name to the contact object.
          };
        }
        
        // If no matching hospital is found, filter this contact out.
        return null;
      })
      .filter(Boolean); // This efficiently removes any null entries.

    return emergencyContacts;

  } catch (error) {
    console.error('Error in emergencyContactService:', error);
    // Re-throw the error so the UI component can handle it.
    throw error;
  }
};
