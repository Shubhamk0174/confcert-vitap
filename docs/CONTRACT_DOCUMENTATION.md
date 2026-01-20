# CertificateRegistry Smart Contract Documentation

## Overview

The **CertificateRegistry** is a Solidity smart contract designed for managing blockchain-based certificates with a robust admin-based access control system. It stores certificate metadata on-chain while the actual certificate files are stored on IPFS (InterPlanetary File System).

### Key Features
- ✅ **Admin-based access control** with multi-admin support
- ✅ **Registration number tracking** for student certificates
- ✅ **Issuer organization tracking** (e.g., "VIT AP", "Department of CSE")
- ✅ **Public verification** - anyone can view and verify certificates without a wallet
- ✅ **Bulk issuance** support for efficient certificate distribution
- ✅ **Multiple search methods** - by reg no, issuer, or view all certificates

---

## Contract Architecture

### Data Structures

#### Certificate Struct
```solidity
struct Certificate {
    uint256 id;                // Unique certificate ID (starts from 1001)
    string studentName;        // Name of the certificate recipient
    string regNo;              // Student registration number
    string ipfsHash;           // IPFS hash (CID) of certificate image
    string issuerUsername;     // Issuing organization name (e.g., "VIT AP")
    address issuerAddress;     // Wallet address of admin who issued it
    uint256 timestamp;         // Unix timestamp of issuance
    bool exists;               // Flag to check certificate existence
}
```

### State Variables
- `certificateCounter` - Tracks the next certificate ID (starts at 1000, first cert is 1001)
- `deployer` - Address that deployed the contract (for reference)
- `certificates` - Mapping of certificate ID to Certificate struct
- `admins` - Mapping of addresses with admin privileges
- `certificatesByRegNo` - Mapping of registration number to array of certificate IDs
- `certificatesByIssuer` - Mapping of issuer name to array of certificate IDs
- `allCertificateIds` - Array containing all issued certificate IDs

---

## Access Control & Roles

### Admin Role

#### Who Can Be an Admin?
- The contract deployer is automatically the first admin
- Any existing admin can add new admins
- Any admin can remove other admins (including the original deployer)
- Admins cannot remove themselves (prevents accidental lockout)

#### Admin Privileges
Admins have the following exclusive powers:

1. **Add New Admins** - Grant admin privileges to new wallet addresses
2. **Remove Admins** - Revoke admin privileges from any admin (except themselves)
3. **Issue Certificates** - Create new certificates with student details
4. **Bulk Issue Certificates** - Issue multiple certificates in a single transaction (up to 100)

#### Important Admin Notes
- ⚠️ **No "owner" concept**: There is no permanent owner. Any admin can be removed by another admin.
- ⚠️ **Equal privileges**: All admins have equal rights - no hierarchy.
- ⚠️ **Self-removal protection**: Cannot remove yourself to prevent accidental lockout.
- ⚠️ **Deployer can be removed**: Even the original deployer can lose admin rights if removed.

### Public Access

#### What Anyone Can Do (No Wallet Required)
The following functions are **view functions** that anyone can call without a wallet or gas fees:

1. View certificate details by ID
2. Search certificates by registration number
3. Search certificates by issuer organization name
4. Search certificates by issuer wallet address
5. View all certificates
6. Verify certificate existence
7. Get certificate counts and statistics
8. Check if an address is an admin

---

## Function Reference

### 🔐 Admin Management Functions

#### `addAdmin(address _newAdmin)`
- **Access**: Only admins
- **Purpose**: Grant admin privileges to a new address
- **Parameters**:
  - `_newAdmin`: The wallet address to make an admin
- **Events**: Emits `AdminAdded(newAdmin, msg.sender)`
- **Requirements**:
  - Caller must be an admin
  - Address must not be zero address
  - Address must not already be an admin

#### `removeAdmin(address _admin)`
- **Access**: Only admins
- **Purpose**: Revoke admin privileges from an address
- **Parameters**:
  - `_admin`: The wallet address to remove as admin
