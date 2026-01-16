/**
 * Blockchain Service
 * Handles all blockchain interactions with the CertificateRegistry smart contract
 * Uses a private key from environment variables to sign transactions
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract ABI - Same as in frontend
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "authorizeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string[]",
        "name": "_studentNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "_ipfsHashes",
        "type": "string[]"
      }
    ],
    "name": "bulkIssueCertificates",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "certificateId",
        "type": "uint256"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "studentName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "CertificateIssued",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "_studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ipfsHash",
        "type": "string"
      }
    ],
    "name": "issueCertificate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "IssuerAuthorized",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuer",
        "type": "address"
      }
    ],
    "name": "IssuerRevoked",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "revokeIssuer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "authorizedIssuers",
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
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "certificates",
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
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "issuer",
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
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "internalType": "address",
        "name": "issuer",
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
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "getCertificatesByIssuer",
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
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuer",
        "type": "address"
      }
    ],
    "name": "isAuthorized",
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
    "inputs": [],
    "name": "owner",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
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
  }
];

// Configuration from environment variables
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
console.log(CONTRACT_ADDRESS);
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_URL = process.env.BLOCKCHAIN_RPC_URL || 'https://sepolia.infura.io/v3/';
const CHAIN_ID = parseInt(process.env.CHAIN_ID || '11155111'); // Sepolia by default

/**
 * Get provider and wallet for blockchain interactions
 */
function getProviderAndWallet() {
  if (!CONTRACT_ADDRESS) {
    throw new Error('CONTRACT_ADDRESS not configured in environment variables');
  }
  
  if (!PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not configured in environment variables');
  }

  // Create provider
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Create wallet from private key
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  return { provider, wallet };
}

/**
 * Get contract instance
 */
function getContract(wallet) {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
}

/**
 * Issue a single certificate on the blockchain
 * @param {string} studentName - Name of the student
 * @param {string} ipfsHash - IPFS hash of the certificate image
 * @returns {Promise<{success: boolean, certificateId?: number, transactionHash?: string, issuerAddress?: string, error?: string}>}
 */
export async function issueCertificateOnBlockchain(studentName, ipfsHash) {
  try {
    if (!studentName || !ipfsHash) {
      throw new Error('Student name and IPFS hash are required');
    }

    const { wallet } = getProviderAndWallet();
    const contract = getContract(wallet);
    const issuerAddress = wallet.address;

    console.log('Issuing certificate on blockchain...');
    console.log('Student:', studentName);
    console.log('IPFS Hash:', ipfsHash);
    console.log('Issuer Address:', issuerAddress);

    // Call the smart contract function
    const tx = await contract.issueCertificate(studentName, ipfsHash);
    
    console.log('Transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log('Transaction mined in block:', receipt.blockNumber);

    // Extract certificate ID from event logs
    let certificateId;
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'CertificateIssued') {
          certificateId = Number(parsedLog.args.certificateId);
          break;
        }
      } catch (e) {
        // Skip logs that don't match our contract
        continue;
      }
    }

    return {
      success: true,
      certificateId,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      issuerAddress,
    };

  } catch (error) {
    console.error('Issue Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to issue certificate on blockchain',
    };
  }
}

/**
 * Issue multiple certificates in a single transaction (bulk issuance)
 * @param {string[]} studentNames - Array of student names
 * @param {string[]} ipfsHashes - Array of IPFS hashes for each certificate
 * @returns {Promise<{success: boolean, certificateIds?: number[], transactionHash?: string, issuerAddress?: string, error?: string}>}
 */
export async function bulkIssueCertificatesOnBlockchain(studentNames, ipfsHashes) {
  try {
    if (!studentNames || !ipfsHashes || studentNames.length !== ipfsHashes.length) {
      throw new Error('Student names and IPFS hashes must be arrays of equal length');
    }

    if (studentNames.length === 0) {
      throw new Error('At least one certificate is required');
    }

    if (studentNames.length > 100) {
      throw new Error('Cannot issue more than 100 certificates at once');
    }

    const { wallet } = getProviderAndWallet();
    const contract = getContract(wallet);
    const issuerAddress = wallet.address;

    console.log(`Issuing ${studentNames.length} certificates in bulk...`);
    console.log('Issuer Address:', issuerAddress);

    // Call the smart contract function
    const tx = await contract.bulkIssueCertificates(studentNames, ipfsHashes);
    
    console.log('Bulk transaction sent:', tx.hash);
    
    // Wait for transaction to be mined
    const receipt = await tx.wait();
    
    console.log('Bulk transaction mined in block:', receipt.blockNumber);

    // Extract all certificate IDs from event logs
    const certificateIds = [];
    for (const log of receipt.logs) {
      try {
        const parsedLog = contract.interface.parseLog(log);
        if (parsedLog && parsedLog.name === 'CertificateIssued') {
          certificateIds.push(Number(parsedLog.args.certificateId));
        }
      } catch (e) {
        // Skip logs that don't match our contract
        continue;
      }
    }

    return {
      success: true,
      certificateIds,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      issuerAddress,
      count: certificateIds.length,
    };

  } catch (error) {
    console.error('Bulk Issue Certificates Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to issue certificates in bulk on blockchain',
    };
  }
}

/**
 * Get certificate details from blockchain
 * @param {number} certificateId - The certificate ID to look up
 * @returns {Promise<{success: boolean, certificate?: object, error?: string}>}
 */
export async function getCertificateFromBlockchain(certificateId) {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const result = await contract.getCertificate(certificateId);

    if (!result.exists) {
      return {
        success: false,
        error: 'Certificate not found',
      };
    }

    return {
      success: true,
      certificate: {
        id: Number(result.id),
        studentName: result.studentName,
        ipfsHash: result.ipfsHash,
        issuer: result.issuer,
        timestamp: Number(result.timestamp),
        exists: result.exists,
      },
    };

  } catch (error) {
    console.error('Get Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificate from blockchain',
    };
  }
}

/**
 * Verify if a certificate exists
 * @param {number} certificateId - The certificate ID to verify
 * @returns {Promise<{success: boolean, exists?: boolean, error?: string}>}
 */
export async function verifyCertificateOnBlockchain(certificateId) {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const exists = await contract.verifyCertificate(certificateId);

    return {
      success: true,
      exists,
    };

  } catch (error) {
    console.error('Verify Certificate Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to verify certificate',
    };
  }
}

/**
 * Get current certificate counter from blockchain
 * @returns {Promise<{success: boolean, counter?: number, error?: string}>}
 */
export async function getCurrentCounterFromBlockchain() {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const counter = await contract.getCurrentCounter();

    return {
      success: true,
      counter: Number(counter),
    };

  } catch (error) {
    console.error('Get Current Counter Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to get current counter',
    };
  }
}

/**
 * Get Sepolia Etherscan link for transaction
 */
export function getEtherscanLink(txHash) {
  const network = CHAIN_ID === 11155111 ? 'sepolia' : 'mainnet';
  return `https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/tx/${txHash}`;
}

/**
 * Get Sepolia Etherscan link for address
 */
export function getAddressLink(address) {
  const network = CHAIN_ID === 11155111 ? 'sepolia' : 'mainnet';
  return `https://${network === 'sepolia' ? 'sepolia.' : ''}etherscan.io/address/${address}`;
}

/**
 * Shorten Ethereum address for display
 */
export function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
