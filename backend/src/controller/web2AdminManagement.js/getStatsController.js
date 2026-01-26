import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { supabaseServer } from "../../db/supabaseServer.js";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

/**
 * Get comprehensive wallet and contract statistics
 * GET /api/web2admin/get-stats
 * Returns: wallet info, contract stats, user counts
 */
export const getAdminStats = async (req, res) => {
  try {
    // Get blockchain data
    const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const balance = await provider.getBalance(wallet.address);
    const balanceInEth = ethers.formatEther(balance);

    // Get contract address from env
    const contractAddress = process.env.CONTRACT_ADDRESS;

    // Get total certificates from contract (optional - requires contract ABI)
    let totalCertificatesOnChain = 0;
    try {
      const { getTotalCertificatesCount } = await import("../../services/blockchain.service.js");
      const result = await getTotalCertificatesCount();
      if (result.success) {
        totalCertificatesOnChain = parseInt(result.count);
      }
    } catch (error) {
      console.error("Failed to get certificate count from blockchain:", error);
    }

    // Get certificates count from database
    const { count: certificatesInDb, error: certError } = await supabaseServer
      .from("certificates")
      .select("*", { count: "exact", head: true });

    if (certError) {
      console.error("Database query error for certificates:", certError);
    }

    // Get user counts from database
    const { data: admins, error: adminError } = await supabaseServer
      .from("auth")
      .select("id")
      .eq("role", "admin");

    const { data: clubAdmins, error: clubAdminError } = await supabaseServer
      .from("auth")
      .select("id")
      .eq("role", "club.admin");

    const { data: students, error: studentError } = await supabaseServer
      .from("auth")
      .select("id")
      .eq("role", "student");

    const adminCount = admins?.length || 0;
    const clubAdminCount = clubAdmins?.length || 0;
    const studentCount = students?.length || 0;
    const totalUsers = adminCount + clubAdminCount + studentCount;

    // Prepare response data
    const statsData = {
      wallet: {
        address: wallet.address,
        balanceInEth: balanceInEth,
        balance: balance.toString(),
      },
      contract: {
        address: contractAddress,
        totalCertificates: totalCertificatesOnChain,
        certificatesInDb: certificatesInDb || 0,
      },
      users: {
        admins: adminCount,
        clubAdmins: clubAdminCount,
        students: studentCount,
        total: totalUsers,
      },
    };

    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(HttpStatusCode.OK, statsData, "Stats retrieved successfully")
    );
  } catch (error) {
    console.error("Unexpected error fetching stats:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(HttpStatusCode.INTERNAL_SERVER_ERROR, "Failed to fetch statistics")
      );
  }
};