- **Events**: Emits `AdminRemoved(removedAdmin, msg.sender)`
- **Requirements**:
  - Caller must be an admin
  - Cannot remove yourself
  - Target address must currently be an admin

#### `isAdmin(address _address)` 👁️
- **Access**: Public (anyone can view)
- **Purpose**: Check if an address has admin privileges
- **Parameters**:
  - `_address`: The address to check
- **Returns**: `bool` - true if address is an admin

---

### 📜 Certificate Issuance Functions

#### `issueCertificate(string _studentName, string _regNo, string _ipfsHash, string _issuerUsername)`
- **Access**: Only admins
- **Purpose**: Issue a single certificate
- **Parameters**:
  - `_studentName`: Student's full name
  - `_regNo`: Student's registration number (e.g., "21BCE1234")
  - `_ipfsHash`: IPFS hash/CID of the certificate image
  - `_issuerUsername`: Issuing organization name (e.g., "VIT AP", "Department of CSE")
- **Returns**: `uint256` - The newly created certificate ID
- **Events**: Emits `CertificateIssued(...)`
- **Requirements**:
  - Caller must be an admin
  - All parameters must be non-empty strings

#### `bulkIssueCertificates(string[] _studentNames, string[] _regNos, string[] _ipfsHashes, string _issuerUsername)`
- **Access**: Only admins
- **Purpose**: Issue multiple certificates in one transaction
- **Parameters**:
  - `_studentNames`: Array of student names
  - `_regNos`: Array of registration numbers
  - `_ipfsHashes`: Array of IPFS hashes
  - `_issuerUsername`: Issuing organization (same for all certificates in batch)
- **Returns**: `uint256[]` - Array of newly created certificate IDs
- **Events**: Emits `CertificateIssued(...)` for each certificate
- **Requirements**:
  - Caller must be an admin
  - All arrays must have same length
  - Maximum 100 certificates per transaction
  - All values must be non-empty

---

### 👁️ Certificate Viewing Functions (Public Access)

#### `getCertificate(uint256 _certificateId)`
- **Access**: Public (anyone)
- **Purpose**: Get complete details of a certificate
- **Parameters**:
  - `_certificateId`: The certificate ID to retrieve
- **Returns**: Tuple with all certificate details:
  - `id`: Certificate ID
  - `studentName`: Student's name
  - `regNo`: Registration number
  - `ipfsHash`: IPFS hash
  - `issuerUsername`: Issuing organization name
  - `issuerAddress`: Admin wallet that issued it
  - `timestamp`: Unix timestamp
  - `exists`: Whether certificate exists

#### `getCertificatesByRegNo(string _regNo)`
- **Access**: Public (anyone)
- **Purpose**: Get all certificates for a specific registration number
- **Parameters**:
  - `_regNo`: Registration number to search for
- **Returns**: `uint256[]` - Array of certificate IDs
- **Use Case**: Student can see all their certificates

#### `getCertificatesByIssuerName(string _issuerUsername)`
- **Access**: Public (anyone)
- **Purpose**: Get all certificates issued by a specific organization
- **Parameters**:
  - `_issuerUsername`: Issuer name (e.g., "VIT AP")
- **Returns**: `uint256[]` - Array of certificate IDs
- **Use Case**: View all certificates from a specific department or organization

#### `getCertificatesByIssuerAddress(address _issuerAddress)`
- **Access**: Public (anyone)
- **Purpose**: Get all certificates issued by a specific admin wallet
- **Parameters**:
  - `_issuerAddress`: Admin's wallet address
- **Returns**: `uint256[]` - Array of certificate IDs
- **Use Case**: Track which admin issued which certificates

#### `getAllCertificates()`
- **Access**: Public (anyone)
- **Purpose**: Get all certificate IDs ever issued
- **Returns**: `uint256[]` - Array of all certificate IDs
- **Note**: For large datasets, use pagination in your frontend application

#### `getCertificatesBatch(uint256[] _certificateIds)`
- **Access**: Public (anyone)
- **Purpose**: Get full details for multiple certificates at once
- **Parameters**:
  - `_certificateIds`: Array of certificate IDs to retrieve
