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
  Tag
} from 'antd';
import {
  EnvironmentOutlined,
  CarOutlined,
  TeamOutlined,
  HomeOutlined,
  StarOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Circle, Popup } from 'react-leaflet';
import L from 'leaflet';
import { fetchHospitalAddresses } from '../../../services/locationService';
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

// Hospital Map Component
const LocationMap = ({ hospital }) => {
  const [coordinates, setCoordinates] = useState(null);

  useEffect(() => {
    const getCoords = async () => {
      if (hospital) {
        const coords = await getCoordinatesFromAddress(hospital);
        setCoordinates(coords);
      }
    };
    getCoords();
  }, [hospital]);

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
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="© OpenStreetMap contributors"
        />
        
        <Marker position={coordinates}>
          <Popup>
            <div className="map-popup">
              <Text strong>Hospital {hospital.hospital_id}</Text><br/>
              <Text type="secondary">{hospital.street.replace(/\n/g, ', ')}</Text><br/>
              <Text type="secondary">{hospital.city_town}, {hospital.state}</Text><br/>
              <Badge status="processing" text={hospital.nearest_landmark} />
            </div>
          </Popup>
        </Marker>
        
        <Circle center={coordinates} radius={5000} color="#1890ff" opacity={0.3} fillOpacity={0.1} />
        <Circle center={coordinates} radius={10000} color="#52c41a" opacity={0.2} fillOpacity={0.05} />
      </MapContainer>
    </div>
  );
};

