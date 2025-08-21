/**
 * Filters the list of emergency contacts based on a search term and availability status.
 *
 * @param {Array} contacts - The list of merged emergency contact objects.
 * @param {string} searchTerm - The text to search for in the hospital name.
 * @param {'all' | 'available' | 'unavailable'} statusFilter - The availability status to filter by.
 * @returns {Array} The filtered list of contacts.
 */
export const filterContacts = (contacts, searchTerm, statusFilter) => {
  // Return original list if it's not a valid array to prevent errors.
  if (!Array.isArray(contacts)) {
    return [];
  }

  const lowercasedSearchTerm = searchTerm.toLowerCase();

  return contacts.filter(contact => {
    // Check 1: Match search term (case-insensitive).
    const nameMatch = contact.hospital_name.toLowerCase().includes(lowercasedSearchTerm);

    // Check 2: Match status filter.
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'available' && contact.is_active) ||
      (statusFilter === 'unavailable' && !contact.is_active);

    return nameMatch && statusMatch;
  });
};

/**
 * Calculates summary statistics from the list of emergency contacts.
 *
 * @param {Array} contacts - The list of all available emergency contacts.
 * @returns {object} An object containing total count, available count, and coverage percentage.
 */
export const calculateSummaryStats = (contacts) => {
    if (!Array.isArray(contacts) || contacts.length === 0) {
        return { total: 0, available: 0, coverage: 0 };
    }

    const total = contacts.length;
    const available = contacts.filter(c => c.is_active).length;
    // Safe division to prevent NaN if total is 0.
    const coverage = total > 0 ? Math.round((available / total) * 100) : 0;

    return { total, available, coverage };
};
