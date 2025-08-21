// Centralized benchmark thresholds for easy configuration.
const BENCHMARKS = {
  NURSE_TO_BED: {
    ADEQUATE: 1.2, // Ratio >= 1.2 is adequate
    SHORT: 0.9,    // Ratio between 0.9 and 1.2 is a shortage
  },
  ICU_NURSE_TO_BED: {
    ADEQUATE: 1.5, // ICU requires a higher ratio
    SHORT: 1.0,
  },
};

/**
 * Determines the staffing adequacy status based on a given ratio and benchmark.
 * 
 * @param {number | null | undefined} ratio - The calculated staffing ratio.
 * @param {'NURSE_TO_BED' | 'ICU_NURSE_TO_BED'} benchmarkType - The type of benchmark to use.
 * @returns {Object} An object containing status, color, and a descriptive label.
 */
export const getStaffingStatus = (ratio, benchmarkType) => {
  // Handle cases where data is missing or invalid.
  if (ratio === null || typeof ratio === 'undefined' || isNaN(ratio)) {
    return { status: 'nodata', color: 'default', label: 'No Data' };
  }

  const benchmark = BENCHMARKS[benchmarkType];

  if (ratio >= benchmark.ADEQUATE) {
    return { status: 'adequate', color: 'success', label: 'Adequate' };
  }
  if (ratio >= benchmark.SHORT) {
    return { status: 'short', color: 'warning', label: 'Shortage' };
  }
  return { status: 'critical', color: 'error', label: 'Critical Shortage' };
};

export const calculateNurseToBedRatio = (nurseCount, bedCount) => {
  if (!bedCount || bedCount === 0) return 0;
  return (nurseCount / bedCount).toFixed(2);
};
