// src/pages/Vaishnavi/files/Q02_NabhCertifiedHospitals.jsx
import React, { useState, useMemo } from 'react';
import { useNabhData } from '../../../hooks/useNabhData';
import { Card, Row, Col, Input, Select, Typography, Spin, Alert, Empty } from 'antd';
import HospitalCertificationCard from './shared/HospitalCertificationCard';
import './styles/Q02_NabhCertifiedHospitals.css';

const { Title, Text } = Typography;
const { Search } = Input;

const Q02_NabhCertifiedHospitals = () => {
  const { nabhHospitals, loading, error } = useNabhData();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [sortOrder, setSortOrder] = useState('expiry_asc');

  const filteredAndSortedHospitals = useMemo(() => {
    let processed = [...nabhHospitals];

    // Filter by search term
    if (searchTerm) {
      processed = processed.filter(h =>
        h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    // Filter by certification level
    if (filterLevel !== 'All') {
      processed = processed.filter(h => h.level === filterLevel);
    }
    // Sort the data
    processed.sort((a, b) => {
      switch (sortOrder) {
        case 'expiry_desc': return b.statusInfo.daysRemaining - a.statusInfo.daysRemaining;
        case 'name_asc': return a.hospitalName.localeCompare(b.hospitalName);
        case 'name_desc': return b.hospitalName.localeCompare(a.hospitalName);
        case 'expiry_asc': default: return a.statusInfo.daysRemaining - b.statusInfo.daysRemaining;
      }
    });
    return processed;
  }, [nabhHospitals, searchTerm, filterLevel, sortOrder]);

  const certificationLevels = useMemo(() => ['All', ...new Set(nabhHospitals.map(h => h.level))], [nabhHospitals]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="nabh-loading">
          <Spin size="large">
            <div>Loading Certifications...</div>
          </Spin>
        </div>
      );
    }
    if (error) {
      return <Alert message="Error" description={error} type="error" showIcon />;
    }
    if (filteredAndSortedHospitals.length === 0) {
      return <Empty description="No hospitals found matching your criteria." />;
    }
    return (
      <Row gutter={[16, 16]} className="nabh-hospitals-grid">
        {filteredAndSortedHospitals.map(hospital => (
          <Col key={hospital.key} xs={24} sm={12} lg={8} style={{ display: 'flex' }}>
            <HospitalCertificationCard hospital={hospital} />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="nabh-hospitals-container">
      <Title level={2} className="nabh-hospitals-header">NABH Certified Hospitals ({loading ? '...' : filteredAndSortedHospitals.length})</Title>
      <Card className="nabh-hospitals-filters">
        <Row gutter={[16, 16]} align="bottom">
          <Col xs={24} md={10}>
            <Text>Search by Name</Text>
            <Search placeholder="e.g., Apollo, Fortis..." onChange={(e) => setSearchTerm(e.target.value)} allowClear />
          </Col>
          <Col xs={12} md={7}>
            <Text>Filter by Level</Text>
            <Select value={filterLevel} onChange={setFilterLevel} style={{ width: '100%' }}>
              {certificationLevels.map(level => <Select.Option key={level} value={level}>{level}</Select.Option>)}
            </Select>
          </Col>
          <Col xs={12} md={7}>
            <Text>Sort By</Text>
            <Select value={sortOrder} onChange={setSortOrder} style={{ width: '100%' }}>
              <Select.Option value="expiry_asc">Expiry (Soonest First)</Select.Option>
              <Select.Option value="expiry_desc">Expiry (Latest First)</Select.Option>
              <Select.Option value="name_asc">Name (A-Z)</Select.Option>
              <Select.Option value="name_desc">Name (Z-A)</Select.Option>
            </Select>
          </Col>
        </Row>
      </Card>
      {renderContent()}
    </div>
  );
};

export default Q02_NabhCertifiedHospitals;