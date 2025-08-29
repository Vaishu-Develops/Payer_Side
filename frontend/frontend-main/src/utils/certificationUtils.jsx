// Date calculations
export const calculateDaysToExpiry = (expiryDate) => {
  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const getCertificationStatus = (expiryDate) => {
  const daysToExpiry = calculateDaysToExpiry(expiryDate);
  
  if (daysToExpiry < 0) return 'expired';
  if (daysToExpiry <= 30) return 'critical';
  if (daysToExpiry <= 90) return 'warning';
  return 'active';
};

// Date formatting
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatRelativeDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return `${Math.abs(diffDays)} days ago`;
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `In ${diffDays} days`;
  }
};

// Certification helpers
export const getCertificationTypeColor = (type) => {
  const colors = {
    'ISO 9001': '#3b82f6',
    'NABH': '#10b981',
    'JCI': '#f59e0b',
    'Green OT': '#22c55e'
  };
  return colors[type] || '#6b7280';
};

export const getCertificationIcon = (type) => {
  const icons = {
    'ISO 9001': '🏆',
    'NABH': '⚕️',
    'JCI': '🌟',
    'Green OT': '🌱'
  };
  return icons[type] || '📋';
};

export const sortCertifications = (certs, sortBy = 'issued_date') => {
  return [...certs].sort((a, b) => {
    switch (sortBy) {
      case 'type':
        return a.certification_type.localeCompare(b.certification_type);
      case 'expiry':
        return new Date(a.expiry_date) - new Date(b.expiry_date);
      case 'status':
        const statusOrder = { 'expired': 0, 'critical': 1, 'warning': 2, 'active': 3 };
        return statusOrder[a.status] - statusOrder[b.status];
      default:
        return new Date(a.issued_date) - new Date(b.issued_date);
    }
  });
};

// Constants
export const CERTIFICATION_TYPES = {
  ISO_9001: 'ISO 9001',
  NABH: 'NABH',
  JCI: 'JCI',
  GREEN_OT: 'Green OT'
};

export const STATUS_TYPES = {
  ACTIVE: 'active',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EXPIRED: 'expired'
};

export const ALERT_THRESHOLDS = {
  CRITICAL_DAYS: 30,
  WARNING_DAYS: 90
};
