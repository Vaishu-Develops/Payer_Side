// src/hooks/useStaffingData.jsx
import { useState, useEffect, useMemo } from 'react';
import { hospitalService } from '../services/hospitalService';
import _ from 'lodash';

// Define benchmarks for easy reference
const BENCHMARKS = {
  doctorToBed: 1 / 3,  // Ideal 1 doctor per 3 beds
  nurseToBed: 1 / 2,   // Ideal 1 nurse per 2 beds
};

export const useStaffingData = () => {
  // State for all raw data
  const [rawData, setRawData] = useState({ hospitals: [], metrics: [], doctors: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const allData = await hospitalService.fetchAllData();
        setRawData({
          hospitals: allData.hospitals,
          metrics: allData.metrics, // Assuming service fetches hospital_metrics.json
          doctors: allData.doctors,   // Assuming service fetches doctors.json
        });
        setError(null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // useMemo will re-calculate only when the raw data changes
  const staffingData = useMemo(() => {
    // Add safety checks for undefined data
    const hospitals = rawData.hospitals || [];
    const metrics = rawData.metrics || [];
    const doctors = rawData.doctors || [];
    
    if (!hospitals.length || !metrics.length || !doctors.length) {
      return [];
    }
    
    // Create maps for efficient lookups to solve data joining confusion
    const metricsMap = _.keyBy(metrics, 'hospital_id');
    const doctorsByHospital = _.groupBy(doctors, 'hospital_id');

    // Process each hospital to create a comprehensive staffing profile
    const processed = hospitals.map(hospital => {
      const metrics = metricsMap[hospital.id];
      const doctors = doctorsByHospital[hospital.id] || [];

      if (!metrics) return null; // Skip hospitals without metrics data

      const doctorToBedRatio = metrics.doctor_bed_ratio || 0;
      const nurseToBedRatio = metrics.nurse_bed_ratio || 0;
      
      return {
        key: hospital.id,
        hospitalId: hospital.id,
        hospitalName: hospital.name,
        totalDoctors: metrics.total_doctors,
        totalNurses: metrics.qualified_nurses,
        doctorToBedRatio,
        nurseToBedRatio,
        // Calculate performance against benchmark (0-100 scale)
        doctorRatioGauge: Math.min(Math.round((doctorToBedRatio / BENCHMARKS.doctorToBed) * 100), 100),
        nurseRatioGauge: Math.min(Math.round((nurseToBedRatio / BENCHMARKS.nurseToBed) * 100), 100),
        // Group doctors by their designation for the pie chart
        specialtyDistribution: _.countBy(doctors, 'designation'),
      };
    }).filter(Boolean); // Filter out any null entries

    return processed;
  }, [rawData]);

  return { 
    staffingData, 
    allHospitals: rawData.hospitals.map(h => ({ value: h.id, label: h.name })),
    loading, 
    error 
  };
};