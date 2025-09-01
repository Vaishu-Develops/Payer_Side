// src/pages/Vaishnavi/files/Q22_CertificationMatrix.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  Card,
  Spin,
  Alert,
  Table,
  Tag,
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
  message,
  Divider,
  Badge
} from "antd";
import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  DownloadOutlined,
  FilterOutlined,
  ReloadOutlined,
  ClearOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  SafetyCertificateOutlined
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

// Modern styled components with scoped CSS
const StyledContainer = ({ children, ...props }) => (
  <div 
    className="cert-matrix-container"
    style={{
      padding: '24px',
      backgroundColor: '#f8fafc',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}
    {...props}
  >
    {children}
  </div>
);

const StyledCard = ({ children, ...props }) => (
  <Card
    className="cert-matrix-card"
    style={{
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
      border: '1px solid #e2e8f0',
      overflow: 'hidden',
      marginBottom: '24px',
      background: '#ffffff',
      ...props.style
    }}
    bodyStyle={{ padding: '20px' }}
    {...props}
  >
    {children}
  </Card>
);

const FilterContainer = ({ children }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      padding: '20px',
      backgroundColor: '#f8fafc',
      borderRadius: '8px',
      margin: '0 0 20px 0',
      border: '1px solid #e2e8f0'
    }}
  >
    {children}
  </div>
);

const FilterItem = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <Text strong style={{ fontSize: '14px', color: '#374151', marginBottom: '4px' }}>
      {label}
    </Text>
    <div style={{ width: '100%' }}>
      {children}
    </div>
  </div>
);

const StatsGrid = ({ children }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}
  >
    {children}
  </div>
);

const StatCard = ({ icon, title, value, suffix, color = '#3b82f6', tooltip }) => (
  <StyledCard 
    style={{ 
      textAlign: 'center', 
      padding: '0',
      borderTop: `4px solid ${color}`,
      transition: 'all 0.3s ease',
      height: '100%'
    }}
  >
    <Tooltip title={tooltip}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '28px', color, marginBottom: '12px' }}>
          {icon}
        </div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '6px' }}>
          {value}{suffix && <span style={{ fontSize: '16px', color: '#6b7280' }}>{suffix}</span>}
        </div>
        <Text style={{ fontSize: '14px', color: '#6b7280' }}>
          {title}
        </Text>
      </div>
    </Tooltip>
  </StyledCard>
);

