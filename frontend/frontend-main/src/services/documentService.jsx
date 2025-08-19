import api from './api';

export const fetchDocumentStatus = async () => {
  try {
    // Use the new combined endpoint that properly handles hospital names
    const response = await api.get('/document-verification');
    return response.data;
  } catch (error) {
    console.error("Error fetching document status:", error);
    // Fallback to mock data if the API calls fail
    return {
      totalVerified: 28,
      totalPending: 14,
      totalRejected: 7,
      hospitals: [
        {
          id: 1,
          name: "Apollo Hospitals",
          documents: [
            { id: 1, document_type: "License", is_verified: true, verification_status: "verified" },
            { id: 2, document_type: "Certificate", is_verified: true, verification_status: "verified" },
            { id: 3, document_type: "Insurance", is_verified: false, verification_status: "pending" }
          ]
        },
        {
          id: 2,
          name: "Fortis Healthcare",
          documents: [
            { id: 4, document_type: "License", is_verified: true, verification_status: "verified" },
            { id: 5, document_type: "Certificate", is_verified: false, verification_status: "rejected" },
            { id: 6, document_type: "Insurance", is_verified: false, verification_status: "pending" }
          ]
        },
        {
          id: 3,
          name: "Max Healthcare",
          documents: [
            { id: 7, document_type: "License", is_verified: true, verification_status: "verified" },
            { id: 8, document_type: "Certificate", is_verified: true, verification_status: "verified" },
            { id: 9, document_type: "Insurance", is_verified: true, verification_status: "verified" }
          ]
        }
      ]
    };
  }
};

export const verifyDocument = async (docId) => {
  try {
    const response = await api.patch(`/documents/${docId}/verify`, { is_verified: true });
    return response.data;
  } catch (error) {
    console.error("Error verifying document:", error);
    return { success: false, docId, message: "Failed to verify document" };
  }
};

