# Admin Management & Certificate Issuance API Documentation

## Overview

This document describes the backend API endpoints for managing admins and issuing certificates with the updated smart contract that includes registration numbers and issuer usernames.

---

## Admin Management Endpoints

Base URL: `/api/admin`

### 1. Add Admin

**Endpoint:** `POST /api/admin/add`

**Description:** Adds a new admin to the smart contract. Only existing admins can call this.

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "adminAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "transactionHash": "0xabc123...",
    "blockNumber": 12345678,
    "addedBy": "0xYourWalletAddress...",
    "gasUsed": "45000"
  },
  "message": "Admin added successfully",
  "success": true
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Address is already an admin",
  "success": false
}
```

---

### 2. Remove Admin

**Endpoint:** `POST /api/admin/remove`

**Description:** Removes an admin from the smart contract. Any admin can remove other admins (but not themselves).

**Request Body:**
```json
{
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "adminAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "transactionHash": "0xdef456...",
    "blockNumber": 12345679,
    "removedBy": "0xYourWalletAddress...",
    "gasUsed": "35000"
  },
  "message": "Admin removed successfully",
  "success": true
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Cannot remove yourself as admin",
  "success": false
}
```

---

### 3. Check Admin Status

**Endpoint:** `GET /api/admin/check/:address`

**Description:** Checks if a given address has admin privileges. Public endpoint.

**Parameters:**
- `address` (path parameter): Ethereum address to check

**Example:** `GET /api/admin/check/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "isAdmin": true
  },
  "message": "Admin status retrieved",
  "success": true
}
```

---

### 4. Get Current Wallet Status

**Endpoint:** `GET /api/admin/current-status`

**Description:** Gets the admin status of the current backend wallet (from PRIVATE_KEY env variable).

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "walletAddress": "0xYourBackendWallet...",
    "isAdmin": true
  },
  "message": "Current wallet status retrieved",
  "success": true
}
```

---

### 5. Get Deployment Info

**Endpoint:** `GET /api/admin/deployment-info`

**Description:** Gets information about who deployed the contract and if they still have admin rights.

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "deployerAddress": "0xOriginalDeployer...",
    "isDeployerStillAdmin": true
  },
  "message": "Deployment info retrieved",
  "success": true
}
```

---

## Certificate Issuance Endpoints

Base URL: `/api/certificate`

### 1. Issue Single Certificate

**Endpoint:** `POST /api/certificate/issue`

**Description:** Issue a single certificate with student details.

**Content-Type:** `multipart/form-data`

**Form Fields:**
```
studentName: "John Doe"
regNo: "21BCE1234"
issuerUsername: "VIT AP"
email: "john@example.com" (optional if sendEmail is false)
sendEmail: "true" or "false"
file: [certificate image file]
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "certificateId": 1001,
    "studentName": "John Doe",
    "ipfsHash": "QmXYZ123...",
    "transactionHash": "0xabc123...",
    "issuerAddress": "0xYourWallet...",
    "emailSent": true,
    "pinataUrl": "https://gateway.pinata.cloud/ipfs/QmXYZ123..."
  },
  "message": "Certificate issued successfully",
  "success": true
}
```

**Error Responses:**

**400 - Missing Field:**
```json
{
  "statusCode": 400,
  "message": "Registration number is required",
  "success": false
}
```

**400 - No File:**
```json
{
  "statusCode": 400,
  "message": "No certificate file provided",
  "success": false
}
```

---

### 2. Bulk Issue Certificates

**Endpoint:** `POST /api/certificate/bulk-issue`

**Description:** Issue multiple certificates in a single blockchain transaction.

**Content-Type:** `multipart/form-data`

**Form Fields:**
```
studentNames: '["John Doe", "Jane Smith", "Bob Wilson"]' (JSON array as string)
regNos: '["21BCE1001", "21BCE1002", "21BCE1003"]' (JSON array as string)
emails: '["john@ex.com", "jane@ex.com", "bob@ex.com"]' (JSON array as string, optional)
issuerUsername: "VIT AP"
sendEmail: "true" or "false"
files: [multiple certificate image files]
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "count": 3,
    "transactionHash": "0xabc123...",
    "issuerAddress": "0xYourWallet...",
    "certificates": [
      {
        "studentName": "John Doe",
        "regNo": "21BCE1001",
        "certificateId": 1001,
        "ipfsHash": "QmXYZ1...",
        "pinataUrl": "https://gateway.pinata.cloud/ipfs/QmXYZ1...",
        "email": "john@ex.com",
        "emailSent": true
      },
      {
        "studentName": "Jane Smith",
        "regNo": "21BCE1002",
        "certificateId": 1002,
        "ipfsHash": "QmXYZ2...",
        "pinataUrl": "https://gateway.pinata.cloud/ipfs/QmXYZ2...",
        "email": "jane@ex.com",
        "emailSent": true
      },
      {
        "studentName": "Bob Wilson",
        "regNo": "21BCE1003",
        "certificateId": 1003,
        "ipfsHash": "QmXYZ3...",
        "pinataUrl": "https://gateway.pinata.cloud/ipfs/QmXYZ3...",
        "email": "bob@ex.com",
        "emailSent": false,
        "emailError": "Invalid email address"
      }
    ],
    "emailStats": {
      "total": 3,
      "sent": 2,
      "failed": 1
    }
  },
  "message": "Successfully issued 3 certificates",
  "success": true
}
```

**Error Response (400):**
```json
{
  "statusCode": 400,
  "message": "Number of reg nos must match number of student names",
  "success": false
}
```

---

### 3. Get Certificate

**Endpoint:** `GET /api/certificate/:certificateId`

**Description:** Retrieve certificate details from blockchain.

**Example:** `GET /api/certificate/1001`

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "id": 1001,
    "studentName": "John Doe",
    "regNo": "21BCE1234",
    "ipfsHash": "QmXYZ123...",
    "issuerUsername": "VIT AP",
    "issuerAddress": "0xIssuerWallet...",
    "timestamp": 1705603200,
    "exists": true
  },
  "message": "Certificate retrieved successfully",
  "success": true
}
```

