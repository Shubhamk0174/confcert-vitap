/**
 * Client-side file compression utilities
 * Compresses PDFs and images to ~200KB before upload
 */

import { jsPDF } from 'jspdf';

/**
 * Compress an image to target size
 * @param {File|Blob} file - Image file
 * @param {number} targetSize - Target size in KB (default: 200)
 * @returns {Promise<Blob>} Compressed image blob
 */
export async function compressImage(file, targetSize = 200) {
  const targetBytes = targetSize * 1024;
  
  // If already under target, return as is
  if (file.size <= targetBytes) {
    console.log(`✅ Image size ${(file.size / 1024).toFixed(2)}KB - no compression needed`);
    return file;
  }

  console.log(`📦 Compressing image from ${(file.size / 1024).toFixed(2)}KB to ~${targetSize}KB...`);

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = async () => {
        try {
          // Start with quality 0.9 and reduce until we hit target
          let quality = 0.9;
          let blob = file;

          while (quality > 0.3 && blob.size > targetBytes) {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, img.width, img.height);

            // Convert to blob with reduced quality
            blob = await new Promise((res) => {
              canvas.toBlob((b) => res(b), 'image/jpeg', quality);
            });

            quality -= 0.05;
          }

          console.log(`✅ Image compressed to ${(blob.size / 1024).toFixed(2)}KB (quality: ${(quality + 0.05).toFixed(2)})`);
          resolve(blob);
        } catch (err) {
          console.error('Image compression error:', err);
          resolve(file); // Return original on error
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress a PDF to target size
 * @param {File|Blob} file - PDF file
 * @param {number} targetSize - Target size in KB (default: 200)
 * @returns {Promise<Blob>} Compressed PDF blob
 */
export async function compressPDF(file, targetSize = 200) {
  const targetBytes = targetSize * 1024;
  
  // If already under target, return as is
  if (file.size <= targetBytes) {
    console.log(`✅ PDF size ${(file.size / 1024).toFixed(2)}KB - no compression needed`);
    return file;
  }

  console.log(`📦 Compressing PDF from ${(file.size / 1024).toFixed(2)}KB to ~${targetSize}KB...`);

  try {
    // Convert PDF to image and then back to PDF with compression
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          // Create a new PDF from the original
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'px',
            format: [1200, 848], // Standard certificate size
            compress: true
          });

          // Load PDF as image
          const img = new Image();
          img.onload = async () => {
            // Calculate dimensions to fit page
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            // Start with quality 0.7 for PDFs
            let quality = 0.7;
            let compressedBlob = file;

            while (quality > 0.3 && compressedBlob.size > targetBytes) {
              // Create canvas with image
              const canvas = document.createElement('canvas');
              canvas.width = img.width;
              canvas.height = img.height;
              const ctx = canvas.getContext('2d');
              ctx.drawImage(img, 0, 0);

              // Convert to compressed JPEG
              const imageDataUrl = canvas.toDataURL('image/jpeg', quality);
              
              // Create new PDF with compressed image
              const newPdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [1200, 848],
                compress: true
              });

              newPdf.addImage(imageDataUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
              compressedBlob = newPdf.output('blob');
              
              quality -= 0.05;
            }

            console.log(`✅ PDF compressed to ${(compressedBlob.size / 1024).toFixed(2)}KB (quality: ${(quality + 0.05).toFixed(2)})`);
            resolve(compressedBlob);
          };

          img.onerror = () => {
            console.warn('Could not load PDF as image, returning original');
            resolve(file);
          };

          // Try to load PDF as data URL (works if PDF is simple)
          img.src = e.target.result;
        } catch (err) {
          console.error('PDF compression error:', err);
          resolve(file); // Return original on error
        }
      };

      reader.onerror = () => {
        console.error('Failed to read PDF file');
        resolve(file);
      };

      reader.readAsDataURL(file);
    });
  } catch (err) {
    console.error('PDF compression error:', err);
    return file; // Return original on error
  }
}

/**
 * Compress a file (auto-detect type)
 * @param {File|Blob} file - File to compress
 * @param {number} targetSize - Target size in KB (default: 200)
 * @returns {Promise<Blob>} Compressed file blob
 */
export async function compressFile(file, targetSize = 200) {
  if (!file) return null;

  const fileType = file.type || '';

  // Check if compression is needed
  const targetBytes = targetSize * 1024;
  if (file.size <= targetBytes) {
    console.log(`✅ File size ${(file.size / 1024).toFixed(2)}KB - no compression needed`);
    return file;
  }

  console.log(`📦 Starting compression for ${fileType}...`);

  try {
    if (fileType.includes('image')) {
      return await compressImage(file, targetSize);
    } else if (fileType.includes('pdf')) {
      return await compressPDF(file, targetSize);
    } else {
      console.warn(`Unsupported file type: ${fileType}`);
      return file;
    }
  } catch (err) {
    console.error('Compression failed:', err);
    return file; // Return original on error
  }
}

/**
 * Compress multiple files in parallel
 * @param {Array<File|Blob>} files - Array of files
 * @param {number} targetSize - Target size in KB (default: 200)
 * @returns {Promise<Array<Blob>>} Array of compressed files
 */
export async function compressFiles(files, targetSize = 200) {
  if (!files || files.length === 0) return [];

  console.log(`📦 Compressing ${files.length} files...`);
  
  const compressionPromises = files.map((file, index) => 
    compressFile(file, targetSize).catch(err => {
      console.error(`Failed to compress file ${index + 1}:`, err);
      return file; // Return original on error
    })
  );

  const compressed = await Promise.all(compressionPromises);
  
  const totalOriginal = files.reduce((sum, f) => sum + f.size, 0);
  const totalCompressed = compressed.reduce((sum, f) => sum + f.size, 0);
  
  console.log(`✅ Compression complete:`);
  console.log(`   Original: ${(totalOriginal / 1024).toFixed(2)}KB`);
  console.log(`   Compressed: ${(totalCompressed / 1024).toFixed(2)}KB`);
  console.log(`   Saved: ${((totalOriginal - totalCompressed) / 1024).toFixed(2)}KB`);

  return compressed;
}
