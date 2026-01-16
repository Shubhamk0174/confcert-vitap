import { uploadSingleFile } from "../../middleware/multer.js";
import { uploadToIPFS } from "../../services/uploadToIpfs.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { ApiError } from "../../utils/ApiError.js";
import { HttpStatusCode } from "../../utils/httpStatusCode.js";

export const uploadCertificateToIpfs = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "No file provided"));
    }

    const { buffer, originalname, mimetype } = req.file;

    const result = await uploadToIPFS(buffer, originalname, mimetype);

    if (result.success) {
      return res.status(HttpStatusCode.OK).json(
        new ApiResponse(
          HttpStatusCode.OK,
          {
            ipfsHash: result.ipfsHash,
            pinataUrl: result.pinataUrl,
            timestamp: result.timestamp,
          },
          "File uploaded to IPFS successfully",
        )
      );
    } else {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error));
    }
  } catch (error) {
    console.error("Upload error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          "Internal server error"
        )
      );
  }
};
