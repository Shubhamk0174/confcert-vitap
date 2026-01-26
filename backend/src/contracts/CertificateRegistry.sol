// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract CertificateRegistry {
    
    // Structure to store certificate details
    struct Certificate {
        uint256 id;
        string studentName;
        string regNo;
        string ipfsHash;
        string issuerUsername;
        address issuerAddress;
        uint256 timestamp;
        bool exists;
    }
    
    // State variables
    uint256 private certificateCounter;  
    address public deployer;              
    
    // Mappings
    mapping(uint256 => Certificate) public certificates;      
    mapping(address => bool) public admins;
    address[] private adminAddresses;  // Array to track all admin addresses
    mapping(string => uint256[]) private certificatesByRegNo;  
    mapping(string => uint256[]) private certificatesByIssuer; 
    uint256[] private allCertificateIds;                       
    
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
    

    constructor() {
        deployer = msg.sender;
        admins[msg.sender] = true;
        adminAddresses.push(msg.sender);  // Add deployer to admin addresses array
        certificateCounter = 1000; 
        emit AdminAdded(msg.sender, msg.sender);
    }
    
    // ======================
    // ADMIN MANAGEMENT
    // ======================
  
    function addAdmin(address _newAdmin) public onlyAdmin {
        require(_newAdmin != address(0), "Invalid address");
        require(!admins[_newAdmin], "Address is already an admin");
        
        admins[_newAdmin] = true;
        adminAddresses.push(_newAdmin);  // Add to admin addresses array
        emit AdminAdded(_newAdmin, msg.sender);
    }
    
    function removeAdmin(address _admin) public onlyAdmin {
        require(_admin != address(0), "Invalid address");
        require(_admin != msg.sender, "Cannot remove yourself as admin");
        require(admins[_admin], "Address is not an admin");
        
        admins[_admin] = false;
        
        // Remove from adminAddresses array
        for (uint256 i = 0; i < adminAddresses.length; i++) {
            if (adminAddresses[i] == _admin) {
                // Move the last element to this position and pop
                adminAddresses[i] = adminAddresses[adminAddresses.length - 1];
                adminAddresses.pop();
                break;
            }
        }
        
        emit AdminRemoved(_admin, msg.sender);
    }

    function isAdmin(address _address) public view returns (bool) {
        return admins[_address];
    }
    
    // Get all admin addresses
    function getAllAdmins() public view onlyAdmin returns (address[] memory) {
        return adminAddresses;
    }
    
    // ======================
    // CERTIFICATE ISSUANCE
    // ======================

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

    function getCertificatesByRegNo(string memory _regNo) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return certificatesByRegNo[_regNo];
    }

    function getCertificatesByIssuerName(string memory _issuerUsername) 
        public 
        view 
        returns (uint256[] memory) 
    {
        return certificatesByIssuer[_issuerUsername];
    }
  
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

    function getAllCertificates() 
        public 
        view 
        returns (uint256[] memory) 
    {
        return allCertificateIds;
    }

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
 
    function verifyCertificate(uint256 _certificateId) public view returns (bool) {
        return certificates[_certificateId].exists;
    }

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

    function getCurrentCounter() public view returns (uint256) {
        return certificateCounter;
    }

    function getTotalCertificatesIssued() public view returns (uint256) {
        return allCertificateIds.length;
    }
 
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
