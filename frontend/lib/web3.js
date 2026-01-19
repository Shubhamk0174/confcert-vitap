/**
 * Web3 Utility Functions (Read-Only)
 * This file now only handles read-only operations for certificate verification
 * All write operations (issuing certificates) are handled by the backend
 */

import { ethers } from 'ethers';

// Contract ABI - Only read functions are used now
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      }
    ],
    "name": "getCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "regNo",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "issuerUsername",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "issuerAddress",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_regNo",
        "type": "string"
      }
    ],
    "name": "getCertificatesByRegNo",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      }
    ],
    "name": "verifyCertificate",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "_certificateId",
        "type": "uint256"
      }
    ],
    "name": "verifyCertificateWithDetails",
    "outputs": [
      {
        "internalType": "bool",
        "name": "exists",
        "type": "bool"
      },
      {
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "regNo",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "issuerUsername",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getCurrentCounter",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract address on Sepolia - Update this after deployment
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

// Multiple RPC endpoints for fallback (public Sepolia RPCs)
const SEPOLIA_RPC_URLS = ['https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://eth-sepolia.public.blastapi.io',
  'https://sepolia.gateway.tenderly.co',
  'https://rpc2.sepolia.org',
];

let providerInstance = null;
let currentRpcIndex = 0;

/**
 * Get a read-only provider (no wallet needed) with automatic fallback
 */
function getReadOnlyProvider() {
  // Try to reuse existing provider if it exists
  if (providerInstance) {
    return providerInstance;
  }

  // Create new provider with current RPC URL
  try {
    const rpcUrl = SEPOLIA_RPC_URLS[currentRpcIndex];
    console.log(`🔗 Connecting to Sepolia RPC: ${rpcUrl}`);
    providerInstance = new ethers.JsonRpcProvider(rpcUrl);
    return providerInstance;
  } catch (error) {
    console.error('Failed to create provider:', error);
    throw new Error('Unable to connect to Sepolia network');
  }
}

/**
 * Try next RPC endpoint if current one fails
 */
async function switchToNextRpc() {
  currentRpcIndex = (currentRpcIndex + 1) % SEPOLIA_RPC_URLS.length;
  providerInstance = null; // Clear cached provider
  console.log(`⚠️ Switching to RPC endpoint ${currentRpcIndex + 1}/${SEPOLIA_RPC_URLS.length}`);
  return getReadOnlyProvider();
}

/**
 * Get contract instance for read operations with retry logic
 */
async function getReadOnlyContract(retryCount = 0) {
  if (!CONTRACT_ADDRESS) {
    throw new Error('Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in .env.local');
  }

  try {
    const provider = getReadOnlyProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    // Test the connection by getting the chain ID
    await provider.getNetwork();
    
    return contract;
  } catch (error) {
    console.error(`Connection error (attempt ${retryCount + 1}):`, error.message);
    
    // Try next RPC if we haven't exhausted all options
    if (retryCount < SEPOLIA_RPC_URLS.length - 1) {
      await switchToNextRpc();
      return getReadOnlyContract(retryCount + 1);
    }
    
    throw new Error('Failed to connect to Sepolia network. All RPC endpoints failed.');
  }
}

/**
 * Get certificate details from blockchain (read-only)
 * @param {number} certificateId - The certificate ID to look up
 * @returns {Promise<{success: boolean, certificate?: object, error?: string}>}
 */
export async function getCertificate(certificateId) {
  try {
    console.log(`📋 Fetching certificate ID: ${certificateId}`);
    
    if (!certificateId || isNaN(certificateId)) {
      return {
        success: false,
        error: 'Invalid certificate ID'
      };
    }

    const contract = await getReadOnlyContract();
    console.log('✅ Contract instance created');
    
    const result = await contract.getCertificate(certificateId);
    console.log('✅ Certificate data received:', {
      id: Number(result.id),
      exists: result.exists,
      studentName: result.studentName
    });

    if (!result.exists) {
      return {
        success: false,
        error: 'Certificate not found on blockchain'
      };
    }

    return {
      success: true,
      certificate: {
        id: Number(result.id),
        studentName: result.studentName,
        regNo: result.regNo,
        ipfsHash: result.ipfsHash,
        issuerUsername: result.issuerUsername,
        issuerAddress: result.issuerAddress,
        timestamp: Number(result.timestamp),
        exists: result.exists
      }
    };

  } catch (error) {
    console.error('❌ Get Certificate Error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Failed to retrieve certificate from blockchain';
    
    if (error.message.includes('network')) {
      errorMessage = 'Network connection error. Please check your internet connection.';
    } else if (error.message.includes('RPC')) {
      errorMessage = 'Blockchain network is temporarily unavailable. Please try again.';
    } else if (error.message.includes('configured')) {
      errorMessage = 'Application is not properly configured. Please contact support.';
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * Verify if a certificate exists (read-only)
 * @param {number} certificateId - The certificate ID to verify
 * @returns {Promise<{success: boolean, exists?: boolean, error?: string}>}
 */
export async function verifyCertificate(certificateId) {
  try {
    console.log(`🔍 Verifying certificate ID: ${certificateId}`);
    
    const contract = await getReadOnlyContract();
    const exists = await contract.verifyCertificate(certificateId);
    
    console.log(`✅ Verification result: ${exists}`);

    return {
      success: true,
      exists
    };

  } catch (error) {
    console.error('❌ Verify Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify certificate'
    };
  }
}

/**
 * Verify certificate and get basic details in one call (read-only)
 * @param {number} certificateId - The certificate ID to verify
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function verifyCertificateWithDetails(certificateId) {
  try {
    console.log(`🔍 Verifying certificate with details ID: ${certificateId}`);
    
    const contract = await getReadOnlyContract();
    const result = await contract.verifyCertificateWithDetails(certificateId);
    
    console.log(`✅ Verification result:`, {
      exists: result.exists,
      studentName: result.studentName,
      regNo: result.regNo
    });

    return {
      success: true,
      data: {
        exists: result.exists,
        studentName: result.studentName,
        regNo: result.regNo,
        issuerUsername: result.issuerUsername
      }
    };

  } catch (error) {
    console.error('❌ Verify Certificate With Details Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify certificate'
    };
  }
}

/**
 * Get all certificate IDs for a specific registration number (read-only)
 * @param {string} regNo - The registration number to search for
 * @returns {Promise<{success: boolean, certificateIds?: number[], error?: string}>}
 */
export async function getCertificatesByRegNo(regNo) {
  try {
    console.log(`📋 Fetching certificates for regNo: ${regNo}`);
    
    if (!regNo || typeof regNo !== 'string') {
      return {
        success: false,
        error: 'Invalid registration number'
      };
    }

    const contract = await getReadOnlyContract();
    const certificateIds = await contract.getCertificatesByRegNo(regNo);
    
    // Convert BigInt array to number array
    const ids = certificateIds.map(id => Number(id));
    
    console.log(`✅ Found ${ids.length} certificate(s) for regNo: ${regNo}`);

    return {
      success: true,
      certificateIds: ids
    };

  } catch (error) {
    console.error('❌ Get Certificates By RegNo Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get certificates by registration number'
    };
  }
}

/**
 * Format blockchain timestamp to readable date
 */
export function formatTimestamp(timestamp) {
  return new Date(timestamp * 1000).toLocaleString();
}

/**
 * Shorten Ethereum address for display
 */
export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Get Sepolia Etherscan link for transaction
 */
export function getEtherscanLink(txHash) {
  return `https://sepolia.etherscan.io/tx/${txHash}`;
}

/**
 * Get Sepolia Etherscan link for address
 */
export function getAddressLink(address) {
  return `https://sepolia.etherscan.io/address/${address}`;
}

/**
 * Get the current certificate counter from blockchain (read-only)
 * This shows how many certificates have been issued so far
 * @returns {Promise<{success: boolean, count?: number, error?: string}>}
 */
export async function getCurrentCounter() {
  try {
    console.log('📊 Fetching certificate counter...');
    
    const contract = await getReadOnlyContract();
    const counter = await contract.getCurrentCounter();
    
    console.log(`✅ Certificate counter: ${Number(counter)}`);

    return {
      success: true,
      count: Number(counter)
    };

  } catch (error) {
    console.error('❌ Get Current Counter Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get certificate counter'
    };
  }
}
