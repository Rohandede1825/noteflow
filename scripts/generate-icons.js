const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');
let pngToIco = require('png-to-ico');
if (pngToIco && pngToIco.default) pngToIco = pngToIco.default;

async function generate() {
  const sourceImgPath = 'C:\\Users\\rohan\\.gemini\\antigravity-ide\\brain\\5af216a3-44c6-4ee1-b5d2-6ac6bf6cc50b\\noteflow_app_icon_1789635442429.jpg';
  const outputDir = path.join(__dirname, '../build-assets');
  const electronAssetsDir = path.join(__dirname, '../electron/assets');
  const frontendPublicDir = path.join(__dirname, '../frontend/public');

  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  if (!fs.existsSync(electronAssetsDir)) fs.mkdirSync(electronAssetsDir, { recursive: true });

  const image = await Jimp.read(sourceImgPath);
  
  // Resize to 512x512 PNG
  const png512Path = path.join(outputDir, 'icon.png');
  await image.resize({ w: 512, h: 512 }).write(png512Path);
  
  // Also copy to electron assets and frontend public
  fs.copyFileSync(png512Path, path.join(electronAssetsDir, 'icon.png'));
  if (fs.existsSync(frontendPublicDir)) {
    fs.copyFileSync(png512Path, path.join(frontendPublicDir, 'icon.png'));
    fs.copyFileSync(png512Path, path.join(frontendPublicDir, 'favicon.png'));
  }

  // Generate multi-size ICO
  const png256Path = path.join(outputDir, 'icon-256.png');
  await image.resize({ w: 256, h: 256 }).write(png256Path);

  const icoBuf = await pngToIco(png256Path);
  fs.writeFileSync(path.join(outputDir, 'icon.ico'), icoBuf);
  fs.writeFileSync(path.join(electronAssetsDir, 'icon.ico'), icoBuf);
  if (fs.existsSync(frontendPublicDir)) {
    fs.writeFileSync(path.join(frontendPublicDir, 'favicon.ico'), icoBuf);
  }

  console.log('✅ NoteFlow desktop icons (icon.ico and icon.png) generated successfully!');
}

generate().catch(console.error);
