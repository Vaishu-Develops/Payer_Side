import React, { useState, useEffect } from 'react';
import { Select, Button, Spin, Alert } from 'antd';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  BarChartOutlined,
  MedicineBoxOutlined,
  ExportOutlined,
  ToolOutlined,
  PieChartOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import * as XLSX from 'xlsx';
import equipmentService from "../../../services/equipmentService.jsx";
import './styles/Q19_EquipmentModernizationDashboard.css';

const { Option } = Select;

const EquipmentDashboard = () => {
  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedHospital, setSelectedHospital] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [allEquipmentData, setAllEquipmentData] = useState([]);
  const [allHospitalsData, setAllHospitalsData] = useState([]);
  
  // Data states
  const [ageDistributionData, setAgeDistributionData] = useState([]);
  const [priorityData, setPriorityData] = useState([]);
  const [kpiMetrics, setKpiMetrics] = useState({
    criticalEquipment: 0,
    agingEquipment: 0,
    modernEquipment: 0,
    averageAge: 0
  });
  const [categoryData, setCategoryData] = useState([]);
  const [hospitalData, setHospitalData] = useState([]);

  // Filter data based on selection
  const filterEquipmentData = (equipment, hospitals, hospitalFilter, categoryFilter) => {
    let filteredEquipment = [...equipment];

    // Filter by hospital
    if (hospitalFilter && hospitalFilter !== 'all') {
      filteredEquipment = filteredEquipment.filter(item => item.hospital_id == hospitalFilter);
    }

    // Filter by category
    if (categoryFilter && categoryFilter !== 'all') {
      filteredEquipment = filteredEquipment.filter(item => item.category === categoryFilter);
    }

    return filteredEquipment;
  };

  // Update data when filters change
  useEffect(() => {
    if (allEquipmentData.length > 0 && allHospitalsData.length > 0) {
      const filteredEquipment = filterEquipmentData(allEquipmentData, allHospitalsData, selectedHospital, selectedCategory);
      const processedData = equipmentService.processEquipmentData(filteredEquipment, allHospitalsData);
      
      setAgeDistributionData(processedData.ageDistributionData);
      setPriorityData(processedData.priorityData);
      setKpiMetrics(processedData.kpiMetrics);
      setCategoryData(processedData.categoryData);
      setHospitalData(processedData.hospitalData);
    }
  }, [selectedHospital, selectedCategory, allEquipmentData, allHospitalsData]);

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch hospitals and equipment data
        const [hospitalsData, equipmentData] = await Promise.all([
          equipmentService.fetchHospitals(),
          equipmentService.fetchHospitalEquipment()
        ]);

        // Process the data
        const processedData = equipmentService.processEquipmentData(equipmentData, hospitalsData);
        
        // Set state with processed data
        setAllEquipmentData(equipmentData);
        setAllHospitalsData(hospitalsData);
        setAgeDistributionData(processedData.ageDistributionData);
        setPriorityData(processedData.priorityData);
        setKpiMetrics(processedData.kpiMetrics);
        setCategoryData(processedData.categoryData);
        setHospitalData(processedData.hospitalData);

      } catch (err) {
        console.error('Error loading equipment data:', err);
        setError('Failed to load equipment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Export to Excel function
  const handleExportToExcel = () => {
    const kpiData = [
      { 'KPI': 'Aging Equipment', 'Value': kpiMetrics.agingEquipment, 'Description': '6-10 years old' },
      { 'KPI': 'Modern Equipment', 'Value': kpiMetrics.modernEquipment, 'Description': '< 6 years old' },
      { 'KPI': 'Average Age', 'Value': kpiMetrics.averageAge + ' years', 'Description': 'Fleet benchmark: 7 years' },
    ];
    const workbook = XLSX.utils.book_new();
    
    const kpiSheet = XLSX.utils.json_to_sheet(kpiData);
    const categorySheet = XLSX.utils.json_to_sheet(categoryData);
    const hospitalSheet = XLSX.utils.json_to_sheet(hospitalData);
    
    XLSX.utils.book_append_sheet(workbook, kpiSheet, 'KPI Summary');
    XLSX.utils.book_append_sheet(workbook, categorySheet, 'Equipment by Category');
    XLSX.utils.book_append_sheet(workbook, hospitalSheet, 'Hospital Summary');
    
    const date = new Date().toISOString().split('T')[0];
    const filename = `Equipment_Modernization_Analysis_${date}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{payload[0].name}</p>
          <p className="tooltip-value">Count: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  // Show loading spinner
  if (loading) {
    return (
      <div className="equipment-dashboard">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Spin size="large" />
        </div>
      </div>
    );
  }

  // Show error message
  if (error) {
    return (
      <div className="equipment-dashboard">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ margin: '32px' }}
        />
      </div>
    );
  }

  return (
    <div className="equipment-dashboard">
      {/* Header Section - No background, spaced layout */}
      <div className="dashboard-header">
        <div className="header-container">
          <div className="header-title-section">
            <h1 className="main-title">Equipment Modernization Analysis</h1>
          </div>
          <div className="header-controls-row">
            <Select 
              defaultValue="all" 
              className="control-dropdown" 
              placeholder="Select Hospital"
              onChange={setSelectedHospital}
            >
              <Option value="all">All Hospitals ({allHospitalsData.length})</Option>
              {allHospitalsData.map(hospital => (
                <Option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </Option>
              ))}
            </Select>
            <Select 
              defaultValue="all" 
              className="control-dropdown" 
              placeholder="Select Category"
              onChange={setSelectedCategory}
            >
              <Option value="all">All Categories</Option>
              {[...new Set(allEquipmentData.map(item => item.category))].map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<ExportOutlined />} className="control-button" onClick={handleExportToExcel}>
              Export Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* KPI Cards Row - 3 columns */}
        <div className="kpi-row kpi-row-3">
          <div className="kpi-card aging">
            <div className="kpi-icon-container">
              <ClockCircleOutlined className="kpi-icon" />
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{kpiMetrics.agingEquipment}</div>
              <div className="kpi-label">Aging Equipment</div>
              <div className="kpi-description">6-10 years old</div>
            </div>
          </div>
          <div className="kpi-card modern">
            <div className="kpi-icon-container">
              <CheckCircleOutlined className="kpi-icon" />
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{kpiMetrics.modernEquipment}</div>
              <div className="kpi-label">Modern Equipment</div>
              <div className="kpi-description">&lt; 6 years old</div>
            </div>
          </div>
          <div className="kpi-card average">
            <div className="kpi-icon-container">
              <BarChartOutlined className="kpi-icon" />
            </div>
            <div className="kpi-info">
              <div className="kpi-value">{kpiMetrics.averageAge} <span className="kpi-unit">years</span></div>
              <div className="kpi-label">Average Age</div>
              <div className="kpi-description">Fleet benchmark: 7 years</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="charts-row">
          <div className="chart-container">
            <div className="chart-header">
              <BarChartOutlined className="chart-icon" />
              <span className="chart-title">Equipment Age Distribution</span>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="range" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ageDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="chart-container">
            <div className="chart-header">
              <PieChartOutlined className="chart-icon" />
              <span className="chart-title">Modernization Priority</span>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    stroke="#fff"
                    strokeWidth={2}
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Row */}
        <div className="tables-row">
          <div className="table-container">
            <div className="table-header">
              <MedicineBoxOutlined className="table-icon" />
              <span className="table-title">Equipment by Category Analysis</span>
            </div>
            <div className="table-content">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Total Count</th>
                      <th>Average Age</th>
                      <th>Critical Count</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryData.map((category, index) => (
                      <tr key={index}>
                        <td>{category.category}</td>
                        <td>{category.totalCount}</td>
                        <td>{category.averageAge}</td>
                        <td>{category.criticalCount}</td>
                        <td><span className={`status-tag ${category.status === 'Good' ? 'good' : 'warning'}`}>{category.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          
          <div className="table-container">
            <div className="table-header">
              <ToolOutlined className="table-icon" />
              <span className="table-title">Hospital Equipment Summary</span>
            </div>
            <div className="table-content">
              <div className="table-wrapper">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Hospital Name</th>
                      <th>Total Equipment</th>
                      <th>Oldest Equipment</th>
                      <th>Overall Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hospitalData.slice(0, 10).map((hospital, index) => (
                      <tr key={index}>
                        <td>{hospital.hospitalName}</td>
                        <td>{hospital.totalEquipment}</td>
                        <td>{hospital.oldestEquipment}</td>
                        <td><span className={`status-tag ${hospital.overallStatus === 'Good' ? 'good' : 'warning'}`}>{hospital.overallStatus}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EquipmentDashboard;
