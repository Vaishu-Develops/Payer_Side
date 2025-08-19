// Mock Backend Server - Simulates real API responses
class MockBackendServer {
  constructor() {
    this.data = {
      hospitals: [
        {
          id: 1,
          name: "Regional Medical Center",
          location: "New York, NY",
          city: "New York",
          state: "NY",
          type: "Academic Medical Center",
          hospital_type: "Academic Medical Center",
          beds: 450,
          established: 1985,
          phone: "(555) 123-4567",
          email: "info@regionalmedical.org",
          status: "Active",
          rating: 4.5,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        },
        {
          id: 2,
          name: "City General Hospital",
          location: "Los Angeles, CA",
          city: "Los Angeles",
          state: "CA",
          type: "Community Hospital",
          hospital_type: "Community Hospital",
          beds: 320,
          established: 1978,
          phone: "(555) 234-5678",
          email: "contact@citygeneral.com",
          status: "Active",
          rating: 4.2,
          coordinates: { lat: 34.0522, lng: -118.2437 }
        },
        {
          id: 3,
          name: "University Medical Center",
          location: "Chicago, IL",
          city: "Chicago",
          state: "IL",
          type: "Teaching Hospital",
          hospital_type: "Teaching Hospital",
          beds: 600,
          established: 1892,
          phone: "(555) 345-6789",
          email: "info@universitymedical.edu",
          status: "Active",
          rating: 4.8,
          coordinates: { lat: 41.8781, lng: -87.6298 }
        },
        {
          id: 4,
          name: "Metropolitan Health Center",
          location: "Houston, TX",
          city: "Houston",
          state: "TX",
          type: "Community Hospital",
          hospital_type: "Community Hospital",
          beds: 280,
          established: 1995,
          phone: "(555) 456-7890",
          email: "info@metrohealth.org",
          status: "Active",
          rating: 4.1,
          coordinates: { lat: 29.7604, lng: -95.3698 }
        },
        {
          id: 5,
          name: "St. Mary's Medical Center",
          location: "Miami, FL",
          city: "Miami",
          state: "FL",
          type: "Faith-Based Hospital",
          hospital_type: "Faith-Based Hospital",
          beds: 380,
          established: 1952,
          phone: "(555) 567-8901",
          email: "contact@stmarysmedical.org",
          status: "Active",
          rating: 4.3,
          coordinates: { lat: 25.7617, lng: -80.1918 }
        }
      ],
      
      documentVerification: {
        totalDocuments: 1250,
        verified: 1180,
        pending: 45,
        rejected: 25,
        verificationRate: 94.4,
        hospitals: [
          {
            id: 1,
            name: "Regional Medical Center",
            documents: {
              license: { status: "verified", date: "2024-01-15" },
              accreditation: { status: "verified", date: "2024-02-20" },
              insurance: { status: "pending", date: null },
              certification: { status: "verified", date: "2024-01-30" }
            }
          },
          {
            id: 2,
            name: "City General Hospital",
            documents: {
              license: { status: "verified", date: "2024-01-10" },
              accreditation: { status: "verified", date: "2024-02-15" },
              insurance: { status: "verified", date: "2024-02-01" },
              certification: { status: "pending", date: null }
            }
          },
          {
            id: 3,
            name: "University Medical Center",
            documents: {
              license: { status: "verified", date: "2024-01-20" },
              accreditation: { status: "verified", date: "2024-02-25" },
              insurance: { status: "verified", date: "2024-02-10" },
              certification: { status: "verified", date: "2024-02-05" }
            }
          }
        ]
      },
      
      equipmentMatrix: [
        { id: 1, equipment: "MRI Scanner", available: 15, total: 18, utilization: 83, category: "Diagnostic" },
        { id: 2, equipment: "CT Scanner", available: 22, total: 25, utilization: 88, category: "Diagnostic" },
        { id: 3, equipment: "X-Ray Machine", available: 35, total: 40, utilization: 87, category: "Diagnostic" },
        { id: 4, equipment: "Ultrasound", available: 28, total: 30, utilization: 93, category: "Diagnostic" },
        { id: 5, equipment: "Ventilator", available: 45, total: 50, utilization: 90, category: "Critical Care" },
        { id: 6, equipment: "Defibrillator", available: 18, total: 20, utilization: 90, category: "Emergency" }
      ],
      
      hospitalsByState: [
        { state: "California", count: 45, percentage: 18.2 },
        { state: "Texas", count: 38, percentage: 15.4 },
        { state: "New York", count: 32, percentage: 13.0 },
        { state: "Florida", count: 28, percentage: 11.3 },
        { state: "Illinois", count: 25, percentage: 10.1 },
        { state: "Pennsylvania", count: 22, percentage: 8.9 },
        { state: "Ohio", count: 20, percentage: 8.1 },
        { state: "Michigan", count: 18, percentage: 7.3 },
        { state: "Georgia", count: 15, percentage: 6.1 },
        { state: "North Carolina", count: 12, percentage: 4.9 }
      ],
      
      summary: {
        totalHospitals: 247,
        totalBeds: 45230,
        occupancyRate: 78.5,
        avgPatientSatisfaction: 85.2,
        totalDoctors: 12450,
        totalNurses: 28900,
        emergencyDepartments: 198,
        icuBeds: 3420
      },
      
      wardData: [
        {
          id: 1,
          hospital_id: 1,
          name: "Emergency",
          total_beds: 50,
          occupied: 38,
          occupancy_rate: 76,
          avg_length_of_stay: 0.5,
          turnover_rate: 15.2
        },
        {
          id: 2,
          hospital_id: 1,
          name: "ICU",
          total_beds: 30,
          occupied: 28,
          occupancy_rate: 93,
          avg_length_of_stay: 4.2,
          turnover_rate: 8.5
        },
        {
          id: 3,
          hospital_id: 1,
          name: "General Medicine",
          total_beds: 120,
          occupied: 95,
          occupancy_rate: 79,
          avg_length_of_stay: 3.8,
          turnover_rate: 12.1
        }
      ],
      
      bedCapacity: {
        hospitals: [
          {
            id: 1,
            name: "Regional Medical Center",
            total_beds: 450,
            occupied_beds: 342,
            available_beds: 108,
            occupancy_rate: 76,
            departments: [
              { name: "Emergency", total_beds: 50, occupied: 38, occupancy_rate: 76 },
              { name: "ICU", total_beds: 30, occupied: 28, occupancy_rate: 93 },
              { name: "General Medicine", total_beds: 120, occupied: 95, occupancy_rate: 79 },
              { name: "Surgery", total_beds: 80, occupied: 65, occupancy_rate: 81 },
              { name: "Pediatrics", total_beds: 60, occupied: 42, occupancy_rate: 70 },
              { name: "Maternity", total_beds: 40, occupied: 28, occupancy_rate: 70 },
              { name: "Cardiology", total_beds: 35, occupied: 25, occupancy_rate: 71 },
              { name: "Oncology", total_beds: 35, occupied: 21, occupancy_rate: 60 }
            ]
          }
        ]
      }
    };
  }

