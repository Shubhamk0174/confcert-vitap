import { HttpStatusCode } from "../../utils/httpStatusCode.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { uploadToIPFS } from "../../services/uploadToIpfs.js";
import {
  issueCertificateOnBlockchain,
  bulkIssueCertificatesOnBlockchain,
} from "../../services/blockchain.service.js";
import {
  sendCertificateEmailFunction,
  sendBulkCertificateEmails,
} from "../../services/sendCertificateEmail.js";
import { estimateBulkEmailTime } from "../../config/email.config.js";

export const issueCertificate = async (req, res) => {
  try {
    // Validate file is present
    if (!req.file) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "No certificate file provided",
          ),
        );
    }

    
    const { role: issuerRole, name } = req.user;
    let issuerUsername;

    if (issuerRole === "admin") {
      issuerUsername = "VIT-AP University";
    } else {
      issuerUsername = name;
    }

    const { studentName, regNo, email, sendEmail } = req.body;

    // Validate required fields
    if (!studentName || !studentName.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(HttpStatusCode.BAD_REQUEST, "Student name is required"),
        );
    }

    if (!regNo || !regNo.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Registration number is required",
          ),
        );
    }

    if (!issuerUsername || !issuerUsername.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Issuer username is required",
          ),
        );
    }

    // Parse sendEmail flag (it comes as string from form data)
    const shouldSendEmail = sendEmail === "true" || sendEmail === true;

    // Validate email if sending email is enabled
    if (shouldSendEmail && (!email || !email.trim())) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Email is required when sendEmail is enabled",
          ),
        );
    }

    console.log("📋 Processing certificate issuance for:", studentName);

    // Step 1: Upload to IPFS
    console.log("📤 Step 1/3: Uploading to IPFS...");
    const { buffer, originalname, mimetype } = req.file;
    const ipfsResult = await uploadToIPFS(buffer, originalname, mimetype);

    if (!ipfsResult.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            `IPFS upload failed: ${ipfsResult.error}`,
          ),
        );
    }

    const ipfsHash = ipfsResult.ipfsHash;
    console.log("✅ IPFS upload successful. Hash:", ipfsHash);

    // Step 2: Issue on Blockchain
    console.log("⛓️ Step 2/3: Issuing certificate on blockchain...");
    const blockchainResult = await issueCertificateOnBlockchain(
      studentName,
      regNo,
      ipfsHash,
      issuerUsername,
    );

    if (!blockchainResult.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            `Blockchain issuance failed: ${blockchainResult.error}`,
          ),
        );
    }

    const { certificateId, transactionHash, issuerAddress } = blockchainResult;
    console.log(
      "✅ Blockchain issuance successful. Certificate ID:",
      certificateId,
    );

    // Step 3: Send Email (if enabled)
    let emailSent = false;
    if (shouldSendEmail && email) {
      console.log("📧 Step 3/3: Sending email to:", email);

      const emailResult = await sendCertificateEmailFunction({
        to: email,
        studentName,
        certificateId,
        ipfsHash,
        issuerAddress,
        transactionHash,
        pinataUrl: ipfsResult.pinataUrl,
      });

      if (emailResult.success) {
        emailSent = true;
        console.log("✅ Email sent successfully");
      } else {
        console.warn("⚠️ Email sending failed:", emailResult.error);
        // Don't fail the entire request if email fails
      }
    } else {
      console.log("📧 Step 3/3: Email sending skipped");
    }

    // Return success response
    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          certificateId,
          studentName,
          ipfsHash,
          transactionHash,
          issuerAddress,
          emailSent,
          pinataUrl: ipfsResult.pinataUrl,
        },
        "Certificate issued successfully",
      ),
    );
  } catch (error) {
    console.error("❌ Certificate issuance error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to issue certificate",
        ),
      );
  }
};

