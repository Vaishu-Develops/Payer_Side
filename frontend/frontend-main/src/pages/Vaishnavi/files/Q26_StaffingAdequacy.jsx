import React, { useState, useEffect } from "react";
import { Card, Col, Row, Spin, Alert, Typography, Tag, Statistic, Progress, Empty } from "antd";
import { TeamOutlined, UserOutlined, AlertOutlined } from '@ant-design/icons';
import { fetchStaffingData } from "../../../services/staffingService";
import { getStaffingStatus } from "../../../utils/staffingUtils";
import './styles/Q26_StaffingAdequacy.css';

const { Title, Text } = Typography;

// Reusable card component to display staffing details for a single hospital
const StaffingAdequacyCard = ({ data }) => {
  const generalStatus = getStaffingStatus(data.nurse_bed_ratio, 'NURSE_TO_BED');
  const icuStatus = getStaffingStatus(data.icu_nurse_bed_ratio, 'ICU_NURSE_TO_BED');

  return (
    <Card 
      className={`staffing-card status-border-${generalStatus.status}`}
      title={data.name || `Hospital #${data.id}`}
      extra={<Tag color={generalStatus.color}>{generalStatus.label}</Tag>}
      hoverable
    >
      <div className="staffing-card-content">
        <Row gutter={[24, 32]} className="staffing-metrics-row">
          <Col xs={24} sm={12} className="metric-col">
            <div className="metric-wrapper">
              <Statistic
                title="General Nurse-to-Bed Ratio"
                value={data.nurse_bed_ratio ? data.nurse_bed_ratio.toFixed(2) : 'N/A'}
                prefix={<UserOutlined />}
                className="metric-statistic"
              />
            </div>
          </Col>
          <Col xs={24} sm={12} className="metric-col">
            <div className="metric-wrapper">
              <Statistic
                title="ICU Nurse-to-Bed Ratio"
                value={data.icu_nurse_bed_ratio ? data.icu_nurse_bed_ratio.toFixed(2) : 'N/A'}
                prefix={<AlertOutlined />}
                className={`metric-statistic icu-ratio-${icuStatus.status}`}
              />
            </div>
          </Col>
        </Row>
        
        <Row gutter={[24, 32]} className="staffing-metrics-row">
          <Col xs={24} sm={12} className="metric-col">
            <div className="metric-wrapper">
              <Statistic
                title="Total Qualified Nurses"
                value={data.qualified_nurses || 0}
                prefix={<TeamOutlined />}
                className="metric-statistic"
              />
            </div>
          </Col>
          <Col xs={24} sm={12} className="gauge-container">
            <div className="gauge-wrapper">
              <Text type="secondary" className="gauge-title">Overall Adequacy</Text>
              <Progress
                type="dashboard"
                percent={Math.min(100, Math.round((data.nurse_bed_ratio / 1.2) * 100))}
                strokeColor={{ '0%': '#ff4d4f', '50%': '#faad14', '100%': '#52c41a' }}
                format={(percent) => `${percent}%`}
                size={100}
              />
            </div>
          </Col>
        </Row>
      </div>
    </Card>
  );
};


const Q26_StaffingAdequacy = () => {
  const [staffingData, setStaffingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchStaffingData();
        setStaffingData(data);
      } catch (err) {
        setError("Could not load staffing data. The server may be down or the data is unavailable.");
        console.error("Error in Q26_StaffingAdequacy:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading Staffing Dashboard..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }
  
  return (
    <div className="staffing-dashboard-container">
      <Title level={2} style={{ marginBottom: '24px' }}>
        Staffing Adequacy Dashboard
      </Title>

      {staffingData.length > 0 ? (
        <Row gutter={[24, 24]}>
          {staffingData.map((hospitalData) => (
            <Col key={hospitalData.id} xs={24} sm={24} md={12} lg={8}>
              <StaffingAdequacyCard data={hospitalData} />
            </Col>
          ))}
        </Row>
      ) : (
        <Card>
            <Empty description="No staffing data could be processed. Please check the data sources." />
        </Card>
      )}
    </div>
  );
};

export default Q26_StaffingAdequacy;
