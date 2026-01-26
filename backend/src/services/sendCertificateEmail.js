
import nodemailer from "nodemailer";
import { emailConfig, getOptimalBatchSize, estimateBulkEmailTime } from "../config/email.config.js";

/**
 * Helper function to delay execution
 * @param {number} ms - milliseconds to delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ✅ Zoho Mail SMTP configuration
 * - STARTTLS on port 587
 * - Uses Zoho App Password
 * - Works with @zohomail.com or @yourdomain.com
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.in',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.ZOHO_EMAIL_USER, // admin@yourdomain.com
    pass: process.env.ZOHO_EMAIL_PASS, // Zoho App Password
  },
});

// ✅ Verify SMTP on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('Zoho SMTP verification failed:', error);
  } else {
    console.log('Zoho SMTP server ready');
  }
});

export const sendCertificateEmailFunction= async ({
  to,
  studentName,
  certificateId,
  ipfsHash,
  issuerAddress,
  transactionHash,
  pinataUrl,
}) => {
  try {
    const verificationLink =
      `${process.env.BASE_URL}/verify?certificateid=${certificateId}`;

    // Use Pinata URL first, then fallback to other gateways
    const ipfsGateways = [
      pinataUrl || `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
      `https://ipfs.io/ipfs/${ipfsHash}`,
      `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      `https://dweb.link/ipfs/${ipfsHash}`,
    ];

    let attachments = [];
    let certificateAttached = false;

    // Try multiple IPFS gateways until one succeeds
    for (const gateway of ipfsGateways) {
      try {
        console.log(`📎 Attempting to fetch certificate from: ${gateway}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout
        
        const response = await fetch(gateway, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/pdf,image/*'
          }
        });
        clearTimeout(timeout);
        
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          const contentType = response.headers.get('content-type');
          
          console.log(`✅ Certificate fetched successfully. Content-Type: ${contentType}, Size: ${buffer.byteLength} bytes`);
          
          // Determine if it's a PDF or image
          const isPDF = contentType && contentType.includes('application/pdf');
          
          attachments.push({
            filename: isPDF ? 'certificate.pdf' : 'certificate.png',
            content: Buffer.from(buffer),
            contentType: isPDF ? 'application/pdf' : 'image/png',
          });
          
          certificateAttached = true;
          console.log(`✅ Certificate attached as ${isPDF ? 'PDF' : 'PNG'}`);
          break; // Successfully attached, exit loop
        } else {
          console.warn(`❌ Gateway returned status ${response.status}: ${gateway}`);
        }
      } catch (err) {
        console.warn(`❌ Failed to fetch from gateway: ${err.message}`);
        // Continue to next gateway
      }
    }

    if (!certificateAttached) {
      console.error('⚠️ WARNING: Could not attach certificate from any IPFS gateway!');
    }

    const mailOptions = {
      from: `"ConfCert" <${process.env.ZOHO_EMAIL_USER}>`,
      to,
      subject: `Certificate Issued: ${studentName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #2563eb; margin: 0;">🎓 Certificate Issued</h2>
            <p style="color: #6b7280; margin: 5px 0;">Your blockchain-verified certificate is ready</p>
          </div>

          <p>Dear <strong>${studentName}</strong>,</p>

          <p>Congratulations! Your certificate has been successfully issued and registered on the blockchain.</p>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Certificate Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Certificate ID:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${certificateId}</code></li>
              <li style="margin-bottom: 10px;"><strong>Issuer Address:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace; word-break: break-all;">${issuerAddress}</code></li>
              <li style="margin-bottom: 10px;"><strong>Transaction:</strong> <a href="https://sepolia.etherscan.io/tx/${transactionHash}" style="color: #2563eb; text-decoration: underline;">View on Etherscan</a></li>
              <li><strong>Verification Link:</strong> <a href="${verificationLink}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${verificationLink}</a></li>
            </ul>
          </div>

          <div style="text-align: center; margin: 20px 0; padding: 20px; border: 2px dashed #2563eb; border-radius: 8px; background-color: #eff6ff;">
            <p style="margin: 0; color: #1e40af; font-size: 16px;">
              📎 <strong>Your certificate is attached to this email as a PDF</strong>
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            This certificate is permanently stored on IPFS and verified on the Ethereum blockchain, ensuring its authenticity and immutability.
          </p>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280;">
              Regards,<br/>
              <strong style="color: #2563eb;">ConfCert Team</strong>
            </p>
          </div>
        </div>
      `,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk certificates with batching and rate limiting
 * Best practices implemented:
 * - Batch processing to reduce memory usage
 * - Rate limiting to avoid spam filters
 * - Delay between batches
 * - Individual error handling per email
 * - Automatic batch size optimization
 * 
 * @param {Array} certificates - Array of certificate objects
 * @param {Object} options - Configuration options
 * @returns {Object} Results with success/failure counts
 */
