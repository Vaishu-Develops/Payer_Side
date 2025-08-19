// src/pages/Vaishnavi/files/shared/HospitalCertificationCard.jsx
import React, { useState } from 'react';
import { Card, Typography, Tag, Button, Space } from 'antd';
// CORRECTED LINE: Replaced BedUnitOutlined with ApartmentOutlined
import { SafetyCertificateOutlined, ApartmentOutlined, RightOutlined } from '@ant-design/icons';
import HospitalProfileDrawer from './HospitalProfileDrawer';

const { Title, Text } = Typography;

const HospitalCertificationCard = ({ hospital }) => {
  const { hospitalName, beds, level, statusInfo, hospitalId } = hospital;
  const [profileVisible, setProfileVisible] = useState(false);

  const handleViewProfile = () => {
    setProfileVisible(true);
  };

  return (
    <>
      <Card
        hoverable
        style={{ height: '100%' }}
        actions={[
          <Button type="text" key="profile" style={{ color: '#00529B' }} onClick={handleViewProfile}>
            View Profile <RightOutlined />
          </Button>,
        ]}
      >
        <Card.Meta
          title={<Title level={5}>{hospitalName}</Title>}
          description={
            <Space direction="vertical" style={{ width: '100%', marginTop: '12px' }}>
              <Tag icon={<SafetyCertificateOutlined />} color="blue">
                {level}
              </Tag>
              <Tag color={statusInfo.color}>
                {statusInfo.text}
                {statusInfo.daysRemaining >= 0 && ` (${statusInfo.daysRemaining} days left)`}
              </Tag>
              <Text type="secondary">
                {/* CORRECTED LINE: Using the new icon here */}
                <ApartmentOutlined style={{ marginRight: 8 }} />
                {beds} Operational Beds
              </Text>
            </Space>
          }
        />
      </Card>

      <HospitalProfileDrawer
        open={profileVisible}
        onClose={() => setProfileVisible(false)}
        hospitalId={hospitalId}
        hospitalName={hospitalName}
      />
    </>
  );
};

export default HospitalCertificationCard;