---

### 4. Verify Certificate

**Endpoint:** `GET /api/certificate/verify/:certificateId`

**Description:** Verify if a certificate exists on blockchain.

**Example:** `GET /api/certificate/verify/1001`

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "exists": true
  },
  "message": "Certificate verified",
  "success": true
}
```

---

### 5. Get Certificates by Registration Number

**Endpoint:** `GET /api/certificate/regno/:regNo`

**Description:** Get all certificates for a specific registration number.

**Example:** `GET /api/certificate/regno/21BCE1234`

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "regNo": "21BCE1234",
    "certificateIds": [1001, 1005, 1023],
    "count": 3
  },
  "message": "Found 3 certificates for registration number 21BCE1234",
  "success": true
}
```

---

### 6. Get Certificates by Issuer Name

**Endpoint:** `GET /api/certificate/issuer/:issuerName`

**Description:** Get all certificates issued by a specific organization name.

**Example:** `GET /api/certificate/issuer/VIT%20AP`

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "issuerName": "VIT AP",
    "certificateIds": [1001, 1002, 1003, 1004],
    "count": 4
  },
  "message": "Found 4 certificates issued by VIT AP",
  "success": true
}
```

---

### 7. Get Certificates by Issuer Address

**Endpoint:** `GET /api/certificate/issuer-address/:address`

**Description:** Get all certificates issued by a specific wallet address.

**Example:** `GET /api/certificate/issuer-address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb`

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "issuerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "certificateIds": [1001, 1002, 1003],
    "count": 3
  },
  "message": "Found 3 certificates issued by address 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "success": true
}
```

---

### 8. Get All Certificates

**Endpoint:** `GET /api/certificate/all`