export const sendBulkCertificateEmails = async (certificates, options = {}) => {
  // Use optimal batch size if not specified
  const defaultBatchSize = getOptimalBatchSize(certificates.length);
  
  const {
    batchSize = defaultBatchSize,
    batchDelay = emailConfig.bulk.batchDelay,
    emailDelay = emailConfig.bulk.emailDelay,
    issuerAddress,
    transactionHash,
  } = options;

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  // Log estimated time
  const estimate = estimateBulkEmailTime(certificates.length, batchSize);
  console.log(`📧 Starting bulk email send for ${certificates.length} certificates`);
  console.log(`⚙️ Configuration: ${batchSize} emails/batch, ${batchDelay}ms batch delay, ${emailDelay}ms email delay`);
  console.log(`⏱️  Estimated time: ${estimate.estimatedTime} (${estimate.batches} batches)`);

  // Process certificates in batches
  for (let i = 0; i < certificates.length; i += batchSize) {
    const batch = certificates.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(certificates.length / batchSize);

    console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);

    // Process each email in the batch
    for (let j = 0; j < batch.length; j++) {
      const cert = batch[j];
      const globalIndex = i + j;
      
      try {
        // Skip if no email provided
        if (!cert.email || !cert.email.trim()) {
          results.push({
            index: globalIndex,
            studentName: cert.studentName,
            email: cert.email,
            success: false,
            error: 'No email provided'
          });
          failureCount++;
          continue;
        }

        console.log(`  [${globalIndex + 1}/${certificates.length}] Sending to ${cert.email}...`);

        // Send email
        const emailResult = await sendCertificateEmailFunction({
          to: cert.email,
          studentName: cert.studentName,
          certificateId: cert.certificateId,
          ipfsHash: cert.ipfsHash,
          issuerAddress: issuerAddress,
          transactionHash: transactionHash,
          pinataUrl: cert.pinataUrl,
        });

        results.push({
          index: globalIndex,
          studentName: cert.studentName,
          email: cert.email,
          ...emailResult
        });

        if (emailResult.success) {
          successCount++;
          console.log(`  ✅ Sent successfully`);
        } else {
          failureCount++;
          console.log(`  ❌ Failed: ${emailResult.error}`);
        }

        // Add delay between individual emails within the batch
        if (j < batch.length - 1) {
          await delay(emailDelay);
        }

      } catch (error) {
        console.error(`  ❌ Error sending to ${cert.email}:`, error.message);
        results.push({
          index: globalIndex,
          studentName: cert.studentName,
          email: cert.email,
          success: false,
          error: error.message
        });
        failureCount++;
      }
    }

    // Add delay between batches (except after the last batch)
    if (i + batchSize < certificates.length) {
      console.log(`\n⏳ Waiting ${batchDelay}ms before next batch...`);
      await delay(batchDelay);
    }
  }

  console.log(`\n✨ Bulk email send complete:`);
  console.log(`   ✅ Success: ${successCount}/${certificates.length}`);
  console.log(`   ❌ Failed: ${failureCount}/${certificates.length}`);

  return {
    success: true,
    total: certificates.length,
    successCount,
    failureCount,
    results
  };
}