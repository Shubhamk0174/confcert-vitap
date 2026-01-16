
import nodemailer from "nodemailer";

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
}) => {
  try {
    const verificationLink =
      `${process.env.BASE_URL}/verify?certificateid=${certificateId}`;

    const certificateLink = `https://ipfs.io/ipfs/${ipfsHash}`;

    let attachments = [];

    try {
      const response = await fetch(certificateLink);
      if (response.ok) {
        const buffer = await response.arrayBuffer();
        attachments.push({
          filename: 'certificate.png',
          content: Buffer.from(buffer),
          cid: 'certificateImage',
        });
      }
    } catch (err) {
      console.warn('Could not attach certificate image:', err.message);
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

          <p>Congratulations! Your certificate has been successfully issued and registered on the blockchain. Below is your certificate:</p>

          <div style="text-align: center; margin: 30px 0; padding: 20px; border: 2px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
            <img src="cid:certificateImage" alt="Certificate" style="max-width: 100%; height: auto; border-radius: 4px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);" />
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Certificate Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>Certificate ID:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace;">${certificateId}</code></li>
              <li style="margin-bottom: 10px;"><strong>Issuer Address:</strong> <code style="background-color: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-family: monospace; word-break: break-all;">${issuerAddress}</code></li>
              <li style="margin-bottom: 10px;"><strong>Transaction:</strong> <a href="https://sepolia.etherscan.io/tx/${transactionHash}" style="color: #2563eb; text-decoration: underline;">View on Etherscan</a></li>
              <li><strong>Verification Link:</strong> <a href="${verificationLink}" style="color: #2563eb; text-decoration: underline; word-break: break-all;">${verificationLink}</a></li>
            </ul>
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