**Description:** Get all certificate IDs issued till date.

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "certificateIds": [1001, 1002, 1003, 1004, 1005],
    "totalCount": 5
  },
  "message": "Found 5 certificates total",
  "success": true
}
```

---

### 9. Get Certificates Batch

**Endpoint:** `POST /api/certificate/batch`

**Description:** Get detailed information for multiple certificates at once.

**Request Body:**
```json
{
  "certificateIds": [1001, 1002, 1003]
}
```

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "certificates": [
      {
        "id": 1001,
        "studentName": "John Doe",
        "regNo": "21BCE1234",
        "ipfsHash": "QmXYZ1...",
        "issuerUsername": "VIT AP",
        "issuerAddress": "0xIssuer1...",
        "timestamp": 1705603200,
        "exists": true
      },
      {
        "id": 1002,
        "studentName": "Jane Smith",
        "regNo": "21BCE1235",
        "ipfsHash": "QmXYZ2...",
        "issuerUsername": "VIT AP",
        "issuerAddress": "0xIssuer1...",
        "timestamp": 1705603300,
        "exists": true
      }
    ],
    "count": 2
  },
  "message": "Retrieved 2 certificates",
  "success": true
}
```

---

### 10. Get Certificate Statistics

**Endpoint:** `GET /api/certificate/stats`

**Description:** Get certificate statistics including current counter and total count.

**Success Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "currentCounter": 1005,
    "totalCertificates": 5,
    "nextCertificateId": 1006
  },
  "message": "Certificate statistics retrieved successfully",
  "success": true
}
```

---

## Environment Variables Required

### Backend Service Configuration

```env
# Contract Configuration
CONTRACT_ADDRESS=0xYourContractAddress
PRIVATE_KEY=0xYourPrivateKey

# RPC Configuration
BLOCKCHAIN_RPC_URL=https://sepolia.infura.io/v3/your-project-id
RPC_URL=https://sepolia.infura.io/v3/your-project-id
CHAIN_ID=11155111

# IPFS Configuration (Pinata)
PINATA_JWT=your-pinata-jwt-token

# Email Configuration (Zoho)
ZOHO_EMAIL_USER=admin@yourdomain.com
ZOHO_EMAIL_PASS=your-zoho-app-password

# Application
BASE_URL=http://localhost:3000
PORT=5500
```

---

## Usage Examples

### Using cURL

#### Add Admin
```bash
curl -X POST http://localhost:5500/api/admin/add \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

#### Remove Admin
```bash
curl -X POST http://localhost:5500/api/admin/remove \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"}'
```

#### Check Admin Status
```bash
curl http://localhost:5500/api/admin/check/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

#### Get Certificates by Registration Number
```bash
curl http://localhost:5500/api/certificate/regno/21BCE1234
```

#### Get Certificates by Issuer Name
```bash
curl http://localhost:5500/api/certificate/issuer/VIT%20AP
```

#### Get Certificates by Issuer Address
```bash
curl http://localhost:5500/api/certificate/issuer-address/0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb
```

#### Get All Certificates
```bash
curl http://localhost:5500/api/certificate/all
```

#### Get Certificate Statistics
```bash
curl http://localhost:5500/api/certificate/stats
```

#### Get Certificates Batch
```bash
curl -X POST http://localhost:5500/api/certificate/batch \
  -H "Content-Type: application/json" \
  -d '{"certificateIds": [1001, 1002, 1003]}'
```

#### Bulk Issue Certificates
```bash
curl -X POST http://localhost:5500/api/certificate/bulk-issue \
  -F 'studentNames=["John Doe","Jane Smith"]' \
  -F 'regNos=["21BCE1001","21BCE1002"]' \
  -F 'emails=["john@ex.com","jane@ex.com"]' \
  -F "issuerUsername=VIT AP" \
  -F "sendEmail=true" \
  -F "files=@cert1.png" \
  -F "files=@cert2.png"
```

---

### Using JavaScript (Frontend)

#### Add Admin
```javascript
const addAdmin = async (address) => {
  const response = await fetch('http://localhost:5500/api/admin/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ address }),
  });
  
  const data = await response.json();
  console.log(data);
};

