# Backend-Centric Blockchain Architecture - Migration Guide

## Overview

This project has been refactored to move all blockchain operations from the frontend to the backend. Users no longer need to connect MetaMask or have a wallet to issue certificates. All blockchain transactions are now signed using a private key stored securely in the backend.

## Changes Made

### 1. Backend Changes

#### New Files Created:
- **`backend/src/services/blockchain.service.js`** - Handles all blockchain interactions using ethers.js with a private key
- **`backend/src/controller/certificate/issueCertificate.js`** - Unified controller for certificate issuance

#### Updated Files:
- **`backend/src/routes/certificate.routes.js`** - Added new unified endpoints
- **`backend/src/middleware/multer.js`** - Added support for multiple file uploads
- **`backend/.env.example`** - Added blockchain configuration variables
- **`backend/package.json`** - Added ethers.js dependency

#### New Dependencies:
```bash
npm install ethers@^6.13.0
```

#### New Environment Variables (backend/.env):
```env
# Blockchain Configuration
CONTRACT_ADDRESS=0xYourContractAddressHere
PRIVATE_KEY=your_private_key_here_without_0x
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_API_KEY
CHAIN_ID=11155111
```

### 2. Frontend Changes

#### New Files Created:
- **`frontend/lib/certificate-api.js`** - Helper functions to call backend API for certificate operations

#### Updated Files:
- **`frontend/lib/web3.js`** - Simplified to only handle read-only operations (verification)
- **`frontend/app/create/page.js`** - Removed wallet connection logic, updated to use backend API

#### Removed Features:
- MetaMask wallet connection
- Frontend transaction signing
- Direct blockchain interaction from browser
- IPFS upload handling in frontend

### 3. New API Endpoints

#### Single Certificate Issuance
**Endpoint:** `POST /api/certificate/issue-certificate`

**Request (multipart/form-data):**
```javascript
{
  file: <certificate image file>,
  studentName: "John Doe",
  email: "john@example.com",
  sendEmail: "true"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "certificateId": 1001,
    "studentName": "John Doe",
    "ipfsHash": "QmXxxx...",
    "transactionHash": "0xxxx...",
    "issuerAddress": "0xxxx...",
    "emailSent": true,
    "pinataUrl": "https://gateway.pinata.cloud/ipfs/QmXxxx..."
  },
  "message": "Certificate issued successfully"
}
```

#### Bulk Certificate Issuance
**Endpoint:** `POST /api/certificate/bulk-issue-certificates`

**Request (multipart/form-data):**
```javascript
{
  files: [<file1>, <file2>, ...],
  studentNames: ["John Doe", "Jane Smith", ...],
  emails: ["john@example.com", "jane@example.com", ...],
  sendEmail: "true"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 2,
    "transactionHash": "0xxxx...",
    "issuerAddress": "0xxxx...",
    "certificates": [
      {
        "studentName": "John Doe",
        "certificateId": 1001,
        "ipfsHash": "QmXxxx...",
        "pinataUrl": "...",
        "email": "john@example.com",
        "emailSent": true
      },
      ...
    ]
  },
  "message": "Successfully issued 2 certificates"
}
```

#### Get Certificate
**Endpoint:** `GET /api/certificate/get-certificate/:certificateId`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "studentName": "John Doe",
    "ipfsHash": "QmXxxx...",
    "issuer": "0xxxx...",
    "timestamp": 1705420800,
    "exists": true
  },
  "message": "Certificate retrieved successfully"
}
```

#### Verify Certificate
**Endpoint:** `GET /api/certificate/verify-certificate/:certificateId`

**Response:**
```json
{
  "success": true,
  "data": {
    "exists": true
  },
  "message": "Certificate verified"
}
```

## Setup Instructions

### 1. Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Configure blockchain settings in `.env`:
```env
# Deploy your CertificateRegistry.sol contract and get the address
CONTRACT_ADDRESS=0xYourDeployedContractAddress

# Export private key from MetaMask (without 0x prefix)
# IMPORTANT: Use a dedicated wallet for this, not your main wallet
PRIVATE_KEY=your_private_key_here

# Get RPC URL from Infura, Alchemy, or use public RPC
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_API_KEY

# Chain ID (11155111 for Sepolia testnet)
CHAIN_ID=11155111
```

5. Start the backend server:
```bash
npm run dev
```

### 2. Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Update `.env.local` with backend URL:
```env
# If changed from default
NEXT_PUBLIC_API_BASE_URL=http://localhost:5500

