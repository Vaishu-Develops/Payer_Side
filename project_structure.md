# 🏗️ Hospital Dashboard Project Structure

## 📁 **Complete Project Directory Structure**

```
HOSPITAL_MOCK_API/
├── 📁 backend/
│   ├── 📁 data/                          # JSON data files
│   │   ├── 📄 api_info.json
│   │   ├── 📄 compliance_licenses.json
│   │   ├── 📄 diagnostic_services.json
│   │   ├── 📄 doctors.json
│   │   ├── 📄 document_uploads.json
│   │   ├── 📄 hospital_addresses.json
│   │   ├── 📄 hospital_certifications.json
│   │   ├── 📄 hospital_contacts.json
│   │   ├── 📄 hospital_equipment.json
│   │   ├── 📄 hospital_infrastructure.json
│   │   ├── 📄 hospital_it_systems.json
│   │   ├── 📄 hospital_metrics.json
│   │   ├── 📄 hospitals.json
│   │   ├── 📄 icu_facilities.json
│   │   ├── 📄 medical_specialties.json
│   │   ├── 📄 operation_theaters.json
│   │   ├── 📄 support_services.json
│   │   ├── 📄 users.json
│   │   └── 📄 wards_rooms.json
│   ├── 📄 main.py                        # FastAPI backend server
│   ├── 📄 config.py
│   ├── 📄 seed_database.py
│   ├── 📄 requirements.txt
│   └── 📄 README.md
│
├── 📁 frontend/                          # React Dashboard Application
│   ├── 📁 public/
│   │   ├── 📄 index.html
│   │   └── 📄 favicon.ico
│   ├── 📁 src/
│   │   ├── 📁 components/                # Reusable UI Components
│   │   │   ├── 📁 charts/                # Chart Components
│   │   │   │   ├── 📄 BarChart.jsx
│   │   │   │   ├── 📄 PieChart.jsx
│   │   │   │   ├── 📄 LineChart.jsx
│   │   │   │   └── 📄 index.js
│   │   │   ├── 📁 tables/                # Table Components
│   │   │   │   ├── 📄 HospitalTable.jsx
│   │   │   │   ├── 📄 DataTable.jsx
│   │   │   │   └── 📄 index.js
│   │   │   ├── 📁 cards/                 # Card Components
│   │   │   │   ├── 📄 HospitalCard.jsx
│   │   │   │   ├── 📄 MetricCard.jsx
│   │   │   │   ├── 📄 RiskCard.jsx
│   │   │   │   └── 📄 index.js
│   │   │   ├── 📁 maps/                  # Map Components
│   │   │   │   ├── 📄 HospitalMap.jsx
│   │   │   │   ├── 📄 GeographicMap.jsx
│   │   │   │   └── 📄 index.js
│   │   │   ├── 📁 filters/               # Filter Components
│   │   │   │   ├── 📄 CityFilter.jsx
│   │   │   │   ├── 📄 TypeFilter.jsx
│   │   │   │   └── 📄 index.js
│   │   │   └── 📁 common/                # Common UI Components
│   │   │       ├── 📄 Loading.jsx
│   │   │       ├── 📄 Error.jsx
│   │   │       ├── 📄 Header.jsx
│   │   │       ├── 📄 Sidebar.jsx
│   │   │       └── 📄 index.js
│   │   ├── 📁 pages/                     # Main Dashboard Pages
│   │   │   ├── 📁 intern1/               # INTERN 1 PAGES
│   │   │   │   ├── 📁 file1/             # Questions from File 1
│   │   │   │   │   ├── 📄 Q01_HospitalList.jsx
│   │   │   │   │   ├── 📄 Q03_ContactDirectory.jsx
│   │   │   │   │   ├── 📄 Q05_BedCapacity.jsx
│   │   │   │   │   ├── 📄 Q07_MedicalSpecialties.jsx
│   │   │   │   │   ├── 📄 Q09_HospitalProfile.jsx
│   │   │   │   │   ├── 📄 Q11_DoctorDirectory.jsx
│   │   │   │   │   ├── 📄 Q13_CertificationStatus.jsx
│   │   │   │   │   ├── 📄 Q15_LocationAccessibility.jsx
│   │   │   │   │   ├── 📄 Q17_DoctorBedRatio.jsx
│   │   │   │   │   ├── 📄 Q19_EquipmentDistribution.jsx
│   │   │   │   │   ├── 📄 Q21_SpecialtyCoverage.jsx
│   │   │   │   │   ├── 📄 Q23_HospitalSizeClass.jsx
│   │   │   │   │   └── 📄 Q25_QualityScore.jsx
│   │   │   │   └── 📁 file2/             # Questions from File 2
│   │   │   │       ├── 📄 Q02_ISOCertification.jsx
│   │   │   │       ├── 📄 Q04_CriticalCareEquipment.jsx
│   │   │   │       ├── 📄 Q06_CityWiseCoverage.jsx
│   │   │   │       ├── 📄 Q08_ComplianceDocuments.jsx
│   │   │   │       ├── 📄 Q10_HospitalCapability.jsx
│   │   │   │       ├── 📄 Q12_EquipmentMaintenance.jsx
│   │   │   │       ├── 📄 Q14_NetworkPositioning.jsx
│   │   │   │       ├── 📄 Q16_RiskProfile.jsx
│   │   │   │       ├── 📄 Q18_SurgicalCapacity.jsx
│   │   │   │       ├── 📄 Q20_GeographicCoverage.jsx
│   │   │   │       ├── 📄 Q22_ICUCapacity.jsx
│   │   │   │       └── 📄 Q24_EquipmentAvailability.jsx
│   │   │   └── 📁 intern2/               # INTERN 2 PAGES
│   │   │       ├── 📁 file1/             # Questions from File 1
│   │   │       │   ├── 📄 Q02_NABHCertified.jsx
│   │   │       │   ├── 📄 Q04_EquipmentByCategory.jsx
│   │   │       │   ├── 📄 Q06_StateWiseCount.jsx
│   │   │       │   ├── 📄 Q08_DocumentVerification.jsx
│   │   │       │   ├── 📄 Q10_EquipmentInventory.jsx
│   │   │       │   ├── 📄 Q12_WardInformation.jsx
│   │   │       │   ├── 📄 Q14_PerformanceMetrics.jsx
│   │   │       │   ├── 📄 Q16_RiskAssessment.jsx
│   │   │       │   ├── 📄 Q18_BedCapacityAnalysis.jsx
│   │   │       │   ├── 📄 Q20_GeographicDistribution.jsx
│   │   │       │   ├── 📄 Q22_CertificationComparison.jsx
│   │   │       │   ├── 📄 Q24_ContactAvailability.jsx
│   │   │       │   └── 📄 Q26_StaffingAdequacy.jsx
│   │   │       └── 📁 file2/             # Questions from File 2
│   │   │           ├── 📄 Q01_HospitalTypeDistribution.jsx
│   │   │           ├── 📄 Q03_EmergencyContact.jsx
│   │   │           ├── 📄 Q05_InfrastructureScoring.jsx
│   │   │           ├── 📄 Q07_DoctorSpecialtyDistribution.jsx
│   │   │           ├── 📄 Q09_HospitalFinancialProfile.jsx
│   │   │           ├── 📄 Q11_StaffingAnalysis.jsx
│   │   │           ├── 📄 Q13_QualityCertificationTimeline.jsx
│   │   │           ├── 📄 Q15_AccessibilityAnalysis.jsx
│   │   │           ├── 📄 Q17_NurseBedRatioBenchmark.jsx
│   │   │           ├── 📄 Q19_EquipmentModernization.jsx
│   │   │           ├── 📄 Q21_SpecialtyServiceMatrix.jsx
│   │   │           ├── 📄 Q23_CertificationCoverage.jsx
│   │   │           └── 📄 Q25_HospitalTierClassification.jsx
│   │   ├── 📁 services/                  # API Service Functions
│   │   │   ├── 📄 hospitalService.js     # Hospital API calls
│   │   │   ├── 📄 analyticsService.js    # Analytics API calls
│   │   │   ├── 📄 equipmentService.js    # Equipment API calls
│   │   │   └── 📄 index.js
│   │   ├── 📁 utils/                     # Utility Functions
│   │   │   ├── 📄 healthcare-constants.js # ⭐ Industry benchmarks & calculations
│   │   │   ├── 📄 api.js                 # API configuration
│   │   │   ├── 📄 formatters.js          # Data formatting functions
│   │   │   ├── 📄 validators.js          # Data validation functions
│   │   │   └── 📄 helpers.js             # Helper functions
│   │   ├── 📁 hooks/                     # Custom React Hooks
│   │   │   ├── 📄 useHospitalData.js
│   │   │   ├── 📄 useAnalytics.js
│   │   │   └── 📄 useLocalStorage.js
│   │   ├── 📁 styles/                    # CSS and Styling
│   │   │   ├── 📄 global.css
│   │   │   ├── 📄 components.css
│   │   │   └── 📄 dashboard.css
│   │   ├── 📄 App.jsx                    # Main App Component
│   │   ├── 📄 App.css
│   │   ├── 📄 index.js                   # React Entry Point
│   │   └── 📄 index.css
│   ├── 📄 package.json                   # Dependencies
│   ├── 📄 package-lock.json
│   └── 📄 README.md                      # Frontend setup instructions
│
├── 📁 docs/                              # Project Documentation
│   ├── 📄 Payer_Dashboard-Questions1.docx
│   ├── 📄 Payer_Dashboard-Questions2.docx
│   ├── 📄 API_Documentation.md
│   ├── 📄 Question_Assignment.md
│   └── 📄 Development_Guide.md
│
└── 📄 README.md                          # Main project documentation
```

