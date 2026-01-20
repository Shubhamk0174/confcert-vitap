# ConfCert Backend API Documentation

## Overview

ConfCert is a blockchain-based certificate management system built with Node.js, Express, Supabase, and Ethereum smart contracts. This API provides endpoints for user authentication, certificate issuance, retrieval, and admin management.

## Base URL
```
http://localhost:5000/api
```

## Authentication

The API uses JWT-based authentication. Include the access token in the Authorization header:
```
Authorization: Bearer <access_token>
```

### User Roles
- **student**: Can view their own certificates
- **club.admin**: Can issue certificates for their club
- **admin**: Full system access including user management

## API Endpoints

### Authentication Routes (`/auth`)

#### Register Student
```http
POST /auth/register/student
```

**Request Body:**
```json
{
  "email": "student.name.24bcc7026@vitapstudent.ac.in",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "message": "Registration successful. Please check your email to verify your account before logging in.",
    "user": {
      "id": "uuid",
      "username": "student_abc123_def",
      "email": "student.name.24bcc7026@vitapstudent.ac.in",
      "role": "student",
      "emailVerified": false
    }
  },
  "success": true
}
```

#### Login Student
```http
POST /auth/login/student
```

**Request Body:**
```json
{
  "username": "student.name.24bcc7026@vitapstudent.ac.in",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Login successful",
    "user": {
      "id": "uuid",
      "username": "student_abc123_def",
      "name": "Student Name",
      "role": "student",
      "currentRole": "student"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": 1638360000,
      "expires_in": 3600
    }
  },
  "success": true
}
```

#### Login Admin
```http
POST /auth/login/admin
```

**Request Body:**
```json
{
  "username": "admin_username",
  "password": "password123"
}
```

**Response (200):** Similar to student login but with admin role.

#### Login Club Admin
```http
POST /auth/login/club-admin
```

**Request Body:**
```json
{
  "username": "club_admin_username",
  "password": "password123"
}
```

**Response (200):** Similar to student login but with club.admin role.

#### Get User Data
```http
GET /auth/get-user-data
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "id": "uuid",
      "username": "student_abc123_def",
      "name": "Student Name",
      "email": "student.name.24bcc7026@vitapstudent.ac.in",
      "role": "student",
      "created_at": "2024-01-01T00:00:00Z"
    }
  },
  "success": true
}
```

### Certificate Routes (`/certificate`)

#### Issue Certificate
```http
POST /certificate/issue-certificate
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `studentName`: "John Doe"
- `regNo`: "24BCC7026"
- `email`: "john.doe@example.com" (optional, for email sending)
- `sendEmail`: "true" or "false"
- `file`: Certificate image file (PNG/JPEG/PDF)

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Certificate issued successfully",
    "certificate": {
      "certificateId": "123",
      "studentName": "John Doe",
      "regNo": "24BCC7026",
      "ipfsHash": "Qm...",
      "issuerUsername": "VIT-AP University",
      "issuerAddress": "0x...",
      "transactionHash": "0x...",
      "blockNumber": 12345678,
      "timestamp": 1638360000,
      "emailSent": true
    }
  },
  "success": true
}
```

