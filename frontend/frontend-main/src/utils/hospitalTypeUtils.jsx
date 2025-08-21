/**
 * Processes a raw list of hospitals to calculate distribution statistics by hospital type.
 * 
 * @param {Array} hospitals - The array of hospital objects from the API.
 * @returns {Array} An array of objects, each representing a hospital type with its aggregated data.
 */
export const processHospitalDistribution = (hospitals) => {
  // Guard against null, undefined, or non-array inputs.
  if (!Array.isArray(hospitals) || hospitals.length === 0) {
    return [];
  }

  const typeMap = new Map();

  hospitals.forEach(hospital => {
    // Fallback for missing or null hospital_type to prevent errors.
    const type = hospital.hospital_type || 'Unknown';
    // Ensure beds_operational is a valid number, defaulting to 0 if not.
    const beds = Number(hospital.beds_operational) || 0;

    if (!typeMap.has(type)) {
      typeMap.set(type, { count: 0, totalBeds: 0 });
    }

    const currentType = typeMap.get(type);
    currentType.count += 1;
    currentType.totalBeds += beds;
  });

  // Convert the map into an array of objects for easier use in components.
  const distributionData = Array.from(typeMap.entries()).map(([name, data]) => ({
    name,
    hospitalCount: data.count,
    totalBeds: data.totalBeds,
  }));

  // Sort by hospital count in descending order for better chart readability.
  return distributionData.sort((a, b) => b.hospitalCount - a.hospitalCount);
};
