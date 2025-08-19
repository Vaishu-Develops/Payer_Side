// src/pages/Vaishnavi/files/shared/CoverageIndicator.jsx
import React from 'react';

const CoverageIndicator = ({ count, total }) => {
  const filledCount = Math.round((count / total) * 10); // Scale to 10 dots
  const emptyCount = 10 - filledCount;

  return (
    <span style={{ fontFamily: 'monospace', letterSpacing: '2px' }}>
      <span style={{ color: '#00529B' }}>{'●'.repeat(filledCount)}</span>
      <span style={{ color: '#d9d9d9' }}>{'●'.repeat(emptyCount)}</span>
    </span>
  );
};

export default CoverageIndicator;