import FormData from 'form-data';
import axios from 'axios';
import sharp from 'sharp';
import { PDFDocument } from 'pdf-lib';

/**
 * IPFS Utility Functions
 * Handles uploading certificate images to IPFS using Pinata service
 */

/**
 * Compress PDF to target size (200KB)
 * @param {Buffer} pdfBuffer - Original PDF buffer
 * @returns {Promise<Buffer>} Compressed PDF buffer
 */
async function compressPDF(pdfBuffer) {
  try {
    const targetSize = 200 * 1024; // 200KB
    
    // If already under 200KB, return as is
    if (pdfBuffer.length <= targetSize) {
      console.log(`✅ PDF size ${(pdfBuffer.length / 1024).toFixed(2)}KB - no compression needed`);
      return pdfBuffer;
    }

    console.log(`📦 Compressing PDF from ${(pdfBuffer.length / 1024).toFixed(2)}KB to ~200KB...`);

    // Load the PDF
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Try to compress by removing metadata and optimizing
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    
    // Save with compression
    const compressedPdf = await pdfDoc.save({
      useObjectStreams: false,
      addDefaultPage: false,
    });

    const compressedBuffer = Buffer.from(compressedPdf);
    
    console.log(`✅ PDF compressed to ${(compressedBuffer.length / 1024).toFixed(2)}KB`);
    
    return compressedBuffer;

  } catch (error) {
    console.error('PDF compression error:', error);
    // If compression fails, return original
    return pdfBuffer;
  }
}

/**
 * Compress image to target size (200KB)
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {string} mimeType - Image MIME type
 * @returns {Promise<Buffer>} Compressed image buffer
 */
async function compressImage(imageBuffer, mimeType) {
  try {
    const targetSize = 200 * 1024; // 200KB
    
    // If already under 200KB, return as is
    if (imageBuffer.length <= targetSize) {
      console.log(`✅ Image size ${(imageBuffer.length / 1024).toFixed(2)}KB - no compression needed`);
      return imageBuffer;
    }

    console.log(`📦 Compressing image from ${(imageBuffer.length / 1024).toFixed(2)}KB to ~200KB...`);

    // Start with quality 85 and reduce until we hit target size
    let quality = 85;
    let compressedBuffer = imageBuffer;
    
    while (quality > 20 && compressedBuffer.length > targetSize) {
      const format = mimeType.includes('png') ? 'png' : 'jpeg';
      
      const sharpInstance = sharp(imageBuffer);
      
      if (format === 'jpeg') {
        compressedBuffer = await sharpInstance
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      } else {
        compressedBuffer = await sharpInstance
          .png({ quality, compressionLevel: 9 })
          .toBuffer();
      }
      
      quality -= 5;
    }

    console.log(`✅ Image compressed to ${(compressedBuffer.length / 1024).toFixed(2)}KB (quality: ${quality + 5}%)`);
    
    return compressedBuffer;

  } catch (error) {
    console.error('Image compression error:', error);
    // If compression fails, return original
    return imageBuffer;
  }
}

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

    // Check file size (max 10MB for upload, will compress if needed)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (fileBuffer.length > maxSize) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type (images and PDFs)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(mimeType)) {
      throw new Error('Invalid file type. Only JPEG, PNG, and PDF are allowed');
    }

    // Compress file if larger than 200KB
    let processedBuffer = fileBuffer;
    if (mimeType === 'application/pdf') {
      processedBuffer = await compressPDF(fileBuffer);
    } else if (mimeType.startsWith('image/')) {
      processedBuffer = await compressImage(fileBuffer, mimeType);
    }

    // Create FormData
    const formData = new FormData();
    formData.append('file', processedBuffer, {
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

    // Upload to Pinata using axios
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PINATA_JWT}`,
          ...formData.getHeaders()
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      }
    );

    const data = response.data;

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