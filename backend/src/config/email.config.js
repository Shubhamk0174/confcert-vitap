/**
 * Email Service Configuration
 * 
 * Batch and rate limiting settings to prevent spam detection
 * and ensure reliable email delivery
 */

export const emailConfig = {
  // Bulk email settings
  bulk: {
    batchSize: 10,          // Number of emails to send per batch
    batchDelay: 2000,       // Delay between batches in milliseconds (2 seconds)
    emailDelay: 200,        // Delay between individual emails in milliseconds (200ms)
  },

  // SMTP provider limits (adjust based on your provider)
  // Zoho Free: ~500 emails/day, recommended: 50-100/hour
  // Zoho Paid: ~5000-10000 emails/day
  limits: {
    hourly: 100,            // Maximum emails per hour
    daily: 500,             // Maximum emails per day
  },

  // Retry settings for failed emails
  retry: {
    maxAttempts: 3,         // Maximum retry attempts for failed emails
    retryDelay: 5000,       // Delay before retry in milliseconds (5 seconds)
  },

  // Email content settings
  content: {
    maxAttachmentSize: 5 * 1024 * 1024,  // 5MB max attachment size
    timeout: 30000,                       // 30 second timeout for email sending
  },
};

/**
 * Get batch size based on total emails
 * Automatically adjusts batch size for better performance
 */
export const getOptimalBatchSize = (totalEmails) => {
  if (totalEmails <= 10) return 5;      // Small batch: 5 emails at a time
  if (totalEmails <= 50) return 10;     // Medium batch: 10 emails at a time
  if (totalEmails <= 200) return 15;    // Large batch: 15 emails at a time
  return 20;                             // Very large batch: 20 emails at a time
};

/**
 * Calculate estimated time for bulk email sending
 */
export const estimateBulkEmailTime = (totalEmails, batchSize = null) => {
  const effectiveBatchSize = batchSize || getOptimalBatchSize(totalEmails);
  const batches = Math.ceil(totalEmails / effectiveBatchSize);
  
  // Time = (emails * emailDelay) + (batches * batchDelay) + processing overhead
  const emailTime = totalEmails * emailConfig.bulk.emailDelay;
  const batchTime = (batches - 1) * emailConfig.bulk.batchDelay; // No delay after last batch
  const overhead = totalEmails * 500; // ~500ms per email for processing
  
  const totalMs = emailTime + batchTime + overhead;
  const totalSeconds = Math.ceil(totalMs / 1000);
  
  return {
    totalMs,
    totalSeconds,
    batches,
    batchSize: effectiveBatchSize,
    estimatedTime: formatDuration(totalSeconds),
  };
};

/**
 * Format duration in human-readable format
 */
const formatDuration = (seconds) => {
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 
    ? `${minutes} min ${remainingSeconds} sec`
    : `${minutes} min`;
};
