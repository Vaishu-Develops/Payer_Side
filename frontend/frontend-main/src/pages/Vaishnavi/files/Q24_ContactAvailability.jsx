import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Table, Tag, Typography, Spin, Progress } from 'antd';
import { CheckOutlined, CloseOutlined, PhoneOutlined, TeamOutlined, AlertOutlined } from '@ant-design/icons';
import useContactAnalysis from '../../../hooks/useContactAnalysis';
import './Q24_ContactAvailability.css';

const { Title, Text } = Typography;

const ContactAvailability = () => {
  const { data, loading, error } = useContactAnalysis();
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (data) {
      // Trigger animation after component mounts
      const timer = setTimeout(() => {
        setShowAnimation(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [data]);

  if (loading) return (
    <div className="kpi-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px', color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px' }}>
          Loading contact data...
        </div>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="kpi-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.9)' }}>
        <AlertOutlined style={{ fontSize: '48px', color: '#EF4444', marginBottom: '16px' }} />
        <div style={{ fontSize: '18px' }}>Error: {error}</div>
      </div>
    </div>
  );

  const completionPercentage = Math.round(
    (data.totalComplete / data.totalHospitals) * 100
  );
  const missingContacts = data.totalHospitals - data.totalComplete;

  const columns = [
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
      width: '40%',
      render: (name) => <Text strong>{name}</Text>
    },
    {
      title: 'Administrator',
      dataIndex: 'hasAdmin',
      key: 'admin',
      align: 'center',
      render: (hasAdmin) => (
        hasAdmin ? 
          <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} /> :
          <CloseOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
      )
    },
    {
      title: 'Medical Director',
      dataIndex: 'hasMedical', 
      key: 'medical',
      align: 'center',
      render: (hasMedical) => (
        hasMedical ? 
          <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} /> :
          <CloseOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
      )
    },
    {
      title: 'Emergency Contact',
      dataIndex: 'hasEmergency',
      key: 'emergency', 
      align: 'center',
      render: (hasEmergency) => (
        hasEmergency ? 
          <CheckOutlined style={{ color: '#52c41a', fontSize: '16px' }} /> :
          <CloseOutlined style={{ color: '#f5222d', fontSize: '16px' }} />
      )
    },
    {
      title: 'Status',
      key: 'status',
      align: 'center',
      render: (_, record) => (
        <Tag className={`glass-tag ${record.isComplete ? 'success' : 'error'}`}>
          {record.isComplete ? 'Complete' : 'Incomplete'}
        </Tag>
      )
    }
  ];

  return (
    <div className="kpi-container">
      <Title level={2} className="kpi-title fade-in">Contact Availability Matrix</Title>
      
      {/* KPI Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
        <Col xs={24} sm={8} className="fade-in" style={{ animationDelay: '0.1s' }}>
          <Card className="advanced-kpi-card">
            <div className="kpi-content">
              <div className="advanced-progress-wrapper">
                <Progress
                  type="circle"
                  percent={showAnimation ? completionPercentage : 0}
                  status="active"
                  strokeColor={{
                    '0%': completionPercentage === 100 ? '#10b981' : completionPercentage > 70 ? '#f59e0b' : '#ef4444',
                    '100%': completionPercentage === 100 ? '#059669' : completionPercentage > 70 ? '#d97706' : '#dc2626'
                  }}
                  strokeWidth={6}
                  size={80}
                />
              </div>
              <Title level={4} className="kpi-label">Completion Rate</Title>
              <Text className="kpi-subtitle">{completionPercentage}% Complete</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} className="fade-in" style={{ animationDelay: '0.2s' }}>
          <Card className="advanced-kpi-card">
            <div className="kpi-content">
              <TeamOutlined className="kpi-icon success" />
              <Title level={4} className="kpi-label">Complete Hospitals</Title>
              <Title level={2} className="kpi-value">{data.totalComplete}</Title>
              <Text className="kpi-subtitle">out of {data.totalHospitals}</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} className="fade-in" style={{ animationDelay: '0.3s' }}>
          <Card className="advanced-kpi-card">
            <div className="kpi-content">
              <AlertOutlined className="kpi-icon error" />
              <Title level={4} className="kpi-label">Missing Contacts</Title>
              <Title level={2} className="kpi-value">{missingContacts}</Title>
              <Text className="kpi-subtitle">need attention</Text>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Requirements */}
      <Card className="requirements-card slide-in">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Text className="requirement-text">Required Contact Types:</Text>
          <Tag className="requirement-tag">
            <PhoneOutlined /> Administrator
          </Tag>
          <Tag className="requirement-tag">
            <TeamOutlined /> Medical Director
          </Tag>
          <Tag className="requirement-tag">
            <AlertOutlined /> Emergency Contact
          </Tag>
        </div>
      </Card>

      {/* Contact Matrix Table */}
      <Card className="advanced-table-card slide-in" style={{ animationDelay: '0.4s' }}>
        <Table 
          columns={columns}
          dataSource={data.hospitals}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
            showQuickJumper: true,
            hideOnSinglePage: data.hospitals.length <= 10,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} hospitals`
          }}
          scroll={{ x: 'max-content' }}
        />
      </Card>

      {/* Summary */}
      <Card className="summary-card fade-in" style={{ animationDelay: '0.5s' }}>
        <Text className="summary-text">
          <strong>Summary:</strong> {completionPercentage}% Complete ({data.totalComplete}/{data.totalHospitals} hospitals) | 
          {missingContacts > 0 ? ` ${missingContacts} hospitals need contact updates` : ' All hospitals have complete contact information'}
        </Text>
      </Card>
    </div>
  );
};

export default ContactAvailability;