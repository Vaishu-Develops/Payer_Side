// src/hooks/useEquipmentData.jsx
import { useState, useEffect, useMemo } from 'react';
import dataService from '../services/dataService.jsx';
import _ from 'lodash';

export const useEquipmentData = (selectedHospital = 'All', selectedCategory = 'All') => {
  const [equipmentData, setEquipmentData] = useState(null);
  const [hospitalsData, setHospitalsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading equipment and hospitals data...');
        const [equipmentResponse, hospitalsResponse] = await Promise.all([
          dataService.getHospitalEquipment(),
          dataService.fetchHospitalsData()
        ]);
        
        console.log('📊 Equipment response:', equipmentResponse);
        console.log('🏥 Hospitals response:', hospitalsResponse);
        
        if (!equipmentResponse.success) {
          throw new Error(equipmentResponse.error);
        }
        if (!hospitalsResponse.success) {
          throw new Error(hospitalsResponse.error);
        }
        
        setEquipmentData(equipmentResponse.data);
        setHospitalsData(hospitalsResponse.data.hospitals || hospitalsResponse.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const processedData = useMemo(() => {
    if (!equipmentData || !Array.isArray(equipmentData) || !hospitalsData) {
      return {
        allEquipment: [],
        equipmentStats: {},
        filteredEquipmentStats: {},
        hospitals: [],
        categories: [],
        totalHospitals: 0,
        filteredHospitals: [],
        filteredTotalHospitals: 0,
      };
    }

    // Create hospital lookup map
    const hospitalMap = _.keyBy(hospitalsData, 'id');

    // Get list of unique hospitals from equipment data with actual names
    const hospitalList = _.chain(equipmentData)
      .groupBy('hospital_id')
      .map((equipment, hospitalId) => {
        const hospital = hospitalMap[hospitalId];
        return {
          id: parseInt(hospitalId),
          name: hospital?.name || `Hospital ${hospitalId}`,
        };
      })
      .sortBy('name')
      .value();

    const totalHospitals = hospitalList.length;
    // Map backend data structure to component expectations
    const allEquipment = equipmentData.map(eq => ({
      ...eq,
      name: eq.equipment_name,
      brand: eq.brand_model,
      available: eq.is_available,
      quantity: eq.quantity || 1
    }));
    const categories = _.sortBy(_.uniq(allEquipment.map(eq => eq.category)));

    // Calculate stats for ALL hospitals (global stats)
    const equipmentStats = _.chain(allEquipment)
      .groupBy('equipment_name')
      .mapValues(equipmentArray => ({
        hospitals: _.uniq(_.map(equipmentArray, 'hospital_id')),
        totalQuantity: _.sumBy(equipmentArray, 'quantity'),
        availableCount: equipmentArray.filter(e => e.is_available).length,
        brand: equipmentArray[0]?.brand_model || 'N/A',
        category: equipmentArray[0]?.category,
      }))
      .value();

    // Calculate filtered stats based on selection
    let filteredHospitals = hospitalList;
    let filteredEquipment = allEquipment;

    if (selectedHospital !== 'All') {
      filteredHospitals = hospitalList.filter(h => h.id === parseInt(selectedHospital));
      filteredEquipment = allEquipment.filter(eq => eq.hospital_id === parseInt(selectedHospital));
    }

    if (selectedCategory !== 'All') {
      filteredEquipment = filteredEquipment.filter(eq => eq.category === selectedCategory);
    }

    const filteredTotalHospitals = filteredHospitals.length;

    // Calculate stats for FILTERED hospitals
    const filteredEquipmentStats = _.chain(filteredEquipment)
      .groupBy('equipment_name')
      .mapValues(equipmentArray => ({
        hospitals: _.uniq(_.map(equipmentArray, 'hospital_id')),
        totalQuantity: _.sumBy(equipmentArray, 'quantity'),
        availableCount: equipmentArray.filter(e => e.is_available).length,
        brand: equipmentArray[0]?.brand_model || 'N/A',
        category: equipmentArray[0]?.category,
      }))
      .value();

    return {
      allEquipment,
      equipmentStats,
      filteredEquipmentStats,
      hospitals: hospitalList,
      categories,
      totalHospitals,
      filteredHospitals,
      filteredTotalHospitals,
    };
  }, [equipmentData, hospitalsData, selectedHospital, selectedCategory]);

  return { ...processedData, loading, error };
};