import { useState, useEffect } from 'react';
import dataService from '../services/dataService.jsx';

const useContactAnalysis = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const contactsResponse = await dataService.getHospitalContacts();
        const hospitalsResponse = await dataService.getHospitals();

        if (contactsResponse.success && hospitalsResponse.success) {
          const contacts = contactsResponse.data;
          const hospitals = hospitalsResponse.data.hospitals;

          const analysis = hospitals.map(hospital => {
            const hospitalContacts = contacts.filter(c => c.hospital_id === hospital.id);
            const contactTypes = hospitalContacts.map(c => c.contact_type);

            return {
              ...hospital,
              hasAdmin: contactTypes.includes('Administrator'),
              hasMedical: contactTypes.includes('Medical Director'),
              hasEmergency: contactTypes.includes('Emergency Contact'),
              isComplete: contactTypes.includes('Administrator') && 
                         contactTypes.includes('Medical Director') && 
                         contactTypes.includes('Emergency Contact')
            };
          });

          setData({
            hospitals: analysis,
            totalComplete: analysis.filter(h => h.isComplete).length,
            totalHospitals: analysis.length
          });
        } else {
          setError('Failed to fetch data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return { data, loading, error };
};

export default useContactAnalysis;