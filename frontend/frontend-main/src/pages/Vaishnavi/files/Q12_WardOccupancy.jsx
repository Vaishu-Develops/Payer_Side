/**
 * Q12 Ward Occupancy Analysis Component
 * 
 * Provides comprehensive ward-level insights for insurance payers including:
 * - Ward capacity and utilization monitoring
 * - Occupancy rate tracking with color-coded indicators
 * - Daily revenue calculation and optimization analysis
 * - Advanced filtering and sorting capabilities
 * - Gender-specific and category-based ward classification
 * 
 * Features:
 * - Hospital selector with search functionality
 * - Real-time occupancy calculations and visualization
 * - Revenue efficiency tracking
 * - Responsive card-based layout
 * - Interactive sorting and filtering
 * - Comprehensive summary statistics
 * 
 * Data Source: wards_rooms.json via /hospitals/{id}/wards API endpoint
 * Business Value: Enables capacity planning, pricing negotiations, and network analysis
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, 
  Select, 
  Row, 
  Col, 
  Progress, 
  Badge, 
  Typography, 
  Space, 
  Empty,
  Spin,
  Alert,
  Tag,
  Tooltip
} from 'antd';
import { 
  HomeOutlined, 
  DollarOutlined, 
  TeamOutlined
} from '@ant-design/icons';
import { useWardData } from '../../../hooks/useWardData';
import './styles/Q12_WardOccupancy.css';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const Q12_WardOccupancy = () => {
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [sortBy, setSortBy] = useState('occupancy_desc');
  const [filterBy, setFilterBy] = useState('all');

  const {
    hospitals,
    wardData,
    wardStats,
    isLoading,
    error,
    fetchWardsByHospital
  } = useWardData();

  // Fetch wards when hospital is selected
  useEffect(() => {
    if (selectedHospitalId) {
      fetchWardsByHospital(selectedHospitalId);
    }
  }, [selectedHospitalId, fetchWardsByHospital]);

  // Process and sort ward data
  const processedWards = useMemo(() => {
    if (!wardData || !Array.isArray(wardData) || wardData.length === 0) return [];

    // Calculate occupancy metrics for each ward
    const wardsWithMetrics = wardData.map(ward => {
      const occupiedBeds = ward.total_beds - ward.available_beds;
      const occupancyRate = ward.total_beds > 0 ? (occupiedBeds / ward.total_beds) * 100 : 0;
      const dailyRevenue = occupiedBeds * (ward.daily_rate || 0);
      const potentialRevenue = ward.total_beds * (ward.daily_rate || 0);

      return {
        ...ward,
        occupiedBeds,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        dailyRevenue,
        potentialRevenue,
        revenueEfficiency: potentialRevenue > 0 ? (dailyRevenue / potentialRevenue) * 100 : 0
      };
    });

    // Apply filters
    let filteredWards = wardsWithMetrics;
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'critical':
          filteredWards = wardsWithMetrics.filter(ward => 
            ward.ward_type.toLowerCase().includes('icu') || 
            ward.ward_type.toLowerCase().includes('critical') ||
            ward.ward_type.toLowerCase().includes('nicu')
          );
          break;
        case 'general':
          filteredWards = wardsWithMetrics.filter(ward => 
            ward.ward_type.toLowerCase().includes('general')
          );
          break;
        case 'private':
          filteredWards = wardsWithMetrics.filter(ward => 
            ward.ward_type.toLowerCase().includes('private') ||
            ward.ward_type.toLowerCase().includes('deluxe')
          );
          break;
        case 'high_occupancy':
          filteredWards = wardsWithMetrics.filter(ward => ward.occupancyRate >= 80);
          break;
        case 'low_occupancy':
          filteredWards = wardsWithMetrics.filter(ward => ward.occupancyRate < 50);
          break;
        default:
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'occupancy_desc':
        return filteredWards.sort((a, b) => b.occupancyRate - a.occupancyRate);
      case 'occupancy_asc':
        return filteredWards.sort((a, b) => a.occupancyRate - b.occupancyRate);
      case 'price_desc':
        return filteredWards.sort((a, b) => (b.daily_rate || 0) - (a.daily_rate || 0));
      case 'price_asc':
        return filteredWards.sort((a, b) => (a.daily_rate || 0) - (b.daily_rate || 0));
      case 'beds_desc':
        return filteredWards.sort((a, b) => b.total_beds - a.total_beds);
      case 'beds_asc':
        return filteredWards.sort((a, b) => a.total_beds - b.total_beds);
      case 'revenue_desc':
        return filteredWards.sort((a, b) => b.dailyRevenue - a.dailyRevenue);
      default:
        return filteredWards;
    }
  }, [wardData, sortBy, filterBy]);

  const getOccupancyColor = (occupancyRate) => {
    if (occupancyRate >= 90) return '#ff4d4f';
    if (occupancyRate >= 70) return '#faad14';
    return '#52c41a';
  };

  const getOccupancyStatus = (occupancyRate) => {
    if (occupancyRate >= 90) return { text: 'Critical', color: 'red' };
    if (occupancyRate >= 70) return { text: 'High', color: 'orange' };
    if (occupancyRate >= 50) return { text: 'Moderate', color: 'blue' };
    return { text: 'Low', color: 'green' };
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatRevenue = (amount) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    }
    if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount}`;
  };

  if (error) {
    return (
      <div className="ward-occupancy-container">
        <Alert
          message="Error Loading Ward Data"
          description={error}
          type="error"
          showIcon
        />
      </div>
    );
  }

  return (
    <div className="ward-occupancy-container">
      {/* Header */}
      <div className="ward-occupancy-header">
        <Title level={2}>
          <HomeOutlined /> Ward Occupancy Analysis
        </Title>
        <Paragraph>
          Monitor ward utilization, capacity, and revenue optimization across hospital facilities
        </Paragraph>
      </div>

      {/* Hospital Selector */}
      <Card className="hospital-selector-card" size="small">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text strong>Select Hospital:</Text>
              <Select
                placeholder="Choose a hospital to view ward details"
                style={{ width: '100%' }}
                value={selectedHospitalId}
                onChange={setSelectedHospitalId}
                showSearch
                optionFilterProp="children"
                loading={isLoading}
              >
                {hospitals.map(hospital => (
                  <Option key={hospital.id} value={hospital.id}>
                    {hospital.name} - {hospital.city}
                  </Option>
                ))}
              </Select>
            </Space>
          </Col>

          {selectedHospitalId && (
            <>
              <Col xs={24} sm={12} md={6}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>Sort by:</Text>
                  <Select
                    value={sortBy}
                    onChange={setSortBy}
                    style={{ width: '100%' }}
                  >
                    <Option value="occupancy_desc">Occupancy % ↓</Option>
                    <Option value="occupancy_asc">Occupancy % ↑</Option>
                    <Option value="price_desc">Price ↓</Option>
                    <Option value="price_asc">Price ↑</Option>
                    <Option value="beds_desc">Bed Count ↓</Option>
                    <Option value="beds_asc">Bed Count ↑</Option>
                    <Option value="revenue_desc">Revenue ↓</Option>
                  </Select>
                </Space>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <Text strong>Filter:</Text>
                  <Select
                    value={filterBy}
                    onChange={setFilterBy}
                    style={{ width: '100%' }}
                  >
                    <Option value="all">All Wards</Option>
                    <Option value="critical">Critical Care</Option>
                    <Option value="general">General Wards</Option>
                    <Option value="private">Private Rooms</Option>
                    <Option value="high_occupancy">High Occupancy (≥80%)</Option>
                    <Option value="low_occupancy">Low Occupancy (&lt;50%)</Option>
                  </Select>
                </Space>
              </Col>
            </>
          )}
        </Row>
      </Card>

      {/* Summary Statistics */}
      {selectedHospitalId && wardStats && (
        <Card className="summary-stats-card">
          <Title level={4} style={{ textAlign: 'center', marginBottom: 24, color: '#1890ff' }}>
            Hospital Ward Overview
          </Title>
          <Row gutter={[24, 24]}>
            <Col xs={24} sm={12} lg={6}>
              <div className="kpi-card capacity-kpi">
                <div className="kpi-icon-container">
                  <HomeOutlined className="kpi-icon" />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{wardStats.totalBeds}</div>
                  <div className="kpi-label">Total Beds</div>
                  <div className="kpi-sublabel">Hospital Capacity</div>
                </div>
                <div className="kpi-indicator capacity-indicator"></div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="kpi-card occupancy-kpi">
                <div className="kpi-icon-container">
                  <TeamOutlined className="kpi-icon" />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value" style={{ color: getOccupancyColor(wardStats.overallOccupancy) }}>
                    {wardStats.overallOccupancy}%
                  </div>
                  <div className="kpi-label">Occupancy Rate</div>
                  <div className="kpi-sublabel">
                    {wardStats.totalOccupied} of {wardStats.totalBeds} occupied
                  </div>
                </div>
                <div className="kpi-indicator occupancy-indicator">
                  <div 
                    className="occupancy-fill" 
                    style={{ 
                      width: `${wardStats.overallOccupancy}%`,
                      backgroundColor: getOccupancyColor(wardStats.overallOccupancy)
                    }}
                  ></div>
                </div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="kpi-card revenue-kpi">
                <div className="kpi-icon-container">
                  <DollarOutlined className="kpi-icon" />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{formatRevenue(wardStats.totalDailyRevenue)}</div>
                  <div className="kpi-label">Daily Revenue</div>
                  <div className="kpi-sublabel">
                    Potential: {formatRevenue(wardStats.potentialRevenue)}
                  </div>
                </div>
                <div className="kpi-indicator revenue-indicator"></div>
              </div>
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <div className="kpi-card availability-kpi">
                <div className="kpi-icon-container">
                  <HomeOutlined className="kpi-icon" />
                </div>
                <div className="kpi-content">
                  <div className="kpi-value">{wardStats.totalAvailable}</div>
                  <div className="kpi-label">Available Beds</div>
                  <div className="kpi-sublabel">
                    {((wardStats.totalAvailable / wardStats.totalBeds) * 100).toFixed(1)}% free
                  </div>
                </div>
                <div className="kpi-indicator availability-indicator"></div>
              </div>
            </Col>
          </Row>
          
          {/* Additional Insights Row */}
          <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
            <Col xs={24} sm={8}>
              <div className="insight-card">
                <div className="insight-label">Ward Types</div>
                <div className="insight-value">{processedWards.length}</div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="insight-card">
                <div className="insight-label">Revenue Efficiency</div>
                <div className="insight-value">
                  {wardStats.potentialRevenue > 0 
                    ? ((wardStats.totalDailyRevenue / wardStats.potentialRevenue) * 100).toFixed(1) + '%'
                    : '0%'
                  }
                </div>
              </div>
            </Col>
            <Col xs={24} sm={8}>
              <div className="insight-card">
                <div className="insight-label">Avg. Rate/Bed</div>
                <div className="insight-value">
                  {wardStats.totalBeds > 0 
                    ? formatCurrency(wardStats.potentialRevenue / wardStats.totalBeds)
                    : '₹0'
                  }
                </div>
              </div>
            </Col>
          </Row>
        </Card>
      )}

      {/* Ward Cards */}
      {selectedHospitalId ? (
        isLoading ? (
          <div className="loading-container">
            <Spin size="large" />
            <Text style={{ marginTop: 16, display: 'block' }}>Loading ward data...</Text>
          </div>
        ) : processedWards.length > 0 ? (
          <Row gutter={[16, 16]} className="ward-cards-grid">
            {processedWards.map((ward) => {
              const occupancyStatus = getOccupancyStatus(ward.occupancyRate);
              
              return (
                <Col xs={24} sm={12} lg={8} xl={6} key={ward.id}>
                  <Card 
                    className="ward-card"
                    hoverable
                    data-ward-type={ward.ward_type}
                    title={
                      <Space>
                        <HomeOutlined />
                        {ward.ward_type}
                      </Space>
                    }
                    extra={
                      <Badge 
                        status={occupancyStatus.color === 'red' ? 'error' : 
                               occupancyStatus.color === 'orange' ? 'warning' : 'success'} 
                        text={occupancyStatus.text}
                      />
                    }
                  >
                    <div className="ward-card-content">
                      {/* Occupancy Progress */}
                      <div className="occupancy-section">
                        <Progress
                          percent={ward.occupancyRate}
                          strokeColor={getOccupancyColor(ward.occupancyRate)}
                          format={(percent) => `${percent}%`}
                          className="occupancy-progress"
                        />
                        <Text className="occupancy-text">
                          {ward.occupiedBeds}/{ward.total_beds} beds occupied
                        </Text>
                      </div>

                      {/* Key Metrics */}
                      <Row gutter={[8, 8]} className="ward-metrics">
                        <Col span={12}>
                          <div className="metric-item">
                            <Text type="secondary">Available</Text>
                            <Text strong className="metric-value">
                              {ward.available_beds}
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="metric-item">
                            <Text type="secondary">Daily Rate</Text>
                            <Text strong className="metric-value">
                              {formatCurrency(ward.daily_rate)}
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="metric-item">
                            <Text type="secondary">Daily Revenue</Text>
                            <Text strong className="metric-value revenue">
                              {formatRevenue(ward.dailyRevenue)}
                            </Text>
                          </div>
                        </Col>
                        <Col span={12}>
                          <div className="metric-item">
                            <Text type="secondary">Category</Text>
                            <Tag color="blue" size="small">
                              {ward.room_category}
                            </Tag>
                          </div>
                        </Col>
                      </Row>

                      {/* Gender Specific */}
                      {ward.gender_specific && (
                        <div className="gender-tag">
                          <Tag 
                            color={ward.gender_specific === 'Mixed' ? 'purple' : 
                                   ward.gender_specific === 'Male' ? 'blue' : 'pink'}
                            size="small"
                          >
                            {ward.gender_specific}
                          </Tag>
                        </div>
                      )}

                      {/* Revenue Efficiency Indicator */}
                      <Tooltip title={`Revenue efficiency: ${ward.revenueEfficiency.toFixed(1)}%`}>
                        <div className="efficiency-indicator">
                          <Progress
                            percent={ward.revenueEfficiency}
                            size="small"
                            showInfo={false}
                            strokeColor="#722ed1"
                          />
                        </div>
                      </Tooltip>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        ) : (
          <Card>
            <Empty 
              description="No ward data available for the selected hospital"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </Card>
        )
      ) : (
        <Card className="empty-state-card">
          <Empty
            description={
              <div>
                <Paragraph>Please select a hospital to view ward occupancy details</Paragraph>
                <Text type="secondary">
                  Choose from {hospitals.length} available hospitals to analyze ward utilization, 
                  capacity management, and revenue optimization opportunities.
                </Text>
              </div>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </Card>
      )}
    </div>
  );
};

export default Q12_WardOccupancy;