  // Simulate network delay
  async delay(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // API endpoint handlers
  async getHospitals() {
    await this.delay();
    return {
      success: true,
      data: {
        hospitals: this.data.hospitals
      }
    };
  }

  async getHospitalsByState() {
    await this.delay();
    return {
      success: true,
      data: this.data.hospitalsByState
    };
  }

  async getDocumentVerification() {
    await this.delay();
    return {
      success: true,
      data: this.data.documentVerification
    };
  }

  async getEquipmentMatrix() {
    await this.delay();
    return {
      success: true,
      data: this.data.equipmentMatrix
    };
  }

  async getSummary() {
    await this.delay();
    return {
      success: true,
      data: this.data.summary
    };
  }

  async getBedCapacity() {
    await this.delay();
    return {
      success: true,
      data: this.data.bedCapacity
    };
  }

  async getWardData(hospitalId) {
    await this.delay();
    const wardData = this.data.wardData.filter(ward => 
      !hospitalId || ward.hospital_id === parseInt(hospitalId)
    );
    return {
      success: true,
      data: wardData
    };
  }

  // Additional API methods
  async getHospitalRankings() {
    await this.delay();
    return {
      success: true,
      data: this.data.hospitals.map((hospital, index) => ({
        ...hospital,
        rank: index + 1,
        doctor_bed_ratio: (Math.random() * 2 + 0.5).toFixed(2),
        nurse_bed_ratio: (Math.random() * 3 + 1).toFixed(2)
      }))
    };
  }

  async getNetworkBenchmarks() {
    await this.delay();
    return {
      success: true,
      data: {
        avgBedOccupancy: 78.5,
        avgPatientSatisfaction: 85.2,
        avgDoctorBedRatio: 1.2,
        avgNurseBedRatio: 2.8,
        totalNetworkBeds: 45230,
        totalNetworkHospitals: 247
      }
    };
  }

  // Handle API calls
  async handleRequest(url, method = 'GET') {
    try {
      if (url.includes('/hospitals') && !url.includes('/analytics')) {
        return await this.getHospitals();
      } else if (url.includes('/analytics/hospitals-by-state')) {
        return await this.getHospitalsByState();
      } else if (url.includes('/analytics/hospital-rankings')) {
        return await this.getHospitalRankings();
      } else if (url.includes('/analytics/benchmarks')) {
        return await this.getNetworkBenchmarks();
      } else if (url.includes('/document-verification')) {
        return await this.getDocumentVerification();
      } else if (url.includes('/analytics/equipment-matrix')) {
        return await this.getEquipmentMatrix();
      } else if (url.includes('/analytics/summary')) {
        return await this.getSummary();
      } else if (url.includes('/bed-capacity')) {
        return await this.getBedCapacity();
      } else if (url.includes('/wards')) {
        const hospitalId = url.match(/hospitals\/(\d+)\/wards/)?.[1];
        return await this.getWardData(hospitalId);
      }
      
      throw new Error(`Endpoint not found: ${url}`);
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Create singleton instance
const mockBackend = new MockBackendServer();

export default mockBackend;