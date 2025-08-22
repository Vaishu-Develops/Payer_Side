import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Spin, Alert, Typography, Progress, Tag, Empty } from 'antd';
import { HddOutlined, HeartOutlined, ToolOutlined, RocketOutlined } from '@ant-design/icons';
import { fetchInfrastructureData } from '../../../services/infrastructureService';
import { calculateInfrastructureScore } from '../../../utils/infrastructureUtils';
import './styles/Q05_HospitalInfrastructureScoring.css';

const { Title, Text } = Typography;

// Reusable card for displaying a hospital's infrastructure score
const InfrastructureScoreCard = ({ hospital }) => {
  const { overallScore, categoryScores, grade } = hospital.score;
  
  const gradeColors = { A: 'success', B: 'processing', C: 'warning', D: 'error', F: 'error' };

  return (
    <Card className="score-card" title={hospital.name} extra={<Tag color={gradeColors[grade]}>{`Grade: ${grade}`}</Tag>} hoverable>
      <div className="overall-score-container">
        <Text type="secondary">Overall Score</Text>
        <Title level={2} className="overall-score">{overallScore}<span className="score-suffix">/100</span></Title>
      </div>
      <Row gutter={[16, 16]} className="category-breakdown">
        <Col span={12} className="category-item">
          <HddOutlined />
          <Text>Basic Facilities</Text>
          <Progress percent={categoryScores.basic} />
        </Col>
        <Col span={12} className="category-item">
          <HeartOutlined />
          <Text>Medical Equipment</Text>
          <Progress percent={categoryScores.medical} />
        </Col>
        <Col span={12} className="category-item">
          <ToolOutlined />
          <Text>Support Services</Text>
          <Progress percent={categoryScores.support} />
        </Col>
        <Col span={12} className="category-item">
          <RocketOutlined />
          <Text>Advanced Features</Text>
          <Progress percent={categoryScores.advanced} />
        </Col>
      </Row>
    </Card>
  );
};

const Q05_HospitalInfrastructureScoring = () => {
  const [hospitalData, setHospitalData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchInfrastructureData();
        setHospitalData(data);
      } catch (err) {
        setError('Failed to load hospital infrastructure data. Please check the API and try again.');
        console.error("Error in Q05 component:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  // Memoize the processed data to calculate scores only when raw data changes.
  const scoredData = useMemo(() => {
    return hospitalData
      .map(hospital => ({
        ...hospital,
        score: calculateInfrastructureScore(hospital.infrastructure),
      }))
      .sort((a, b) => b.score.overallScore - a.score.overallScore); // Sort by highest score
  }, [hospitalData]);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Calculating Infrastructure Scores..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <div className="infrastructure-dashboard">
      <Title level={2} style={{ marginBottom: 24 }}>Hospital Infrastructure Scoring</Title>
      
      {scoredData.length > 0 ? (
        <Row gutter={[24, 24]}>
          {scoredData.map(hospital => (
            <Col key={hospital.id} xs={24} sm={24} md={12} lg={8}>
              <InfrastructureScoreCard hospital={hospital} />
            </Col>
          ))}
        </Row>
      ) : (
        <Card><Empty description="No infrastructure data available for scoring." /></Card>
      )}
    </div>
  );
};

export default Q05_HospitalInfrastructureScoring;
