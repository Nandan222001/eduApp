#!/usr/bin/env node

/**
 * Check for OTA updates script
 * Useful for testing update deployments
 */

const { execSync } = require('child_process');

function exec(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    return null;
  }
}

console.log('🔍 Checking for OTA updates...\n');

const channel = process.argv[2] || 'production';

console.log(`Channel: ${channel}\n`);

try {
  const result = exec(`eas update:list --branch ${channel} --json`);

  if (result) {
    const updates = JSON.parse(result);

    if (updates && updates.length > 0) {
      console.log(`✅ Found ${updates.length} update(s) on ${channel} channel\n`);

      console.log('Recent updates:');
      updates.slice(0, 5).forEach((update, index) => {
        console.log(`\n${index + 1}. Update ID: ${update.id}`);
        console.log(`   Message: ${update.message || 'No message'}`);
        console.log(`   Created: ${update.createdAt}`);
        console.log(`   Platform: ${update.platform || 'all'}`);
      });
    } else {
      console.log(`⚠️  No updates found on ${channel} channel`);
    }
  } else {
    console.log('⚠️  Failed to fetch updates');
  }
} catch (error) {
  console.error('❌ Error checking updates:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50) + '\n');
