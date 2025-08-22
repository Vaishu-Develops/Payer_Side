// Benchmarks for scoring. In a real application, these would come from a configuration file or API.
const BENCHMARKS = {
  TOTAL_SPECIALTIES: 25,  // Total number of common specialties expected in a top-tier hospital.
  STANDARD_EQUIPMENT_COUNT: 10, // Number of essential equipment types.
  IDEAL_DOCTOR_BED_RATIO: 0.3, // An ideal ratio for scoring purposes.
};

/**
 * Calculates a comprehensive capability score for a hospital.
 *
 * @param {object} hospitalData - The aggregated data object for a hospital.
 * @returns {object} An object with the overall score, category scores, and grade.
 */
export const calculateCapabilityScore = (hospitalData) => {
  if (!hospitalData || !hospitalData.details) {
    return { overallScore: 0, categoryScores: {}, grade: 'N/A' };
  }

  const { specialties = [], equipment = [], doctors = [], infrastructure = [] } = hospitalData;
  const beds = hospitalData.details.beds_operational || 1; // Default to 1 to avoid division by zero.
  
  // Calculate individual scores for each category (capped at 100).
  const scores = {
    specialties: Math.min((specialties.length / BENCHMARKS.TOTAL_SPECIALTIES) * 100, 100),
    equipment: Math.min((equipment.length / BENCHMARKS.STANDARD_EQUIPMENT_COUNT) * 100, 100),
    staffing: Math.min((doctors.length / beds) / BENCHMARKS.IDEAL_DOCTOR_BED_RATIO * 100, 100),
    infrastructure: calculateInfraSubScore(infrastructure) // Use a sub-score for infrastructure
  };

  // Define weights for each category.
  const weights = { specialties: 0.3, equipment: 0.3, staffing: 0.25, infrastructure: 0.15 };

  // Calculate the final weighted score.
  const overallScore = Object.entries(scores).reduce((total, [category, score]) => {
    return total + (score * weights[category]);
  }, 0);

  return {
    overallScore: Math.round(overallScore),
    categoryScores: {
      specialties: Math.round(scores.specialties),
      equipment: Math.round(scores.equipment),
      staffing: Math.round(scores.staffing),
      infrastructure: Math.round(scores.infrastructure),
    },
    grade: getScoreGrade(overallScore),
  };
};

/**
 * A simple sub-scoring function for infrastructure based on item count.
 * @param {Array} infraItems - The list of infrastructure items.
 * @returns {number} A score from 0 to 100.
 */
const calculateInfraSubScore = (infraItems) => {
  // A simple scoring model: 10 points per major infrastructure item, capped at 100.
  const score = (infraItems.length || 0) * 10;
  return Math.min(score, 100);
};

/**
 * Converts a numeric score to a letter grade.
 * @param {number} score - The overall capability score.
 * @returns {string} The letter grade.
 */
export const getScoreGrade = (score) => {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
};
