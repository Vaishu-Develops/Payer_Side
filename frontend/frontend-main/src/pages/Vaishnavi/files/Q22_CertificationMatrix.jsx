import React, { useState, useEffect, useMemo } from 'react';
import './Q22_CertificationMatrix.css';
import api from '../../../services/api';

// Import API service to fetch data
const fetchCertificationData = async () => {
    try {
        const response = await api.get('/hospitals/certifications');
        return response.data;
    } catch (error) {
        console.error('Error fetching certification data:', error);
        return null;
    }
};

// Fallback certification data (will only be used if API fails)
const fallbackCertificationsData = {
    "hospitals": [
        {
            "hospital_id": "CERT001",
            "name": "Regional Medical Center",
            "location": "New York, NY",
            "type": "Academic Medical Center",
            "certifications": [
                {
                    "category": "Accreditation",
                    "name": "Joint Commission",
                    "status": "Active",
                    "level": "Full Accreditation",
                    "issued_date": "2023-03-15",
                    "expiry_date": "2026-03-15",
                    "badge_url": "/badges/jcaho.png",
                    "conditions": [],
                    "score": 95
                },
                {
                    "category": "Quality",
                    "name": "Magnet Status",
                    "status": "Active",
                    "issued_date": "2022-08-20",
                    "expiry_date": "2026-08-20",
                    "badge_url": "/badges/magnet.png",
                    "score": 92
                },
                {
                    "category": "Specialty",
                    "name": "Trauma Center Level I",
                    "status": "Active",
                    "issued_date": "2023-01-10",
                    "expiry_date": "2026-01-10",
                    "badge_url": "/badges/trauma1.png",
                    "score": 98
                },
                {
                    "category": "Quality",
                    "name": "Leapfrog A Grade",
                    "status": "Active",
                    "issued_date": "2023-10-01",
                    "expiry_date": "2024-10-01",
                    "badge_url": "/badges/leapfrog.png",
                    "score": 89
                }
            ],
            "ratings": {
                "cms_stars": 4,
                "leapfrog_grade": "A",
                "safety_score": 87
            }
        },
        {
            "hospital_id": "CERT002",
            "name": "Metropolitan General Hospital",
            "location": "Los Angeles, CA",
            "type": "Community Hospital",
            "certifications": [
                {
                    "category": "Accreditation",
                    "name": "Joint Commission",
                    "status": "Active",
                    "level": "Full Accreditation",
                    "issued_date": "2022-11-20",
                    "expiry_date": "2025-11-20",
                    "badge_url": "/badges/jcaho.png",
                    "conditions": ["Infection Control"],
                    "score": 88
                },
                {
                    "category": "Accreditation",
                    "name": "DNV GL Healthcare",
                    "status": "Expired",
                    "level": "ISO 9001",
                    "issued_date": "2021-05-15",
                    "expiry_date": "2024-05-15",
                    "badge_url": "/badges/dnv.png",
                    "score": 82
                },
                {
                    "category": "Specialty",
                    "name": "Stroke Center",
                    "status": "Active",
                    "issued_date": "2023-06-01",
                    "expiry_date": "2026-06-01",
                    "badge_url": "/badges/stroke.png",
                    "score": 91
                },
                {
                    "category": "Quality",
                    "name": "CMS 5-Star Rating",
                    "status": "Active",
                    "issued_date": "2023-07-01",
                    "expiry_date": "2024-07-01",
                    "badge_url": "/badges/cms5star.png",
                    "score": 94
                }
            ],
            "ratings": {
                "cms_stars": 5,
                "leapfrog_grade": "B",
                "safety_score": 82
            }
        },
        {
            "hospital_id": "CERT003",
            "name": "University Medical Center",
            "location": "Chicago, IL",
            "type": "Teaching Hospital",
            "certifications": [
                {
                    "category": "Accreditation",
                    "name": "Joint Commission",
                    "status": "Under Review",
                    "level": "Full Accreditation",
                    "issued_date": "2021-12-01",
                    "expiry_date": "2024-12-01",
                    "badge_url": "/badges/jcaho.png",
                    "conditions": [],
                    "score": 91
                },
                {
                    "category": "Quality",
                    "name": "Magnet Status",
                    "status": "Active",
                    "issued_date": "2021-03-15",
                    "expiry_date": "2025-03-15",
                    "badge_url": "/badges/magnet.png",
                    "score": 96
                },
                {
                    "category": "Specialty",
                    "name": "Trauma Center Level II",
                    "status": "Active",
                    "issued_date": "2022-09-10",
                    "expiry_date": "2025-09-10",
                    "badge_url": "/badges/trauma2.png",
                    "score": 85
                },
                {
                    "category": "Specialty",
                    "name": "Cancer Center Accreditation",
                    "status": "Expiring Soon",
                    "issued_date": "2021-11-01",
                    "expiry_date": "2024-11-01",
                    "badge_url": "/badges/cancer.png",
                    "score": 93
                },
                {
                    "category": "Quality",
                    "name": "Beacon Award",
                    "status": "Active",
                    "issued_date": "2023-02-20",
                    "expiry_date": "2026-02-20",
                    "badge_url": "/badges/beacon.png",
                    "score": 90
                }
            ],
            "ratings": {
                "cms_stars": 3,
                "leapfrog_grade": "A",
                "safety_score": 91
            }
        },
        {
            "hospital_id": "CERT004",
            "name": "Riverside Community Hospital",
            "location": "Houston, TX",
            "type": "Community Hospital",
            "certifications": [
                {
                    "category": "Accreditation",
                    "name": "HFAP",
                    "status": "Active",
                    "level": "Full Accreditation",
                    "issued_date": "2023-04-01",
                    "expiry_date": "2026-04-01",
                    "badge_url": "/badges/hfap.png",
                    "conditions": [],
                    "score": 87
                },
                {
                    "category": "Specialty",
                    "name": "Cardiac Care Certification",
                    "status": "Active",
                    "issued_date": "2022-12-15",
                    "expiry_date": "2025-12-15",
                    "badge_url": "/badges/cardiac.png",
                    "score": 89
                },
                {
                    "category": "Quality",
                    "name": "Leapfrog B Grade",
                    "status": "Active",
                    "issued_date": "2023-10-01",
                    "expiry_date": "2024-10-01",
                    "badge_url": "/badges/leapfrog.png",
                    "score": 78
                }
            ],
            "ratings": {
                "cms_stars": 3,
                "leapfrog_grade": "B",
                "safety_score": 79
            }
        },
        {
            "hospital_id": "CERT005",
            "name": "St. Mary's Medical Center",
            "location": "Miami, FL",
            "type": "Faith-Based Hospital",
            "certifications": [
                {
                    "category": "Accreditation",
                    "name": "Joint Commission",
                    "status": "Conditional",
                    "level": "Accredited with Conditions",
                    "issued_date": "2023-01-15",
                    "expiry_date": "2025-01-15",
                    "badge_url": "/badges/jcaho.png",
                    "conditions": ["Patient Safety", "Quality Management"],
                    "score": 76
                },
                {
                    "category": "Accreditation",
                    "name": "AAAHC",
                    "status": "Active",
                    "level": "Ambulatory Care",
                    "issued_date": "2022-07-01",
                    "expiry_date": "2025-07-01",
                    "badge_url": "/badges/aaahc.png",
                    "conditions": [],
                    "score": 84
                },
                {
                    "category": "Specialty",
                    "name": "Stroke Center",
                    "status": "Denied",
                    "issued_date": null,
                    "expiry_date": null,
                    "badge_url": "/badges/stroke.png",
                    "score": 65
                }
            ],
            "ratings": {
                "cms_stars": 2,
                "leapfrog_grade": "C",
                "safety_score": 71
            }
        }
    ]
};

