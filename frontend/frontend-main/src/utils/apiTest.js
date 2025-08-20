// Test API connectivity
async function testAPI() {
  try {
    console.log('Testing backend API connectivity...');
    
    // Test hospitals endpoint
    const hospitalsResponse = await fetch('/api/hospitals');
    console.log('Hospitals API status:', hospitalsResponse.status);
    
    if (hospitalsResponse.ok) {
      const hospitalsData = await hospitalsResponse.json();
      console.log('Hospitals data type:', typeof hospitalsData);
      console.log('Hospitals data length:', Array.isArray(hospitalsData) ? hospitalsData.length : 'Not an array');
      console.log('First hospital sample:', Array.isArray(hospitalsData) ? hospitalsData[0] : hospitalsData);
    }
    
    // Test certifications endpoint
    const certificationsResponse = await fetch('/api/hospital_certifications');
    console.log('Certifications API status:', certificationsResponse.status);
    
    if (certificationsResponse.ok) {
      const certificationsData = await certificationsResponse.json();
      console.log('Certifications data type:', typeof certificationsData);
      console.log('Certifications data length:', Array.isArray(certificationsData) ? certificationsData.length : 'Not an array');
      console.log('First certification sample:', Array.isArray(certificationsData) ? certificationsData[0] : certificationsData);
    }
    
  } catch (error) {
    console.error('API test failed:', error);
  }
}

// Run the test when the page loads
if (typeof window !== 'undefined') {
  window.testAPI = testAPI;
  // Auto-run test
  testAPI();
}

export default testAPI;
