
import nodemailer from "nodemailer";
import { emailConfig, getOptimalBatchSize, estimateBulkEmailTime } from "../config/email.config.js";

/**
 * Helper function to delay execution
 * @param {number} ms - milliseconds to delay
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * ✅ ZeptoMail SMTP configuration
 * - STARTTLS on port 587
 * - Uses ZeptoMail API Key
 */
const transporter = nodemailer.createTransport({
  host: 'smtp.zeptomail.in',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: 'emailapikey',
    pass: process.env.ZEPTO_EMAIL_PASS, // ZeptoMail API Key
  },
});

// ✅ Verify SMTP on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('ZeptoMail SMTP verification failed:', error);
  } else {
    console.log('ZeptoMail SMTP server ready');
  }
});

export const sendCertificateEmailFunction= async ({
  to,
  studentName,
  certificateId
}) => {
  try {
    const verificationLink =
      `${process.env.BASE_URL}/verify?certificateid=${certificateId}`;

    const mailOptions = {
      from: '"ConfCert" <noreply@confcert.in>',
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

          <div style="text-align: center; margin: 30px 0; padding: 30px; border: 2px solid #2563eb; border-radius: 8px; background-color: #eff6ff;">
            <p style="margin: 0 0 20px 0; color: #1e40af; font-size: 18px; font-weight: bold;">
              🔗 View and Download Your Certificate
            </p>
            <a href="${verificationLink}" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 16px;">View and Download Certificate</a>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <p style="margin: 0 0 10px 0; color: #374151; font-size: 14px;">
              💡 <strong>Tip:</strong> You can login to your student account at <a href="${process.env.BASE_URL}/login" style="color: #2563eb; text-decoration: underline;">${process.env.BASE_URL}/login</a> to view all your certificates in one place.
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            This certificate is permanently stored on IPFS and verified on the Ethereum blockchain.
          </p>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; color: #6b7280;">
              Regards,<br/>
              <strong style="color: #2563eb;">ConfCert Team</strong>
            </p>
          </div>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk certificates with optimized batching
 * - If less than 5 emails: send all at once in parallel
 * - If 5+ emails: use dynamic batching with minimal delays
 * - No delays between individual emails for faster processing
 * - Parallel processing within batches
 * 
 * @param {Array} certificates - Array of certificate objects
 * @param {Object} options - Configuration options
 * @returns {Object} Results with success/failure counts
 */
export const sendBulkCertificateEmails = async (certificates, options = {}) => {
  const {
    issuerAddress,
    transactionHash,
  } = options;

  const results = [];
  let successCount = 0;
  let failureCount = 0;

  console.log(`📧 Starting bulk email send for ${certificates.length} certificates`);

  // If less than 5 emails, send all at once in parallel
  if (certificates.length < 5) {
    console.log(`⚡ Sending all ${certificates.length} emails in parallel...`);
    
    const emailPromises = certificates.map(async (cert, index) => {
      try {
        if (!cert.email || !cert.email.trim()) {
          return {
            index,
            studentName: cert.studentName,
            email: cert.email,
            success: false,
            error: 'No email provided'
          };
        }

        console.log(`  [${index + 1}/${certificates.length}] Sending to ${cert.email}...`);

        const emailResult = await sendCertificateEmailFunction({
          to: cert.email,
          studentName: cert.studentName,
          certificateId: cert.certificateId,
          ipfsHash: cert.ipfsHash,
          issuerAddress: issuerAddress,
          transactionHash: transactionHash,
          pinataUrl: cert.pinataUrl,
        });

        if (emailResult.success) {
          console.log(`  ✅ [${index + 1}] Sent successfully`);
        } else {
          console.log(`  ❌ [${index + 1}] Failed: ${emailResult.error}`);
        }

        return {
          index,
          studentName: cert.studentName,
          email: cert.email,
          ...emailResult
        };
      } catch (error) {
        console.error(`  ❌ Error sending to ${cert.email}:`, error.message);
        return {
          index,
          studentName: cert.studentName,
          email: cert.email,
          success: false,
          error: error.message
        };
      }
    });

    const allResults = await Promise.all(emailPromises);
    results.push(...allResults);
    successCount = allResults.filter(r => r.success).length;
    failureCount = allResults.filter(r => !r.success).length;

  } else {
    // For 5+ emails, use dynamic batching
    const batchSize = Math.min(10, Math.ceil(certificates.length / 5)); // Dynamic batch size
    const totalBatches = Math.ceil(certificates.length / batchSize);
    
    console.log(`⚙️ Using batched processing: ${batchSize} emails/batch (${totalBatches} batches)`);

    for (let i = 0; i < certificates.length; i += batchSize) {
      const batch = certificates.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`\n📦 Processing batch ${batchNumber}/${totalBatches} (${batch.length} emails)`);

      // Process batch in parallel
      const batchPromises = batch.map(async (cert, j) => {
        const globalIndex = i + j;
        
        try {
          if (!cert.email || !cert.email.trim()) {
            return {
              index: globalIndex,
              studentName: cert.studentName,
              email: cert.email,
              success: false,
              error: 'No email provided'
            };
          }

          console.log(`  [${globalIndex + 1}/${certificates.length}] Sending to ${cert.email}...`);

          const emailResult = await sendCertificateEmailFunction({
            to: cert.email,
            studentName: cert.studentName,
            certificateId: cert.certificateId,
            ipfsHash: cert.ipfsHash,
            issuerAddress: issuerAddress,
            transactionHash: transactionHash,
            pinataUrl: cert.pinataUrl,
          });

          if (emailResult.success) {
            console.log(`  ✅ [${globalIndex + 1}] Sent successfully`);
          } else {
            console.log(`  ❌ [${globalIndex + 1}] Failed: ${emailResult.error}`);
          }

          return {
            index: globalIndex,
            studentName: cert.studentName,
            email: cert.email,
            ...emailResult
          };
        } catch (error) {
          console.error(`  ❌ Error sending to ${cert.email}:`, error.message);
          return {
            index: globalIndex,
            studentName: cert.studentName,
            email: cert.email,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      const batchSuccess = batchResults.filter(r => r.success).length;
      const batchFailed = batchResults.filter(r => !r.success).length;
      successCount += batchSuccess;
      failureCount += batchFailed;

      // Small delay between batches to avoid rate limiting (except last batch)
      if (i + batchSize < certificates.length) {
        await delay(1000); // 1 second delay between batches
      }
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