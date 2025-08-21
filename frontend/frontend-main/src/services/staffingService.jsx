import dataService from './dataService';

/**
 * Fetches and combines hospital details with their corresponding staffing metrics.
 * 
 * @returns {Promise<Array>} A promise that resolves to a merged array of hospital staffing data.
 * @throws {Error} If API calls fail or data is malformed.
 */
export const fetchStaffingData = async () => {
  try {
    // Fetch both datasets concurrently for efficiency.
    const [hospitalsResponse, metricsResponse] = await Promise.all([
      dataService.getHospitals(),      // Fetches hospitals.json
      dataService.getHospitalMetrics() // Fetches hospital_metrics.json
    ]);

    // Perform safety checks on the API responses.
    if (!hospitalsResponse.success || !metricsResponse.success) {
      throw new Error('Failed to fetch required staffing data from the server.');
    }

    // Safely extract the arrays from potentially nested response objects.
    const hospitals = hospitalsResponse.data?.hospitals || (Array.isArray(hospitalsResponse.data) ? hospitalsResponse.data : []);
    const metrics = Array.isArray(metricsResponse.data) ? metricsResponse.data : [];

    if (!hospitals.length || !metrics.length) {
      console.warn("One or both data sources (hospitals, metrics) returned empty.");
      return [];
    }

    // Create a lookup map for metrics for efficient merging (O(n) instead of O(n^2)).
    const metricsMap = new Map(metrics.map(metric => [metric.hospital_id, metric]));

    // Merge hospital data with its corresponding metrics.
    const mergedData = hospitals
      .map(hospital => {
        const hospitalMetrics = metricsMap.get(hospital.id);
        if (hospitalMetrics) {
          return {
            ...hospital,        // Includes hospital name, id, etc.
            ...hospitalMetrics, // Includes all ratio and staff count data.
          };
        }
        return null; // This hospital has no metrics data, so we filter it out.
      })
      .filter(Boolean); // The filter(Boolean) removes any null entries.

    return mergedData;

  } catch (error) {
    console.error("Error in fetchStaffingData service:", error);
    // Re-throw the error to be caught by the calling component's error handler.
    throw error;
  }
};
