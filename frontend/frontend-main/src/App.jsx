import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Button, Layout, Menu } from 'antd';
import { BankOutlined, LogoutOutlined, HomeOutlined } from '@ant-design/icons';
import 'antd/dist/reset.css';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';
import LandingPage from './pages/LandingPage';
import Q01_HospitalList from './pages/Vaishnavi/files/Q01_HospitalList';
import Q02_NabhCertifiedHospitals from './pages/Vaishnavi/files/Q02_NabhCertifiedHospitals';
import Q04_EquipmentAvailability from './pages/Vaishnavi/files/Q04_EquipmentAvailability';
import Q06_StateWiseHospitalCount from './pages/Vaishnavi/files/Q06_StateWiseHospitalCount';
import Q08_DocumentVerification from './pages/Vaishnavi/files/Q08_DocumentVerification';
import Q12_WardOccupancy from './pages/Vaishnavi/files/Q12_WardOccupancy';
import Q14_HospitalPerformance from './pages/Vaishnavi/files/Q14_HospitalPerformance';
import Q16_HospitalRiskDashboard from './pages/Vaishnavi/files/Q16_HospitalRiskDashboard';
import Q18_BedCapacityDashboard from './pages/Vaishnavi/files/Q18_BedCapacityDashboard'; 
import Q20_HospitalMap from './pages/Vaishnavi/files/Q20_HospitalMap';
import Q22_CertificationMatrix from './pages/Vaishnavi/files/Q22_CertificationMatrix';
import Q24_ContactAvailability from './pages/Vaishnavi/files/Q24_ContactAvailability';
import Q26_StaffingAdequacy from './pages/Vaishnavi/files/Q26_StaffingAdequacy';
import HospitalProfileDrawer from './pages/Vaishnavi/files/components/HospitalProfileDrawer';
import testAPI from './utils/apiTest';
import Q01_HospitalTypeDistribution from './pages/Vaishnavi/files/Q01_HospitalTypeDistribution';
import Q03_EmergencyContactAvailability from './pages/Vaishnavi/files/Q03_EmergencyContactAvailability';
import Q05_HospitalInfrastructureScoring from './pages/Vaishnavi/files/Q05_HospitalInfrastructureScoring';
import Q07_DoctorSpecialtyDistribution from './pages/Vaishnavi/files/Q07_DoctorSpecialtyDistribution';
import Q09_HospitalCapabilityAssessment from './pages/Vaishnavi/files/Q09_HospitalCapabilityAssessment';
import Q11_HospitalStaffingAnalysis from './pages/Vaishnavi/files/Q11_HospitalStaffingAnalysis';
import Q13_CertificationTimeline from './pages/Vaishnavi/files/Q13_CertificationTimeline';



