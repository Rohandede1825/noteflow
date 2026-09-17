const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
let rceditModule = require('rcedit');
const rcedit = rceditModule.rcedit || rceditModule.default || rceditModule;

async function buildDesktop() {
  console.log('📦 Step 1: Building Frontend with Cloud Render Backend integration...');
  execSync('npm run build:frontend', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('🔨 Step 2: Packaging NoteFlow desktop application files...');
  execSync('npx electron-builder --dir', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  const exePath = path.join(__dirname, '../release/win-unpacked/NoteFlow.exe');
  const icoPath = path.join(__dirname, '../build-assets/icon.ico');

  if (fs.existsSync(exePath) && fs.existsSync(icoPath)) {
    console.log('🎨 Step 3: Injecting NoteFlow custom high-res icon and metadata into NoteFlow.exe...');
    await rcedit(exePath, {
      icon: icoPath,
      'file-version': '1.0.0',
      'product-version': '1.0.0',
      'version-string': {
        ProductName: 'NoteFlow',
        FileDescription: 'NoteFlow — Professional Digital Notebook',
        CompanyName: 'NoteFlow',
        LegalCopyright: 'Copyright © 2026 NoteFlow'
      }
    });
    console.log('✅ NoteFlow.exe icon and metadata updated successfully!');
  } else {
    console.warn('⚠️ Exe or ICO file not found for rcedit:', { exeExists: fs.existsSync(exePath), icoExists: fs.existsSync(icoPath) });
  }

  console.log('\n🎉 NoteFlow Windows Desktop App is fully built and ready!');
  console.log(`📍 Location: ${exePath}`);
}

buildDesktop().catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
