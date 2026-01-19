/**
 * Blockchain Service
 * Handles all blockchain interactions with the CertificateRegistry smart contract
 * Uses a private key from environment variables to sign transactions
 */

import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

// Contract ABI - UPDATED to match CertificateRegistry.sol
const CONTRACT_ABI = [
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
        "internalType": "address",
        "name": "newAdmin",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "addedBy",
        "type": "address"
      }
    ],
    "name": "AdminAdded",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "removedAdmin",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "removedBy",
        "type": "address"
      }
    ],
    "name": "AdminRemoved",
    "type": "event"
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
        "name": "regNo",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsHash",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "issuerUsername",
        "type": "string"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "issuerAddress",
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
        "internalType": "address",
        "name": "_newAdmin",
        "type": "address"
      }
    ],
    "name": "addAdmin",
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
    "name": "admins",
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
        "internalType": "string[]",
        "name": "_studentNames",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "_regNos",
        "type": "string[]"
      },
      {
        "internalType": "string[]",
        "name": "_ipfsHashes",
        "type": "string[]"
      },
      {
        "internalType": "string",
        "name": "_issuerUsername",
        "type": "string"
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
    "inputs": [],
    "name": "deployer",
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
    "inputs": [],
    "name": "getAllCertificates",
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
        "internalType": "uint256[]",
        "name": "_certificateIds",
        "type": "uint256[]"
      }
    ],
    "name": "getCertificatesBatch",
    "outputs": [
      {
        "components": [
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
        "internalType": "struct CertificateRegistry.Certificate[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_issuerAddress",
        "type": "address"
      }
    ],
    "name": "getCertificatesByIssuerAddress",
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
        "internalType": "string",
        "name": "_issuerUsername",
        "type": "string"
      }
    ],
    "name": "getCertificatesByIssuerName",
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
    "inputs": [],
    "name": "getDeploymentInfo",
    "outputs": [
      {
        "internalType": "address",
        "name": "deployerAddress",
        "type": "address"
      },
      {
        "internalType": "bool",
        "name": "isDeployerStillAdmin",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getTotalCertificatesIssued",
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
        "name": "_address",
        "type": "address"
      }
    ],
    "name": "isAdmin",
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
        "internalType": "string",
        "name": "_studentName",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_regNo",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_ipfsHash",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "_issuerUsername",
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
    "inputs": [
      {
        "internalType": "address",
        "name": "_admin",
        "type": "address"
      }
    ],
    "name": "removeAdmin",
    "outputs": [],
    "stateMutability": "nonpayable",
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
 * @param {string} regNo - Registration number of the student
 * @param {string} ipfsHash - IPFS hash of the certificate image
 * @param {string} issuerUsername - Name of the issuing organization (e.g., "VIT AP")
 * @returns {Promise<{success: boolean, certificateId?: number, transactionHash?: string, issuerAddress?: string, error?: string}>}
 */
