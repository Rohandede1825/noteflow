const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateMsixAssets } = require('./generate-msix-assets');

async function buildMsix() {
  console.log('====================================================');
  console.log('📦 NoteFlow — Microsoft Store MSIX Package Builder');
  console.log('====================================================\n');

  try {
    execSync('taskkill /F /IM NoteFlow.exe /T', { stdio: 'ignore' });
  } catch (_) {}

  // 1. Build frontend
  console.log('📦 Step 1: Building React frontend (Production bundle)...');
  execSync('npm run build:frontend', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // 2. Ensure Store / MSIX Assets exist
  const appxAssetsDir = path.join(__dirname, '../build-assets/appx');
  if (!fs.existsSync(appxAssetsDir) || fs.readdirSync(appxAssetsDir).length === 0) {
    console.log('🎨 Step 2: Generating Microsoft Store visual assets...');
    await generateMsixAssets();
  } else {
    console.log('✅ Step 2: Microsoft Store visual assets verified in build-assets/appx');
  }

  // 3. Check for Microsoft Partner Center overrides via Environment Variables
  const identityName = process.env.MSIX_IDENTITY_NAME || 'com.noteflow.app';
  const publisher = process.env.MSIX_PUBLISHER || 'CN=NoteFlow';
  const publisherDisplayName = process.env.MSIX_PUBLISHER_DISPLAY_NAME || 'NoteFlow';

  console.log('\n📋 Microsoft Store Identity Configuration:');
  console.log(`   • Package / Identity Name : ${identityName}`);
  console.log(`   • Publisher Identity     : ${publisher}`);
  console.log(`   • Publisher Display Name : ${publisherDisplayName}`);
  if (!process.env.MSIX_PUBLISHER) {
    console.log('   ℹ️ (Using default local configuration. For Partner Center, set MSIX_PUBLISHER / MSIX_IDENTITY_NAME)');
  }

  // 4. Run electron-builder for AppX / MSIX target
  console.log('\n🔨 Step 3: Packaging NoteFlow MSIX for Windows (x64)...');
  
  // Construct electron-builder args
  const builderCmd = 'npx electron-builder --win appx --x64';
  execSync(builderCmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  // 5. Inspect and organize generated packages in release/
  const releaseDir = path.join(__dirname, '../release');
  const files = fs.readdirSync(releaseDir);
  
  const appxFiles = files.filter(f => f.endsWith('.appx') || f.endsWith('.msix') || f.endsWith('.msixupload') || f.endsWith('.appxupload'));
  
  console.log('\n🎉 Microsoft Store package generated successfully!');
  console.log('📍 Generated Files in release/:');
  appxFiles.forEach(file => {
    const filePath = path.join(releaseDir, file);
    const stats = fs.statSync(filePath);
    const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`   • ${file} (${sizeMb} MB) -> ${filePath}`);
  });

  // Create .msix copy if .appx was created for standardized MSIX naming
  const appxFile = files.find(f => f.endsWith('.appx') && !f.endsWith('.appxupload'));
  if (appxFile) {
    const msixName = appxFile.replace(/\.appx$/, '.msix');
    const msixPath = path.join(releaseDir, msixName);
    fs.copyFileSync(path.join(releaseDir, appxFile), msixPath);
    console.log(`   • ${msixName} (MSIX alias created) -> ${msixPath}`);
  }

  console.log('\n====================================================');
  console.log('✅ NoteFlow MSIX Build Complete!');
  console.log('====================================================');
}

buildMsix().catch((err) => {
  console.error('\n❌ MSIX Build failed:', err);
  process.exit(1);
});
