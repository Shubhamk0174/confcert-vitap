import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { 
  addAdminToContract, 
  removeAdminFromContract,
  getDeploymentInfo,
  getCurrentWalletAdminStatus
} from "../../services/web3adminManagementFunctions.js";




/////////////////////////////// to handle admin addresses in contract ///////////////////////////////

/**
 * Add a new admin to the smart contract
 * POST /api/admin/add
 * Body: { address: "0x..." }
 */
export const addAdminAddress = async (req, res) => {
  try {
    const address  = req.body?.address;

    // Validate address is provided
    if (!address || !address.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Wallet address is required"));
    }

    console.log('📋 Adding admin:', address);

    // Call blockchain service
    const result = await addAdminToContract(address.trim());
    console.log('🔍 Result from addAdminToContract:', result);

    if (!result.success) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, result.error));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          adminAddress: result.adminAddress,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          addedBy: result.addedBy,
          gasUsed: result.gasUsed
        },
        "Admin added successfully"
      )
    );

  } catch (error) {
    console.error("❌ Add admin error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to add admin"
        )
      );
  }
};

/**
 * Remove an admin from the smart contract
 * POST /api/admin/remove
 * Body: { address: "0x..." }
 */
export const removeAdminAddress = async (req, res) => {
  try {
    const { address } = req.body;

    // Validate address is provided
    if (!address || !address.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, "Wallet address is required"));
    }

    console.log('📋 Removing admin:', address);

    // Call blockchain service
    const result = await removeAdminFromContract(address.trim());

    if (!result.success) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(new ApiError(HttpStatusCode.BAD_REQUEST, result.error));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          adminAddress: result.adminAddress,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          removedBy: result.removedBy,
          gasUsed: result.gasUsed
        },
        "Admin removed successfully"
      )
    );

  } catch (error) {
    console.error("❌ Remove admin error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to remove admin"
        )
      );
  }
};


/**
 * Get contract deployment information
 * GET /api/admin/deployment-info
 */
export const getContractDeploymentInfo = async (req, res) => {
  try {
    const result = await getDeploymentInfo();

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          deployerAddress: result.deployerAddress,
          isDeployerStillAdmin: result.isDeployerStillAdmin
        },
        "Deployment info retrieved"
      )
    );

  } catch (error) {
    console.error("❌ Get deployment info error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to get deployment info"
        )
      );
  }
};

/**
 * Get current wallet's admin status
 * GET /api/admin/current-status
 */
export const getCurrentAdminStatus = async (req, res) => {
  try {
    const result = await getCurrentWalletAdminStatus();

    if (!result.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, result.error));
    }

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          walletAddress: result.walletAddress,
          isAdmin: result.isAdmin
        },
        "Current wallet status retrieved"
      )
    );

  } catch (error) {
    console.error("❌ Get current admin status error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to get current admin status"
        )
      );
  }
};
