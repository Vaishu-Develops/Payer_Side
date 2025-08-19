import React from 'react';
import { Card, Row, Col, Progress, Alert, List, Tag } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpOutlined, ArrowDownOutlined, ExclamationCircleOutlined } from '@ant-design/icons';

const BedCapacityPrediction = ({ predictions, trendData, systemMetrics }) => {
  // Generate prediction data for the next 7 days
  const generatePredictionData = () => {
    const predictionData = [...trendData];
    const lastOccupancy = trendData[trendData.length - 1]?.occupancy || 0.8;
    const trend = predictions.nextWeekOccupancy - systemMetrics.overallOccupancy;
    
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      const predictedOccupancy = Math.max(0.5, Math.min(1.0, 
        lastOccupancy + (trend * i / 7) + (Math.random() - 0.5) * 0.05
      ));
      
      predictionData.push({
        date: date.toISOString().split('T')[0],
        occupancy: predictedOccupancy,
        isPrediction: true,
        admissions: Math.floor(Math.random() * 50 + 20),
        discharges: Math.floor(Math.random() * 45 + 18)
      });
    }
    
    return predictionData;
  };

  const predictionData = generatePredictionData();
  
  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return '#f5222d';
      case 'medium': return '#faad14';
      case 'low': return '#52c41a';
      default: return '#1890ff';
    }
  };

  const getRiskIcon = (level) => {
    switch (level) {
      case 'high': return <ExclamationCircleOutlined style={{ color: '#f5222d' }} />;
      case 'medium': return <ArrowUpOutlined style={{ color: '#faad14' }} />;
      case 'low': return <ArrowDownOutlined style={{ color: '#52c41a' }} />;
      default: return <ArrowUpOutlined />;
    }
  };

  return (
    <div className="prediction-dashboard">
      <Row gutter={[16, 16]}>
        {/* Prediction Overview */}
        <Col xs={24} lg={8}>
          <Card title="7-Day Forecast" className="prediction-card">
            <div className="prediction-metric">
              <div className="metric-header">
                <span>Predicted Occupancy</span>
                {getRiskIcon(predictions.riskLevel)}
              </div>
              <div className="metric-value">
                {Math.round(predictions.nextWeekOccupancy * 100)}%
              </div>
              <Progress 
                percent={predictions.nextWeekOccupancy * 100}
                strokeColor={getRiskColor(predictions.riskLevel)}
                showInfo={false}
              />
              <div className="risk-level">
                <Tag color={getRiskColor(predictions.riskLevel)}>
                  {predictions.riskLevel.toUpperCase()} RISK
                </Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Trend Analysis */}
        <Col xs={24} lg={16}>
          <Card title="Occupancy Trend & Prediction" className="trend-card">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 1]} tickFormatter={(value) => `${Math.round(value * 100)}%`} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${Math.round(value * 100)}%`, 
                    name === 'occupancy' ? 'Occupancy Rate' : name
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#1890ff" 
                  strokeWidth={2}
                  dot={(props) => {
                    const { payload } = props;
                    return (
                      <circle
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill={payload.isPrediction ? '#faad14' : '#1890ff'}
                        stroke={payload.isPrediction ? '#faad14' : '#1890ff'}
                        strokeWidth={2}
                      />
                    );
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
            <div className="legend">
              <span className="legend-item">
                <span className="legend-dot historical"></span>
                Historical Data
              </span>
              <span className="legend-item">
                <span className="legend-dot predicted"></span>
                Predicted Data
              </span>
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* Recommendations */}
        <Col xs={24} lg={12}>
          <Card title="Recommended Actions" className="recommendations-card">
            <List
              dataSource={predictions.recommendedActions}
              renderItem={(item, index) => (
                <List.Item>
                  <div className="recommendation-item">
                    <span className="recommendation-number">{index + 1}</span>
                    <span className="recommendation-text">{item}</span>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Risk Assessment */}
        <Col xs={24} lg={12}>
          <Card title="Risk Assessment" className="risk-card">
            <div className="risk-assessment">
              <div className="risk-item">
                <span className="risk-label">Current Risk Level:</span>
                <Tag color={getRiskColor(predictions.riskLevel)} size="large">
                  {predictions.riskLevel.toUpperCase()}
                </Tag>
              </div>
              
              <div className="risk-factors">
                <h4>Risk Factors:</h4>
                <ul>
                  {systemMetrics.overallOccupancy > 0.9 && (
                    <li>High overall occupancy rate ({Math.round(systemMetrics.overallOccupancy * 100)}%)</li>
                  )}
                  {systemMetrics.criticalAlerts > 0 && (
                    <li>{systemMetrics.criticalAlerts} departments at critical capacity</li>
                  )}
                  {systemMetrics.availableBeds < 100 && (
                    <li>Low available bed count ({systemMetrics.availableBeds} beds)</li>
                  )}
                  {predictions.nextWeekOccupancy > systemMetrics.overallOccupancy && (
                    <li>Increasing occupancy trend predicted</li>
                  )}
                </ul>
              </div>

              {predictions.riskLevel === 'high' && (
                <Alert
                  message="High Risk Alert"
                  description="Immediate action required to prevent capacity overflow. Consider activating emergency protocols."
                  type="error"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
              
              {predictions.riskLevel === 'medium' && (
                <Alert
                  message="Medium Risk Warning"
                  description="Monitor capacity closely and prepare contingency plans."
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default BedCapacityPrediction;