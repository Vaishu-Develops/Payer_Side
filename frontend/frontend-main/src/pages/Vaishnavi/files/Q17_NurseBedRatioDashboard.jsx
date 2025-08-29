import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Table,
  List,
  Tag,
  Badge,
  Space,
  Typography,
  Spin,
  Alert,
  Radio,
  Tooltip,
  Empty
} from 'antd';
import {
  UserOutlined,
  MedicineBoxOutlined,
  TrophyOutlined,
  AlertOutlined,
  LineChartOutlined,
  TeamOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  ScatterChart,
  Scatter,
  Legend,
  Cell
} from 'recharts';
import { fetchHospitalMetrics, fetchHospitals } from '../../../services/nurseRatioService';
import { 
  BENCHMARK_STANDARDS
} from '../../../utils/nurseRatioUtils';
import './styles/Q17_NurseBedRatioDashboard.css';

const { Title, Text } = Typography;
const { Option } = Select;

// Summary Statistics Cards Component
const SummaryCards = ({ summaryStats, totalHospitals }) => {
  const {
    avgGeneralRatio,
    avgIcuRatio,
    compliantCount,
    criticalOutliers
  } = summaryStats;

  const compliancePercent = Math.round((compliantCount / totalHospitals) * 100);

  return (
    <div className="summary-section">
      <div className="summary-cards-grid">
        <div className="summary-card-wrapper">
          <Card className="summary-card general-ratio">
            <div className="summary-content">
              <div className="summary-icon">
                <UserOutlined />
              </div>
              <div className="summary-info">
                <div className="summary-title">Average General Ratio</div>
                <div className="summary-value">{avgGeneralRatio.toFixed(3)}</div>
                <div className="summary-status">
                  {avgGeneralRatio >= 1.2 ? 'Above Benchmark' : 'Below Benchmark'} (1:2)
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="summary-card-wrapper">
          <Card className="summary-card icu-ratio">
            <div className="summary-content">
              <div className="summary-icon">
                <MedicineBoxOutlined />
              </div>
              <div className="summary-info">
                <div className="summary-title">Average ICU Ratio</div>
                <div className="summary-value">{avgIcuRatio.toFixed(3)}</div>
                <div className="summary-status">
                  {avgIcuRatio >= 0.5 ? 'Above Benchmark' : 'Below Benchmark'} (1:2)
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="summary-card-wrapper">
          <Card className="summary-card compliance">
            <div className="summary-content">
              <div className="summary-icon">
                <TrophyOutlined />
              </div>
              <div className="summary-info">
                <div className="summary-title">Compliant Hospitals</div>
                <div className="summary-value">{compliantCount}/{totalHospitals}</div>
                <Progress 
                  percent={compliancePercent} 
                  strokeColor="#52c41a" 
                  trailColor="#f0f0f0"
                  strokeWidth={6}
                  showInfo={false}
                  className="summary-progress"
                />
                <div className="summary-status">{compliancePercent}% Meeting Standards</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="summary-card-wrapper">
          <Card className="summary-card outliers">
            <div className="summary-content">
              <div className="summary-icon">
                <AlertOutlined />
              </div>
              <div className="summary-info">
                <div className="summary-title">Below Optimal</div>
                <div className="summary-value">{criticalOutliers}</div>
                <div className="summary-status">
                  {criticalOutliers > 0 ? 'General < 1.0 OR ICU < 0.8' : 'All Above Thresholds'}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// Benchmark Comparison Chart Component
const BenchmarkComparisonChart = ({ hospitals, chartType }) => {
  const chartData = hospitals.slice(0, 15).map(hospital => ({
    name: hospital.name.length > 12 ? hospital.name.substring(0, 12) + '...' : hospital.name,
    fullName: hospital.name,
    generalRatio: hospital.nurse_bed_ratio || 0,
    icuRatio: hospital.icu_nurse_bed_ratio || 0,
    hospitalType: hospital.hospital_type,
    bedsOperational: hospital.beds_operational,
    qualifiedNurses: hospital.qualified_nurses
  })).sort((a, b) => {
    if (chartType === 'general') return b.generalRatio - a.generalRatio;
    return b.icuRatio - a.icuRatio;
  });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="chart-tooltip">
          <div className="tooltip-title">{data.fullName}</div>
          <div className="tooltip-content">
            <div><strong>General Ratio:</strong> {data.generalRatio.toFixed(3)}</div>
            <div><strong>ICU Ratio:</strong> {data.icuRatio.toFixed(3)}</div>
            <div><strong>Type:</strong> {data.hospitalType}</div>
            <div><strong>Beds:</strong> {data.bedsOperational?.toLocaleString()}</div>
            <div><strong>Nurses:</strong> {data.qualifiedNurses?.toLocaleString()}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={100}
            fontSize={12}
            stroke="#666"
          />
          <YAxis 
            label={{ value: 'Nurse-to-Bed Ratio', angle: -90, position: 'insideLeft' }}
            fontSize={12}
            stroke="#666"
          />
          <RechartsTooltip content={<CustomTooltip />} />
          <Legend />
          
          <ReferenceLine 
            y={1.2} 
            stroke="#faad14" 
            strokeDasharray="5 5" 
            label={{ value: 'General Benchmark (1:2)', position: 'topRight', fontSize: 12 }}
          />
          <ReferenceLine 
            y={0.5} 
            stroke="#1890ff" 
            strokeDasharray="5 5" 
            label={{ value: 'ICU Benchmark (1:2)', position: 'topRight', fontSize: 12 }}
          />
          
          <Bar 
            dataKey="generalRatio" 
            name="General Ward Ratio"
            fill="#52c41a" 
            opacity={0.8}
          />
          <Bar 
            dataKey="icuRatio" 
            name="ICU Ratio"
            fill="#1890ff" 
            opacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Hospital Ranking List Component
const HospitalRankingList = ({ hospitals, rankingType }) => {
  const rankedHospitals = hospitals
    .sort((a, b) => {
      const aRatio = rankingType === 'general' ? a.nurse_bed_ratio : a.icu_nurse_bed_ratio;
      const bRatio = rankingType === 'general' ? b.nurse_bed_ratio : b.icu_nurse_bed_ratio;
      return bRatio - aRatio;
    })
    .map((hospital, index) => ({ ...hospital, rank: index + 1 }))
    .slice(0, 10);

  return (
    <div className="ranking-list">
      {rankedHospitals.map((hospital) => (
        <div key={hospital.id} className="ranking-item">
          <div className="rank-badge">
            <Badge 
              count={hospital.rank} 
              style={{ 
                backgroundColor: hospital.rank <= 3 ? '#52c41a' : '#1890ff',
                fontSize: '12px',
                minWidth: '22px',
                height: '22px',
                lineHeight: '20px'
              }} 
            />
          </div>
          <div className="ranking-content">
            <div className="hospital-info">
              <Text strong className="hospital-name">
                {hospital.name.length > 30 ? hospital.name.substring(0, 30) + '...' : hospital.name}
              </Text>
              <Text type="secondary" className="hospital-type">({hospital.hospital_type})</Text>
            </div>
            <div className="ranking-metrics">
              <Space size={16}>
                <Text className="ratio-text">
                  <strong>General:</strong> {(hospital.nurse_bed_ratio || 0).toFixed(3)}
                </Text>
                <Text className="ratio-text">
                  <strong>ICU:</strong> {(hospital.icu_nurse_bed_ratio || 0).toFixed(3)}
                </Text>
              </Space>
              <div className="hospital-stats">
                <Text type="secondary" className="beds-nurses">
                  Beds: {hospital.beds_operational?.toLocaleString()} | Nurses: {hospital.qualified_nurses?.toLocaleString()}
                </Text>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Hospital Details Table Component
const HospitalDetailsTable = ({ hospitals, loading }) => {
  const columns = [
    {
      title: 'Hospital',
      dataIndex: 'name',
      width: 250,
      fixed: 'left',
      render: (name) => (
        <Tooltip title={name}>
          <Text strong className="hospital-name-cell">
            {name.length > 30 ? name.substring(0, 30) + '...' : name}
          </Text>
        </Tooltip>
      )
    },
    {
      title: 'Type',
      dataIndex: 'hospital_type',
      width: 150,
      filters: [
        { text: 'Multi Specialty', value: 'Multi Specialty' },
        { text: 'Tertiary Care', value: 'Tertiary Care' },
        { text: 'Super Specialty', value: 'Super Specialty' }
      ],
      onFilter: (value, record) => record.hospital_type === value
    },
    {
      title: 'Operational Beds',
      dataIndex: 'beds_operational',
      width: 140,
      sorter: (a, b) => (a.beds_operational || 0) - (b.beds_operational || 0),
      render: (beds) => <Text>{beds?.toLocaleString() || 'N/A'}</Text>
    },
    {
      title: 'Qualified Nurses',
      dataIndex: 'qualified_nurses',
      width: 150,
      sorter: (a, b) => (a.qualified_nurses || 0) - (b.qualified_nurses || 0),
      render: (nurses) => <Text>{nurses?.toLocaleString() || 'N/A'}</Text>
    },
    {
      title: 'General Ratio',
      dataIndex: 'nurse_bed_ratio',
      width: 130,
      sorter: (a, b) => (a.nurse_bed_ratio || 0) - (b.nurse_bed_ratio || 0),
      render: (ratio) => (
        <Text 
          type={(ratio || 0) >= 1.2 ? 'success' : 'danger'}
          strong
        >
          {(ratio || 0).toFixed(3)}
        </Text>
      )
    },
    {
      title: 'ICU Ratio',
      dataIndex: 'icu_nurse_bed_ratio',
      width: 120,
      sorter: (a, b) => (a.icu_nurse_bed_ratio || 0) - (b.icu_nurse_bed_ratio || 0),
      render: (ratio) => (
        <Text 
          type={(ratio || 0) >= 0.5 ? 'success' : 'danger'}
          strong
        >
          {(ratio || 0).toFixed(3)}
        </Text>
      )
    },
    {
      title: 'Compliance',
      width: 120,
      render: (_, hospital) => {
        const generalCompliant = (hospital.nurse_bed_ratio || 0) >= 1.2;
        const icuCompliant = (hospital.icu_nurse_bed_ratio || 0) >= 0.5;
        const isCompliant = generalCompliant && icuCompliant;
        
        return (
          <Tag color={isCompliant ? 'green' : 'red'} className="compliance-tag">
            {isCompliant ? 'Compliant' : 'Non-Compliant'}
          </Tag>
        );
      }
    }
  ];

  return (
    <div className="table-container">
      <Table
        columns={columns}
        dataSource={hospitals}
        rowKey="id"
        scroll={{ x: 1200 }}
        pagination={{
          pageSize: 8,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} hospitals`
        }}
        size="small"
        loading={loading}
        className="hospital-details-table"
      />
    </div>
  );
};

// Main Dashboard Component
const NurseBedRatioDashboard = () => {
  const [hospitals, setHospitals] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [chartType, setChartType] = useState('general');
  const [rankingType, setRankingType] = useState('general');

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        console.log('🔄 Loading Q17 Nurse-to-Bed Ratio data from backend...');
        
        // Fetch real data from backend JSON files
        const [hospitalsResponse, metricsResponse] = await Promise.all([
          fetchHospitals(),
          fetchHospitalMetrics()
        ]);
        
        console.log('✅ Hospitals data loaded:', hospitalsResponse.length, 'hospitals');
        console.log('✅ Metrics data loaded:', metricsResponse.length, 'metrics records');
        
        setHospitals(hospitalsResponse);
        setMetrics(metricsResponse);
      } catch (err) {
        console.error('❌ Failed to load Q17 data:', err);
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Combine hospitals and metrics data
  const combinedData = useMemo(() => {
    if (!hospitals.length || !metrics.length) return [];
    
    console.log('🔄 Combining hospitals and metrics data...');
    
    // Create a map of metrics by hospital_id for quick lookup
    const metricsMap = new Map();
    metrics.forEach(metric => {
      if (metric.hospital_id) {
        metricsMap.set(metric.hospital_id, metric);
      }
    });
    
    // Merge hospital data with corresponding metrics
    const combined = hospitals.map(hospital => {
      const hospitalMetrics = metricsMap.get(hospital.id);
      
      if (hospitalMetrics) {
        return {
          ...hospital,
          qualified_nurses: hospitalMetrics.qualified_nurses || 0,
          icu_nurses_all_shifts: hospitalMetrics.icu_nurses_all_shifts || 0,
          nurse_bed_ratio: hospitalMetrics.nurse_bed_ratio || 0,
          icu_nurse_bed_ratio: hospitalMetrics.icu_nurse_bed_ratio || 0
        };
      }
      
      // Hospital without metrics data
      return {
        ...hospital,
        qualified_nurses: 0,
        icu_nurses_all_shifts: 0,
        nurse_bed_ratio: 0,
        icu_nurse_bed_ratio: 0
      };
    }).filter(hospital => hospital.nurse_bed_ratio > 0); // Only include hospitals with valid ratios
    
    console.log('✅ Combined data ready:', combined.length, 'hospitals with metrics');
    return combined;
  }, [hospitals, metrics]);

  // Filter data based on hospital type
  const filteredData = useMemo(() => {
    if (filterType === 'all') return combinedData;
    return combinedData.filter(hospital => hospital.hospital_type === filterType);
  }, [combinedData, filterType]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!filteredData.length) {
      return { avgGeneralRatio: 0, avgIcuRatio: 0, compliantCount: 0, criticalOutliers: 0 };
    }

    const avgGeneralRatio = filteredData.reduce((sum, h) => sum + (h.nurse_bed_ratio || 0), 0) / filteredData.length;
    const avgIcuRatio = filteredData.reduce((sum, h) => sum + (h.icu_nurse_bed_ratio || 0), 0) / filteredData.length;
    
    // Hospitals meeting benchmark standards (General >= 1.2 AND ICU >= 0.5)
    const compliantCount = filteredData.filter(h => 
      (h.nurse_bed_ratio || 0) >= 1.2 && (h.icu_nurse_bed_ratio || 0) >= 0.5
    ).length;
    
    // Critical outliers: significantly below benchmarks (General < 1.0 OR ICU < 0.8)
    // Adjusted criteria to be more realistic for actual data
    const criticalOutliers = filteredData.filter(h => 
      (h.nurse_bed_ratio || 0) < 1.0 || (h.icu_nurse_bed_ratio || 0) < 0.8
    ).length;

    console.log('📊 Summary Stats:', {
      totalHospitals: filteredData.length,
      avgGeneralRatio: avgGeneralRatio.toFixed(3),
      avgIcuRatio: avgIcuRatio.toFixed(3),
      compliantCount,
      criticalOutliers,
      sampleRatios: filteredData.slice(0, 3).map(h => ({
        name: h.name,
        general: h.nurse_bed_ratio,
        icu: h.icu_nurse_bed_ratio
      }))
    });
    
    return { avgGeneralRatio, avgIcuRatio, compliantCount, criticalOutliers };
  }, [filteredData]);

  // Get unique hospital types for filter
  const hospitalTypes = useMemo(() => {
    return [...new Set(combinedData.map(h => h.hospital_type))].filter(Boolean);
  }, [combinedData]);

  if (loading) {
    return (
      <div className="nurse-ratio-dashboard-loading">
        <Spin size="large" />
        <Title level={4}>Loading Nurse-to-Bed Ratio Analysis...</Title>
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error Loading Data"
        description={error}
        type="error"
        showIcon
        className="nurse-ratio-dashboard-error"
      />
    );
  }

  if (filteredData.length === 0) {
    return (
      <Empty 
        description="No hospital data available for analysis"
        className="nurse-ratio-dashboard-empty"
      />
    );
  }

  return (
    <div className="nurse-ratio-dashboard">
      {/* Header Section */}
      <div className="dashboard-header">
        <div className="header-content">
          {/* Changed to proper heading */}
          <Title level={1} className="page-title">Nurse-to-Bed Ratio Benchmarking</Title>
          <Text type="secondary">Analyze staffing ratios and compliance across hospitals with industry benchmarks.</Text>
        </div>
        
        <div className="header-controls">
          <div className="control-group">
            <Text className="control-label">Hospital Type:</Text>
            <Select
              value={filterType}
              onChange={setFilterType}
              className="type-selector"
              placeholder="Filter by Hospital Type"
            >
              <Option value="all">All Hospitals ({combinedData.length})</Option>
              {hospitalTypes.map(type => (
                <Option key={type} value={type}>
                  {type} ({combinedData.filter(h => h.hospital_type === type).length})
                </Option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* KPI Summary Cards */}
        <SummaryCards 
          summaryStats={summaryStats} 
          totalHospitals={filteredData.length} 
        />

        {/* Main Content Grid */}
        <div className="content-grid">
          {/* Chart Section */}
          <div className="chart-section">
            <Card 
              title={
                <Space>
                  <LineChartOutlined />
                  <span>Benchmark Comparison Chart</span>
                </Space>
              }
              className="chart-card"
              extra={
                <Radio.Group 
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                  size="small"
                >
                  <Radio.Button value="general">General Ward</Radio.Button>
                  <Radio.Button value="icu">ICU Focus</Radio.Button>
                </Radio.Group>
              }
            >
              <BenchmarkComparisonChart 
                hospitals={filteredData} 
                chartType={chartType}
              />
            </Card>
          </div>

          {/* Ranking Section */}
          <div className="ranking-section">
            <Card 
              title={
                <Space>
                  <TrophyOutlined />
                  <span>Performance Ranking</span>
                </Space>
              }
              className="ranking-card"
              extra={
                <Radio.Group 
                  value={rankingType} 
                  onChange={(e) => setRankingType(e.target.value)}
                  size="small"
                >
                  <Radio.Button value="general">General</Radio.Button>
                  <Radio.Button value="icu">ICU</Radio.Button>
                </Radio.Group>
              }
            >
              <HospitalRankingList 
                hospitals={filteredData} 
                rankingType={rankingType}
              />
            </Card>
          </div>

          {/* Table Section */}
          <div className="table-section">
            <Card 
              title={
                <Space>
                  <SafetyOutlined />
                  <span>Hospital Details & Compliance</span>
                </Space>
              }
              className="table-card"
            >
              <HospitalDetailsTable 
                hospitals={filteredData} 
                loading={loading}
              />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NurseBedRatioDashboard;