- **Returns**: `Certificate[]` - Array of Certificate structs
- **Use Case**: Efficiently retrieve multiple certificates with fewer RPC calls

---

### ✅ Certificate Verification Functions (Public Access)

#### `verifyCertificate(uint256 _certificateId)`
- **Access**: Public (anyone)
- **Purpose**: Check if a certificate exists
- **Parameters**:
  - `_certificateId`: Certificate ID to verify
- **Returns**: `bool` - true if certificate exists
- **Use Case**: Quick existence check

#### `verifyCertificateWithDetails(uint256 _certificateId)`
- **Access**: Public (anyone)
- **Purpose**: Verify and get basic certificate info in one call
- **Parameters**:
  - `_certificateId`: Certificate ID to verify
- **Returns**: Tuple with:
  - `exists`: Whether certificate exists
  - `studentName`: Student's name (if exists)
  - `regNo`: Registration number (if exists)
  - `issuerUsername`: Issuing organization (if exists)
- **Use Case**: Get key info for display on verification page

---

### 📊 Utility Functions (Public Access)

#### `getCurrentCounter()`
- **Access**: Public (anyone)
- **Purpose**: Get the last issued certificate ID
- **Returns**: `uint256` - Current counter value

#### `getTotalCertificatesIssued()`
- **Access**: Public (anyone)
- **Purpose**: Get total number of certificates issued
- **Returns**: `uint256` - Total count

#### `getDeploymentInfo()`
- **Access**: Public (anyone)
- **Purpose**: Get information about contract deployment
- **Returns**: Tuple with:
  - `deployerAddress`: Original deployer's address
  - `isDeployerStillAdmin`: Whether deployer still has admin rights

---

## Events

### CertificateIssued
Emitted when a certificate is issued.
```solidity
event CertificateIssued(
    uint256 indexed certificateId,
    string studentName,
    string regNo,
    string ipfsHash,
    string issuerUsername,
    address indexed issuerAddress,
    uint256 timestamp
);
```

### AdminAdded
Emitted when a new admin is added.
```solidity
event AdminAdded(
    address indexed newAdmin,
    address indexed addedBy
);
```

### AdminRemoved
Emitted when an admin is removed.
```solidity
event AdminRemoved(
    address indexed removedAdmin,
    address indexed removedBy
);
```

---

## Usage Examples

### Example 1: Admin Management

```javascript
// Deployer adds a new admin
await contract.addAdmin("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");

// Check if address is admin
const isAdmin = await contract.isAdmin("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb");
// Returns: true

// Admin B removes Admin A (yes, including the original deployer!)
await contract.removeAdmin("0xOriginalDeployerAddress");
```

### Example 2: Issue Single Certificate

```javascript
// Admin issues a certificate
const tx = await contract.issueCertificate(
    "John Doe",                    // Student name
    "21BCE1234",                   // Registration number
    "QmX7Fg3...",                  // IPFS hash
    "VIT AP"                       // Issuer organization
);

const receipt = await tx.wait();
// Certificate ID will be in the event logs
```

### Example 3: Bulk Issue Certificates

```javascript
// Admin issues multiple certificates at once
const tx = await contract.bulkIssueCertificates(
    ["Alice", "Bob", "Charlie"],           // Student names
    ["21BCE1001", "21BCE1002", "21BCE1003"], // Reg numbers
    ["QmAbc...", "QmDef...", "QmGhi..."],    // IPFS hashes
    "Department of Computer Science"        // Same issuer for all
);

const receipt = await tx.wait();
// Returns array of certificate IDs: [1001, 1002, 1003]
```

### Example 4: View Certificates (No Wallet Needed!)

