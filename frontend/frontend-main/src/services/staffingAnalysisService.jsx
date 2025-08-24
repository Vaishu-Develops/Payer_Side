// staffingAnalysisService.js
import dataService from './dataService';

/**
 * Calculate ratios and staff distribution for a hospital record.
 */
const calculateStaffingMetrics = (hospitalData, doctors = []) => {
  if (!hospitalData) return null;

  return {
    doctorToBedRatio:
      hospitalData.total_doctors && hospitalData.total_beds
        ? hospitalData.total_doctors / hospitalData.total_beds
        : 0,
    nurseToBedRatio:
      hospitalData.qualified_nurses && hospitalData.total_beds
        ? hospitalData.qualified_nurses / hospitalData.total_beds
        : 0,
    staffToPatientRatio:
      (hospitalData.total_doctors + hospitalData.qualified_nurses) &&
      hospitalData.average_patients
        ? (hospitalData.total_doctors + hospitalData.qualified_nurses) /
          hospitalData.average_patients
        : 0,
    doctorToNurseRatio:
      hospitalData.total_doctors && hospitalData.qualified_nurses
        ? hospitalData.total_doctors / hospitalData.qualified_nurses
        : 0,
    specialtyDistribution: doctors.reduce((acc, doc) => {
      acc[doc.specialty_id] = (acc[doc.specialty_id] || 0) + 1;
      return acc;
    }, {}),
  };
};

/**
 * Fetch staffing metrics for a single hospital by ID.
 */
export const getStaffingMetrics = async (hospitalId) => {
  try {
    const [hospitalRes, metricsRes, doctorsRes] = await Promise.all([
      dataService.getHospitalDetails(hospitalId),
      dataService.getHospitalMetrics(),
      dataService.getDoctors(),
    ]);

    if (!hospitalRes.success || !metricsRes.success || !doctorsRes.success) {
      throw new Error('One or more API requests failed.');
    }

    // Extract relevant hospital metrics record
    const hospitalMetrics = Array.isArray(metricsRes.data)
      ? metricsRes.data.find((m) => m.hospital_id === hospitalId)
      : null;

    if (!hospitalMetrics) {
      console.warn(`No metrics found for hospital_id ${hospitalId}`);
      return { success: true, data: null };
    }

    // Filter doctors for this hospital
    const hospitalDoctors = Array.isArray(doctorsRes.data)
      ? doctorsRes.data.filter((d) => d.hospital_id === hospitalId)
      : [];

    const metrics = calculateStaffingMetrics(hospitalMetrics, hospitalDoctors);

    return {
      success: true,
      data: {
        ...hospitalRes.data,
        metrics,
      },
    };
  } catch (err) {
    console.error('Error in getStaffingMetrics:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Fetch staffing metrics for all hospitals.
 */
export const getAllStaffingMetrics = async () => {
  try {
    const [hospitalsRes, metricsRes, doctorsRes] = await Promise.all([
      dataService.getHospitals(),
      dataService.getHospitalMetrics(),
      dataService.getDoctors(),
    ]);

    if (!hospitalsRes.success || !metricsRes.success || !doctorsRes.success) {
      throw new Error('One or more API requests failed.');
    }

    const hospitals = Array.isArray(hospitalsRes.data?.hospitals)
      ? hospitalsRes.data.hospitals
      : hospitalsRes.data || [];

    const metricsList = Array.isArray(metricsRes.data) ? metricsRes.data : [];
    const doctors = Array.isArray(doctorsRes.data) ? doctorsRes.data : [];

    const merged = hospitals.map((hospital) => {
      const hospitalMetrics = metricsList.find(
        (m) => m.hospital_id === hospital.id
      );
      const hospitalDoctors = doctors.filter(
        (doc) => doc.hospital_id === hospital.id
      );

      return {
        ...hospital,
        metrics: calculateStaffingMetrics(hospitalMetrics, hospitalDoctors),
      };
    });

    return { success: true, data: merged };
  } catch (err) {
    console.error('Error in getAllStaffingMetrics:', err);
    return { success: false, error: err.message };
  }
};
