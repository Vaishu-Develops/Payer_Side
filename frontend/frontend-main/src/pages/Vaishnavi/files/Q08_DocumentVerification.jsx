import React from 'react';
import { Card, Row, Col, Spin, Badge, Typography, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import useDocumentStats from '../../../hooks/useDocumentStats';
import { calculateCompletion, getStatusBadge } from '../../../utils/documentUtils';

const { Title, Text } = Typography;

const DocumentVerification = () => {
  const { stats, loading, error } = useDocumentStats();

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <Spin size="large">
        <div style={{ padding: '40px' }}>Loading document status...</div>
      </Spin>
    </div>
  );
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="document-verification" style={{ padding: '20px' }}>
      <Title level={2}>Document Verification Status</Title>
      
      <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <CheckCircleOutlined style={{ fontSize: '28px', color: '#52c41a' }} />
              <Title level={4}>Verified Documents</Title>
              <Title level={2}>{stats.totalVerified}</Title>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <ClockCircleOutlined style={{ fontSize: '28px', color: '#faad14' }} />
              <Title level={4}>Pending Documents</Title>
              <Title level={2}>{stats.totalPending}</Title>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <WarningOutlined style={{ fontSize: '28px', color: '#f5222d' }} />
              <Title level={4}>Rejected Documents</Title>
              <Title level={2}>{stats.totalRejected}</Title>
            </div>
          </Card>
        </Col>
      </Row>

      <div>
        {stats.hospitals.map(hospital => {
          const completion = calculateCompletion(hospital);
          const status = getStatusBadge(completion);
          
          return (
            <Card key={hospital.id} style={{ marginBottom: '16px' }}>
              <Title level={4}>{hospital.name}</Title>
              <Progress 
                percent={completion} 
                status={completion === 100 ? 'success' : 'active'} 
                strokeColor={status.color === 'green' ? '#52c41a' : status.color === 'orange' ? '#faad14' : '#f5222d'}
              />
              <Badge 
                status={status.color === 'green' ? 'success' : status.color === 'orange' ? 'warning' : 'error'} 
                text={`${status.text} (${completion}%)`}
              />
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DocumentVerification;