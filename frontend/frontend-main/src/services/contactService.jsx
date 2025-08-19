import api from './api';

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