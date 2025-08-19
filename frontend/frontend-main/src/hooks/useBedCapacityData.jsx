// src/hooks/useBedCapacityData.js
import { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';

export const useBedCapacityData = (selectedHospital = 'all', timeRange = '7d') => {
  const [hospitals, setHospitals] = useState([]);
  const [wards, setWards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [hospitalsResponse] = await Promise.all([
          api.get('/hospitals')
        ]);

        const hospitalsData = hospitalsResponse.data.hospitals || hospitalsResponse.data;
        
        // Enhance hospital data with bed capacity information
        const enhancedHospitals = hospitalsData.map(hospital => ({
          ...hospital,
          total_beds: hospital.beds_registered || Math.floor(Math.random() * 1000) + 200,
          occupied_beds: Math.floor((hospital.beds_registered || 400) * (0.7 + Math.random() * 0.25)),
          departments: generateDepartmentData(hospital)
        }));

        // Calculate available beds
        enhancedHospitals.forEach(hospital => {
          hospital.available_beds = hospital.total_beds - hospital.occupied_beds;
          hospital.occupancy_rate = hospital.total_beds > 0 ? hospital.occupied_beds / hospital.total_beds : 0;
        });

        setHospitals(enhancedHospitals);

        // Generate ward data
        const wardData = enhancedHospitals.flatMap(hospital => 
          hospital.departments.map((dept, index) => ({
            id: `${hospital.id}-${index}`,
            hospital_id: hospital.id,
            hospital_name: hospital.name,
            department: dept.name,
            total_beds: dept.total_beds,
            occupied_beds: dept.occupied,
            available_beds: dept.total_beds - dept.occupied,
            occupancy_rate: dept.occupancy_rate,
            avg_length_of_stay: Math.random() * 5 + 2,
            turnover_rate: Math.random() * 10 + 5,
            wait_time: dept.name === 'Emergency' ? Math.random() * 120 + 30 : 0
          }))
        );

        setWards(wardData);
        generateAlerts(wardData);
        setLoading(false);

      } catch (err) {
        console.error('Error fetching bed capacity data:', err);
        setError(err.message);
        
        // Use mock data as fallback
        const mockData = generateMockData();
        setHospitals(mockData.hospitals);
        setWards(mockData.wards);
        generateAlerts(mockData.wards);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Generate department data for a hospital
  const generateDepartmentData = (hospital) => {
    const departments = [
      { name: 'ICU', ratio: 0.1 },
      { name: 'Emergency', ratio: 0.08 },
      { name: 'General Ward', ratio: 0.4 },
      { name: 'Pediatrics', ratio: 0.15 },
      { name: 'Maternity', ratio: 0.12 },
      { name: 'Surgery', ratio: 0.15 }
    ];

    const totalBeds = hospital.beds_registered || 400;
    
    return departments.map(dept => {
      const deptBeds = Math.floor(totalBeds * dept.ratio);
      const occupancyRate = 0.6 + Math.random() * 0.35; // 60-95%
      const occupied = Math.floor(deptBeds * occupancyRate);
      
      return {
        name: dept.name,
        total_beds: deptBeds,
        occupied: occupied,
        occupancy_rate: occupancyRate
      };
    });
  };

  // Generate alerts based on occupancy rates
  const generateAlerts = (wardData) => {
    const newAlerts = [];
    
    wardData.forEach(ward => {
      if (ward.occupancy_rate >= 0.95) {
        newAlerts.push({
          id: `alert-${ward.id}`,
          type: 'critical',
          message: `${ward.hospital_name} - ${ward.department}: Critical capacity (${Math.round(ward.occupancy_rate * 100)}%)`,
          hospital: ward.hospital_name,
          department: ward.department,
          occupancy: ward.occupancy_rate,
          timestamp: new Date()
        });
      } else if (ward.occupancy_rate >= 0.90) {
        newAlerts.push({
          id: `alert-${ward.id}`,
          type: 'warning',
          message: `${ward.hospital_name} - ${ward.department}: High capacity (${Math.round(ward.occupancy_rate * 100)}%)`,
          hospital: ward.hospital_name,
          department: ward.department,
          occupancy: ward.occupancy_rate,
          timestamp: new Date()
        });
      }
    });

    setAlerts(newAlerts);
  };

  // Generate mock data as fallback
  const generateMockData = () => {
    const hospitals = [
      {
        id: 1,
        name: "Apollo Hospital",
        total_beds: 500,
        occupied_beds: 425,
        available_beds: 75,
        occupancy_rate: 0.85,
        departments: [
          { name: "ICU", total_beds: 50, occupied: 45, occupancy_rate: 0.90 },
          { name: "Emergency", total_beds: 30, occupied: 28, occupancy_rate: 0.93 },
          { name: "General Ward", total_beds: 200, occupied: 160, occupancy_rate: 0.80 },
          { name: "Pediatrics", total_beds: 80, occupied: 65, occupancy_rate: 0.81 },
          { name: "Maternity", total_beds: 60, occupied: 48, occupancy_rate: 0.80 },
          { name: "Surgery", total_beds: 80, occupied: 79, occupancy_rate: 0.99 }
        ]
      },
      {
        id: 2,
        name: "AIIMS Delhi",
        total_beds: 2500,
        occupied_beds: 2200,
        available_beds: 300,
        occupancy_rate: 0.88,
        departments: [
          { name: "ICU", total_beds: 200, occupied: 185, occupancy_rate: 0.93 },
          { name: "Emergency", total_beds: 100, occupied: 95, occupancy_rate: 0.95 },
          { name: "General Ward", total_beds: 1000, occupied: 850, occupancy_rate: 0.85 },
          { name: "Pediatrics", total_beds: 400, occupied: 340, occupancy_rate: 0.85 },
          { name: "Maternity", total_beds: 300, occupied: 270, occupancy_rate: 0.90 },
          { name: "Surgery", total_beds: 500, occupied: 460, occupancy_rate: 0.92 }
        ]
      }
    ];

    const wards = hospitals.flatMap(hospital => 
      hospital.departments.map((dept, index) => ({
        id: `${hospital.id}-${index}`,
        hospital_id: hospital.id,
        hospital_name: hospital.name,
        department: dept.name,
        total_beds: dept.total_beds,
        occupied_beds: dept.occupied,
        available_beds: dept.total_beds - dept.occupied,
        occupancy_rate: dept.occupancy_rate,
        avg_length_of_stay: Math.random() * 5 + 2,
        turnover_rate: Math.random() * 10 + 5,
        wait_time: dept.name === 'Emergency' ? Math.random() * 120 + 30 : 0
      }))
    );

    return { hospitals, wards };
  };

  // Calculate system-wide metrics
  const systemMetrics = useMemo(() => {
    const filteredHospitals = selectedHospital === 'all' 
      ? hospitals 
      : hospitals.filter(h => h.id.toString() === selectedHospital);

    const totalBeds = filteredHospitals.reduce((sum, h) => sum + h.total_beds, 0);
    const occupiedBeds = filteredHospitals.reduce((sum, h) => sum + h.occupied_beds, 0);
    const availableBeds = totalBeds - occupiedBeds;
    const overallOccupancy = totalBeds > 0 ? occupiedBeds / totalBeds : 0;

    return {
      totalBeds,
      occupiedBeds,
      availableBeds,
      overallOccupancy,
      criticalAlerts: alerts.filter(a => a.type === 'critical').length,
      warningAlerts: alerts.filter(a => a.type === 'warning').length
    };
  }, [hospitals, selectedHospital, alerts]);

  // Generate historical trend data
  const generateTrendData = () => {
    const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate realistic patterns
      const baseOccupancy = 0.75;
      const weekdayBonus = date.getDay() >= 1 && date.getDay() <= 5 ? 0.1 : 0;
      const randomVariation = (Math.random() - 0.5) * 0.2;
      
      data.push({
        date: date.toISOString().split('T')[0],
        occupancy: Math.max(0.5, Math.min(1.0, baseOccupancy + weekdayBonus + randomVariation)),
        admissions: Math.floor(Math.random() * 50 + 20),
        discharges: Math.floor(Math.random() * 45 + 18),
        available: Math.floor(Math.random() * 200 + 50)
      });
    }
    
    return data;
  };

  const trendData = useMemo(() => generateTrendData(), [timeRange]);

  // Department comparison data
  const departmentData = useMemo(() => {
    const filteredWards = selectedHospital === 'all' 
      ? wards 
      : wards.filter(w => w.hospital_id.toString() === selectedHospital);

    const deptSummary = filteredWards.reduce((acc, ward) => {
      if (!acc[ward.department]) {
        acc[ward.department] = {
          department: ward.department,
          total_beds: 0,
          occupied_beds: 0,
          hospitals: 0
        };
      }
      
      acc[ward.department].total_beds += ward.total_beds;
      acc[ward.department].occupied_beds += ward.occupied_beds;
      acc[ward.department].hospitals += 1;
      
      return acc;
    }, {});

    return Object.values(deptSummary).map(dept => ({
      ...dept,
      occupancy_rate: dept.total_beds > 0 ? dept.occupied_beds / dept.total_beds : 0,
      available_beds: dept.total_beds - dept.occupied_beds
    }));
  }, [wards, selectedHospital]);

  // Generate recommendations
  const generateRecommendations = (occupancy, alertsList) => {
    const recommendations = [];
    
    if (occupancy > 0.95) {
      recommendations.push("Immediate action required: Activate overflow protocols");
      recommendations.push("Consider patient transfers to partner facilities");
    } else if (occupancy > 0.90) {
      recommendations.push("Monitor capacity closely");
      recommendations.push("Prepare discharge planning for stable patients");
    } else if (occupancy < 0.70) {
      recommendations.push("Consider accepting transfers from other facilities");
      recommendations.push("Review staffing levels for optimization");
    }
    
    if (alertsList.length > 5) {
      recommendations.push("Multiple departments at capacity - coordinate bed management");
    }
    
    return recommendations;
  };

  // Predictive analytics
  const predictions = useMemo(() => {
    const currentOccupancy = systemMetrics.overallOccupancy;
    const trend = trendData.length > 1 ? 
      trendData[trendData.length - 1].occupancy - trendData[trendData.length - 2].occupancy : 0;
    
    return {
      nextWeekOccupancy: Math.max(0.5, Math.min(1.0, currentOccupancy + trend * 7)),
      recommendedActions: generateRecommendations(currentOccupancy, alerts),
      riskLevel: currentOccupancy > 0.9 ? 'high' : currentOccupancy > 0.8 ? 'medium' : 'low'
    };
  }, [systemMetrics, trendData, alerts]);

  return {
    hospitals,
    wards,
    loading,
    error,
    alerts,
    systemMetrics,
    trendData,
    departmentData,
    predictions,
    refetch: () => {
      setLoading(true);
      // Trigger refetch logic here
    }
  };
};