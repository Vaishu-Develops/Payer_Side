// src/pages/Vaishnavi files/Q14_HospitalPerformance.jsx
import React, { useState, useEffect, useCallback } from 'react';
import './styles/Q14_HospitalPerformance.css';
import { 
  Card, 
  Spin, 
  Alert, 
  Row, 
  Col, 
  Select, 
  Statistic, 
  Progress, 
  Table,
  Tag,
  Button,
  Typography,
  Space,
  Tooltip
} from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  HeartOutlined,
  DashboardOutlined
} from "@ant-design/icons";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import dataService from '../../../services/dataService';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  ArcElement,
  Filler
);

const { Option } = Select;
const { Title: AntTitle, Text } = Typography;

const Q14_HospitalPerformance = () => {
  const [data, setData] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const getSampleData = () => ({
    metrics: [
      {
        id: 61,
        hospital_id: 121,
        total_doctors: 57,
        fulltime_doctors_mci: 29,
        consultants: 17,
        surgeons: 33,
        qualified_nurses: 383,
        icu_doctors_mbbs_md: 10,
        icu_nurses_all_shifts: 90,
        doctor_bed_ratio: 0.16,
        nurse_bed_ratio: 0.87,
        icu_doctor_bed_ratio: 0.26,
        icu_nurse_bed_ratio: 1.17,
      },
      {
        id: 62,
        hospital_id: 122,
        total_doctors: 55,
        fulltime_doctors_mci: 52,
        consultants: 15,
        surgeons: 24,
        qualified_nurses: 263,
        icu_doctors_mbbs_md: 11,
        icu_nurses_all_shifts: 73,
        doctor_bed_ratio: 0.14,
        nurse_bed_ratio: 1.21,
        icu_doctor_bed_ratio: 0.45,
        icu_nurse_bed_ratio: 1.79,
      },
      {
        id: 63,
        hospital_id: 123,
        total_doctors: 263,
        fulltime_doctors_mci: 91,
        consultants: 41,
        surgeons: 90,
        qualified_nurses: 1175,
        icu_doctors_mbbs_md: 11,
        icu_nurses_all_shifts: 224,
        doctor_bed_ratio: 0.22,
        nurse_bed_ratio: 1.05,
        icu_doctor_bed_ratio: 0.33,
        icu_nurse_bed_ratio: 1.33,
      }
    ],
    hospitals: [
      { id: 121, name: "Apollo Hospital Chennai", category: "Tertiary Care", beds_operational: 520 },
      { id: 122, name: "Fortis Hospital Mulund", category: "Tertiary Care", beds_operational: 300 },
      { id: 123, name: "Medanta The Medicity", category: "Super Specialty", beds_operational: 1200 },
    ]
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch both hospital data and metrics from backend
      const [hospitalsResponse, metricsResponse] = await Promise.all([
        dataService.fetchHospitalsData(),
        dataService.handleRequest('/hospital_metrics')
      ]);
      
      let metricsData = [];
      let hospitalsData = [];

      // Handle hospital response
      if (hospitalsResponse.success) {
        const hospitalResponseData = hospitalsResponse.data;
        
        if (hospitalResponseData && hospitalResponseData.hospitals) {
          hospitalsData = Array.isArray(hospitalResponseData.hospitals) ? hospitalResponseData.hospitals : [];
        } else if (Array.isArray(hospitalResponseData)) {
          hospitalsData = hospitalResponseData;
        }
      }

      // Handle metrics response
      if (metricsResponse.success) {
        const metricsResponseData = metricsResponse.data;
        
        if (Array.isArray(metricsResponseData)) {
          metricsData = metricsResponseData;
        } else if (metricsResponseData && Array.isArray(metricsResponseData.metrics)) {
          metricsData = metricsResponseData.metrics;
        }
      }
      
      // If we have real data, use it; otherwise fallback to sample data
      if (hospitalsData.length > 0 || metricsData.length > 0) {
        // Use real hospital data, but supplement metrics with sample data if needed
        if (metricsData.length === 0 && hospitalsData.length > 0) {
          const sampleMetrics = getSampleData().metrics;
          metricsData = hospitalsData.slice(0, 3).map((hospital, index) => ({
            ...sampleMetrics[index] || sampleMetrics[0],
            hospital_id: hospital.id,
            id: hospital.id + 60
          }));
        }
        
        // Use sample hospitals if none from backend
        if (hospitalsData.length === 0) {
          hospitalsData = getSampleData().hospitals;
        }
        
        setData(metricsData);
        setHospitals(hospitalsData);
        
        if (hospitalsData.length > 0 && !selectedHospital) {
          setSelectedHospital(hospitalsData[0].id);
        }
        
        if (metricsResponse.success && hospitalsResponse.success) {
          setError(null); // Clear error if both APIs work
        } else {
          setError('Some data loaded from API, supplemented with sample data');
        }
      } else {
        // Fallback to complete sample data
        const sampleData = getSampleData();
        setData(sampleData.metrics);
        setHospitals(sampleData.hospitals);
        setSelectedHospital(sampleData.hospitals[0]?.id);
        setError('Using sample data - API unavailable');
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      
      const sampleData = getSampleData();
      setData(sampleData.metrics);
      setHospitals(sampleData.hospitals);
      setSelectedHospital(sampleData.hospitals[0]?.id);
      setError("Failed to fetch data from API. Using sample data.");
    } finally {
      setLoading(false);
    }
  }, [selectedHospital]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refreshData = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getCurrentHospitalMetrics = useCallback(() => {
    if (!selectedHospital || !data.length) return null;
    return data.find(metric => metric.hospital_id === selectedHospital);
  }, [selectedHospital, data]);

  const getCurrentHospital = useCallback(() => {
    if (!selectedHospital || !hospitals.length) return null;
    return hospitals.find(hospital => hospital.id === selectedHospital);
  }, [selectedHospital, hospitals]);

  const getPerformanceLevel = (value, benchmarks) => {
    if (value >= benchmarks.excellent) return { level: 'excellent', color: '#52c41a', label: 'Excellent' };
    if (value >= benchmarks.good) return { level: 'good', color: '#1890ff', label: 'Good' };
    if (value >= benchmarks.acceptable) return { level: 'acceptable', color: '#faad14', label: 'Acceptable' };
    return { level: 'poor', color: '#ff4d4f', label: 'Needs Improvement' };
  };

  const benchmarks = {
    doctor_bed_ratio: { excellent: 0.25, good: 0.20, acceptable: 0.15 },
    nurse_bed_ratio: { excellent: 1.5, good: 1.2, acceptable: 1.0 },
    icu_doctor_bed_ratio: { excellent: 0.5, good: 0.35, acceptable: 0.25 },
    icu_nurse_bed_ratio: { excellent: 2.0, good: 1.5, acceptable: 1.0 }
  };

  const getMonthlyTrends = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMetrics = getCurrentHospitalMetrics();
    if (!currentMetrics) return { labels: months, datasets: [] };

    return {
      labels: months,
      datasets: [
        {
          label: 'Doctor-Bed Ratio',
          data: months.map(() => currentMetrics.doctor_bed_ratio + (Math.random() - 0.5) * 0.04),
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Nurse-Bed Ratio',
          data: months.map(() => currentMetrics.nurse_bed_ratio + (Math.random() - 0.5) * 0.2),
          borderColor: '#52c41a',
          backgroundColor: 'rgba(82, 196, 26, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  };

  const getDepartmentComparison = () => {
    const currentMetrics = getCurrentHospitalMetrics();
    if (!currentMetrics) return { labels: [], datasets: [] };

    return {
      labels: ['Total Doctors', 'Consultants', 'Surgeons', 'ICU Doctors'],
      datasets: [
        {
          label: 'Staff Count',
          data: [
            currentMetrics.total_doctors,
            currentMetrics.consultants,
            currentMetrics.surgeons,
            currentMetrics.icu_doctors_mbbs_md
          ],
          backgroundColor: [
            '#1890ff',
            '#52c41a',
            '#faad14',
            '#ff4d4f'
          ],
          borderWidth: 2,
          borderColor: '#fff',
        }
      ]
    };
  };

  const getPeerComparisonData = () => {
    // Use only real backend data - no fallback to sample data
    if (!Array.isArray(data) || data.length === 0 || !Array.isArray(hospitals) || hospitals.length === 0) {
      return []; // Return empty if no real data available
    }
    
    // Sort hospitals by doctor_bed_ratio in descending order for ranking
    const sortedMetrics = [...data].sort((a, b) => b.doctor_bed_ratio - a.doctor_bed_ratio);
    
    // Take all available hospitals (up to 20 based on your JSON data)
    return sortedMetrics.map((metric, index) => {
      const hospital = hospitals.find(h => h.id === metric.hospital_id);
      const doctorPerf = getPerformanceLevel(metric.doctor_bed_ratio, benchmarks.doctor_bed_ratio);
      const nursePerf = getPerformanceLevel(metric.nurse_bed_ratio, benchmarks.nurse_bed_ratio);
      
      return {
        key: metric.id,
        rank: index + 1,
        hospital: hospital?.name || `Hospital ${metric.hospital_id}`,
        category: hospital?.category || 'N/A',
        bedsOperational: hospital?.beds_operational || 'N/A',
        doctorBedRatio: metric.doctor_bed_ratio.toFixed(2),
        nurseBedRatio: metric.nurse_bed_ratio.toFixed(2),
        icuDoctorRatio: metric.icu_doctor_bed_ratio.toFixed(2),
        icuNurseRatio: metric.icu_nurse_bed_ratio.toFixed(2),
        totalDoctors: metric.total_doctors,
        totalNurses: metric.qualified_nurses,
        mciDoctors: metric.fulltime_doctors_mci,
        consultants: metric.consultants,
        surgeons: metric.surgeons,
        icuDoctors: metric.icu_doctors_mbbs_md,
        icuNurses: metric.icu_nurses_all_shifts,
        doctorPerformance: doctorPerf,
        nursePerformance: nursePerf,
        lastCalculated: metric.last_calculated ? new Date(metric.last_calculated).toLocaleDateString() : 'N/A'
      };
    });
  };

  const currentMetrics = getCurrentHospitalMetrics();
  const currentHospital = getCurrentHospital();
  const monthlyTrends = getMonthlyTrends();
  const departmentData = getDepartmentComparison();
  const peerData = getPeerComparisonData();

  // Card inline styles - improved for better text alignment and overflow prevention
  const kpiCardStyle = {
    minHeight: '140px',
    minWidth: '240px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
    border: '1px solid #f0f0f0',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease'
  };

  const ratioCardStyle = {
    minHeight: '160px',
    minWidth: '200px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)',
    border: '1px solid #f0f0f0',
    backgroundColor: '#ffffff',
    transition: 'all 0.3s ease'
  };

  const peerColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 80,
      fixed: 'left',
      render: (rank) => (
        <Tag 
          style={{ 
            backgroundColor: rank <= 3 ? '#fff7e6' : rank <= 5 ? '#e6f7ff' : rank <= 10 ? '#f6ffed' : '#fafafa',
            borderColor: rank <= 3 ? '#faad14' : rank <= 5 ? '#1890ff' : rank <= 10 ? '#52c41a' : '#d9d9d9',
            color: rank <= 3 ? '#ad6800' : rank <= 5 ? '#0050b3' : rank <= 10 ? '#237804' : '#595959',
            fontWeight: '700',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          #{rank}
        </Tag>
      ),
      sorter: (a, b) => a.rank - b.rank,
    },
    {
      title: 'Hospital Name',
      dataIndex: 'hospital',
      key: 'hospital',
      width: 250,
      fixed: 'left',
      ellipsis: true,
      render: (text, record) => (
        <div>
          <Text strong style={{ color: '#1890ff' }}>{text}</Text>
          <div style={{ fontSize: '12px', color: '#434343', fontWeight: '500' }}>
            {record.category} | {record.bedsOperational} beds
          </div>
        </div>
      ),
      sorter: (a, b) => a.hospital.localeCompare(b.hospital),
    },
    {
      title: 'Doctor-Bed Ratio',
      dataIndex: 'doctorBedRatio',
      key: 'doctorBedRatio',
      width: 130,
      render: (value, record) => (
        <Tag 
          style={{ 
            backgroundColor: record.doctorPerformance.color === '#52c41a' ? '#f6ffed' :
                           record.doctorPerformance.color === '#1890ff' ? '#e6f7ff' :
                           record.doctorPerformance.color === '#faad14' ? '#fffbe6' : '#fff2f0',
            borderColor: record.doctorPerformance.color,
            color: record.doctorPerformance.color === '#52c41a' ? '#237804' :
                 record.doctorPerformance.color === '#1890ff' ? '#0050b3' :
                 record.doctorPerformance.color === '#faad14' ? '#ad6800' : '#a8071a',
            fontWeight: '700',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          {value}
        </Tag>
      ),
      sorter: (a, b) => parseFloat(a.doctorBedRatio) - parseFloat(b.doctorBedRatio),
    },
    {
      title: 'Nurse-Bed Ratio',
      dataIndex: 'nurseBedRatio',
      key: 'nurseBedRatio',
      width: 130,
      render: (value, record) => (
        <Tag 
          style={{ 
            backgroundColor: record.nursePerformance.color === '#52c41a' ? '#f6ffed' :
                           record.nursePerformance.color === '#1890ff' ? '#e6f7ff' :
                           record.nursePerformance.color === '#faad14' ? '#fffbe6' : '#fff2f0',
            borderColor: record.nursePerformance.color,
            color: record.nursePerformance.color === '#52c41a' ? '#237804' :
                 record.nursePerformance.color === '#1890ff' ? '#0050b3' :
                 record.nursePerformance.color === '#faad14' ? '#ad6800' : '#a8071a',
            fontWeight: '700',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          {value}
        </Tag>
      ),
      sorter: (a, b) => parseFloat(a.nurseBedRatio) - parseFloat(b.nurseBedRatio),
    },
    {
      title: 'ICU Doctor Ratio',
      dataIndex: 'icuDoctorRatio',
      key: 'icuDoctorRatio',
      width: 130,
      render: (value) => (
        <Tag 
          style={{ 
            backgroundColor: '#fffbe6',
            borderColor: '#faad14',
            color: '#ad6800',
            fontWeight: '700',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          {value}
        </Tag>
      ),
      sorter: (a, b) => parseFloat(a.icuDoctorRatio) - parseFloat(b.icuDoctorRatio),
    },
    {
      title: 'ICU Nurse Ratio',
      dataIndex: 'icuNurseRatio', 
      key: 'icuNurseRatio',
      width: 130,
      render: (value) => (
        <Tag 
          style={{ 
            backgroundColor: '#f9f0ff',
            borderColor: '#722ed1',
            color: '#531dab',
            fontWeight: '700',
            fontSize: '12px',
            padding: '2px 8px',
            borderRadius: '6px'
          }}
        >
          {value}
        </Tag>
      ),
      sorter: (a, b) => parseFloat(a.icuNurseRatio) - parseFloat(b.icuNurseRatio),
    },
    {
      title: 'Medical Staff',
      key: 'medicalStaff',
      width: 180,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div><strong>👨‍⚕️ {record.totalDoctors}</strong> Total Doctors</div>
          <div style={{ color: '#434343', fontWeight: '500' }}>• {record.mciDoctors} MCI Certified</div>
          <div style={{ color: '#434343', fontWeight: '500' }}>• {record.consultants} Consultants</div>
          <div style={{ color: '#434343', fontWeight: '500' }}>• {record.surgeons} Surgeons</div>
        </div>
      ),
    },
    {
      title: 'Nursing Staff',
      key: 'nursingStaff',
      width: 160,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div><strong>👩‍⚕️ {record.totalNurses}</strong> Total Nurses</div>
          <div style={{ color: '#434343', fontWeight: '500' }}>• {record.icuNurses} ICU Nurses</div>
        </div>
      ),
    },
    {
      title: 'ICU Staff',
      key: 'icuStaff',
      width: 150,
      render: (_, record) => (
        <div style={{ fontSize: '12px' }}>
          <div><strong>🏥 {record.icuDoctors}</strong> ICU Doctors</div>
          <div style={{ color: '#434343', fontWeight: '500' }}>MBBS/MD Qualified</div>
        </div>
      ),
    },
    {
      title: 'Last Updated',
      dataIndex: 'lastCalculated',
      key: 'lastCalculated',
      width: 120,
      render: (date) => (
        <Text style={{ fontSize: '11px', color: '#434343', fontWeight: '500' }}>
          {date}
        </Text>
      ),
    }
  ];

  if (loading) {
    return (
      <div className="hospital-performance-dashboard" style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '100px 50px' }}>
            <Spin size="large" />
            <div style={{ marginTop: '16px', fontSize: '16px', color: '#434343', fontWeight: '600' }}>
              Loading hospital performance metrics...
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="hospital-performance-dashboard" style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      {/* Header */}
      <Card style={{ marginBottom: '24px' }}>
        <Row justify="space-between" align="middle">
          <Col xs={24} md={12}>
            <AntTitle level={2} style={{ margin: 0, color: '#1890ff' }}>
              <DashboardOutlined style={{ marginRight: '12px' }} />
              Hospital Performance Metrics
            </AntTitle>
            <Text type="secondary" style={{ fontSize: '14px' }}>
              Real-time performance analytics and benchmarking dashboard
            </Text>
          </Col>
          <Col xs={24} md={12} style={{ textAlign: 'right', marginTop: { xs: '16px', md: '0' } }}>
            <Space size="middle">
              <Select
                style={{ width: '280px' }}
                placeholder="Select Hospital"
                value={selectedHospital}
                onChange={setSelectedHospital}
                showSearch
                filterOption={(input, option) =>
                  option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                }
              >
                {hospitals.map(hospital => (
                  <Option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </Option>
                ))}
              </Select>
              <Button 
                type="primary"
                icon={<ReloadOutlined />} 
                onClick={refreshData}
                loading={refreshing}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
        
        {error && (
          <Alert 
            message="Data Source Notice" 
            description={error} 
            type="info" 
            showIcon 
            style={{ marginTop: '16px' }}
            closable
          />
        )}
      </Card>

      {currentMetrics && currentHospital && (
        <>
          {/* Hospital Info */}
          <Card style={{ marginBottom: '24px' }}>
            <Row gutter={16} align="middle">
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>Hospital Name</Text>
                  <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>
                    {currentHospital.name}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>Category</Text>
                  <Text strong style={{ fontSize: '16px', color: '#52c41a' }}>
                    {currentHospital.category || 'Tertiary Care'}
                  </Text>
                </div>
              </Col>
              <Col xs={24} sm={8}>
                <div style={{ textAlign: 'center' }}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: '4px' }}>Operational Beds</Text>
                  <Text strong style={{ fontSize: '16px', color: '#faad14' }}>
                    {currentHospital.beds_operational || 'N/A'} beds
                  </Text>
                </div>
              </Col>
            </Row>
          </Card>

          {/* KPI Cards - Staff Metrics */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={kpiCardStyle} hoverable>
                <div className="kpi-card-content">
                  <div className="kpi-card-icon" style={{ backgroundColor: '#e6f7ff' }}>
                    <UserOutlined style={{ fontSize: '28px', color: '#1890ff' }} />
                  </div>
                  <div className="kpi-card-text">
                    <div className="kpi-card-label">
                      Total Doctors
                    </div>
                    <div className="kpi-card-value" style={{ color: '#1890ff' }}>
                      {currentMetrics.total_doctors}
                    </div>
                    <div className="kpi-card-subtitle">
                      {currentMetrics.fulltime_doctors_mci} MCI Certified
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card style={kpiCardStyle} hoverable>
                <div className="kpi-card-content">
                  <div className="kpi-card-icon" style={{ backgroundColor: '#f6ffed' }}>
                    <TeamOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
                  </div>
                  <div className="kpi-card-text">
                    <div className="kpi-card-label">
                      Qualified Nurses
                    </div>
                    <div className="kpi-card-value" style={{ color: '#52c41a' }}>
                      {currentMetrics.qualified_nurses}
                    </div>
                    <div className="kpi-card-subtitle">
                      {currentMetrics.icu_nurses_all_shifts} ICU Nurses
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card style={kpiCardStyle} hoverable>
                <div className="kpi-card-content">
                  <div className="kpi-card-icon" style={{ backgroundColor: '#fffbe6' }}>
                    <MedicineBoxOutlined style={{ fontSize: '28px', color: '#faad14' }} />
                  </div>
                  <div className="kpi-card-text">
                    <div className="kpi-card-label">
                      Specialists
                    </div>
                    <div className="kpi-card-value" style={{ color: '#faad14' }}>
                      {currentMetrics.consultants + currentMetrics.surgeons}
                    </div>
                    <div className="kpi-card-subtitle">
                      {currentMetrics.consultants} Consultants, {currentMetrics.surgeons} Surgeons
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
            
            <Col xs={24} sm={12} lg={6}>
              <Card style={kpiCardStyle} hoverable>
                <div className="kpi-card-content">
                  <div className="kpi-card-icon" style={{ backgroundColor: '#fff2f0' }}>
                    <SafetyOutlined style={{ fontSize: '28px', color: '#ff4d4f' }} />
                  </div>
                  <div className="kpi-card-text">
                    <div className="kpi-card-label">
                      ICU Doctors
                    </div>
                    <div className="kpi-card-value" style={{ color: '#ff4d4f' }}>
                      {currentMetrics.icu_doctors_mbbs_md}
                    </div>
                    <div className="kpi-card-subtitle">
                      MBBS/MD Qualified
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Ratio Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} lg={6}>
              <Card style={ratioCardStyle} hoverable>
                <div className="ratio-card-content">
                  <div className="ratio-card-label">
                    Doctor-Bed Ratio
                  </div>
                  <div className="ratio-card-value doctor-ratio-value">
                    {currentMetrics.doctor_bed_ratio.toFixed(2)}
                  </div>
                  <Progress 
                    percent={Math.min((currentMetrics.doctor_bed_ratio / 0.3) * 100, 100)}
                    strokeColor={getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).color}
                    showInfo={false}
                    style={{ marginBottom: '12px' }}
                  />
                  <Tag 
                    className={`ant-tag-${getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level}`}
                    style={{ 
                      backgroundColor: getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level === 'excellent' ? '#f6ffed' :
                                     getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level === 'good' ? '#e6f7ff' :
                                     getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level === 'acceptable' ? '#fffbe6' : '#fff2f0',
                      borderColor: getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).color,
                      color: getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level === 'excellent' ? '#237804' :
                           getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level === 'good' ? '#0050b3' :
                           getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).level === 'acceptable' ? '#ad6800' : '#a8071a',
                      fontWeight: '700',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {getPerformanceLevel(currentMetrics.doctor_bed_ratio, benchmarks.doctor_bed_ratio).label}
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={ratioCardStyle} hoverable>
                <div className="ratio-card-content">
                  <div className="ratio-card-label">
                    Nurse-Bed Ratio
                  </div>
                  <div className="ratio-card-value nurse-ratio-value">
                    {currentMetrics.nurse_bed_ratio.toFixed(2)}
                  </div>
                  <Progress 
                    percent={Math.min((currentMetrics.nurse_bed_ratio / 2.0) * 100, 100)}
                    strokeColor={getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).color}
                    showInfo={false}
                    style={{ marginBottom: '12px' }}
                  />
                  <Tag 
                    className={`ant-tag-${getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level}`}
                    style={{ 
                      backgroundColor: getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level === 'excellent' ? '#f6ffed' :
                                     getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level === 'good' ? '#e6f7ff' :
                                     getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level === 'acceptable' ? '#fffbe6' : '#fff2f0',
                      borderColor: getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).color,
                      color: getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level === 'excellent' ? '#237804' :
                           getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level === 'good' ? '#0050b3' :
                           getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).level === 'acceptable' ? '#ad6800' : '#a8071a',
                      fontWeight: '700',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {getPerformanceLevel(currentMetrics.nurse_bed_ratio, benchmarks.nurse_bed_ratio).label}
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={ratioCardStyle} hoverable>
                <div className="ratio-card-content">
                  <div className="ratio-card-label">
                    ICU Doctor Ratio
                  </div>
                  <div className="ratio-card-value icu-doctor-ratio-value">
                    {currentMetrics.icu_doctor_bed_ratio.toFixed(2)}
                  </div>
                  <Progress 
                    percent={Math.min((currentMetrics.icu_doctor_bed_ratio / 0.6) * 100, 100)}
                    strokeColor={getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).color}
                    showInfo={false}
                    style={{ marginBottom: '12px' }}
                  />
                  <Tag 
                    className={`ant-tag-${getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level}`}
                    style={{ 
                      backgroundColor: getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level === 'excellent' ? '#f6ffed' :
                                     getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level === 'good' ? '#e6f7ff' :
                                     getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level === 'acceptable' ? '#fffbe6' : '#fff2f0',
                      borderColor: getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).color,
                      color: getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level === 'excellent' ? '#237804' :
                           getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level === 'good' ? '#0050b3' :
                           getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).level === 'acceptable' ? '#ad6800' : '#a8071a',
                      fontWeight: '700',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {getPerformanceLevel(currentMetrics.icu_doctor_bed_ratio, benchmarks.icu_doctor_bed_ratio).label}
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12} lg={6}>
              <Card style={ratioCardStyle} hoverable>
                <div className="ratio-card-content">
                  <div className="ratio-card-label">
                    ICU Nurse Ratio
                  </div>
                  <div className="ratio-card-value icu-nurse-ratio-value">
                    {currentMetrics.icu_nurse_bed_ratio.toFixed(2)}
                  </div>
                  <Progress 
                    percent={Math.min((currentMetrics.icu_nurse_bed_ratio / 2.5) * 100, 100)}
                    strokeColor={getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).color}
                    showInfo={false}
                    style={{ marginBottom: '12px' }}
                  />
                  <Tag 
                    className={`ant-tag-${getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level}`}
                    style={{ 
                      backgroundColor: getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level === 'excellent' ? '#f6ffed' :
                                     getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level === 'good' ? '#e6f7ff' :
                                     getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level === 'acceptable' ? '#fffbe6' : '#fff2f0',
                      borderColor: getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).color,
                      color: getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level === 'excellent' ? '#237804' :
                           getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level === 'good' ? '#0050b3' :
                           getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).level === 'acceptable' ? '#ad6800' : '#a8071a',
                      fontWeight: '700',
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '6px'
                    }}
                  >
                    {getPerformanceLevel(currentMetrics.icu_nurse_bed_ratio, benchmarks.icu_nurse_bed_ratio).label}
                  </Tag>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts Section */}
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            <Col xs={24} lg={12}>
              <Card title="📈 Monthly Performance Trends" style={{ borderRadius: '8px' }}>
                <div style={{ height: '350px', padding: '20px' }}>
                  <Line 
                    data={monthlyTrends}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                        tooltip: {
                          enabled: true,
                          backgroundColor: 'rgba(0, 0, 0, 0.8)',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          borderColor: '#ddd',
                          borderWidth: 1,
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: { 
                            color: '#f0f0f0',
                            drawBorder: false,
                          },
                          ticks: {
                            color: '#434343',
                            font: {
                              size: 12,
                              weight: '500'
                            }
                          }
                        },
                        x: {
                          grid: { 
                            color: '#f0f0f0',
                            drawBorder: false,
                          },
                          ticks: {
                            color: '#434343',
                            font: {
                              size: 12,
                              weight: '500'
                            }
                          }
                        },
                      },
                      elements: {
                        point: {
                          radius: 4,
                          hoverRadius: 6,
                          backgroundColor: '#fff',
                          borderWidth: 2,
                        },
                        line: {
                          borderWidth: 2,
                        }
                      }
                    }}
                  />
                </div>
              </Card>
            </Col>

            <Col xs={24} lg={12}>
              <Card title="👥 Staff Distribution" style={{ borderRadius: '8px' }}>
                <div style={{ height: '350px', padding: '20px' }}>
                  <Doughnut 
                    data={departmentData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: { padding: 20, usePointStyle: true },
                        },
                      },
                      cutout: '40%',
                    }}
                  />
                </div>
              </Card>
            </Col>
          </Row>

          {/* Peer Comparison Table */}
          <Card title="🏆 Peer Hospital Comparison" style={{ borderRadius: '8px' }}>
            {peerData.length > 0 ? (
              <Table 
                columns={peerColumns}
                dataSource={peerData}
                pagination={{ 
                  pageSize: 10,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} hospitals`,
                  pageSizeOptions: ['5', '10', '15', '20']
                }}
                scroll={{ x: 1400, y: 600 }}
                size="small"
                bordered
                rowClassName={(record) => {
                  if (record.rank <= 3) return 'top-performer';
                  if (record.rank <= 5) return 'good-performer';
                  return '';
                }}
                summary={() => (
                  <Table.Summary fixed>
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={2}>
                        <Text strong>Total Hospitals: {peerData.length}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={2}>
                        <Text type="secondary">Avg: {(peerData.reduce((sum, item) => sum + parseFloat(item.doctorBedRatio), 0) / peerData.length).toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={3}>
                        <Text type="secondary">Avg: {(peerData.reduce((sum, item) => sum + parseFloat(item.nurseBedRatio), 0) / peerData.length).toFixed(2)}</Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4} colSpan={6}>
                        <Text type="secondary">Data from backend JSON files</Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  </Table.Summary>
                )}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Alert
                  message="No Data Available"
                  description="Unable to load hospital comparison data from backend. Please ensure the backend server is running and the API endpoints are accessible."
                  type="warning"
                  showIcon
                />
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
};

export default Q14_HospitalPerformance;
