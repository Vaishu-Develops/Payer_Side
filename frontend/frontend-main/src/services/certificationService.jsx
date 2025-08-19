import api from './api';

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