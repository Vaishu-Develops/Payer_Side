// src/pages/Vaishnavi/files/Q04_EquipmentAvailability.jsx
import React, { useState, useMemo } from 'react';
import { useEquipmentData } from '../../../hooks/useEquipmentData';
import {
  Card,
  Collapse,
  List,
  Typography,
  Spin,
  Alert,
  Input,
  Select,
  Row,
  Col,
  Badge,
  Tag,
  Tooltip,
  Empty,
} from 'antd';
import {
  SearchOutlined,
  ScanOutlined,
  MedicineBoxOutlined,
  HeartOutlined,
  AlertOutlined,
  ExperimentOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import './Q04_EquipmentAvailability.css';
import _ from 'lodash';

const { Title, Text } = Typography;
const { Option } = Select;

const categoryIcons = {
  Diagnostic: <ScanOutlined />,
  Surgery: <MedicineBoxOutlined />,
  'Critical Care': <HeartOutlined />,
  Emergency: <AlertOutlined />,
  Laboratory: <ExperimentOutlined />,
  Cardiac: <ThunderboltOutlined />,
  Default: <MedicineBoxOutlined />,
};

const AvailabilityDots = ({ available, total }) => {
  const dots = [];
  for (let i = 0; i < total; i++) {
    dots.push(
      <div
        key={i}
        className={`availability-dot ${i < available ? 'dot-available' : 'dot-unavailable'}`}
      />
    );
  }
  return <div className="availability-dots">{dots}</div>;
};

const Q04_EquipmentAvailability = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospital, setSelectedHospital] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const {
    allEquipment,
    equipmentStats,
    filteredEquipmentStats,
    hospitals,
    categories,
    totalHospitals,
    filteredTotalHospitals,
    loading,
    error,
  } = useEquipmentData(selectedHospital, selectedCategory);

  const filteredEquipment = useMemo(() => {
    let equipment = [...allEquipment];

    if (selectedHospital !== 'All') {
      equipment = equipment.filter(e => e.hospital_id === selectedHospital);
    }

    if (selectedCategory !== 'All') {
      equipment = equipment.filter(e => e.category === selectedCategory);
    }

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      equipment = equipment.filter(
        e =>
          e.name.toLowerCase().includes(lowerCaseSearch) ||
          e.brand?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    return equipment;
  }, [allEquipment, searchTerm, selectedHospital, selectedCategory]);

  const groupedAndFilteredData = useMemo(() => {
    return _.groupBy(filteredEquipment, 'category');
  }, [filteredEquipment]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large">
          <div style={{ padding: '40px' }}>Loading Medical Equipment Data...</div>
        </Spin>
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" showIcon />;
  }

  const renderPanelHeader = (category) => {
    const equipmentList = groupedAndFilteredData[category] || [];
    const totalEquipmentCount = _.uniqBy(equipmentList, 'name').length;
    
    // Determine which stats to use based on filter selection
    const isFiltered = selectedHospital !== 'All' || selectedCategory !== 'All';
    const statsToUse = isFiltered ? filteredEquipmentStats : equipmentStats;
    const hospitalsCount = isFiltered ? filteredTotalHospitals : totalHospitals;
    
    const hospitalsWithCategory = new Set(
      equipmentList.flatMap(eq => statsToUse[eq.name]?.hospitals || [])
    );

    // Create descriptive text based on filter state
    let availabilityText;
    if (selectedHospital !== 'All' && selectedCategory !== 'All') {
      availabilityText = `Available in selected hospital & category`;
    } else if (selectedHospital !== 'All') {
      const selectedHospitalName = hospitals.find(h => h.id === selectedHospital)?.name || 'Selected Hospital';
      availabilityText = `Available in ${selectedHospitalName}`;
    } else if (selectedCategory !== 'All') {
      availabilityText = `Available in ${hospitalsWithCategory.size}/${hospitalsCount} hospitals (${selectedCategory} category)`;
    } else {
      availabilityText = `Available in ${hospitalsWithCategory.size}/${hospitalsCount} total hospitals`;
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {categoryIcons[category] || categoryIcons.Default}
          <Text strong>{category}</Text>
          <Badge count={totalEquipmentCount} style={{ backgroundColor: '#1890ff' }} />
        </div>
        <Text type="secondary">
          {availabilityText}
        </Text>
      </div>
    );
  };

  return (
    <div className="equipment-management-container">
      <Card className="equipment-header">
        <Title level={4}>Medical Equipment Management</Title>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Search equipment by name or brand..."
              prefix={<SearchOutlined />}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedHospital}
              style={{ width: '100%' }}
              onChange={setSelectedHospital}
            >
              <Option value="All">All Hospitals</Option>
              {hospitals.map(h => <Option key={h.id} value={h.id}>{h.name}</Option>)}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Select
              value={selectedCategory}
              style={{ width: '100%' }}
              onChange={setSelectedCategory}
            >
              <Option value="All">All Categories</Option>
              {categories.map(c => <Option key={c} value={c}>{c}</Option>)}
            </Select>
          </Col>
        </Row>
      </Card>

      {Object.keys(groupedAndFilteredData).length > 0 ? (
        <Collapse 
          defaultActiveKey={categories} 
          accordion={false} 
          className="equipment-category-panel"
          items={Object.keys(groupedAndFilteredData).map(category => ({
            key: category,
            label: renderPanelHeader(category),
            children: (
              <List
                grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 4 }}
                dataSource={_.uniqBy(groupedAndFilteredData[category], 'name')}
                renderItem={item => {
                  const globalStats = equipmentStats[item.name];
                  const filteredStats = filteredEquipmentStats[item.name];
                  
                  if (!globalStats) return null;

                  // Determine which stats to display based on filter selection
                  const isFiltered = selectedHospital !== 'All' || selectedCategory !== 'All';
                  const displayStats = isFiltered ? filteredStats : globalStats;
                  const hospitalCount = isFiltered ? filteredTotalHospitals : totalHospitals;
                  
                  if (!displayStats && isFiltered) return null; // Don't show if not available in filtered context

                  const availabilityPercent = hospitalCount > 0 ? (displayStats.hospitals.length / hospitalCount) * 100 : 0;
                  
                  // Create descriptive tooltip text
                  let tooltipText;
                  let availabilityLabel;
                  
                  if (selectedHospital !== 'All') {
                    const selectedHospitalName = hospitals.find(h => h.id === selectedHospital)?.name || 'Selected Hospital';
                    tooltipText = `Available in ${selectedHospitalName}`;
                    availabilityLabel = "Hospital Coverage";
                  } else if (selectedCategory !== 'All') {
                    tooltipText = `${displayStats.hospitals.length}/${hospitalCount} hospitals in ${selectedCategory} category`;
                    availabilityLabel = "Category Coverage";
                  } else {
                    tooltipText = `${displayStats.hospitals.length}/${hospitalCount} total hospitals`;
                    availabilityLabel = "Global Coverage";
                  }

                  return (
                    <List.Item>
                      <Card hoverable className="equipment-card">
                        <Card.Meta
                          title={<Tooltip title={item.name}>{item.name}</Tooltip>}
                          description={displayStats.brand}
                        />
                        <div style={{ marginTop: 16, flexGrow: 1 }}>
                          <Text strong>{availabilityLabel}</Text>
                          <Tooltip title={tooltipText}>
                            <AvailabilityDots available={displayStats.hospitals.length} total={hospitalCount} />
                          </Tooltip>
                          <Tag color={availabilityPercent > 75 ? 'green' : availabilityPercent > 40 ? 'orange' : 'red'} style={{ marginTop: 8 }}>
                            {Math.round(availabilityPercent)}% Coverage
                          </Tag>
                        </div>
                        <div style={{ marginTop: 12, borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                          <Text>Total Quantity: <Text strong>{displayStats.totalQuantity}</Text></Text>
                          {isFiltered && (
                            <div style={{ marginTop: 4 }}>
                              <Text type="secondary" style={{ fontSize: '12px' }}>
                                Global: {globalStats.hospitals.length}/{totalHospitals} hospitals
                              </Text>
                            </div>
                          )}
                        </div>
                      </Card>
                    </List.Item>
                  );
                }}
              />
            )
          }))}
        />
      ) : (
        <Empty description="No equipment matches your filters." />
      )}
    </div>
  );
};

export default Q04_EquipmentAvailability;