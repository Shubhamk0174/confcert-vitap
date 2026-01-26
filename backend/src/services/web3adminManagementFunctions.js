import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize provider and wallet
let provider, wallet, contract;

const initializeContract = async () => {
  if (contract) return contract;

  try {
    // Setup provider
    provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);
    
    // Setup wallet
    wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Load contract ABI
    const contractPath = path.join(__dirname, "../contracts/CertificateRegistry.sol");
    const contractSource = fs.readFileSync(contractPath, "utf8");
    
    // Note: In production, you should have the compiled ABI
    // For now, we'll construct the ABI manually for the functions we need
    const contractABI = [
      "function addAdmin(address _newAdmin) public",
      "function removeAdmin(address _admin) public",
      "function isAdmin(address _address) public view returns (bool)",
      "function admins(address) public view returns (bool)",
      "function deployer() public view returns (address)",
      "function getDeploymentInfo() public view returns (address deployerAddress, bool isDeployerStillAdmin)",
      "function getAllAdmins() public view returns (address[])",
      "event AdminAdded(address indexed newAdmin, address indexed addedBy)",
      "event AdminRemoved(address indexed removedAdmin, address indexed removedBy)"
    ];

    contract = new ethers.Contract(
      process.env.CONTRACT_ADDRESS,
      contractABI,
      wallet
    );

    console.log("✅ Admin management contract initialized");
    return contract;
  } catch (error) {
    console.error("❌ Failed to initialize admin management contract:", error);
    throw error;
  }
};

/**
 * Add a new admin to the contract
 * @param {string} adminAddress - The wallet address to grant admin privileges
 * @returns {Object} - Result object with success status and transaction details
 */
export const addAdminToContract = async (adminAddress) => {
  try {
    // Validate address format
    if (!ethers.isAddress(adminAddress)) {
      return {
        success: false,
        error: "Invalid Ethereum address format"
      };
    }

    const contract = await initializeContract();

    // Check if address is already an admin
    const isAlreadyAdmin = await contract.isAdmin(adminAddress);
    if (isAlreadyAdmin) {
      return {
        success: false,
        error: "Address is already an admin"
      };
    }

    console.log(`📝 Adding admin: ${adminAddress}`);

    // Check if the wallet is an admin first
    const walletIsAdmin = await contract.isAdmin(wallet.address);
    const deployerAddress = await contract.deployer();
    console.log(`🔍 Wallet ${wallet.address} is admin: ${walletIsAdmin}`);
    console.log(`🔍 Contract deployer: ${deployerAddress}`);
    console.log(`🔍 Wallet matches deployer: ${wallet.address.toLowerCase() === deployerAddress.toLowerCase()}`);

    // Send transaction to add admin
    const tx = await contract.addAdmin(adminAddress);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Admin added successfully in block ${receipt.blockNumber}`);

    // Extract event data
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'AdminAdded';
      } catch {
        return false;
      }
    });

    let addedBy = wallet.address;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      addedBy = parsed.args.addedBy;
    }

    return {
      success: true,
      adminAddress: adminAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      addedBy: addedBy,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error("❌ Error adding admin:", error);
    
    // Parse contract revert errors
    let errorMessage = error.message;
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.data) {
      errorMessage = `Transaction reverted: ${error.data}`;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Remove an admin from the contract
 * @param {string} adminAddress - The wallet address to revoke admin privileges
 * @returns {Object} - Result object with success status and transaction details
 */
export const removeAdminFromContract = async (adminAddress) => {
  try {
    // Validate address format
    if (!ethers.isAddress(adminAddress)) {
      return {
        success: false,
        error: "Invalid Ethereum address format"
      };
    }

    const contract = await initializeContract();

    // Check if address is an admin
    const isCurrentlyAdmin = await contract.isAdmin(adminAddress);
    if (!isCurrentlyAdmin) {
      return {
        success: false,
        error: "Address is not an admin"
      };
    }

    // Check if trying to remove yourself
    if (adminAddress.toLowerCase() === wallet.address.toLowerCase()) {
      return {
        success: false,
        error: "Cannot remove yourself as admin"
      };
    }

    console.log(`📝 Removing admin: ${adminAddress}`);

    // Send transaction to remove admin
    const tx = await contract.removeAdmin(adminAddress);
    console.log(`⏳ Transaction submitted: ${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`✅ Admin removed successfully in block ${receipt.blockNumber}`);

    // Extract event data
    const event = receipt.logs.find(log => {
      try {
        const parsed = contract.interface.parseLog(log);
        return parsed && parsed.name === 'AdminRemoved';
      } catch {
        return false;
      }
    });

    let removedBy = wallet.address;
    if (event) {
      const parsed = contract.interface.parseLog(event);
      removedBy = parsed.args.removedBy;
    }

    return {
      success: true,
      adminAddress: adminAddress,
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      removedBy: removedBy,
      gasUsed: receipt.gasUsed.toString()
    };

  } catch (error) {
    console.error("❌ Error removing admin:", error);
    
    // Parse contract revert errors
    let errorMessage = error.message;
    if (error.reason) {
      errorMessage = error.reason;
    } else if (error.data) {
      errorMessage = `Transaction reverted: ${error.data}`;
    }

    return {
      success: false,
      error: errorMessage
    };
  }
};

/**
 * Check if an address is an admin
 * @param {string} address - The address to check
 * @returns {Object} - Result object with admin status
 */
export const checkIsAdmin = async (address) => {
  try {
    if (!ethers.isAddress(address)) {
      return {
        success: false,
        error: "Invalid Ethereum address format"
      };
    }

    const contract = await initializeContract();
    const isAdmin = await contract.isAdmin(address);

    return {
      success: true,
      address: address,
      isAdmin: isAdmin
    };

  } catch (error) {
    console.error("❌ Error checking admin status:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get contract deployment information
 * @returns {Object} - Deployer address and their current admin status
 */
export const getDeploymentInfo = async () => {
  try {
    const contract = await initializeContract();
    const [deployerAddress, isDeployerStillAdmin] = await contract.getDeploymentInfo();

    return {
      success: true,
      deployerAddress: deployerAddress,
      isDeployerStillAdmin: isDeployerStillAdmin
    };

  } catch (error) {
    console.error("❌ Error getting deployment info:", error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all admin addresses from blockchain contract
 * @returns {Object} - List of admin addresses
 */
export const getAllAdminAddresses = async () => {
  try {
    const contract = await initializeContract();
    
    // Call the contract's getAllAdmins function directly
    const adminAddresses = await contract.getAllAdmins();
    
    return {
      success: true,
      admins: adminAddresses,
      count: adminAddresses.length
    };

  } catch (error) {
    console.error("❌ Error getting all admin addresses:", error);
    return {
      success: false,
      error: error.message,
      admins: []
    };
  }
};

/**
 * Get current wallet's admin status
 * @returns {Object} - Current wallet address and admin status
 */
export const getCurrentWalletAdminStatus = async () => {
  try {
    const contract = await initializeContract();
    const currentAddress = wallet.address;
    const isAdmin = await contract.isAdmin(currentAddress);

    return {
      success: true,
      walletAddress: currentAddress,
      isAdmin: isAdmin
    };

  } catch (error) {
    console.error("❌ Error getting current wallet status:", error);
    return {
      success: false,
      error: error.message
    };
  }
};
