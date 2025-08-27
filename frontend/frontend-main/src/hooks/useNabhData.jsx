// src/hooks/useNabhData.jsx
import { useState, useEffect, useMemo } from "react";
import dataService from "../services/dataService.jsx";
import { getCertificationStatus } from "../utils/dateUtils.jsx";

export const useNabhData = () => {
  const [data, setData] = useState({ hospitals: [], certifications: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 Starting NABH data fetch...');
        setLoading(true);
        const [hospitalsRes, certificationsRes] = await Promise.all([
          dataService.getHospitals(),
          dataService.getAllHospitalCertifications(),
        ]);
        
        console.log('📥 Raw hospitals response:', hospitalsRes);
        console.log('📥 Raw certifications response:', certificationsRes);
        
        // Extract the actual data arrays from the API responses
        const hospitals = Array.isArray(hospitalsRes.data?.hospitals) 
          ? hospitalsRes.data.hospitals 
          : Array.isArray(hospitalsRes.data) 
          ? hospitalsRes.data 
          : [];
          
        const certifications = Array.isArray(certificationsRes.data) 
          ? certificationsRes.data 
          : [];

        console.log('✅ Processed hospitals:', hospitals.length, 'items');
        console.log('✅ Processed certifications:', certifications.length, 'items');
        console.log('🔍 Sample hospital:', hospitals[0]);
        console.log('🔍 Sample certification:', certifications[0]);

        setData({
          hospitals,
          certifications,
        });
        setError(null);
      } catch (err) {
        console.error('❌ NABH data fetch error:', err);
        setError("Failed to fetch NABH certification data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nabhHospitals = useMemo(() => {
    console.log('🔄 Processing NABH hospitals...');
    console.log('📊 Available hospitals:', data.hospitals.length);
    console.log('📊 Available certifications:', data.certifications.length);
    
    if (!data.hospitals.length || !data.certifications.length) {
      console.log('⚠️ No data available for processing');
      return [];
    }

    const hospitalMap = new Map(data.hospitals.map((h) => [h.id, h]));
    console.log('🗺️ Hospital map created with', hospitalMap.size, 'entries');

    const nabhCerts = data.certifications.filter(
      (cert) => cert.certification_type === "NABH" && cert.status === "Active"
    );
    console.log('🏥 Found', nabhCerts.length, 'active NABH certifications');
    console.log('🔍 Sample NABH cert:', nabhCerts[0]);

    const result = nabhCerts
      .map((cert) => {
        const hospital = hospitalMap.get(cert.hospital_id);
        if (!hospital) {
          console.log('⚠️ Hospital not found for certification:', cert.hospital_id);
          return null;
        }

        const processed = {
          key: cert.id,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          beds: hospital.beds_operational,
          level: cert.certification_level,
          statusInfo: getCertificationStatus(cert.expiry_date),
        };
        
        return processed;
      })
      .filter(Boolean);
      
    console.log('✅ Processed NABH hospitals:', result.length);
    console.log('🔍 Sample processed hospital:', result[0]);
    
    return result;
  }, [data]);

  return { nabhHospitals, loading, error };
};
