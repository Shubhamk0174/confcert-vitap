import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { sendCertificateEmailFunction } from "../../services/sendCertificateEmail.js";


export const sendCertificateEmail = async (req, res) => {
  if (!req.body) {
    return res.status(HttpStatusCode.BAD_REQUEST).json(
      new ApiError(HttpStatusCode.BAD_REQUEST, "Request body is required")
    );
  }

  const {
    to,
    studentName,
    certificateId,
    ipfsHash,
    issuerAddress,
    transactionHash,
  } = req.body;
  try {
    if (!to || !studentName || !certificateId || !ipfsHash || !issuerAddress ||!transactionHash) {
      return res.status(HttpStatusCode.BAD_REQUEST).json(
        new ApiError(HttpStatusCode.BAD_REQUEST, "Missing required fields" )
      );
    }

    // 🚫 Prevent self-send
    if (to === process.env.ZOHO_EMAIL_USER) {
      return res.status(HttpStatusCode.BAD_REQUEST).json(
        new ApiError(HttpStatusCode.BAD_REQUEST, "Recipient email must be different from sender" )
      );
     
    }

    const result = await sendCertificateEmailFunction({
      to,
      studentName,
      certificateId,
      ipfsHash,
      issuerAddress,
      transactionHash,
    });

    if (!result.success) {
      return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Unable to send certificate email")
      )
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, "Email sent Successfully")
    )
  } catch (error) {
    console.error("API error:", error);
    return res.status(HttpStatusCode.INTERNAL_SERVER_ERROR).json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Internal Server Error")
      )
  }
};