const CertificationMatrix = () => {
    const [hospitalsData, setHospitalsData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedHospitals, setSelectedHospitals] = useState([]);
    const [filters, setFilters] = useState({
        category: 'all',
        status: 'all',
        search: ''
    });
    const [showComparison, setShowComparison] = useState(false);

    // Load hospital certification data
    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchCertificationData();
                if (data && data.hospitals) {
                    setHospitalsData(data.hospitals);
                } else {
                    console.log('Falling back to local data');
                    setHospitalsData(fallbackCertificationsData.hospitals);
                }
            } catch (error) {
                console.error('Error loading certification data:', error);
                setHospitalsData(fallbackCertificationsData.hospitals);
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, []);

    // Define the exact certifications that should appear (from the JSON data)
    const allCertifications = useMemo(() => {
        // Only include certifications that actually exist in the JSON data
        const validCertifications = [
            "AAAHC",
            "Beacon Award",
            "CMS 5-Star Rating",
            "Cancer Center Accreditation",
            "Cardiac Care Certification",
            "DNV GL Healthcare",
            "HFAP",
            "Joint Commission",
            "Leapfrog A Grade",
            "Leapfrog B Grade",
            "Magnet Status",
            "Stroke Center",
            "Trauma Center Level I",
            "Trauma Center Level II"
        ];
        return validCertifications;
    }, []);

    // Filter hospitals based on search and filters
    const filteredHospitals = useMemo(() => {
        return hospitalsData.filter(hospital => {
            const matchesSearch = hospital.name.toLowerCase().includes(filters.search.toLowerCase());

            if (filters.category !== 'all') {
                const hasCategory = hospital.certifications?.some(cert =>
                    cert.category.toLowerCase() === filters.category.toLowerCase()
                );
                if (!hasCategory) return false;
            }

            if (filters.status !== 'all') {
                const hasStatus = hospital.certifications?.some(cert =>
                    cert.status.toLowerCase() === filters.status.toLowerCase()
                );
                if (!hasStatus) return false;
            }

            return matchesSearch;
        });
    }, [hospitalsData, filters]);

    // Get certification status for a hospital
    const getCertificationStatus = (hospital, certificationName) => {
        const cert = hospital.certifications?.find(c => c.name === certificationName);
        return cert || null;
    };

    // Status badge component
    const StatusBadge = ({ status, certification }) => {
        const getStatusInfo = (status) => {
            switch (status?.toLowerCase()) {
                case 'active':
                    return { class: 'status-active', icon: '✅', text: 'Active' };
                case 'expired':
                    return { class: 'status-expired', icon: '❌', text: 'Expired' };
                case 'expiring soon':
                    return { class: 'status-expiring', icon: '⏰', text: 'Expiring Soon' };
                case 'under review':
                    return { class: 'status-review', icon: '🔄', text: 'Under Review' };
                case 'conditional':
                    return { class: 'status-conditional', icon: '⚠️', text: 'Conditional' };
                case 'denied':
                    return { class: 'status-denied', icon: '🚫', text: 'Denied' };
                default:
                    return { class: 'status-none', icon: '—', text: 'Not Certified' };
            }
        };

        const statusInfo = getStatusInfo(status);

        return (
            <div className={`status-badge ${statusInfo.class}`} title={certification ? `Score: ${certification.score || 'N/A'}` : 'Not certified'}>
                <span className="status-icon">{statusInfo.icon}</span>
                <span className="status-text">{statusInfo.text}</span>
                {certification?.score && <span className="status-score">({certification.score})</span>}
            </div>
        );
    };

    // Hospital comparison component
    const HospitalComparison = () => {
        if (selectedHospitals.length === 0) return null;

        const selectedData = hospitalsData.filter(h => selectedHospitals.includes(h.hospital_id));

        return (
            <div className="comparison-panel">
                <div className="comparison-header">
                    <h3>Hospital Comparison ({selectedData.length} hospitals)</h3>
                    <button onClick={() => setShowComparison(!showComparison)} className="toggle-btn">
                        {showComparison ? 'Hide' : 'Show'} Comparison
                    </button>
                </div>

                {showComparison && (
                    <div className="comparison-content">
                        <div className="comparison-grid">
                            <div className="comparison-row header">
                                <div className="comparison-cell">Certification</div>
                                {selectedData.map(hospital => (
                                    <div key={hospital.hospital_id} className="comparison-cell hospital-header">
                                        {hospital.name}
                                    </div>
                                ))}
                            </div>

                            {allCertifications.map(certName => (
                                <div key={certName} className="comparison-row">
                                    <div className="comparison-cell cert-name">{certName}</div>
                                    {selectedData.map(hospital => {
                                        const cert = getCertificationStatus(hospital, certName);
                                        return (
                                            <div key={hospital.hospital_id} className="comparison-cell">
                                                <StatusBadge status={cert?.status} certification={cert} />
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Analytics summary
    const getAnalytics = () => {
        const totalCertifications = allCertifications.length;
        const totalHospitals = hospitalsData.length;

        const statusCounts = {
            active: 0,
            expired: 0,
            expiring: 0,
            conditional: 0,
            denied: 0
        };

        hospitalsData.forEach(hospital => {
            hospital.certifications?.forEach(cert => {
                const status = cert.status.toLowerCase();
                if (status === 'active') statusCounts.active++;
                else if (status === 'expired') statusCounts.expired++;
                else if (status === 'expiring soon') statusCounts.expiring++;
                else if (status === 'conditional') statusCounts.conditional++;
                else if (status === 'denied') statusCounts.denied++;
            });
        });

        return { totalCertifications, totalHospitals, statusCounts };
    };

    const analytics = getAnalytics();

    if (loading) {
        return <div className="loading">Loading certification data...</div>;
    }

    return (
        <div className="certification-matrix">
            <div className="container-fluid">
                <div className="matrix-header text-center mb-4">
                    <h1 className="display-4 text-primary mb-3">Hospital Certification Comparison Matrix</h1>
                    <p className="lead text-muted">Compare certification status across healthcare organizations</p>
                </div>

                {/* Analytics Dashboard */}
                <div className="analytics-dashboard row g-3 mb-4">
                    <div className="col-md-6">
                        <div className="analytics-card card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Overview</h5>
                                <div className="analytics-stats d-flex justify-content-around">
                                    <div className="stat text-center">
                                        <span className="stat-number display-4 text-primary">{analytics.totalHospitals}</span>
                                        <div className="stat-label text-muted">Hospitals</div>
                                    </div>
                                    <div className="stat text-center">
                                        <span className="stat-number display-4 text-info">{analytics.totalCertifications}</span>
                                        <div className="stat-label text-muted">Certification Types</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="analytics-card card h-100">
                            <div className="card-body">
                                <h5 className="card-title">Certification Status</h5>
                                <div className="status-stats">
                                    <div className="status-stat active badge bg-success me-2 mb-2">✅ Active: {analytics.statusCounts.active}</div>
                                    <div className="status-stat expiring badge bg-warning me-2 mb-2">⏰ Expiring: {analytics.statusCounts.expiring}</div>
                                    <div className="status-stat expired badge bg-danger me-2 mb-2">❌ Expired: {analytics.statusCounts.expired}</div>
                                    <div className="status-stat conditional badge bg-secondary me-2 mb-2">⚠️ Conditional: {analytics.statusCounts.conditional}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-panel card mb-4">
                    <div className="card-body">
                        <div className="row g-3">
                            <div className="col-md-4">
                                <label className="form-label fw-bold">Search Hospitals:</label>
                                <input
                                    type="text"
                                    placeholder="Search by hospital name..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                                    className="form-control"
                                />
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Category:</label>
                                <select
                                    value={filters.category}
                                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="all">All Categories</option>
                                    <option value="accreditation">Accreditation</option>
                                    <option value="quality">Quality</option>
                                    <option value="specialty">Specialty</option>
                                </select>
                            </div>

                            <div className="col-md-4">
                                <label className="form-label fw-bold">Status:</label>
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                                    className="form-select"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="active">Active</option>
                                    <option value="expired">Expired</option>
                                    <option value="expiring soon">Expiring Soon</option>
                                    <option value="conditional">Conditional</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Hospital Comparison */}
                <HospitalComparison />

                {/* Certification Matrix */}
                <div className="matrix-container card">
                    <div className="card-body p-0">
                        <div className="table-responsive">
                            <table className="table table-bordered table-hover mb-0">
                                <thead className="table-dark sticky-top">
                                    <tr>
                                        <th className="hospital-header-cell">
                                            <div className="d-flex align-items-center">
                                                <input
                                                    type="checkbox"
                                                    className="form-check-input me-2"
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedHospitals(filteredHospitals.map(h => h.hospital_id));
                                                        } else {
                                                            setSelectedHospitals([]);
                                                        }
                                                    }}
                                                    checked={selectedHospitals.length === filteredHospitals.length && filteredHospitals.length > 0}
                                                />
                                                Hospital
                                            </div>
                                        </th>
                                        {allCertifications.map(certName => (
                                            <th key={certName} className="cert-header-cell text-center">
                                                <div className="cert-header-text">{certName}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>

                                    {filteredHospitals.map(hospital => (
                                        <tr key={hospital.hospital_id}>
                                            <td className="hospital-info-cell">
                                                <div className="d-flex align-items-start">
                                                    <input
                                                        type="checkbox"
                                                        className="form-check-input me-3 mt-1"
                                                        checked={selectedHospitals.includes(hospital.hospital_id)}
                                                        onChange={(e) => {
                                                            if (e.target.checked) {
                                                                setSelectedHospitals([...selectedHospitals, hospital.hospital_id]);
                                                            } else {
                                                                setSelectedHospitals(selectedHospitals.filter(id => id !== hospital.hospital_id));
                                                            }
                                                        }}
                                                    />
                                                    <div className="hospital-details">
                                                        <div className="hospital-name fw-bold text-primary">{hospital.name}</div>
                                                        <div className="hospital-location text-muted small">{hospital.location}</div>
                                                        <div className="hospital-type text-secondary small">{hospital.type}</div>
                                                        <div className="hospital-ratings small">
                                                            <span className="badge bg-info me-1">CMS: {hospital.ratings?.cms_stars}★</span>
                                                            <span className="badge bg-success me-1">Leapfrog: {hospital.ratings?.leapfrog_grade}</span>
                                                            <span className="badge bg-warning">Safety: {hospital.ratings?.safety_score}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {allCertifications.map(certName => {
                                                const certification = getCertificationStatus(hospital, certName);
                                                return (
                                                    <td key={certName} className="cert-status-cell text-center">
                                                        <StatusBadge status={certification?.status} certification={certification} />
                                                        {certification?.conditions && certification.conditions.length > 0 && (
                                                            <div className="conditions mt-1" title={`Conditions: ${certification.conditions.join(', ')}`}>
                                                                <span className="badge bg-warning">⚠️ {certification.conditions.length}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {filteredHospitals.length === 0 && (
                    <div className="alert alert-info text-center mt-4">
                        <h5>No Results Found</h5>
                        <p className="mb-0">No hospitals match the current filters. Please adjust your search criteria.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CertificationMatrix;