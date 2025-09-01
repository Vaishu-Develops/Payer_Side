import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart
} from 'recharts';
import { Card, Row, Col, Select, DatePicker, Button, Table, Alert, Progress, Statistic, Tag, Tabs, Spin } from 'antd';
import { 
  ArrowUpOutlined, ArrowDownOutlined, WarningOutlined,
  HomeOutlined, UserOutlined, ClockCircleOutlined, ExportOutlined,
  BarChartOutlined, LineChartOutlined, PieChartOutlined,
  SearchOutlined, DownloadOutlined, ReloadOutlined,
  DownOutlined, CalendarOutlined
} from '@ant-design/icons';
import { api } from '../../../services/api';
import { useBedCapacityData } from '../../../hooks/useBedCapacityData';
import BedCapacityPrediction from '../../../components/BedCapacityPrediction';
import * as XLSX from 'xlsx';
import './styles/Q18_BedCapacityDashboard.css';
import './styles/rechart.css';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

const Q18_BedCapacityDashboard = () => {
  // State management
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

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

  // Filter hospitals based on search term
  const filteredHospitals = useMemo(() => {
    if (!searchTerm) return hospitals;
    return hospitals.filter(hospital => 
      hospital.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [hospitals, searchTerm]);

  // Export to Excel functionality
  const exportToExcel = () => {
    try {
      // Prepare data for export
      const workbook = XLSX.utils.book_new();
      
      // Hospital data sheet
      const hospitalData = hospitals.map(hospital => ({
        'Hospital Name': hospital.name,
        'Total Beds': hospital.total_beds,
        'Occupied Beds': hospital.occupied_beds,
        'Available Beds': hospital.available_beds,
        'Occupancy Rate': `${Math.round(hospital.occupancy_rate * 100)}%`,
        'Status': hospital.occupancy_rate >= 0.95 ? 'Critical' : 
                 hospital.occupancy_rate >= 0.90 ? 'High' : 
                 hospital.occupancy_rate >= 0.80 ? 'Moderate' : 'Normal'
      }));
      
      const hospitalWorksheet = XLSX.utils.json_to_sheet(hospitalData);
      XLSX.utils.book_append_sheet(workbook, hospitalWorksheet, 'Hospitals');
      
      // Department data sheet
      const deptData = departmentData.map(dept => ({
        'Department': dept.department,
        'Total Beds': dept.total_beds,
        'Occupied Beds': dept.occupied_beds,
        'Available Beds': dept.available_beds,
        'Occupancy Rate': `${Math.round(dept.occupancy_rate * 100)}%`
      }));
      
      const deptWorksheet = XLSX.utils.json_to_sheet(deptData);
      XLSX.utils.book_append_sheet(workbook, deptWorksheet, 'Departments');
      
      // System metrics sheet
      const metricsData = [{
        'Total Beds': systemMetrics.totalBeds,
        'Occupied Beds': systemMetrics.occupiedBeds,
        'Available Beds': systemMetrics.availableBeds,
        'Overall Occupancy': `${Math.round(systemMetrics.overallOccupancy * 100)}%`,
        'Critical Alerts': systemMetrics.criticalAlerts,
        'Warning Alerts': systemMetrics.warningAlerts
      }];
      
      const metricsWorksheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsWorksheet, 'System Metrics');
      
      // Save the file
      const fileName = `Bed_Capacity_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  // Colors for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

  if (loading) {
    return (
      <div className="bed-capacity-dashboard">
        <div className="loading-container">
          <div className="loading-content">
            <Spin size="large" />
            <p>Loading bed capacity data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bed-capacity-dashboard">
        <Alert 
          message="Error Loading Data" 
          description={error} 
          type="error" 
          showIcon 
          style={{ margin: '20px' }}
        />
      </div>
    );
  }

  return (
    <div className="bed-capacity-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Hospital Bed Capacity Dashboard</h1>
            <p>Real-time monitoring and predictive analytics for bed management</p>
          </div>
          <div className="header-actions">
            <Button 
              icon={<ReloadOutlined />} 
              className="refresh-btn"
              onClick={() => window.location.reload()}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <Card className="filters-card">
        <div className="filters-content">
          <div className="filter-group">
            <label>Search Hospitals</label>
            <div className="search-input-wrapper">
              <SearchOutlined className="search-icon" />
              <input
                type="text"
                placeholder="Search hospitals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>
          
          <div className="filter-group">
            <label>Select Hospital</label>
            <Select
              value={selectedHospital}
              onChange={setSelectedHospital}
              className="hospital-select"
              suffixIcon={<DownOutlined />}
            >
              <Option value="all">All Hospitals</Option>
              {filteredHospitals.map(hospital => (
                <Option key={hospital.id} value={hospital.id.toString()}>
                  {hospital.name}
                </Option>
              ))}
            </Select>
          </div>
          
          <div className="filter-group">
            <label>Time Range</label>
            <Select
              value={timeRange}
              onChange={setTimeRange}
              className="time-select"
              suffixIcon={<CalendarOutlined />}
            >
              <Option value="24h">24 Hours</Option>
              <Option value="7d">7 Days</Option>
              <Option value="30d">30 Days</Option>
              <Option value="90d">90 Days</Option>
            </Select>
          </div>
          
          <div className="filter-group">
            <label>Export Data</label>
            <Button 
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
              className="export-excel-btn"
              type="primary"
            >
              Export to Excel
            </Button>
          </div>
        </div>
      </Card>

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
              className="alert-item"
            />
          ))}
        </div>
      )}

      {/* System Overview Section */}
      <div className="system-overview">
        <h2>System Overview</h2>
        <Row gutter={[16, 16]} className="metrics-grid">
          <Col xs={24} sm={12} md={6}>
            <Card className="metric-card">
              <div className="metric-content">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                  <HomeOutlined style={{ color: '#3b82f6' }} />
                </div>
                <div className="metric-details">
                  <h3>Total Beds</h3>
                  <div className="metric-value">{systemMetrics.totalBeds?.toLocaleString() || '12,605'}</div>
                  <div className="metric-trend">
                    <ArrowUpOutlined style={{ color: '#10b981' }} />
                    <span>+2% from last week</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="metric-card">
              <div className="metric-content">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <UserOutlined style={{ color: '#10b981' }} />
                </div>
                <div className="metric-details">
                  <h3>Occupied Beds</h3>
                  <div className="metric-value">{systemMetrics.occupiedBeds?.toLocaleString() || '10,379'}</div>
                  <div className="occupancy-progress">
                    <Progress 
                      percent={Math.round((systemMetrics.occupiedBeds / systemMetrics.totalBeds) * 100) || 82} 
                      size="small"
                      strokeColor={
                        systemMetrics.overallOccupancy > 0.9 ? '#ef4444' : 
                        systemMetrics.overallOccupancy > 0.8 ? '#f59e0b' : '#10b981'
                      }
                      showInfo={false}
                    />
                    <span>{Math.round(systemMetrics.overallOccupancy * 100) || 82}% occupancy</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="metric-card">
              <div className="metric-content">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <UserOutlined style={{ color: '#f59e0b' }} />
                </div>
                <div className="metric-details">
                  <h3>Available Beds</h3>
                  <div className="metric-value">{systemMetrics.availableBeds?.toLocaleString() || '2,226'}</div>
                  <div className="availability-status">
                    <Tag color={
                      systemMetrics.availableBeds < 50 ? 'red' : 
                      systemMetrics.availableBeds < 100 ? 'orange' : 'green'
                    }>
                      {systemMetrics.availableBeds < 50 ? 'Critical' : 
                       systemMetrics.availableBeds < 100 ? 'Limited' : 'Adequate'}
                    </Tag>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Card className="metric-card">
              <div className="metric-content">
                <div className="metric-icon" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                  <WarningOutlined style={{ color: '#ef4444' }} />
                </div>
                <div className="metric-details">
                  <h3>Active Alerts</h3>
                  <div className="metric-value">{systemMetrics.criticalAlerts || 0}</div>
                  <div className="alerts-detail">
                    <span>{systemMetrics.warningAlerts || 9} warnings</span>
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* Main Dashboard Content */}
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab} 
        className="dashboard-tabs"
      >
        <TabPane 
          tab={<span><BarChartOutlined />Overview</span>} 
          key="overview"
        >
          <div className="tab-content">
            <Row gutter={[20, 20]}>
              <Col xs={24} lg={14}>
                <Card title="Bed Occupancy Trends" className="chart-card">
                  <ResponsiveContainer width="100%" height={320}>
                    <ComposedChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" stroke="#6b7280" />
                      <YAxis yAxisId="left" stroke="#6b7280" />
                      <YAxis yAxisId="right" orientation="right" stroke="#6b7280" />
                      <Tooltip />
                      <Legend />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="occupancy"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="url(#colorOccupancy)"
                        fillOpacity={0.6}
                        name="Occupancy Rate"
                        strokeWidth={2}
                      />
                      <Bar yAxisId="right" dataKey="admissions" fill="#10b981" name="Admissions" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="discharges" fill="#f59e0b" name="Discharges" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="colorOccupancy" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </ComposedChart>
                  </ResponsiveContainer>
                </Card>
              </Col>

              <Col xs={24} lg={10}>
                <Card title="Department Distribution" className="chart-card">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={departmentData}
                        cx="50%"
                        cy="40%"
                        labelLine={true}
                        label={({ department, occupancy_rate }) => 
                          `${Math.round(occupancy_rate * 100)}%`
                        }
                        outerRadius={80}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="occupied_beds"
                        nameKey="department"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend 
                        layout="horizontal" 
                        verticalAlign="bottom" 
                        align="right"
                        wrapperStyle={{ paddingLeft: '20px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </Col>
            </Row>

            {/* Hospital Comparison Table */}
            <Card title="Hospital Comparison" className="table-card">
              <Table
                dataSource={filteredHospitals}
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
                    render: (value, record) => (
                      <Tag color={
                        value < (record.total_beds * 0.1) ? 'red' : 
                        value < (record.total_beds * 0.2) ? 'orange' : 'green'
                      }>
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
                          strokeColor={
                            value > 0.9 ? '#ef4444' : 
                            value > 0.8 ? '#f59e0b' : '#10b981'
                          }
                          showInfo={false}
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
                      if (rate >= 0.80) return <Tag color="gold">Moderate</Tag>;
                      return <Tag color="green">Normal</Tag>;
                    },
                  },
                ]}
              />
            </Card>
          </div>
        </TabPane>

        <TabPane 
          tab={<span><LineChartOutlined />Predictions</span>} 
          key="predictions"
        >
          <BedCapacityPrediction 
            predictions={predictions}
            trendData={trendData}
            systemMetrics={systemMetrics}
          />
        </TabPane>

        <TabPane 
          tab={<span><PieChartOutlined />Analytics</span>} 
          key="analytics"
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={12}>
              <Card title="Capacity Utilization Trends" className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="date" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="occupancy" 
                      stackId="1" 
                      stroke="#8b5cf6" 
                      fill="url(#colorUtilization)" 
                      fillOpacity={0.6} 
                    />
                    <defs>
                      <linearGradient id="colorUtilization" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Department Performance Metrics" className="chart-card">
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
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>

      {/* Custom CSS for this component only */}
      <style>
        {`
          .bed-capacity-dashboard {
            padding: 24px;
            background: #f8fafc;
            min-height: 100vh;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          .dashboard-header {
            background: white;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .header-text h1 {
            margin: 0;
            color: #1f2937;
            font-size: 28px;
            font-weight: 700;
          }
          
          .header-text p {
            margin: 4px 0 0 0;
            color: #6b7280;
            font-size: 16px;
          }
          
          .refresh-btn {
            border-radius: 8px;
            height: 40px;
          }
          
          .filters-card {
            border-radius: 12px;
            margin-bottom: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .filters-card .ant-card-body {
            padding: 20px;
          }
          
          .filters-content {
            display: flex;
            flex-wrap: wrap;
            gap: 16px;
            align-items: flex-end;
          }
          
          .filter-group {
            display: flex;
            flex-direction: column;
            min-width: 200px;
          }
          
          .filter-group label {
            font-size: 14px;
            font-weight: 500;
            color: #374151;
            margin-bottom: 8px;
          }
          
          .search-input-wrapper {
            position: relative;
          }
          
          .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: #9ca3af;
            z-index: 1;
          }
          
          .search-input {
            width: 100%;
            height: 40px;
            padding: 8px 12px 8px 40px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            font-size: 14px;
            transition: all 0.3s;
          }
          
          .search-input:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }
          
          .hospital-select, .time-select {
            height: 40px;
            border-radius: 8px;
          }
          
          .export-excel-btn {
            background: #10b981;
            border-color: #10b981;
            height: 40px;
            border-radius: 8px;
            font-weight: 500;
          }
          
          .export-excel-btn:hover {
            background: #059669;
            border-color: #059669;
          }
          
          .alerts-section {
            margin-bottom: 24px;
          }
          
          .alert-item {
            border-radius: 8px;
            margin-bottom: 8px;
          }
          
          .system-overview {
            margin-bottom: 24px;
          }
          
          .system-overview h2 {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
          }
          
          .metrics-grid {
            margin: 0 !important;
          }
          
          .metric-card {
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            height: 100%;
            border: none;
          }
          
          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .metric-card .ant-card-body {
            padding: 20px;
          }
          
          .metric-content {
            display: flex;
            align-items: flex-start;
            gap: 16px;
          }
          
          .metric-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
          }
          
          .metric-details h3 {
            margin: 0 0 8px 0;
            font-size: 14px;
            color: #6b7280;
            font-weight: 500;
          }
          
          .metric-value {
            font-size: 24px;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 8px;
          }
          
          .metric-trend {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            color: #6b7280;
          }
          
          .occupancy-progress {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .occupancy-progress span {
            font-size: 12px;
            color: #6b7280;
            margin-top: 4px;
          }
          
          .alerts-detail span {
            font-size: 12px;
            color: #6b7280;
          }
          
          .dashboard-tabs {
            background: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .dashboard-tabs .ant-tabs-nav {
            margin: 0 0 24px 0;
          }
          
          .dashboard-tabs .ant-tabs-tab {
            padding: 12px 16px;
            font-weight: 500;
          }
          
          .dashboard-tabs .ant-tabs-tab-active {
            color: #3b82f6;
          }
          
          .tab-content {
            margin-top: 16px;
          }
          
          .chart-card {
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: none;
            margin-bottom: 20px;
          }
          
          .chart-card .ant-card-head {
            border-bottom: 1px solid #f3f4f6;
            padding: 0 20px;
          }
          
          .chart-card .ant-card-head-title {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            padding: 16px 0;
          }
          
          .chart-card .ant-card-body {
            padding: 20px;
          }
          
          .table-card {
            border-radius: 12px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            border: none;
          }
          
          .table-card .ant-card-body {
            padding: 20px;
          }
          
          .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 60vh;
          }
          
          .loading-content {
            text-align: center;
          }
          
          .loading-content .ant-spin {
            margin-bottom: 16px;
          }
          
          .loading-content p {
            color: #6b7280;
            font-size: 16px;
          }
          
          /* Responsive adjustments */
          @media (max-width: 768px) {
            .header-content {
              flex-direction: column;
              align-items: flex-start;
              gap: 16px;
            }
            
            .filters-content {
              flex-direction: column;
              align-items: stretch;
            }
            
            .filter-group {
              width: 100%;
            }
            
            .metrics-grid .ant-col {
              margin-bottom: 16px;
            }
            
            .metric-content {
              flex-direction: column;
              align-items: center;
              text-align: center;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Q18_BedCapacityDashboard;