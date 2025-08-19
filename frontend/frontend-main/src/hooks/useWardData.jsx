/**
 * src/hooks/useWardData.js
 *
 * Provides:
 * - hospitals: []                     // list of hospitals
 * - wardData: []                      // wards for the selected hospital
 * - wardStats: { ... }                // computed KPIs for the selected hospital
 * - isLoading: boolean                // loading state for hospitals/wards
 * - error: string | null              // last error message
 * - fetchWardsByHospital(id): Promise // loads wards for a hospital id
 */

import { useState, useEffect, useCallback } from 'react';
import dataService from '../services/dataService.jsx';

const defaultWardStats = {
  totalBeds: 0,
  totalAvailable: 0,
  totalOccupied: 0,
  overallOccupancy: 0,    // %
  totalDailyRevenue: 0,   // sum(occupied * rate)
  potentialRevenue: 0,    // sum(total_beds * rate)
};

const computeWardStats = (wards) => {
  if (!Array.isArray(wards) || wards.length === 0) return { ...defaultWardStats };

  let totalBeds = 0;
  let totalAvailable = 0;
  let totalOccupied = 0;
  let totalDailyRevenue = 0;
  let potentialRevenue = 0;

  wards.forEach((w) => {
    const beds = Number(w.total_beds) || 0;
    const available = Number(w.available_beds) || 0;
    const occupied = Math.max(beds - available, 0);
    const rate = Number(w.daily_rate) || 0;

    totalBeds += beds;
    totalAvailable += available;
    totalOccupied += occupied;
    totalDailyRevenue += occupied * rate;
    potentialRevenue += beds * rate;
  });

  const overallOccupancy =
    totalBeds > 0 ? Math.round(((totalOccupied / totalBeds) * 100) * 10) / 10 : 0;

  return {
    totalBeds,
    totalAvailable,
    totalOccupied,
    overallOccupancy,
    totalDailyRevenue,
    potentialRevenue,
  };
};

export const useWardData = () => {
  const [hospitals, setHospitals] = useState([]);
  const [wardData, setWardData] = useState([]);
  const [wardStats, setWardStats] = useState({ ...defaultWardStats });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wardCache, setWardCache] = useState(new Map()); // Cache wards by hospital ID
  const [currentHospitalId, setCurrentHospitalId] = useState(null);

  // Load hospitals on mount
  useEffect(() => {
    let cancelled = false;

    const loadHospitals = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Use our unified dataService instead of separate hospitalService
        const res = await dataService.fetchHospitalsData();

        // Handle different response formats from the API
        let list = [];
        if (res?.success) {
          list = Array.isArray(res.data) 
            ? res.data 
            : res.data?.hospitals || [];
        } else if (Array.isArray(res)) {
          list = res;
        }

        if (!cancelled) setHospitals(list);
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load hospitals');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadHospitals();
    return () => { cancelled = true; };
  }, []);

  // Public method to fetch wards for a hospital
  const fetchWardsByHospital = useCallback(async (hospitalId) => {
    if (!hospitalId) return;

    // Check cache first
    if (wardCache.has(hospitalId) && currentHospitalId === hospitalId) {
      console.log(`🔄 Using cached ward data for hospital ${hospitalId}`);
      const cachedWards = wardCache.get(hospitalId);
      setWardData(cachedWards);
      setWardStats(computeWardStats(cachedWards));
      return;
    }

    setIsLoading(true);
    setError(null);
    setCurrentHospitalId(hospitalId);

    try {
      console.log(`🔄 Fetching ward data for hospital ${hospitalId}`);
      // Use hospital-specific endpoint instead of fetching all wards
      const response = await dataService.getWardData(hospitalId);
      if (response.success) {
        // Backend returns { count: X, wards: [...] }, we need the wards array
        const wards = response.data.wards || response.data;

        // Cache the results
        setWardCache(prev => new Map(prev).set(hospitalId, wards));
        setWardData(wards);
        setWardStats(computeWardStats(wards));
      } else {
        setError(response.error);
      }
    } catch (e) {
      // Gracefully handle 404 (no wards for a hospital)
      const status = e?.response?.status || e?.status;
      if (status === 404) {
        const emptyWards = [];
        setWardCache(prev => new Map(prev).set(hospitalId, emptyWards));
        setWardData(emptyWards);
        setWardStats({ ...defaultWardStats });
        setError(null); // Not really an error for UI purposes
      } else {
        setWardData([]);
        setWardStats({ ...defaultWardStats });
        setError(e?.message || 'Failed to load ward data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [wardCache, currentHospitalId]);

  return {
    hospitals,
    wardData,
    wardStats,
    isLoading,
    error,
    fetchWardsByHospital,
  };
};
