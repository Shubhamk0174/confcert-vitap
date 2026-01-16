# Bulk Email System Documentation

## Overview

The bulk certificate email system is designed to send certificates efficiently while avoiding spam filters and ensuring reliable delivery. It implements industry best practices for bulk email sending.

## Key Features

### 1. **Batch Processing**
- Emails are sent in configurable batches (default: automatically optimized based on total count)
- Reduces memory usage and system load
- Allows for better error handling and recovery

### 2. **Rate Limiting**
- Automatic delays between emails and batches
- Prevents triggering spam filters
- Respects email provider limits

### 3. **Automatic Optimization**
- Batch size automatically adjusts based on total email count:
  - ≤10 emails: 5 emails/batch
  - ≤50 emails: 10 emails/batch
  - ≤200 emails: 15 emails/batch
  - >200 emails: 20 emails/batch

### 4. **Individual Error Handling**
- Each email is processed independently
- Failed emails don't stop the entire batch
- Detailed results for each recipient

### 5. **Progress Tracking**
- Real-time console logging
- Batch progress indicators
- Success/failure statistics

## Configuration

Edit [email.config.js](backend/src/config/email.config.js) to adjust settings:

```javascript
export const emailConfig = {
  bulk: {
    batchSize: 10,      // Emails per batch
    batchDelay: 2000,   // 2 seconds between batches
    emailDelay: 200,    // 200ms between emails
  },
  
  limits: {
    hourly: 100,        // Max emails per hour
    daily: 500,         // Max emails per day
  },
};
```

## Usage

### API Endpoint

**POST** `/api/certificate/bulk-issue`

#### Request (multipart/form-data):
- `files`: Array of certificate images
- `studentNames`: JSON array of student names
- `emails`: JSON array of email addresses
- `sendEmail`: Boolean ('true' or 'false')

#### Response:
```json
{
  "statusCode": 200,
  "data": {
    "count": 50,
    "transactionHash": "0x...",
    "issuerAddress": "0x...",
    "certificates": [...],
    "emailStats": {
      "total": 50,
      "sent": 48,
      "failed": 2
    }
  },
  "message": "Successfully issued 50 certificates"
}
```

## Best Practices

### 1. **Avoid Spam Filters**
- ✅ Use delays between emails
- ✅ Send in batches
- ✅ Use verified sender domain
- ✅ Include proper email headers
- ✅ Provide unsubscribe option (if applicable)
- ✅ Maintain good sender reputation

### 2. **Email Provider Limits**

#### Zoho Mail
- **Free**: ~500 emails/day, 50 recipients/email
- **Paid**: ~5,000-10,000 emails/day
- **Recommended**: 50-100 emails/hour

#### Gmail (SMTP)
- **Free**: 500 emails/day
- **Workspace**: 2,000 emails/day
- **Recommended**: 100 emails/hour

#### SendGrid/Mailgun (Professional)
- Much higher limits (10,000-100,000+/day)
- Better deliverability
- Advanced analytics

### 3. **Performance Tips**

#### Small Batches (< 50 emails)
```javascript
// Default settings work well
await sendBulkCertificateEmails(certificates, {
  issuerAddress,
  transactionHash,
});
```

#### Large Batches (> 200 emails)
```javascript
// Customize for your needs
await sendBulkCertificateEmails(certificates, {
  batchSize: 20,        // Larger batches
  batchDelay: 3000,     // Longer delays
  emailDelay: 150,      // Faster individual sends
  issuerAddress,
  transactionHash,
});
```

### 4. **Error Handling**

The system handles errors gracefully:
- Invalid emails are skipped
- Failed sends are logged
- Partial success is reported
- No transactions are rolled back

### 5. **Monitoring**

Console output provides detailed information:
```
📧 Starting bulk email send for 50 certificates
⚙️ Configuration: 10 emails/batch, 2000ms batch delay, 200ms email delay
⏱️  Estimated time: 1 min 45 sec (5 batches)

📦 Processing batch 1/5 (10 emails)
  [1/50] Sending to student1@example.com...
  ✅ Sent successfully
  [2/50] Sending to student2@example.com...
  ✅ Sent successfully
  ...

⏳ Waiting 2000ms before next batch...

✨ Bulk email send complete:
   ✅ Success: 48/50
   ❌ Failed: 2/50
```

## Time Estimates

The system calculates estimated completion time:

| Emails | Batch Size | Estimated Time |
|--------|-----------|----------------|
| 10     | 5         | ~15 seconds    |
| 50     | 10        | ~1.5 minutes   |
| 100    | 15        | ~3 minutes     |
| 200    | 15        | ~6 minutes     |
| 500    | 20        | ~15 minutes    |

*Actual time may vary based on network conditions and SMTP server response times.*

## Troubleshooting

### Emails Going to Spam
1. Verify your domain with SPF/DKIM records
2. Increase delays between batches
3. Reduce batch size
4. Use a dedicated email service provider
5. Check email content for spam triggers

### Slow Sending
1. Increase batch size
2. Reduce delays (carefully)
3. Use parallel processing (advanced)
4. Consider upgrading email service

### Rate Limit Errors
1. Reduce batch size
2. Increase batch delay
3. Check provider limits
4. Upgrade to higher tier

### Failed Sends
1. Check email validity
2. Verify SMTP credentials
3. Check network connectivity
4. Review error logs
5. Try manual test email

## Future Enhancements

- [ ] Retry mechanism for failed emails
- [ ] Email queue system with Redis
- [ ] Real-time progress via WebSocket
- [ ] Email templates with personalization
- [ ] A/B testing support
- [ ] Detailed analytics dashboard
- [ ] Webhook notifications on completion
- [ ] Scheduled bulk sending

## Security Considerations

1. **API Rate Limiting**: Implement rate limiting on the API endpoint
2. **Authentication**: Ensure only authorized users can send bulk emails
3. **Email Validation**: Validate all email addresses before sending
4. **Content Sanitization**: Prevent email injection attacks
5. **Logging**: Log all bulk send operations for auditing

## Related Files

- [issueCertificate.js](backend/src/controller/certificate/issueCertificate.js) - Main controller
- [sendCertificateEmail.js](backend/src/services/sendCertificateEmail.js) - Email service
- [email.config.js](backend/src/config/email.config.js) - Configuration
- [BULK_ISSUANCE_GUIDE.md](frontend/BULK_ISSUANCE_GUIDE.md) - Frontend guide
