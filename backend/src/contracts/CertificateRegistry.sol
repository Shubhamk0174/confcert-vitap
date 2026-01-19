// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing blockchain-based certificates with admin-based access control
 * @notice This contract stores certificate metadata on-chain while actual certificate files are stored on IPFS
 * @notice Only admins can issue certificates; anyone can view and verify certificates without a wallet
 */
contract CertificateRegistry {
    
    // Structure to store certificate details
    struct Certificate {
        uint256 id;                // Unique certificate ID
        string studentName;        // Name of the certificate recipient
        string regNo;              // Registration number of the student
        string ipfsHash;           // IPFS hash (CID) where certificate image is stored
        string issuerUsername;     // Name of the issuing organization (e.g., "VIT AP")
        address issuerAddress;     // Wallet address of the admin who issued the certificate
        uint256 timestamp;         // Timestamp when certificate was issued
        bool exists;               // Flag to check if certificate exists
    }
    
    // State variables
    uint256 private certificateCounter;  // Counter for generating unique IDs (starts from 1001)
    address public deployer;              // Original contract deployer (for reference only)
    
    // Mappings
    mapping(uint256 => Certificate) public certificates;       // certificateId => Certificate
    mapping(address => bool) public admins;                    // Admin addresses with full privileges
    mapping(string => uint256[]) private certificatesByRegNo;  // regNo => array of certificate IDs
    mapping(string => uint256[]) private certificatesByIssuer; // issuerUsername => array of certificate IDs
    uint256[] private allCertificateIds;                       // Array of all certificate IDs
    
    // Events
    event CertificateIssued(
        uint256 indexed certificateId,
        string studentName,
        string regNo,
        string ipfsHash,
        string issuerUsername,
        address indexed issuerAddress,
        uint256 timestamp
    );
    
    event AdminAdded(address indexed newAdmin, address indexed addedBy);
    event AdminRemoved(address indexed removedAdmin, address indexed removedBy);
    
    // Modifiers
    modifier onlyAdmin() {
        require(admins[msg.sender], "Only admins can perform this action");
        _;
    }
    
    /**
     * @dev Constructor - initializes contract with deployer as first admin
     */
    constructor() {
        deployer = msg.sender;
        admins[msg.sender] = true;
        certificateCounter = 1000;  // First certificate will be 1001
        emit AdminAdded(msg.sender, msg.sender);
    }
    
    // ======================
    // ADMIN MANAGEMENT
    // ======================
    
    /**
     * @dev Add a new admin to the system
     * @param _newAdmin Address to grant admin privileges
     * @notice Any admin can add another admin
     */
    function addAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        require(!admins[_newAdmin], "Address is already an admin");
        
        admins[_newAdmin] = true;
        emit AdminAdded(_newAdmin, msg.sender);
    }
    
    /**
     * @dev Remove an admin from the system
     * @param _admin Address to revoke admin privileges
     * @notice Any admin can remove any other admin, including the original deployer
     * @notice Cannot remove yourself (prevents accidental lockout)
     */
    function removeAdmin(address _admin) public onlyAdmin {
        require(_admin != address(0), "Invalid address");
        require(_admin != msg.sender, "Cannot remove yourself as admin");
        require(admins[_admin], "Address is not an admin");
        
        admins[_admin] = false;
        emit AdminRemoved(_admin, msg.sender);
    }
    
    /**
     * @dev Check if an address has admin privileges
     * @param _address Address to check
     * @return bool True if address is an admin
     */
    function isAdmin(address _address) public view returns (bool) {
        return admins[_address];
    }
    
    // ======================
    // CERTIFICATE ISSUANCE
    // ======================
    
    /**
     * @dev Issue a new certificate
     * @param _studentName Name of the student receiving the certificate
     * @param _regNo Registration number of the student
     * @param _ipfsHash IPFS hash (CID) of the certificate image
     * @param _issuerUsername Name of the issuing organization (e.g., "VIT AP")
     * @return certificateId The unique ID assigned to this certificate
     * @notice Only admins can issue certificates
     */
    function issueCertificate(
        string memory _studentName,
        string memory _regNo,
        string memory _ipfsHash,
        string memory _issuerUsername
    ) public onlyAdmin returns (uint256) {
        require(bytes(_studentName).length > 0, "Student name cannot be empty");
        require(bytes(_regNo).length > 0, "Registration number cannot be empty");
        require(bytes(_ipfsHash).length > 0, "IPFS hash cannot be empty");
        require(bytes(_issuerUsername).length > 0, "Issuer username cannot be empty");
        
        // Increment counter and generate new ID
        certificateCounter++;
        uint256 newCertificateId = certificateCounter;
        
        // Create certificate record
        certificates[newCertificateId] = Certificate({
            id: newCertificateId,
            studentName: _studentName,
            regNo: _regNo,
            ipfsHash: _ipfsHash,
            issuerUsername: _issuerUsername,
            issuerAddress: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        
        // Update tracking mappings
        certificatesByRegNo[_regNo].push(newCertificateId);
        certificatesByIssuer[_issuerUsername].push(newCertificateId);
        allCertificateIds.push(newCertificateId);
        
        // Emit event
        emit CertificateIssued(
            newCertificateId,
            _studentName,
            _regNo,
            _ipfsHash,
            _issuerUsername,
            msg.sender,
            block.timestamp
        );
        
        return newCertificateId;
    }
    
    /**
     * @dev Issue multiple certificates in a single transaction (bulk issuance)
     * @param _studentNames Array of student names
     * @param _regNos Array of registration numbers
     * @param _ipfsHashes Array of IPFS hashes corresponding to each certificate
     * @param _issuerUsername Name of the issuing organization (same for all certificates in batch)
     * @return certificateIds Array of generated certificate IDs
     * @notice Only admins can issue certificates
     */
    function bulkIssueCertificates(
        string[] memory _studentNames,
        string[] memory _regNos,
        string[] memory _ipfsHashes,
        string memory _issuerUsername
    ) public onlyAdmin returns (uint256[] memory) {
        require(_studentNames.length > 0, "Must provide at least one certificate");
        require(_studentNames.length == _regNos.length, "Student names and reg numbers length mismatch");
        require(_studentNames.length == _ipfsHashes.length, "Arrays length mismatch");
        require(_studentNames.length <= 100, "Cannot issue more than 100 certificates at once");
        require(bytes(_issuerUsername).length > 0, "Issuer username cannot be empty");
        
        uint256[] memory certificateIds = new uint256[](_studentNames.length);
        
        for (uint256 i = 0; i < _studentNames.length; i++) {
            require(bytes(_studentNames[i]).length > 0, "Student name cannot be empty");
            require(bytes(_regNos[i]).length > 0, "Registration number cannot be empty");
            require(bytes(_ipfsHashes[i]).length > 0, "IPFS hash cannot be empty");
            
            // Increment counter and generate new ID
            certificateCounter++;
            uint256 newCertificateId = certificateCounter;
            certificateIds[i] = newCertificateId;
            
            // Create certificate record
            certificates[newCertificateId] = Certificate({
                id: newCertificateId,
                studentName: _studentNames[i],
                regNo: _regNos[i],
                ipfsHash: _ipfsHashes[i],
                issuerUsername: _issuerUsername,
                issuerAddress: msg.sender,
                timestamp: block.timestamp,
                exists: true
            });
            
            // Update tracking mappings
            certificatesByRegNo[_regNos[i]].push(newCertificateId);
            certificatesByIssuer[_issuerUsername].push(newCertificateId);
            allCertificateIds.push(newCertificateId);
            
            // Emit event for each certificate
            emit CertificateIssued(
                newCertificateId,
                _studentNames[i],
                _regNos[i],
                _ipfsHashes[i],
                _issuerUsername,
                msg.sender,
                block.timestamp
            );
        }
        
        return certificateIds;
    }
    
    // ======================
    // CERTIFICATE RETRIEVAL (Anyone can view)
    // ======================
    
    /**
     * @dev Retrieve certificate details by ID
     * @param _certificateId The unique certificate ID to look up
     * @return id Certificate ID
     * @return studentName Name on the certificate
     * @return regNo Registration number
     * @return ipfsHash IPFS hash of the certificate
     * @return issuerUsername Name of issuing organization
     * @return issuerAddress Wallet address that issued the certificate
     * @return timestamp When the certificate was issued
     * @return exists Whether the certificate exists
     * @notice Anyone can call this function without a wallet (view function)
     */
    function getCertificate(uint256 _certificateId) 
        public 
        view 
        returns (
            uint256 id,
            string memory studentName,
            string memory regNo,
            string memory ipfsHash,
            string memory issuerUsername,
            address issuerAddress,
            uint256 timestamp,
            bool exists
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        return (
            cert.id,
            cert.studentName,
            cert.regNo,
            cert.ipfsHash,
            cert.issuerUsername,
            cert.issuerAddress,
            cert.timestamp,
            cert.exists
        );
    }
    
    /**
     * @dev Get all certificates for a specific registration number
     * @param _regNo Registration number to search for
     * @return certificateIds Array of certificate IDs for this registration number
     * @notice Anyone can call this function without a wallet (view function)
     */
    function getCertificatesByRegNo(string memory _regNo) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return certificatesByRegNo[_regNo];
    }
    
    /**
     * @dev Get all certificates issued by a specific organization
     * @param _issuerUsername Name of the issuing organization (e.g., "VIT AP")
     * @return certificateIds Array of certificate IDs issued by this organization
     * @notice Anyone can call this function without a wallet (view function)
     */
    function getCertificatesByIssuerName(string memory _issuerUsername) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return certificatesByIssuer[_issuerUsername];
    }
    
    /**
     * @dev Get all certificates issued by a specific wallet address
     * @param _issuerAddress Address of the admin who issued certificates
     * @return certificateIds Array of certificate IDs issued by this address
     * @notice Anyone can call this function without a wallet (view function)
     */
    function getCertificatesByIssuerAddress(address _issuerAddress) 
        public 
        view 
        returns (uint256[] memory) 
    {
        // First, count how many certificates this address issued
        uint256 count = 0;
        for (uint256 i = 0; i < allCertificateIds.length; i++) {
            uint256 certId = allCertificateIds[i];
            if (certificates[certId].issuerAddress == _issuerAddress) {
                count++;
            }
        }
        
        // Create array and populate it
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < allCertificateIds.length; i++) {
            uint256 certId = allCertificateIds[i];
            if (certificates[certId].issuerAddress == _issuerAddress) {
                result[index] = certId;
                index++;
            }
        }
        
        return result;
    }
    
    /**
     * @dev Get all certificates issued till date
     * @return certificateIds Array of all certificate IDs
     * @notice Anyone can call this function without a wallet (view function)
     * @notice For large datasets, consider using pagination in frontend
     */
    function getAllCertificates() 
        public 
        view 
        returns (uint256[] memory) 
    {
        return allCertificateIds;
    }
    
    /**
     * @dev Get detailed information for multiple certificates at once
     * @param _certificateIds Array of certificate IDs to retrieve
     * @return certificates Array of Certificate structs
     * @notice Useful for batch retrieval to reduce RPC calls
     */
    function getCertificatesBatch(uint256[] memory _certificateIds)
        public
        view
        returns (Certificate[] memory)
    {
        Certificate[] memory result = new Certificate[](_certificateIds.length);
        for (uint256 i = 0; i < _certificateIds.length; i++) {
            result[i] = certificates[_certificateIds[i]];
        }
        return result;
    }
    
    // ======================
    // CERTIFICATE VERIFICATION (Anyone can verify)
    // ======================
    
    /**
     * @dev Verify if a certificate exists
     * @param _certificateId The certificate ID to check
     * @return bool True if certificate exists
     * @notice Anyone can call this function without a wallet (view function)
     */
    function verifyCertificate(uint256 _certificateId) public view returns (bool) {
        return certificates[_certificateId].exists;
    }
    
    /**
     * @dev Verify certificate and get basic details in one call
     * @param _certificateId Certificate ID to verify
     * @return exists Whether certificate exists
     * @return studentName Name on certificate if it exists
     * @return regNo Registration number if it exists
     * @return issuerUsername Issuing organization if it exists
     * @notice Anyone can call this function without a wallet (view function)
     */
    function verifyCertificateWithDetails(uint256 _certificateId)
        public
        view
        returns (
            bool exists,
            string memory studentName,
            string memory regNo,
            string memory issuerUsername
        )
    {
        Certificate memory cert = certificates[_certificateId];
        return (
            cert.exists,
            cert.studentName,
            cert.regNo,
            cert.issuerUsername
        );
    }
    
    // ======================
    // UTILITY FUNCTIONS
    // ======================
    
    /**
     * @dev Get the current certificate counter value
     * @return uint256 The last issued certificate ID
     * @notice Anyone can call this function
     */
    function getCurrentCounter() public view returns (uint256) {
        return certificateCounter;
    }
    
    /**
     * @dev Get the total number of certificates issued
     * @return uint256 Total certificate count
     * @notice Anyone can call this function
     */
    function getTotalCertificatesIssued() public view returns (uint256) {
        return allCertificateIds.length;
    }
    
    /**
     * @dev Get contract deployment information
     * @return deployerAddress Address that deployed the contract
     * @return isDeployerStillAdmin Whether deployer still has admin rights
     * @notice Anyone can call this function
     */
    function getDeploymentInfo() 
        public 
        view 
        returns (
            address deployerAddress,
            bool isDeployerStillAdmin
        ) 
    {
        return (deployer, admins[deployer]);
    }
}
