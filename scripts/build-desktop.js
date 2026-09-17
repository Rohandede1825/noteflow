const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { rcedit } = require('rcedit');

async function buildDesktop() {
  try {
    execSync('taskkill /F /IM NoteFlow.exe /T', { stdio: 'ignore' });
  } catch (_) {}

  console.log('📦 Step 1: Building Frontend with Cloud Render Backend integration...');
  execSync('npm run build:frontend', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('🔨 Step 2: Packaging NoteFlow desktop application files with native icon...');
  execSync('npx electron-builder --dir', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  const exePath = path.join(__dirname, '../release/win-unpacked/NoteFlow.exe');
  const iconIco = path.join(__dirname, '../build-assets/icon.ico');

  console.log('🎨 Step 3: Injecting NoteFlow high-res squircle icon into executable...');
  try {
    await rcedit(exePath, {
      icon: iconIco,
      'file-version': '1.0.0',
      'product-version': '1.0.0',
      'version-string': {
        ProductName: 'NoteFlow',
        FileDescription: 'NoteFlow Digital Notebook',
        CompanyName: 'NoteFlow',
        LegalCopyright: 'Copyright © 2026 NoteFlow'
      }
    });
    console.log('✅ Executable icon and metadata injected successfully!');
  } catch (err) {
    console.warn('⚠️ Warning during rcedit:', err.message);
  }

  console.log('\n🎉 NoteFlow Windows Desktop App is fully built and ready!');
  console.log(`📍 Location: ${exePath}`);
}

buildDesktop().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
