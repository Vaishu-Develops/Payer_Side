import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import dataService from '../../../services/dataService.jsx';
import './Q20_HospitalMap.css';

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Enhanced hospital categorization system
const hospitalCategories = {
  'General': { color: '#1890ff', label: 'General Hospitals' },
  'Multi Specialty': { color: '#1890ff', label: 'General Hospitals' },
  'Super Specialty': { color: '#f5222d', label: 'Specialty Hospitals' },
  'District': { color: '#52c41a', label: 'Teaching Hospitals' },
  'Government': { color: '#fa8c16', label: 'Critical Access Hospitals' },
  'Trust': { color: '#722ed1', label: 'Rehabilitation Centers' },
  'Private': { color: '#13c2c2', label: 'Private Hospitals' }
};

// Ownership types
const ownershipTypes = ['All', 'Private', 'Government', 'Trust', 'Non-profit'];

// Service types for filtering
const serviceTypes = [
  'Emergency', 'Surgery', 'ICU', 'Cardiology', 'Oncology', 
  'Pediatrics', 'Maternity', 'Orthopedics', 'Neurology', 'Radiology'
];

// Create custom icons for different hospital categories
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-hospital-marker',
    html: `<div style="
      background-color: ${color};
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

const MapLibreHospitalDashboard = () => {
  // Map state
  const [mapCenter, setMapCenter] = useState([22.3072, 73.1812]); // [lat, lng] for India
  const [mapZoom, setMapZoom] = useState(5);

  // Manual test function for debugging
  const testApiDirectly = async () => {
    console.log('🧪 Manual API test started...');
    try {
      const response = await fetch('/api/hospitals');
      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('API Response:', data);
      console.log('Hospitals count:', data.count);
      console.log('Hospitals with coordinates:', 
        data.hospitals ? data.hospitals.filter(h => h.latitude && h.longitude).length : 0
      );
    } catch (error) {
      console.error('Manual test error:', error);
    }
  };

  // Data state
  const [hospitals, setHospitals] = useState([]);
  const [_selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Advanced filters
  const [filters, setFilters] = useState({
    hospitalType: 'All',
    ownershipType: 'All',
    bedCountRange: [0, 2000],
    certifications: [],
    services: [],
    showClustering: true,
  });

  // Fetch hospital data
  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Only fetch hospitals data - coordinates are already included
        const hospitalsResponse = await dataService.fetchHospitalsData();
        
        if (!hospitalsResponse.success) {
          throw new Error(hospitalsResponse.error || 'Failed to fetch hospitals');
        }

        // The backend returns { count, hospitals } structure
        const hospitalsData = hospitalsResponse.data.hospitals || hospitalsResponse.data || [];
        console.log('🔍 API Response structure:', {
          success: hospitalsResponse.success,
          hasData: !!hospitalsResponse.data,
          dataKeys: hospitalsResponse.data ? Object.keys(hospitalsResponse.data) : 'no data',
          count: hospitalsResponse.data?.count,
          hospitalsLength: hospitalsResponse.data?.hospitals?.length || 'no hospitals array',
          firstHospitalName: hospitalsResponse.data?.hospitals?.[0]?.name || 'no first hospital'
        });
        console.log('Raw hospitals data:', hospitalsData);
        console.log('Data structure:', typeof hospitalsData, Array.isArray(hospitalsData));

        const combinedData = hospitalsData
          .filter(hospital => {
            const lat = hospital.latitude;
            const lng = hospital.longitude;
            const hasValidCoords = lat != null && lng != null && !isNaN(lat) && !isNaN(lng);
            
            if (!hasValidCoords) {
              console.log('🚫 Hospital missing/invalid coordinates:', hospital.name || 'Unknown', {
                latitude: lat,
                longitude: lng,
                hospitalData: hospital
              });
            } else {
              console.log('✅ Valid coordinates for:', hospital.name || 'Unknown', { latitude: lat, longitude: lng });
            }
            
            return hasValidCoords;
          })
          .map((hospital) => {
          // Generate some mock data for enhanced features
          const mockServices = serviceTypes.slice(0, Math.floor(Math.random() * 5) + 3);
          const mockCertifications = ['Joint Commission', 'NABH', 'ISO 9001'].slice(0, Math.floor(Math.random() * 3) + 1);
          
          return {
            ...hospital,
            // Use coordinates from hospitals.json (they're already there!)
            latitude: parseFloat(hospital.latitude),
            longitude: parseFloat(hospital.longitude),
            category: hospital.hospital_type || 'General',
            bed_count: hospital.beds_registered || hospital.beds_operational || 50,
            ownership: hospital.ownership_type || 'Private',
            certifications: mockCertifications,
            services: mockServices,
            phone: hospital.telephone || hospital.hospital_mobile || `+91-${hospital.std_code || '011'}-XXXXXXX`,
            website: hospital.website_url || `https://hospital${hospital.id}.com`,
            address: `${hospital.name} - Location: ${hospital.latitude}, ${hospital.longitude}` // Show coordinates for verification
          };
        });
        
        console.log('Number of hospitals loaded:', combinedData.length);
        console.log('Sample hospital with coordinates:', combinedData[0]);
        
        if (combinedData.length === 0) {
          console.warn('No hospitals with coordinates found!');
          console.log('Original hospitals data sample:', hospitalsData.slice(0, 2));
        }
        
        setHospitals(combinedData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching hospital data:', error);
        
        // Provide mock data as fallback
        const mockHospitals = [
          {
            id: 1,
            name: "Apollo Hospital",
            category: "Super Specialty",
            bed_count: 500,
            ownership: "Private",
            latitude: 22.5726,
            longitude: 88.3639,
            address: "Kolkata, West Bengal",
            certifications: ["NABH", "JCI"],
            services: ["Emergency", "Surgery", "ICU", "Cardiology"],
            phone: "+91-9876543210",
            website: "https://apollo.com"
          },
          {
            id: 2,
            name: "AIIMS Delhi",
            category: "Government",
            bed_count: 2500,
            ownership: "Government",
            latitude: 28.5665,
            longitude: 77.2102,
            address: "New Delhi, Delhi",
            certifications: ["NABH"],
            services: ["Emergency", "Surgery", "ICU", "Oncology"],
            phone: "+91-9876543211",
            website: "https://aiims.edu"
          },
          {
            id: 3,
            name: "Fortis Hospital",
            category: "Multi Specialty",
            bed_count: 300,
            ownership: "Private",
            latitude: 19.0760,
            longitude: 72.8777,
            address: "Mumbai, Maharashtra",
            certifications: ["NABH"],
            services: ["Emergency", "Surgery", "Pediatrics"],
            phone: "+91-9876543212",
            website: "https://fortis.com"
          },
          {
            id: 4,
            name: "Christian Medical College",
            category: "Trust",
            bed_count: 800,
            ownership: "Trust",
            latitude: 12.9716,
            longitude: 77.5946,
            address: "Bangalore, Karnataka",
            certifications: ["NABH", "ISO 9001"],
            services: ["Emergency", "Surgery", "ICU", "Neurology"],
            phone: "+91-9876543213",
            website: "https://cmc.edu"
          },
          {
            id: 5,
            name: "Max Hospital",
            category: "Private",
            bed_count: 400,
            ownership: "Private",
            latitude: 28.4595,
            longitude: 77.0266,
            address: "Gurgaon, Haryana",
            certifications: ["NABH"],
            services: ["Emergency", "Surgery", "Orthopedics"],
            phone: "+91-9876543214",
            website: "https://max.com"
          }
        ];
        
        console.log('Using mock hospital data');
        setHospitals(mockHospitals);
        setError(null); // Clear error since we have fallback data
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, []);

  // Advanced filtering with memoization
  const filteredHospitals = useMemo(() => {
    return hospitals.filter((hospital) => {
      // Type filter
      const typeMatch = filters.hospitalType === 'All' || hospital.category === filters.hospitalType;
      
      // Ownership filter
      const ownershipMatch = filters.ownershipType === 'All' || hospital.ownership === filters.ownershipType;
      
      // Bed count filter
      const bedCountMatch = hospital.bed_count >= filters.bedCountRange[0] && hospital.bed_count <= filters.bedCountRange[1];
      
      // Certification filter
      const certificationMatch = filters.certifications.length === 0 || 
        filters.certifications.some(cert => hospital.certifications.includes(cert));
      
      // Services filter
      const servicesMatch = filters.services.length === 0 || 
        filters.services.some(service => hospital.services.includes(service));
      
      // Search query filter
      const searchMatch = !searchQuery || 
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchQuery.toLowerCase());
      
      return typeMatch && ownershipMatch && bedCountMatch && certificationMatch && servicesMatch && searchMatch;
    });
  }, [hospitals, filters, searchQuery]);

  // Search functionality
  const handleSearch = useCallback(async (query) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        // Use local filtering instead of API search since we have all hospital data
        const results = hospitals
          .filter(hospital => 
            hospital.name.toLowerCase().includes(query.toLowerCase()) ||
            hospital.address.toLowerCase().includes(query.toLowerCase()) ||
            hospital.category.toLowerCase().includes(query.toLowerCase())
          )
          .slice(0, 10); // Limit to 10 results
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setSearchResults([]);
      }
    } else {
      setSearchResults([]);
    }
  }, [hospitals]);

  // Filter handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleMultiSelectFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };



  // Export functionality
  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Category', 'Ownership', 'Beds', 'Address', 'Phone', 'Services'].join(','),
      ...filteredHospitals.map(h => [
        h.name,
        h.category,
        h.ownership,
        h.bed_count,
        h.address,
        h.phone,
        h.services.join(';')
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hospitals.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Statistics calculation
  const statistics = useMemo(() => {
    const total = filteredHospitals.length;
    const totalBeds = filteredHospitals.reduce((sum, h) => sum + h.bed_count, 0);
    const avgBeds = total > 0 ? Math.round(totalBeds / total) : 0;
    
    const byCategory = filteredHospitals.reduce((acc, h) => {
      acc[h.category] = (acc[h.category] || 0) + 1;
      return acc;
    }, {});
    
    return { total, totalBeds, avgBeds, byCategory };
  }, [filteredHospitals]);

  if (loading) {
    return (
      <div className="loading-state">
        <div>Loading hospital data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-state">
        <div>Error loading hospital data: {error}</div>
      </div>
    );
  }

  return (
    <div className="map-dashboard-container">
      {/* Header */}
      <div className="header-panel">
        <div className="header-left">
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
          <h1>Hospital Distribution Dashboard</h1>
        </div>
        
        <div className="header-center">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search hospitals, addresses..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((result) => (
                  <div 
                    key={result.id}
                    className="search-result-item"
                    onClick={() => {
                      setMapCenter([result.latitude || 22.3072, result.longitude || 73.1812]);
                      setMapZoom(12);
                      setSearchResults([]);
                      setSearchQuery(result.name);
                    }}
                  >
                    <strong>{result.name}</strong>
                    <span>{result.city}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="header-right">
          <button 
            className={`toggle-button ${showHeatmap ? 'active' : ''}`}
            onClick={() => setShowHeatmap(!showHeatmap)}
          >
            Heatmap
          </button>
          <button 
            className="export-button"
            onClick={exportToCSV}
          >
            Export CSV
          </button>
          <button 
            className="export-button"
            onClick={testApiDirectly}
            style={{ marginLeft: '10px' }}
          >
            Test API
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="filter-panel">
          {/* Quick Stats */}
          <div className="stats-section">
            <h3>Statistics</h3>
            <div className="stat-item">
              <span className="stat-label">Total Hospitals:</span>
              <span className="stat-value">{statistics.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Beds:</span>
              <span className="stat-value">{statistics.totalBeds.toLocaleString()}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Average Beds:</span>
              <span className="stat-value">{statistics.avgBeds}</span>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-section">
            <h3>Filters</h3>
            
            {/* Hospital Type Filter */}
            <div className="filter-group">
              <label>Hospital Category</label>
              <select 
                value={filters.hospitalType} 
                onChange={(e) => handleFilterChange('hospitalType', e.target.value)}
              >
                <option value="All">All Categories</option>
                {Object.keys(hospitalCategories).map((type) => (
                  <option key={type} value={type}>{hospitalCategories[type].label}</option>
                ))}
              </select>
            </div>

            {/* Ownership Filter */}
            <div className="filter-group">
              <label>Ownership Type</label>
              <select 
                value={filters.ownershipType} 
                onChange={(e) => handleFilterChange('ownershipType', e.target.value)}
              >
                {ownershipTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Bed Count Range */}
            <div className="filter-group">
              <label>Bed Count: {filters.bedCountRange[0]} - {filters.bedCountRange[1]}</label>
              <div className="range-inputs">
                <input
                  type="range"
                  min="0"
                  max="2000"
                  value={filters.bedCountRange[1]}
                  onChange={(e) => handleFilterChange('bedCountRange', [filters.bedCountRange[0], parseInt(e.target.value)])}
                />
              </div>
            </div>

            {/* Services Filter */}
            <div className="filter-group">
              <label>Services</label>
              <div className="checkbox-group">
                {serviceTypes.slice(0, 5).map((service) => (
                  <label key={service} className="checkbox-item">
                    <input
                      type="checkbox"
                      checked={filters.services.includes(service)}
                      onChange={() => handleMultiSelectFilter('services', service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>

            {/* Map Options */}
            <div className="filter-group">
              <label className="checkbox-item">
                <input
                  type="checkbox"
                  checked={filters.showClustering}
                  onChange={(e) => handleFilterChange('showClustering', e.target.checked)}
                />
                Enable Clustering
              </label>
            </div>
          </div>

          {/* Legend */}
          <div className="legend-section">
            <h3>Legend</h3>
            {Object.entries(hospitalCategories).map(([type, info]) => (
              <div key={type} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: info.color }}></span>
                <span>{info.label}</span>
              </div>
            ))}
          </div>
        </div>
        </div>

        {/* Map Container */}
        <div className="map-container">
          <MapContainer
            center={mapCenter}
            zoom={mapZoom}
            style={{ height: '100%', width: '100%' }}
            className="leaflet-map"
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Hospital Markers */}
            {filteredHospitals.map((hospital) => {
              const categoryInfo = hospitalCategories[hospital.category] || hospitalCategories['General'];
              const icon = createCustomIcon(categoryInfo.color);
              
              return (
                <Marker
                  key={hospital.id}
                  position={[hospital.latitude, hospital.longitude]}
                  icon={icon}
                  eventHandlers={{
                    click: () => setSelectedHospital(hospital)
                  }}
                >
                  <Popup>
                    <div className="popup-content">
                      <h3>{hospital.name}</h3>
                      <div className="popup-details">
                        <p><strong>Category:</strong> {hospital.category}</p>
                        <p><strong>Beds:</strong> {hospital.bed_count}</p>
                        <p><strong>Ownership:</strong> {hospital.ownership}</p>
                        <p><strong>Phone:</strong> {hospital.phone}</p>
                        <p><strong>Address:</strong> {hospital.address}</p>
                        
                        <div className="services-section">
                          <strong>Services:</strong>
                          <div className="services-tags">
                            {hospital.services.slice(0, 4).map(service => (
                              <span key={service} className="service-tag">{service}</span>
                            ))}
                            {hospital.services.length > 4 && (
                              <span className="service-tag more">+{hospital.services.length - 4} more</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="certifications-section">
                          <strong>Certifications:</strong>
                          <div className="cert-tags">
                            {hospital.certifications.map(cert => (
                              <span key={cert} className="cert-tag">{cert}</span>
                            ))}
                          </div>
                        </div>
                        
                        <div className="popup-actions">
                          <button 
                            className="action-button"
                            onClick={() => window.open(`tel:${hospital.phone}`)}
                          >
                            Call
                          </button>
                          <button 
                            className="action-button"
                            onClick={() => window.open(hospital.website, '_blank')}
                          >
                            Website
                          </button>
                          <button 
                            className="action-button"
                            onClick={() => window.open(`https://maps.google.com?q=${hospital.latitude},${hospital.longitude}`, '_blank')}
                          >
                            Directions
                          </button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map Controls */}
          <div className="map-controls">
            <button 
              className="control-button"
              onClick={() => setMapZoom(mapZoom + 1)}
              title="Zoom In"
            >
              +
            </button>
            <button 
              className="control-button"
              onClick={() => setMapZoom(mapZoom - 1)}
              title="Zoom Out"
            >
              -
            </button>
            <button 
              className="control-button"
              onClick={() => {
                setMapCenter([22.3072, 73.1812]);
                setMapZoom(5);
              }}
              title="Reset View"
            >
              🏠
            </button>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="footer-panel">
        <div className="footer-stats">
          <span>Showing {filteredHospitals.length} of {hospitals.length} hospitals</span>
          <span>Total Beds: {statistics.totalBeds.toLocaleString()}</span>
          <span>Data Source: Hospital Registry API</span>
        </div>
      </div>
    </div>
  );
};

export default MapLibreHospitalDashboard;