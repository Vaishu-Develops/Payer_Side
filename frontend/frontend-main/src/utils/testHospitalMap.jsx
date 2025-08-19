// Test script to debug Hospital Map data fetching
import dataService from '../services/dataService.jsx';

async function testHospitalMapData() {
    console.log('🧪 Testing Hospital Map data fetching...');
    
    try {
        // Test the fetchHospitalsData method
        const response = await dataService.fetchHospitalsData();
        
        console.log('📊 Response:', response);
        console.log('🏥 Success:', response.success);
        
        if (response.success) {
            const data = response.data;
            console.log('📋 Response structure:', Object.keys(data));
            console.log('🔢 Count:', data.count);
            console.log('🏥 Hospitals array length:', data.hospitals?.length || 'No hospitals array');
            
            if (data.hospitals && data.hospitals.length > 0) {
                const firstHospital = data.hospitals[0];
                console.log('🏥 First hospital:', firstHospital.name);
                console.log('📍 Has coordinates:', !!firstHospital.latitude && !!firstHospital.longitude);
                console.log('📍 Latitude:', firstHospital.latitude);
                console.log('📍 Longitude:', firstHospital.longitude);
                
                // Count hospitals with coordinates
                const withCoords = data.hospitals.filter(h => h.latitude && h.longitude);
                console.log(`📊 Hospitals with coordinates: ${withCoords.length}/${data.hospitals.length}`);
            }
        } else {
            console.error('❌ Request failed:', response.error);
        }
    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

// Export for manual testing
export { testHospitalMapData };
