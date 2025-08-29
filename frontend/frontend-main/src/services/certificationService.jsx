// certificationService.jsx
import api from './api';

// Existing functions
export const getCertifications = () => 
  api.get('/certifications');

export const getHospitalCertifications = (hospitalId) => 
  api.get(`/hospitals/${hospitalId}/certifications`);

export const getNabhCertifications = async () => {
  try {
    const response = await getCertifications();
    return response.data.filter(cert => 
      cert.certification_type === 'NABH' || 
      cert.certification_type === 'Joint Commission' ||
      cert.certification_type.includes('NABH')
    );
  } catch (error) {
    console.error('Error fetching NABH certifications:', error);
    return [];
  }
};

// New functions for Certification Matrix page
export const getAllHospitalCertifications = async () => {
  try {
    const response = await getCertifications();
    return response.data;
  } catch (error) {
    console.error('Error fetching all hospital certifications:', error);
    throw error;
  }
};

export const getHospitals = async () => {
  try {
    const response = await api.get('/hospitals');
    return response.data;
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    throw error;
  }
};

export const getCertificationsByType = async (certificationType) => {
  try {
    const response = await getCertifications();
    return response.data.filter(cert => 
      cert.certification_type === certificationType
    );
  } catch (error) {
    console.error(`Error fetching ${certificationType} certifications:`, error);
    throw error;
  }
};

export const getCertificationsByHospitalIds = async (hospitalIds) => {
  try {
    if (!hospitalIds || hospitalIds.length === 0) {
      return await getAllHospitalCertifications();
    }
    
    const response = await getCertifications();
    return response.data.filter(cert => 
      hospitalIds.includes(cert.hospital_id)
    );
  } catch (error) {
    console.error('Error fetching certifications by hospital IDs:', error);
    throw error;
  }
};

export const getCertificationsWithFilters = async (filters = {}) => {
  try {
    const response = await getCertifications();
    let filteredData = response.data;

    // Apply filters
    if (filters.hospitalIds && filters.hospitalIds.length > 0) {
      filteredData = filteredData.filter(cert => 
        filters.hospitalIds.includes(cert.hospital_id)
      );
    }

    if (filters.certificationTypes && filters.certificationTypes.length > 0) {
      filteredData = filteredData.filter(cert => 
        filters.certificationTypes.includes(cert.certification_type)
      );
    }

    if (filters.status) {
      filteredData = filteredData.filter(cert => 
        cert.status === filters.status
      );
    }

    if (filters.startDate && filters.endDate) {
      filteredData = filteredData.filter(cert => {
        const certDate = new Date(cert.issued_date);
        return certDate >= new Date(filters.startDate) && 
               certDate <= new Date(filters.endDate);
      });
    }

    return filteredData;
  } catch (error) {
    console.error('Error fetching filtered certifications:', error);
    throw error;
  }
};

// Utility functions for certification analysis
export const getCertificationStats = async () => {
  try {
    const [certifications, hospitals] = await Promise.all([
      getAllHospitalCertifications(),
      getHospitals()
    ]);

    const stats = {
      totalCertifications: certifications.length,
      totalHospitals: hospitals.length,
      certificationTypes: [...new Set(certifications.map(cert => cert.certification_type))],
      activeCertifications: certifications.filter(cert => cert.status === 'Active').length,
      expiredCertifications: certifications.filter(cert => {
        const expiryDate = new Date(cert.expiry_date);
        return expiryDate < new Date();
      }).length,
      expiringSoon: certifications.filter(cert => {
        const expiryDate = new Date(cert.expiry_date);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 90;
      }).length
    };

    return stats;
  } catch (error) {
    console.error('Error calculating certification stats:', error);
    throw error;
  }
};

export const getHospitalCertificationSummary = async (hospitalId) => {
  try {
    const certifications = await getHospitalCertifications(hospitalId);
    
    const summary = {
      hospitalId,
      totalCertifications: certifications.data.length,
      certificationTypes: [...new Set(certifications.data.map(cert => cert.certification_type))],
      activeCertifications: certifications.data.filter(cert => cert.status === 'Active').length,
      expiringSoon: certifications.data.filter(cert => {
        const expiryDate = new Date(cert.expiry_date);
        const today = new Date();
        const diffTime = expiryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 90;
      }).length,
      certifications: certifications.data
    };

    return summary;
  } catch (error) {
    console.error(`Error fetching certification summary for hospital ${hospitalId}:`, error);
    throw error;
  }
};