## 🚀 **Setup Instructions for Interns**

### **1. Backend Setup (Already Done - Just Run)**
```bash
# Navigate to backend directory
cd backend

# Install dependencies (if needed)
pip install -r requirements.txt

# Run the API server
python main.py

# API available at: http://localhost:8000
# Documentation at: http://localhost:8000/docs
```

### **2. Frontend Setup (Interns Create This)**
```bash
# Navigate to frontend directory
cd frontend

# Create React app (if not exists)
npx create-react-app . --template typescript  # Optional TypeScript
# OR
npm create vite@latest . -- --template react  # Faster alternative

# Install required dependencies
npm install axios recharts antd @ant-design/icons
# OR for Material-UI
npm install @mui/material @emotion/react @emotion/styled @mui/icons-material

# Install additional utilities
npm install lodash date-fns

# Start development server
npm start
# Frontend available at: http://localhost:3000
```

## 📋 **File Responsibilities**

### **🔴 Intern 1 Files:**
- **File 1 Questions:** Q01, Q03, Q05, Q07, Q09, Q11, Q13, Q15, Q17, Q19, Q21, Q23, Q25
- **File 2 Questions:** Q02, Q04, Q06, Q08, Q10, Q12, Q14, Q16, Q18, Q20, Q22, Q24

