import React from 'react';
import { Card, Row, Col, Spin, Badge, Typography, Progress } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import useDocumentStats from '../../../hooks/useDocumentStats';
import { calculateCompletion, getStatusBadge } from '../../../utils/documentUtils';
import './styles/Q08_DocumentVerification.css';

const { Title, Text } = Typography;

const DocumentVerification = () => {
  const { stats, loading, error } = useDocumentStats();

  if (loading) return (
    <div className="document-verification-container">
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large">
          <div style={{ padding: '40px' }}>Loading document status...</div>
        </Spin>
      </div>
    </div>
  );
  if (error) return (
    <div className="document-verification-container">
      <div style={{ color: 'red' }}>Error: {error}</div>
    </div>
  );

  return (
    <div className="document-verification-container">
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
        {(stats.hospitals || []).map(hospital => {
          const completion = calculateCompletion(hospital);
          const status = getStatusBadge(completion);
          
          return (
            <Card key={hospital.id} style={{ marginBottom: '16px' }}>
              <Title level={4}>{hospital.name}</Title>
              <Progress 
                percent={completion} 
                status={completion === 100 ? 'success' : 'active'} 
              />
              <Badge 
                status={status.status} 
                text={`${status.text} (${completion}%)`}
              />
              
              {/* Document Details */}
              <div style={{ marginTop: '16px' }}>
                <Row gutter={[8, 8]}>
                  {hospital.documents && Object.entries(hospital.documents).map(([docType, docInfo]) => (
                    <Col key={docType} span={6}>
                      <div style={{ 
                        padding: '8px', 
                        border: '1px solid #d9d9d9', 
                        borderRadius: '4px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '12px', marginBottom: '4px' }}>
                          {docType.charAt(0).toUpperCase() + docType.slice(1)}
                        </div>
                        <Badge 
                          status={docInfo.status === 'verified' ? 'success' : 
                                 docInfo.status === 'pending' ? 'processing' : 'error'} 
                          text={docInfo.status}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Card>
          );
        })}
        
        {(!stats.hospitals || stats.hospitals.length === 0) && (
          <Card>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <Text type="secondary">No hospital document data available</Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DocumentVerification;