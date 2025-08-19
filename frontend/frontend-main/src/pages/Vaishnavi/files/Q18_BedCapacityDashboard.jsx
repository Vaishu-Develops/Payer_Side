import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { Card, Row, Col, Select, DatePicker, Button, Table, Alert, Progress, Statistic, Tag, Tabs } from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined,
  HomeOutlined, UserOutlined, ClockCircleOutlined, ExportOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined
} from '@ant-design/icons';
import { api } from '../../../services/api';
import { useBedCapacityData } from '../../../hooks/useBedCapacityData';
import BedCapacityPrediction from '../../../components/BedCapacityPrediction';
import './Q18_BedCapacityDashboard.css';

const { RangePicker } = DatePicker;
const { Option } = Select;

const { TabPane } = Tabs;

const Q18_BedCapacityDashboard = () => {
  // State management
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');

  // Use custom hook for data management
  const {
    hospitals,
    wards,
    loading,
    error,
    alerts,
    systemMetrics,
    trendData,
    departmentData,
    predictions
  } = useBedCapacityData(selectedHospital, timeRange);

  // Export functionality
  const exportData = (format) => {
    const data = {
      summary: systemMetrics,
      hospitals: hospitals,
      departments: departmentData,
      alerts: alerts,
      trends: trendData,
      predictions: predictions
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bed-capacity-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };



  // Colors for charts
  const COLORS = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading bed capacity data...</div>
      </div>
    );
  }

  return (
    <div className="bed-capacity-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Hospital Bed Capacity Analysis</h1>
          <p>Real-time monitoring and predictive analytics</p>
        </div>
        <div className="header-controls">
          <Select
            value={selectedHospital}
            onChange={setSelectedHospital}
            style={{ width: 200, marginRight: 16 }}
          >
            <Option value="all">All Hospitals</Option>
            {hospitals.map(hospital => (
              <Option key={hospital.id} value={hospital.id.toString()}>
                {hospital.name}
              </Option>
            ))}
          </Select>
          <Select
            value={timeRange}
            onChange={setTimeRange}
            style={{ width: 120, marginRight: 16 }}
          >
            <Option value="24h">24 Hours</Option>
            <Option value="7d">7 Days</Option>
            <Option value="30d">30 Days</Option>
            <Option value="90d">90 Days</Option>
          </Select>
          <Button 
            icon={<ExportOutlined />}
            onClick={() => exportData('json')}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          {alerts.slice(0, 3).map(alert => (
            <Alert
              key={alert.id}
              message={alert.message}
              type={alert.type === 'critical' ? 'error' : 'warning'}
              showIcon
              closable
              style={{ marginBottom: 8 }}
            />
          ))}
        </div>
      )}

      {/* Executive Summary Panel */}
      <Row gutter={[16, 16]} className="summary-panel">
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card">
            <Statistic
              title="Overall Occupancy"
              value={systemMetrics.overallOccupancy * 100}
              precision={1}
              suffix="%"
              prefix={
                systemMetrics.overallOccupancy > 0.9 ? 
                <ArrowUpOutlined style={{ color: '#f5222d' }} /> :
                <ArrowDownOutlined style={{ color: '#52c41a' }} />
              }
              valueStyle={{ 
                color: systemMetrics.overallOccupancy > 0.9 ? '#f5222d' : '#3f8600' 
              }}
            />
            <Progress 
              percent={systemMetrics.overallOccupancy * 100} 
              showInfo={false}
              strokeColor={systemMetrics.overallOccupancy > 0.9 ? '#f5222d' : '#52c41a'}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card">
            <Statistic
              title="Available Beds"
              value={systemMetrics.availableBeds}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="metric-subtitle">
              of {systemMetrics.totalBeds} total beds
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card">
            <Statistic
              title="Critical Alerts"
              value={systemMetrics.criticalAlerts}
              prefix={<WarningOutlined />}
              valueStyle={{ color: '#f5222d' }}
            />
            <div className="metric-subtitle">
              {systemMetrics.warningAlerts} warnings
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card className="metric-card">
            <Statistic
              title="Occupied Beds"
              value={systemMetrics.occupiedBeds}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <div className="metric-subtitle">
              Active patients
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Dashboard Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} className="dashboard-tabs">
        <TabPane tab={<span><BarChartOutlined />Overview</span>} key="overview">
          {/* Main Charts Section */}
          <Row gutter={[16, 16]} className="charts-section">
        {/* Occupancy Trend Chart */}
        <Col xs={24} lg={16}>
          <Card title="Occupancy Trends" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="occupancy"
                  stackId="1"
                  stroke="#1890ff"
                  fill="#1890ff"
                  fillOpacity={0.3}
                  name="Occupancy Rate"
                />
                <Bar yAxisId="right" dataKey="admissions" fill="#52c41a" name="Admissions" />
                <Bar yAxisId="right" dataKey="discharges" fill="#faad14" name="Discharges" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        {/* Department Distribution */}
        <Col xs={24} lg={8}>
          <Card title="Department Distribution" className="chart-card">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ department, occupancy_rate }) => 
                    `${department}: ${Math.round(occupancy_rate * 100)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="occupied_beds"
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      {/* Hospital Comparison Matrix */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Hospital Comparison Matrix" className="comparison-card">
            <Table
              dataSource={hospitals}
              rowKey="id"
              pagination={false}
              scroll={{ x: 800 }}
              columns={[
                {
                  title: 'Hospital',
                  dataIndex: 'name',
                  key: 'name',
                  fixed: 'left',
                  width: 200,
                },
                {
                  title: 'Total Beds',
                  dataIndex: 'total_beds',
                  key: 'total_beds',
                  align: 'center',
                  sorter: (a, b) => a.total_beds - b.total_beds,
                },
                {
                  title: 'Occupied',
                  dataIndex: 'occupied_beds',
                  key: 'occupied_beds',
                  align: 'center',
                  sorter: (a, b) => a.occupied_beds - b.occupied_beds,
                },
                {
                  title: 'Available',
                  dataIndex: 'available_beds',
                  key: 'available_beds',
                  align: 'center',
                  sorter: (a, b) => a.available_beds - b.available_beds,
                  render: (value) => (
                    <Tag color={value < 50 ? 'red' : value < 100 ? 'orange' : 'green'}>
                      {value}
                    </Tag>
                  ),
                },
                {
                  title: 'Occupancy Rate',
                  dataIndex: 'occupancy_rate',
                  key: 'occupancy_rate',
                  align: 'center',
                  sorter: (a, b) => a.occupancy_rate - b.occupancy_rate,
                  render: (value) => (
                    <div>
                      <Progress 
                        percent={Math.round(value * 100)} 
                        size="small"
                        strokeColor={value > 0.9 ? '#f5222d' : value > 0.8 ? '#faad14' : '#52c41a'}
                      />
                      <span>{Math.round(value * 100)}%</span>
                    </div>
                  ),
                },
                {
                  title: 'Status',
                  key: 'status',
                  align: 'center',
                  render: (_, record) => {
                    const rate = record.occupancy_rate;
                    if (rate >= 0.95) return <Tag color="red">Critical</Tag>;
                    if (rate >= 0.90) return <Tag color="orange">High</Tag>;
                    if (rate >= 0.80) return <Tag color="yellow">Moderate</Tag>;
                    return <Tag color="green">Normal</Tag>;
                  },
                },
              ]}
            />
          </Card>
        </Col>
      </Row>

      {/* Department Analysis */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Department Capacity Analysis" className="department-card">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={departmentData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_beds" fill="#8884d8" name="Total Beds" />
                <Bar dataKey="occupied_beds" fill="#82ca9d" name="Occupied Beds" />
                <Bar dataKey="available_beds" fill="#ffc658" name="Available Beds" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
        </TabPane>

        <TabPane tab={<span><LineChartOutlined />Predictions</span>} key="predictions">
          <BedCapacityPrediction 
            predictions={predictions}
            trendData={trendData}
            systemMetrics={systemMetrics}
          />
        </TabPane>

        <TabPane tab={<span><PieChartOutlined />Analytics</span>} key="analytics">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Card title="Advanced Analytics" className="analytics-card">
                <Row gutter={[16, 16]}>
                  <Col xs={24} lg={12}>
                    <h4>Capacity Utilization Patterns</h4>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="occupancy" stackId="1" stroke="#1890ff" fill="#1890ff" fillOpacity={0.6} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </Col>
                  <Col xs={24} lg={12}>
                    <h4>Department Performance Metrics</h4>
                    <Table
                      dataSource={departmentData}
                      rowKey="department"
                      pagination={false}
                      size="small"
                      columns={[
                        {
                          title: 'Department',
                          dataIndex: 'department',
                          key: 'department',
                        },
                        {
                          title: 'Efficiency Score',
                          key: 'efficiency',
                          render: (_, record) => {
                            const score = Math.round((1 - Math.abs(record.occupancy_rate - 0.85)) * 100);
                            return (
                              <Progress 
                                percent={score} 
                                size="small"
                                strokeColor={score > 80 ? '#52c41a' : score > 60 ? '#faad14' : '#f5222d'}
                              />
                            );
                          },
                        },
                      ]}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
};

export default Q18_BedCapacityDashboard;