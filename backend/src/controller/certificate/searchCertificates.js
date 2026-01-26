import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/**
 * Search certificates with full details from blockchain
 * POST /api/certificate/search
 * Body: { searchType: 'all' | 'regno' | 'issuer', searchQuery: '' }
 */
export const searchCertificates = async (req, res) => {
  try {
    const { searchType = 'all', searchQuery = '' } = req.body;

    let certificateIds = [];
    let result;

    // Get certificate IDs based on search type
    if (searchType === 'regno' && searchQuery.trim()) {
      // Search by registration number
      const { getCertificatesByRegNoFromBlockchain } = await import("../../services/blockchain.service.js");
      result = await getCertificatesByRegNoFromBlockchain(searchQuery.trim());
      
      if (!result.success) {
        return res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to search certificates"));
      }
      
      certificateIds = result.certificateIds || [];
    } else if (searchType === 'issuer' && searchQuery.trim()) {
      // Search by issuer name
      const { getCertificatesByIssuerNameFromBlockchain } = await import("../../services/blockchain.service.js");
      result = await getCertificatesByIssuerNameFromBlockchain(searchQuery.trim());
      
      if (!result.success) {
        return res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to search certificates"));
      }
      
      certificateIds = result.certificateIds || [];
    } else {
      // Get all certificates
      const { getAllCertificatesFromBlockchain } = await import("../../services/blockchain.service.js");
      result = await getAllCertificatesFromBlockchain();
      
      if (!result.success) {
        return res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve certificates"));
      }
      
      certificateIds = result.certificateIds || [];
    }

    // If no certificates found, return empty array
    if (certificateIds.length === 0) {
      return res.status(HttpStatusCode.OK).json(
        new ApiResponse(
          HttpStatusCode.OK,
          {
            certificates: [],
            count: 0,
            searchType,
            searchQuery: searchQuery.trim()
          },
          "No certificates found"
        )
      );
    }

    // Get detailed information for all certificates
    const { getCertificatesBatchFromBlockchain } = await import("../../services/blockchain.service.js");
    const batchResult = await getCertificatesBatchFromBlockchain(certificateIds);

    if (!batchResult.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, batchResult.error || "Failed to retrieve certificate details"));
    }

    // Format certificates for response
    const certificates = batchResult.certificates
      .filter(cert => cert.exists) // Only include existing certificates
      .map(cert => ({
        certificate_id: cert.id,
        student_name: cert.studentName,
        reg_no: cert.regNo,
        ipfs_hash: cert.ipfsHash,
        event_name: cert.issuerUsername, // Using issuerUsername as event/club name
        issuer_name: cert.issuerUsername,
        issuer_address: cert.issuerAddress,
        created_at: new Date(cert.timestamp * 1000).toISOString(), // Convert timestamp to ISO string
      }));

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          certificates,
          count: certificates.length,
          searchType,
          searchQuery: searchQuery.trim()
        },
        `Found ${certificates.length} certificate(s)`
      )
    );
  } catch (error) {
    console.error("Search certificates error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to search certificates"
        )
      );
  }
};

/**
 * Get certificate details by certificate ID from blockchain
 * GET /api/certificate/details/:certificateId
 */
export const getCertificateDetails = async (req, res) => {
  try {
    const { certificateId } = req.params;

    if (!certificateId) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Certificate ID is required"));
    }

    const { getCertificateFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getCertificateFromBlockchain(parseInt(certificateId));

    if (!result.success) {
      return res
        .status(HttpStatusCode.NOT_FOUND)
        .json(new ApiError(HttpStatusCode.NOT_FOUND, result.error || "Certificate not found"));
    }

    // Format certificate for response
    const certificate = {
      certificate_id: result.certificate.id,
      student_name: result.certificate.studentName,
      reg_no: result.certificate.regNo,
      ipfs_hash: result.certificate.ipfsHash,
      event_name: result.certificate.issuerUsername,
      issuer_name: result.certificate.issuerUsername,
      issuer_address: result.certificate.issuerAddress,
      created_at: new Date(result.certificate.timestamp * 1000).toISOString(),
    };

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        { certificate },
        "Certificate details retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Get certificate details error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificate details"
        )
      );
  }
};
