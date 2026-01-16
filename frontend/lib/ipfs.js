/**
 * IPFS Utility Functions
 * Frontend utilities for retrieving and viewing certificates from IPFS
 * Note: All IPFS uploads are handled by the backend for security
 */

/**
 * IPFS Gateway URLs with fallback support
 * Multiple gateways to avoid rate limiting (429 errors)
 */
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://w3s.link/ipfs/',
  'https://nftstorage.link/ipfs/',
];

/**
 * Get the full IPFS gateway URL for a hash
 * @param {string} ipfsHash - The IPFS hash (CID)
 * @param {number} gatewayIndex - Which gateway to use (for fallback)
 * @returns {string} Full gateway URL
 */
export function getIPFSUrl(ipfsHash, gatewayIndex = 0) {
  if (!ipfsHash) return '';
  
  // Remove ipfs:// prefix if present
  const hash = ipfsHash.replace('ipfs://', '');
  
  // Use the specified gateway or default to first one
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length];
  
  return `${gateway}${hash}`;
}

/**
 * Get all possible IPFS URLs for a hash (all gateways)
 * @param {string} ipfsHash - The IPFS hash (CID)
 * @returns {string[]} Array of gateway URLs
 */
export function getAllIPFSUrls(ipfsHash) {
  if (!ipfsHash) return [];
  
  const hash = ipfsHash.replace('ipfs://', '');
  return IPFS_GATEWAYS.map(gateway => `${gateway}${hash}`);
}


