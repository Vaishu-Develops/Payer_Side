import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Spin, Alert, Typography, Input, Radio, Tag, Statistic, Empty } from 'antd';
import { PhoneOutlined, CheckCircleOutlined, CloseCircleOutlined, PercentageOutlined } from '@ant-design/icons';
import { fetchEmergencyContacts } from '../../../services/emergencyContactService';
import { filterContacts, calculateSummaryStats } from '../../../utils/emergencyContactUtils';
import './styles/Q03_EmergencyContactAvailability.css';

const { Title, Text } = Typography;
const { Search } = Input;

// A reusable card component for displaying a single contact
const ContactCard = ({ contact }) => {
  const isAvailable = contact.is_active;
  
  return (
    <Card 
      className={`contact-card ${isAvailable ? 'available' : 'unavailable'}`} 
      hoverable
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
    >
      <div className="card-header">
        <Title level={5} className="hospital-name">{contact.hospital_name}</Title>
        <Tag color={isAvailable ? 'success' : 'error'}>
          {isAvailable ? '24x7 Available' : 'Unavailable'}
        </Tag>
      </div>
      <div className="card-body">
        <Text className="emergency-label" style={{ color: '#0d5cb6', fontWeight: 600 }}>{contact.department || 'Emergency Department'}</Text>
        <div className="phone-info">
          <PhoneOutlined />
          <Text strong>{contact.mobile || contact.phone || 'Not Available'}</Text>
        </div>
      </div>
    </Card>
  );
};

const Q03_EmergencyContactAvailability = () => {
  const [allContacts, setAllContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchEmergencyContacts();
        setAllContacts(data);
      } catch (err) {
        setError('Failed to load emergency contact information. Please try again later.');
        console.error('Error in Q03 component:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Memoize the filtered contacts
  const filteredContacts = useMemo(
    () => filterContacts(allContacts, searchTerm, statusFilter),
    [allContacts, searchTerm, statusFilter]
  );
  
  // Memoize summary stats
  const summary = useMemo(() => calculateSummaryStats(allContacts), [allContacts]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading Contact Data..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <div className="contact-dashboard-container">
      <Title level={2} style={{ marginBottom: 24 }}>Emergency Contact Availability</Title>
      
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }} align="stretch">
        {/* Total Hospitals */}
        <Col xs={24} sm={8} style={{ display: 'flex' }}>
          <Card className="summary-card" style={{ width: '100%', textAlign: 'center' }}>
            <Statistic 
              title={
                <span style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#444444',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  Total Hospitals with Emergency Contacts
                </span>
              }
              value={summary.total} 
              prefix={<PhoneOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1a1a1a', fontWeight: 700, fontSize: '32px' }}
            />
          </Card>
        </Col>

        {/* 24x7 Available */}
        <Col xs={24} sm={8} style={{ display: 'flex' }}>
          <Card className="summary-card" style={{ width: '100%', textAlign: 'center' }}>
            <Statistic 
              title={
                <span style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#444444',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  24x7 Available
                </span>
              }
              value={summary.available} 
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a', fontWeight: 700, fontSize: '32px' }}
            />
          </Card>
        </Col>

        {/* Availability Coverage */}
        <Col xs={24} sm={8} style={{ display: 'flex' }}>
          <Card className="summary-card" style={{ width: '100%', textAlign: 'center' }}>
            <Statistic 
              title={
                <span style={{
                  fontSize: '16px',
                  fontWeight: 500,
                  color: '#444444',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
                }}>
                  Availability Coverage
                </span>
              }
              value={summary.coverage} 
              prefix={<PercentageOutlined style={{ color: '#faad14' }} />}
              valueStyle={{ color: '#faad14', fontWeight: 650, fontSize: '32px' }}
            />
          </Card>
        </Col>
      </Row>

      <Card className="filter-card" style={{ marginBottom: 32, borderRadius: 8, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.09)' }}>
        <Row align="middle" gutter={[24, 16]}>
          <Col xs={24} md={12}>
            <Search
              placeholder="Search by hospital name..."
              onSearch={value => setSearchTerm(value)}
              onChange={e => setSearchTerm(e.target.value)}
              enterButton
              allowClear
              size="large"
            />
          </Col>
          <Col xs={24} md={12}>
            <Radio.Group 
              onChange={e => setStatusFilter(e.target.value)} 
              value={statusFilter}
              size="large"
              buttonStyle="solid"
            >
              <Radio.Button value="all">All</Radio.Button>
              <Radio.Button value="available">24x7 Available</Radio.Button>
              <Radio.Button value="unavailable">Unavailable</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>
      
      <Row gutter={[24, 24]} align="stretch">
        {filteredContacts.length > 0 ? (
          filteredContacts.map(contact => (
            <Col key={contact.id} xs={24} sm={12} lg={8} style={{ display: 'flex' }}>
              <ContactCard contact={contact} />
            </Col>
          ))
        ) : (
          <Col span={24}>
            <Empty description="No emergency contacts match your criteria." />
          </Col>
        )}
      </Row>
    </div>
  );
};

export default Q03_EmergencyContactAvailability;
