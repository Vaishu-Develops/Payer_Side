// src/hooks/useCertificationMatrixData.jsx
import React from 'react';
import { useHospitalData } from './useHospitalData'; // We use the main hook to get raw data
import { useMemo } from 'react';
import { Tag, Tooltip } from 'antd';
import { getCertificationStatus } from '../utils/dateUtils'; // Reusing the date utility
import _ from 'lodash';

export const useCertificationMatrixData = () => {
  const { hospitals, certifications, loading, error } = useHospitalData();

  const { columns, dataSource } = useMemo(() => {
    if (!hospitals.length || !certifications.length) {
      return { columns: [], dataSource: [] };
    }

    // 1. Get a unique, sorted list of all certification types. These will be our columns.
    const uniqueCertTypes = _.uniq(certifications.map(c => c.certification_type)).sort();

    // 2. Create the column definitions for the Ant Design Table
    const tableColumns = [
      {
        title: 'Hospital Name',
        dataIndex: 'hospitalName',
        key: 'hospitalName',
        fixed: 'left',
        width: 250,
        sorter: (a, b) => a.hospitalName.localeCompare(b.hospitalName),
      },
      // Dynamically create a column for each certification type
      ...uniqueCertTypes.map(certType => ({
        title: certType,
        dataIndex: certType,
        key: certType,
        width: 150,
        align: 'center',
        render: (cert) => {
          if (!cert) {
            return <Text type="secondary">-</Text>;
          }
          
          const status = getCertificationStatus(cert.expiry_date);
          return (
            <Tooltip title={`Level: ${cert.certification_level} | Expires: ${cert.expiry_date}`}>
              <Tag color={status.color}>{status.text}</Tag>
            </Tooltip>
          );
        },
      })),
    ];

    // 3. Group certifications by hospital_id for efficient lookup
    const certsByHospital = _.groupBy(certifications, 'hospital_id');

    // 4. Create the data source for the table (hospitals as rows)
    const tableDataSource = hospitals.map(hospital => {
      const hospitalCerts = certsByHospital[hospital.id] || [];
      
      const rowData = {
        key: hospital.id,
        hospitalName: hospital.name,
      };

      // For each unique certification type, find if this hospital has it
      uniqueCertTypes.forEach(certType => {
        const cert = hospitalCerts.find(c => c.certification_type === certType);
        rowData[certType] = cert || null; // Assign the cert object or null
      });

      return rowData;
    });

    return { columns: tableColumns, dataSource: tableDataSource };
  }, [hospitals, certifications]);

  return { columns, dataSource, loading, error };
};