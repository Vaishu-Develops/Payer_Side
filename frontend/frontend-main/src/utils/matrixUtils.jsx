// Utility functions for matrix operations
export class MatrixUtils {
  // Color coding utilities
  static getHeatmapColor(count, maxCount = 10) {
    if (count === 0) return '#dc2626'; // Red - No coverage
    
    const intensity = Math.min(count / maxCount, 1);
    
    if (intensity <= 0.2) return '#fca5a5'; // Light Red - Very Limited
    if (intensity <= 0.4) return '#fbbf24'; // Yellow - Limited
    if (intensity <= 0.7) return '#86efac'; // Light Green - Good
    return '#16a34a'; // Green - Excellent
  }

  static getCoverageLabel(count) {
    if (count === 0) return 'No Coverage';
    if (count === 1) return 'Very Limited';
    if (count <= 3) return 'Limited';
    if (count <= 6) return 'Good';
    return 'Excellent';
  }

  static getCoverageScore(count, maxPossible = 10) {
    return Math.min(Math.round((count / maxPossible) * 100), 100);
  }

  // Data transformation utilities
  static groupSpecialtiesByCategory(specialties) {
    const groups = {};
    
    specialties.forEach(specialty => {
      const category = specialty.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(specialty);
    });

    return groups;
  }

  static sortCitiesByCoverage(cities, direction = 'desc') {
    return [...cities].sort((a, b) => {
      const scoreA = a.coverageScore || 0;
      const scoreB = b.coverageScore || 0;
      return direction === 'desc' ? scoreB - scoreA : scoreA - scoreB;
    });
  }

  static sortSpecialtiesByAvailability(specialties, direction = 'desc') {
    return [...specialties].sort((a, b) => {
      const availA = a.availability || 0;
      const availB = b.availability || 0;
      return direction === 'desc' ? availB - availA : availA - availB;
    });
  }

  // Statistical calculations
  static calculateCoverageStatistics(matrix, totalCities, totalSpecialties) {
    const totalCombinations = totalCities * totalSpecialties;
    const filledCombinations = matrix.size;
    const gapCount = totalCombinations - filledCombinations;
    
    const counts = Array.from(matrix.values()).map(cell => cell.count);
    const totalHospitals = counts.reduce((sum, count) => sum + count, 0);
    const averageHospitalsPerCell = totalHospitals / filledCombinations;

    return {
      totalCombinations,
      filledCombinations,
      gapCount,
      coveragePercentage: Math.round((filledCombinations / totalCombinations) * 100),
      gapPercentage: Math.round((gapCount / totalCombinations) * 100),
      totalHospitals,
      averageHospitalsPerCell: Math.round(averageHospitalsPerCell * 100) / 100
    };
  }

  static calculateRegionalDistribution(cities) {
    const distribution = {};
    const totalCities = cities.length;

    cities.forEach(city => {
      const state = city.state;
      if (!distribution[state]) {
        distribution[state] = {
          count: 0,
          totalSpecialties: 0,
          avgCoverageScore: 0
        };
      }
      
      distribution[state].count++;
      distribution[state].totalSpecialties += city.totalSpecialties || 0;
    });

    // Calculate percentages and averages
    Object.keys(distribution).forEach(state => {
      const stateData = distribution[state];
      stateData.percentage = Math.round((stateData.count / totalCities) * 100);
      stateData.avgSpecialties = Math.round(stateData.totalSpecialties / stateData.count);
      
      // Calculate average coverage score for state
      const stateCities = cities.filter(city => city.state === state);
      const totalCoverageScore = stateCities.reduce((sum, city) => sum + (city.coverageScore || 0), 0);
      stateData.avgCoverageScore = Math.round(totalCoverageScore / stateCities.length);
    });

    return distribution;
  }

  // Search and filtering utilities
  static searchMatrix(data, searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') return data;

    const term = searchTerm.toLowerCase().trim();
    const { cities, specialties, matrix } = data;

    const filteredCities = cities.filter(city =>
      city.name.toLowerCase().includes(term) ||
      city.state.toLowerCase().includes(term)
    );

    const filteredSpecialties = specialties.filter(specialty =>
      specialty.name.toLowerCase().includes(term) ||
      specialty.category.toLowerCase().includes(term)
    );

    return {
      ...data,
      cities: filteredCities,
      specialties: filteredSpecialties
    };
  }

