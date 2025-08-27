import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Spin, Alert, Typography, Select, Tabs, Statistic, Table, Empty, Progress } from 'antd';
import { TeamOutlined, MedicineBoxOutlined, ExperimentOutlined, RiseOutlined } from '@ant-design/icons';
import { fetchHospitalList, fetchHospitalCapabilityData } from '../../../services/capabilityAssessmentService';
import { calculateCapabilityScore } from '../../../utils/capabilityUtils';
import './styles/Q09_HospitalCapabilityAssessment.css';

const { Title, Text } = Typography;
const { Option } = Select;

const Q09_HospitalCapabilityAssessment = () => {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [hospitalData, setHospitalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch hospital list on initial load
  useEffect(() => {
    const loadHospitals = async () => {
      setLoading(true);
      try {
        const hospitalList = await fetchHospitalList();
        setHospitals(hospitalList);
      } catch (err) {
        setError('Failed to load the list of hospitals.');
      } finally {
        setLoading(false);
      }
    };
    loadHospitals();
  }, []);

  // Fetch detailed data when a hospital is selected
  useEffect(() => {
    if (!selectedHospitalId) {
      setHospitalData(null);
      return;
    }
    const loadCapabilityData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchHospitalCapabilityData(selectedHospitalId);
        setHospitalData(data);
      } catch (err) {
        setError(`Failed to load capability data for the selected hospital.`);
        setHospitalData(null);
      } finally {
        setLoading(false);
      }
    };
    loadCapabilityData();
  }, [selectedHospitalId]);

  const capabilityScore = useMemo(() => {
    if (!hospitalData) return null;
    return calculateCapabilityScore(hospitalData);
  }, [hospitalData]);

  const specialtyColumns = [
    { title: 'Specialty', dataIndex: 'specialty_name', key: 'name', sorter: (a, b) => a.specialty_name.localeCompare(b.specialty_name) },
    { title: 'Category', dataIndex: 'specialty_category', key: 'category', sorter: (a, b) => a.specialty_category.localeCompare(b.specialty_category) },
    { title: 'Established Year', dataIndex: 'established_year', key: 'year', sorter: (a, b) => a.established_year - b.established_year },
  ];

  const equipmentColumns = [
    { title: 'Equipment', dataIndex: 'equipment_name', key: 'name' },
    { title: 'Category', dataIndex: 'category', key: 'category' },
    { title: 'Brand/Model', dataIndex: 'brand_model', key: 'brand' },
    { title: 'Quantity', dataIndex: 'quantity', key: 'quantity', align: 'right' },
  ];
  
  const doctorColumns = [
    { title: 'Doctor Name', dataIndex: 'name', key: 'name' },
    { title: 'Designation', dataIndex: 'designation', key: 'designation' },
    { title: 'Experience (Yrs)', dataIndex: 'experience_years', key: 'exp', align: 'right' },
    { title: 'Type', dataIndex: 'doctor_type', key: 'type' },
  ];

  return (
    <div className="capability-dashboard">
      <Title level={2}>Individual Hospital Capability Assessment</Title>
      
      <Select
        showSearch
        placeholder="Select a hospital to assess..."
        style={{ width: '100%', marginBottom: 24 }}
        onChange={value => setSelectedHospitalId(value)}
        filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
        loading={loading && hospitals.length === 0}
      >
        {hospitals.map(h => <Option key={h.id} value={h.id}>{h.name}</Option>)}
      </Select>

      {loading && <div className="loading-container"><Spin size="large" /></div>}
      {error && <Alert message="Error" description={error} type="error" showIcon />}
      {!selectedHospitalId && !loading && <Card><Empty description="Please select a hospital to view its capability report." /></Card>}

      {hospitalData && capabilityScore && (
        <Tabs 
          defaultActiveKey="overview" 
          className="capability-tabs"
          items={[
            {
              key: "overview",
              label: "Overview",
              children: (
                <div className="overview-container">
                  {/* Main Score Card - Fixed Position */}
                  <div className="main-score-section">
                    <Card className="primary-score-card">
                      <div className="score-content">
                        <div className="score-header">Overall Capability Score</div>
                        <div className="score-value">{capabilityScore.overallScore}</div>
                        <div className="score-suffix">/ 100</div>
                        <Progress 
                          percent={capabilityScore.overallScore} 
                          showInfo={false} 
                          strokeWidth={8}
                          className="score-progress"
                        />
                        <div className="score-grade">Grade: {capabilityScore.grade}</div>
                      </div>
                    </Card>
                  </div>

                  {/* KPI Cards Grid - Center Aligned */}
                  <div className="kpi-cards-section">
                    <div className="kpi-cards-container">
                      <div className="kpi-card">
                        <Card className="stat-card">
                          <div className="stat-content">
                            <div className="stat-icon">
                              <MedicineBoxOutlined />
                            </div>
                            <div className="stat-info">
                              <div className="stat-title">Specialties</div>
                              <div className="stat-value">{hospitalData.specialties.length}</div>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <div className="kpi-card">
                        <Card className="stat-card">
                          <div className="stat-content">
                            <div className="stat-icon">
                              <ExperimentOutlined />
                            </div>
                            <div className="stat-info">
                              <div className="stat-title">Equipment</div>
                              <div className="stat-value">{hospitalData.equipment.length}</div>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <div className="kpi-card">
                        <Card className="stat-card">
                          <div className="stat-content">
                            <div className="stat-icon">
                              <TeamOutlined />
                            </div>
                            <div className="stat-info">
                              <div className="stat-title">Doctors</div>
                              <div className="stat-value">{hospitalData.doctors.length}</div>
                            </div>
                          </div>
                        </Card>
                      </div>

                      <div className="kpi-card">
                        <Card className="stat-card">
                          <div className="stat-content">
                            <div className="stat-icon">
                              <RiseOutlined />
                            </div>
                            <div className="stat-info">
                              <div className="stat-title">Infra Score</div>
                              <div className="stat-value">{capabilityScore.categoryScores.infrastructure}</div>
                              <div className="stat-suffix">/ 100</div>
                            </div>
                          </div>
                        </Card>
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: "specialties",
              label: "Medical Specialties",
              children: <Table dataSource={hospitalData.specialties} columns={specialtyColumns} rowKey="id" pagination={{ pageSize: 8 }} />
            },
            {
              key: "equipment", 
              label: "Equipment",
              children: <Table dataSource={hospitalData.equipment} columns={equipmentColumns} rowKey="id" pagination={{ pageSize: 8 }} />
            },
            {
              key: "staffing",
              label: "Staffing", 
              children: <Table dataSource={hospitalData.doctors} columns={doctorColumns} rowKey="id" pagination={{ pageSize: 8 }} />
            }
          ]}
        />
      )}
    </div>
  );
};

export default Q09_HospitalCapabilityAssessment;