// Main Dashboard Component
const HospitalLocationDashboard = () => {
  const [addresses, setAddresses] = useState([]);
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
      } catch (err) {
        setError(`Failed to load hospital data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedHospitalId]);

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

  // Get hospital options for selector
  const hospitalOptions = useMemo(() => {
    const uniqueHospitals = addresses
      .filter(addr => addr.address_type === 'Primary')
      .map(addr => ({
        value: addr.hospital_id,
        label: `Hospital ${addr.hospital_id} - ${addr.city_town}, ${addr.state}`,
        city: addr.city_town,
        state: addr.state
      }))
      .sort((a, b) => a.value - b.value);
    
    return uniqueHospitals;
  }, [addresses]);

  const hasBlillingAddress = useMemo(() => {
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
        <div className="header-left">
          <Title level={1}>Hospital Location Analysis</Title>
          <div className="subtitle-wrapper">
            <Text type="secondary">Analyze location accessibility and catchment area for selected hospital.</Text>
          </div>
        </div>
        
        <div className="header-right">
          <div className="control-group">
            <Text className="control-label">Select Hospital:</Text>
            <Select
              value={selectedHospitalId}
              onChange={setSelectedHospitalId}
              className="hospital-selector"
              placeholder="Select Hospital"
              showSearch
              optionFilterProp="children"
            >
              {hospitalOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  <div className="hospital-option">
                    <div className="option-title">Hospital {option.value}</div>
                    <div className="option-subtitle">{option.city}, {option.state}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </div>
          
          {hasBlillingAddress && (
            <div className="control-group">
              <Text className="control-label">Address Type:</Text>
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
          {/* Main Score Card */}
          <div className="score-section">
            <Card className="accessibility-score-card">
              <div className="score-container">
                <div className="score-icon">
                  <StarOutlined />
                </div>
                <div className="score-content">
                  <div className="score-title">Accessibility Score</div>
                  <div className="score-display">
                    <span className="score-value" style={{ color: getScoreColor(scoreData.overallScore) }}>
                      70
                    </span>
                    <span className="score-suffix">/ 100</span>
                  </div>
                  <Progress 
                    percent={70} 
                    strokeColor={getScoreColor(70)}
                    trailColor="#f0f0f0"
                    strokeWidth={6}
                    showInfo={false}
                    className="score-progress"
                  />
                  <div className="score-status">
                    <Text type="secondary">{getScoreStatus(70)}</Text>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Content Grid */}
          <div className="location-grid">
            {/* Map Section */}
            <div className="map-section">
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
                    <Badge color="#1890ff" text="5km" />
                    <Badge color="#52c41a" text="10km" />
                  </Space>
                }
              >
                <LocationMap hospital={currentHospital} />
              </Card>
            </div>

            {/* Factors Section */}
            <div className="factors-section">
              <Card title="Location Factors Analysis" className="factors-card">
                <div className="factors-list">
                  {[
                    { key: 'publicTransport', label: 'Public Transport', icon: <CarOutlined />, color: '#1890ff', score: 7.5, weight: '25%' },
                    { key: 'roadConnectivity', label: 'Road Connectivity', icon: <GlobalOutlined />, color: '#52c41a', score: 8.0, weight: '20%' },
                    { key: 'populationDensity', label: 'Population Coverage', icon: <TeamOutlined />, color: '#722ed1', score: 6.0, weight: '25%' },
                    { key: 'competition', label: 'Competition Distance', icon: <HomeOutlined />, color: '#fa8c16', score: 6.5, weight: '15%' },
                    { key: 'infrastructure', label: 'Infrastructure', icon: <EnvironmentOutlined />, color: '#13c2c2', score: 7.0, weight: '15%' }
                  ].map((factor) => (
                    <div key={factor.key} className="factor-item">
                      <div className="factor-header">
                        <div className="factor-icon" style={{ color: factor.color }}>
                          {factor.icon}
                        </div>
                        <div className="factor-info">
                          <div className="factor-name">{factor.label}</div>
                          <div className="factor-meta">
                            <Tag size="small" color={factor.color}>{factor.weight}</Tag>
                            <span className="factor-score-text">{factor.score}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="factor-progress">
                        <Progress 
                          percent={factor.score * 10} 
                          size="small"
                          strokeColor={factor.color}
                          trailColor="#f0f0f0"
                          showInfo={false}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* Details Section */}
            <div className="details-section">
              <Card 
                title="Hospital Location Details" 
                className="details-card"
                extra={<Badge status="success" text="Active" />}
              >
                <div className="details-grid">
                  <Descriptions 
                    layout="vertical"
                    column={{ xs: 1, sm: 2, md: 3, lg: 4 }}
                    className="details-descriptions"
                  >
                    <Descriptions.Item label="Hospital ID">
                      <Text strong>Hospital {currentHospital.hospital_id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Address Type">
                      <Tag color="blue">{currentHospital.address_type}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="PIN Code">
                      <Text code>{currentHospital.pin_code}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="City">
                      {currentHospital.city_town}
                    </Descriptions.Item>
                  </Descriptions>

                  <Descriptions 
                    layout="vertical"
                    column={{ xs: 1, sm: 1, md: 2 }}
                    className="details-descriptions"
                  >
                    <Descriptions.Item label="Street Address">
                      {currentHospital.street.replace(/\n/g, ', ')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Area/Locality">
                      {currentHospital.area_locality}
                    </Descriptions.Item>
                  </Descriptions>

                  <Descriptions 
                    layout="vertical"
                    column={{ xs: 1, sm: 2, md: 3 }}
                    className="details-descriptions"
                  >
                    <Descriptions.Item label="District">
                      {currentHospital.district}
                    </Descriptions.Item>
                    <Descriptions.Item label="State">
                      {currentHospital.state}
                    </Descriptions.Item>
                    <Descriptions.Item label="Landmark">
                      <Badge status="processing" text={currentHospital.nearest_landmark} />
                    </Descriptions.Item>
                  </Descriptions>
                </div>
                
                {billingAddress && (
                  <div className="billing-section">
                    <Title level={5}>Billing Address</Title>
                    <Descriptions 
                      layout="vertical"
                      column={{ xs: 1, sm: 2 }}
                      className="details-descriptions"
                    >
                      <Descriptions.Item label="Billing Street">
                        {billingAddress.street.replace(/\n/g, ', ')}
                      </Descriptions.Item>
                      <Descriptions.Item label="Billing Area">
                        {billingAddress.area_locality}
                      </Descriptions.Item>
                    </Descriptions>
                  </div>
                )}
              </Card>
            </div>
          </div>
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
