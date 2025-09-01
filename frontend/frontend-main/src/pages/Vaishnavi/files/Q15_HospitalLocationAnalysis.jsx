import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Select,
  Radio,
  Statistic,
  Progress,
  Descriptions,
  Badge,
  Space,
  Spin,
  Alert,
  Typography,
  Tag,
  Row,
  Col,
  Divider
} from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  TeamOutlined,
  HomeOutlined,
  StarOutlined,
  GlobalOutlined,
  DashboardOutlined,
  SafetyOutlined,
  BankOutlined
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchHospitalAddresses } from '../../../services/locationService';
import { getHospitalNameById } from '../../../services/hospitalService';
import { calculateLocationScore, getCoordinatesFromAddress } from '../../../utils/locationUtils';
import 'leaflet/dist/leaflet.css';
import './styles/Q15_HospitalLocationAnalysis.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Fix for default markers in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom hospital icon
const hospitalIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Hospital Map Component
const LocationMap = ({ hospital, hospitalName }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    const getCoords = async () => {
      if (hospital) {
        try {
          setMapError(null);
          const coords = await getCoordinatesFromAddress(hospital);
          if (coords && coords.lat && coords.lng) {
            setCoordinates(coords);
          } else {
            setMapError('Could not determine coordinates for this address');
          }
        } catch (error) {
          console.error('Map error:', error);
          setMapError('Failed to load map data');
        }
      }
    };
    getCoords();
  }, [hospital]);

  if (mapError) {
    return (
      <div className="map-error">
        <EnvironmentOutlined style={{ fontSize: '32px', color: '#ff4d4f', marginBottom: '16px' }} />
        <Text type="danger">{mapError}</Text>
        <Text type="secondary" style={{ display: 'block', marginTop: '8px' }}>
          Please check the address details for {hospitalName || `Hospital ${hospital.hospital_id}`}
        </Text>
      </div>
    );
  }

  if (!coordinates) {
    return (
      <div className="map-loading">
        <Spin size="large" />
        <Text type="secondary">Loading map...</Text>
      </div>
    );
  }

  return (
    <div className="map-container">
      <MapContainer 
        center={coordinates} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        className="hospital-map"
        zoomControl={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        
        <Marker position={coordinates} icon={hospitalIcon}>
          <Popup>
            <div className="map-popup">
              <Text strong>{hospitalName || `Hospital ${hospital.hospital_id}`}</Text><br/>
              <Text type="secondary">{hospital.street.replace(/\n/g, ', ')}</Text><br/>
              <Text type="secondary">{hospital.city_town}, {hospital.state}</Text><br/>
              <Badge status="processing" text={hospital.nearest_landmark} />
            </div>
          </Popup>
        </Marker>
        
        <Circle 
          center={coordinates} 
          radius={5000} 
          color="#1890ff" 
          opacity={0.3} 
          fillOpacity={0.1} 
        />
        <Circle 
          center={coordinates} 
          radius={10000} 
          color="#52c41a" 
          opacity={0.2} 
          fillOpacity={0.05} 
        />
      </MapContainer>
    </div>
  );
};