export async function issueCertificateOnBlockchain(studentName, regNo, ipfsHash, issuerUsername) {
  try {
    if (!studentName || !regNo || !ipfsHash || !issuerUsername) {
      throw new Error('Student name, reg no, IPFS hash, and issuer username are required');
    }

    const { wallet } = getProviderAndWallet();
    const contract = getContract(wallet);
    const issuerAddress = wallet.address;

    console.log('Issuing certificate on blockchain...');
    console.log('Student:', studentName);
    console.log('Reg No:', regNo);
    console.log('IPFS Hash:', ipfsHash);
    console.log('Issuer Username:', issuerUsername);
    console.log('Issuer Address:', issuerAddress);

    // Call the smart contract function with new parameters
    const tx = await contract.issueCertificate(studentName, regNo, ipfsHash, issuerUsername);
    
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
 * @param {string[]} regNos - Array of registration numbers
 * @param {string[]} ipfsHashes - Array of IPFS hashes for each certificate
 * @param {string} issuerUsername - Name of the issuing organization (same for all certificates)
 * @returns {Promise<{success: boolean, certificateIds?: number[], transactionHash?: string, issuerAddress?: string, error?: string}>}
 */
export async function bulkIssueCertificatesOnBlockchain(studentNames, regNos, ipfsHashes, issuerUsername) {
  try {
    if (!studentNames || !regNos || !ipfsHashes || !issuerUsername) {
      throw new Error('Student names, reg nos, IPFS hashes, and issuer username are required');
    }

    if (studentNames.length !== regNos.length || studentNames.length !== ipfsHashes.length) {
      throw new Error('Student names, reg nos, and IPFS hashes must be arrays of equal length');
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
    console.log('Issuer Username:', issuerUsername);
    console.log('Issuer Address:', issuerAddress);

    // Call the smart contract function with new parameters
    const tx = await contract.bulkIssueCertificates(studentNames, regNos, ipfsHashes, issuerUsername);
    
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
        regNo: result.regNo,
        ipfsHash: result.ipfsHash,
        issuerUsername: result.issuerUsername,
        issuerAddress: result.issuerAddress,
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

/**
 * Get all certificates for a specific registration number
 * @param {string} regNo - Registration number to search for
 * @returns {Promise<{success: boolean, certificateIds?: number[], error?: string}>}
 */
export async function getCertificatesByRegNoFromBlockchain(regNo) {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const certificateIds = await contract.getCertificatesByRegNo(regNo);

    return {
      success: true,
      certificateIds: certificateIds.map(id => Number(id)),
    };

  } catch (error) {
    console.error('Get Certificates By Reg No Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificates by registration number',
    };
  }
}

/**
 * Get all certificates issued by a specific organization name
 * @param {string} issuerName - Name of the issuing organization
 * @returns {Promise<{success: boolean, certificateIds?: number[], error?: string}>}
 */
export async function getCertificatesByIssuerNameFromBlockchain(issuerName) {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const certificateIds = await contract.getCertificatesByIssuerName(issuerName);

    return {
      success: true,
      certificateIds: certificateIds.map(id => Number(id)),
    };

  } catch (error) {
    console.error('Get Certificates By Issuer Name Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificates by issuer name',
    };
  }
}

/**
 * Get all certificates issued by a specific wallet address
 * @param {string} issuerAddress - Address of the admin who issued certificates
 * @returns {Promise<{success: boolean, certificateIds?: number[], error?: string}>}
 */
export async function getCertificatesByIssuerAddressFromBlockchain(issuerAddress) {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const certificateIds = await contract.getCertificatesByIssuerAddress(issuerAddress);

    return {
      success: true,
      certificateIds: certificateIds.map(id => Number(id)),
    };

  } catch (error) {
    console.error('Get Certificates By Issuer Address Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificates by issuer address',
    };
  }
}

/**
 * Get all certificates issued till date
 * @returns {Promise<{success: boolean, certificateIds?: number[], error?: string}>}
 */
export async function getAllCertificatesFromBlockchain() {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const certificateIds = await contract.getAllCertificates();

    return {
      success: true,
      certificateIds: certificateIds.map(id => Number(id)),
    };

  } catch (error) {
    console.error('Get All Certificates Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve all certificates',
    };
  }
}

/**
 * Get detailed information for multiple certificates at once
 * @param {number[]} certificateIds - Array of certificate IDs to retrieve
 * @returns {Promise<{success: boolean, certificates?: object[], error?: string}>}
 */
export async function getCertificatesBatchFromBlockchain(certificateIds) {
  try {
    const { provider } = getProviderAndWallet();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const certificates = await contract.getCertificatesBatch(certificateIds);

    // Convert to readable format
    const formattedCertificates = certificates.map(cert => ({
      id: Number(cert.id),
      studentName: cert.studentName,
      regNo: cert.regNo,
      ipfsHash: cert.ipfsHash,
      issuerUsername: cert.issuerUsername,
      issuerAddress: cert.issuerAddress,
      timestamp: Number(cert.timestamp),
      exists: cert.exists,
    }));

    return {
      success: true,
      certificates: formattedCertificates,
    };

  } catch (error) {
    console.error('Get Certificates Batch Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to retrieve certificate batch',
    };
  }
}

/**
 * Get total certificates count from contract
 */
export async function getTotalCertificatesCount() {
  try {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const count = await contract.getTotalCertificatesIssued();
    return {
      success: true,
      count: Number(count)
    };
  } catch (error) {
    console.error('Error fetching certificates count:', error);
    return {
      success: false,
      count: 0,
      error: error.message
    };
  }
}

/**
 * Get contract address
 */
export function getContractAddress() {
  return CONTRACT_ADDRESS;
}
