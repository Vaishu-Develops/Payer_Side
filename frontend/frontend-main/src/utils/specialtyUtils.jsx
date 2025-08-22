/**
 * Processes raw specialty and doctor data to create an aggregated analysis.
 *
 * @param {Array} specialties - The list of all medical specialties offered by hospitals.
 * @param {Array} doctors - The list of all doctors.
 * @param {Array} hospitals - The list of all hospitals, used for total count in coverage calculation.
 * @returns {Array} An array of specialty objects with aggregated counts and coverage data.
 */
export const processSpecialtyDistribution = (specialties, doctors, hospitals) => {
  // Guard against invalid or empty inputs.
  if (!Array.isArray(specialties) || !Array.isArray(doctors) || !Array.isArray(hospitals)) {
    return [];
  }

  const totalHospitals = hospitals.length;
  if (totalHospitals === 0) return [];

  // 1. Map specialty IDs to their names for easy lookup.
  const specialtyIdToName = new Map(specialties.map(s => [s.id, s.specialty_name]));

  // 2. Aggregate doctor counts and hospital occurrences per specialty ID.
  const doctorAggregation = doctors.reduce((acc, doctor) => {
    const specialtyId = doctor.specialty_id;
    if (!acc[specialtyId]) {
      acc[specialtyId] = { doctorCount: 0, hospitalIds: new Set() };
    }
    acc[specialtyId].doctorCount++;
    acc[specialtyId].hospitalIds.add(doctor.hospital_id);
    return acc;
  }, {});
  
  // 3. Create the final distribution data by specialty name.
  const distributionMap = new Map();
  Object.entries(doctorAggregation).forEach(([specialtyId, data]) => {
    const specialtyName = specialtyIdToName.get(parseInt(specialtyId)) || 'Unknown Specialty';
    
    if (!distributionMap.has(specialtyName)) {
      distributionMap.set(specialtyName, { doctorCount: 0, hospitalCount: 0, hospitalIds: new Set() });
    }
    
    const current = distributionMap.get(specialtyName);
    current.doctorCount += data.doctorCount;
    data.hospitalIds.forEach(id => current.hospitalIds.add(id));
  });

  // 4. Convert the map to an array and calculate coverage percentage.
  const finalData = Array.from(distributionMap.entries()).map(([specialty, data]) => ({
    specialty,
    doctorCount: data.doctorCount,
    hospitalCount: data.hospitalIds.size,
    coveragePercentage: Math.round((data.hospitalIds.size / totalHospitals) * 100),
  }));

  // 5. Sort by the number of doctors in descending order.
  return finalData.sort((a, b) => b.doctorCount - a.doctorCount);
};

/**
 * Identifies specialties that are underserved based on predefined thresholds.
 *
 * @param {Array} processedData - The aggregated specialty data from processSpecialtyDistribution.
 * @returns {Array} A list of underserved specialties.
 */
export const identifyGaps = (processedData) => {
    // Define thresholds for what is considered an "underserved" specialty.
    const DOCTOR_COUNT_THRESHOLD = 5;
    const COVERAGE_THRESHOLD = 15; // 15% hospital coverage

    return processedData.filter(specialty => 
        specialty.doctorCount < DOCTOR_COUNT_THRESHOLD || 
        specialty.coveragePercentage < COVERAGE_THRESHOLD
    );
};
