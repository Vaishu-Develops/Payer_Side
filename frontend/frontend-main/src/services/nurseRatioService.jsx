import dataService from './dataService';

// Fallback data structure
const getFallbackHospitals = () => [
  {
    "id": 136,
    "name": "Talwar LLC Hospital",
    "hospital_type": "Multi Specialty",
    "category": "Tertiary Care",
    "beds_registered": 716,
    "beds_operational": 644
  }
  // ... rest of hospital data
];

const getFallbackMetrics = () => [
  {
    "id": 61,
    "hospital_id": 121,
    "qualified_nurses": 383,
    "icu_nurses_all_shifts": 90,
    "nurse_bed_ratio": 0.87,
    "icu_nurse_bed_ratio": 1.17
  }
  // ... rest of metrics data
];

// Fetch hospitals data
export const fetchHospitals = async () => {
  try {
    console.log('🔄 Fetching hospitals data...');
    const response = await dataService.getHospitals();
    
    if (response.success) {
      console.log('✅ Successfully fetched hospitals data');
      return response.data.hospitals || response.data;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('❌ Error fetching hospitals:', error);
    console.log('📁 Using fallback hospitals data');
    return getFallbackHospitals();
  }
};

// Fetch hospital metrics data
export const fetchHospitalMetrics = async () => {
  try {
    console.log('🔄 Fetching hospital metrics...');
    const response = await dataService.getHospitalMetrics();
    
    if (response.success) {
      console.log('✅ Successfully fetched hospital metrics');
      return response.data.metrics || response.data;
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('❌ Error fetching hospital metrics:', error);
    console.log('📁 Using fallback metrics data');
    return getFallbackMetrics();
  }
};

// Export service object
const nurseRatioService = {
  fetchHospitals,
  fetchHospitalMetrics
};

export default nurseRatioService;
