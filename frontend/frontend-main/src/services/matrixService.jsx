// Matrix-specific data processing service
import dataService from './dataService';

class MatrixService {
  // Process raw data into matrix format
  async processMatrixData() {
    try {
      const [hospitalsRes, addressesRes, specialtiesRes] = await Promise.all([
        dataService.getHospitals(),
        dataService.getHospitalAddresses(),
        dataService.getMedicalSpecialties()
      ]);

      if (!hospitalsRes.success || !addressesRes.success || !specialtiesRes.success) {
        throw new Error('Failed to fetch required data');
      }

      return this.generateMatrixFromData(
        hospitalsRes.data,
        addressesRes.data,
        specialtiesRes.data
      );
    } catch (error) {
      console.error('Matrix processing error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  generateMatrixFromData(hospitals, addresses, specialties) {
    // Create city-hospital mapping
    const cityMap = this.createCityMapping(addresses);
    
    // Create specialty mapping
    const specialtyMap = this.createSpecialtyMapping(specialties);
    
    // Generate the matrix
    const matrix = this.generateMatrix(hospitals, addresses, specialties);
    
    // Calculate statistics
    const stats = this.calculateStatistics(cityMap, specialtyMap, matrix);
    
    return {
      success: true,
      data: {
        cities: Array.from(cityMap.values()),
        specialties: Array.from(specialtyMap.values()),
        matrix,
        statistics: stats
      }
    };
  }

  createCityMapping(addresses) {
    const cityMap = new Map();
    
    addresses.forEach(addr => {
      const key = `${addr.city_town}, ${addr.state}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          key,
          name: addr.city_town,
          state: addr.state,
          hospitals: new Set(),
          totalSpecialties: 0,
          coverageScore: 0
        });
      }
      cityMap.get(key).hospitals.add(addr.hospital_id);
    });

    return cityMap;
  }

  createSpecialtyMapping(specialties) {
    const specialtyMap = new Map();
    
    specialties.forEach(spec => {
      if (spec.is_available) {
        const key = spec.specialty_name;
        if (!specialtyMap.has(key)) {
          specialtyMap.set(key, {
            name: spec.specialty_name,
            category: spec.specialty_category,
            cities: new Set(),
            totalCities: 0,
            availability: 0
          });
        }
      }
    });

    return specialtyMap;
  }

  generateMatrix(hospitals, addresses, specialties) {
    const matrix = new Map();

    specialties.forEach(spec => {
      if (!spec.is_available) return;

      const hospital = hospitals.find(h => h.id === spec.hospital_id);
      if (!hospital) return;

      const hospitalAddresses = addresses.filter(addr => addr.hospital_id === spec.hospital_id);
      
      hospitalAddresses.forEach(addr => {
        const cityKey = `${addr.city_town}, ${addr.state}`;
        const matrixKey = `${cityKey}_${spec.specialty_name}`;
        
        if (!matrix.has(matrixKey)) {
          matrix.set(matrixKey, {
            cityKey,
            specialty: spec.specialty_name,
            category: spec.specialty_category,
            count: 0,
            hospitals: []
          });
        }

        const matrixEntry = matrix.get(matrixKey);
        if (!matrixEntry.hospitals.find(h => h.id === hospital.id)) {
          matrixEntry.count++;
          matrixEntry.hospitals.push({
            id: hospital.id,
            name: hospital.name,
            type: hospital.hospital_type,
            beds: hospital.beds_operational || 0
          });
        }
      });
    });

    return matrix;
  }

  calculateStatistics(cityMap, specialtyMap, matrix) {
    const totalCities = cityMap.size;
    const totalSpecialties = specialtyMap.size;
    const totalCombinations = totalCities * totalSpecialties;
    const filledCombinations = matrix.size;
    const gapCount = totalCombinations - filledCombinations;

    // Calculate coverage scores for cities
    cityMap.forEach((cityData, cityKey) => {
      let citySpecialtyCount = 0;
      specialtyMap.forEach((_, specialty) => {
        const matrixKey = `${cityKey}_${specialty}`;
        if (matrix.has(matrixKey) && matrix.get(matrixKey).count > 0) {
          citySpecialtyCount++;
        }
      });
      cityData.totalSpecialties = citySpecialtyCount;
      cityData.coverageScore = Math.round((citySpecialtyCount / totalSpecialties) * 100);
    });

    // Calculate availability for specialties
    specialtyMap.forEach((specData, specialty) => {
      const citiesWithSpecialty = new Set();
      matrix.forEach((matrixEntry, matrixKey) => {
        if (matrixEntry.specialty === specialty && matrixEntry.count > 0) {
          citiesWithSpecialty.add(matrixEntry.cityKey);
        }
      });
      specData.cities = citiesWithSpecialty;
      specData.totalCities = citiesWithSpecialty.size;
      specData.availability = Math.round((citiesWithSpecialty.size / totalCities) * 100);
    });

    // Find best performers
    const cities = Array.from(cityMap.values());
    const specialties = Array.from(specialtyMap.values());
    
    const bestCity = cities.reduce((best, city) => 
      city.coverageScore > (best?.coverageScore || 0) ? city : best, null);
    
    const topSpecialty = specialties.reduce((top, spec) => 
      spec.availability > (top?.availability || 0) ? spec : top, null);

    return {
      totalCities,
      totalSpecialties,
      totalCombinations,
      filledCombinations,
      gapCount,
      gapPercentage: Math.round((gapCount / totalCombinations) * 100),
      coveragePercentage: Math.round((filledCombinations / totalCombinations) * 100),
      bestCity,
      topSpecialty,
      averageCityScore: Math.round(cities.reduce((sum, city) => sum + city.coverageScore, 0) / cities.length),
      averageSpecialtyAvailability: Math.round(specialties.reduce((sum, spec) => sum + spec.availability, 0) / specialties.length)
    };
  }

  // Export data in various formats
  exportMatrixData(data, format = 'csv') {
    switch (format) {
      case 'csv':
        return this.exportToCSV(data);
      case 'json':
        return this.exportToJSON(data);
      case 'excel':
        return this.exportToExcel(data);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  exportToCSV(data) {
    const { cities, specialties, matrix } = data;
    
    // Create header row
    const headers = ['City', 'State', ...specialties.map(s => s.name)];
    let csv = headers.join(',') + '\n';
    
    // Add data rows
    cities.forEach(city => {
      const row = [city.name, city.state];
      specialties.forEach(specialty => {
        const matrixKey = `${city.key}_${specialty.name}`;
        const cellData = matrix.get(matrixKey);
        row.push(cellData ? cellData.count : 0);
      });
      csv += row.join(',') + '\n';
    });
    
    return csv;
  }

  exportToJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  exportToExcel(data) {
    // This would require a library like xlsx
    // For now, return CSV format
    return this.exportToCSV(data);
  }

  // Filter and search functionality
  filterMatrixData(data, filters) {
    let { cities, specialties } = data;

    if (filters.states && filters.states.length > 0) {
      cities = cities.filter(city => filters.states.includes(city.state));
    }

    if (filters.categories && filters.categories.length > 0) {
      specialties = specialties.filter(spec => 
        filters.categories.includes(spec.category));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      cities = cities.filter(city => 
        city.name.toLowerCase().includes(term) || 
        city.state.toLowerCase().includes(term));
      specialties = specialties.filter(spec => 
        spec.name.toLowerCase().includes(term));
    }

    // Apply minimum coverage filter
    if (filters.minCoverage !== undefined) {
      cities = cities.filter(city => city.coverageScore >= filters.minCoverage);
    }

    return { ...data, cities, specialties };
  }

  // Get recommendations for coverage gaps
  getGapRecommendations(cityKey, specialty, data) {
    const { cities, matrix } = data;
    
    // Find nearest cities with this specialty
    const nearestAlternatives = cities
      .filter(city => {
        const matrixKey = `${city.key}_${specialty}`;
        const cellData = matrix.get(matrixKey);
        return cellData && cellData.count > 0;
      })
      .slice(0, 3);

    // Calculate potential demand (simplified)
    const city = cities.find(c => c.key === cityKey);
    const hospitalCount = city ? city.hospitals.size : 0;
    
    const recommendations = {
      nearestAlternatives,
      potentialDemand: this.calculatePotentialDemand(hospitalCount, specialty),
      establishmentRecommendation: this.getEstablishmentRecommendation(cityKey, specialty),
      partnershipOpportunities: nearestAlternatives.slice(0, 2)
    };

    return recommendations;
  }

  calculatePotentialDemand(hospitalCount, specialty) {
    // Simplified demand calculation
    const baselineMultiplier = {
      'General Medicine': 0.8,
      'General Surgery': 0.7,
      'Cardiology': 0.5,
      'Neurology': 0.3,
      'Oncology': 0.2
    };

    const multiplier = baselineMultiplier[specialty] || 0.4;
    return Math.round(hospitalCount * multiplier * 100) / 100;
  }

  getEstablishmentRecommendation(cityKey, specialty) {
    // Simple recommendation logic
    const priority = this.calculateEstablishmentPriority(specialty);
    
    return {
      priority,
      recommendation: priority > 0.7 ? 'High Priority - Establish Service' :
                    priority > 0.4 ? 'Medium Priority - Consider Partnership' :
                    'Low Priority - Monitor Demand',
      estimatedInvestment: this.estimateInvestment(specialty),
      timeframe: this.estimateTimeframe(specialty)
    };
  }

  calculateEstablishmentPriority(specialty) {
    // Simplified priority calculation based on specialty type
    const priorityScores = {
      'Emergency Medicine': 0.9,
      'General Medicine': 0.8,
      'General Surgery': 0.8,
      'Cardiology': 0.7,
      'Orthopedics': 0.6,
      'Gynecology & Obstetrics': 0.7,
      'Pediatrics': 0.7,
      'Neurology': 0.5,
      'Oncology': 0.4,
      'Psychiatry': 0.5
    };

    return priorityScores[specialty] || 0.4;
  }

  estimateInvestment(specialty) {
    // Simplified investment estimation
    const investmentRanges = {
      'Emergency Medicine': '₹50L - ₹1Cr',
      'General Medicine': '₹20L - ₹50L',
      'General Surgery': '₹30L - ₹80L',
      'Cardiology': '₹1Cr - ₹3Cr',
      'Neurology': '₹80L - ₹2Cr',
      'Oncology': '₹2Cr - ₹5Cr'
    };

    return investmentRanges[specialty] || '₹30L - ₹1Cr';
  }

  estimateTimeframe(specialty) {
    // Simplified timeframe estimation
    const timeframes = {
      'General Medicine': '3-6 months',
      'General Surgery': '6-9 months',
      'Emergency Medicine': '6-12 months',
      'Cardiology': '12-18 months',
      'Neurology': '12-24 months',
      'Oncology': '18-36 months'
    };

    return timeframes[specialty] || '6-12 months';
  }
}

// Create singleton instance
const matrixService = new MatrixService();

export default matrixService;
