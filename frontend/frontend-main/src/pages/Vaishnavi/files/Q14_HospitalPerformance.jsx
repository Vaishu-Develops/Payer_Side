import React, { useState, useEffect } from 'react';
import './Q14_HospitalPerformance.css';
import api from '../../../services/api';

// Function to fetch metrics from the API
const fetchHospitalMetrics = async () => {
    try {
        const response = await api.get('/analytics/hospital-metrics');
        return response.data;
    } catch (error) {
        console.error('Error fetching hospital metrics:', error);
        return null;
    }
};

// Fallback metrics data (will only be used if API fails)
const fallbackMetricsData = {
    "currentMetrics": {
        "financial": {
            "revenue": 45000000,
            "operatingMargin": 12.5,
            "costPerPatient": 8500,
            "target": {
                "revenue": 48000000,
                "operatingMargin": 15.0,
                "costPerPatient": 8000
            }
        },
        "quality": {
            "patientSatisfaction": 85,
            "readmissionRate": 8.2,
            "safetyRating": "A",
            "target": {
                "patientSatisfaction": 90,
                "readmissionRate": 7.0,
                "safetyRating": "A+"
            }
        },
        "operational": {
            "bedOccupancy": 78,
            "avgLengthOfStay": 4.2,
            "nursePatientRatio": 1.4,
            "target": {
                "bedOccupancy": 85,
                "avgLengthOfStay": 3.8,
                "nursePatientRatio": 1.2
            }
        }
    },
    "monthlyTrends": [
        { "month": "Jan", "revenue": 4200000, "satisfaction": 82, "bedOccupancy": 75, "operatingMargin": 11.2 },
        { "month": "Feb", "revenue": 3900000, "satisfaction": 84, "bedOccupancy": 73, "operatingMargin": 10.8 },
        { "month": "Mar", "revenue": 4100000, "satisfaction": 83, "bedOccupancy": 76, "operatingMargin": 11.5 },
        { "month": "Apr", "revenue": 3800000, "satisfaction": 85, "bedOccupancy": 74, "operatingMargin": 10.9 },
        { "month": "May", "revenue": 4300000, "satisfaction": 86, "bedOccupancy": 79, "operatingMargin": 12.1 },
        { "month": "Jun", "revenue": 4500000, "satisfaction": 87, "bedOccupancy": 81, "operatingMargin": 12.8 },
        { "month": "Jul", "revenue": 4600000, "satisfaction": 85, "bedOccupancy": 80, "operatingMargin": 13.2 },
        { "month": "Aug", "revenue": 4400000, "satisfaction": 84, "bedOccupancy": 78, "operatingMargin": 12.5 },
        { "month": "Sep", "revenue": 4200000, "satisfaction": 86, "bedOccupancy": 77, "operatingMargin": 12.0 },
        { "month": "Oct", "revenue": 4700000, "satisfaction": 88, "bedOccupancy": 82, "operatingMargin": 13.5 },
        { "month": "Nov", "revenue": 4800000, "satisfaction": 87, "bedOccupancy": 83, "operatingMargin": 13.8 },
        { "month": "Dec", "revenue": 4900000, "satisfaction": 85, "bedOccupancy": 78, "operatingMargin": 12.5 }
    ],
    "departmentComparison": [
        { "department": "Emergency", "satisfaction": 82, "efficiency": 88, "cost": 12500 },
        { "department": "Surgery", "satisfaction": 91, "efficiency": 85, "cost": 25000 },
        { "department": "Cardiology", "satisfaction": 89, "efficiency": 92, "cost": 18500 },
        { "department": "Pediatrics", "satisfaction": 94, "efficiency": 87, "cost": 8500 },
        { "department": "Oncology", "satisfaction": 86, "efficiency": 83, "cost": 32000 },
        { "department": "Orthopedics", "satisfaction": 88, "efficiency": 89, "cost": 15500 }
    ],
    "peerComparison": [
        {
            "hospital": "Regional Medical Center",
            "bedOccupancy": 78,
            "satisfaction": 85,
            "operatingMargin": 12.5,
            "readmissionRate": 8.2,
            "safetyRating": "A",
            "isCurrentHospital": true
        },
        {
            "hospital": "City General Hospital",
            "bedOccupancy": 82,
            "satisfaction": 87,
            "operatingMargin": 14.2,
            "readmissionRate": 7.8,
            "safetyRating": "A+"
        },
        {
            "hospital": "Metropolitan Health Center",
            "bedOccupancy": 75,
            "satisfaction": 83,
            "operatingMargin": 11.8,
            "readmissionRate": 8.9,
            "safetyRating": "A"
        },
        {
            "hospital": "University Medical Center",
            "bedOccupancy": 88,
            "satisfaction": 89,
            "operatingMargin": 15.1,
            "readmissionRate": 7.2,
            "safetyRating": "A+"
        },
        {
            "hospital": "Community Hospital",
            "bedOccupancy": 71,
            "satisfaction": 81,
            "operatingMargin": 9.5,
            "readmissionRate": 9.1,
            "safetyRating": "B+"
        }
    ],
    "hospitalInfo": {
        "name": "Regional Medical Center",
        "location": "New York, NY",
        "beds": 450,
        "established": 1985,
        "lastUpdated": "2024-12-15T10:30:00Z"
    }
};

