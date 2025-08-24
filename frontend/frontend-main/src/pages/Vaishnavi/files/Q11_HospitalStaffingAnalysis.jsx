import React, { useState, useEffect } from 'react';
import { useStaffingData } from '../../../hooks/useStaffingData';
import { Select, Typography, Spin, Alert, Card, Statistic, Empty, Progress, Space } from 'antd';
import { Pie } from '@ant-design/plots';
import { UserOutlined, TeamOutlined, UsergroupAddOutlined } from '@ant-design/icons';

// Import the dedicated stylesheet for this component
import './styles/Q11_StaffingAnalysis.css';

const { Title, Paragraph } = Typography;

// --- Internal Component for Gauge Visualization ---
const RatioGauge = ({ title, ratio, gaugeValue, benchmark }) => {
  const getStatus = (value) => {
    if (value >= 90) return 'success';
    if (value >= 70) return 'normal';
    return 'exception';
  };

  const getStatusColor = (value) => {
    if (value >= 90) return '#52c41a'; // Green
    if (value >= 70) return '#1890ff'; // Blue
    return '#ff4d4f'; // Red
  };

  return (
    <div className="ratio-gauge-centered" data-status={getStatus(gaugeValue)}>
      <div className="gauge-content">
        <div className="gauge-title-section">
          <h4 className="gauge-main-title">{title}</h4>
        </div>
        
        <div className="gauge-value-section">
          <div className="gauge-primary-value" style={{ color: getStatusColor(gaugeValue) }}>
            {ratio.toFixed(2)}
          </div>
          <div className="gauge-benchmark-text">(Benchmark: {benchmark})</div>
        </div>

        <div className="gauge-progress-section">
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <Progress
              percent={gaugeValue}
              status={getStatus(gaugeValue)}
              strokeWidth={6}
              showInfo={false}
              className="centered-progress-bar"
              strokeColor={getStatusColor(gaugeValue)}
              style={{ 
                width: '100%', 
                textAlign: 'center',
                margin: '0 auto'
              }}
            />
          </div>
          <div className="gauge-status-text" style={{ color: getStatusColor(gaugeValue) }}>
            {gaugeValue}% of Ideal
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const StaffingAnalysis = () => {
  const [selectedHospitalId, setSelectedHospitalId] = useState(null);
  const { staffingData, allHospitals, loading, error } = useStaffingData();

  useEffect(() => {
    if (!selectedHospitalId && allHospitals.length > 0) {
      setSelectedHospitalId(allHospitals[0].value);
    }
  }, [allHospitals, selectedHospitalId]);

  const selectedHospitalData = staffingData.find(h => h.hospitalId === selectedHospitalId);
  
  const pieChartData = selectedHospitalData ? 
    Object.entries(selectedHospitalData.specialtyDistribution).map(([type, value]) => ({ type, value })) 
    : [];
  
  const pieConfig = {
    data: pieChartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.85,
    innerRadius: 0.6,
    label: {
      type: 'inner',
      offset: '-50%',
      content: '{value}',
      style: { textAlign: 'center', fontSize: 14, fill: '#FFF' },
    },
    interactions: [{ type: 'element-active' }],
    legend: { position: 'bottom' },
    color: ['#1890ff', '#52c41a', '#faad14', '#722ed1'],
  };

  if (loading) {
    return (
      <div className="staffing-analysis-container loading-state">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="staffing-analysis-container">
        <Alert message="Error Fetching Data" description={error.toString()} type="error" showIcon />
      </div>
    );
  }
  
  return (
    <div className="staffing-analysis-container">
      <header className="staffing-header">
        <div className="header-title">
          <Title level={2}>Hospital Staffing Analysis</Title>
          <Paragraph type="secondary">Analyze staff distribution and key ratios for a selected hospital.</Paragraph>
        </div>
        <Select
          showSearch
          value={selectedHospitalId}
          placeholder="Select a hospital"
          className="hospital-selector"
          onChange={(value) => setSelectedHospitalId(value)}
          options={allHospitals}
          filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
        />
      </header>

      {!selectedHospitalData ? (
        <Card>
          <Empty description="Select a hospital to view its staffing data." />
        </Card>
      ) : (
        <div className="staffing-content">
          {/* KPI Cards Section */}
          <div className="kpi-cards-section">
            <div className="kpi-cards-grid">
              <div className="kpi-card-wrapper">
                <Card className="kpi-card-staffing">
                  <div className="kpi-content">
                    <div className="kpi-icon">
                      <UserOutlined />
                    </div>
                    <div className="kpi-info">
                      <div className="kpi-title">Total Doctors</div>
                      <div className="kpi-value">{selectedHospitalData.totalDoctors}</div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="kpi-card-wrapper">
                <Card className="kpi-card-staffing">
                  <div className="kpi-content">
                    <div className="kpi-icon">
                      <TeamOutlined />
                    </div>
                    <div className="kpi-info">
                      <div className="kpi-title">Total Nurses</div>
                      <div className="kpi-value">{selectedHospitalData.totalNurses}</div>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="kpi-card-wrapper">
                <Card className="kpi-card-staffing">
                  <div className="kpi-content">
                    <div className="kpi-icon">
                      <UsergroupAddOutlined />
                    </div>
                    <div className="kpi-info">
                      <div className="kpi-title">Total Medical Staff</div>
                      <div className="kpi-value">{selectedHospitalData.totalDoctors + selectedHospitalData.totalNurses}</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="charts-section">
            <div className="charts-grid">
              <div className="chart-card-wrapper">
                <Card className="ratio-card" title="Staffing Ratios vs. Benchmarks">
                  <div className="ratios-container-centered">
                    <RatioGauge 
                      title="Doctor-to-Bed Ratio" 
                      ratio={selectedHospitalData.doctorToBedRatio}
                      gaugeValue={selectedHospitalData.doctorRatioGauge}
                      benchmark="1:3 (0.33)"
                    />
                    <RatioGauge 
                      title="Nurse-to-Bed Ratio" 
                      ratio={selectedHospitalData.nurseToBedRatio}
                      gaugeValue={selectedHospitalData.nurseRatioGauge}
                      benchmark="1:2 (0.50)"
                    />
                  </div>
                </Card>
              </div>
              
              <div className="chart-card-wrapper">
                <Card title="Doctor Distribution by Designation" className="pie-card">
                  <div className="pie-chart-container">
                    {pieChartData.length > 0 ? (
                      <Pie {...pieConfig} />
                    ) : (
                      <Empty description="No doctor data available." />
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffingAnalysis;
