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
        className="hospital-certification-card"
        actions={[
          <Button type="text" key="profile" onClick={handleViewProfile}>
            View Profile <RightOutlined />
          </Button>,
        ]}
      >
        <Card.Meta
          title={hospitalName}
          description={
            <div className="certification-tags">
              <Tag icon={<SafetyCertificateOutlined />} color="blue">
                {level}
              </Tag>
              <Tag color={statusInfo.color}>
                {statusInfo.text}
                {statusInfo.daysRemaining >= 0 && ` (${statusInfo.daysRemaining} days left)`}
              </Tag>
              <div className="bed-info">
                <ApartmentOutlined style={{ marginRight: 8 }} />
                {beds} Operational Beds
              </div>
            </div>
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