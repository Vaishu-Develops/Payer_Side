import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertTriangle, Award, CheckCircle, XCircle, Filter, FileText, Shield, Star, BadgeCheck } from 'lucide-react';
import certificationService from '../../../services/certificationService';
import dataService from '../../../services/dataService';
import { 
  calculateDaysToExpiry, 
  getCertificationStatus, 
  formatDate, 
  getCertificationTypeColor 
} from '../../../utils/certificationUtils';
import './styles/Q13_HospitalCertificationTimeline.css';

// Certification type icons mapping
const getCertificationIcon = (type) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('jci') || typeLower.includes('joint')) return <Shield size={20} />;
  if (typeLower.includes('iso')) return <Star size={20} />;
  if (typeLower.includes('nabh') || typeLower.includes('national')) return <BadgeCheck size={20} />;
  if (typeLower.includes('quality') || typeLower.includes('safety')) return <Award size={20} />;
  return <FileText size={20} />;
};

// Hospital Selector Component
const HospitalSelector = ({ hospitalId, hospitalOptions, onChange }) => (
  <div className="hospital-selector">
    <label htmlFor="hospital-select">Select Hospital:</label>
    <select 
      id="hospital-select"
      value={hospitalId} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="hospital-select"
    >
      {hospitalOptions.map(hospital => (
        <option key={hospital.id} value={hospital.id}>{hospital.name}</option>
      ))}
    </select>
  </div>
);

// Timeline Controls Component
const TimelineControls = ({ view, onChange, certifications }) => {
  const getFilterCounts = () => {
    const active = certifications.filter(c => c.status === 'active').length;
    const expiring = certifications.filter(c => ['warning', 'critical'].includes(c.status)).length;
    const expired = certifications.filter(c => c.status === 'expired').length;
    return { all: certifications.length, active, expiring, expired };
  };

  const counts = getFilterCounts();

  return (
    <div className="view-filters">
      <button className={`filter-btn ${view === 'all' ? 'active' : ''}`} onClick={() => onChange('all')}>
        <Filter size={16} /> All ({counts.all})
      </button>
      <button className={`filter-btn ${view === 'active' ? 'active' : ''}`} onClick={() => onChange('active')}>
        <CheckCircle size={16} /> Active ({counts.active})
      </button>
      <button className={`filter-btn ${view === 'expiring' ? 'active' : ''}`} onClick={() => onChange('expiring')}>
        <AlertTriangle size={16} /> Expiring ({counts.expiring})
      </button>
      <button className={`filter-btn ${view === 'expired' ? 'active' : ''}`} onClick={() => onChange('expired')}>
        <XCircle size={16} /> Expired ({counts.expired})
      </button>
    </div>
  );
};

