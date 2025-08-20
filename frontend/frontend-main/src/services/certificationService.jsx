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
