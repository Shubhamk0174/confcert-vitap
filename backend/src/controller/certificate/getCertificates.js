import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";

/**
 * Get all certificates for a specific registration number
 * GET /api/certificate/regno/:regNo
 */
export const getCertificatesByRegNo = async (req, res) => {
  try {
    const { regNo } = req.params;

    if (!regNo || !regNo.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Registration number is required"));
    }

    const { getCertificatesByRegNoFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getCertificatesByRegNoFromBlockchain(regNo.trim());

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve certificates"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          regNo: regNo.trim(),
          certificateIds: result.certificateIds,
          count: result.certificateIds.length
        },
        `Found ${result.certificateIds.length} certificates for registration number ${regNo}`
      )
    );

  } catch (error) {
    console.error("Get certificates by reg no error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificates by registration number"
        )
      );
  }
};
export const getCertificatesofuser = async (req, res) => {
  try {
    const  email  = req.user?.email;

    if (!email || !email.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Registration number is required"));
    }

    const regNo = (email.split(".")[1]).split("@")[0]

    const { getCertificatesByRegNoFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getCertificatesByRegNoFromBlockchain(regNo.trim());

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve certificates"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          regNo: regNo.trim(),
          certificateIds: result.certificateIds,
          count: result.certificateIds.length
        },
        `Found ${result.certificateIds.length} certificates for registration number ${regNo}`
      )
    );

  } catch (error) {
    console.error("Get certificates by reg no error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificates by registration number"
        )
      );
  }
};

/**
 * Get all certificates issued by a specific organization name
 * GET /api/certificate/issuer/:issuerName
 */
export const getCertificatesByIssuerName = async (req, res) => {
  try {
    const { issuerName } = req.params;

    if (!issuerName || !issuerName.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Issuer name is required"));
    }

    const { getCertificatesByIssuerNameFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getCertificatesByIssuerNameFromBlockchain(issuerName.trim());

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve certificates"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          issuerName: issuerName.trim(),
          certificateIds: result.certificateIds,
          count: result.certificateIds.length
        },
        `Found ${result.certificateIds.length} certificates issued by ${issuerName}`
      )
    );

  } catch (error) {
    console.error("Get certificates by issuer name error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificates by issuer name"
        )
      );
  }
};

/**
 * Get all certificates issued by a specific wallet address
 * GET /api/certificate/issuer-address/:address
 */
export const getCertificatesByIssuerAddress = async (req, res) => {
  try {
    const { address } = req.params;

    if (!address || !address.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Issuer address is required"));
    }

    // Validate Ethereum address format
    if (!address.startsWith('0x') || address.length !== 42) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Invalid Ethereum address format"));
    }

    const { getCertificatesByIssuerAddressFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getCertificatesByIssuerAddressFromBlockchain(address.trim());

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve certificates"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          issuerAddress: address.trim(),
          certificateIds: result.certificateIds,
          count: result.certificateIds.length
        },
        `Found ${result.certificateIds.length} certificates issued by address ${address}`
      )
    );

  } catch (error) {
    console.error("Get certificates by issuer address error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificates by issuer address"
        )
      );
  }
};

/**
 * Get all certificates issued till date
 * GET /api/certificate/all
 */
export const getAllCertificates = async (req, res) => {
  try {
    const { getAllCertificatesFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getAllCertificatesFromBlockchain();

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve all certificates"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          certificateIds: result.certificateIds,
          totalCount: result.certificateIds.length
        },
        `Found ${result.certificateIds.length} certificates total`
      )
    );

  } catch (error) {
    console.error("Get all certificates error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve all certificates"
        )
      );
  }
};

/**
 * Get detailed information for multiple certificates at once
 * POST /api/certificate/batch
 * Body: { certificateIds: [1001, 1002, 1003] }
 */
export const getCertificatesBatch = async (req, res) => {
  try {
    const { certificateIds } = req.body;

    if (!certificateIds || !Array.isArray(certificateIds) || certificateIds.length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Certificate IDs array is required"));
    }

    if (certificateIds.length > 100) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Cannot retrieve more than 100 certificates at once"));
    }

    // Validate that all IDs are numbers
    for (const id of certificateIds) {
      if (typeof id !== 'number' || id <= 0) {
        return res
          .status(HttpStatusCode.BAD_REQUEST)
          .json(new ApiError(HttpStatusCode.BAD_REQUEST, "All certificate IDs must be positive numbers"));
      }
    }

    const { getCertificatesBatchFromBlockchain } = await import("../../services/blockchain.service.js");
    const result = await getCertificatesBatchFromBlockchain(certificateIds);

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error || "Failed to retrieve certificate batch"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          certificates: result.certificates,
          count: result.certificates.length
        },
        `Retrieved ${result.certificates.length} certificates`
      )
    );

  } catch (error) {
    console.error("Get certificates batch error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificate batch"
        )
      );
  }
};

/**
 * Get certificate statistics
 * GET /api/certificate/stats
 */
export const getCertificateStats = async (req, res) => {
  try {
    const { getCurrentCounterFromBlockchain, getTotalCertificatesCount } = await import("../../services/blockchain.service.js");

    const counterResult = await getCurrentCounterFromBlockchain();
    const totalResult = await getTotalCertificatesCount();

    if (!counterResult.success || !totalResult.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to retrieve certificate statistics"));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          currentCounter: counterResult.counter,
          totalCertificates: totalResult.count,
          nextCertificateId: counterResult.counter + 1
        },
        "Certificate statistics retrieved successfully"
      )
    );

  } catch (error) {
    console.error("Get certificate stats error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to retrieve certificate statistics"
        )
      );
  }
};
