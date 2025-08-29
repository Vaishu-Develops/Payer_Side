import api from './api';

// Fallback hospital addresses data
const getHospitalAddressesData = () => [
  {
    "hospital_id": 135,
    "area_locality": "Ville Area",
    "street": "83\nTank Path",
    "city_town": "Ahmedabad",
    "taluka": null,
    "district": "Ahmedabad",
    "state": "Gujarat",
    "pin_code": "380054",
    "nearest_landmark": "Near Bhardwaj Path Junction",
    "address_type": "Primary",
    "id": 139,
    "created_at": "2025-08-05T12:37:00.901157+00:00",
    "updated_at": null,
    "is_active": true
  },
  {
    "hospital_id": 135,
    "area_locality": "Ville Zone",
    "street": "19/97, Goswami Circle",
    "city_town": "Ahmedabad",
    "taluka": null,
    "district": "Ahmedabad",
    "state": "Gujarat",
    "pin_code": "380054",
    "nearest_landmark": "Near Bhardwaj Path Junction",
    "address_type": "Billing",
    "id": 140,
    "created_at": "2025-08-05T12:37:00.901157+00:00",
    "updated_at": null,
    "is_active": true
  },
  // Include all other hospital data from your JSON here...
  {
    "hospital_id": 134,
    "area_locality": "Ville Area",
    "street": "95\nWason Zila",
    "city_town": "Pune",
    "taluka": null,
    "district": "Pune",
    "state": "Maharashtra",
    "pin_code": "411001",
    "nearest_landmark": "Near Baral Street Junction",
    "address_type": "Primary",
    "id": 138,
    "created_at": "2025-08-05T12:37:00.901157+00:00",
    "updated_at": null,
    "is_active": true
  }
];

// Fetch hospital addresses
export const fetchHospitalAddresses = async () => {
  try {
    console.log('🔄 Fetching hospital addresses...');
    const response = await api.get('/hospital_addresses');
    console.log('✅ Successfully fetched hospital addresses');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching addresses:', error);
    console.log('📁 Using fallback address data');
    return getHospitalAddressesData();
  }
};

export default {
  fetchHospitalAddresses
};
