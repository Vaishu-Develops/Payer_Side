// Get current year for age calculations
const getCurrentYear = () => new Date().getFullYear();

// Calculate equipment age based on installation year
export const calculateEquipmentAge = (equipment) => {
  const currentYear = getCurrentYear();
  return currentYear - equipment.installation_year;
};

// Get modernization priority based on age
export const getModernizationPriority = (age) => {
  if (age > 10) return 'critical';      // Red - Immediate replacement needed
  if (age >= 8) return 'high';          // Orange - Plan replacement within 2 years  
  if (age >= 6) return 'medium';        // Yellow - Monitor closely
  return 'low';                         // Green - Good condition
};

// Priority color mapping
export const PRIORITY_COLORS = {
  critical: '#ff4d4f',
  high: '#fa8c16', 
  medium: '#faad14',
  low: '#52c41a'
};

// Priority labels
export const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High Priority',
  medium: 'Medium Priority', 
  low: 'Low Priority'
};

// Calculate KPI statistics
export const calculateKPIStats = (equipment) => {
  if (equipment.length === 0) {
    return {
      criticalCount: 0,
      agingCount: 0,
      modernCount: 0,
      averageAge: 0
    };
  }

  const ages = equipment.map(eq => calculateEquipmentAge(eq));
  
  const criticalCount = ages.filter(age => age > 10).length;
  const agingCount = ages.filter(age => age >= 6 && age <= 10).length;
  const modernCount = ages.filter(age => age < 6).length;
  
  const totalAge = ages.reduce((sum, age) => sum + age, 0);
  const averageAge = totalAge / ages.length;

  return {
    criticalCount,
    agingCount, 
    modernCount,
    averageAge: Math.round(averageAge * 10) / 10 // Round to 1 decimal place
  };
};

// Get age distribution data for chart
export const getAgeDistribution = (equipment) => {
  const ages = equipment.map(eq => calculateEquipmentAge(eq));
  
  const ranges = [
    { range: '0-2 years', min: 0, max: 2, color: '#52c41a' },
    { range: '3-5 years', min: 3, max: 5, color: '#73d13d' },
    { range: '6-10 years', min: 6, max: 10, color: '#faad14' },
    { range: '>10 years', min: 11, max: 100, color: '#ff4d4f' }
  ];

  const distribution = ranges.map(range => {
    const count = ages.filter(age => age >= range.min && age <= range.max).length;
    const percentage = equipment.length > 0 ? Math.round((count / equipment.length) * 100) : 0;
    
    return {
      ...range,
      count,
      percentage
    };
  });

  return distribution;
};

// Get category analysis data
export const getCategoryAnalysis = (equipment) => {
  const categoryMap = {};

  equipment.forEach(eq => {
    const category = eq.category || 'Uncategorized';
    const age = calculateEquipmentAge(eq);
    
    if (!categoryMap[category]) {
      categoryMap[category] = {
        category,
        totalCount: 0,
        ages: [],
        criticalCount: 0
      };
    }
    
    categoryMap[category].totalCount += eq.quantity || 1;
    categoryMap[category].ages.push(age);
    
    if (age > 10) {
      categoryMap[category].criticalCount += eq.quantity || 1;
    }
  });

  return Object.values(categoryMap).map(cat => {
    const averageAge = cat.ages.length > 0 ? 
      Math.round((cat.ages.reduce((sum, age) => sum + age, 0) / cat.ages.length) * 10) / 10 : 0;
    
    let status = 'Good';
    if (cat.criticalCount > 0) status = 'Critical';
    else if (averageAge >= 6) status = 'Aging';

    return {
      category: cat.category,
      totalCount: cat.totalCount,
      averageAge,
      criticalCount: cat.criticalCount,
      status
    };
  }).sort((a, b) => b.criticalCount - a.criticalCount);
};

// Get hospital summary data
export const getHospitalSummary = (equipment, hospitals) => {
  const hospitalMap = {};

  equipment.forEach(eq => {
    const hospitalId = eq.hospital_id;
    const age = calculateEquipmentAge(eq);
    
    if (!hospitalMap[hospitalId]) {
      hospitalMap[hospitalId] = {
        hospitalId,
        hospitalName: hospitals.find(h => h.id === hospitalId)?.name || 'Unknown Hospital',
        totalEquipment: 0,
        ages: []
      };
    }
    
    hospitalMap[hospitalId].totalEquipment += eq.quantity || 1;
    hospitalMap[hospitalId].ages.push(age);
  });

  return Object.values(hospitalMap).map(hosp => {
    const ages = hosp.ages;
    const oldestAge = Math.max(...ages);
    const newestAge = Math.min(...ages);
    const averageAge = ages.reduce((sum, age) => sum + age, 0) / ages.length;
    
    let overallStatus = 'Good';
    if (oldestAge > 10 || averageAge > 8) overallStatus = 'Critical';
    else if (averageAge >= 6) overallStatus = 'Aging';

    return {
      hospitalId: hosp.hospitalId,
      hospitalName: hosp.hospitalName,
      totalEquipment: hosp.totalEquipment,
      oldestAge: Math.round(oldestAge),
      newestAge: Math.round(newestAge),
      averageAge: Math.round(averageAge * 10) / 10,
      overallStatus
    };
  }).sort((a, b) => b.oldestAge - a.oldestAge);
};

// Get equipment replacement recommendations
export const getReplacementRecommendations = (equipment) => {
  return equipment
    .filter(eq => calculateEquipmentAge(eq) > 8)
    .map(eq => ({
      ...eq,
      age: calculateEquipmentAge(eq),
      priority: getModernizationPriority(calculateEquipmentAge(eq)),
      recommendedAction: calculateEquipmentAge(eq) > 10 ? 'Immediate Replacement' : 'Plan Replacement'
    }))
    .sort((a, b) => b.age - a.age);
};

// Calculate modernization budget estimate
export const calculateBudgetEstimate = (equipment, categoryPrices = {}) => {
  const defaultPrices = {
    'Surgery': 500000,
    'Critical Care': 300000,
    'Diagnostic': 200000,
    'Laboratory': 150000,
    'General': 100000
  };

  const prices = { ...defaultPrices, ...categoryPrices };

  return equipment
    .filter(eq => calculateEquipmentAge(eq) > 8)
    .reduce((total, eq) => {
      const basePrice = prices[eq.category] || prices['General'];
      const quantity = eq.quantity || 1;
      return total + (basePrice * quantity);
    }, 0);
};

// Export all utilities
export default {
  calculateEquipmentAge,
  getModernizationPriority,
  calculateKPIStats,
  getAgeDistribution,
  getCategoryAnalysis,
  getHospitalSummary,
  getReplacementRecommendations,
  calculateBudgetEstimate,
  PRIORITY_COLORS,
  PRIORITY_LABELS
};