const { Header, Sider, Content } = Layout;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Test API connectivity on app start
  useEffect(() => {
    testAPI();
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        backgroundColor: '#f0f2f5'
      }}>
        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxWidth: '400px',
          width: '100%'
        }}>
          <h3 style={{ textAlign: 'center', marginBottom: '24px', color: '#1890ff' }}>
            <BankOutlined style={{ marginRight: '8px' }} />
            Payer Dashboard Login
          </h3>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div style={{ marginBottom: '16px' }}>
              <input 
                type="text" 
                placeholder="Username" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required 
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <input 
                type="password" 
                placeholder="Password" 
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d9d9d9',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
                required 
              />
            </div>
            <button 
              type="submit" 
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#1890ff',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        {/* Header */}
        <Header style={{ 
          background: 'white', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#1890ff' }}>
            <BankOutlined style={{ marginRight: '8px' }} />
            Payer Dashboard
          </h2>
          <Button 
            onClick={handleLogout} 
            icon={<LogoutOutlined />}
            type="default"
          >
            Logout
          </Button>
        </Header>

        <Layout>
          {/* Sidebar */}
          <Sider 
            width={280}
            style={{ background: 'white' }}
            collapsible
            collapsed={collapsed}
            onCollapse={setCollapsed}
          >
            <Menu 
              mode="inline" 
              style={{ height: '100%', border: 'none' }}
              items={[
                {
                  key: 'home',
                  icon: <HomeOutlined />,
                  label: <Link to="/">Dashboard Home</Link>
                },
                {
                  key: 'questions',
                  label: 'Question Pages',
                  icon: <BankOutlined />,
                  children: [
                    {
                      key: 'q1',
                      label: <Link to="/q1">Q1: Hospital List</Link>
                    },
                    {
                      key: 'q2',
                      label: <Link to="/q2">Q2: NABH Certified Hospitals</Link>
                    },
                    {
                      key: 'q4',
                      label: <Link to="/q4">Q4: Equipment Availability</Link>
                    },
                    {
                      key: 'q6',
                      label: <Link to="/q6">Q6: State Wise Hospital Count</Link>
                    },
                    {
                      key: 'q8',
                      label: <Link to="/q8">Q8: Document Verification</Link>
                    },
                    {
                      key: 'q12',
                      label: <Link to="/q12">Q12: Ward Occupancy</Link>
                    },
                    {
                      key: 'q14',
                      label: <Link to="/q14">Q14: Hospital Performance</Link>
                    },
                    {
                      key: 'q18',
                      label: <Link to="/q18">Q18: Bed Capacity</Link>
                    },
                    {
                      key: 'q20',
                      label: <Link to="/q20">Q20: Hospital Mapping</Link>
                    },
                    {
                      key: 'q22',
                      label: <Link to="/q22">Q22: Certification Matrix</Link>
                    },
                    {
                      key: 'q24',
                      label: <Link to="/q24">Q24: Contact Availability</Link>
                    },
                    {
                      key: 'q16',
                      label: <Link to="/q16">Q16: Hospital Risk Dashboard</Link>
                    },
                    {
                      key: 'q26',
                      label: <Link to="/q26">Q26: Staffing Adequacy</Link>
                    },
                    {
                      key: 'q01',
                      label: <Link to="/q01">Q01: Hospital Type Distribution</Link>
                    },
                    {
                      key: 'q03',
                      label: <Link to="/q03">Q03: Emergency Contact Availability</Link>
                    },
                    {
                      key: 'q05',
                      label: <Link to="/q05">Q05: Hospital Infrastructure Scoring</Link>
                    },
                    {
                      key: 'q07',
                      label: <Link to="/q07">Q07: Doctor Specialty Distribution</Link>
                    },
                    {
                      key: 'q09',
                      label: <Link to="/q09">Q09: Hospital Capability Assessment</Link>
                    },
                    {
                      key: 'q11',
                      label: <Link to="/q11">Q11: Hospital Staffing Analysis</Link>
                    },
                    {
                      key: 'q13',
                      label: <Link to="/q13">Q13: Certification Timeline</Link>
                    }

                    // More questions will be added here
                  ]
                }
              ]}
            />
          </Sider>

          {/* Main Content */}
          <Content style={{ 
            margin: '0', 
            padding: '24px',
            backgroundColor: '#f0f2f5',
            minHeight: 'calc(100vh - 64px)'
          }}>
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/q1" element={<ErrorBoundary><Q01_HospitalList /></ErrorBoundary>} />
                <Route path="/q2" element={<ErrorBoundary><Q02_NabhCertifiedHospitals /></ErrorBoundary>} />
                <Route path="/q4" element={<ErrorBoundary><Q04_EquipmentAvailability /></ErrorBoundary>} />
                <Route path="/q6" element={<ErrorBoundary><Q06_StateWiseHospitalCount /></ErrorBoundary>} />
                <Route path="/q8" element={<ErrorBoundary><Q08_DocumentVerification /></ErrorBoundary>} />
                <Route path="/q12" element={<ErrorBoundary><Q12_WardOccupancy /></ErrorBoundary>} />
                <Route path="/q14" element={<ErrorBoundary><Q14_HospitalPerformance /></ErrorBoundary>} />
                <Route path="/q18" element={<ErrorBoundary><Q18_BedCapacityDashboard /></ErrorBoundary>} />
                <Route path="/q20" element={<ErrorBoundary><Q20_HospitalMap /></ErrorBoundary>} />
                <Route path="/q22" element={<ErrorBoundary><Q22_CertificationMatrix /></ErrorBoundary>} />
                <Route path="/q24" element={<ErrorBoundary><Q24_ContactAvailability /></ErrorBoundary>} />
                <Route path="/q16" element={<ErrorBoundary><Q16_HospitalRiskDashboard /></ErrorBoundary>} />
                <Route path="/q26" element={<ErrorBoundary><Q26_StaffingAdequacy /></ErrorBoundary>} />
                <Route path="/q01" element={<ErrorBoundary><Q01_HospitalTypeDistribution /></ErrorBoundary>} />
                <Route path="/q03" element={<ErrorBoundary><Q03_EmergencyContactAvailability /></ErrorBoundary>} />
                <Route path="/q05" element={<ErrorBoundary><Q05_HospitalInfrastructureScoring /></ErrorBoundary>} />
                <Route path="/q07" element={<ErrorBoundary><Q07_DoctorSpecialtyDistribution /></ErrorBoundary>} />
                <Route path="/q09" element={<ErrorBoundary><Q09_HospitalCapabilityAssessment /></ErrorBoundary>} />
                <Route path="/q11" element={<ErrorBoundary><Q11_HospitalStaffingAnalysis /></ErrorBoundary>} />
                <Route path="/q13" element={<ErrorBoundary><Q13_CertificationTimeline /></ErrorBoundary>} />
                {/* More routes will be added here */}
              </Routes>
            </ErrorBoundary>
          </Content>
        </Layout>
      </Layout>
    </Router>
  );
}

export default App;