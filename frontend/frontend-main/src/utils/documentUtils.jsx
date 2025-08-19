export const calculateCompletion = (hospital) => {
  if (!hospital.documents || typeof hospital.documents !== 'object') return 0;
  
  const documents = Object.values(hospital.documents);
  const total = documents.length;
  const verified = documents.filter(d => d.status === 'verified').length;
  return total > 0 ? Math.round((verified / total) * 100) : 0;
};

export const getStatusBadge = (completion) => {
  if (completion === 100) return { status: 'success', text: 'Complete' };
  if (completion > 70) return { status: 'processing', text: 'Nearly Complete' };
  return { status: 'error', text: 'Needs Attention' };
};