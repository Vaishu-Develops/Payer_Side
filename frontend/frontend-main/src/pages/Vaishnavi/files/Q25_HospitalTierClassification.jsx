import React, { useState, useEffect, useMemo } from 'react';
import { 
  Card, Select, Button, Spin, Table, Tag, Badge, Progress, 
  Tooltip, Empty, Input, message 
} from 'antd';
import { 
  FileExcelOutlined, SortAscendingOutlined, FilterOutlined,
  StarOutlined, SafetyOutlined, ExclamationCircleOutlined,
  CrownOutlined, AimOutlined, TrophyOutlined, BankOutlined
} from '@ant-design/icons';
import { Doughnut, Scatter, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, registerables } from 'chart.js';
import * as XLSX from 'xlsx';
import moment from 'moment';
import dataService from '../../../services/dataService';

import './styles/Q25_HospitalTierClassification.css';

// Initialize ChartJS
ChartJS.register(...registerables);

const { Option } = Select;
const { Search } = Input;

const HospitalTierClassification = () => {
  // State Management
  const [loading, setLoading] = useState(true);
  const [hospitals, setHospitals] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [classifiedHospitals, setClassifiedHospitals] = useState([]);
  const [filters, setFilters] = useState({
    tier: 'all',
    sortBy: 'score',
    searchTerm: ''
  });

  // Tier Configuration
  const TIER_CONFIG = {
    1: {
      name: 'Premium',
      icon: CrownOutlined,
      color: '#16a34a',
      gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
      minScore: 80,
      maxScore: 100,
      description: 'Comprehensive hospitals with highest standards'
    },
    2: {
      name: 'Advanced',
      icon: StarOutlined,
      color: '#2563eb',
      gradient: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
      minScore: 65,
      maxScore: 79,
      description: 'Well-equipped hospitals with strong offerings'
    },
    3: {
      name: 'Standard',
      icon: SafetyOutlined,
      color: '#d97706',
      gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      minScore: 50,
      maxScore: 64,
      description: 'Competent hospitals meeting basic requirements'
    },
    4: {
      name: 'Developing',
      icon: ExclamationCircleOutlined,
      color: '#dc2626',
      gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
      minScore: 0,
      maxScore: 49,
      description: 'Hospitals requiring improvements'
    }
  };

  // Classification Algorithm
  const calculateHospitalScore = (hospital, hospitalMetrics, hospitalCertifications) => {
    if (!hospital) return { score: 0, tier: 4, scoreBreakdown: { capacity: 0, quality: 0, service: 0, infrastructure: 0 } };
    
    let score = 0;
    const scoreBreakdown = {
      capacity: 0,
      quality: 0,
      service: 0,
      infrastructure: 0
    };

    // 1. Capacity Score (30 points)
    const beds = hospital.beds_operational || 0;
    const doctorBedRatio = hospitalMetrics?.doctor_bed_ratio || 0;
    const nurseBedRatio = hospitalMetrics?.nurse_bed_ratio || 0;

    // Operational beds (12 points)
    if (beds >= 500) scoreBreakdown.capacity += 12;
    else if (beds >= 300) scoreBreakdown.capacity += 9;
    else if (beds >= 200) scoreBreakdown.capacity += 6;
    else if (beds >= 100) scoreBreakdown.capacity += 3;
    else scoreBreakdown.capacity += 1;

    // Doctor-bed ratio (10 points)
    if (doctorBedRatio > 0.2) scoreBreakdown.capacity += 10;
    else if (doctorBedRatio >= 0.15) scoreBreakdown.capacity += 8;
    else if (doctorBedRatio >= 0.1) scoreBreakdown.capacity += 5;
    else if (doctorBedRatio > 0) scoreBreakdown.capacity += 2;

    // Nurse-bed ratio (8 points)
    if (nurseBedRatio > 1.5) scoreBreakdown.capacity += 8;
    else if (nurseBedRatio >= 1.2) scoreBreakdown.capacity += 6;
    else if (nurseBedRatio >= 1.0) scoreBreakdown.capacity += 4;
    else if (nurseBedRatio > 0) scoreBreakdown.capacity += 2;

    // 2. Quality & Certifications (35 points)
    const activeCerts = Array.isArray(hospitalCertifications) ? 
      hospitalCertifications.filter(cert => 
        cert && cert.status === 'Active' && 
        cert.expiry_date && new Date(cert.expiry_date) > new Date()
      ) : [];

    activeCerts.forEach(cert => {
      if (!cert || !cert.certification_type) return;
      
      switch (cert.certification_type) {
        case 'JCI':
          if (cert.certification_level === 'Accredited') scoreBreakdown.quality += 15;
          break;
        case 'NABH':
          if (cert.certification_level === 'Accredited') scoreBreakdown.quality += 12;
          else if (cert.certification_level === 'Entry Level') scoreBreakdown.quality += 8;
          break;
        case 'ISO 9001':
          if (cert.certification_level === 'Certified') scoreBreakdown.quality += 8;
          break;
        case 'Green OT':
          if (cert.certification_level === 'Gold') scoreBreakdown.quality += 5;
          else if (cert.certification_level === 'Silver') scoreBreakdown.quality += 3;
          else if (cert.certification_level === 'Bronze') scoreBreakdown.quality += 2;
          break;
      }
    });

    // ICU doctor-bed ratio (5 points)
    const icuDoctorBedRatio = hospitalMetrics?.icu_doctor_bed_ratio || 0;
    if (icuDoctorBedRatio > 0.4) scoreBreakdown.quality += 5;
    else if (icuDoctorBedRatio >= 0.3) scoreBreakdown.quality += 4;
    else if (icuDoctorBedRatio >= 0.2) scoreBreakdown.quality += 3;
    else if (icuDoctorBedRatio > 0) scoreBreakdown.quality += 1;

    // 3. Service Excellence (20 points)
    // Hospital category (8 points)
    switch (hospital.category) {
      case 'Tertiary Care': scoreBreakdown.service += 8; break;
      case 'Secondary Care': scoreBreakdown.service += 5; break;
      case 'Primary Care': scoreBreakdown.service += 3; break;
    }

    // 24-hour operation (4 points)
    if (hospital.is_24hrs_operational) scoreBreakdown.service += 4;

    // Day care facility (3 points)
    if (hospital.is_day_care_available) scoreBreakdown.service += 3;

    // Center of excellence (5 points)
    if (hospital.center_of_excellence) scoreBreakdown.service += 5;

    // 4. Infrastructure & Safety (15 points)
    const builtUpArea = hospital.built_up_area_sqft || 0;

    // Built-up area (6 points)
    if (builtUpArea > 40000) scoreBreakdown.infrastructure += 6;
    else if (builtUpArea >= 30000) scoreBreakdown.infrastructure += 4;
    else if (builtUpArea >= 20000) scoreBreakdown.infrastructure += 3;
    else if (builtUpArea > 0) scoreBreakdown.infrastructure += 1;

    // Safety systems (5 points)
    let safetyScore = 0;
    if (hospital.has_fire_safety_system) safetyScore += 2.5;
    if (hospital.has_ramp_facility) safetyScore += 2.5;
    scoreBreakdown.infrastructure += Math.round(safetyScore);

    // Operational maturity (4 points)
    const currentYear = new Date().getFullYear();
    const yearsOperational = currentYear - (hospital.year_clinical_started || currentYear);
    if (yearsOperational > 10) scoreBreakdown.infrastructure += 4;
    else if (yearsOperational >= 5) scoreBreakdown.infrastructure += 3;
    else if (yearsOperational >= 2) scoreBreakdown.infrastructure += 2;
    else scoreBreakdown.infrastructure += 1;

    // Calculate total score
    score = scoreBreakdown.capacity + scoreBreakdown.quality + 
            scoreBreakdown.service + scoreBreakdown.infrastructure;

    // Determine tier
    let tier = 4;
    for (let t = 1; t <= 4; t++) {
      if (score >= TIER_CONFIG[t].minScore && score <= TIER_CONFIG[t].maxScore) {
        tier = t;
        break;
      }
    }

    return { score, tier, scoreBreakdown };
  };

  // Data Loading
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hospitalsRes, certificationsRes, metricsRes] = await Promise.all([
        dataService.getHospitals(),
        dataService.getAllHospitalCertifications(),
        dataService.getHospitalMetrics()
      ]);

      if (hospitalsRes.success && certificationsRes.success && metricsRes.success) {
        const hospitalsData = Array.isArray(hospitalsRes.data) 
          ? hospitalsRes.data 
          : hospitalsRes.data?.hospitals || [];
        
        const certificationsData = Array.isArray(certificationsRes.data) 
          ? certificationsRes.data 
          : certificationsRes.data?.certifications || [];

        const metricsData = Array.isArray(metricsRes.data) 
          ? metricsRes.data 
          : metricsRes.data?.metrics || [];

        setHospitals(hospitalsData);
        setCertifications(certificationsData);
        setMetrics(metricsData);

        // Process and classify hospitals
        const classified = hospitalsData.map(hospital => {
          const hospitalMetrics = metricsData.find(m => m.hospital_id === hospital.id) || {};
          const hospitalCertifications = certificationsData.filter(c => c.hospital_id === hospital.id && c.is_active === true) || [];
          
          const classification = calculateHospitalScore(hospital, hospitalMetrics, hospitalCertifications);
          
          return {
            ...hospital,
            metrics: hospitalMetrics,
            certifications: hospitalCertifications,
            ...classification
          };
        }).filter(hospital => hospital && hospital.id); // Filter out any invalid hospitals

        setClassifiedHospitals(classified);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Failed to load hospital data');
    } finally {
      setLoading(false);
    }
  };

  // Computed Data
  const summaryStats = useMemo(() => {
    if (!classifiedHospitals.length) return {
      totalHospitals: 0,
      premiumTierCount: 0,
      averageScore: 0,
      certifiedHospitals: 0
    };

    const totalHospitals = classifiedHospitals.length;
    const premiumTierCount = classifiedHospitals.filter(h => h.tier === 1).length;
    const averageScore = Math.round(
      classifiedHospitals.reduce((sum, h) => sum + h.score, 0) / totalHospitals
    );
    const certifiedHospitals = classifiedHospitals.filter(h => 
      h.certifications && h.certifications.some(c => c.status === 'Active')
    ).length;

    return {
      totalHospitals,
      premiumTierCount,
      averageScore,
      certifiedHospitals
    };
  }, [classifiedHospitals]);

  const tierDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0];
    classifiedHospitals.forEach(hospital => {
      distribution[hospital.tier - 1]++;
    });
    return distribution;
  }, [classifiedHospitals]);

  const filteredHospitals = useMemo(() => {
    let filtered = [...classifiedHospitals];

    // Apply tier filter
    if (filters.tier !== 'all') {
      filtered = filtered.filter(h => h.tier === parseInt(filters.tier));
    }

    // Apply search filter
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(h => 
        h.name.toLowerCase().includes(term) ||
        h.category?.toLowerCase().includes(term) ||
        TIER_CONFIG[h.tier].name.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'beds':
          return (b.beds_operational || 0) - (a.beds_operational || 0);
        case 'tier':
          return a.tier - b.tier;
        default:
          return 0;
      }
    });

    return filtered;
  }, [classifiedHospitals, filters]);

  // Event Handlers
  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleExportToExcel = () => {
    try {
      const wb = XLSX.utils.book_new();
      
      // Main hospital data
      const hospitalData = filteredHospitals.map((hospital, index) => ({
        'S.No': index + 1,
        'Hospital Name': hospital.name,
        'Tier': TIER_CONFIG[hospital.tier].name,
        'Score': hospital.score,
        'Category': hospital.category || 'N/A',
        'Operational Beds': hospital.beds_operational || 0,
        'Doctor-Bed Ratio': hospital.metrics?.doctor_bed_ratio || 0,
        'Nurse-Bed Ratio': hospital.metrics?.nurse_bed_ratio || 0,
        'Active Certifications': hospital.certifications?.filter(c => c.status === 'Active').length || 0,
        'Built-up Area (sqft)': hospital.built_up_area_sqft || 0,
        '24hrs Operation': hospital.is_24hrs_operational ? 'Yes' : 'No',
        'Center of Excellence': hospital.center_of_excellence || 'No'
      }));

      // Summary data
      const summaryData = [
        { Metric: 'Total Hospitals', Value: summaryStats.totalHospitals },
        { Metric: 'Premium Tier Hospitals', Value: summaryStats.premiumTierCount },
        { Metric: 'Average Score', Value: summaryStats.averageScore },
        { Metric: 'Certified Hospitals', Value: summaryStats.certifiedHospitals }
      ];

      // Tier distribution
      const tierData = Object.keys(TIER_CONFIG).map(tier => ({
        'Tier': `Tier ${tier} - ${TIER_CONFIG[tier].name}`,
        'Count': tierDistribution[tier - 1],
        'Percentage': Math.round((tierDistribution[tier - 1] / summaryStats.totalHospitals) * 100) + '%'
      }));

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(hospitalData), 'Hospital Classifications');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryData), 'Summary');
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(tierData), 'Tier Distribution');

      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      XLSX.writeFile(wb, `Hospital_Tier_Classification_${timestamp}.xlsx`);
      
      message.success('Excel file exported successfully!');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      message.error('Failed to export to Excel');
    }
  };

  // Render Functions
  const renderKPICards = () => (
    <div className="htc-kpi-row">
      <Card className="htc-kpi-card">
        <div className="htc-kpi-content">
          <div className="htc-kpi-icon-container" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
            <BankOutlined style={{ color: '#2563eb', fontSize: '24px' }} />
          </div>
          <div className="htc-kpi-details">
            <div className="htc-kpi-value">{summaryStats.totalHospitals}</div>
            <div className="htc-kpi-label">Hospitals Analyzed</div>
            <div className="htc-kpi-description">Total facilities in classification</div>
          </div>
        </div>
      </Card>

      <Card className="htc-kpi-card">
        <div className="htc-kpi-content">
          <div className="htc-kpi-icon-container" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <CrownOutlined style={{ color: '#16a34a', fontSize: '24px' }} />
          </div>
          <div className="htc-kpi-details">
            <div className="htc-kpi-value">{summaryStats.premiumTierCount}</div>
            <div className="htc-kpi-label">Premium Tier Hospitals</div>
            <div className="htc-kpi-description">Score 80+ with comprehensive services</div>
          </div>
        </div>
      </Card>

      <Card className="htc-kpi-card">
        <div className="htc-kpi-content">
          <div className="htc-kpi-icon-container" style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }}>
            <AimOutlined style={{ color: '#2563eb', fontSize: '24px' }} />
          </div>
          <div className="htc-kpi-details">
            <div className="htc-kpi-value">{summaryStats.averageScore}</div>
            <div className="htc-kpi-label">Average Performance Score</div>
            <div className="htc-kpi-description">System-wide quality benchmark</div>
          </div>
        </div>
      </Card>

      <Card className="htc-kpi-card">
        <div className="htc-kpi-content">
          <div className="htc-kpi-icon-container" style={{ backgroundColor: '#fefce8', borderColor: '#fef3c7' }}>
            <TrophyOutlined style={{ color: '#d97706', fontSize: '24px' }} />
          </div>
          <div className="htc-kpi-details">
            <div className="htc-kpi-value">{summaryStats.certifiedHospitals}</div>
            <div className="htc-kpi-label">Quality Certified</div>
            <div className="htc-kpi-description">JCI, NABH, or ISO certified facilities</div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderTierDistributionChart = () => {
    const data = {
      labels: Object.keys(TIER_CONFIG).map(tier => `Tier ${tier} - ${TIER_CONFIG[tier].name}`),
      datasets: [{
        data: tierDistribution,
        backgroundColor: Object.values(TIER_CONFIG).map(config => config.color),
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 12,
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.raw;
              const percentage = Math.round((value / summaryStats.totalHospitals) * 100);
              return `${context.label}: ${value} hospitals (${percentage}%)`;
            }
          }
        }
      },
      cutout: '50%'
    };

    return (
      <Card className="htc-chart-card">
        <div className="htc-chart-header">
          <h3>Tier Distribution</h3>
          <div className="htc-summary-value">{summaryStats.totalHospitals} <span>TOTAL HOSPITALS</span></div>
        </div>
        <div className="htc-chart-container">
          <Doughnut data={data} options={options} />
        </div>
      </Card>
    );
  };

  const renderCapacityQualityScatter = () => {
    const data = {
      datasets: [{
        label: 'Hospitals',
        data: filteredHospitals.map(hospital => ({
          x: hospital.beds_operational || 0,
          y: hospital.scoreBreakdown?.quality || 0,
          tier: hospital.tier,
          name: hospital.name,
          totalDoctors: hospital.metrics?.total_doctors || 0
        })),
        backgroundColor: filteredHospitals.map(h => TIER_CONFIG[h.tier].color + '80'),
        borderColor: filteredHospitals.map(h => TIER_CONFIG[h.tier].color),
        pointRadius: filteredHospitals.map(h => Math.max(5, (h.metrics?.total_doctors || 0) / 20)),
        pointHoverRadius: filteredHospitals.map(h => Math.max(8, (h.metrics?.total_doctors || 0) / 15)),
        pointHitRadius: 20
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: 'nearest',
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#555555',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 4,
          usePointStyle: true,
          callbacks: {
            title: (tooltipItems) => {
              const point = tooltipItems[0].raw;
              return point.name || 'Hospital';
            },
            label: (context) => {
              const point = context.raw;
              return [
                `Beds: ${point.x}`,
                `Quality Score: ${point.y}`,
                `Tier: ${TIER_CONFIG[point.tier]?.name || 'Unknown'}`,
                `Doctors: ${point.totalDoctors}`
              ];
            }
          }
        }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Operational Bed Capacity' },
          beginAtZero: true,
          ticks: {
            maxRotation: 0,
            autoSkip: true
          }
        },
        y: { 
          title: { display: true, text: 'Quality Score' },
          beginAtZero: true,
          max: 35
        }
      },
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 0,
          bottom: 10
        }
      }
    };

    return (
      <Card className="htc-chart-card">
        <div className="htc-chart-header">
          <h3>Capacity vs Quality Analysis</h3>
        </div>
        <div className="htc-chart-container htc-scatter-container">
          <Scatter data={data} options={options} />
        </div>
      </Card>
    );
  };

  const renderStaffingRatioChart = () => {
    const tierData = Object.keys(TIER_CONFIG).map(tier => {
      const tierHospitals = filteredHospitals.filter(h => h.tier === parseInt(tier));
      const avgDoctorRatio = tierHospitals.length ? 
        tierHospitals.reduce((sum, h) => sum + (h.metrics?.doctor_bed_ratio || 0), 0) / tierHospitals.length : 0;
      const avgNurseRatio = tierHospitals.length ?
        tierHospitals.reduce((sum, h) => sum + (h.metrics?.nurse_bed_ratio || 0), 0) / tierHospitals.length : 0;
      
      return {
        tier: `Tier ${tier}`,
        doctorRatio: parseFloat(avgDoctorRatio.toFixed(2)),
        nurseRatio: parseFloat(avgNurseRatio.toFixed(2))
      };
    });

    const data = {
      labels: tierData.map(d => d.tier),
      datasets: [
        {
          label: 'Doctor-Bed Ratio',
          data: tierData.map(d => d.doctorRatio),
          backgroundColor: '#2563eb',
          borderRadius: 4,
          hoverBackgroundColor: '#1e40af',
          borderWidth: 1,
          hoverBorderWidth: 2
        },
        {
          label: 'Nurse-Bed Ratio',
          data: tierData.map(d => d.nurseRatio),
          backgroundColor: '#16a34a',
          borderRadius: 4,
          hoverBackgroundColor: '#15803d',
          borderWidth: 1,
          hoverBorderWidth: 2
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top'
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#555555',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 4,
          intersect: false,
          callbacks: {
            title: (tooltipItems) => {
              return tooltipItems[0].label;
            },
            label: (context) => {
              const value = context.parsed.y;
              const label = context.dataset.label;
              return `${label}: ${value.toFixed(2)}`;
            }
          }
        }
      },
      scales: {
        x: { title: { display: true, text: 'Hospital Tiers' } },
        y: { 
          title: { display: true, text: 'Staffing Ratio' },
          beginAtZero: true
        }
      }
    };

    return (
      <Card className="htc-chart-card">
        <div className="htc-chart-header">
          <h3>Staffing Ratio Analysis</h3>
        </div>
        <div className="htc-chart-container htc-bar-container">
          <Bar data={data} options={options} />
        </div>
      </Card>
    );
  };

  const renderInfrastructureScoreChart = () => {
    const tierData = Object.keys(TIER_CONFIG).map(tier => {
      const tierHospitals = filteredHospitals.filter(h => h.tier === parseInt(tier));
      const scores = tierHospitals.map(h => h.scoreBreakdown?.infrastructure || 0);
      const avgScore = scores.length > 0 ? 
        scores.reduce((sum, score) => sum + score, 0) / scores.length : 
        0;
        
      return {
        tier: `Tier ${tier}`,
        avgScore: parseFloat(avgScore.toFixed(1))
      };
    });

    const data = {
      labels: tierData.map(d => d.tier),
      datasets: [{
        label: 'Average Infrastructure Score',
        data: tierData.map(d => d.avgScore),
        backgroundColor: Object.values(TIER_CONFIG).map(config => config.color + '80'),
        borderColor: Object.values(TIER_CONFIG).map(config => config.color),
        borderWidth: 2,
        hoverBackgroundColor: Object.values(TIER_CONFIG).map(config => config.color),
        hoverBorderWidth: 3
      }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: '#ffffff',
          bodyColor: '#ffffff',
          borderColor: '#555555',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 4,
          intersect: false,
          callbacks: {
            title: (tooltipItems) => {
              return tooltipItems[0].label;
            },
            label: (context) => {
              return `Average Score: ${context.parsed.y}`;
            }
          }
        }
      },
      scales: {
        x: { 
          title: { display: true, text: 'Hospital Tiers' },
          ticks: {
            maxRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: { 
          title: { display: true, text: 'Avg. Infrastructure Score' },
          beginAtZero: true,
          max: 15,
          ticks: {
            stepSize: 3
          }
        }
      },
      layout: {
        padding: {
          left: 5,
          right: 15,
          top: 0,
          bottom: 10
        }
      }
    };

    return (
      <Card className="htc-chart-card">
        <div className="htc-chart-header">
          <h3>Average Infrastructure Score by Tier</h3>
        </div>
        <div className="htc-chart-container htc-bar-container">
          {tierData.some(d => d.avgScore > 0) ? (
            <Bar data={data} options={options} />
          ) : (
            <div className="htc-empty-chart">
              <Empty description="No infrastructure score data available" />
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderHospitalTable = () => {
    const columns = [
      {
        title: 'Hospital Details',
        width: '23%',
        render: (_, record) => (
          <div className="htc-hospital-details">
            <div className="htc-hospital-name">{record.name}</div>
            <div className="htc-hospital-meta">
              <span>{record.hospital_type}</span>
              {record.category && <span> • {record.category}</span>}
            </div>
            <div className="htc-hospital-stats">
              <span>{record.beds_operational || 0} beds</span>
              <span> • {new Date().getFullYear() - (record.year_clinical_started || new Date().getFullYear())} years active</span>
            </div>
          </div>
        )
      },
      {
        title: 'Tier Classification',
        width: '20%',
        render: (_, record) => {
          const tierConfig = TIER_CONFIG[record.tier || 4];
          const IconComponent = tierConfig.icon;
          return (
            <div className="htc-tier-classification">
              <div className="htc-tier-badge" style={{ background: tierConfig.gradient }}>
                <IconComponent style={{ fontSize: '16px' }} />
                <span>Tier {record.tier || 4} - {tierConfig.name}</span>
              </div>
              <div className="htc-score-container">
                <div className="htc-score-value">{record.score || 0}/100</div>
                <Progress 
                  percent={record.score || 0} 
                  strokeColor={tierConfig.color}
                  showInfo={false}
                  size="small"
                />
              </div>
            </div>
          );
        }
      },
      {
        title: 'Capacity Metrics',
        width: '20%',
        render: (_, record) => (
          <div className="htc-capacity-metrics">
            <div className="htc-metric-item">
              <span className="htc-metric-label">Operational Beds:</span>
              <span className="htc-metric-value">{record.beds_operational || 0}</span>
            </div>
            <div className="htc-metric-item">
              <span className="htc-metric-label">Doctor-Bed Ratio:</span>
              <span className="htc-metric-value">
                {record.metrics?.doctor_bed_ratio?.toFixed(2) || 'N/A'}
              </span>
            </div>
            <div className="htc-metric-item">
              <span className="htc-metric-label">Nurse-Bed Ratio:</span>
              <span className="htc-metric-value">
                {record.metrics?.nurse_bed_ratio?.toFixed(2) || 'N/A'}
              </span>
            </div>
          </div>
        )
      },
      {
        title: 'Quality Indicators',
        width: '20%',
        render: (_, record) => (
          <div className="htc-quality-indicators">
            <div className="htc-certifications">
              {record.certifications && record.certifications.length > 0 ? (
                record.certifications
                  .filter(cert => cert.status === 'Active')
                  .map((cert, index) => (
                    <Tag key={index} color="blue" className="htc-cert-tag">
                      {cert.certification_type}
                    </Tag>
                  ))
              ) : (
                <Tag color="default">No Certifications</Tag>
              )}
            </div>
            <div className="htc-quality-score">
              Quality Score: {record.scoreBreakdown?.quality || 0}/35
            </div>
            {record.center_of_excellence && (
              <div className="htc-excellence">
                <Badge status="success" text="Center of Excellence" />
              </div>
            )}
          </div>
        )
      },
      {
        title: 'Infrastructure & Services',
        width: '18%',
        render: (_, record) => (
          <div className="htc-infrastructure">
            <div className="htc-metric-item">
              <span className="htc-metric-label">Built-up Area:</span>
              <span className="htc-metric-value">
                {record.built_up_area_sqft ? `${(record.built_up_area_sqft / 1000).toFixed(1)}k sqft` : 'N/A'}
              </span>
            </div>
            <div className="htc-metric-item">
              <span className="htc-metric-label">Years Operational:</span>
              <span className="htc-metric-value">
                {record.year_clinical_started ? `${new Date().getFullYear() - record.year_clinical_started}` : 'N/A'}
              </span>
            </div>
            <div className="htc-services">
              <Badge 
                status={record.is_24hrs_operational ? "success" : "default"} 
                text="24hrs Operation" 
              />
              <Badge 
                status={record.is_day_care_available ? "success" : "default"} 
                text="Day Care" 
              />
              <Badge 
                status={record.has_fire_safety_system ? "success" : "default"} 
                text="Fire Safety" 
              />
              <Badge 
                status={record.has_ramp_facility ? "success" : "default"} 
                text="Ramp Facility" 
              />
            </div>
            <div className="htc-infrastructure-score">
              Infrastructure: {record.scoreBreakdown?.infrastructure || 0}/15
            </div>
          </div>
        )
      }
    ];

    return (
      <Table 
        dataSource={filteredHospitals}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} hospitals`
        }}
        scroll={{ x: 1200 }}
      />
    );
  };

  if (loading) {
    return (
      <div className="hospital-tier-classification">
        <div className="htc-loading-container">
          <Spin size="large" />
          <p>Loading hospital classification data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hospital-tier-classification">
      {/* Header */}
      <div className="htc-header">
        <div className="htc-header-content">
          <h1 className="htc-main-title">Hospital Tier Classification System</h1>
          <p className="htc-subtitle">
            Evidence-based hospital performance analysis using capacity, quality, and infrastructure metrics
          </p>
        </div>
        <div className="htc-header-controls">
          <Select
            value={filters.tier}
            onChange={(value) => handleFilterChange('tier', value)}
            style={{ width: 200 }}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">All Tiers</Option>
            {Object.keys(TIER_CONFIG).map(tier => (
              <Option key={tier} value={tier}>
                Tier {tier} - {TIER_CONFIG[tier].name}
              </Option>
            ))}
          </Select>

          <Select
            value={filters.sortBy}
            onChange={(value) => handleFilterChange('sortBy', value)}
            style={{ width: 180 }}
            suffixIcon={<SortAscendingOutlined />}
          >
            <Option value="score">Sort by Score</Option>
            <Option value="name">Sort by Name</Option>
            <Option value="beds">Sort by Beds</Option>
            <Option value="tier">Sort by Tier</Option>
          </Select>

          <Button
            type="primary"
            icon={<FileExcelOutlined />}
            onClick={handleExportToExcel}
            style={{ backgroundColor: '#16a34a', borderColor: '#16a34a' }}
          >
            Export Report
          </Button>
        </div>
      </div>

      <div className="htc-content">
        {/* KPI Cards */}
        {renderKPICards()}

        {/* Charts Grid */}
        <div className="htc-charts-grid">
          <div className="htc-chart-item">
            {renderTierDistributionChart()}
          </div>
          <div className="htc-chart-item">
            {renderCapacityQualityScatter()}
          </div>
          <div className="htc-chart-item">
            {renderStaffingRatioChart()}
          </div>
          <div className="htc-chart-item">
            {renderInfrastructureScoreChart()}
          </div>
        </div>

        {/* Hospital Table */}
        <Card className="htc-table-card">
          <div className="htc-table-header">
            <h2>Hospital Classification Details</h2>
            <Search
              placeholder="Search hospitals..."
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              style={{ width: 300 }}
            />
          </div>
          {renderHospitalTable()}
        </Card>
      </div>
    </div>
  );
};

export default HospitalTierClassification;