  static applyFilters(data, filters) {
    let { cities, specialties } = data;

    // State filter
    if (filters.states && filters.states.length > 0) {
      cities = cities.filter(city => filters.states.includes(city.state));
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      specialties = specialties.filter(specialty => 
        filters.categories.includes(specialty.category));
    }

    // Coverage range filter
    if (filters.minCoverage !== undefined) {
      cities = cities.filter(city => (city.coverageScore || 0) >= filters.minCoverage);
    }

    if (filters.maxCoverage !== undefined) {
      cities = cities.filter(city => (city.coverageScore || 0) <= filters.maxCoverage);
    }

    // Hospital count filter
    if (filters.minHospitals !== undefined) {
      cities = cities.filter(city => city.hospitals?.size >= filters.minHospitals);
    }

    return { ...data, cities, specialties };
  }

  // Export utilities
  static generateExportData(data, format = 'summary') {
    switch (format) {
      case 'summary':
        return this.generateSummaryExport(data);
      case 'detailed':
        return this.generateDetailedExport(data);
      case 'gaps':
        return this.generateGapAnalysisExport(data);
      default:
        return this.generateSummaryExport(data);
    }
  }

  static generateSummaryExport(data) {
    const { cities, specialties, statistics } = data;
    
    return {
      overview: {
        totalCities: cities.length,
        totalSpecialties: specialties.length,
        coveragePercentage: statistics.coveragePercentage,
        gapPercentage: statistics.gapPercentage
      },
      topCities: this.sortCitiesByCoverage(cities).slice(0, 10),
      topSpecialties: this.sortSpecialtiesByAvailability(specialties).slice(0, 10),
      regionalDistribution: this.calculateRegionalDistribution(cities)
    };
  }

  static generateDetailedExport(data) {
    const { cities, specialties, matrix } = data;
    
    const detailedMatrix = [];
    cities.forEach(city => {
      specialties.forEach(specialty => {
        const matrixKey = `${city.key}_${specialty.name}`;
        const cellData = matrix.get(matrixKey);
        
        detailedMatrix.push({
          city: city.name,
          state: city.state,
          specialty: specialty.name,
          category: specialty.category,
          hospitalCount: cellData ? cellData.count : 0,
          hospitals: cellData ? cellData.hospitals.map(h => h.name).join('; ') : '',
          coverageLevel: this.getCoverageLabel(cellData ? cellData.count : 0)
        });
      });
    });

    return detailedMatrix;
  }

  static generateGapAnalysisExport(data) {
    const { cities, specialties, matrix } = data;
    
    const gaps = [];
    cities.forEach(city => {
      specialties.forEach(specialty => {
        const matrixKey = `${city.key}_${specialty.name}`;
        const cellData = matrix.get(matrixKey);
        
                if (!cellData || cellData.count === 0) {
          gaps.push({
            city: city.name,
            state: city.state,
            specialty: specialty.name,
            category: specialty.category,
            gapType: 'Complete Gap',
            priority: this.calculateGapPriority(city, specialty),
            recommendation: this.getGapRecommendation(city, specialty, data)
          });
        }
      });
    });

    return gaps.sort((a, b) => b.priority - a.priority);
  }

  static calculateGapPriority(city, specialty) {
    // Priority calculation based on city size and specialty importance
    const hospitalCount = city.hospitals?.size || 0;
    const cityScore = city.coverageScore || 0;
    
    const specialtyPriority = {
      'Emergency Medicine': 0.9,
      'General Medicine': 0.8,
      'General Surgery': 0.8,
      'Cardiology': 0.7,
      'Orthopedics': 0.6,
      'Gynecology & Obstetrics': 0.7,
      'Pediatrics': 0.7,
      'Neurology': 0.5,
      'Oncology': 0.4
    };

    const baseScore = specialtyPriority[specialty.name] || 0.4;
    const cityFactor = Math.min(hospitalCount / 10, 1); // Normalize hospital count
    const coverageFactor = (100 - cityScore) / 100; // Higher priority for lower coverage

    return Math.round((baseScore * cityFactor * coverageFactor) * 100) / 100;
  }

  static getGapRecommendation(city, specialty, data) {
    const priority = this.calculateGapPriority(city, specialty);
    
    if (priority > 0.7) {
      return `High Priority: Establish ${specialty.name} services in ${city.name}`;
    } else if (priority > 0.4) {
      return `Medium Priority: Consider partnership or referral network for ${specialty.name}`;
    } else {
      return `Low Priority: Monitor demand for ${specialty.name} in ${city.name}`;
    }
  }

