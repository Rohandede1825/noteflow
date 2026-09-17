const { execSync } = require('child_process');
const path = require('path');
const os = require('os');

const desktopDir = path.join(os.homedir(), 'Desktop');
const exePath = path.join(__dirname, '../release/win-unpacked/NoteFlow.exe');
const workingDir = path.join(__dirname, '../release/win-unpacked');
const shortcutPath = path.join(desktopDir, 'NoteFlow.lnk');

const psScript = `
$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut('${shortcutPath.replace(/\\/g, '\\\\')}')
$s.TargetPath = '${exePath.replace(/\\/g, '\\\\')}'
$s.WorkingDirectory = '${workingDir.replace(/\\/g, '\\\\')}'
$s.IconLocation = '${exePath.replace(/\\/g, '\\\\')},0'
$s.Description = 'NoteFlow — Professional Digital Notebook'
$s.Save()
`;

execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, '; ')}"`, { stdio: 'inherit' });
console.log('✅ NoteFlow desktop shortcut successfully created on your Windows Desktop!');
