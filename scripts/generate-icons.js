const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
let pngToIco = require('png-to-ico');
if (pngToIco && pngToIco.default) pngToIco = pngToIco.default;

async function generate() {
  const sourceImgPath = 'C:\\Users\\rohan\\.gemini\\antigravity-ide\\brain\\5af216a3-44c6-4ee1-b5d2-6ac6bf6cc50b\\.user_uploaded\\media_1789639629297.png';
  const outputDir = path.join(__dirname, '../build-assets');
  const electronAssetsDir = path.join(__dirname, '../electron/assets');
  const frontendPublicDir = path.join(__dirname, '../frontend/public');
  const frontendAssetsDir = path.join(__dirname, '../frontend/src/assets');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(electronAssetsDir)) fs.mkdirSync(electronAssetsDir, { recursive: true });
  if (!fs.existsSync(frontendAssetsDir)) fs.mkdirSync(frontendAssetsDir, { recursive: true });

  console.log('Reading source image:', sourceImgPath);
  const image = await Jimp.read(sourceImgPath);

  // 1. High-Res 512x512 Master PNG
  const png512Path = path.join(outputDir, 'icon.png');
  await image.resize({ w: 512, h: 512 }).write(png512Path);
  
  // Copy to all asset locations
  fs.copyFileSync(png512Path, path.join(electronAssetsDir, 'icon.png'));
  fs.copyFileSync(png512Path, path.join(frontendAssetsDir, 'logo.png'));
  if (fs.existsSync(frontendPublicDir)) {
    fs.copyFileSync(png512Path, path.join(frontendPublicDir, 'icon.png'));
    fs.copyFileSync(png512Path, path.join(frontendPublicDir, 'favicon.png'));
    fs.copyFileSync(png512Path, path.join(frontendPublicDir, 'logo.png'));
  }

  // 2. Multi-Size Windows .ICO file
  const png256Path = path.join(outputDir, 'icon-256.png');
  await image.resize({ w: 256, h: 256 }).write(png256Path);

  const icoBuf = await pngToIco(png256Path);
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuf);
  fs.writeFileSync(path.join(electronAssetsDir, 'icon.ico'), icoBuf);
  if (fs.existsSync(frontendPublicDir)) {
    fs.writeFileSync(path.join(frontendPublicDir, 'favicon.ico'), icoBuf);
  }

  console.log('✅ New NoteFlow icon and logo generated across all application folders successfully!');
}

generate().catch(console.error);
