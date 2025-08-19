// src/hooks/useHospitalData.js
import { useState, useEffect, useMemo } from 'react';

export const useHospitalData = () => {
  const [hospitals, setHospitals] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getData = async () => {
      try {
        setLoading(true);
        
        // Fetch hospitals data from API
        const hospitalsResponse = await fetch('/api/hospitals');
        if (!hospitalsResponse.ok) {
          throw new Error('Failed to fetch hospitals data');
        }
        const hospitalsData = await hospitalsResponse.json();
        
        // Fetch state distribution data from API
        const stateResponse = await fetch('/api/analytics/hospitals-by-state');
        if (!stateResponse.ok) {
          throw new Error('Failed to fetch state distribution data');
        }
        const stateData = await stateResponse.json();
        
        setHospitals(hospitalsData.hospitals);
        setAddresses(stateData.state_distribution);
        setError(null);
      } catch (err) {
        setError("Failed to fetch hospital data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    getData();
  }, []);

  // useMemo ensures this complex calculation only runs when the source data changes
  const statewiseStats = useMemo(() => {
    if (!addresses.length) {
      return [];
    }
    
    // Convert API state distribution data to the format expected by components
    return addresses.map(stateInfo => ({
      state: stateInfo.state,
      hospitalCount: stateInfo.hospital_count,
      totalBeds: stateInfo.total_beds || stateInfo.operational_beds || 0
    }));
  }, [addresses]);

  return { statewiseStats, loading, error, totalHospitals: hospitals.length };
};