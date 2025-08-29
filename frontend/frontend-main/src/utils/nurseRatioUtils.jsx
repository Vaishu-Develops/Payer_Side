// Industry benchmark standards
export const BENCHMARK_STANDARDS = {
  ICU: { ratio: 0.5, label: "1:2 (ICU)" },           // 1 nurse per 2 beds
  GENERAL: { ratio: 0.167, label: "1:6 (General)" }, // 1 nurse per 6 beds  
  EMERGENCY: { ratio: 0.25, label: "1:4 (Emergency)" }, // 1 nurse per 4 beds
  PEDIATRIC: { ratio: 0.25, label: "1:4 (Pediatric)" }  // 1 nurse per 4 beds
};

// Calculate compliance status for a hospital
export const calculateCompliance = (hospital) => {
  const generalCompliant = hospital.nurse_bed_ratio >= BENCHMARK_STANDARDS.GENERAL.ratio;
  const icuCompliant = hospital.icu_nurse_bed_ratio >= BENCHMARK_STANDARDS.ICU.ratio;
  
  return {
    status: generalCompliant && icuCompliant ? 'compliant' : 'non-compliant',
    generalCompliant,
    icuCompliant,
    generalGap: BENCHMARK_STANDARDS.GENERAL.ratio - hospital.nurse_bed_ratio,
    icuGap: BENCHMARK_STANDARDS.ICU.ratio - hospital.icu_nurse_bed_ratio
  };
};

// Identify statistical outliers using standard deviation
export const identifyOutliers = (hospitals) => {
  const generalRatios = hospitals.map(h => h.nurse_bed_ratio);
  const mean = generalRatios.reduce((a, b) => a + b, 0) / generalRatios.length;
  const variance = generalRatios.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / generalRatios.length;
  const stdDev = Math.sqrt(variance);
  
  return hospitals.map(hospital => ({
    ...hospital,
    outlierType: hospital.nurse_bed_ratio > (mean + 2 * stdDev) ? 'high' : 
                hospital.nurse_bed_ratio < (mean - 2 * stdDev) ? 'low' : 'normal',
    deviation: Math.abs(hospital.nurse_bed_ratio - mean),
    zscore: (hospital.nurse_bed_ratio - mean) / stdDev
  }));
};

// Calculate summary statistics
export const calculateSummaryStats = (hospitals) => {
  if (hospitals.length === 0) {
    return {
      avgGeneralRatio: 0,
      avgIcuRatio: 0,
      compliantCount: 0,
      criticalOutliers: 0
    };
  }

  const avgGeneralRatio = hospitals.reduce((sum, h) => sum + h.nurse_bed_ratio, 0) / hospitals.length;
  const avgIcuRatio = hospitals.reduce((sum, h) => sum + h.icu_nurse_bed_ratio, 0) / hospitals.length;
  
  const compliantCount = hospitals.filter(h => {
    const compliance = calculateCompliance(h);
    return compliance.status === 'compliant';
  }).length;
  
  const outliers = identifyOutliers(hospitals);
  const criticalOutliers = outliers.filter(h => h.outlierType === 'low').length;
  
  return {
    avgGeneralRatio,
    avgIcuRatio,
    compliantCount,
    criticalOutliers
  };
};

// Get compliance color based on status
export const getComplianceColor = (status) => {
  switch (status) {
    case 'compliant': return 'green';
    case 'non-compliant': return 'red';
    default: return 'blue';
  }
};

// Get ranking data for hospitals
export const getRankingData = (hospitals, rankingType) => {
  const sortKey = rankingType === 'general' ? 'nurse_bed_ratio' : 'icu_nurse_bed_ratio';
  
  return hospitals
    .sort((a, b) => b[sortKey] - a[sortKey])
    .map((hospital, index) => {
      const compliance = calculateCompliance(hospital);
      return {
        ...hospital,
        rank: index + 1,
        complianceStatus: compliance.status
      };
    });
};

// Calculate nurse-to-bed ratios (if not pre-calculated)
export const calculateNurseBedRatios = (hospital) => {
  const generalRatio = hospital.beds_operational > 0 ? 
    hospital.qualified_nurses / hospital.beds_operational : 0;
  
  const icuRatio = hospital.icu_beds > 0 ? 
    hospital.icu_nurses_all_shifts / hospital.icu_beds : 0;
  
  return {
    generalRatio,
    icuRatio
  };
};

// Get benchmark recommendations
export const getBenchmarkRecommendations = (hospital) => {
  const compliance = calculateCompliance(hospital);
  const recommendations = [];
  
  if (!compliance.generalCompliant) {
    const requiredNurses = Math.ceil(hospital.beds_operational * BENCHMARK_STANDARDS.GENERAL.ratio);
    const shortage = requiredNurses - hospital.qualified_nurses;
    recommendations.push({
      type: 'general',
      message: `Add ${shortage} nurses for general wards to meet benchmark`,
      priority: 'high'
    });
  }
  
  if (!compliance.icuCompliant) {
    const requiredIcuNurses = Math.ceil(hospital.icu_beds * BENCHMARK_STANDARDS.ICU.ratio);
    const icuShortage = requiredIcuNurses - hospital.icu_nurses_all_shifts;
    recommendations.push({
      type: 'icu',
      message: `Add ${icuShortage} ICU nurses to meet benchmark`,
      priority: 'critical'
    });
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'maintain',
      message: 'Hospital meets all benchmarks. Maintain current staffing levels.',
      priority: 'low'
    });
  }
  
  return recommendations;
};

// Export all utilities
export default {
  BENCHMARK_STANDARDS,
  calculateCompliance,
  identifyOutliers,
  calculateSummaryStats,
  getComplianceColor,
  getRankingData,
  calculateNurseBedRatios,
  getBenchmarkRecommendations
};