const HospitalPerformance = () => {
    const [metricsData, setMetricsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('revenue');

    // Icon symbol mapping
    const getIconSymbol = (iconName) => {
        const iconMap = {
            'fa-dollar-sign': '💰',
            'fa-chart-line': '📈',
            'fa-heart': '❤️',
            'fa-bed': '🏥',
            'fa-user-md': '👨‍⚕️',
            'fa-calculator': '🧮'
        };
        return iconMap[iconName] || '📊';
    };

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchHospitalMetrics();
                if (data) {
                    setMetricsData(data);
                } else {
                    console.log('Falling back to local data');
                    setMetricsData(fallbackMetricsData);
                }
            } catch (error) {
                console.error('Error loading metrics data:', error);
                setMetricsData(fallbackMetricsData);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []);

    // KPI Card Component
    const KPICard = ({ title, value, target, unit, trend, icon }) => {
        const percentage = target ? ((value / target) * 100).toFixed(1) : 0;
        const isGood = percentage >= 95;
        const trendValue = trend || 0;

        return (
            <div className="kpi-card card h-100">
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div className="kpi-icon">
                            <span className="text-primary fs-4">{getIconSymbol(icon)}</span>
                        </div>
                        <span className={`badge ${isGood ? 'bg-success' : 'bg-warning'}`}>
                            {percentage}% of target
                        </span>
                    </div>
                    <h6 className="card-title text-muted mb-2">{title}</h6>
                    <div className="d-flex align-items-baseline mb-2">
                        <h3 className="text-primary mb-0">
                            {typeof value === 'number' ? value.toLocaleString() : value}
                            <small className="text-muted ms-1">{unit}</small>
                        </h3>
                        {trendValue !== 0 && (
                            <span className={`ms-2 small ${trendValue > 0 ? 'text-success' : 'text-danger'}`}>
                                {trendValue > 0 ? '↗' : '↘'} {Math.abs(trendValue)}%
                            </span>
                        )}
                    </div>
                    <div className="progress mb-2" style={{ height: '4px' }}>
                        <div
                            className={`progress-bar ${isGood ? 'bg-success' : 'bg-warning'}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                        ></div>
                    </div>
                    <small className="text-muted">
                        Target: {typeof target === 'number' ? target.toLocaleString() : target}{unit}
                    </small>
                </div>
            </div>
        );
    };

    // Gauge Chart Component (Simple CSS-based)
    const GaugeChart = ({ value, max, title, color = 'primary' }) => {
        const percentage = (value / max) * 100;
        const rotation = (percentage / 100) * 180 - 90;

        return (
            <div className="gauge-chart text-center">
                <h6 className="mb-3">{title}</h6>
                <div className="gauge-container position-relative mx-auto">
                    <div className="gauge-bg"></div>
                    <div
                        className={`gauge-needle bg-${color}`}
                        style={{ transform: `rotate(${rotation}deg)` }}
                    ></div>
                    <div className="gauge-center"></div>
                    <div className="gauge-value">
                        <strong>{value}%</strong>
                    </div>
                </div>
            </div>
        );
    };

    // Simple Line Chart Component
    const SimpleLineChart = ({ data, dataKey, title }) => {
        if (!data || data.length === 0) return null;
        const maxValue = Math.max(...data.map(item => item[dataKey]));
        const minValue = Math.min(...data.map(item => item[dataKey]));
        const range = maxValue - minValue;

        return (
            <div className="simple-chart">
                <h6 className="mb-3">{title}</h6>
                <div className="chart-container">
                    <svg width="100%" height="200" viewBox="0 0 400 200">
                        {/* Grid lines */}
                        {[0, 1, 2, 3, 4].map(i => (
                            <line
                                key={i}
                                x1="40"
                                y1={40 + i * 30}
                                x2="380"
                                y2={40 + i * 30}
                                stroke="#e0e0e0"
                                strokeWidth="1"
                            />
                        ))}

                        {/* Data line */}
                        <polyline
                            fill="none"
                            stroke="#007bff"
                            strokeWidth="3"
                            points={data.map((item, index) => {
                                const x = 40 + (index * (340 / (data.length - 1)));
                                const y = 160 - ((item[dataKey] - minValue) / range) * 120;
                                return `${x},${y}`;
                            }).join(' ')}
                        />

                        {/* Data points */}
                        {data.map((item, index) => {
                            const x = 40 + (index * (340 / (data.length - 1)));
                            const y = 160 - ((item[dataKey] - minValue) / range) * 120;
                            return (
                                <circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r="4"
                                    fill="#007bff"
                                />
                            );
                        })}

                        {/* X-axis labels */}
                        {data.map((item, index) => {
                            const x = 40 + (index * (340 / (data.length - 1)));
                            return (
                                <text
                                    key={index}
                                    x={x}
                                    y="185"
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#666"
                                >
                                    {item.month}
                                </text>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };

    // Bar Chart Component
    const SimpleBarChart = ({ data, title }) => {
        if (!data || data.length === 0) return null;
        const maxValue = Math.max(...data.map(item => item.satisfaction));

        return (
            <div className="simple-chart">
                <h6 className="mb-3">{title}</h6>
                <div className="chart-container">
                    <svg width="100%" height="250" viewBox="0 0 400 250">
                        {data.map((item, index) => {
                            const barHeight = (item.satisfaction / maxValue) * 150;
                            const x = 50 + index * 50;
                            const y = 180 - barHeight;

                            return (
                                <g key={index}>
                                    <rect
                                        x={x}
                                        y={y}
                                        width="30"
                                        height={barHeight}
                                        fill="#28a745"
                                        rx="2"
                                    />
                                    <text
                                        x={x + 15}
                                        y={y - 5}
                                        textAnchor="middle"
                                        fontSize="10"
                                        fill="#333"
                                    >
                                        {item.satisfaction}%
                                    </text>
                                    <text
                                        x={x + 15}
                                        y="200"
                                        textAnchor="middle"
                                        fontSize="9"
                                        fill="#666"
                                        transform={`rotate(-45, ${x + 15}, 200)`}
                                    >
                                        {item.department}
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!metricsData || !metricsData.currentMetrics) {
        return (
            <div className="alert alert-danger">
                <h5>Error Loading Data</h5>
                <p>Unable to load hospital performance metrics. Please try again later.</p>
            </div>
        );
    }

    const { currentMetrics, monthlyTrends, departmentComparison, peerComparison, hospitalInfo } = metricsData;

    return (
        <div className="hospital-performance">
            <div className="container-fluid">
                {/* Header */}
                <div className="performance-header mb-4">
                    <div className="row align-items-center">
                        <div className="col-md-8">
                            <h1 className="display-5 text-primary mb-2">Hospital Performance Dashboard</h1>
                            <p className="lead text-muted mb-0">
                                {hospitalInfo?.name || 'Hospital Name'} - {hospitalInfo?.location || 'Location'}
                            </p>
                            <small className="text-muted">
                                Last updated: {hospitalInfo?.lastUpdated ? new Date(hospitalInfo.lastUpdated).toLocaleDateString() : new Date().toLocaleDateString()}
                            </small>
                        </div>
                        <div className="col-md-4 text-end">
                            <div className="hospital-stats">
                                <div className="stat-item">
                                    <strong>{hospitalInfo?.beds || 0}</strong>
                                    <small className="d-block text-muted">Total Beds</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="row g-3 mb-4">
                    <div className="col-lg-2 col-md-4 col-sm-6">
                        <KPICard
                            title="Revenue"
                            value={currentMetrics.financial.revenue}
                            target={currentMetrics.financial.target.revenue}
                            unit=""
                            trend={5.2}
                            icon="fa-dollar-sign"
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6">
                        <KPICard
                            title="Operating Margin"
                            value={currentMetrics.financial.operatingMargin}
                            target={currentMetrics.financial.target.operatingMargin}
                            unit="%"
                            trend={-1.8}
                            icon="fa-chart-line"
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6">
                        <KPICard
                            title="Patient Satisfaction"
                            value={currentMetrics.quality.patientSatisfaction}
                            target={currentMetrics.quality.target.patientSatisfaction}
                            unit="%"
                            trend={2.1}
                            icon="fa-heart"
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6">
                        <KPICard
                            title="Bed Occupancy"
                            value={currentMetrics.operational.bedOccupancy}
                            target={currentMetrics.operational.target.bedOccupancy}
                            unit="%"
                            trend={1.5}
                            icon="fa-bed"
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6">
                        <KPICard
                            title="Readmission Rate"
                            value={currentMetrics.quality.readmissionRate}
                            target={currentMetrics.quality.target.readmissionRate}
                            unit="%"
                            trend={-0.8}
                            icon="fa-user-md"
                        />
                    </div>
                    <div className="col-lg-2 col-md-4 col-sm-6">
                        <KPICard
                            title="Cost per Patient"
                            value={currentMetrics.financial.costPerPatient}
                            target={currentMetrics.financial.target.costPerPatient}
                            unit=""
                            trend={-2.3}
                            icon="fa-calculator"
                        />
                    </div>
                </div>

                {/* Charts Section */}
                <div className="row g-4 mb-4">
                    <div className="col-lg-8">
                        <div className="card h-100">
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="card-title mb-0">Monthly Trends</h5>
                                    <select
                                        className="form-select form-select-sm"
                                        style={{ width: 'auto' }}
                                        value={selectedMetric}
                                        onChange={(e) => setSelectedMetric(e.target.value)}
                                    >
                                        <option value="revenue">Revenue</option>
                                        <option value="satisfaction">Patient Satisfaction</option>
                                        <option value="bedOccupancy">Bed Occupancy</option>
                                        <option value="operatingMargin">Operating Margin</option>
                                    </select>
                                </div>
                                <SimpleLineChart
                                    data={monthlyTrends}
                                    dataKey={selectedMetric}
                                    title=""
                                />
                            </div>
                        </div>
                    </div>
                    <div className="col-lg-4">
                        <div className="card h-100">
                            <div className="card-body">
                                <h5 className="card-title mb-4">Key Performance Gauges</h5>
                                <div className="row">
                                    <div className="col-6 mb-3">
                                        <GaugeChart
                                            value={currentMetrics.quality.patientSatisfaction}
                                            max={100}
                                            title="Satisfaction"
                                            color="success"
                                        />
                                    </div>
                                    <div className="col-6 mb-3">
                                        <GaugeChart
                                            value={currentMetrics.operational.bedOccupancy}
                                            max={100}
                                            title="Occupancy"
                                            color="info"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Department Comparison */}
                {departmentComparison && departmentComparison.length > 0 && (
                    <div className="row g-4 mb-4">
                        <div className="col-lg-6">
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Department Performance</h5>
                                    <SimpleBarChart
                                        data={departmentComparison}
                                        title=""
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="col-lg-6">
                            <div className="card h-100">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Department Metrics</h5>
                                    <div className="table-responsive">
                                        <table className="table table-sm">
                                            <thead>
                                                <tr>
                                                    <th>Department</th>
                                                    <th>Satisfaction</th>
                                                    <th>Efficiency</th>
                                                    <th>Cost</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {departmentComparison.map((dept, index) => (
                                                    <tr key={index}>
                                                        <td className="fw-bold">{dept.department}</td>
                                                        <td>
                                                            <span className={`badge ${dept.satisfaction >= 90 ? 'bg-success' : dept.satisfaction >= 85 ? 'bg-warning' : 'bg-danger'}`}>
                                                                {dept.satisfaction}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${dept.efficiency >= 90 ? 'bg-success' : dept.efficiency >= 85 ? 'bg-warning' : 'bg-danger'}`}>
                                                                {dept.efficiency}%
                                                            </span>
                                                        </td>
                                                        <td>${dept.cost.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Peer Comparison */}
                {peerComparison && peerComparison.length > 0 && (
                    <div className="row">
                        <div className="col-12">
                            <div className="card">
                                <div className="card-body">
                                    <h5 className="card-title mb-3">Peer Hospital Comparison</h5>
                                    <div className="table-responsive">
                                        <table className="table table-hover">
                                            <thead className="table-light">
                                                <tr>
                                                    <th>Hospital</th>
                                                    <th>Bed Occupancy</th>
                                                    <th>Patient Satisfaction</th>
                                                    <th>Operating Margin</th>
                                                    <th>Readmission Rate</th>
                                                    <th>Safety Rating</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {peerComparison.map((hospital, index) => (
                                                    <tr key={index} className={hospital.isCurrentHospital ? 'table-primary' : ''}>
                                                        <td>
                                                            <strong>{hospital.hospital}</strong>
                                                            {hospital.isCurrentHospital && (
                                                                <span className="badge bg-primary ms-2">Current</span>
                                                            )}
                                                        </td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="progress me-2" style={{ width: '60px', height: '8px' }}>
                                                                    <div
                                                                        className="progress-bar bg-info"
                                                                        style={{ width: `${hospital.bedOccupancy}%` }}
                                                                    ></div>
                                                                </div>
                                                                {hospital.bedOccupancy}%
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${hospital.satisfaction >= 87 ? 'bg-success' : hospital.satisfaction >= 83 ? 'bg-warning' : 'bg-danger'}`}>
                                                                {hospital.satisfaction}%
                                                            </span>
                                                        </td>
                                                        <td>{hospital.operatingMargin}%</td>
                                                        <td>
                                                            <span className={`badge ${hospital.readmissionRate <= 7.5 ? 'bg-success' : hospital.readmissionRate <= 8.5 ? 'bg-warning' : 'bg-danger'}`}>
                                                                {hospital.readmissionRate}%
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className={`badge ${hospital.safetyRating.includes('A') ? 'bg-success' : 'bg-warning'}`}>
                                                                {hospital.safetyRating}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HospitalPerformance;