export const bulkIssueCertificates = async (req, res) => {
  try {
    // Validate files are present
    if (!req.files || req.files.length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "No certificate files provided",
          ),
        );
    }

    // Extract request data
    const { role: issuerRole, name } = req.user;
    let issuerUsername;

    if (issuerRole === "admin") {
      issuerUsername = "VIT-AP University";
    } else {
      issuerUsername = name;
    }

    const { studentNames, regNos, emails, sendEmail } = req.body;

    // Parse studentNames, regNos, and emails (they come as JSON strings from form data)
    let parsedStudentNames, parsedRegNos, parsedEmails;
    try {
      parsedStudentNames =
        typeof studentNames === "string"
          ? JSON.parse(studentNames)
          : studentNames;
      parsedRegNos = typeof regNos === "string" ? JSON.parse(regNos) : regNos;
      parsedEmails = typeof emails === "string" ? JSON.parse(emails) : emails;
    } catch (e) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Invalid student names, reg nos, or emails format",
          ),
        );
    }

    // Validate arrays
    if (!Array.isArray(parsedStudentNames) || parsedStudentNames.length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Student names array is required",
          ),
        );
    }

    if (!Array.isArray(parsedRegNos) || parsedRegNos.length === 0) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Registration numbers array is required",
          ),
        );
    }

    if (!issuerUsername || !issuerUsername.trim()) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Issuer username is required",
          ),
        );
    }

    if (parsedStudentNames.length !== req.files.length) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Number of student names must match number of files",
          ),
        );
    }

    if (parsedStudentNames.length !== parsedRegNos.length) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Number of reg nos must match number of student names",
          ),
        );
    }

    const shouldSendEmail = sendEmail === "true" || sendEmail === true;

    if (shouldSendEmail && parsedStudentNames.length !== parsedEmails.length) {
      return res
        .status(HttpStatusCode.BAD_REQUEST)
        .json(
          new ApiError(
            HttpStatusCode.BAD_REQUEST,
            "Number of emails must match number of student names",
          ),
        );
    }

    console.log(
      `📋 Processing bulk issuance for ${parsedStudentNames.length} certificates`,
    );

    // Step 1: Upload all files to IPFS
    console.log("📤 Step 1/3: Uploading files to IPFS...");
    const ipfsHashes = [];
    const ipfsResults = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const studentName = parsedStudentNames[i];

      console.log(`  Uploading ${i + 1}/${req.files.length}: ${studentName}`);

      const ipfsResult = await uploadToIPFS(
        file.buffer,
        file.originalname,
        file.mimetype,
      );

      if (!ipfsResult.success) {
        return res
          .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
          .json(
            new ApiError(
              HttpStatusCode.INTERNAL_SERVER_ERROR,
              `IPFS upload failed for ${studentName}: ${ipfsResult.error}`,
            ),
          );
      }

      ipfsHashes.push(ipfsResult.ipfsHash);
      ipfsResults.push(ipfsResult);
    }

    console.log("✅ All files uploaded to IPFS successfully");

    // Step 2: Issue all certificates on blockchain in bulk
    console.log("⛓️ Step 2/3: Issuing certificates on blockchain in bulk...");
    const blockchainResult = await bulkIssueCertificatesOnBlockchain(
      parsedStudentNames,
      parsedRegNos,
      ipfsHashes,
      issuerUsername,
    );

    if (!blockchainResult.success) {
      return res
        .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
        .json(
          new ApiError(
            HttpStatusCode.INTERNAL_SERVER_ERROR,
            `Bulk blockchain issuance failed: ${blockchainResult.error}`,
          ),
        );
    }

    const { certificateIds, transactionHash, issuerAddress } = blockchainResult;
    console.log(
      "✅ Bulk blockchain issuance successful. Transaction:",
      transactionHash,
    );

    // Prepare certificates data for email sending
    const certificates = parsedStudentNames.map((name, i) => ({
      studentName: name,
      regNo: parsedRegNos[i],
      certificateId: certificateIds[i],
      ipfsHash: ipfsHashes[i],
      pinataUrl: ipfsResults[i].pinataUrl,
      email: parsedEmails ? parsedEmails[i] : null,
    }));

    // Step 3: Send emails in bulk with batching and rate limiting (if enabled)
    let bulkEmailResult = null;
    if (shouldSendEmail && parsedEmails) {
      console.log("📧 Step 3/3: Sending emails in bulk with batching...");

      // Show estimated time
      const estimate = estimateBulkEmailTime(certificates.length);
      console.log(`⏱️  Estimated completion time: ${estimate.estimatedTime}`);

      bulkEmailResult = await sendBulkCertificateEmails(certificates, {
        // Configuration will use optimal values from email.config.js
        issuerAddress,
        transactionHash,
      });

      // Update certificates with email status
      certificates.forEach((cert, i) => {
        const emailResult = bulkEmailResult.results[i];
        cert.emailSent = emailResult ? emailResult.success : false;
        if (emailResult && !emailResult.success) {
          cert.emailError = emailResult.error;
        }
      });

      console.log(
        `✅ Bulk email send complete: ${bulkEmailResult.successCount}/${bulkEmailResult.total} sent`,
      );
    } else {
      console.log("📧 Step 3/3: Email sending skipped");
      certificates.forEach((cert) => {
        cert.emailSent = false;
      });
    }

    // Return success response
    return res.status(HttpStatusCode.OK).json(
      new ApiResponse(
        HttpStatusCode.OK,
        {
          count: certificates.length,
          transactionHash,
          issuerAddress,
          certificates,
          emailStats: bulkEmailResult
            ? {
                total: bulkEmailResult.total,
                sent: bulkEmailResult.successCount,
                failed: bulkEmailResult.failureCount,
              }
            : null,
        },
        `Successfully issued ${certificates.length} certificates`,
      ),
    );
  } catch (error) {
    console.error("❌ Bulk certificate issuance error:", error);
    return res
      .status(HttpStatusCode.INTERNAL_SERVER_ERROR)
      .json(
        new ApiError(
          HttpStatusCode.INTERNAL_SERVER_ERROR,
          error.message || "Failed to issue certificates in bulk",
        ),
      );
  }
};
