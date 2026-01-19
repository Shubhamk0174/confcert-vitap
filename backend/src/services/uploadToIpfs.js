import FormData from 'form-data';

/**
 * IPFS Utility Functions
 * Handles uploading certificate images to IPFS using Pinata service
 * Note: Uses Node.js built-in fetch (available in Node 18+)
 */

/**
 * Upload a file to IPFS via Pinata
 * @param {Buffer} fileBuffer - The certificate image file buffer
 * @param {string} fileName - The name of the file
 * @param {string} mimeType - The MIME type of the file
 * @returns {Promise<{success: boolean, ipfsHash?: string, pinataUrl?: string, timestamp?: number, error?: string}>}
 */
export async function uploadToIPFS(fileBuffer, fileName, mimeType) {
  try {
    // Validate file
    if (!fileBuffer) {
      throw new Error('No file provided');
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type (images only)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/pdf'];
    if (!validTypes.includes(mimeType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed');
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename: fileName,
      contentType: mimeType
    });

    // Add metadata
    const metadata = JSON.stringify({
      name: fileName,
      keyvalues: {
        type: 'certificate',
        timestamp: Date.now().toString()
      }
    });
    formData.append('pinataMetadata', metadata);

    // Pinata options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    formData.append('pinataOptions', options);

    // Upload to Pinata
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PINATA_JWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(errorData.error);
      throw new Error(errorData.error || 'Failed to upload to IPFS');
    }

    const data = await response.json();

    return {
      success: true,
      ipfsHash: data.IpfsHash,
      pinataUrl: `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`,
      timestamp: data.Timestamp
    };

  } catch (error) {
    console.error('IPFS Upload Error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload to IPFS'
    };
  }
}