// Export function for generating reports
export const exportCertificationData = async (format = 'json', filters = {}) => {
  try {
    const certifications = await getCertificationsWithFilters(filters);
    const hospitals = await getHospitals();
    
    // Enrich certification data with hospital information
    const enrichedData = certifications.map(cert => {
      const hospital = hospitals.find(h => h.id === cert.hospital_id);
      return {
        ...cert,
        hospital_name: hospital?.name || 'Unknown',
        hospital_type: hospital?.hospital_type || 'Unknown',
        hospital_category: hospital?.category || 'Unknown'
      };
    });

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(enrichedData[0] || {});
      const csvContent = [
        headers.join(','),
        ...enrichedData.map(row => 
          headers.map(header => {
            const value = row[header] || '';
            return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
          }).join(',')
        )
      ].join('\n');
      
      return csvContent;
    }

    return enrichedData;
  } catch (error) {
    console.error('Error exporting certification data:', error);
    throw error;
  }
};

// Function to check certification compliance
export const checkCertificationCompliance = async (requiredCertifications = []) => {
  try {
    const [certifications, hospitals] = await Promise.all([
      getAllHospitalCertifications(),
      getHospitals()
    ]);

    const compliance = hospitals.map(hospital => {
      const hospitalCertifications = certifications.filter(cert => 
        cert.hospital_id === hospital.id && cert.status === 'Active'
      );
      
      const certificationTypes = hospitalCertifications.map(cert => cert.certification_type);
      
      const compliance = {
        hospital,
        totalCertifications: hospitalCertifications.length,
        requiredCertifications: requiredCertifications.length,
        hasRequired: requiredCertifications.filter(req => 
          certificationTypes.includes(req)
        ),
        missingRequired: requiredCertifications.filter(req => 
          !certificationTypes.includes(req)
        ),
        complianceRate: requiredCertifications.length > 0 
          ? Math.round((requiredCertifications.filter(req => 
              certificationTypes.includes(req)
            ).length / requiredCertifications.length) * 100)
          : 100
      };

      return compliance;
    });

    return compliance;
  } catch (error) {
    console.error('Error checking certification compliance:', error);
    throw error;
  }
};





