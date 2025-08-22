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
  SearchOutlined
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

// Modern styled components to override any global conflicts
const StyledContainer = ({ children, ...props }) => (
  <div 
    style={{
      padding: '24px',
      backgroundColor: '#f0f2f5',
      minHeight: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}
    {...props}
  >
    {children}
  </div>
);

const StyledCard = ({ children, ...props }) => (
  <Card
    style={{
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
      border: 'none',
      overflow: 'hidden',
      marginBottom: '24px',
      ...props.style
    }}
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
      gap: '20px',
      padding: '24px',
      backgroundColor: '#fafafa',
      borderRadius: '8px',
      margin: '0 0 24px 0'
    }}
  >
    {children}
  </div>
);

const FilterItem = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
    <Text strong style={{ fontSize: '14px', color: '#262626' }}>
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '32px'
    }}
  >
    {children}
  </div>
);

const StatCard = ({ icon, title, value, suffix, color = '#1890ff' }) => (
  <StyledCard style={{ textAlign: 'center', padding: '0' }}>
    <div style={{ padding: '24px' }}>
      <div style={{ fontSize: '32px', color, marginBottom: '12px' }}>
        {icon}
      </div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#262626', marginBottom: '8px' }}>
        {value}{suffix && <span style={{ fontSize: '18px', color: '#8c8c8c' }}>{suffix}</span>}
      </div>
      <Text type="secondary" style={{ fontSize: '14px' }}>
        {title}
      </Text>
    </div>
  </StyledCard>
);

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
        color: '#ff4d4f', 
        icon: <CloseCircleOutlined />,
        text: 'Expired'
      };
    } else if (daysUntilExpiry <= 90) {
      return { 
        status: 'expiring-soon', 
        color: '#fa8c16', 
        icon: <ExclamationCircleOutlined />,
        text: 'Expiring Soon'
      };
    } else if (daysUntilExpiry <= 180) {
      return { 
        status: 'warning', 
        color: '#faad14', 
        icon: <ClockCircleOutlined />,
        text: 'Warning'
      };
    } else {
      return { 
        status: 'active', 
        color: '#52c41a', 
        icon: <CheckCircleOutlined />,
        text: 'Active'
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
            <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px' }}>
              {hospital.name}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c', marginBottom: '4px' }}>
              {hospital.category} | {hospital.beds_operational} beds
            </div>
            <div style={{ fontSize: '11px', color: '#595959' }}>
              <Badge count={record.totalCertifications} style={{ backgroundColor: '#52c41a' }} />
              <span style={{ marginLeft: '8px' }}>Certifications</span>
              {record.expiringSoon > 0 && (
                <>
                  <Badge count={record.expiringSoon} style={{ backgroundColor: '#fa8c16', marginLeft: '12px' }} />
                  <span style={{ marginLeft: '8px', color: '#fa8c16' }}>Expiring</span>
                </>
              )}
            </div>
          </div>
        ),
      },
      ...certTypes.map(type => ({
        title: (
          <div style={{ textAlign: 'center', padding: '8px 4px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{type}</div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
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
              <Tag color="default" style={{ margin: '4px 0' }}>
                Not Certified
              </Tag>
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
                    <div style={{ marginTop: '8px', color: '#40a9ff' }}>Click for details</div>
                  </div>
                }
              >
                <Tag
                  color={statusInfo.status}
                  style={{ 
                    cursor: 'pointer', 
                    margin: '2px 0',
                    display: 'block',
                    textAlign: 'center',
                    border: `1px solid ${statusInfo.color}`,
                    backgroundColor: `${statusInfo.color}15`
                  }}
                  onClick={() => showCertificationDetails(cert)}
                >
                  {statusInfo.icon} {cert.certification_level}
                </Tag>
              </Tooltip>
              <div style={{ fontSize: '10px', color: '#8c8c8c', marginTop: '4px' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <Title level={2} style={{ margin: '0 0 8px 0', color: '#262626' }}>
              Hospital Certification Matrix
            </Title>
            <Text style={{ fontSize: '16px', color: '#595959' }}>
              Compare certification status across {hospitals.length} healthcare organizations
            </Text>
          </div>
          <Space size="middle">
            <Button
              icon={<ReloadOutlined />}
              onClick={refreshData}
              loading={refreshing}
              size="large"
            >
              Refresh
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportToExcel}
              disabled={!Array.isArray(filteredData) || filteredData.length === 0}
              size="large"
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
          color="#52c41a"
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          title="Total Certifications"
          value={stats.actualCertified}
          suffix={` / ${stats.totalPossible}`}
          color="#1890ff"
        />
        <StatCard
          icon={<ExclamationCircleOutlined />}
          title="Compliance Rate"
          value={stats.complianceRate}
          suffix="%"
          color={stats.complianceRate >= 80 ? '#52c41a' : stats.complianceRate >= 60 ? '#faad14' : '#ff4d4f'}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <StyledCard style={{ textAlign: 'center', padding: '24px', width: '100%' }}>
            <Progress
              type="circle"
              percent={stats.complianceRate || 0}
              size={120}
              strokeColor={stats.complianceRate >= 80 ? '#52c41a' : stats.complianceRate >= 60 ? '#faad14' : '#ff4d4f'}
              format={(percent) => (
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{percent}%</div>
                  <div style={{ fontSize: '12px', color: '#8c8c8c' }}>Compliance</div>
                </div>
              )}
            />
          </StyledCard>
        </div>
      </StatsGrid>

      {/* Secondary Stats */}
      <StatsGrid>
        <StatCard
          icon={<CheckCircleOutlined />}
          title="Active Certifications"
          value={stats.totalActive}
          color="#52c41a"
        />
        <StatCard
          icon={<ExclamationCircleOutlined />}
          title="Expiring Soon"
          value={stats.expiringSoon}
          color="#fa8c16"
        />
        <StatCard
          icon={<ClockCircleOutlined />}
          title="Active Rate"
          value={stats.activeRate}
          suffix="%"
          color="#1890ff"
        />
      </StatsGrid>

      {/* Filters Section */}
      <StyledCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <Space>
            <FilterOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
            <Text strong style={{ fontSize: '16px' }}>Filters</Text>
          </Space>
          <Button 
            icon={<ClearOutlined />} 
            onClick={clearAllFilters}
            type="text"
          >
            Clear All
          </Button>
        </div>

        <FilterContainer>
          <FilterItem label="Search">
            <Search
              placeholder="Search hospitals or certifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              size="large"
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

          <FilterItem label="Date Range">
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
        <div style={{ marginBottom: '20px' }}>
          <Title level={4} style={{ margin: 0 }}>
            Certification Matrix ({stats.totalHospitals} hospitals)
          </Title>
        </div>

        {(!Array.isArray(filteredData) || filteredData.length === 0) && !loading ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <SearchOutlined style={{ fontSize: '48px', color: '#d9d9d9', marginBottom: '16px' }} />
            <Text type="secondary" style={{ fontSize: '16px' }}>
              No certification data found with current filters
            </Text>
          </div>
        ) : (
          renderMatrixTable()
        )}
      </StyledCard>

      {/* Certification Details Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CheckCircleOutlined style={{ color: '#1890ff' }} />
            <span>Certification Details</span>
          </div>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        footer={null}
        width={700}
      >
        {selectedCertDetail && (
          <div style={{ padding: '20px 0' }}>
            <Row gutter={[24, 20]}>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>HOSPITAL</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    {hospitals.find(h => h.id === selectedCertDetail.hospital_id)?.name}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>CERTIFICATION TYPE</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    {selectedCertDetail.certification_type}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>LEVEL</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    {selectedCertDetail.certification_level}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>CERTIFICATE NUMBER</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    <Text copyable>{selectedCertDetail.certificate_number}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>ISSUED DATE</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    {dayjs(selectedCertDetail.issued_date).format('DD MMMM YYYY')}
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>EXPIRY DATE</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    {dayjs(selectedCertDetail.expiry_date).format('DD MMMM YYYY')}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>ISSUING AUTHORITY</Text>
                  <div style={{ fontSize: '16px', marginTop: '4px' }}>
                    {selectedCertDetail.issuing_authority}
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div>
                  <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>STATUS</Text>
                  <div style={{ marginTop: '8px' }}>
                    {(() => {
                      const statusInfo = getCertificationStatus(selectedCertDetail);
                      const expiryDate = dayjs(selectedCertDetail.expiry_date);
                      const daysUntilExpiry = expiryDate.diff(dayjs(), 'days');
                      
                      return (
                        <Space>
                          <Tag 
                            color={statusInfo.status}
                            icon={statusInfo.icon}
                            style={{ 
                              padding: '4px 12px',
                              border: `1px solid ${statusInfo.color}`,
                              backgroundColor: `${statusInfo.color}15`
                            }}
                          >
                            {statusInfo.text}
                          </Tag>
                          <Text style={{ color: '#8c8c8c' }}>
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
                    <Text strong style={{ color: '#8c8c8c', fontSize: '12px' }}>REMARKS</Text>
                    <div style={{ fontSize: '16px', marginTop: '4px' }}>
                      {selectedCertDetail.remarks}
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>
    </StyledContainer>
  );
};

export default Q22_CertificationMatrix;