### **🔵 Intern 2 Files:**
- **File 1 Questions:** Q02, Q04, Q06, Q08, Q10, Q12, Q14, Q16, Q18, Q20, Q22, Q24, Q26  
- **File 2 Questions:** Q01, Q03, Q05, Q07, Q09, Q11, Q13, Q15, Q17, Q19, Q21, Q23, Q25

## 💡 **Key Development Guidelines**

### **1. Import Healthcare Constants**
```javascript
// In any component file
import { 
  calculateRiskScore, 
  calculateMaintenanceDates,
  INDUSTRY_BENCHMARKS,
  compareToBenchmark 
} from '../utils/healthcare-constants.js';
```

### **2. API Service Pattern**
```javascript
// services/hospitalService.js
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

export const getHospitals = () => axios.get(`${API_BASE}/hospitals`);
export const getHospitalMetrics = (id) => axios.get(`${API_BASE}/hospitals/${id}/metrics`);
export const getAnalyticsSummary = () => axios.get(`${API_BASE}/analytics/summary`);
```

### **3. Component Structure Example**
```javascript
// pages/intern1/file1/Q01_HospitalList.jsx
import React, { useState, useEffect } from 'react';
import { Table, Card } from 'antd';
import { getHospitals } from '../../../services/hospitalService';

const Q01_HospitalList = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch hospital