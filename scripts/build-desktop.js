const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function buildDesktop() {
  try {
    execSync('taskkill /F /IM NoteFlow.exe /T', { stdio: 'ignore' });
  } catch (_) {}

  console.log('📦 Step 1: Building Frontend with Cloud Render Backend integration...');
  execSync('npm run build:frontend', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('🔨 Step 2: Packaging NoteFlow desktop application files with native icon...');
  execSync('npx electron-builder --dir', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  const exePath = path.join(__dirname, '../release/win-unpacked/NoteFlow.exe');
  console.log('\n🎉 NoteFlow Windows Desktop App is fully built and ready!');
  console.log(`📍 Location: ${exePath}`);
}

buildDesktop().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
