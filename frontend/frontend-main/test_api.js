// Test API endpoints
const testAPI = async () => {
  try {
    console.log('Testing hospital certifications endpoint...');
    const certRes = await fetch('http://127.0.0.1:8001/hospital_certifications');
    const certData = await certRes.json();
    console.log('Certifications data sample:', certData.slice(0, 2));
    
    console.log('Testing hospitals endpoint...');
    const hospRes = await fetch('http://127.0.0.1:8001/hospitals');
    const hospData = await hospRes.json();
    console.log('Hospitals data sample:', hospData.slice(0, 2));
    
    console.log('Testing hospital addresses endpoint...');
    const addrRes = await fetch('http://127.0.0.1:8001/hospital_addresses');
    const addrData = await addrRes.json();
    console.log('Addresses data sample:', addrData.slice(0, 2));
    
  } catch (error) {
    console.error('API Test Error:', error);
  }
};

// Run test if this is executed directly
if (typeof window !== 'undefined') {
  testAPI();
}