const StatusIndicator = ({ status, text, size = 'default' }) => {
  const statusConfig = {
    active: { color: '#10b981', icon: <CheckCircleOutlined />, bg: '#ecfdf5' },
    'expiring-soon': { color: '#f59e0b', icon: <ExclamationCircleOutlined />, bg: '#fffbeb' },
    warning: { color: '#f59e0b', icon: <ClockCircleOutlined />, bg: '#fffbeb' },
    expired: { color: '#ef4444', icon: <CloseCircleOutlined />, bg: '#fef2f2' },
    default: { color: '#6b7280', icon: <InfoCircleOutlined />, bg: '#f3f4f6' }
  };
  
  const config = statusConfig[status] || statusConfig.default;
  
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: size === 'small' ? '4px 8px' : '6px 12px',
      borderRadius: '20px',
      backgroundColor: config.bg,
      color: config.color,
      fontSize: size === 'small' ? '12px' : '14px',
      fontWeight: '500'
    }}>
      {config.icon}
      <span>{text}</span>
    </div>
  );
};

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

  const applyFilters = useCallback(() => {
    const certsArray = Array.isArray(certifications) ? certifications : [];
    const hospsArray = Array.isArray(hospitals) ? hospitals : [];

    let filtered = certsArray.filter(cert => {
      if (selectedHospitals.length > 0 && !selectedHospitals.includes(cert.hospital_id)) {
        return false;
      }

      if (selectedCertifications.length > 0 && !selectedCertifications.includes(cert.certification_type)) {
        return false;
      }

      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const hospital = hospsArray.find(h => h.id === cert.hospital_id);
        
        if (!hospital?.name?.toLowerCase().includes(searchLower) &&
            !cert.certification_type?.toLowerCase().includes(searchLower) &&
            !cert.issuing_authority?.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      if (dateRange && dateRange.length === 2) {
        const certDate = dayjs(cert.issued_date);
        if (!certDate.isBetween(dateRange[0], dateRange[1], 'day', '[]')) {
          return false;
        }
      }

      return true;
    });

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

      const [certificationData, hospitalData] = await Promise.all([
        dataService.getAllHospitalCertifications(),
        dataService.fetchHospitalsData()
      ]);

      let certArray = [];
      if (Array.isArray(certificationData)) {
        certArray = certificationData;
      } else if (certificationData?.success && certificationData?.data) {
        certArray = Array.isArray(certificationData.data) 
          ? certificationData.data 
          : certificationData.data?.certifications || certificationData.data || [];
      } else {
        certArray = certificationData?.certifications || certificationData?.data || [];
      }

      let hospArray = [];
      if (Array.isArray(hospitalData)) {
        hospArray = hospitalData;
      } else if (hospitalData?.success && hospitalData?.data) {
        hospArray = hospitalData.data?.hospitals || hospitalData.data || [];
      } else {
        hospArray = hospitalData?.hospitals || hospitalData?.data || [];
      }

      setCertifications(certArray);
      setHospitals(hospArray);
      
      message.success('Certification data loaded successfully');
    } catch (err) {
      console.error("Error fetching data:", err);
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
        color: '#ef4444', 
        icon: <CloseCircleOutlined />,
        text: 'Expired',
        description: 'Certification has expired'
      };
    } else if (daysUntilExpiry <= 90) {
      return { 
        status: 'expiring-soon', 
        color: '#f59e0b', 
        icon: <ExclamationCircleOutlined />,
        text: 'Expiring Soon',
        description: 'Certification expires within 90 days'
      };
    } else if (daysUntilExpiry <= 180) {
      return { 
        status: 'warning', 
        color: '#f59e0b', 
        icon: <ClockCircleOutlined />,
        text: 'Warning',
        description: 'Certification expires within 180 days'
      };
    } else {
      return { 
        status: 'active', 
        color: '#10b981', 
        icon: <CheckCircleOutlined />,
        text: 'Active',
        description: 'Certification is active'
      };
    }
  };

  const getMatrixData = () => {
    const hospitalsArray = Array.isArray(hospitals) ? hospitals : [];
    const filteredArray = Array.isArray(filteredData) ? filteredData : [];
    
    const matrix = {};
    const certTypes = [...new Set(filteredArray.map(cert => cert.certification_type))].sort();

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

      const workbook = XLSX.utils.book_new();

      const matrixData = [];
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

        certTypes.forEach(type => {
          const cert = item.certifications[type];
          row.push(cert ? cert.certification_level || '' : 'Not Certified');
        });

        certTypes.forEach(type => {
          const cert = item.certifications[type];
          row.push(cert ? dayjs(cert.expiry_date).format('DD/MM/YYYY') : 'N/A');
        });

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

      const filename = `Hospital_Certifications_Matrix_${dayjs().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
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

    const complianceRate = totalPossible > 0 ? Math.round((actualCertified / totalPossible) * 100) : 0;
    const activeRate = actualCertified > 0 ? Math.round((totalActive / actualCertified) * 100) : 0;

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
          <div style={{ padding: '8px 0' }}>
            <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px', color: '#1f2937' }}>
              {hospital.name}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
              {hospital.category} | {hospital.beds_operational} beds
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <Badge count={record.totalCertifications} style={{ backgroundColor: '#10b981' }} />
              <span>Certifications</span>
              {record.expiringSoon > 0 && (
                <>
                  <Badge count={record.expiringSoon} style={{ backgroundColor: '#f59e0b' }} />
                  <span style={{ color: '#f59e0b' }}>Expiring</span>
                </>
              )}
            </div>
          </div>
        ),
      },
      ...certTypes.map(type => ({
        title: (
          <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1f2937' }}>{type}</div>
            <div style={{ fontSize: '11px', color: '#6b7280' }}>
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
              <div style={{ padding: '8px 4px' }}>
                <div style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  backgroundColor: '#f3f4f6',
                  color: '#6b7280',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  Not Certified
                </div>
              </div>
            );
          }

          const statusInfo = getCertificationStatus(cert);
          return (
            <div style={{ padding: '8px 4px' }}>
              <Tooltip 
                title={
                  <div>
                    <div><strong>Level:</strong> {cert.certification_level}</div>
                    <div><strong>Certificate:</strong> {cert.certificate_number}</div>
                    <div><strong>Expires:</strong> {dayjs(cert.expiry_date).format('DD MMM YYYY')}</div>
                    <div><strong>Authority:</strong> {cert.issuing_authority}</div>
                    <div style={{ marginTop: '8px', color: '#3b82f6' }}>Click for details</div>
                  </div>
                }
              >
                <div
                  style={{ 
                    cursor: 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    border: `1px solid ${statusInfo.color}30`,
                    backgroundColor: `${statusInfo.color}10`,
                    transition: 'all 0.2s ease',
                    marginBottom: '4px'
                  }}
                  onClick={() => showCertificationDetails(cert)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = `0 2px 8px ${statusInfo.color}20`;
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ color: statusInfo.color, fontSize: '14px' }}>
                      {statusInfo.icon}
                    </span>
                    <span style={{ fontWeight: '600', color: '#1f2937', fontSize: '13px' }}>
                      {cert.certification_level}
                    </span>
                  </div>
                  <StatusIndicator status={statusInfo.status} text={statusInfo.text} size="small" />
                </div>
              </Tooltip>
              <div style={{ fontSize: '10px', color: '#6b7280', textAlign: 'center' }}>
                Exp: {dayjs(cert.expiry_date).format('MMM YY')}
              </div>
            </div>
          );
        },
      })),
    ];

    return (
      <div style={{ 
        borderRadius: '8px', 
        overflow: 'hidden',
        border: '1px solid #e2e8f0'
      }}>
        <Table
          columns={columns}
          dataSource={Object.values(matrix)}
          rowKey={(record) => record.hospital.id}
          scroll={{ x: 'max-content', y: 600 }}
          pagination={{ 
            pageSize: 20,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} hospitals`
          }}
          size="middle"
          loading={loading}
          style={{ backgroundColor: '#fff' }}
        />
      </div>
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
      <StyledContainer>
        <StyledCard>
          <div style={{ textAlign: 'center', padding: '80px 20px' }}>
            <Spin size="large" tip="Loading certification data..." />
          </div>
        </StyledCard>
      </StyledContainer>
    );
  }

  if (error) {
    return (
      <StyledContainer>
        <StyledCard>
          <Alert 
            message="Error Loading Data" 
            description={error} 
            type="error" 
            showIcon 
            action={
              <Button type="primary" danger onClick={fetchData}>
                Retry
              </Button>
            }
          />
        </StyledCard>
      </StyledContainer>
    );
  }

  return (
    <StyledContainer>
      {/* Header Section */}
      <StyledCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <SafetyCertificateOutlined style={{ fontSize: '28px', color: '#3b82f6' }} />
              <Title level={2} style={{ margin: 0, color: '#1f2937', fontWeight: '700' }}>
                Hospital Certification Matrix
              </Title>
            </div>
            <Text style={{ fontSize: '16px', color: '#6b7280' }}>
              Monitor and compare certification status across {hospitals.length} healthcare organizations
            </Text>
          </div>
          <Space size="middle" style={{ flexWrap: 'wrap' }}>
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={refreshing}
              size="large"
              style={{ borderRadius: '8px' }}
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
              disabled={!Array.isArray(filteredData) || filteredData.length === 0}
              size="large"
              style={{ borderRadius: '8px', background: '#3b82f6', borderColor: '#3b82f6' }}
            >
              Export Excel
            </Button>
          </Space>
        </div>
      </StyledCard>

      {/* Statistics Dashboard */}
      <StatsGrid>
        <StatCard
          icon={<CheckCircleOutlined />}
          title="Total Hospitals"
          value={stats.totalHospitals}
          color="#10b981"
          tooltip="Number of hospitals in the current view"
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          title="Total Certifications"
          value={stats.actualCertified}
          suffix={` / ${stats.totalPossible}`}
          color="#3b82f6"
          tooltip="Number of certifications compared to maximum possible"
        />
        <StatCard
          icon={<ExclamationCircleOutlined />}
          title="Compliance Rate"
          value={stats.complianceRate}
          suffix="%"
          color={stats.complianceRate >= 80 ? '#10b981' : stats.complianceRate >= 60 ? '#f59e0b' : '#ef4444'}
          tooltip="Percentage of required certifications that are present"
        />
        <StyledCard style={{ textAlign: 'center', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <Progress
            type="circle"
            percent={stats.complianceRate || 0}
            size={100}
            strokeColor={stats.complianceRate >= 80 ? '#10b981' : stats.complianceRate >= 60 ? '#f59e0b' : '#ef4444'}
            format={(percent) => (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>{percent}%</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Compliance</div>
              </div>
            )}
          />
        </StyledCard>
      </StatsGrid>

      {/* Secondary Stats */}
      <StatsGrid>
        <StatCard
          icon={<CheckCircleOutlined />}
          title="Active Certifications"
          value={stats.totalActive}
          color="#10b981"
          tooltip="Certifications that are currently active"
        />
        <StatCard
          icon={<ExclamationCircleOutlined />}
          title="Expiring Soon"
          value={stats.expiringSoon}
          color="#f59e0b"
          tooltip="Certifications expiring within 90 days"
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          title="Active Rate"
          value={stats.activeRate}
          suffix="%"
          color="#3b82f6"
          tooltip="Percentage of certifications that are currently active"
        />
      </StatsGrid>

      {/* Filters Section */}
      <StyledCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Space>
            <FilterOutlined style={{ fontSize: '16px', color: '#3b82f6' }} />
            <Text strong style={{ fontSize: '16px', color: '#1f2937' }}>Filters</Text>
          </Space>
          <Button 
            icon={<ClearOutlined />} 
            onClick={clearAllFilters}
            type="text"
            style={{ color: '#6b7280' }}
          >
            Clear All
          </Button>
        </div>

        <FilterContainer>
          <FilterItem label="Search Hospitals or Certifications">
            <Search
              placeholder="Search by name, type, or authority..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="large"
              style={{ width: '100%' }}
            />
          </FilterItem>

          <FilterItem label="Hospital">
            <Select
              mode="multiple"
              placeholder="Select hospitals"
              value={selectedHospitals}
              onChange={setSelectedHospitals}
              allowClear
              maxTagCount="responsive"
              size="large"
              style={{ width: '100%' }}
            >
              {hospitals.map(hospital => (
                <Option key={hospital.id} value={hospital.id}>
                  {hospital.name}
                </Option>
              ))}
            </Select>
          </FilterItem>

          <FilterItem label="Certification Type">
            <Select
              mode="multiple"
              placeholder="Select certification types"
              value={selectedCertifications}
              onChange={setSelectedCertifications}
              allowClear
              maxTagCount="responsive"
              size="large"
              style={{ width: '100%' }}
            >
              {[...new Set(certifications.map(cert => cert.certification_type))].sort().map(type => (
                <Option key={type} value={type}>
                  {type}
                </Option>
              ))}
            </Select>
          </FilterItem>

          <FilterItem label="Issued Date Range">
            <RangePicker
              value={dateRange}
              onChange={setDateRange}
              placeholder={['Start Date', 'End Date']}
              size="large"
              style={{ width: '100%' }}
            />
          </FilterItem>
        </FilterContainer>
      </StyledCard>

      {/* Matrix Table */}
      <StyledCard>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0, color: '#1f2937' }}>
            Certification Matrix ({stats.totalHospitals} hospitals)
          </Title>
          <Text style={{ color: '#6b7280' }}>
            Showing {filteredData.length} certifications
          </Text>
        </div>

        {(!Array.isArray(filteredData) || filteredData.length === 0) && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#d1d5db', marginBottom: '16px' }} />
            <Text type="secondary" style={{ fontSize: '16px', display: 'block', marginBottom: '16px' }}>
              No certification data found with current filters
            </Text>
            <Button type="primary" onClick={clearAllFilters}>
              Clear Filters
            </Button>
          </div>
        ) : (
          renderMatrixTable()
        )}
      </StyledCard>

      {/* Certification Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircleOutlined style={{ color: '#3b82f6' }} />
            <span style={{ fontWeight: '600' }}>Certification Details</span>
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
        style={{ borderRadius: '12px' }}
      >
        {selectedCertDetail && (
          <div style={{ padding: '20px 0' }}>
            <Row gutter={[24, 20]}>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>HOSPITAL</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {hospitals.find(h => h.id === selectedCertDetail.hospital_id)?.name}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>CERTIFICATION TYPE</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {selectedCertDetail.certification_type}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>LEVEL</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {selectedCertDetail.certification_level}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>CERTIFICATE NUMBER</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    <Text copyable>{selectedCertDetail.certificate_number}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>ISSUED DATE</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {dayjs(selectedCertDetail.issued_date).format('DD MMMM YYYY')}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>EXPIRY DATE</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {dayjs(selectedCertDetail.expiry_date).format('DD MMMM YYYY')}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>ISSUING AUTHORITY</Text>
                  <div style={{ fontSize: '16px', color: '#1f2937' }}>
                    {selectedCertDetail.issuing_authority}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>STATUS</Text>
                  <div style={{ marginTop: '8px' }}>
                    {(() => {
                      const statusInfo = getCertificationStatus(selectedCertDetail);
                      const expiryDate = dayjs(selectedCertDetail.expiry_date);
                      const daysUntilExpiry = expiryDate.diff(dayjs(), 'days');
                      
                      return (
                        <Space>
                          <StatusIndicator status={statusInfo.status} text={statusInfo.text} />
                          <Text style={{ color: '#6b7280' }}>
                            ({daysUntilExpiry >= 0 
                              ? `${daysUntilExpiry} days remaining` 
                              : `Expired ${Math.abs(daysUntilExpiry)} days ago`})
                          </Text>
                        </Space>
                      );
                    })()}
                  </div>
                </div>
              </Col>
              {selectedCertDetail.remarks && (
                <Col span={24}>
                  <div>
                    <Text strong style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginBottom: '4px' }}>REMARKS</Text>
                    <div style={{ fontSize: '16px', color: '#1f2937', padding: '12px', backgroundColor: '#f8fafc', borderRadius: '6px' }}>
                      {selectedCertDetail.remarks}
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      {/* Scoped CSS to prevent conflicts */}
      <style>
        {`
          .cert-matrix-container .ant-card {
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
            border: 1px solid #e2e8f0;
            background: #ffffff;
          }
          
          .cert-matrix-container .ant-card-head {
            border-bottom: 1px solid #e2e8f0;
          }
          
          .cert-matrix-container .ant-table-thead > tr > th {
            background-color: #f8fafc;
            font-weight: 600;
          }
          
          .cert-matrix-container .ant-tag {
            border-radius: 6px;
          }
          
          .cert-matrix-container .ant-btn {
            border-radius: 6px;
          }
          
          .cert-matrix-container .ant-input,
          .cert-matrix-container .ant-select-selector,
          .cert-matrix-container .ant-picker {
            border-radius: 6px;
          }
          
          .cert-matrix-container .ant-table {
            border-radius: 8px;
          }
          
          .cert-matrix-container .ant-table-container {
            border-radius: 8px;
          }
          
          .cert-matrix-container .ant-pagination {
            padding: 0 20px 20px 20px;
          }
        `}
      </style>
    </StyledContainer>
  );
};

export default Q22_CertificationMatrix;