/**
 * Test script for bulk email configuration
 * Run this to verify your email settings are correct
 * 
 * Usage: node test-bulk-email-config.js
 */

import { emailConfig, getOptimalBatchSize, estimateBulkEmailTime } from './src/config/email.config.js';

console.log('📧 Bulk Email Configuration Test\n');
console.log('═══════════════════════════════════════════════════════\n');

// Test 1: Configuration values
console.log('✅ Current Configuration:');
console.log('─────────────────────────────────────────────────────');
console.log(`   Batch Size:   ${emailConfig.bulk.batchSize} emails/batch`);
console.log(`   Batch Delay:  ${emailConfig.bulk.batchDelay}ms (${emailConfig.bulk.batchDelay / 1000}s)`);
console.log(`   Email Delay:  ${emailConfig.bulk.emailDelay}ms`);
console.log(`   Hourly Limit: ${emailConfig.limits.hourly} emails/hour`);
console.log(`   Daily Limit:  ${emailConfig.limits.daily} emails/day`);
console.log();

// Test 2: Batch size optimization
console.log('✅ Automatic Batch Size Optimization:');
console.log('─────────────────────────────────────────────────────');
const testCounts = [5, 10, 25, 50, 100, 200, 500];
testCounts.forEach(count => {
  const batchSize = getOptimalBatchSize(count);
  const batches = Math.ceil(count / batchSize);
  console.log(`   ${count.toString().padStart(3)} emails → ${batchSize.toString().padStart(2)} per batch (${batches} batches)`);
});
console.log();

// Test 3: Time estimates
console.log('✅ Estimated Completion Times:');
console.log('─────────────────────────────────────────────────────');
testCounts.forEach(count => {
  const estimate = estimateBulkEmailTime(count);
  console.log(`   ${count.toString().padStart(3)} emails → ${estimate.estimatedTime.padEnd(20)} (${estimate.batches} batches @ ${estimate.batchSize}/batch)`);
});
console.log();

// Test 4: Provider recommendations
console.log('✅ Provider-Specific Recommendations:');
console.log('─────────────────────────────────────────────────────');
const providers = [
  { name: 'Zoho Free', limit: 500, recommended: '50-100/hour' },
  { name: 'Zoho Paid', limit: 5000, recommended: '200-500/hour' },
  { name: 'Gmail Free', limit: 500, recommended: '50-100/hour' },
  { name: 'Gmail Workspace', limit: 2000, recommended: '100-200/hour' },
  { name: 'SendGrid/Mailgun', limit: 100000, recommended: '1000+/hour' },
];

providers.forEach(provider => {
  const hourlyRate = Math.floor(emailConfig.limits.hourly);
  const status = hourlyRate <= parseInt(provider.recommended.split('-')[0].replace(/[^\d]/g, '')) ? '✅' : '⚠️';
  console.log(`   ${status} ${provider.name.padEnd(18)} (${provider.limit}/day) - Recommended: ${provider.recommended}`);
});
console.log();

// Test 5: Safety checks
console.log('✅ Safety Checks:');
console.log('─────────────────────────────────────────────────────');

const checks = [
  {
    name: 'Batch delay is >= 1000ms',
    pass: emailConfig.bulk.batchDelay >= 1000,
    message: 'Prevents rapid sequential batches'
  },
  {
    name: 'Email delay is >= 100ms',
    pass: emailConfig.bulk.emailDelay >= 100,
    message: 'Prevents rapid fire emails'
  },
  {
    name: 'Batch size is <= 50',
    pass: emailConfig.bulk.batchSize <= 50,
    message: 'Keeps batches manageable'
  },
  {
    name: 'Hourly limit is reasonable',
    pass: emailConfig.limits.hourly <= 200,
    message: 'Prevents spam detection'
  },
];

checks.forEach(check => {
  const icon = check.pass ? '✅' : '❌';
  console.log(`   ${icon} ${check.name}`);
  if (!check.pass) {
    console.log(`      Warning: ${check.message}`);
  }
});
console.log();

// Test 6: Example scenarios
console.log('✅ Example Scenarios:');
console.log('─────────────────────────────────────────────────────');
console.log('   Scenario 1: Conference with 50 attendees');
const scenario1 = estimateBulkEmailTime(50);
console.log(`   → Time needed: ${scenario1.estimatedTime}`);
console.log(`   → ${scenario1.batches} batches of ${scenario1.batchSize} emails`);
console.log();

console.log('   Scenario 2: Large event with 200 attendees');
const scenario2 = estimateBulkEmailTime(200);
console.log(`   → Time needed: ${scenario2.estimatedTime}`);
console.log(`   → ${scenario2.batches} batches of ${scenario2.batchSize} emails`);
console.log();

console.log('   Scenario 3: Multiple events (500 total)');
const scenario3 = estimateBulkEmailTime(500);
console.log(`   → Time needed: ${scenario3.estimatedTime}`);
console.log(`   → ${scenario3.batches} batches of ${scenario3.batchSize} emails`);
console.log();

console.log('═══════════════════════════════════════════════════════');
console.log('✨ Configuration test complete!');
console.log();
console.log('💡 Tips:');
console.log('   • Start with small test batches (5-10 emails)');
console.log('   • Monitor spam folder for deliverability');
console.log('   • Adjust settings in src/config/email.config.js');
console.log('   • Check provider-specific limits before large sends');
console.log();
