// src/pages/Vaishnavi/files/shared/HospitalProfileDrawer.jsx
import React, { useState, useEffect } from 'react';
import {
  Drawer,
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Space,
  Spin,
  Alert,
  Descriptions,
  Divider,
  Button,
  Tabs,
  List,
  Empty,
  Statistic
} from 'antd';
import {
  ApartmentOutlined,
  PhoneOutlined,
  MailOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  MedicineBoxOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  UserOutlined,
  HeartOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { getHospitalProfile } from '../../../../services/hospitalService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const HospitalProfileDrawer = ({ open, onClose, hospitalId, hospitalName }) => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitalProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔄 Fetching hospital profile for ID:', hospitalId);
        const data = await getHospitalProfile(hospitalId);
        console.log('✅ Hospital profile data received:', data);
        console.log('📊 Data structure:', {
          hospital: !!data.hospital,
          addresses: data.addresses?.length || 0,
          certifications: data.certifications?.length || 0,
          equipment: data.equipment?.length || 0,
          equipment_summary: !!data.equipment_summary
        });
        setProfileData(data);
      } catch (err) {
        console.error('❌ Profile fetch error:', err);
        setError(err.message || 'Failed to load hospital profile');
      } finally {
        setLoading(false);
      }
    };

    if (open && hospitalId) {
      fetchHospitalProfile();
    }
  }, [open, hospitalId]);

  const retryFetch = () => {
    if (hospitalId) {
      setLoading(true);
      setError(null);
      getHospitalProfile(hospitalId)
        .then(setProfileData)
        .catch(err => setError(err.message || 'Failed to load hospital profile'))
        .finally(() => setLoading(false));
    }
  };

  const renderBasicInfo = () => {
    if (!profileData?.hospital) return null;
    const hospital = profileData.hospital;
    
    return (
      <Card title="Basic Information" style={{ marginBottom: 16 }}>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="Hospital Name" span={2}>
            <Text strong>{hospital.name}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Registration Number">
            {hospital.registration_number}
          </Descriptions.Item>
          <Descriptions.Item label="Provider Code">
            {hospital.provider_code}
          </Descriptions.Item>
          <Descriptions.Item label="Hospital Type">
            <Tag color="blue">{hospital.hospital_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Category">
            <Tag color="green">{hospital.category}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={hospital.status === 'Active' ? 'success' : 'warning'}>
              {hospital.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Registration Authority">
            {hospital.registering_authority}
          </Descriptions.Item>
          <Descriptions.Item label="Registration Year">
            <CalendarOutlined /> {hospital.registration_year}
          </Descriptions.Item>
          <Descriptions.Item label="Clinical Started">
            <CalendarOutlined /> {hospital.month_clinical_started}/{hospital.year_clinical_started}
          </Descriptions.Item>
        </Descriptions>

        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Statistic
              title="Registered Beds"
              value={hospital.beds_registered}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Col>
          <Col span={12}>
            <Statistic
              title="Operational Beds"
              value={hospital.beds_operational}
              prefix={<ApartmentOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
        </Row>
      </Card>
    );
  };

  const renderContactInfo = () => {
    if (!profileData?.contacts) return null;

    return (
      <Card title="Contact Information" style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Space>
              <PhoneOutlined />
              <Text>Phone: {profileData.hospital?.telephone || 'Not available'}</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <PhoneOutlined />
              <Text>Mobile: {profileData.hospital?.hospital_mobile || 'Not available'}</Text>
            </Space>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Space>
              <MailOutlined />
              <Text>Email: {profileData.hospital?.insurance_email || 'Not available'}</Text>
            </Space>
          </Col>
          <Col span={12}>
            <Space>
              <GlobalOutlined />
              <Text>Website: {profileData.hospital?.website_url || 'Not available'}</Text>
            </Space>
          </Col>
        </Row>

        {profileData.contacts && profileData.contacts.length > 0 && (
          <>
            <Divider>Key Contacts</Divider>
            <List
              dataSource={profileData.contacts.slice(0, 5)}
              renderItem={contact => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                    title={`${contact?.person_name || 'Unknown'} - ${contact?.designation || 'Unknown'}`}
                    description={
                      <Space direction="vertical" size="small">
                        <Text type="secondary">{contact?.department || 'N/A'}</Text>
                        <Space>
                          <PhoneOutlined /> {contact?.mobile || contact?.phone || 'Not available'}
                          {contact?.email && (
                            <>
                              <MailOutlined /> {contact.email}
                            </>
                          )}
                        </Space>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </>
        )}
      </Card>
    );
  };

  const renderAddress = () => {
    console.log('🏠 Rendering address, data:', profileData?.addresses);
    const addresses = profileData?.addresses;
    if (!addresses || addresses.length === 0) {
      return <Empty description="No address information available." />;
    }
    const address = addresses[0];
    if (!address) {
      return <Empty description="No address information available." />;
    }

    return (
      <Card title="Address Information" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>
            <EnvironmentOutlined style={{ marginRight: 8 }} />
            <strong>Primary Address:</strong>
          </Text>
          {address.street && <Text>{address.street}</Text>}
          {(address.area_locality || address.city_town) && (
            <Text>
              {address.area_locality}{address.area_locality && address.city_town ? ', ' : ''}{address.city_town}
            </Text>
          )}
          {(address.district || address.state || address.pin_code) && (
            <Text>
              {address.district}{address.district && address.state ? ', ' : ''}{address.state}{address.pin_code ? ` - ${address.pin_code}` : ''}
            </Text>
          )}
          {address.nearest_landmark && (
            <Text type="secondary">
              <strong>Landmark:</strong> {address.nearest_landmark}
            </Text>
          )}
        </Space>
      </Card>
    );
  };

  const renderCertifications = () => {
    console.log('🏆 Rendering certifications, data:', profileData?.certifications);
    if (!profileData?.certifications) return <Empty description="No certification data available." />;

    return (
      <Card title="Certifications" style={{ marginBottom: 16 }}>
        {profileData.certifications.length > 0 ? (
          <List
            dataSource={profileData.certifications}
            renderItem={cert => (
              <List.Item>
                <List.Item.Meta
                  avatar={<SafetyCertificateOutlined style={{ fontSize: 24, color: '#52c41a' }} />}
                  title={cert?.certification_type || 'Unknown Certification'}
                  description={
                    <Space direction="vertical" size="small">
                      <Tag color="blue">{cert?.level || cert?.certification_level || 'Level not specified'}</Tag>
                      {(cert?.valid_from || cert?.valid_to || cert?.issued_date || cert?.expiry_date) && (
                        <Text type="secondary">
                          Valid: {cert?.valid_from ? new Date(cert.valid_from).toLocaleDateString() : 
                                 cert?.issued_date ? new Date(cert.issued_date).toLocaleDateString() : 'N/A'} - {cert?.valid_to ? new Date(cert.valid_to).toLocaleDateString() : 
                                 cert?.expiry_date ? new Date(cert.expiry_date).toLocaleDateString() : 'N/A'}
                        </Text>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty description="No certifications available" />
        )}
      </Card>
    );
  };

  const renderEquipmentSummary = () => {
    console.log('🔧 Rendering equipment, data:', profileData?.equipment, 'summary:', profileData?.equipment_summary);
    if (!profileData?.equipment_summary && !profileData?.equipment) return <Empty description="No equipment data available." />;
    
    const equipment = profileData.equipment_summary || {};
    const equipmentList = profileData.equipment || [];

    return (
      <>
        <Card title="Equipment Overview" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Statistic
                title="Diagnostic"
                value={equipment.diagnostic_count || 0}
                prefix={<MedicineBoxOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Critical Care"
                value={equipment.critical_care_count || 0}
                prefix={<HeartOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Col>
            <Col span={8}>
              <Statistic
                title="Surgical"
                value={equipment.surgical_count || 0}
                prefix={<ToolOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Col>
          </Row>
        </Card>

        {equipmentList.length > 0 && (
          <Card title="Equipment Details" style={{ marginBottom: 16 }}>
            <List
              dataSource={equipmentList.slice(0, 10)} // Show first 10 items
              renderItem={equipment => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ToolOutlined style={{ fontSize: 20, color: '#1890ff' }} />}
                    title={equipment?.equipment_name || 'Unknown Equipment'}
                    description={
                      <Space>
                        <Tag color="blue">{equipment?.category || 'Unknown'}</Tag>
                        <Tag color={equipment?.is_available ? 'green' : 'red'}>
                          {equipment?.is_available ? 'Available' : 'Not Available'}
                        </Tag>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
            {equipmentList.length > 10 && (
              <Text type="secondary">... and {equipmentList.length - 10} more items</Text>
            )}
          </Card>
        )}
      </>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large">
            <div style={{ padding: '40px' }}>Loading Hospital Profile...</div>
          </Spin>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="Error Loading Profile"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={retryFetch}>
              Retry
            </Button>
          }
        />
      );
    }

    if (!profileData) return null;

    const tabItems = [
      { key: '1', label: 'Overview', children: (<>{renderBasicInfo()}{renderContactInfo()}</>) },
      { key: '2', label: 'Location', children: renderAddress() },
      { key: '3', label: 'Certifications', children: renderCertifications() },
      { key: '4', label: 'Equipment', children: renderEquipmentSummary() },
    ];

    return <Tabs items={tabItems} />;
  };

  return (
    <Drawer
      title={
        <Space>
          <ApartmentOutlined />
          {hospitalName || 'Hospital Profile'}
        </Space>
      }
      placement="right"
      width={720}
      open={open}
      onClose={onClose}
      styles={{
        body: { paddingTop: 0 }
      }}
    >
      {renderContent()}
    </Drawer>
  );
};

export default HospitalProfileDrawer;
