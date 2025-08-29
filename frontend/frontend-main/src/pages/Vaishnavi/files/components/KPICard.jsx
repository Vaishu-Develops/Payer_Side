// src/components/shared/KPICard.jsx
import React from 'react';
import { Card, Spinner } from 'react-bootstrap';
import './KPICard.css'; // We'll create this file for custom styles

const KPICard = ({ title, value, icon, loading }) => {
  return (
    <Card className="kpi-card text-center shadow-sm h-100">
      <Card.Body>
        <div className="d-flex align-items-center justify-content-center">
            <div className="kpi-icon me-3">{icon}</div>
            <div>
                <h5 className="card-title text-muted">{title}</h5>
                {loading ? (
                  <Spinner animation="border" size="sm" />
                ) : (
                  <h3 className="card-text fw-bold">{value}</h3>
                )}
            </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default KPICard;