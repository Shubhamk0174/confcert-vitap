/**
 * Test Web3 Connection
 * Run this to verify blockchain connectivity
 */

import { getCertificate, getCurrentCounter, verifyCertificate } from '../lib/web3.js';

async function testWeb3Connection() {
  console.log('🧪 Testing Web3 Connection...\n');

  // Test 1: Get current counter
  console.log('Test 1: Get Certificate Counter');
  try {
    const counterResult = await getCurrentCounter();
    if (counterResult.success) {
      console.log('✅ SUCCESS - Counter:', counterResult.count);
    } else {
      console.log('❌ FAILED - Error:', counterResult.error);
    }
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
  }
  console.log('');

  // Test 2: Verify certificate
  console.log('Test 2: Verify Certificate (ID: 1001)');
  try {
    const verifyResult = await verifyCertificate(1001);
    if (verifyResult.success) {
      console.log('✅ SUCCESS - Exists:', verifyResult.exists);
    } else {
      console.log('❌ FAILED - Error:', verifyResult.error);
    }
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
  }
  console.log('');

  // Test 3: Get certificate details
  console.log('Test 3: Get Certificate Details (ID: 1001)');
  try {
    const certResult = await getCertificate(1001);
    if (certResult.success) {
      console.log('✅ SUCCESS - Certificate:', certResult.certificate);
    } else {
      console.log('❌ FAILED - Error:', certResult.error);
    }
  } catch (error) {
    console.log('❌ EXCEPTION:', error.message);
  }

  console.log('\n🏁 Tests Complete');
}

// Run tests
testWeb3Connection();
