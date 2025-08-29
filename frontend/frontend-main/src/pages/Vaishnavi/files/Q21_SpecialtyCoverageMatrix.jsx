import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Select, Button, Card, Spin, Tooltip, Input, Row, Col, Tag, Progress } from 'antd';
import { 
  DownloadOutlined, 
  SearchOutlined, 
  FilterOutlined, 
  WarningOutlined,
  TrophyOutlined,
  MedicineBoxOutlined,
  DashboardOutlined,
  HeatMapOutlined,
  BankOutlined,
  UserOutlined,
  FileExcelOutlined
} from '@ant-design/icons';
import dataService from '../../../services/dataService';
import './styles/Q21_SpecialtyCoverageMatrix.css';
import * as XLSX from 'xlsx';

const { Option } = Select;
const { Search } = Input;

const SpecialtyCoverageMatrix = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({
    states: [],
    specialtyCategories: [],
    viewMode: 'count',
    searchTerm: ''
  });
  const [selectedCell, setSelectedCell] = useState(null);
  const [sortConfig, setSortConfig] = useState({ field: 'coverageScore', direction: 'desc' });
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  // Create a portal container for tooltips
  const [tooltipPortalContainer] = useState(() => {
    // Check if we're in the browser environment
    if (typeof document !== 'undefined') {
      // Look for existing container or create a new one
      let container = document.getElementById('tooltip-portal-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'tooltip-portal-container';
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.width = '0';
        container.style.height = '0';
        container.style.overflow = 'visible';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
      }
      return container;
    }
    return null;
  });

  // Data Processing
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hospitalsRes, addressesRes, specialtiesRes] = await Promise.all([
        dataService.getHospitals(),
        dataService.getHospitalAddresses(),
        dataService.getMedicalSpecialties()
      ]);

      console.log('🔄 Raw API responses:', { hospitalsRes, addressesRes, specialtiesRes });

      if (hospitalsRes.success && addressesRes.success && specialtiesRes.success) {
        // Extract arrays from response data, handling different response structures
        const hospitalsData = hospitalsRes.data?.hospitals || (Array.isArray(hospitalsRes.data) ? hospitalsRes.data : []);
        const addressesData = Array.isArray(addressesRes.data) ? addressesRes.data : [];
        const specialtiesData = Array.isArray(specialtiesRes.data) ? specialtiesRes.data : [];

        console.log('📊 Processed data:', {
          hospitalsCount: hospitalsData.length,
          addressesCount: addressesData.length, 
          specialtiesCount: specialtiesData.length
        });

        setHospitals(hospitalsData);
        setAddresses(addressesData);
        setSpecialties(specialtiesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Matrix Generation
  const processedData = useMemo(() => {
    if (!hospitals.length || !addresses.length || !specialties.length) {
      return { cities: [], uniqueSpecialties: [], matrix: new Map(), summary: {} };
    }

    // Create city-hospital mapping
    const cityMap = new Map();
    addresses.forEach(addr => {
      const key = `${addr.city_town}, ${addr.state}`;
      if (!cityMap.has(key)) {
        cityMap.set(key, {
          cityName: addr.city_town,
          state: addr.state,
          hospitals: new Set()
        });
      }
      cityMap.get(key).hospitals.add(addr.hospital_id);
    });

    // Get unique specialties and categories
    const specialtyMap = new Map();
    const categoryMap = new Map();
    
    specialties.forEach(spec => {
      if (spec.is_available) {
        const specKey = spec.specialty_name;
        if (!specialtyMap.has(specKey)) {
          specialtyMap.set(specKey, {
            name: spec.specialty_name,
            category: spec.specialty_category,
            cities: new Set()
          });
        }
        
        if (!categoryMap.has(spec.specialty_category)) {
          categoryMap.set(spec.specialty_category, new Set());
        }
        categoryMap.get(spec.specialty_category).add(specKey);
      }
    });

    // Generate matrix data
    const matrix = new Map();
    const cityStats = new Map();
    const specialtyStats = new Map();

    // Initialize city stats
    cityMap.forEach((cityData, cityKey) => {
      cityStats.set(cityKey, {
        ...cityData,
        totalSpecialties: 0,
        coverageScore: 0
      });
    });

    // Initialize specialty stats
    specialtyMap.forEach((specData, specKey) => {
      specialtyStats.set(specKey, {
        ...specData,
        totalCities: 0,
        availability: 0
      });
    });

    // Populate matrix
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
            type: hospital.hospital_type
          });
        }

        // Update specialty cities count
        specialtyMap.get(spec.specialty_name).cities.add(cityKey);
      });
    });

    // Calculate coverage scores
    const totalSpecialties = specialtyMap.size;
    cityStats.forEach((cityData, cityKey) => {
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

    // Calculate specialty availability
    const totalCities = cityStats.size;
    specialtyStats.forEach((specData, specialty) => {
      const citiesWithSpecialty = specData.cities.size;
      specData.totalCities = citiesWithSpecialty;
      specData.availability = Math.round((citiesWithSpecialty / totalCities) * 100);
    });

    // Prepare final data structures
    const cities = Array.from(cityStats.entries()).map(([key, data]) => ({
      key,
      name: data.cityName,
      state: data.state,
      totalSpecialties: data.totalSpecialties,
      coverageScore: data.coverageScore,
      hospitalCount: data.hospitals.size
    }));

    const uniqueSpecialties = Array.from(specialtyStats.entries()).map(([name, data]) => ({
      name,
      category: data.category,
      totalCities: data.totalCities,
      availability: data.availability
    }));

    // Calculate summary metrics
    const totalCombinations = cities.length * uniqueSpecialties.length;
    const gapCount = totalCombinations - matrix.size;
    const bestCity = cities.reduce((best, city) => 
      city.coverageScore > (best?.coverageScore || 0) ? city : best, null);
    const topSpecialty = uniqueSpecialties.reduce((top, spec) => 
      spec.availability > (top?.availability || 0) ? spec : top, null);

    const summary = {
      totalCombinations,
      gapCount,
      gapPercentage: Math.round((gapCount / totalCombinations) * 100),
      bestCity,
      topSpecialty,
      totalCities: cities.length,
      totalSpecialties: uniqueSpecialties.length
    };

    return { cities, uniqueSpecialties, matrix, summary, categoryMap };
  }, [hospitals, addresses, specialties]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    let { cities, uniqueSpecialties } = processedData;

    // Apply filters
    if (filters.states.length > 0) {
      cities = cities.filter(city => filters.states.includes(city.state));
    }

    if (filters.specialtyCategories.length > 0) {
      uniqueSpecialties = uniqueSpecialties.filter(spec => 
        filters.specialtyCategories.includes(spec.category));
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      cities = cities.filter(city => 
        city.name.toLowerCase().includes(term) || 
        city.state.toLowerCase().includes(term));
      uniqueSpecialties = uniqueSpecialties.filter(spec => 
        spec.name.toLowerCase().includes(term));
    }

    // Apply sorting
    cities.sort((a, b) => {
      const aVal = a[sortConfig.field] || 0;
      const bVal = b[sortConfig.field] || 0;
      return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return { cities, uniqueSpecialties };
  }, [processedData, filters, sortConfig]);

  // Get unique states and categories for filters
  const filterOptions = useMemo(() => {
    const states = [...new Set(addresses.map(addr => addr.state))].sort();
    const categories = [...new Set(specialties.map(spec => spec.specialty_category))].sort();
    return { states, categories };
  }, [addresses, specialties]);

  // Color coding for heatmap - based on hospital count
  const getHeatmapColor = (hospitalCount) => {
    // Check if hospitalCount is undefined, null, or NaN
    if (hospitalCount === undefined || hospitalCount === null || isNaN(hospitalCount)) {
      return '#dc2626'; // Red - No hospitals
    }
    
    // Make sure we handle numeric conversion properly
    const count = Number(hospitalCount);
    
    if (count === 0) return '#dc2626'; // Red - No hospitals
    if (count === 1) return '#fca5a5'; // Light Red - 1 hospital
    if (count <= 3) return '#fbbf24'; // Yellow - 2-3 hospitals
    if (count <= 6) return '#86efac'; // Light Green - 4-6 hospitals
    return '#16a34a'; // Green - 7+ hospitals
  };

  const getCoverageLabel = (hospitalCount) => {
    if (hospitalCount === 0) return 'No Coverage';
    if (hospitalCount === 1) return 'Very Limited';
    if (hospitalCount <= 3) return 'Limited';
    if (hospitalCount <= 6) return 'Good';
    return 'Excellent';
  };

  // Event Handlers
  const handleCellClick = (cityKey, specialty) => {
    const matrixKey = `${cityKey}_${specialty}`;
    const cellData = processedData.matrix.get(matrixKey);
    setSelectedCell({
      cityKey,
      specialty,
      data: cellData || { count: 0, hospitals: [] }
    });
  };

  const handleSort = (field) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleExportToExcel = () => {
    try {
      const { cities, uniqueSpecialties, matrix } = processedData;
      
      // Create header row with specialty names
      const headers = ['City', 'State', 'Coverage Score', ...uniqueSpecialties.map(s => s.name)];
      
      // Create data rows
      const rows = cities.map(city => {
        const row = [city.name, city.state, `${city.coverageScore}%`];
        
        // Add count for each specialty
        uniqueSpecialties.forEach(specialty => {
          const matrixKey = `${city.key}_${specialty.name}`;
          const cellData = matrix.get(matrixKey);
          row.push(cellData ? cellData.hospitals.length : 0);
        });
        
        return row;
      });
      
      // Add a specialty stats row at the bottom
      const statsRow = ['Availability', '', '', ...uniqueSpecialties.map(s => `${s.availability}%`)];
      
      // Combine headers and rows
      const excelData = [headers, ...rows, [], statsRow];
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      
      // Auto-size columns
      const colWidths = [];
      excelData[0].forEach((header, i) => {
        colWidths[i] = Math.max(
          header.toString().length,
          ...excelData.slice(1).map(row => row[i] ? row[i].toString().length : 0)
        );
      });
      
      ws['!cols'] = colWidths.map(width => ({ width }));
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Specialty Coverage');
      
      // Generate Excel file and trigger download
      XLSX.writeFile(wb, 'Specialty_Coverage_Matrix.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      // Fallback to CSV if XLSX fails
      exportToCSV();
    }
  };
  
  // Fallback CSV export
  const exportToCSV = () => {
    const { cities, uniqueSpecialties, matrix } = processedData;
    
    // Create header row with specialty names
    const headers = ['City', 'State', 'Coverage Score', ...uniqueSpecialties.map(s => s.name)];
    
    // Create data rows
    const rows = cities.map(city => {
      const row = [city.name, city.state, `${city.coverageScore}%`];
      
      // Add count for each specialty
      uniqueSpecialties.forEach(specialty => {
        const matrixKey = `${city.key}_${specialty.name}`;
        const cellData = matrix.get(matrixKey);
        row.push(cellData ? cellData.hospitals.length : 0);
      });
      
      return row;
    });
    
    // Combine headers and rows
    const csvData = [headers, ...rows];
    
    // Convert to CSV string
    const csvContent = csvData.map(e => e.join(',')).join('\n');
    
    // Create download link
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Specialty_Coverage_Matrix.csv');
    document.body.appendChild(link);
    
    // Download the data file
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="specialty-coverage-matrix">
        <div className="loading-container">
          <Spin size="large" />
          <p>Loading specialty coverage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="specialty-coverage-matrix">
      {/* Header */}
      <div className="scm-dashboard-header">
        <div className="scm-header-container">
          <div className="scm-header-content">
            <h1 className="scm-main-title">Healthcare Specialty Coverage Matrix</h1>
            <p className="scm-subtitle">
              Service availability analysis across {processedData.summary.totalCities} cities and {processedData.summary.totalSpecialties} specialties
            </p>
          </div>
          <div className="scm-header-controls-row">
            <Select
              mode="multiple"
              placeholder="Filter by State"
              value={filters.states}
              onChange={(values) => setFilters(prev => ({ ...prev, states: values }))}
              style={{ minWidth: 180 }}
              suffixIcon={<FilterOutlined />}
            >
              {filterOptions.states.map(state => (
                <Option key={state} value={state}>{state}</Option>
              ))}
            </Select>

            <Select
              mode="multiple"
              placeholder="Filter by Category"
              value={filters.specialtyCategories}
              onChange={(values) => setFilters(prev => ({ ...prev, specialtyCategories: values }))}
              style={{ minWidth: 180 }}
              suffixIcon={<FilterOutlined />}
            >
              {filterOptions.categories.map(category => (
                <Option key={category} value={category}>{category}</Option>
              ))}
            </Select>

            <Select
              value={filters.viewMode}
              onChange={(value) => setFilters(prev => ({ ...prev, viewMode: value }))}
              style={{ minWidth: 150 }}
            >
              <Option value="count">Count View</Option>
              <Option value="percentage">Percentage View</Option>
            </Select>

            <Button
              type="primary"
              icon={<FileExcelOutlined />}
              onClick={handleExportToExcel}
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </div>

      <div className="scm-dashboard-content">
        {/* KPI Cards */}
        <div className="scm-kpi-row">
          <Card className="scm-kpi-card">
            <div className="scm-kpi-content">
              <div className="scm-kpi-icon-container blue">
                <DashboardOutlined style={{ color: '#2563eb', fontSize: '24px' }} />
              </div>
              <div className="scm-kpi-details">
                <div className="scm-kpi-value">{processedData.summary.totalCombinations}</div>
                <div className="scm-kpi-label">Total Combinations</div>
                <div className="scm-kpi-description">Coverage opportunities</div>
              </div>
            </div>
          </Card>

          <Card className="scm-kpi-card">
            <div className="scm-kpi-content">
              <div className="scm-kpi-icon-container yellow">
                <WarningOutlined style={{ 
                  color: processedData.summary.gapPercentage > 50 ? '#dc2626' : '#d97706', 
                  fontSize: '24px' 
                }} />
              </div>
              <div className="scm-kpi-details">
                <div className="scm-kpi-value">{processedData.summary.gapCount}</div>
                <div className="scm-kpi-label">Coverage Gaps</div>
                <div className="scm-kpi-description">{processedData.summary.gapPercentage}% gap rate</div>
              </div>
            </div>
          </Card>

          <Card className="scm-kpi-card">
            <div className="scm-kpi-content">
              <div className="scm-kpi-icon-container green">
                <TrophyOutlined style={{ color: '#16a34a', fontSize: '24px' }} />
              </div>
              <div className="scm-kpi-details">
                <div className="scm-kpi-value">{processedData.summary.bestCity?.name || 'N/A'}</div>
                <div className="scm-kpi-label">Best Covered City</div>
                <div className="scm-kpi-description">
                  {processedData.summary.bestCity?.totalSpecialties || 0} specialties available
                </div>
              </div>
            </div>
          </Card>

          <Card className="scm-kpi-card">
            <div className="scm-kpi-content">
              <div className="scm-kpi-icon-container green">
                <MedicineBoxOutlined style={{ color: '#16a34a', fontSize: '24px' }} />
              </div>
              <div className="scm-kpi-details">
                <div className="scm-kpi-value">{processedData.summary.topSpecialty?.name || 'N/A'}</div>
                <div className="scm-kpi-label">Most Available Specialty</div>
                <div className="scm-kpi-description">
                  Available in {processedData.summary.topSpecialty?.totalCities || 0} cities
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Row */}
        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col span={selectedCell ? 18 : 24}>
            {/* Matrix Heatmap */}
            <Card className="scm-chart-container">
              <div className="scm-chart-header">
                <HeatMapOutlined style={{ fontSize: '20px', color: '#2563eb' }} />
                <span className="scm-chart-title">Specialty Coverage Matrix</span>
                <div className="scm-matrix-controls">
                  <Search
                    placeholder="Search cities or specialties..."
                    value={filters.searchTerm}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchTerm: e.target.value }))}
                    style={{ width: 250 }}
                    prefix={<SearchOutlined />}
                  />
                </div>
              </div>
              <div className="scm-chart-content">
                <div className="scm-matrix-container">
                  {/* Legend */}
                  <div className="scm-matrix-legend">
                    <span className="scm-legend-title">Coverage Level:</span>
                    {[
                      { count: 0, label: 'No Coverage', color: '#dc2626' },
                      { count: 1, label: 'Very Limited', color: '#fca5a5' },
                      { count: 2, label: 'Limited', color: '#fbbf24' },
                      { count: 4, label: 'Good', color: '#86efac' },
                      { count: 7, label: 'Excellent', color: '#16a34a' }
                    ].map(item => (
                      <div key={item.label} className="scm-legend-item">
                        <div 
                          className="scm-legend-color" 
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.label} ({item.count}{item.count === 7 ? '+' : ''})</span>
                      </div>
                    ))}
                  </div>

                  {/* Matrix Grid */}
                  <div className="scm-matrix-grid-container">
                    <div className="scm-matrix-grid">
                      {/* Header Row - Specialties */}
                      <div className="scm-matrix-header-row">
                        <div className="scm-matrix-corner-cell">
                          <div className="scm-sort-controls">
                            <Button 
                              size="small" 
                              onClick={() => handleSort('name')}
                              className={sortConfig.field === 'name' ? 'active' : ''}
                            >
                              City {sortConfig.field === 'name' ? (sortConfig.direction === 'desc' ? '↓' : '↑') : ''}
                            </Button>
                            <Button 
                              size="small" 
                              onClick={() => handleSort('coverageScore')}
                              className={sortConfig.field === 'coverageScore' ? 'active' : ''}
                            >
                              Score {sortConfig.field === 'coverageScore' ? (sortConfig.direction === 'desc' ? '↓' : '↑') : ''}
                            </Button>
                          </div>
                        </div>
                        {filteredData.uniqueSpecialties.map(specialty => (
                          <div key={specialty.name} className="scm-matrix-header-cell">
                            <Tooltip title={`${specialty.name} - ${specialty.category}`}>
                              <div className="scm-specialty-header">
                                <div className="scm-specialty-name">{specialty.name}</div>
                                <div className="scm-specialty-category">{specialty.category}</div>
                                <div className="scm-specialty-stats">
                                  {specialty.totalCities} cities ({specialty.availability}%)
                                </div>
                              </div>
                            </Tooltip>
                          </div>
                        ))}
                      </div>

                      {/* Data Rows */}
                      {filteredData.cities.map(city => (
                        <div key={city.key} className="scm-matrix-data-row">
                          <div className="scm-matrix-row-header">
                            <div className="scm-city-info">
                              <div className="scm-city-name">{city.name}</div>
                              <div className="scm-city-state">{city.state}</div>
                              <div className="scm-city-stats">
                                <Tag color="blue">{city.totalSpecialties} specialties</Tag>
                                <Tag color={city.coverageScore > 70 ? 'green' : city.coverageScore > 40 ? 'orange' : 'red'}>
                                  {city.coverageScore}% coverage
                                </Tag>
                              </div>
                            </div>
                          </div>
                          {filteredData.uniqueSpecialties.map(specialty => {
                            const matrixKey = `${city.key}_${specialty.name}`;
                            const cellData = processedData.matrix.get(matrixKey);
                            // Special case for Pathology specialty which was showing as white
                            const isPathology = specialty.name === "Pathology";
                            
                            // Make sure we have a proper value for hospital count, especially for Pathology
                            const hospitalCount = cellData?.hospitals?.length || 0;
                            // Use a specific handling for Pathology if needed
                            const color = isPathology && hospitalCount === 0 ? '#dc2626' : getHeatmapColor(hospitalCount);
                            const tooltipId = `${city.name}-${specialty.name}`;

                            return (
                              <div
                                key={specialty.name}
                                className={`scm-matrix-cell ${selectedCell?.cityKey === city.key && selectedCell?.specialty === specialty.name ? 'selected' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleCellClick(city.key, specialty.name)}
                                onMouseEnter={(e) => {
                                  // Immediately clear any existing tooltip
                                  setTooltipVisible(null);
                                  
                                  // Cancel any existing timeout
                                  if (window._tooltipTimeout) {
                                    clearTimeout(window._tooltipTimeout);
                                    window._tooltipTimeout = null;
                                  }
                                  
                                  // Store the current element and tooltip ID
                                  window._currentTooltipCell = e.currentTarget;
                                  window._currentTooltipId = tooltipId;
                                  
                                  // Use a short delay to ensure reliable tooltip placement
                                  window._tooltipTimeout = setTimeout(() => {
                                    if (window._currentTooltipId === tooltipId) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setTooltipPosition({
                                        top: rect.top + window.scrollY,
                                        left: rect.left + window.scrollX + (rect.width / 2)
                                      });
                                      setTooltipVisible(tooltipId);
                                    }
                                  }, 50);
                                }}
                                onMouseLeave={() => {
                                  // Use a small delay to prevent flickering when moving between cells
                                  setTimeout(() => {
                                    // Only clear if we're not over another cell that needs the same tooltip
                                    if (window._currentTooltipId === tooltipId) {
                                      // Clear any pending tooltip display
                                      if (window._tooltipTimeout) {
                                        clearTimeout(window._tooltipTimeout);
                                        window._tooltipTimeout = null;
                                      }
                                      
                                      // Clear the current tooltip cell reference and hide tooltip
                                      window._currentTooltipCell = null;
                                      setTooltipVisible(null);
                                    }
                                  }, 50);
                                  window._currentTooltipId = null;
                                  
                                  // Hide tooltip
                                  setTooltipVisible(null);
                                }}
                              >
                                <span className="scm-cell-value">{hospitalCount}</span>
                                {tooltipVisible === tooltipId && createPortal(
                                  <div className="scm-cell-tooltip" 
                                       style={{ 
                                         position: 'fixed',
                                         top: `${tooltipPosition.top}px`, 
                                         left: `${tooltipPosition.left}px`,
                                         transform: 'translate(-50%, -110%)',
                                         zIndex: 9999
                                       }}>
                                    <div className="scm-tooltip-content">
                                      <div><strong>{city.name}, {city.state}</strong></div>
                                      <div><strong>Specialty:</strong> {specialty.name}</div>
                                      <div><strong>Category:</strong> {specialty.category}</div>
                                      <div><strong>Hospital Count:</strong> {cellData?.hospitals?.length || 0}</div>
                                      <div><strong>Coverage Level:</strong> {getCoverageLabel(cellData?.hospitals?.length || 0)}</div>
                                      {cellData?.hospitals && cellData.hospitals.length > 0 && (
                                        <div><strong>Hospitals:</strong> {cellData.hospitals.map(h => h.name).join(', ')}</div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          {/* Side Panel */}
          {selectedCell && (
            <Col span={6}>
              <Card className="scm-side-panel">
                <div className="scm-panel-header">
                  <h3>Coverage Details</h3>
                  <Button 
                    type="text" 
                    size="small" 
                    onClick={() => setSelectedCell(null)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="scm-panel-content">
                  <div className="scm-detail-section">
                    <h4>Selected Cell</h4>
                    <p><strong>City:</strong> {selectedCell.cityKey}</p>
                    <p><strong>Specialty:</strong> {selectedCell.specialty}</p>
                    <p><strong>Hospital Count:</strong> {selectedCell.data.hospitals?.length || 0}</p>
                    <p><strong>Coverage Level:</strong> {getCoverageLabel(selectedCell.data.hospitals?.length || 0)}</p>
                  </div>

                  {selectedCell.data.hospitals.length > 0 && (
                    <div className="scm-detail-section">
                      <h4>Available Hospitals ({selectedCell.data.hospitals.length})</h4>
                      <div className="scm-hospital-list">
                        {selectedCell.data.hospitals.map(hospital => (
                          <div key={hospital.id} className="scm-hospital-item">
                            <div className="scm-hospital-name">{hospital.name}</div>
                            <div className="scm-hospital-type">{hospital.type}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCell.data.count === 0 && (
                    <div className="scm-detail-section">
                      <h4>Gap Analysis</h4>
                      <div className="scm-gap-info">
                        <WarningOutlined style={{ color: '#dc2626', marginRight: '8px' }} />
                        <span>No hospitals offer {selectedCell.specialty} in this city.</span>
                      </div>
                      <div className="scm-gap-recommendation">
                        <h5>Recommendations:</h5>
                        <ul>
                          <li>Consider establishing {selectedCell.specialty} services</li>
                          <li>Partner with nearby cities offering this specialty</li>
                          <li>Evaluate patient demand in the region</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          )}
        </Row>

        {/* Bottom Summary Charts */}
        <Row gutter={24} style={{ marginTop: '24px' }}>
          <Col span={8}>
            <Card className="scm-chart-container">
              <div className="scm-chart-header">
                <BankOutlined style={{ fontSize: '18px', color: '#2563eb' }} />
                <span className="scm-chart-title">Top Cities by Coverage</span>
              </div>
              <div className="scm-chart-content">
                <div className="scm-ranking-list">
                  {filteredData.cities.slice(0, 10).map((city, index) => (
                    <div key={city.key} className="scm-ranking-item">
                      <div className="scm-rank-number">#{index + 1}</div>
                      <div className="scm-rank-details">
                        <div className="scm-rank-name">{city.name}, {city.state}</div>
                        <div className="scm-rank-stats">
                          {city.totalSpecialties} specialties
                        </div>
                      </div>
                      <div className="scm-rank-score">
                        <Progress
                          percent={city.coverageScore}
                          size="small"
                          strokeColor={city.coverageScore > 70 ? '#16a34a' : city.coverageScore > 40 ? '#d97706' : '#dc2626'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Card className="scm-chart-container">
              <div className="scm-chart-header">
                <MedicineBoxOutlined style={{ fontSize: '18px', color: '#2563eb' }} />
                <span className="scm-chart-title">Specialty Availability</span>
              </div>
              <div className="scm-chart-content">
                <div className="scm-specialty-list">
                  {filteredData.uniqueSpecialties
                    .sort((a, b) => b.availability - a.availability)
                    .slice(0, 10)
                    .map(specialty => (
                      <div key={specialty.name} className="scm-specialty-item">
                        <div className="scm-specialty-info">
                          <div className="scm-specialty-name">{specialty.name}</div>
                          <div className="scm-specialty-category">
                            <Tag color="blue">{specialty.category}</Tag>
                          </div>
                        </div>
                        <div className="scm-specialty-progress">
                          <Progress
                            percent={specialty.availability}
                            size="small"
                            format={() => `${specialty.totalCities} cities`}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          </Col>

          <Col span={8}>
            <Card className="scm-chart-container">
              <div className="scm-chart-header">
                <UserOutlined style={{ fontSize: '18px', color: '#2563eb' }} />
                <span className="scm-chart-title">Regional Distribution</span>
              </div>
              <div className="scm-chart-content">
                <div className="scm-regional-stats">
                  {Object.entries(
                    filteredData.cities.reduce((acc, city) => {
                      acc[city.state] = (acc[city.state] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([state, count]) => (
                    <div key={state} className="scm-regional-item">
                      <div className="scm-regional-name">{state}</div>
                      <div className="scm-regional-count">{count} cities</div>
                      <div className="scm-regional-bar">
                        <div 
                          className="scm-regional-fill"
                          style={{ 
                            width: `${(count / Math.max(...Object.values(filteredData.cities.reduce((acc, city) => {
                              acc[city.state] = (acc[city.state] || 0) + 1;
                              return acc;
                            }, {})))) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default SpecialtyCoverageMatrix;
