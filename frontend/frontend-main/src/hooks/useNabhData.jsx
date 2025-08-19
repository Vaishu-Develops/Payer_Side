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
        setLoading(true);
        const [hospitalsRes, certificationsRes] = await Promise.all([
          dataService.getHospitals(),
          dataService.getAllHospitalCertifications(),
        ]);
        
        // Extract the actual data arrays from the API responses
        const hospitals = Array.isArray(hospitalsRes.data?.hospitals) 
          ? hospitalsRes.data.hospitals 
          : Array.isArray(hospitalsRes.data) 
          ? hospitalsRes.data 
          : [];
          
        const certifications = Array.isArray(certificationsRes.data) 
          ? certificationsRes.data 
          : [];

        setData({
          hospitals,
          certifications,
        });
        setError(null);
      } catch (err) {
        setError("Failed to fetch NABH certification data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const nabhHospitals = useMemo(() => {
    if (!data.hospitals.length || !data.certifications.length) {
      return [];
    }

    const hospitalMap = new Map(data.hospitals.map((h) => [h.id, h]));

    const nabhCerts = data.certifications.filter(
      (cert) => cert.certification_type === "NABH" && cert.status === "Active"
    );

    return nabhCerts
      .map((cert) => {
        const hospital = hospitalMap.get(cert.hospital_id);
        if (!hospital) return null;

        return {
          key: cert.id,
          hospitalId: hospital.id,
          hospitalName: hospital.name,
          beds: hospital.beds_operational,
          level: cert.certification_level,
          statusInfo: getCertificationStatus(cert.expiry_date),
        };
      })
      .filter(Boolean);
  }, [data]);

  return { nabhHospitals, loading, error };
};
