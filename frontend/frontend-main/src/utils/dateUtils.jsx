// src/utils/dateUtils.js

/**
 * Calculates the status of a certification based on its expiry date.
 * Assumes the current date is August 11, 2025 for consistent results.
 * @param {string} expiryDateString - The expiry date in 'YYYY-MM-DD' format.
 * @returns {{text: string, color: string, daysRemaining: number}} - An object with status info.
 */
export const getCertificationStatus = (expiryDateString) => {
  const today = new Date('2025-08-11T00:00:00Z'); // Fixed date for consistent demo
  const expiryDate = new Date(expiryDateString);

  if (isNaN(expiryDate.getTime())) {
    return { text: 'Invalid Date', color: 'default', daysRemaining: -99999 };
  }

  const timeDiff = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { text: 'Expired', color: 'error', daysRemaining };
  }
  if (daysRemaining <= 90) {
    return { text: 'Expiring Soon', color: 'warning', daysRemaining };
  }
  return { text: 'Valid', color: 'success', daysRemaining };
};