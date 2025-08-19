import { useState, useEffect } from 'react';
import dataService from '../services/dataService.jsx';


const useDocumentStats = () => {
  const [stats, setStats] = useState({
    totalVerified: 0,
    totalPending: 0,
    totalRejected: 0,
    hospitals: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [hospitalsRes, docsRes] = await Promise.all([
          dataService.fetchHospitalsData(),
          dataService.getDocumentUploads()
        ]);
        if (!hospitalsRes.success) throw new Error(hospitalsRes.error);
        if (!docsRes.success) throw new Error(docsRes.error);

        const hospitals = hospitalsRes.data.hospitals || hospitalsRes.data;
        const documents = docsRes.data;

        // Group documents by hospital
        const hospitalStats = hospitals.map(hospital => {
          const docsForHospital = documents.filter(doc => String(doc.entity_id) === String(hospital.id));
          const docStatus = {};
          docsForHospital.forEach(doc => {
            docStatus[doc.document_type] = {
              status: doc.is_verified ? 'verified' : 'pending',
              file_name: doc.file_name
            };
          });
          return {
            id: hospital.id,
            name: hospital.name,
            documents: docStatus
          };
        });

        // Calculate totals
        let totalVerified = 0, totalPending = 0, totalRejected = 0;
        documents.forEach(doc => {
          if (doc.is_verified) totalVerified++;
          else totalPending++;
        });

        setStats({
          totalVerified,
          totalPending,
          totalRejected, // Not implemented in backend, so always 0
          hospitals: hospitalStats
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return { stats, loading, error };
};

export default useDocumentStats;