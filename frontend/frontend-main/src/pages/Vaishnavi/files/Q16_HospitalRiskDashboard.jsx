import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Select, Spin, Alert, Typography, Tag, Empty } from 'antd';
import { fetchRiskData } from '../../../services/riskAssessmentService';
import { calculateCertificationRisk, calculateRatioRisk, getRiskAppearance } from '../../../utils/riskUtils';
import './styles/Q16_HospitalRiskDashboard.css';

const { Title, Text } = Typography;
const { Option } = Select;

// A reusable card component for displaying a single risk indicator
const RiskIndicatorCard = ({ title, risk }) => {
  if (!risk) {
    return null;
  }
  const appearance = getRiskAppearance(risk.level);

  return (
    <Card 
      title={title} 
      bordered={false} 
      className={`risk-card risk-card-${risk.level}`}
    >
      <div className="risk-card-content">
        <Tag color={appearance.color} className="risk-tag">
          {appearance.label}
        </Tag>
        <Text type="secondary" className="risk-message">
          {risk.message}
        </Text>
      </div>
    </Card>
  );
};

const Q16_HospitalRiskDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allData, setAllData] = useState({ certifications: [], metrics: [], hospitals: [] });
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const [calculatedRisks, setCalculatedRisks] = useState(null);

  // Fetch data on initial component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await fetchRiskData();
        
        // Defensive check to ensure data is in the expected format
        if (data && data.certifications && data.metrics) {
          setAllData(data);
        } else {
          throw new Error("Received invalid data structure from service.");
        }
      } catch (err) {
        setError("Failed to fetch hospital risk data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Calculate risks whenever the selected hospital changes
  useEffect(() => {
    if (!selectedHospitalId || !allData.metrics.length) {
      setCalculatedRisks(null);
      return;
    }

    const hospitalMetrics = allData.metrics.find(m => m.hospital_id === selectedHospitalId);
    
    // Process risks for the selected hospital
    const risks = {
      certifications: calculateCertificationRisk(allData.certifications, selectedHospitalId),
      doctorRatio: calculateRatioRisk(hospitalMetrics, 'doctor_bed_ratio'),
      nurseRatio: calculateRatioRisk(hospitalMetrics, 'nurse_bed_ratio'),
    };
    setCalculatedRisks(risks);

  }, [selectedHospitalId, allData]);

  // Memoize the list of hospitals to prevent re-computation on every render
  const hospitalOptions = useMemo(() => {
    // Use hospitals data as the primary source, with fallback to certifications
    const hospitalMap = new Map();
    
    // First, add all hospitals from the hospitals data
    if (Array.isArray(allData.hospitals)) {
      allData.hospitals.forEach(hospital => {
        hospitalMap.set(hospital.id, hospital.name);
      });
    }
    
    // Then, add any hospitals from certifications that might be missing
    if (Array.isArray(allData.certifications)) {
      allData.certifications.forEach(cert => {
        if (!hospitalMap.has(cert.hospital_id) && cert.name) {
          hospitalMap.set(cert.hospital_id, cert.name);
        }
      });
    }
    
    // Filter to only show hospitals that have either metrics or certifications data
    const hospitalIds = new Set();
    if (Array.isArray(allData.metrics)) {
      allData.metrics.forEach(metric => hospitalIds.add(metric.hospital_id));
    }
    if (Array.isArray(allData.certifications)) {
      allData.certifications.forEach(cert => hospitalIds.add(cert.hospital_id));
    }
    
    return Array.from(hospitalMap.entries())
      .filter(([id]) => hospitalIds.has(id))
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allData.hospitals, allData.certifications, allData.metrics]);

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <div className="risk-dashboard-container">
      <Spin spinning={loading} size="large" tip="Loading Risk Dashboard...">
        <div className="dashboard-header">
          <Title level={2} className="dashboard-title">Hospital Risk Assessment Dashboard</Title>
          <Text type="secondary" className="dashboard-subtitle">
            Monitor and evaluate key risk indicators for healthcare facilities
          </Text>
        </div>
        
        <Card className="main-dashboard-card">
          <div className="search-section">
            <div className="search-container">
              <label className="search-label">Select Hospital</label>
              <Select
                showSearch
                placeholder="Search for a hospital..."
                className="hospital-search"
                value={selectedHospitalId}
                onChange={(value) => setSelectedHospitalId(value)}
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {hospitalOptions.map(hospital => (
                  <Option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </Option>
                ))}
              </Select>
            </div>
          </div>

          {selectedHospitalId && calculatedRisks ? (
            <div className="risk-assessment-section">
              <Title level={4} className="section-title">Risk Assessment Summary</Title>
              <Row gutter={[16, 16]} className="risk-indicators-row">
                <Col xs={24} sm={24} md={8} className="risk-col">
                  <RiskIndicatorCard title="Certification Status" risk={calculatedRisks.certifications} />
                </Col>
                <Col xs={24} sm={24} md={8} className="risk-col">
                  <RiskIndicatorCard title="Doctor-to-Bed Ratio" risk={calculatedRisks.doctorRatio} />
                </Col>
                <Col xs={24} sm={24} md={8} className="risk-col">
                  <RiskIndicatorCard title="Nurse-to-Bed Ratio" risk={calculatedRisks.nurseRatio} />
                </Col>
              </Row>
            </div>
          ) : (
            <div className="empty-state">
              <Empty 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
                description="Please select a hospital to view the risk assessment"
              />
            </div>
          )}
        </Card>
      </Spin>
    </div>
  );
};

export default Q16_HospitalRiskDashboard;