#### Bulk Issue Certificates
```http
POST /certificate/bulk-issue-certificates
```

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
- `studentNames`: ["John Doe", "Jane Smith"]
- `regNos`: ["24BCC7026", "24BCC7027"]
- `emails`: ["john@example.com", "jane@example.com"] (optional)
- `sendEmails`: "true" or "false"
- `files`: Multiple certificate files

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Bulk certificate issuance completed",
    "results": [
      {
        "certificateId": "123",
        "studentName": "John Doe",
        "regNo": "24BCC7026",
        "ipfsHash": "Qm...",
        "transactionHash": "0x...",
        "emailSent": true
      }
    ],
    "summary": {
      "total": 2,
      "successful": 2,
      "failed": 0
    }
  },
  "success": true
}
```

#### Get Certificates by Registration Number
```http
GET /certificate/getcertificate/regno/:regNo
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "regNo": "24BCC7026",
    "certificateIds": ["123", "124"],
    "count": 2
  },
  "success": true,
  "message": "Found 2 certificates for registration number 24BCC7026"
}
```

#### Get User's Certificates
```http
GET /certificate/getcertificate-user
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "regNo": "24BCC7026",
    "certificateIds": ["123", "124"],
    "count": 2
  },
  "success": true,
  "message": "Found 2 certificates for registration number 24BCC7026"
}
```

#### Get Certificates by Issuer Name
```http
GET /certificate/getcertificate/issuer/:issuerName
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "issuerName": "VIT-AP University",
    "certificateIds": ["123", "124", "125"],
    "count": 3
  },
  "success": true
}
```

#### Get Certificates by Issuer Address
```http
GET /certificate/getcertificate/issuer-address/:address
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "issuerAddress": "0x123...",
    "certificateIds": ["123", "124"],
    "count": 2
  },
  "success": true
}
```

#### Get All Certificates
```http
GET /certificate/getcertificate/all
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "certificateIds": ["123", "124", "125", "126"],
    "count": 4
  },
  "success": true
}
```

#### Get Certificate Batch
```http
POST /certificate/getcertificate/batch
```

**Request Body:**
```json
{
  "certificateIds": ["123", "124"]
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "certificates": [
      {
        "certificateId": "123",
        "studentName": "John Doe",
        "regNo": "24BCC7026",
        "ipfsHash": "Qm...",
        "issuerUsername": "VIT-AP University",
        "issuerAddress": "0x...",
        "timestamp": 1638360000
      }
    ]
  },
  "success": true
}
```

#### Get Certificate Statistics
```http
GET /certificate/getcertificate/stats
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "totalCertificates": 150,
    "certificatesByIssuer": {
      "VIT-AP University": 100,
      "Club A": 30,
      "Club B": 20
    },
    "recentCertificates": 15
  },
  "success": true
}
```

### Web2 Admin Management Routes (`/web2admin`)

#### Register Admin
```http
POST /web2admin/register/admin
```

**Request Body:**
```json
{
  "name": "Admin Name",
  "username": "admin_username",
  "password": "password123"
}
```

**Response (201):**
```json
{
  "statusCode": 201,
  "data": {
    "message": "Registration successful",
    "user": {
      "id": "uuid",
      "name": "Admin Name",
      "username": "admin_username",
      "role": "admin"
    }
  },
  "success": true
}
```

#### Register Club Admin
```http
POST /web2admin/register/club-admin
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "name": "Club Admin Name",
  "username": "club_admin_username",
  "password": "password123"
}
```

**Response (201):** Similar to admin registration but with club.admin role.

#### Get All Admins
```http
POST /web2admin/get-admins
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "admins": [
      {
        "id": "uuid",
        "name": "Admin Name",
        "username": "admin_username",
        "auth_id": "uuid",
        "role": "admin",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "success": true
}
```

#### Get All Club Admins
```http
POST /web2admin/get-club-admins
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "clubAdmins": [
      {
        "id": "uuid",
        "name": "Club Admin Name",
        "username": "club_username",
        "auth_id": "uuid",
        "role": "club.admin",
        "created_at": "2024-01-01T00:00:00Z"
      }
    ]
  },
  "success": true
}
```

#### Delete Admin
```http
DELETE /web2admin/delete-admin/:id
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Admin deleted successfully"
  },
  "success": true
}
```

#### Delete Club Admin
```http
DELETE /web2admin/delete-club-admin/:id
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "message": "Club admin deleted successfully"
  },
  "success": true
}
```

#### Get Admin Statistics
```http
GET /web2admin/get-stats
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "wallet": {
      "address": "0x123...",
      "balanceInEth": "1.5",
      "balance": "1500000000000000000"
    },
    "contract": {
      "address": "0x456...",
      "totalCertificates": 150,
      "certificatesInDb": 145
    },
    "users": {
      "admins": 5,
      "clubAdmins": 10,
      "students": 500,
      "total": 515
    }
  },
  "success": true,
  "message": "Stats retrieved successfully"
}
```

### Web3 Admin Management Routes (`/web3admin`)

#### Add Admin Address
```http
POST /web3admin/add-admin-address
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "adminAddress": "0x123...",
    "transactionHash": "0xabc...",
    "blockNumber": 12345678,
    "addedBy": "0xdef...",
    "gasUsed": "21000"
  },
  "success": true,
  "message": "Admin added successfully"
}
```

#### Remove Admin Address
```http
POST /web3admin/remove-admin
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Request Body:**
```json
{
  "address": "0x1234567890123456789012345678901234567890"
}
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "adminAddress": "0x123...",
    "transactionHash": "0xabc...",
    "blockNumber": 12345678,
    "removedBy": "0xdef...",
    "gasUsed": "21000"
  },
  "success": true,
  "message": "Admin removed successfully"
}
```

#### Get Contract Deployment Info
```http
GET /web3admin/get-deployment-info
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "deployerAddress": "0x123...",
    "isDeployerStillAdmin": true,
    "contractAddress": "0x456...",
    "network": "sepolia"
  },
  "success": true
}
```

#### Get Current Wallet Admin Status
```http
GET /web3admin/current-wallet-status
```

**Headers:**
```
Authorization: Bearer <admin_access_token>
```

**Response (200):**
```json
{
  "statusCode": 200,
  "data": {
    "walletAddress": "0x123...",
    "isAdmin": true,
    "contractAddress": "0x456..."
  },
  "success": true
}
```

## Error Responses

All error responses follow this format:

```json
{
  "statusCode": 400,
  "data": null,
  "success": false,
  "message": "Error message",
  "errors": ["Detailed error messages"]
}
```

### Common HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

## Rate Limiting

- Authentication endpoints: 5 requests per minute per IP
- Certificate endpoints: 100 requests per hour per user
- Admin endpoints: 1000 requests per hour per admin

## File Upload Limits

- Maximum file size: 10MB
- Supported formats: JPEG, PNG, PDF
- Bulk upload: Maximum 50 files per request

## Environment Variables

Required environment variables:

```env
# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=your_contract_address

# Email
ZOHO_EMAIL_USER=admin@yourdomain.com
ZOHO_EMAIL_PASS=your_zoho_app_password

# IPFS
PINATA_JWT=your_pinata_jwt

# App
BASE_URL=http://localhost:5000
JWT_SECRET=your_jwt_secret
```

## Web3 Integration

The system integrates with Ethereum Sepolia testnet for:
- Certificate issuance and storage
- Admin management on smart contracts
- Immutable certificate verification

Smart contract functions:
- `issueCertificate()`: Issues a new certificate
- `getCertificate()`: Retrieves certificate details
- `verifyCertificate()`: Verifies certificate authenticity
- `addAdmin()`: Grants admin privileges
- `removeAdmin()`: Revokes admin privileges

## Security Features

- JWT authentication with expiration
- Role-based access control
- Input validation and sanitization
- Rate limiting
- CORS protection
- Helmet security headers
- File upload restrictions

## Testing

Run tests with:
```bash
npm test
```

Test coverage includes:
- Authentication flows
- Certificate operations
- Admin management
- Error handling
- Input validation</content>
<parameter name="filePath">d:\Codes\BlockChain\confcert-vitap\backend\docs\API_DOCUMENTATION.md