// ========== EXISTING CONTACT FUNCTIONS ==========
export const fetchHospitalContacts = async () => {
  try {
    const response = await api.get('/hospital-contacts');
    return response.data;
  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};

export const fetchEssentialContacts = async () => {
  try {
    const contacts = await fetchHospitalContacts();
    return contacts.filter(contact => 
      ['Administrator', 'Medical Director', 'Emergency Contact'].includes(contact.contact_type)
    );
  } catch (error) {
    console.error('Error filtering contacts:', error);
    throw error;
  }
};

// ========== NEW CERTIFICATION TIMELINE FUNCTIONS ==========

// Fallback data for certifications (in case backend is unavailable)
const getFallbackCertificationData = () => {
  return [
    {
      "id": 1,
      "hospital_id": 121,
      "certification_type": "ISO 9001",
      "certification_level": "Certified",
      "certificate_number": "ISO 9001/121/2901",
      "issued_date": "2020-07-10",
      "expiry_date": "2022-07-10",
      "issuing_authority": "International Organization for Standardization",
      "status": "Active",
      "document_id": 2,
      "remarks": "Valid ISO 9001 certification",
      "created_at": "2025-08-05T12:37:03.690864+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 2,
      "hospital_id": 121,
      "certification_type": "NABH",
      "certification_level": "Entry Level",
      "certificate_number": "NABH/121/7344",
      "issued_date": "2021-02-17",
      "expiry_date": "2026-02-17",
      "issuing_authority": "National Accreditation Board for Hospitals",
      "status": "Active",
      "document_id": 3,
      "remarks": "Valid NABH certification",
      "created_at": "2025-08-05T12:37:03.692742+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 3,
      "hospital_id": 121,
      "certification_type": "JCI",
      "certification_level": "Accredited",
      "certificate_number": "JCI/121/6509",
      "issued_date": "2020-01-13",
      "expiry_date": "2024-01-13",
      "issuing_authority": "Joint Commission International",
      "status": "Active",
      "document_id": null,
      "remarks": "Valid JCI certification",
      "created_at": "2025-08-05T12:37:03.694121+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 4,
      "hospital_id": 122,
      "certification_type": "ISO 9001",
      "certification_level": "Certified",
      "certificate_number": "ISO 9001/122/8157",
      "issued_date": "2023-07-12",
      "expiry_date": "2027-07-12",
      "issuing_authority": "International Organization for Standardization",
      "status": "Active",
      "document_id": 6,
      "remarks": "Valid ISO 9001 certification",
      "created_at": "2025-08-05T12:37:03.696080+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 5,
      "hospital_id": 123,
      "certification_type": "JCI",
      "certification_level": "Accredited",
      "certificate_number": "JCI/123/9397",
      "issued_date": "2020-12-01",
      "expiry_date": "2022-12-01",
      "issuing_authority": "Joint Commission International",
      "status": "Active",
      "document_id": 9,
      "remarks": "Valid JCI certification",
      "created_at": "2025-08-05T12:37:03.697691+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 6,
      "hospital_id": 124,
      "certification_type": "Green OT",
      "certification_level": "Silver",
      "certificate_number": "Green OT/124/5389",
      "issued_date": "2021-01-05",
      "expiry_date": "2025-01-05",
      "issuing_authority": "Association of Healthcare Providers India",
      "status": "Active",
      "document_id": 13,
      "remarks": "Valid Green OT certification",
      "created_at": "2025-08-05T12:37:03.699813+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 7,
      "hospital_id": 124,
      "certification_type": "JCI",
      "certification_level": "Accredited",
      "certificate_number": "JCI/124/1154",
      "issued_date": "2022-05-13",
      "expiry_date": "2025-05-13",
      "issuing_authority": "Joint Commission International",
      "status": "Active",
      "document_id": 14,
      "remarks": "Valid JCI certification",
      "created_at": "2025-08-05T12:37:03.700830+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 8,
      "hospital_id": 125,
      "certification_type": "Green OT",
      "certification_level": "Silver",
      "certificate_number": "Green OT/125/4050",
      "issued_date": "2022-01-16",
      "expiry_date": "2024-01-16",
      "issuing_authority": "Association of Healthcare Providers India",
      "status": "Active",
      "document_id": 17,
      "remarks": "Valid Green OT certification",
      "created_at": "2025-08-05T12:37:03.701814+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 9,
      "hospital_id": 125,
      "certification_type": "ISO 9001",
      "certification_level": "Certified",
      "certificate_number": "ISO 9001/125/2376",
      "issued_date": "2022-10-18",
      "expiry_date": "2025-10-18",
      "issuing_authority": "International Organization for Standardization",
      "status": "Active",
      "document_id": 19,
      "remarks": "Valid ISO 9001 certification",
      "created_at": "2025-08-05T12:37:03.703313+00:00",
      "updated_at": null,
      "is_active": true
    },
    {
      "id": 10,
      "hospital_id": 125,
      "certification_type": "NABH",
      "certification_level": "Full Accreditation",
      "certificate_number": "NABH/125/8704",
      "issued_date": "2023-03-23",
      "expiry_date": "2025-03-23",
      "issuing_authority": "National Accreditation Board for Hospitals",
      "status": "Active",
      "document_id": null,
      "remarks": "Valid NABH certification",
      "created_at": "2025-08-05T12:37:03.704313+00:00",
      "updated_at": null,
      "is_active": true
    }
  ];
};

// Load from local JSON file (fallback method)
const loadCertificationsFromLocalFile = async () => {
  try {
    console.log('📁 Attempting to load from local JSON file...');
    const response = await fetch('/data/hospital_certifications.json');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully loaded from local JSON file');
      return data;
    } else {
      console.log('📋 Local JSON file not found, using fallback data');
      return getFallbackCertificationData();
    }
  } catch (error) {
    console.error('❌ Error loading local JSON file:', error);
    console.log('📋 Using fallback certification data');
    return getFallbackCertificationData();
  }
};

// Fetch all hospital certifications
export const fetchAllCertifications = async () => {
  try {
    console.log('🔄 Fetching all certifications from backend...');
    const response = await api.get('/hospital_certifications');
    console.log('✅ Successfully fetched certifications from backend');
    return response.data;
  } catch (error) {
    console.error('❌ Backend unavailable for certifications:', error);
    console.log('🔄 Falling back to local data...');
    return await loadCertificationsFromLocalFile();
  }
};

// Fetch certifications for a specific hospital
export const fetchHospitalCertifications = async (hospitalId) => {
  try {
    console.log(`🔄 Fetching certifications for hospital ${hospitalId}...`);
    const response = await api.get(`/hospitals/${hospitalId}/certifications`);
    console.log(`✅ Successfully fetched certifications for hospital ${hospitalId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching certifications for hospital ${hospitalId}:`, error);
    console.log('🔄 Falling back to filtering all certifications...');
    
    // Fallback: get all certifications and filter
    const allCertifications = await fetchAllCertifications();
    return allCertifications.filter(cert => cert.hospital_id === hospitalId);
  }
};