// Main Dashboard Component
const HospitalLocationDashboard = () => {
  const [addresses, setAddresses] = useState([]);
  const [hospitalNames, setHospitalNames] = useState({});
  const [selectedHospitalId, setSelectedHospitalId] = useState(135);
  const [addressType, setAddressType] = useState('Primary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchHospitalAddresses();
        setAddresses(data);
        
        const primaryHospitals = data.filter(addr => addr.address_type === 'Primary');
        if (primaryHospitals.length > 0 && !primaryHospitals.find(h => h.hospital_id === selectedHospitalId)) {
          setSelectedHospitalId(primaryHospitals[0].hospital_id);
        }

        // Fetch all hospital names at once
        const namesMap = {};
        const uniqueHospitalIds = [...new Set(primaryHospitals.map(addr => addr.hospital_id))];
        
        // Fetch hospital names in parallel
        const namePromises = uniqueHospitalIds.map(async (id) => {
          try {
            const name = await getHospitalNameById(id);
            return { id, name };
          } catch (error) {
            console.error(`Error fetching name for hospital ${id}:`, error);
            return { id, name: `Hospital ${id}` };
          }
        });
        
        // Wait for all name fetches to complete
        const results = await Promise.all(namePromises);
        
        // Build the names map
        results.forEach(result => {
          namesMap[result.id] = result.name;
        });
        
        setHospitalNames(namesMap);
      } catch (err) {
        setError(`Failed to load hospital data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
    // We only want this to run once on component mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get current hospital data
  const currentHospital = useMemo(() => {
    return addresses.find(addr => 
      addr.hospital_id === selectedHospitalId && addr.address_type === addressType
    );
  }, [addresses, selectedHospitalId, addressType]);

  const billingAddress = useMemo(() => {
    return addresses.find(addr => 
      addr.hospital_id === selectedHospitalId && addr.address_type === 'Billing'
    );
  }, [addresses, selectedHospitalId]);

  // Get hospital options for selector with proper names
  const hospitalOptions = useMemo(() => {
    const uniqueHospitals = addresses
      .filter(addr => addr.address_type === 'Primary')
      .map(addr => ({
        value: addr.hospital_id,
        label: hospitalNames[addr.hospital_id] || `Hospital ${addr.hospital_id}`,
        city: addr.city_town,
        state: addr.state
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by hospital name
    
    return uniqueHospitals;
  }, [addresses, hospitalNames]);

  const hasBillingAddress = useMemo(() => {
    return addresses.some(addr => 
      addr.hospital_id === selectedHospitalId && addr.address_type === 'Billing'
    );
  }, [addresses, selectedHospitalId]);

  // Calculate score data
  const scoreData = useMemo(() => {
    if (!currentHospital) return null;
    return calculateLocationScore(currentHospital);
  }, [currentHospital]);

  const getScoreColor = (score) => {
    if (score >= 85) return '#52c41a';
    if (score >= 70) return '#1890ff';
    if (score >= 60) return '#faad14';
    return '#ff4d4f';
  };

  const getScoreStatus = (score) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Average';
    return 'Needs Improvement';
  };

  if (loading) {
    return (
      <div className="location-dashboard-loading">
        <Spin size="large" />
        <Title level={4}>Loading Hospital Location Analysis...</Title>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Data"
        description={error}
        type="error"
        showIcon
        className="location-dashboard-error"
      />
    );
  }

  return (
    <div className="location-analysis-dashboard">
      {/* Header Section */}
      <div className="location-header">
        <div className="header-content">
          <div className="header-title-section">
            <DashboardOutlined className="header-icon" />
            <Title level={1} className="header-title">Hospital Location Analysis</Title>
          </div>
          <Text className="header-subtitle">
            Analyze location accessibility and catchment area for healthcare facilities
          </Text>
        </div>
        
        <div className="header-controls">
          <div className="control-group">
            <Text className="control-label">Select Hospital</Text>
            <Select
              value={selectedHospitalId}
              onChange={setSelectedHospitalId}
              className="hospital-selector"
              placeholder="Select Hospital"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.props.children[0].props.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {hospitalOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="hospital-option">
                    <div className="option-title">{option.label}</div>
                    <div className="option-subtitle">{option.city}, {option.state}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          {hasBillingAddress && (
            <div className="control-group">
              <Text className="control-label">Address Type</Text>
              <Radio.Group 
                value={addressType} 
                onChange={(e) => setAddressType(e.target.value)}
                buttonStyle="solid"
                className="address-type-selector"
              >
                <Radio.Button value="Primary">Primary</Radio.Button>
                <Radio.Button value="Billing">Billing</Radio.Button>
              </Radio.Group>
            </div>
          )}
        </div>
      </div>

      {currentHospital && scoreData ? (
        <div className="location-content">
          {/* Score and Overview Section */}
          <Row gutter={[24, 24]} className="overview-section">
            <Col xs={24} md={8}>
              <Card className="score-card">
                <div className="score-header">
                  <StarOutlined className="score-icon" />
                  <Text className="score-label">Accessibility Score</Text>
                </div>
                <div className="score-display">
                  <span className="score-value" style={{ color: getScoreColor(scoreData.overallScore) }}>
                    {scoreData.overallScore}
                  </span>
                  <span className="score-suffix">/ 100</span>
                </div>
                <Progress 
                  percent={scoreData.overallScore} 
                  strokeColor={getScoreColor(scoreData.overallScore)}
                  trailColor="#f0f0f0"
                  strokeWidth={8}
                  showInfo={false}
                  className="score-progress"
                />
                <div className="score-status">
                  <Tag color={getScoreColor(scoreData.overallScore)} className="status-tag">
                    {getScoreStatus(scoreData.overallScore)}
                  </Tag>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} md={16}>
              <Card className="factors-card">
                <Title level={4} className="factors-title">Location Factors</Title>
                <Row gutter={[16, 16]}>
                  {[
                    { key: 'publicTransport', label: 'Public Transport', icon: <CarOutlined />, color: '#1890ff', score: 7.5 },
                    { key: 'roadConnectivity', label: 'Road Connectivity', icon: <GlobalOutlined />, color: '#52c41a', score: 8.0 },
                    { key: 'populationDensity', label: 'Population Coverage', icon: <TeamOutlined />, color: '#722ed1', score: 6.0 },
                    { key: 'competition', label: 'Competition Distance', icon: <HomeOutlined />, color: '#fa8c16', score: 6.5 },
                    { key: 'infrastructure', label: 'Infrastructure', icon: <EnvironmentOutlined />, color: '#13c2c2', score: 7.0 },
                    { key: 'safety', label: 'Safety', icon: <SafetyOutlined />, color: '#eb2f96', score: 8.5 }
                  ].map((factor) => (
                    <Col xs={12} sm={8} key={factor.key}>
                      <div className="factor-item">
                        <div className="factor-icon" style={{ color: factor.color }}>
                          {factor.icon}
                        </div>
                        <div className="factor-content">
                          <Text className="factor-name">{factor.label}</Text>
                          <Text className="factor-score">{factor.score}/10</Text>
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
          </Row>

          {/* Map and Details Section */}
          <Row gutter={[24, 24]} className="main-content-section">
            <Col xs={24} lg={16}>
              <Card 
                title={
                  <Space>
                    <EnvironmentOutlined />
                    <span>Location Map & Catchment Area</span>
                  </Space>
                }
                className="map-card"
                extra={
                  <Space>
                    <Badge color="#1890ff" text="5km Radius" />
                    <Badge color="#52c41a" text="10km Radius" />
                  </Space>
                }
              >
                <LocationMap 
                  hospital={currentHospital} 
                  hospitalName={hospitalNames[selectedHospitalId]}
                />
              </Card>
            </Col>
            
            <Col xs={24} lg={8}>
              <Card 
                title="Location Details" 
                className="details-card"
                extra={<Badge status="success" text="Active" />}
              >
                <div className="details-content">
                  <Descriptions column={1} size="small" className="details-list">
                    <Descriptions.Item label="Hospital Name">
                      <Text strong>{hospitalNames[selectedHospitalId] || `Hospital ${currentHospital.hospital_id}`}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address Type">
                      <Tag color="blue">{currentHospital.address_type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="PIN Code">
                      <Text code>{currentHospital.pin_code}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="City/Town">
                      {currentHospital.city_town}
                    </Descriptions.Item>
                    <Descriptions.Item label="State">
                      {currentHospital.state}
                    </Descriptions.Item>
                    <Descriptions.Item label="District">
                      {currentHospital.district}
                    </Descriptions.Item>
                  </Descriptions>

                  <Divider className="details-divider" />
                  
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label="Street Address">
                      {currentHospital.street.replace(/\n/g, ', ')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Area/Locality">
                      {currentHospital.area_locality}
                    </Descriptions.Item>
                    <Descriptions.Item label="Nearest Landmark">
                      <Badge status="processing" text={currentHospital.nearest_landmark} />
                    </Descriptions.Item>
                  </Descriptions>

                  {billingAddress && (
                    <>
                      <Divider className="details-divider" />
                      <div className="billing-section">
                        <Title level={5} className="billing-title">
                          <BankOutlined /> Billing Address
                        </Title>
                        <Descriptions column={1} size="small">
                          <Descriptions.Item label="Billing Street">
                            {billingAddress.street.replace(/\n/g, ', ')}
                          </Descriptions.Item>
                          <Descriptions.Item label="Billing Area">
                            {billingAddress.area_locality}
                          </Descriptions.Item>
                        </Descriptions>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      ) : (
        <Alert
          message="No Hospital Data Found"
          description={`No ${addressType.toLowerCase()} address found for Hospital ${selectedHospitalId}`}
          type="warning"
          showIcon
          className="no-data-alert"
        />
      )}
    </div>
  );
};

export default HospitalLocationDashboard;