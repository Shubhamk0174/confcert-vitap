/**
 * Certificate Issuance Helper Functions
 * Handles certificate creation and API calls to backend
 */

import axiosClient from './axiosClient';

/**
 * Issue a single certificate via backend API
 * This function handles everything: IPFS upload, blockchain issuance, and email sending
 * 
 * @param {Blob|File} certificateFile - The certificate image file
 * @param {string} studentName - Name of the student
 * @param {string} regNo - Registration number of the student
 * @param {string} email - Student's email (optional if sendEmail is false)
 * @param {boolean} sendEmail - Whether to send email notification
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function issueCertificate(certificateFile, studentName, regNo, email = '', sendEmail = false) {
  try {
    const formData = new FormData();
    formData.append('file', certificateFile);
    formData.append('studentName', studentName);
    formData.append('regNo', regNo);
    formData.append('email', email);
    formData.append('sendEmail', sendEmail.toString());

    const response = await axiosClient.post('/api/certificate/issue-certificate', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to issue certificate',
      };
    }
  } catch (error) {
    console.error('Issue Certificate Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to issue certificate',
    };
  }
}

/**
 * Issue multiple certificates in bulk via backend API
 * This function handles everything: IPFS uploads, blockchain bulk issuance, and email sending
 * 
 * @param {Array<Blob|File>} certificateFiles - Array of certificate image files
 * @param {Array<string>} studentNames - Array of student names
 * @param {Array<string>} regNos - Array of registration numbers
 * @param {Array<string>} emails - Array of student emails
 * @param {boolean} sendEmail - Whether to send email notifications
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
export async function bulkIssueCertificates(certificateFiles, studentNames, regNos, emails = [], sendEmail = false) {
  try {
    if (certificateFiles.length !== studentNames.length) {
      throw new Error('Number of files must match number of student names');
    }

    if (certificateFiles.length !== regNos.length) {
      throw new Error('Number of files must match number of registration numbers');
    }

    if (sendEmail && emails.length !== studentNames.length) {
      throw new Error('Number of emails must match number of student names when sendEmail is enabled');
    }

    const formData = new FormData();
    
    // Append all files
    certificateFiles.forEach((file) => {
      formData.append('files', file);
    });
    
    // Append student names, regNos, and emails as JSON strings
    formData.append('studentNames', JSON.stringify(studentNames));
    formData.append('regNos', JSON.stringify(regNos));
    formData.append('emails', JSON.stringify(emails));
    formData.append('sendEmail', sendEmail.toString());

    const response = await axiosClient.post('/api/certificate/bulk-issue-certificates', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (response.data.success) {
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Failed to issue certificates in bulk',
      };
    }
  } catch (error) {
    console.error('Bulk Issue Certificates Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to issue certificates in bulk',
    };
  }
}

/**
 * Get certificate details from backend
 * @param {number} certificateId - The certificate ID
 * @returns {Promise<{success: boolean, certificate?: object, error?: string}>}
 */
export async function getCertificate(certificateId) {
  try {
    const response = await axiosClient.get(`/api/certificate/get-certificate/${certificateId}`);
    
    if (response.data.success) {
      return {
        success: true,
        certificate: response.data.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Certificate not found',
      };
    }
  } catch (error) {
    console.error('Get Certificate Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to get certificate',
    };
  }
}

/**
 * Verify certificate exists on blockchain via backend
 * @param {number} certificateId - The certificate ID
 * @returns {Promise<{success: boolean, exists?: boolean, error?: string}>}
 */
export async function verifyCertificate(certificateId) {
  try {
    const response = await axiosClient.get(`/api/certificate/verify-certificate/${certificateId}`);
    
    if (response.data.success) {
      return {
        success: true,
        exists: response.data.data.exists,
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Verification failed',
      };
    }
  } catch (error) {
    console.error('Verify Certificate Error:', error);
    return {
      success: false,
      error: error.response?.data?.message || error.message || 'Failed to verify certificate',
    };
  }
}
