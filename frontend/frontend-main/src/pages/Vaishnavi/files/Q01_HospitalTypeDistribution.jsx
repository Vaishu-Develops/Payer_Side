import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Spin, Alert, Typography, Statistic, Empty } from 'antd';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { HomeOutlined, BankOutlined } from '@ant-design/icons';
import { fetchHospitalData } from '../../../services/hospitalTypeService';
import { processHospitalDistribution } from '../../../utils/hospitalTypeUtils';
import './Q01_HospitalTypeDistribution.css';

const { Title } = Typography;

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF', '#FF4560'];

// Custom Tooltip for the Pie Chart
const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const totalHospitals = payload[0].payload.totalHospitals;
    const percentage = ((data.hospitalCount / totalHospitals) * 100).toFixed(1);
    return (
      <div className="custom-tooltip">
        <p className="label">{`${data.name} : ${data.hospitalCount} (${percentage}%)`}</p>
        <p className="desc">{`Total Beds: ${data.totalBeds.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

const Q01_HospitalTypeDistribution = () => {
  const [distributionData, setDistributionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const rawData = await fetchHospitalData();
        const processedData = processHospitalDistribution(rawData);
        setDistributionData(processedData);
      } catch (err) {
        setError('Failed to fetch and process hospital data. Please try again later.');
        console.error("Error loading hospital distribution data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Memoize summary statistics to avoid recalculations on re-render.
  const summaryStats = useMemo(() => {
    if (!distributionData.length) {
      return { totalHospitals: 0, totalBeds: 0 };
    }
    const totalHospitals = distributionData.reduce((sum, item) => sum + item.hospitalCount, 0);
    const totalBeds = distributionData.reduce((sum, item) => sum + item.totalBeds, 0);
    return { totalHospitals, totalBeds };
  }, [distributionData]);

  // Add total hospital count to each data point for percentage calculation in tooltip.
  const chartData = useMemo(() => 
    distributionData.map(d => ({ ...d, totalHospitals: summaryStats.totalHospitals })),
    [distributionData, summaryStats.totalHospitals]
  );

  if (loading) {
    return (
      <div className="loading-container">
        <Spin size="large" tip="Loading Hospital Data..." />
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  if (distributionData.length === 0) {
    return <Card><Empty description="No hospital distribution data available to display." /></Card>;
  }

  return (
    <div className="hospital-type-dashboard">
      <Title level={2} style={{ marginBottom: 24 }}>Hospital Type Distribution Analysis</Title>
      
      <Row gutter={[24, 24]} className="summary-stats">
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Total Hospitals" value={summaryStats.totalHospitals} prefix={<HomeOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card>
            <Statistic title="Total Operational Beds" value={summaryStats.totalBeds.toLocaleString()} prefix={<BankOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Distribution by Hospital Count">
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie data={chartData} dataKey="hospitalCount" nameKey="name" cx="50%" cy="50%" outerRadius={150} fill="#8884d8" label>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Distribution by Bed Capacity">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip cursor={{fill: '#f5f5f5'}}/>
                <Legend />
                <Bar dataKey="totalBeds" name="Total Beds" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Q01_HospitalTypeDistribution;