  // Visualization utilities
  static generateHeatmapData(cities, specialties, matrix) {
    const heatmapData = [];
    
    cities.forEach((city, cityIndex) => {
      specialties.forEach((specialty, specialtyIndex) => {
        const matrixKey = `${city.key}_${specialty.name}`;
        const cellData = matrix.get(matrixKey);
        const count = cellData ? cellData.count : 0;
        
        heatmapData.push({
          x: specialtyIndex,
          y: cityIndex,
          value: count,
          city: city.name,
          state: city.state,
          specialty: specialty.name,
          category: specialty.category,
          color: this.getHeatmapColor(count),
          label: this.getCoverageLabel(count),
          hospitals: cellData ? cellData.hospitals : []
        });
      });
    });

    return heatmapData;
  }

  // Performance optimization utilities
  static createVirtualScrollData(data, pageSize = 50, currentPage = 0) {
    const startIndex = currentPage * pageSize;
    const endIndex = startIndex + pageSize;
    
    return {
      ...data,
      cities: data.cities.slice(startIndex, endIndex),
      pagination: {
        currentPage,
        pageSize,
        totalItems: data.cities.length,
        totalPages: Math.ceil(data.cities.length / pageSize)
      }
    };
  }

  // Validation utilities
  static validateMatrixData(data) {
    const errors = [];
    
    if (!data) {
      errors.push('Matrix data is required');
      return { isValid: false, errors };
    }

    if (!Array.isArray(data.cities) || data.cities.length === 0) {
      errors.push('Cities data is required and must be a non-empty array');
    }

    if (!Array.isArray(data.specialties) || data.specialties.length === 0) {
      errors.push('Specialties data is required and must be a non-empty array');
    }

    if (!data.matrix || !(data.matrix instanceof Map)) {
      errors.push('Matrix data must be a Map instance');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Caching utilities
  static createCacheKey(filters, sortConfig) {
    const filterString = JSON.stringify(filters);
    const sortString = JSON.stringify(sortConfig);
    return `matrix_${btoa(filterString + sortString)}`;
  }

  static isCacheValid(cacheTimestamp, maxAge = 300000) { // 5 minutes default
    return Date.now() - cacheTimestamp < maxAge;
  }
}

// Chart configuration utilities
export class ChartUtils {
  static generateBarChartConfig(data, title, xField, yField) {
    return {
      data,
      xField,
      yField,
      title: {
        visible: true,
        text: title,
        style: {
          fontSize: 16,
          fontWeight: 600
        }
      },
      color: '#2563eb',
      columnStyle: {
        radius: [4, 4, 0, 0]
      },
      meta: {
        [yField]: {
          alias: 'Count'
        }
      }
    };
  }

  static generateHeatmapConfig(data, title) {
    return {
      data,
      xField: 'specialty',
      yField: 'city',
      colorField: 'value',
      color: ['#dc2626', '#fca5a5', '#fbbf24', '#86efac', '#16a34a'],
      title: {
        visible: true,
        text: title
      },
      meta: {
        value: {
          alias: 'Hospital Count'
        }
      }
    };
  }

  static generatePieChartConfig(data, title, angleField, colorField) {
    return {
      data,
      angleField,
      colorField,
      title: {
        visible: true,
        text: title
      },
      radius: 0.8,
      label: {
        visible: true,
        type: 'spider'
      },
      legend: {
        visible: true,
        position: 'right'
      }
    };
  }
}

// Export utilities
export class ExportUtils {
  static downloadCSV(data, filename = 'matrix_data.csv') {
    const csvContent = this.convertToCSV(data);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    this.downloadFile(blob, filename);
  }

  static downloadJSON(data, filename = 'matrix_data.json') {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    this.downloadFile(blob, filename);
  }

  static convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header];
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    });

    return csvRows.join('\n');
  }

  static downloadFile(blob, filename) {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Generate PDF report (would require a PDF library)
  static generatePDFReport(data, title = 'Healthcare Specialty Coverage Matrix Report') {
    // This is a placeholder - you would use a library like jsPDF or react-pdf
    const reportData = {
      title,
      generatedAt: new Date().toISOString(),
      summary: MatrixUtils.generateSummaryExport(data),
      gaps: MatrixUtils.generateGapAnalysisExport(data).slice(0, 20) // Top 20 gaps
    };

    console.log('PDF Report Data:', reportData);
    alert('PDF generation would be implemented with a PDF library like jsPDF');
    
    return reportData;
  }
}

// Default export
export default MatrixUtils;