// Fetch specific certification details
export const fetchCertificationDetails = async (certificationId) => {
  try {
    console.log(`🔄 Fetching certification details for ID ${certificationId}...`);
    const response = await api.get(`/certifications/${certificationId}`);
    console.log(`✅ Successfully fetched certification details for ID ${certificationId}`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching certification ${certificationId}:`, error);
    console.log('🔄 Falling back to searching in all certifications...');
    
    // Fallback: get all certifications and find the specific one
    const allCertifications = await fetchAllCertifications();
    const certification = allCertifications.find(cert => cert.id === certificationId);
    
    if (!certification) {
      throw new Error(`Certification with ID ${certificationId} not found`);
    }
    
    return certification;
  }
};

// Fetch certifications by status
export const fetchCertificationsByStatus = async (status) => {
  try {
    console.log(`🔄 Fetching certifications with status: ${status}...`);
    const response = await api.get(`/certifications/status/${status}`);
    console.log(`✅ Successfully fetched ${status} certifications`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching ${status} certifications:`, error);
    console.log('🔄 Falling back to filtering all certifications...');
    
    // Fallback: get all and filter by status
    const allCertifications = await fetchAllCertifications();
    return allCertifications.filter(cert => cert.status === status);
  }
};

// Fetch expiring certifications (within specified days)
export const fetchExpiringCertifications = async (days = 90) => {
  try {
    console.log(`🔄 Fetching certifications expiring within ${days} days...`);
    const response = await api.get(`/certifications/expiring?days=${days}`);
    console.log(`✅ Successfully fetched expiring certifications`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching expiring certifications:`, error);
    console.log('🔄 Falling back to calculating expiring certifications locally...');
    
    // Fallback: calculate expiring certifications locally
    const allCertifications = await fetchAllCertifications();
    const today = new Date();
    
    return allCertifications.filter(cert => {
      const expiryDate = new Date(cert.expiry_date);
      const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      return daysToExpiry >= 0 && daysToExpiry <= days;
    });
  }
};

// Get unique hospital IDs from certifications
export const fetchAvailableHospitals = async () => {
  try {
    const allCertifications = await fetchAllCertifications();
    const hospitalIds = [...new Set(allCertifications.map(cert => cert.hospital_id))];
    console.log(`📊 Found certifications for ${hospitalIds.length} hospitals:`, hospitalIds);
    return hospitalIds.sort((a, b) => a - b);
  } catch (error) {
    console.error('❌ Error fetching available hospitals:', error);
    return [121, 122, 123, 124, 125]; // fallback hospital IDs
  }
};

// Get certification summary statistics
export const fetchCertificationSummary = async (hospitalId = null) => {
  try {
    let certifications;
    
    if (hospitalId) {
      certifications = await fetchHospitalCertifications(hospitalId);
    } else {
      certifications = await fetchAllCertifications();
    }

    // Calculate status statistics locally
    const today = new Date();
    const stats = {
      total: certifications.length,
      active: 0,
      warning: 0,
      critical: 0,
      expired: 0
    };

    certifications.forEach(cert => {
      const expiryDate = new Date(cert.expiry_date);
      const daysToExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysToExpiry < 0) {
        stats.expired++;
      } else if (daysToExpiry <= 30) {
        stats.critical++;
      } else if (daysToExpiry <= 90) {
        stats.warning++;
      } else {
        stats.active++;
      }
    });

    console.log('📊 Certification summary:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Error fetching certification summary:', error);
    throw error;
  }
};

// Create a default export object for backward compatibility
const certificationService = {
  // Contact functions (existing)
  fetchHospitalContacts,
  fetchEssentialContacts,
  
  // Certification functions (new)
  fetchAllCertifications,
  getAllCertifications: fetchAllCertifications, // Alias for Q13 compatibility
  fetchHospitalCertifications,
  fetchCertificationDetails,
  fetchCertificationsByStatus,
  fetchExpiringCertifications,
  fetchAvailableHospitals,
  fetchCertificationSummary,
  
  // Utility functions
  getFallbackData: getFallbackCertificationData,
  loadFromLocalFile: loadCertificationsFromLocalFile
};

export default certificationService;

