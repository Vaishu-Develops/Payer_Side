// src/pages/Vaishnavi/files/Q22_CertificationMatrix.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Spin,
  Alert,
  Table,
  Tag,
  Badge,
  Select,
  Input,
  Row,
  Col,
  Button,
  Tooltip,
  Space,
  DatePicker,
  Modal,
  Progress,
  Statistic,
  Typography,
  message
} from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from 'dayjs/plugin/isBetween';
import * as XLSX from 'xlsx';
import dataService from '../../../services/dataService.jsx';

dayjs.extend(isBetween);

const { Option } = Select;
const { Search } = Input;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const Q22_CertificationMatrix = () => {
  const [certifications, setCertifications] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filteredData, setFilteredData] = useState([]);
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedCertifications, setSelectedCertifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [selectedCertDetail, setSelectedCertDetail] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Define applyFilters before any useEffect that uses it
  const applyFilters = useCallback(() => {
    console.log('🔍 applyFilters called');
    console.log('📊 Current certifications:', certifications, 'Type:', typeof certifications, 'IsArray:', Array.isArray(certifications));
    console.log('🏥 Current hospitals:', hospitals, 'Type:', typeof hospitals, 'IsArray:', Array.isArray(hospitals));

    // Ensure we have arrays to work with
    const certsArray = Array.isArray(certifications) ? certifications : [];
    const hospsArray = Array.isArray(hospitals) ? hospitals : [];

    console.log('🔍 Working with certs array length:', certsArray.length, 'hosps array length:', hospsArray.length);

    let filtered = certsArray.filter(cert => {
      // Hospital filter
      if (selectedHospitals.length > 0 && !selectedHospitals.includes(cert.hospital_id)) {
        return false;
      }

      // Certification type filter
      if (selectedCertifications.length > 0 && !selectedCertifications.includes(cert.certification_type)) {
        return false;
      }

      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hospital = hospsArray.find(h => h.id === cert.hospital_id);
        
        if (!hospital?.name?.toLowerCase().includes(searchLower) &&
            !cert.certification_type?.toLowerCase().includes(searchLower) &&
            !cert.issuing_authority?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Date range filter
      if (dateRange && dateRange.length === 2) {
        const certDate = dayjs(cert.issued_date);
        if (!certDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
          return false;
        }
      }

      return true;
    });

    console.log('🔍 Filtered result:', filtered, 'Length:', filtered.length);
    setFilteredData(filtered);
  }, [certifications, hospitals, selectedHospitals, selectedCertifications, searchTerm, dateRange]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Starting data fetch...');

      const [certificationData, hospitalData] = await Promise.all([
        dataService.getAllHospitalCertifications(),
        dataService.fetchHospitalsData()
      ]);

      console.log('📊 Raw certification data:', certificationData);
      console.log('🏥 Raw hospital data:', hospitalData);
      console.log('📊 Certification data type:', typeof certificationData);
      console.log('🏥 Hospital data type:', typeof hospitalData);
      console.log('📊 Certification data isArray:', Array.isArray(certificationData));
      console.log('🏥 Hospital data isArray:', Array.isArray(hospitalData));

      // Handle data structure - extract arrays if wrapped in objects
      let certArray = [];
      if (Array.isArray(certificationData)) {
        certArray = certificationData;
        console.log('✅ Certification data is direct array');
      } else if (certificationData?.success && certificationData?.data) {
        // Handle dataService response format
        certArray = Array.isArray(certificationData.data) 
          ? certificationData.data 
          : certificationData.data?.certifications || certificationData.data || [];
        console.log('🔄 Extracted certification array from dataService response');
      } else {
        certArray = certificationData?.certifications || certificationData?.data || [];
        console.log('⚠️ Fallback certification array extraction');
      }

      let hospArray = [];
      if (Array.isArray(hospitalData)) {
        hospArray = hospitalData;
        console.log('✅ Hospital data is direct array');
      } else if (hospitalData?.success && hospitalData?.data) {
        // Handle dataService response format
        hospArray = hospitalData.data?.hospitals || hospitalData.data || [];
        console.log('🔄 Extracted hospital array from dataService response');
      } else {
        hospArray = hospitalData?.hospitals || hospitalData?.data || [];
        console.log('⚠️ Fallback hospital array extraction');
      }

      console.log('📊 Final cert array:', certArray, 'Length:', certArray.length, 'IsArray:', Array.isArray(certArray));
      console.log('🏥 Final hosp array:', hospArray, 'Length:', hospArray.length, 'IsArray:', Array.isArray(hospArray));

      setCertifications(certArray);
      setHospitals(hospArray);
      
      message.success('Certification data loaded successfully');
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      setError(err.message || "Failed to fetch data");
      message.error('Failed to load certification data');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    try {
      setRefreshing(true);
      await fetchData();
    } catch (error) {
      console.error('Refresh error:', error);
      message.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  const getCertificationStatus = (cert) => {
    const expiryDate = dayjs(cert.expiry_date);
    const today = dayjs();
    const daysUntilExpiry = expiryDate.diff(today, 'days');

    if (daysUntilExpiry < 0) {
      return { 
        status: 'expired', 
        color: 'red', 
        icon: <CloseCircleOutlined />,
        text: 'Expired'
      };
    } else if (daysUntilExpiry <= 90) {
      return { 
        status: 'expiring-soon', 
        color: 'orange', 
        icon: <ExclamationCircleOutlined />,
        text: 'Expiring Soon'
      };
    } else if (daysUntilExpiry <= 180) {
      return { 
        status: 'warning', 
        color: 'gold', 
        icon: <ClockCircleOutlined />,
        text: 'Warning'
      };
    } else {
      return { 
        status: 'active', 
        color: 'green', 
        icon: <CheckCircleOutlined />,
        text: 'Active'
      };
    }
  };

  const getMatrixData = () => {
    // Ensure hospitals and filteredData are arrays
    const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];
    const filteredArray = Array.isArray(filteredData) ? filteredData : [];
    
    // Group certifications by hospital
    const matrix = {};
    const certTypes = [...new Set(filteredArray.map(cert => cert.certification_type))].sort();

    // Filter hospitals based on selection
    const relevantHospitals = hospitalsArray.filter(hospital => 
      selectedHospitals.length === 0 || selectedHospitals.includes(hospital.id)
    );

    relevantHospitals.forEach(hospital => {
      matrix[hospital.id] = {
        hospital,
        certifications: {},
        totalCertifications: 0,
        activeCertifications: 0,
        expiringSoon: 0
      };

      certTypes.forEach(type => {
        const cert = filteredArray.find(c => c.hospital_id === hospital.id && c.certification_type === type);
        matrix[hospital.id].certifications[type] = cert || null;
        
        if (cert) {
          matrix[hospital.id].totalCertifications++;
          const status = getCertificationStatus(cert);
          if (status.status === 'active') {
            matrix[hospital.id].activeCertifications++;
          } else if (status.status === 'expiring-soon') {
            matrix[hospital.id].expiringSoon++;
          }
        }
      });
    });

    return { matrix, certTypes };
  };

  const showCertificationDetails = (cert) => {
    setSelectedCertDetail(cert);
    setDetailsModalVisible(true);
  };

  const exportToExcel = async () => {
    try {
      message.loading('Preparing Excel export...', 1);
      
      const { matrix, certTypes } = getMatrixData();
      const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];
      const filteredArray = Array.isArray(filteredData) ? filteredData : [];

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Certification Matrix
      const matrixData = [];
      
      // Headers for matrix sheet
      const matrixHeaders = [
        'Hospital Name',
        'Hospital Type', 
        'Category',
        'Operational Beds',
        'Total Certifications',
        'Active Certifications',
        'Expiring Soon',
        ...certTypes.map(type => `${type} Level`),
        ...certTypes.map(type => `${type} Expiry`),
        ...certTypes.map(type => `${type} Status`)
      ];
      
      matrixData.push(matrixHeaders);

      // Data rows for matrix
      Object.values(matrix).forEach(item => {
        const row = [
          item.hospital.name || '',
          item.hospital.hospital_type || '',
          item.hospital.category || '',
          item.hospital.beds_operational || 0,
          item.totalCertifications || 0,
          item.activeCertifications || 0,
          item.expiringSoon || 0
        ];

        // Add certification levels
        certTypes.forEach(type => {
          const cert = item.certifications[type];
          row.push(cert ? cert.certification_level || '' : 'Not Certified');
        });

        // Add expiry dates
        certTypes.forEach(type => {
          const cert = item.certifications[type];
          row.push(cert ? dayjs(cert.expiry_date).format('DD/MM/YYYY') : 'N/A');
        });

        // Add status
        certTypes.forEach(type => {
          const cert = item.certifications[type];
          if (cert) {
            const status = getCertificationStatus(cert);
            row.push(status.text);
          } else {
            row.push('N/A');
          }
        });

        matrixData.push(row);
      });

      const matrixWorksheet = XLSX.utils.aoa_to_sheet(matrixData);
      XLSX.utils.book_append_sheet(workbook, matrixWorksheet, 'Certification Matrix');

      // Sheet 2: Detailed Certifications
      const detailedData = [];
      
      // Headers for detailed sheet
      const detailedHeaders = [
        'Hospital ID',
        'Hospital Name',
        'Hospital Type',
        'Hospital Category',
        'Operational Beds',
        'Certification Type',
        'Certification Level',
        'Certificate Number',
        'Issued Date',
        'Expiry Date',
        'Days Until Expiry',
        'Issuing Authority',
        'Status',
        'Remarks'
      ];
      
      detailedData.push(detailedHeaders);

      // Data rows for detailed certifications
      filteredArray.forEach(cert => {
        const hospital = hospitalsArray.find(h => h.id === cert.hospital_id);
        const status = getCertificationStatus(cert);
        const expiryDate = dayjs(cert.expiry_date);
        const daysUntilExpiry = expiryDate.diff(dayjs(), 'days');

        const row = [
          cert.hospital_id || '',
          hospital?.name || 'Unknown Hospital',
          hospital?.hospital_type || '',
          hospital?.category || '',
          hospital?.beds_operational || 0,
          cert.certification_type || '',
          cert.certification_level || '',
          cert.certificate_number || '',
          dayjs(cert.issued_date).format('DD/MM/YYYY'),
          dayjs(cert.expiry_date).format('DD/MM/YYYY'),
          daysUntilExpiry,
          cert.issuing_authority || '',
          status.text,
          cert.remarks || ''
        ];

        detailedData.push(row);
      });

      const detailedWorksheet = XLSX.utils.aoa_to_sheet(detailedData);
      XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Detailed Certifications');

      // Sheet 3: Summary Statistics
      const stats = getComplianceStats();
      const summaryData = [
        ['Metric', 'Value', 'Description'],
        ['Total Hospitals', stats.totalHospitals, 'Number of hospitals in current view'],
        ['Total Certifications', stats.actualCertified, 'Total number of certifications held'],
        ['Possible Certifications', stats.totalPossible, 'Maximum possible certifications'],
        ['Compliance Rate (%)', stats.complianceRate, 'Percentage of possible certifications achieved'],
        ['Active Certifications', stats.totalActive, 'Number of currently active certifications'],
        ['Expiring Soon', stats.expiringSoon, 'Certifications expiring within 90 days'],
        ['Active Rate (%)', stats.activeRate, 'Percentage of certifications that are active'],
        [],
        ['Certification Types Breakdown', '', ''],
        ...certTypes.map(type => [
          type,
          filteredArray.filter(c => c.certification_type === type).length,
          `Total ${type} certifications`
        ]),
        [],
        ['Export Date', dayjs().format('DD/MM/YYYY HH:mm:ss'), 'When this report was generated'],
        ['Filter Applied', '', ''],
        ['Selected Hospitals', selectedHospitals.length > 0 ? selectedHospitals.length : 'All', 'Number of hospitals filtered'],
        ['Selected Cert Types', selectedCertifications.length > 0 ? selectedCertifications.length : 'All', 'Number of certification types filtered'],
        ['Search Term', searchTerm || 'None', 'Search filter applied'],
        ['Date Range', dateRange ? `${dateRange[0].format('DD/MM/YYYY')} to ${dateRange[1].format('DD/MM/YYYY')}` : 'None', 'Date range filter applied']
      ];

      const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

      // Generate filename with timestamp
      const filename = `Hospital_Certifications_Matrix_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
      
      // Write and download the file
      XLSX.writeFile(workbook, filename);
      
      message.success('Excel file exported successfully');
    } catch (error) {
      console.error('Excel export error:', error);
      message.error('Failed to export Excel file');
    }
  };

  const getComplianceStats = () => {
    const { matrix, certTypes } = getMatrixData();
    const matrixValues = Object.values(matrix);
    
    const totalHospitals = matrixValues.length;
    const totalPossible = totalHospitals * certTypes.length;
    const actualCertified = matrixValues.reduce((acc, item) => {
      return acc + Object.values(item.certifications).filter(cert => cert !== null).length;
    }, 0);

    const expiringSoon = matrixValues.reduce((acc, item) => acc + item.expiringSoon, 0);
    const totalActive = matrixValues.reduce((acc, item) => acc + item.activeCertifications, 0);

    // Calculate rates with proper handling of edge cases
    const complianceRate = totalPossible > 0 ? Math.round((actualCertified / totalPossible) * 100) : 0;
    const activeRate = actualCertified > 0 ? Math.round((totalActive / actualCertified) * 100) : 0;

    console.log('📊 Compliance Stats:', {
      totalHospitals,
      totalPossible,
      actualCertified,
      complianceRate,
      certTypes: certTypes.length
    });

    return {
      totalHospitals,
      totalPossible,
      actualCertified,
      expiringSoon,
      totalActive,
      complianceRate,
      activeRate
    };
  };

  const renderMatrixTable = () => {
    const { matrix, certTypes } = getMatrixData();

    const columns = [
      {
        title: 'Hospital Information',
        dataIndex: 'hospital',
        key: 'hospital',
        fixed: 'left',
        width: 280,
        render: (hospital, record) => (
          <div>
            <Text strong style={{ display: 'block' }}>{hospital.name}</Text>
            <Text type="secondary" style={{ fontSize: '12px', display: 'block' }}>
              {hospital.category} | {hospital.beds_operational} beds
            </Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>
              Certifications: {record.totalCertifications} 
              {record.expiringSoon > 0 && (
                <Text type="warning"> | {record.expiringSoon} expiring</Text>
              )}
            </Text>
          </div>
        ),
      },
      ...certTypes.map(type => ({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div>{type}</div>
            <div style={{ fontSize: '10px', color: '#666', fontWeight: 'normal' }}>
              {Array.isArray(filteredData) ? filteredData.filter(c => c.certification_type === type).length : 0} total
            </div>
          </div>
        ),
        dataIndex: ['certifications', type],
        key: type,
        width: 160,
        align: 'center',
        render: (cert) => {
          if (!cert) {
            return (
              <div>
                <Tag color="default">Not Certified</Tag>
              </div>
            );
          }

          const statusInfo = getCertificationStatus(cert);
          return (
            <div>
              <Tooltip 
                title={
                  <div>
                    <div><strong>Level:</strong> {cert.certification_level}</div>
                    <div><strong>Certificate:</strong> {cert.certificate_number}</div>
                    <div><strong>Expires:</strong> {dayjs(cert.expiry_date).format('DD MMM YYYY')}</div>
                    <div><strong>Authority:</strong> {cert.issuing_authority}</div>
                    <div style={{ marginTop: '8px', color: '#1890ff' }}>Click for full details</div>
                  </div>
                }
              >
                <Tag
                  color={statusInfo.color}
                  style={{ 
                    cursor: 'pointer', 
                    marginBottom: '4px',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                  onClick={() => showCertificationDetails(cert)}
                  icon={statusInfo.icon}
                >
                  {cert.certification_level}
                </Tag>
              </Tooltip>
              <div style={{ fontSize: '10px', color: '#666' }}>
                Exp: {dayjs(cert.expiry_date).format('MMM YY')}
              </div>
            </div>
          );
        },
      })),
    ];

    return (
      <Table
        columns={columns}
        dataSource={Object.values(matrix)}
        rowKey={(record) => record.hospital.id}
        scroll={{ x: 'max-content', y: 600 }}
        pagination={{ 
          pageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} hospitals`
        }}
        size="middle"
        loading={loading}
      />
    );
  };

  const clearAllFilters = () => {
    setSelectedHospitals([]);
    setSelectedCertifications([]);
    setSearchTerm("");
    setDateRange(null);
    message.info('All filters cleared');
  };

  const stats = getComplianceStats();

  if (loading) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" tip="Loading certification data..." />
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
        <Card>
          <Alert 
            message="Error Loading Data" 
            description={error} 
            type="error" 
            showIcon 
            action={
              <Button size="small" danger onClick={fetchData}>
                Retry
              </Button>
            }
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", backgroundColor: "#f0f2f5", minHeight: "100vh" }}>
      <Card>
        <div style={{ marginBottom: '24px' }}>
          <Row align="middle" justify="space-between">
            <Col>
              <Title level={2}>Hospital Certification Comparison Matrix</Title>
              <Text type="secondary">
                Compare certification status across {hospitals.length} healthcare organizations
              </Text>
            </Col>
            <Col>
              <Space>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={refreshData}
                  loading={refreshing}
                >
                  Refresh
                </Button>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportToExcel}
                  disabled={!Array.isArray(filteredData) || filteredData.length === 0}
                >
                  Export to Excel
                </Button>
              </Space>
            </Col>
          </Row>
        </div>

        {/* Statistics Dashboard */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Hospitals"
                value={stats.totalHospitals}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Certifications"
                value={stats.actualCertified}
                suffix={`/ ${stats.totalPossible}`}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Compliance Rate"
                value={stats.complianceRate || 0}
                suffix="%"
                prefix={
                  stats.complianceRate >= 80 ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> 
                  : stats.complianceRate >= 60 ? <ExclamationCircleOutlined style={{ color: '#faad14' }} />
                  : <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                }
                valueStyle={{
                  color: stats.complianceRate >= 80 ? '#52c41a' 
                       : stats.complianceRate >= 60 ? '#faad14' 
                       : '#ff4d4f'
                }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Progress
                  type="circle"
                  percent={stats.complianceRate || 0}
                  size={80}
                  status={
                    stats.complianceRate === 0 && stats.totalHospitals === 0 
                      ? 'active'  // Loading/No data state
                      : stats.complianceRate >= 80 
                        ? 'success'   // High compliance
                        : stats.complianceRate >= 60 
                          ? 'normal'    // Medium compliance
                          : 'exception' // Low compliance
                  }
                  format={(percent) => stats.totalHospitals === 0 ? 'Loading...' : `${percent}%`}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                  Overall Compliance
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* Additional Stats Row */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Certifications"
                value={stats.totalActive}
                valueStyle={{ color: '#3f8600' }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Expiring Soon"
                value={stats.expiringSoon}
                valueStyle={{ color: '#cf1322' }}
                prefix={<ExclamationCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic
                title="Active Rate"
                value={stats.activeRate}
                suffix="%"
                valueStyle={{ color: stats.activeRate > 80 ? '#3f8600' : '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card 
          style={{ marginBottom: '16px' }}
          title={
            <Space>
              <FilterOutlined />
              <span>Filters</span>
            </Space>
          }
          extra={
            <Button size="small" onClick={clearAllFilters}>
              Clear All
            </Button>
          }
        >
          <Row gutter={16}>
            <Col span={6}>
              <Search
                placeholder="Search hospitals or certifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%' }}
                allowClear
              />
            </Col>
            <Col span={6}>
              <Select
                mode="multiple"
                placeholder="Filter by Hospital"
                style={{ width: '100%' }}
                value={selectedHospitals}
                onChange={setSelectedHospitals}
                allowClear
                maxTagCount='responsive'
              >
                {hospitals.map(hospital => (
                  <Option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                mode="multiple"
                placeholder="Filter by Certification Type"
                style={{ width: '100%' }}
                value={selectedCertifications}
                onChange={setSelectedCertifications}
                allowClear
                maxTagCount='responsive'
              >
                {[...new Set(certifications.map(cert => cert.certification_type))].sort().map(type => (
                  <Option key={type} value={type}>
                    {type}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <RangePicker
                style={{ width: '100%' }}
                value={dateRange}
                onChange={setDateRange}
                placeholder={['Start Date', 'End Date']}
              />
            </Col>
          </Row>
        </Card>

        {/* Certification Matrix */}
        <Card title={`Certification Comparison Matrix (${stats.totalHospitals} hospitals)`}>
          {(!Array.isArray(filteredData) || filteredData.length === 0) && !loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}>
              <Text type="secondary">No certification data found with current filters</Text>
            </div>
          ) : (
            renderMatrixTable()
          )}
        </Card>

        {/* Certification Details Modal */}
        <Modal
          title="Certification Details"
          open={detailsModalVisible}
          onCancel={() => setDetailsModalVisible(false)}
          footer={null}
          width={700}
        >
          {selectedCertDetail && (
            <div>
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Hospital:</Text>
                  <br />
                  <Text>{hospitals.find(h => h.id === selectedCertDetail.hospital_id)?.name}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Certification Type:</Text>
                  <br />
                  <Text>{selectedCertDetail.certification_type}</Text>
                </Col>
              </Row>
              <br />
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Level:</Text>
                  <br />
                  <Text>{selectedCertDetail.certification_level}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Certificate Number:</Text>
                  <br />
                  <Text copyable>{selectedCertDetail.certificate_number}</Text>
                </Col>
              </Row>
              <br />
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>Issued Date:</Text>
                  <br />
                  <Text>{dayjs(selectedCertDetail.issued_date).format('DD MMMM YYYY')}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>Expiry Date:</Text>
                  <br />
                  <Text>{dayjs(selectedCertDetail.expiry_date).format('DD MMMM YYYY')}</Text>
                </Col>
              </Row>
              <br />
              <Row gutter={16}>
                <Col span={24}>
                  <Text strong>Issuing Authority:</Text>
                  <br />
                  <Text>{selectedCertDetail.issuing_authority}</Text>
                </Col>
              </Row>
              <br />
              <Row gutter={16}>
                <Col span={24}>
                  <Text strong>Status:</Text>
                  <br />
                  {(() => {
                    const statusInfo = getCertificationStatus(selectedCertDetail);
                    const expiryDate = dayjs(selectedCertDetail.expiry_date);
                    const daysUntilExpiry = expiryDate.diff(dayjs(), 'days');
                    
                    return (
                      <Space>
                        <Tag color={statusInfo.color} icon={statusInfo.icon}>
                          {statusInfo.text}
                        </Tag>
                        <Text type="secondary">
                          ({daysUntilExpiry >= 0 ? `${daysUntilExpiry} days remaining` : `Expired ${Math.abs(daysUntilExpiry)} days ago`})
                        </Text>
                      </Space>
                    );
                  })()}
                </Col>
              </Row>
              {selectedCertDetail.remarks && (
                <>
                  <br />
                  <Row gutter={16}>
                    <Col span={24}>
                      <Text strong>Remarks:</Text>
                      <br />
                      <Text>{selectedCertDetail.remarks}</Text>
                    </Col>
                  </Row>
                </>
              )}
            </div>
          )}
        </Modal>
      </Card>
    </div>
  );
};

export default Q22_CertificationMatrix;
