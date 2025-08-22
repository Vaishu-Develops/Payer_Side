import React, { useState, useEffect, useMemo } from 'react';
import { Card, Col, Row, Spin, Alert, Typography, Input, Table, Empty } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { UsergroupAddOutlined, MedicineBoxOutlined } from '@ant-design/icons';
import { fetchSpecialtyData } from '../../../services/specialtyService';
import { processSpecialtyDistribution, identifyGaps } from '../../../utils/specialtyUtils';
import './styles/Q07_DoctorSpecialtyDistribution.css';

const { Title, Text } = Typography;
const { Search } = Input;

const Q07_DoctorSpecialtyDistribution = () => {
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { specialties, doctors, hospitals } = await fetchSpecialtyData();
        const data = processSpecialtyDistribution(specialties, doctors, hospitals);
        setProcessedData(data);
      } catch (err) {
        setError('Failed to fetch or process specialty data. Please try again.');
        console.error("Error loading specialty data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    if (!searchTerm) return processedData;
    return processedData.filter(item =>
      item.specialty.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedData, searchTerm]);

  const gapData = useMemo(() => identifyGaps(processedData), [processedData]);

  const gapColumns = [
    { title: 'Underserved Specialty', dataIndex: 'specialty', key: 'specialty', sorter: (a, b) => a.specialty.localeCompare(b.specialty) },
    { title: 'Total Doctors', dataIndex: 'doctorCount', key: 'doctorCount', sorter: (a, b) => a.doctorCount - b.doctorCount, width: 150 },
    { title: 'Hospital Coverage', dataIndex: 'coveragePercentage', key: 'coveragePercentage', sorter: (a, b) => a.coveragePercentage - b.coveragePercentage, render: (text) => `${text}%`, width: 180 },
  ];

  if (loading) {
    return <div className="loading-container"><Spin size="large" tip="Analyzing Specialty Data..." /></div>;
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  return (
    <div className="specialty-dashboard">
      <Title level={2}>Doctor Specialty Distribution</Title>
      
      {processedData.length > 0 ? (
        <>
          <Card style={{ marginBottom: 24 }}>
            <Search
              placeholder="Filter specialties..."
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Card>

          <Card title="Doctor Count by Specialty">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={filteredData.slice(0, 15)} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="specialty" type="category" width={150} interval={0} />
                <Tooltip cursor={{fill: '#f5f5f5'}} />
                <Legend />
                <Bar dataKey="doctorCount" name="Number of Doctors" fill="#1890ff" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          
          <Card title="Gap Analysis: Underserved Specialties" style={{ marginTop: 24 }}>
            <Table
              dataSource={gapData}
              columns={gapColumns}
              rowKey="specialty"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </>
      ) : (
        <Card><Empty description="No specialty data available to display." /></Card>
      )}
    </div>
  );
};

export default Q07_DoctorSpecialtyDistribution;