// Summary Component
const CertificationSummary = ({ certifications }) => {
  const getSummaryStats = () => {
    const active = certifications.filter(c => c.status === 'active').length;
    const critical = certifications.filter(c => c.status === 'critical').length;
    const warning = certifications.filter(c => c.status === 'warning').length;
    const expired = certifications.filter(c => c.status === 'expired').length;
    return { total: certifications.length, active, critical, warning, expired };
  };

  const stats = getSummaryStats();
  const activeRate = stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0;

  return (
    <div className="certification-summary">
      <div className="summary-header">
        <h3>Certification Overview</h3>
      </div>
      <div className="summary-cards">
        <div className="summary-card total">
          <div className="card-content">
            <div className="card-number">{stats.total}</div>
            <div className="card-label">Total Certifications</div>
          </div>
          <Award className="card-icon" />
        </div>
        <div className="summary-card active">
          <div className="card-content">
            <div className="card-number">{stats.active}</div>
            <div className="card-label">Active</div>
          </div>
          <CheckCircle className="card-icon" />
        </div>
        <div className="summary-card expiring">
          <div className="card-content">
            <div className="card-number">{stats.critical + stats.warning}</div>
            <div className="card-label">Expiring Soon</div>
          </div>
          <Clock className="card-icon" />
        </div>
        <div className="summary-card expired">
          <div className="card-content">
            <div className="card-number">{stats.expired}</div>
            <div className="card-label">Expired</div>
          </div>
          <XCircle className="card-icon" />
        </div>
      </div>
      <div className="compliance-section">
        <div className="compliance-header">
          <span>Compliance Rate</span>
          <span className="compliance-percentage">{activeRate}%</span>
        </div>
        <div className="compliance-progress">
          <div 
            className="compliance-progress-bar" 
            style={{ width: `${activeRate}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

// Certification Details Modal
const CertificationDetails = ({ certification, onClose }) => (
  <div className="certification-details-overlay" onClick={onClose}>
    <div className="certification-details" onClick={e => e.stopPropagation()}>
      <div className="details-header">
        <div className="cert-type-header">
          {getCertificationIcon(certification.certification_type)}
          <h3>{certification.certification_type}</h3>
        </div>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      <div className="details-content">
        <div className="detail-row">
          <span className="detail-label">Certificate Number:</span>
          <span className="detail-value">{certification.certificate_number}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Level:</span>
          <span className="detail-value">{certification.certification_level}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Issued Date:</span>
          <span className="detail-value">{formatDate(certification.issued_date)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Expiry Date:</span>
          <span className="detail-value">{formatDate(certification.expiry_date)}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Issuing Authority:</span>
          <span className="detail-value">{certification.issuing_authority}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Status:</span>
          <span className={`status-badge ${certification.status}`}>
            {certification.status.toUpperCase()}
          </span>
        </div>
        {certification.remarks && (
          <div className="detail-row">
            <span className="detail-label">Remarks:</span>
            <span className="detail-value">{certification.remarks}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Interactive Timeline Component
const InteractiveTimeline = ({ data, view }) => {
  const [selectedCert, setSelectedCert] = useState(null);

  const getStatusIcon = (status) => {
    const icons = {
      'active': <CheckCircle className="status-icon active" />,
      'warning': <Clock className="status-icon warning" />,
      'critical': <AlertTriangle className="status-icon critical" />,
      'expired': <XCircle className="status-icon expired" />
    };
    return icons[status] || <Award className="status-icon" />;
  };

  return (
    <div className="interactive-timeline">
      <div className="timeline-header">
        <h3>Certification Timeline</h3>
      </div>
      <div className="timeline-container">
        <div className="timeline-line"></div>
        {data.map((cert) => (
          <div 
            key={cert.id} 
            className={`timeline-item ${cert.status} ${selectedCert?.id === cert.id ? 'selected' : ''}`}
            onClick={() => setSelectedCert(selectedCert?.id === cert.id ? null : cert)}
          >
            <div 
              className="timeline-marker"
              style={{ backgroundColor: getCertificationTypeColor(cert.certification_type) }}
            >
              {getCertificationIcon(cert.certification_type)}
            </div>
            <div className="timeline-content">
              <div className="cert-header">
                <div className="cert-title">
                  <h4 className="cert-type">{cert.certification_type}</h4>
                  <span className="cert-level">{cert.certification_level}</span>
                </div>
                {getStatusIcon(cert.status)}
              </div>
              <div className="cert-dates">
                <div className="date-item">
                  <Calendar size={14} />
                  <span>Issued: {formatDate(cert.issued_date)}</span>
                </div>
                <div className="date-item">
                  <Clock size={14} />
                  <span>Expires: {formatDate(cert.expiry_date)}</span>
                </div>
              </div>
              <div className="cert-authority">
                <span className="authority-label">Authority:</span> {cert.issuing_authority}
              </div>
              {cert.daysToExpiry >= 0 ? (
                <div className={`days-remaining ${cert.status}`}>
                  {cert.daysToExpiry} days remaining
                </div>
              ) : (
                <div className="days-remaining expired">
                  Expired {Math.abs(cert.daysToExpiry)} days ago
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      {selectedCert && (
        <CertificationDetails 
          certification={selectedCert} 
          onClose={() => setSelectedCert(null)}
        />
      )}
    </div>
  );
};

// Expiry Alerts Component
const ExpiryAlerts = ({ certifications }) => {
  const criticalAlerts = certifications.filter(cert => cert.status === 'critical');
  const warningAlerts = certifications.filter(cert => cert.status === 'warning');

  if (criticalAlerts.length === 0 && warningAlerts.length === 0) return null;

  return (
    <div className="expiry-alerts">
      <div className="alerts-header">
        <AlertTriangle className="alert-icon" />
        <h3>Renewal Alerts</h3>
      </div>
      {criticalAlerts.length > 0 && (
        <div className="alert-section critical">
          <h4>Critical - Expires within 30 days</h4>
          {criticalAlerts.map(cert => (
            <div key={cert.id} className="alert-item critical">
              <div className="alert-content">
                <strong>{cert.certification_type}</strong>
                <span>Expires in {cert.daysToExpiry} days</span>
                <span className="expire-date">({formatDate(cert.expiry_date)})</span>
              </div>
              <AlertTriangle className="alert-status-icon" />
            </div>
          ))}
        </div>
      )}
      {warningAlerts.length > 0 && (
        <div className="alert-section warning">
          <h4>Warning - Expires within 90 days</h4>
          {warningAlerts.map(cert => (
            <div key={cert.id} className="alert-item warning">
              <div className="alert-content">
                <strong>{cert.certification_type}</strong>
                <span>Expires in {cert.daysToExpiry} days</span>
                <span className="expire-date">({formatDate(cert.expiry_date)})</span>
              </div>
              <Clock className="alert-status-icon" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Main Timeline Component
const CertificationTimeline = ({ hospitalId = 121 }) => {
  const [certifications, setCertifications] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [timelineView, setTimelineView] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedHospitalId, setSelectedHospitalId] = useState(hospitalId);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Fetch both certifications and hospitals data
      const [certificationsData, hospitalsResponse] = await Promise.all([
        certificationService.getAllCertifications(),
        dataService.getHospitals()
      ]);
      
      // Set certifications data
      setCertifications(certificationsData);
      
      // Set hospitals data - handle the response structure correctly
      const hospitalsData = hospitalsResponse.success ? hospitalsResponse.data : [];
      setHospitals(hospitalsData);
      
      console.log('✅ Loaded certifications:', certificationsData.length);
      console.log('✅ Loaded hospitals:', hospitalsData.length);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTimelineData = (certs) => {
    return certs
      .filter(cert => cert.hospital_id === selectedHospitalId)
      .map(cert => ({
        ...cert,
        daysToExpiry: calculateDaysToExpiry(cert.expiry_date),
        status: getCertificationStatus(cert.expiry_date)
      }))
      .sort((a, b) => new Date(a.issued_date) - new Date(b.issued_date));
  };

  const filterCertifications = (certs) => {
    switch (timelineView) {
      case 'active': return certs.filter(cert => cert.status === 'active');
      case 'expiring': return certs.filter(cert => ['warning', 'critical'].includes(cert.status));
      case 'expired': return certs.filter(cert => cert.status === 'expired');
      default: return certs;
    }
  };

  const processedCerts = processTimelineData(certifications);
  const filteredCerts = filterCertifications(processedCerts);
  
  // Create hospital options with names from the hospitals data
  const availableHospitalIds = [...new Set(certifications.map(cert => cert.hospital_id))];
  const hospitalOptions = availableHospitalIds.map(hospitalId => {
    const hospital = hospitals.find(h => h.id === hospitalId);
    return {
      id: hospitalId,
      name: hospital ? hospital.name : `Hospital ${hospitalId}`
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  if (loading) {
    return (
      <div className="certification-timeline-loading">
        <div className="loading-spinner"></div>
        <p>Loading certification data...</p>
      </div>
    );
  }

  return (
    <div className="certification-timeline">
      <div className="page-header">
        <div className="header-content">
          <Award className="header-icon" />
          <h1>Hospital Quality Certification Timeline</h1>
          <p>Track and manage all hospital certifications in one place</p>
        </div>
      </div>

      <div className="controls-section">
        <HospitalSelector 
          hospitalId={selectedHospitalId}
          hospitalOptions={hospitalOptions}
          onChange={setSelectedHospitalId}
        />
        <TimelineControls 
          view={timelineView} 
          onChange={setTimelineView}
          certifications={processedCerts}
        />
      </div>

      <CertificationSummary certifications={processedCerts} />
      <InteractiveTimeline data={filteredCerts} view={timelineView} />
      <ExpiryAlerts certifications={processedCerts} />
    </div>
  );
};

export default CertificationTimeline;