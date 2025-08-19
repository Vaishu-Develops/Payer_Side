import React, { useState, useEffect } from 'react';
import { Table, Card, Input, Select, Space, Tag, Button, Alert } from 'antd';
import { SearchOutlined, BankOutlined, ReloadOutlined } from '@ant-design/icons';
import { getHospitals } from '../../../services/hospitalService';

const { Option } = Select;

const Q01_HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Fetching hospitals data from backend...');
      
      const response = await getHospitals();
      console.log('✅ Hospital data received:', response);
      
      // Handle both response.data.hospitals and response.data formats
      const hospitalData = response.data.hospitals || response.data || [];
      
      if (Array.isArray(hospitalData)) {
        console.log(`✅ Successfully loaded ${hospitalData.length} hospitals`);
        setHospitals(hospitalData);
      } else {
        console.error('❌ Hospital data is not an array:', hospitalData);
        setHospitals([]);
        setError('Received invalid hospital data format');
      }
    } catch (error) {
      console.error('❌ Error fetching hospitals:', error);
      setError(`Failed to load hospitals: ${error.message}`);
      // Set empty array as fallback
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter hospitals based on search and filters
  const filteredHospitals = (hospitals || []).filter(hospital => {
    const matchesSearch = hospital.name?.toLowerCase().includes(searchText.toLowerCase()) ||
                         (hospital.city && hospital.city.toLowerCase().includes(searchText.toLowerCase())) ||
                         (hospital.location && hospital.location.toLowerCase().includes(searchText.toLowerCase()));
    const matchesCity = !cityFilter || hospital.city === cityFilter || hospital.location?.includes(cityFilter);
    const matchesType = !typeFilter || hospital.hospital_type === typeFilter || hospital.type === typeFilter;
    
    return matchesSearch && matchesCity && matchesType;
  });

  // Get unique cities and types for filters
  const uniqueCities = [...new Set(hospitals.map(h => h.city).filter(Boolean))];
  const uniqueTypes = [...new Set(hospitals.map(h => h.hospital_type).filter(Boolean))];

  const columns = [
    {
      title: 'Hospital Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text) => (
        <Space>
          <BankOutlined style={{ color: '#1890ff' }} />
          <strong>{text}</strong>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'hospital_type',
      key: 'hospital_type',
      render: (type) => {
        const colors = {
          'Multi Specialty': 'blue',
          'Super Specialty': 'green',
          'Government': 'orange',
          'District': 'purple'
        };
        return <Tag color={colors[type] || 'default'}>{type}</Tag>;
      },
    },
    {
      title: 'Beds Registered',
      dataIndex: 'beds_registered',
      key: 'beds_registered',
      sorter: (a, b) => (a.beds_registered || 0) - (b.beds_registered || 0),
      render: (beds) => <strong>{beds || 'N/A'}</strong>,
    },
    {
      title: 'Beds Operational',
      dataIndex: 'beds_operational',
      key: 'beds_operational',
      sorter: (a, b) => (a.beds_operational || 0) - (b.beds_operational || 0),
      render: (operational, record) => {
        if (!operational || !record.beds_registered) {
          return <span>{operational || 'N/A'}</span>;
        }
        
        const percentage = Math.round((operational / record.beds_registered) * 100);
        
        // Simple color logic based on percentage
        let color = 'red'; // Default color for low occupancy
        if (percentage >= 85) {
          color = 'green'; // High occupancy
        } else if (percentage >= 70) {
          color = 'orange'; // Medium occupancy
        }
        
        return (
          <Space direction="vertical" size={0}>
            <span>{operational}</span>
            <Tag color={color}>
              {percentage}% operational
            </Tag>
          </Space>
        );
      },
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      sorter: (a, b) => (a.city || '').localeCompare(b.city || ''),
    },
    {
      title: 'State',
      dataIndex: 'state',
      key: 'state',
    },
  ];

  return (
    <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        title={
          <Space>
            <BankOutlined />
            <span>Question 1: Hospital List with Basic Information</span>
          </Space>
        }
        extra={
          <Button 
            icon={<ReloadOutlined />} 
            onClick={fetchHospitals}
            loading={loading}
          >
            Refresh
          </Button>
        }
        style={{ marginBottom: '16px' }}
      >
        {error && (
          <Alert 
            message="Error" 
            description={error}
            type="error" 
            showIcon 
            style={{ marginBottom: '16px' }}
            action={
              <Button size="small" type="primary" onClick={fetchHospitals}>
                Retry
              </Button>
            }
          />
        )}
        {/* Filters */}
        <Space size="middle" style={{ marginBottom: '16px', flexWrap: 'wrap' }}>
          <Input
            placeholder="Search hospitals or cities..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            style={{ width: 300 }}
            allowClear
          />
          
          <Select
            placeholder="Filter by City"
            value={cityFilter}
            onChange={setCityFilter}
            style={{ width: 200 }}
            allowClear
          >
            {uniqueCities.map(city => (
              <Option key={city} value={city}>{city}</Option>
            ))}
          </Select>
          
          <Select
            placeholder="Filter by Type"
            value={typeFilter}
            onChange={setTypeFilter}
            style={{ width: 200 }}
            allowClear
          >
            {uniqueTypes.map(type => (
              <Option key={type} value={type}>{type}</Option>
            ))}
          </Select>
        </Space>

        {/* Summary */}
        <div style={{ marginBottom: '16px' }}>
          <Space wrap>
            <Tag color="blue">Total: {hospitals.length}</Tag>
            <Tag color="green">Filtered: {filteredHospitals.length}</Tag>
            
            {/* Calculate total beds and operational beds */}
            {(() => {
              const totalBeds = filteredHospitals.reduce((sum, h) => sum + (h.beds_registered || 0), 0);
              const operationalBeds = filteredHospitals.reduce((sum, h) => sum + (h.beds_operational || 0), 0);
              const occupancyRate = totalBeds ? Math.round((operationalBeds / totalBeds) * 100) : 0;
              
              // Simple color logic for occupancy rate
              let occupancyColor = 'red';
              if (occupancyRate >= 85) {
                occupancyColor = 'green';
              } else if (occupancyRate >= 70) {
                occupancyColor = 'orange';
              } else if (occupancyRate >= 50) {
                occupancyColor = 'gold';
              }
              
              return (
                <>
                  <Tag color="purple">Total Beds: {totalBeds.toLocaleString()}</Tag>
                  <Tag color="cyan">Operational Beds: {operationalBeds.toLocaleString()}</Tag>
                  <Tag color={occupancyColor}>Overall Occupancy: {occupancyRate}%</Tag>
                </>
              );
            })()}
          </Space>
        </div>

        {/* Table */}
        <Table
          columns={columns}
          dataSource={filteredHospitals}
          loading={loading}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} hospitals`,
          }}
          scroll={{ x: 1000 }}
          size="middle"
        />
      </Card>
    </div>
  );
};

export default Q01_HospitalList;