# Optional: For direct blockchain reads (verification)
NEXT_PUBLIC_CONTRACT_ADDRESS=0xYourContractAddress
NEXT_PUBLIC_BLOCKCHAIN_RPC_URL=https://rpc.sepolia.org
```

4. Start the frontend:
```bash
npm run dev
```

## Security Considerations

### Private Key Management

**CRITICAL SECURITY NOTES:**

1. **Never commit private keys to version control**
   - Add `.env` to `.gitignore`
   - Use environment variables in production

2. **Use a dedicated wallet**
   - Create a new wallet specifically for issuing certificates
   - Fund it with only the amount of ETH needed for transactions
   - Never use your main wallet

3. **Production Deployment**
   - Use environment variable management systems (AWS Secrets Manager, Azure Key Vault, etc.)
   - Rotate keys periodically
   - Monitor wallet balance and transaction activity
   - Set up alerts for unusual activity

4. **Access Control**
   - Implement authentication/authorization in backend
   - Rate limiting on certificate issuance endpoints
   - Logging and audit trails

### Recommended Production Setup

```javascript
// backend/src/services/blockchain.service.js
// Add authentication check before issuing certificates

export async function issueCertificateOnBlockchain(studentName, ipfsHash, requestingUser) {
  // Verify user has permission to issue certificates
  if (!requestingUser || !requestingUser.canIssueCertificates) {
    throw new Error('Unauthorized to issue certificates');
  }
  
  // ... rest of implementation
}
```

## Migration Benefits

### Before (Frontend-Centric):
- ❌ Users need MetaMask installed
- ❌ Users need ETH in their wallet for gas fees
- ❌ Complex wallet connection flow
- ❌ Browser-specific blockchain interactions
- ❌ Users need blockchain knowledge
- ❌ Separate steps: Upload IPFS → Issue blockchain → Send email

### After (Backend-Centric):
- ✅ No wallet needed for users
- ✅ No gas fees for users
- ✅ Simple API calls
- ✅ Works on any device/browser
- ✅ User-friendly experience
- ✅ Single API call handles everything
- ✅ Centralized transaction management
- ✅ Better error handling and retry logic

## Testing

### Test Single Certificate Issuance

Using cURL:
```bash
curl -X POST http://localhost:5500/api/certificate/issue-certificate \
  -F "file=@certificate.png" \
  -F "studentName=John Doe" \
  -F "email=john@example.com" \
  -F "sendEmail=true"
```

### Test Bulk Certificate Issuance

```bash
curl -X POST http://localhost:5500/api/certificate/bulk-issue-certificates \
  -F "files=@cert1.png" \
  -F "files=@cert2.png" \
  -F 'studentNames=["John Doe", "Jane Smith"]' \
  -F 'emails=["john@example.com", "jane@example.com"]' \
  -F "sendEmail=true"
```

## Troubleshooting

### Common Issues

1. **"CONTRACT_ADDRESS not configured"**
   - Ensure `CONTRACT_ADDRESS` is set in backend `.env`
   - Deploy the smart contract first

2. **"PRIVATE_KEY not configured"**
   - Add private key to backend `.env` (without 0x prefix)
   - Ensure wallet has ETH for gas fees

3. **"Insufficient funds for gas"**
   - Fund the wallet with Sepolia ETH (use faucets)
   - Check wallet balance

4. **Transaction fails**
   - Check RPC URL is correct and accessible
   - Verify contract address is correct
   - Ensure wallet has permissions to call contract functions

5. **Frontend shows old wallet connection UI**
   - Clear browser cache
   - Rebuild frontend: `npm run build`

## Next Steps

1. **Deploy Smart Contract** (if not already deployed)
   - Use Hardhat or Remix to deploy `CertificateRegistry.sol`
   - Fund the deployer wallet with Sepolia ETH
   - Update `CONTRACT_ADDRESS` in backend `.env`

2. **Configure Production Environment**
   - Set up secure key management
   - Configure proper authentication
   - Set up monitoring and alerts
   - Configure rate limiting

3. **Test Thoroughly**
   - Test single certificate issuance
   - Test bulk issuance
   - Test email notifications
   - Test error scenarios

## Support

For issues or questions:
1. Check the logs in backend terminal
2. Verify all environment variables are set correctly
3. Ensure smart contract is deployed and accessible
4. Check wallet has sufficient funds

---

**Migration completed successfully! The blockchain logic is now fully managed by the backend.**
