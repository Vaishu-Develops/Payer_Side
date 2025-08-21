// Define risk thresholds in a central place for easy management.
const RISK_THRESHOLDS = {
  DOCTOR_RATIO: {
    HIGH: 0.15, // Ratio < 0.15 is high risk
    MEDIUM: 0.20, // Ratio between 0.15 and 0.20 is medium risk
  },
  NURSE_RATIO: {
    HIGH: 1.0, // Ratio < 1.0 is high risk
    MEDIUM: 1.2, // Ratio between 1.0 and 1.2 is medium risk
  },
  CERTIFICATION_EXPIRY_DAYS: 90, // Certifications expiring within 90 days are medium risk
};

/**
 * Determines the risk level and color coding based on a predefined level.
 * @param {'high' | 'medium' | 'low' | 'nodata'} level - The risk level string.
 * @returns {Object} An object with a display-friendly label and Ant Design color props.
 */
export const getRiskAppearance = (level) => {
  switch (level) {
    case 'high':
      return { label: 'High Risk', color: 'red' };
    case 'medium':
      return { label: 'Medium Risk', color: 'orange' };
    case 'low':
      return { label: 'Low Risk', color: 'green' };
    default:
      return { label: 'No Data', color: 'grey' };
  }
};

/**
 * Calculates certification risk for a specific hospital.
 * - High Risk: One or more certifications have expired.
 * - Medium Risk: Certifications are expiring within the next 90 days.
 * - Low Risk: All certifications are valid and not expiring soon.
 * @param {Array} certifications - The full list of certifications.
 * @param {number} hospitalId - The ID of the hospital to analyze.
 * @returns {Object} An object containing the risk level and a descriptive message.
 */
export const calculateCertificationRisk = (certifications, hospitalId) => {
  const hospitalCerts = certifications.filter(c => c.hospital_id === hospitalId);

  if (hospitalCerts.length === 0) {
    return { level: 'nodata', message: 'No certification data available for this hospital.' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to the start of the day for accurate comparison

  let expiredCount = 0;
  let expiringSoonCount = 0;

  hospitalCerts.forEach(cert => {
    const expiryDate = new Date(cert.expiry_date);
    if (expiryDate < today) {
      expiredCount++;
    } else {
      const timeDiff = expiryDate.getTime() - today.getTime();
      const daysUntilExpiry = Math.ceil(timeDiff / (1000 * 3600 * 24));
      if (daysUntilExpiry <= RISK_THRESHOLDS.CERTIFICATION_EXPIRY_DAYS) {
        expiringSoonCount++;
      }
    }
  });

  if (expiredCount > 0) {
    return { level: 'high', message: `${expiredCount} certification(s) have expired.` };
  }
  if (expiringSoonCount > 0) {
    return { level: 'medium', message: `${expiringSoonCount} certification(s) expiring within ${RISK_THRESHOLDS.CERTIFICATION_EXPIRY_DAYS} days.` };
  }
  return { level: 'low', message: 'All certifications are current and valid.' };
};

/**
 * Calculates staffing ratio risk (e.g., doctor-to-bed, nurse-to-bed).
 * @param {Object} metricData - The metrics object for a single hospital.
 * @param {'doctor_bed_ratio' | 'nurse_bed_ratio'} ratioKey - The key for the ratio to check.
 * @returns {Object} An object containing the risk level and a descriptive message.
 */
export const calculateRatioRisk = (metricData, ratioKey) => {
  if (!metricData || typeof metricData[ratioKey] !== 'number') {
    return { level: 'nodata', message: 'Ratio data not available.' };
  }

  const ratio = metricData[ratioKey];
  const thresholds = ratioKey === 'doctor_bed_ratio' ? RISK_THRESHOLDS.DOCTOR_RATIO : RISK_THRESHOLDS.NURSE_RATIO;
  const ratioName = ratioKey === 'doctor_bed_ratio' ? 'Doctor-to-Bed' : 'Nurse-to-Bed';

  if (ratio < thresholds.HIGH) {
    return { level: 'high', message: `${ratioName} ratio is critically low (${ratio.toFixed(2)}).` };
  }
  if (ratio < thresholds.MEDIUM) {
    return { level: 'medium', message: `${ratioName} ratio is below the recommended level (${ratio.toFixed(2)}).` };
  }
  return { level: 'low', message: `${ratioName} ratio is at a healthy level (${ratio.toFixed(2)}).` };
};
