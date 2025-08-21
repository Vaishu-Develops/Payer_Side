// Define the complete list of expected infrastructure items for scoring.
const INFRASTRUCTURE_CHECKLIST = {
  basic: ['Main Electrical Panel', 'DG Set', 'Water Treatment Plant', 'CCTV System'],
  medical: ['Oxygen Pipeline', 'Central Air Conditioning'],
  support: ['Fire Extinguisher System', 'Network Infrastructure'],
  advanced: ['Main Building', 'Emergency Block'],
};

/**
 * Calculates a hospital's infrastructure score based on available facilities.
 *
 * @param {Array} hospitalInfra - A list of infrastructure items for a single hospital.
 * @returns {object} An object containing the overall score and detailed category scores.
 */
export const calculateInfrastructureScore = (hospitalInfra) => {
  if (!Array.isArray(hospitalInfra)) {
    return { overallScore: 0, categoryScores: {}, grade: 'N/A' };
  }

  const weights = { basic: 0.35, medical: 0.35, support: 0.2, advanced: 0.1 };
  const availableItems = new Set(hospitalInfra.map(item => item.item_name));
  
  // Calculate the completion percentage for each category.
  const categoryScores = {
    basic: (INFRASTRUCTURE_CHECKLIST.basic.filter(item => availableItems.has(item)).length / INFRASTRUCTURE_CHECKLIST.basic.length) * 100,
    medical: (INFRASTRUCTURE_CHECKLIST.medical.filter(item => availableItems.has(item)).length / INFRASTRUCTURE_CHECKLIST.medical.length) * 100,
    support: (INFRASTRUCTURE_CHECKLIST.support.filter(item => availableItems.has(item)).length / INFRASTRUCTURE_CHECKLIST.support.length) * 100,
    advanced: (INFRASTRUCTURE_CHECKLIST.advanced.filter(item => availableItems.has(item)).length / INFRASTRUCTURE_CHECKLIST.advanced.length) * 100,
  };

  // Calculate the final weighted score.
  const overallScore = Object.entries(categoryScores).reduce((total, [category, score]) => {
    return total + (score * weights[category]);
  }, 0);

  return {
    overallScore: Math.round(overallScore),
    categoryScores: {
      basic: Math.round(categoryScores.basic),
      medical: Math.round(categoryScores.medical),
      support: Math.round(categoryScores.support),
      advanced: Math.round(categoryScores.advanced),
    },
    grade: getScoreGrade(overallScore),
  };
};

/**
 * Converts a numeric score into a letter grade.
 * @param {number} score - The overall infrastructure score.
 * @returns {string} The corresponding letter grade (A, B, C, D, or F).
 */
export const getScoreGrade = (score) => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};
