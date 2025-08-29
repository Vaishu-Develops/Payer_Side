import dataService from './dataService';

// Fetch hospital equipment data
const fetchHospitalEquipment = async () => {
  try {
    console.log('🔄 Fetching hospital equipment...');
    const response = await dataService.getHospitalEquipment();
    
    if (response.success) {
      console.log('✅ Successfully fetched hospital equipment');
      return response.data.equipment || response.data || [];
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('❌ Error fetching hospital equipment:', error);
    // Return empty array instead of fallback data to keep it dynamic
    return [];
  }
};

// Fetch hospitals data
const fetchHospitals = async () => {
  try {
    console.log('🔄 Fetching hospitals data...');
    const response = await dataService.getHospitals();
    
    if (response.success) {
      console.log('✅ Successfully fetched hospitals data');
      return response.data.hospitals || response.data || [];
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('❌ Error fetching hospitals:', error);
    return [];
  }
};

// Process equipment data for modernization analysis
const processEquipmentData = (equipment, hospitals) => {
  const currentYear = new Date().getFullYear();
  
  // Calculate equipment age and categorize
  const processedEquipment = equipment.map(item => {
    const age = currentYear - (item.installation_year || (item.created_at ? new Date(item.created_at).getFullYear() : currentYear));
    let ageCategory = '';
    let priority = '';
    
    if (age <= 2) {
      ageCategory = '0-2 years';
      priority = 'Low Priority';
    } else if (age <= 5) {
      ageCategory = '3-5 years';
      priority = 'Low Priority';
    } else if (age <= 8) {
      ageCategory = '6-8 years';
      priority = 'Medium Priority';
    } else if (age <= 10) {
      ageCategory = '9-10 years';
      priority = 'High Priority';
    } else {
      ageCategory = '10+ years';
      priority = 'Critical Priority';
    }
    
    return {
      ...item,
      age,
      ageCategory,
      priority
    };
  });

  // Create age distribution data for chart
  const ageDistribution = {
    '0-2 years': { count: 0, color: '#10b981' },
    '3-5 years': { count: 0, color: '#3b82f6' },
    '6-8 years': { count: 0, color: '#f59e0b' },
    '9-10 years': { count: 0, color: '#f97316' },
    '10+ years': { count: 0, color: '#ef4444' }
  };

  processedEquipment.forEach(item => {
    ageDistribution[item.ageCategory].count++;
  });

  const ageDistributionData = Object.keys(ageDistribution).map(range => ({
    range,
    count: ageDistribution[range].count,
    color: ageDistribution[range].color
  }));

  // Create priority data for pie chart
  const priorityDistribution = {
    'Low Priority': { count: 0, color: '#10b981' },
    'Medium Priority': { count: 0, color: '#f59e0b' },
    'High Priority': { count: 0, color: '#f97316' },
    'Critical Priority': { count: 0, color: '#ef4444' }
  };

  processedEquipment.forEach(item => {
    priorityDistribution[item.priority].count++;
  });

  const priorityData = Object.keys(priorityDistribution).map(name => ({
    name,
    value: priorityDistribution[name].count,
    color: priorityDistribution[name].color
  }));

  // Calculate KPI metrics
  const totalEquipment = processedEquipment.length;
  const criticalEquipment = processedEquipment.filter(item => item.age > 10).length;
  const agingEquipment = processedEquipment.filter(item => item.age >= 6 && item.age <= 10).length;
  const modernEquipment = processedEquipment.filter(item => item.age < 6).length;
  const averageAge = totalEquipment > 0 ? 
    (processedEquipment.reduce((sum, item) => sum + item.age, 0) / totalEquipment).toFixed(1) : 0;

  // Group by category
  const categoryStats = {};
  processedEquipment.forEach(item => {
    const category = item.category || 'Unknown';
    if (!categoryStats[category]) {
      categoryStats[category] = {
        totalCount: 0,
        criticalCount: 0,
        ageSum: 0
      };
    }
    categoryStats[category].totalCount++;
    categoryStats[category].ageSum += item.age;
    if (item.age > 10) {
      categoryStats[category].criticalCount++;
    }
  });

  const categoryData = Object.keys(categoryStats).map(category => ({
    category,
    totalCount: categoryStats[category].totalCount,
    averageAge: (categoryStats[category].ageSum / categoryStats[category].totalCount).toFixed(1) + ' years',
    criticalCount: categoryStats[category].criticalCount,
    status: categoryStats[category].criticalCount === 0 ? 'Good' : 'Needs Attention'
  }));

  // Group by hospital
  const hospitalStats = {};
  const hospitalMap = hospitals.reduce((map, hospital) => {
    map[hospital.id] = hospital;
    return map;
  }, {});

  processedEquipment.forEach(item => {
    const hospitalId = item.hospital_id;
    const hospital = hospitalMap[hospitalId];
    if (hospital) {
      if (!hospitalStats[hospitalId]) {
        hospitalStats[hospitalId] = {
          name: hospital.name,
          totalEquipment: 0,
          oldestAge: 0,
          criticalCount: 0
        };
      }
      hospitalStats[hospitalId].totalEquipment++;
      if (item.age > hospitalStats[hospitalId].oldestAge) {
        hospitalStats[hospitalId].oldestAge = item.age;
      }
      if (item.age > 10) {
        hospitalStats[hospitalId].criticalCount++;
      }
    }
  });

  const hospitalData = Object.keys(hospitalStats).map(hospitalId => ({
    hospitalName: hospitalStats[hospitalId].name,
    totalEquipment: hospitalStats[hospitalId].totalEquipment,
    oldestEquipment: hospitalStats[hospitalId].oldestAge + ' years',
    overallStatus: hospitalStats[hospitalId].criticalCount === 0 ? 'Good' : 'Needs Attention'
  }));

  return {
    ageDistributionData,
    priorityData,
    kpiMetrics: {
      criticalEquipment,
      agingEquipment,
      modernEquipment,
      averageAge
    },
    categoryData,
    hospitalData,
    processedEquipment
  };
};

// Export service object
const equipmentService = {
  fetchHospitalEquipment,
  fetchHospitals,
  processEquipmentData
};

export default equipmentService;
