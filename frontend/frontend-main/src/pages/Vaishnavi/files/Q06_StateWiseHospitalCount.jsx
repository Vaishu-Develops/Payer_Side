import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, Typography, Row, Col, Radio, Select, Table, Spin, Alert } from 'antd';
import { BarChartOutlined, PieChartOutlined, SortAscendingOutlined, SortDescendingOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const Q06_StateWiseHospitalCount = () => {
  // State management
  const [addressData, setAddressData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewType, setViewType] = useState('bar');
  const [sortBy, setSortBy] = useState('count');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Import API service
        const { default: api } = await import('../../../services/api');
        
        // Fetch state distribution data from API
        const stateResponse = await api.get('/analytics/hospitals-by-state');
        const stateData = stateResponse.data;

        setAddressData(stateData.state_distribution);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Process data to get state-wise counts
  const processData = () => {
    if (!addressData || !Array.isArray(addressData) || !addressData.length) return [];

    // The addressData now contains state distribution data directly from API
    let result = addressData.map(stateInfo => ({
      state: stateInfo.state,
      count: stateInfo.hospital_count,
      beds: stateInfo.total_beds || stateInfo.operational_beds || 0
    }));
    
    // Sorting logic
    result.sort((a, b) => {
      const order = sortOrder === 'desc' ? -1 : 1;
      if (sortBy === 'count') {
        return order * (b.count - a.count);
      } else if (sortBy === 'beds') {
        return order * (b.beds - a.beds);
      } else {
        return order * a.state.localeCompare(b.state);
      }
    });

    return result;
  };

  const processedData = processData();

  // Calculate totals
  const totalHospitals = processedData.reduce((sum, item) => sum + item.count, 0);
  const totalStates = processedData.length;
  const totalBeds = processedData.reduce((sum, item) => sum + item.beds, 0);

  // Color scheme
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <Spin size="large" />
    </div>
  );
  
  if (error) return (
    <div style={{ padding: '20px' }}>
      <Alert message="Error" description={error} type="error" showIcon />
    </div>
  );

  return (
    <div style={{ padding: '20px' }}>
      <Title level={2}>State-wise Hospital Distribution</Title>
      
      {/* KPI Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Total Hospitals</Text>
            <Title level={3} style={{ margin: '8px 0 0 0' }}>{totalHospitals}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">States Covered</Text>
            <Title level={3} style={{ margin: '8px 0 0 0' }}>{totalStates}</Title>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card>
            <Text type="secondary">Total Beds</Text>
            <Title level={3} style={{ margin: '8px 0 0 0' }}>{totalBeds.toLocaleString()}</Title>
          </Card>
        </Col>
      </Row>

      {/* View and Sort Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <Radio.Group
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          buttonStyle="solid"
        >
          <Radio.Button value="bar">
            <BarChartOutlined /> Bar Chart
          </Radio.Button>
          <Radio.Button value="pie">
            <PieChartOutlined /> Pie Chart
          </Radio.Button>
        </Radio.Group>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Select
            value={sortBy}
            onChange={(value) => setSortBy(value)}
            style={{ width: 120 }}
          >
            <Option value="count">Count</Option>
            <Option value="beds">Beds</Option>
            <Option value="name">Name</Option>
          </Select>
          <Radio.Group
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="asc">
              <SortAscendingOutlined />
            </Radio.Button>
            <Radio.Button value="desc">
              <SortDescendingOutlined />
            </Radio.Button>
          </Radio.Group>
        </div>
      </div>

      {/* Chart */}
      <div style={{ height: '400px', marginBottom: '40px' }}>
        {viewType === 'bar' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={processedData}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="state" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Hospital Count" fill="#0088FE" />
              <Bar dataKey="beds" name="Total Beds" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={processedData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="count"
                nameKey="state"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {processedData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Detailed Table */}
      <Title level={4} style={{ marginTop: '40px', marginBottom: '16px' }}>
        Detailed State-wise Breakdown
      </Title>
      <Table
        dataSource={processedData}
        rowKey="state"
        pagination={
          processedData.length > 10
            ? { pageSize: 10, hideOnSinglePage: true, showSizeChanger: false, showQuickJumper: true }
            : false
        }
        columns={[
          {
            title: 'State',
            dataIndex: 'state',
            key: 'state',
            sorter: (a, b) => a.state.localeCompare(b.state),
          },
          {
            title: 'Hospital Count',
            dataIndex: 'count',
            key: 'count',
            align: 'right',
            sorter: (a, b) => a.count - b.count,
          },
          {
            title: 'Percentage',
            key: 'percentage',
            align: 'right',
            render: (_, record) => `${((record.count / totalHospitals) * 100).toFixed(1)}%`,
          },
          {
            title: 'Total Beds',
            dataIndex: 'beds',
            key: 'beds',
            align: 'right',
            sorter: (a, b) => a.beds - b.beds,
          },
          {
            title: 'Beds Percentage',
            key: 'bedsPercentage',
            align: 'right',
            render: (_, record) => `${((record.beds / totalBeds) * 100).toFixed(1)}%`,
          },
        ]}
      />
    </div>
  );
};

export default Q06_StateWiseHospitalCount;