await addAdmin('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
```

#### Get Certificates by Registration Number
```javascript
const getCertificatesByRegNo = async (regNo) => {
  const response = await fetch(`http://localhost:5500/api/certificate/regno/${regNo}`);
  const data = await response.json();
  console.log(data);
};

await getCertificatesByRegNo('21BCE1234');
// Returns: { regNo: "21BCE1234", certificateIds: [1001, 1005], count: 2 }
```

#### Get Certificates by Issuer Name
```javascript
const getCertificatesByIssuer = async (issuerName) => {
  const response = await fetch(`http://localhost:5500/api/certificate/issuer/${encodeURIComponent(issuerName)}`);
  const data = await response.json();
  console.log(data);
};

await getCertificatesByIssuer('VIT AP');
// Returns: { issuerName: "VIT AP", certificateIds: [1001, 1002, 1003], count: 3 }
```

#### Get All Certificates
```javascript
const getAllCertificates = async () => {
  const response = await fetch('http://localhost:5500/api/certificate/all');
  const data = await response.json();
  console.log(data);
};

await getAllCertificates();
// Returns: { certificateIds: [1001, 1002, 1003, 1004, 1005], totalCount: 5 }
```

#### Get Certificate Statistics
```javascript
const getCertificateStats = async () => {
  const response = await fetch('http://localhost:5500/api/certificate/stats');
  const data = await response.json();
  console.log(data);
};

await getCertificateStats();
// Returns: { currentCounter: 1005, totalCertificates: 5, nextCertificateId: 1006 }
```

#### Get Certificates Batch
```javascript
const getCertificatesBatch = async (certificateIds) => {
  const response = await fetch('http://localhost:5500/api/certificate/batch', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ certificateIds }),
  });
  
  const data = await response.json();
  console.log(data);
};

await getCertificatesBatch([1001, 1002, 1003]);
// Returns: { certificates: [...], count: 3 }
```

#### Bulk Issue Certificates
```javascript
const bulkIssueCertificates = async () => {
  const formData = new FormData();
  
  formData.append('studentNames', JSON.stringify(['John Doe', 'Jane Smith']));
  formData.append('regNos', JSON.stringify(['21BCE1001', '21BCE1002']));
  formData.append('emails', JSON.stringify(['john@ex.com', 'jane@ex.com']));
  formData.append('issuerUsername', 'VIT AP');
  formData.append('sendEmail', 'true');
  
  // Append multiple files
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch('http://localhost:5500/api/certificate/bulk-issue', {
    method: 'POST',
    body: formData,
  });
  
  const result = await response.json();
  console.log(result);
};
```

---

## Error Codes Reference

| Status Code | Meaning |
|-------------|---------|
| 200 | Success |
| 400 | Bad Request - Invalid input or validation error |
| 404 | Not Found - Certificate doesn't exist |
| 500 | Internal Server Error - Backend or blockchain error |

---

## Important Notes

### Admin Management
1. **Only admins can add/remove admins** - The backend wallet (from PRIVATE_KEY) must be an admin
2. **Cannot remove yourself** - Self-removal is blocked to prevent lockout
3. **Any admin can remove any other admin** - Including the original deployer
4. **Transaction costs gas** - Adding/removing admins requires ETH for gas fees

### Certificate Issuance
1. **New required fields**: `regNo` and `issuerUsername` must be provided
2. **Bulk issuance limit**: Maximum 100 certificates per transaction
3. **Email is optional**: Set `sendEmail: false` to skip email sending
4. **IPFS upload happens first**: Files are uploaded to IPFS before blockchain
5. **All or nothing**: If blockchain fails, the entire operation fails

### Email System
- Emails are sent with rate limiting (configurable in email.config.js)
- Individual email failures don't fail the entire bulk operation
- Email status is included in the response for each certificate

---

## Testing Checklist

- [ ] Add admin successfully
- [ ] Remove admin successfully
- [ ] Cannot remove self
- [ ] Check admin status
- [ ] Issue single certificate with regNo and issuerUsername
- [ ] Issue bulk certificates with all new fields
- [ ] Verify certificate exists
- [ ] Get certificate details including regNo and issuerUsername- [ ] Get certificates by registration number
- [ ] Get certificates by issuer name
- [ ] Get certificates by issuer address
- [ ] Get all certificates
- [ ] Get certificates batch
- [ ] Get certificate statistics- [ ] Email sending works (if enabled)
- [ ] Bulk email sending with rate limiting

---

**Last Updated:** January 2026
