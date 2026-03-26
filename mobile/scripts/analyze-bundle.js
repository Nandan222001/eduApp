#!/usr/bin/env node

/**
 * Bundle Size Analysis Script
 * 
 * This script analyzes the web bundle after export and reports on:
 * - Total bundle size
 * - Individual chunk sizes
 * - Assets over size threshold
 * - Recommendations for optimization
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist');
const SIZE_THRESHOLD_MB = 2;
const SIZE_THRESHOLD_BYTES = SIZE_THRESHOLD_MB * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function getDirectorySize(dir) {
  let size = 0;
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      size += getDirectorySize(filePath);
    } else {
      size += stat.size;
    }
  }
  
  return size;
}

function analyzeBundle() {
  console.log('\n📊 Bundle Size Analysis\n');
  console.log('='.repeat(60));
  
  if (!fs.existsSync(DIST_DIR)) {
    console.log('❌ Error: dist directory not found');
    console.log('   Run "npx expo export --platform web" first');
    return;
  }
  
  // Get total size
  const totalSize = getDirectorySize(DIST_DIR);
  console.log(`\n📦 Total Bundle Size: ${formatBytes(totalSize)}`);
  
  // Analyze _expo directory (main bundle)
  const expoDir = path.join(DIST_DIR, '_expo');
  if (fs.existsSync(expoDir)) {
    const expoSize = getDirectorySize(expoDir);
    console.log(`   App Bundle: ${formatBytes(expoSize)}`);
  }
  
  // Analyze assets
  const assetsDir = path.join(DIST_DIR, 'assets');
  if (fs.existsSync(assetsDir)) {
    const assetsSize = getDirectorySize(assetsDir);
    console.log(`   Assets: ${formatBytes(assetsSize)}`);
  }
  
  // Find large files
  console.log('\n📄 Large Files:');
  console.log('-'.repeat(60));
  
  const largeFiles = [];
  
  function findLargeFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        findLargeFiles(filePath, path.join(prefix, file));
      } else if (stat.size > 100 * 1024) { // Files > 100KB
        largeFiles.push({
          path: path.join(prefix, file),
          size: stat.size,
        });
      }
    }
  }
  
  findLargeFiles(DIST_DIR);
  
  // Sort by size descending
  largeFiles.sort((a, b) => b.size - a.size);
  
  // Display top 20 large files
  largeFiles.slice(0, 20).forEach((file) => {
    console.log(`   ${formatBytes(file.size).padEnd(12)} ${file.path}`);
  });
  
  // Bundle size status
  console.log('\n🎯 Bundle Size Status:');
  console.log('-'.repeat(60));
  
  if (totalSize < SIZE_THRESHOLD_BYTES) {
    console.log(`   ✅ Bundle size is under ${SIZE_THRESHOLD_MB}MB threshold`);
    console.log(`   Remaining headroom: ${formatBytes(SIZE_THRESHOLD_BYTES - totalSize)}`);
  } else {
    console.log(`   ⚠️  Bundle size exceeds ${SIZE_THRESHOLD_MB}MB threshold!`);
    console.log(`   Over by: ${formatBytes(totalSize - SIZE_THRESHOLD_BYTES)}`);
  }
  
  // Check for specific heavy dependencies
  console.log('\n📦 Dependency Analysis:');
  console.log('-'.repeat(60));
  
  const hasChartKit = largeFiles.some(f => f.path.includes('chart-kit'));
  const hasSVG = largeFiles.some(f => f.path.includes('svg'));
  
  if (hasChartKit) {
    console.log('   ℹ️  Chart-kit detected - ensure it\'s code-split');
  }
  if (hasSVG) {
    console.log('   ℹ️  SVG library detected - used by chart-kit');
  }
  
  // Check for native modules that shouldn't be in web bundle
  const nativeModules = ['expo-camera', 'expo-local-authentication', 'expo-notifications', 
                         'expo-background-fetch', 'expo-task-manager', 'image-crop-picker'];
  const foundNativeModules = largeFiles.filter(f => 
    nativeModules.some(mod => f.path.includes(mod))
  );
  
  if (foundNativeModules.length > 0) {
    console.log('\n   ⚠️  Native modules found in bundle:');
    foundNativeModules.forEach(f => {
      console.log(`      - ${f.path} (${formatBytes(f.size)})`);
    });
    console.log('   These should be excluded via webpack aliases!');
  } else {
    console.log('   ✅ No native-only modules found in web bundle');
  }
  
  // Recommendations
  console.log('\n💡 Optimization Recommendations:');
  console.log('-'.repeat(60));
  
  const recommendations = [];
  
  if (totalSize > SIZE_THRESHOLD_BYTES) {
    recommendations.push('• Consider implementing dynamic imports for heavy screens');
    recommendations.push('• Review and remove unused dependencies');
    recommendations.push('• Optimize images and compress assets');
  }
  
  if (largeFiles.length > 0) {
    const hasLargeJS = largeFiles.some(f => f.path.endsWith('.js') && f.size > 500 * 1024);
    if (hasLargeJS) {
      recommendations.push('• Large JavaScript chunks detected - enable code splitting');
    }
    
    const hasLargeImages = largeFiles.some(f => /\.(png|jpg|jpeg)$/i.test(f.path) && f.size > 200 * 1024);
    if (hasLargeImages) {
      recommendations.push('• Large images detected - optimize with WebP or reduce quality');
    }
  }
  
  if (recommendations.length === 0) {
    console.log('   ✅ Bundle is well optimized!');
  } else {
    recommendations.forEach(rec => console.log(`   ${rec}`));
  }
  
  console.log('\n📖 Additional Resources:');
  console.log('-'.repeat(60));
  console.log('   • Full guide: WEB_BUNDLE_OPTIMIZATION.md');
  console.log('   • Summary: BUNDLE_OPTIMIZATION_SUMMARY.md');
  console.log('   • Checklist: OPTIMIZATION_CHECKLIST.md');
  console.log('   • Quick start: README_BUNDLE_OPTIMIZATION.md');
  
  console.log('\n🔧 Verification Commands:');
  console.log('-'.repeat(60));
  console.log('   npm run verify-web-optimization  # Check config');
  console.log('   npm run check-web-storage        # Verify storage');
  console.log('   npm run web                      # Test in browser');
  
  console.log('\n' + '='.repeat(60) + '\n');
  
  // Exit with error code if bundle is too large
  if (totalSize >= SIZE_THRESHOLD_BYTES) {
    console.error('❌ Bundle size exceeds threshold. Please optimize before deploying.\n');
    process.exit(1);
  }
}

// Run analysis
analyzeBundle();