```javascript
// Anyone can view without a wallet or signing transactions

// Get all certificates for a student
const studentCerts = await contract.getCertificatesByRegNo("21BCE1234");
// Returns: [1001, 1005, 1023] - all cert IDs for this student

// Get certificate details
const cert = await contract.getCertificate(1001);
console.log(cert.studentName);     // "John Doe"
console.log(cert.regNo);          // "21BCE1234"
console.log(cert.issuerUsername); // "VIT AP"

// Get all certificates from VIT AP
const vitapCerts = await contract.getCertificatesByIssuerName("VIT AP");

// View all certificates ever issued
const allCerts = await contract.getAllCertificates();
```

### Example 5: Verify Certificate (No Wallet Needed!)

```javascript
// Quick verification
const exists = await contract.verifyCertificate(1001);
// Returns: true

// Verify with details
const verification = await contract.verifyCertificateWithDetails(1001);
console.log(verification.exists);           // true
console.log(verification.studentName);      // "John Doe"
console.log(verification.regNo);           // "21BCE1234"
console.log(verification.issuerUsername);  // "VIT AP"
```

---

## Security Considerations

### ✅ Security Features

1. **Admin-only issuance**: Only admins can create certificates - prevents unauthorized certificate creation
2. **Self-removal protection**: Admins cannot remove themselves - prevents accidental lockout
3. **Input validation**: All inputs are validated for empty strings
4. **Bulk limit**: Maximum 100 certificates per bulk transaction - prevents gas limit issues
5. **Event logging**: All important actions emit events for transparency and auditing

### ⚠️ Important Warnings

1. **Admin management risk**: Any admin can remove other admins. Ensure trust among admin addresses.
2. **No certificate revocation**: Once issued, certificates cannot be deleted or revoked (by design for immutability).
3. **No certificate editing**: Certificate details cannot be modified after issuance.
4. **Gas costs**: Large bulk issuances and retrieving all certificates can be gas-intensive.

---

## Gas Optimization Tips

1. **Use bulk issuance** when issuing multiple certificates
2. **Use `getCertificatesByRegNo`** instead of `getAllCertificates` when possible
3. **Use `getCertificatesBatch`** to retrieve multiple certificates efficiently
4. **Implement pagination** in your frontend when displaying all certificates
5. **Cache certificate IDs** to avoid repeated lookups

---

## Integration Guide

### For Frontend Developers

#### Connect to Contract
```javascript
import { ethers } from 'ethers';
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
```

#### Read-Only Operations (No Wallet Needed)
```javascript
// These don't require a connected wallet
const cert = await contract.getCertificate(1001);
const studentCerts = await contract.getCertificatesByRegNo("21BCE1234");
const isValid = await contract.verifyCertificate(1001);
```

#### Admin Operations (Requires Wallet)
```javascript
const signer = provider.getSigner();
const contractWithSigner = contract.connect(signer);

// Issue certificate
const tx = await contractWithSigner.issueCertificate(
    "Jane Doe",
    "21BCE5678",
    "QmXyz...",
    "VIT AP"
);
await tx.wait();
```

---

## Summary of Powers

| Action | Who Can Do It | Requires Wallet? | Gas Cost? |
|--------|---------------|------------------|-----------|
| Add Admin | Any Admin | Yes | Yes |
| Remove Admin | Any Admin | Yes | Yes |
| Issue Certificate | Any Admin | Yes | Yes |
| Bulk Issue Certificates | Any Admin | Yes | Yes |
| View Certificates | Anyone | No | No |
| Verify Certificates | Anyone | No | No |
| Search by Reg No | Anyone | No | No |
| Search by Issuer Name | Anyone | No | No |
| Search by Issuer Address | Anyone | No | No |
| Get All Certificates | Anyone | No | No |
| Get Certificate Batch | Anyone | No | No |
| Get Certificate Stats | Anyone | No | No |
| Check Admin Status | Anyone | No | No |

---

## Contract Deployment

### Initial Setup
1. Deploy the contract - deployer becomes first admin
2. Deployer can add other trusted admins
3. Admins can start issuing certificates

### Recommended Admin Structure
- **Main Admin**: Institution's official wallet (e.g., VIT AP central wallet)
- **Department Admins**: One per department/club
- **Emergency Admin**: Backup wallet for disaster recovery


**Last Updated**: January 2026
