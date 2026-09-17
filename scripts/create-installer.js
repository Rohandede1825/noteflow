const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rceditModule = require('rcedit');
const rcedit = rceditModule.rcedit || rceditModule.default || rceditModule;

async function createInstaller() {
  console.log('🚀 Creating NoteFlow Windows Setup Installer...');

  const releaseDir = path.join(__dirname, '../release');
  const unpackedDir = path.join(releaseDir, 'win-unpacked');
  const icoPath = path.join(__dirname, '../build-assets/icon.ico');

  if (!fs.existsSync(unpackedDir)) {
    console.log('📦 win-unpacked not found, running build:desktop first...');
    execSync('npm run build:desktop', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  }

  // Create standard PowerShell GUI Setup Installer wrapper
  const setupScriptPath = path.join(releaseDir, 'setup-wizard.ps1');
  const psSetupScript = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.IO.Compression.FileSystem

[System.Windows.Forms.Application]::EnableVisualStyles()

$form = New-Object System.Windows.Forms.Form
$form.Text = "NoteFlow Setup — Installation Wizard"
$form.Size = New-Object System.Drawing.Size(560, 520)
$form.StartPosition = "CenterScreen"
$form.FormBorderStyle = "FixedDialog"
$form.MaximizeBox = $false
$form.BackColor = [System.Drawing.Color]::FromArgb(26, 28, 32)
$form.ForeColor = [System.Drawing.Color]::White

if (Test-Path "${icoPath.replace(/\\/g, '\\\\')}") {
  $form.Icon = New-Object System.Drawing.Icon("${icoPath.replace(/\\/g, '\\\\')}")
}

# Title Label
$title = New-Object System.Windows.Forms.Label
$title.Text = "Install NoteFlow on your Laptop"
$title.Font = New-Object System.Drawing.Font("Segoe UI", 14, [System.Drawing.FontStyle]::Bold)
$title.Location = New-Object System.Drawing.Point(20, 20)
$title.Size = New-Object System.Drawing.Size(500, 30)
$title.ForeColor = [System.Drawing.Color]::FromArgb(240, 240, 245)
$form.Controls.Add($title)

# Subtitle
$subtitle = New-Object System.Windows.Forms.Label
$subtitle.Text = "Please review the license terms before proceeding with the installation."
$subtitle.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$subtitle.Location = New-Object System.Drawing.Point(22, 52)
$subtitle.Size = New-Object System.Drawing.Size(500, 20)
$subtitle.ForeColor = [System.Drawing.Color]::FromArgb(160, 165, 175)
$form.Controls.Add($subtitle)

# License Agreement Box
$licenseBox = New-Object System.Windows.Forms.TextBox
$licenseBox.Multiline = $true
$licenseBox.ReadOnly = $true
$licenseBox.ScrollBars = "Vertical"
$licenseBox.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$licenseBox.BackColor = [System.Drawing.Color]::FromArgb(18, 19, 22)
$licenseBox.ForeColor = [System.Drawing.Color]::FromArgb(220, 225, 235)
$licenseBox.Location = New-Object System.Drawing.Point(20, 80)
$licenseBox.Size = New-Object System.Drawing.Size(500, 200)

$licenseFile = "${path.join(__dirname, '../build-assets/license.txt').replace(/\\/g, '\\\\')}"
if (Test-Path $licenseFile) {
  $licenseBox.Text = [System.IO.File]::ReadAllText($licenseFile)
} else {
  $licenseBox.Text = "NoteFlow End-User License Agreement\\r\\n\\r\\nBy installing NoteFlow, you agree to the terms of use, privacy policy, and local data persistence."
}
$form.Controls.Add($licenseBox)

# Checkbox
$chkAgree = New-Object System.Windows.Forms.CheckBox
$chkAgree.Text = "I accept the terms in the License Agreement and Privacy Policy"
$chkAgree.Font = New-Object System.Drawing.Font("Segoe UI", 9, [System.Drawing.FontStyle]::Bold)
$chkAgree.Location = New-Object System.Drawing.Point(20, 290)
$chkAgree.Size = New-Object System.Drawing.Size(500, 25)
$chkAgree.Checked = $true
$chkAgree.ForeColor = [System.Drawing.Color]::FromArgb(96, 165, 250)
$form.Controls.Add($chkAgree)

# Install location info
$destInfo = New-Object System.Windows.Forms.Label
$defaultDir = [System.IO.Path]::Combine($env:LOCALAPPDATA, "Programs", "NoteFlow")
$destInfo.Text = "Destination: " + $defaultDir
$destInfo.Font = New-Object System.Drawing.Font("Segoe UI", 8.5)
$destInfo.Location = New-Object System.Drawing.Point(20, 320)
$destInfo.Size = New-Object System.Drawing.Size(500, 20)
$destInfo.ForeColor = [System.Drawing.Color]::FromArgb(140, 145, 155)
$form.Controls.Add($destInfo)

# Progress Bar
$progressBar = New-Object System.Windows.Forms.ProgressBar
$progressBar.Location = New-Object System.Drawing.Point(20, 350)
$progressBar.Size = New-Object System.Drawing.Size(500, 20)
$progressBar.Visible = $false
$form.Controls.Add($progressBar)

# Status Label
$statusLbl = New-Object System.Windows.Forms.Label
$statusLbl.Font = New-Object System.Drawing.Font("Segoe UI", 9)
$statusLbl.Location = New-Object System.Drawing.Point(20, 380)
$statusLbl.Size = New-Object System.Drawing.Size(500, 20)
$statusLbl.ForeColor = [System.Drawing.Color]::FromArgb(52, 211, 153)
$statusLbl.Visible = $false
$form.Controls.Add($statusLbl)

# Install Button
$btnInstall = New-Object System.Windows.Forms.Button
$btnInstall.Text = "Agree & Install"
$btnInstall.Font = New-Object System.Drawing.Font("Segoe UI", 9.5, [System.Drawing.FontStyle]::Bold)
$btnInstall.BackColor = [System.Drawing.Color]::FromArgb(37, 99, 235)
$btnInstall.ForeColor = [System.Drawing.Color]::White
$btnInstall.FlatStyle = "Flat"
$btnInstall.Location = New-Object System.Drawing.Point(260, 420)
$btnInstall.Size = New-Object System.Drawing.Size(140, 40)
$form.Controls.Add($btnInstall)

# Cancel Button
$btnCancel = New-Object System.Windows.Forms.Button
$btnCancel.Text = "Cancel"
$btnCancel.Font = New-Object System.Drawing.Font("Segoe UI", 9.5)
$btnCancel.BackColor = [System.Drawing.Color]::FromArgb(45, 48, 55)
$btnCancel.ForeColor = [System.Drawing.Color]::FromArgb(200, 200, 210)
$btnCancel.FlatStyle = "Flat"
$btnCancel.Location = New-Object System.Drawing.Point(410, 420)
$btnCancel.Size = New-Object System.Drawing.Size(110, 40)
$btnCancel.Add_Click({ $form.Close() })
$form.Controls.Add($btnCancel)

$chkAgree.Add_CheckedChanged({
  $btnInstall.Enabled = $chkAgree.Checked
})

$btnInstall.Add_Click({
  $btnInstall.Enabled = $false
  $btnCancel.Enabled = $false
  $progressBar.Visible = $true
  $statusLbl.Visible = $true
  $statusLbl.Text = "Installing NoteFlow to your system..."
  $progressBar.Value = 20

  try {
    # 1. Close any running instances
    Get-Process "NoteFlow" -ErrorAction SilentlyContinue | Stop-Process -Force

    # 2. Copy files to Programs folder
    if (-not (Test-Path $defaultDir)) {
      New-Item -ItemType Directory -Path $defaultDir -Force | Out-Null
    }

    $sourceDir = "${unpackedDir.replace(/\\/g, '\\\\')}"
    $progressBar.Value = 50
    $statusLbl.Text = "Copying program files..."
    Copy-Item -Path "$sourceDir\\*" -Destination $defaultDir -Recurse -Force

    # 3. Create Desktop and Start Menu Shortcuts
    $progressBar.Value = 80
    $statusLbl.Text = "Creating desktop shortcuts with custom icon..."
    
    $wscript = New-Object -ComObject WScript.Shell
    $exeTarget = [System.IO.Path]::Combine($defaultDir, "NoteFlow.exe")

    # Desktop Shortcut
    $desktopLnk = [System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'NoteFlow.lnk')
    $sc = $wscript.CreateShortcut($desktopLnk)
    $sc.TargetPath = $exeTarget
    $sc.WorkingDirectory = $defaultDir
    $sc.IconLocation = "$exeTarget,0"
    $sc.Description = "NoteFlow — Professional Digital Notebook"
    $sc.Save()

    # Start Menu Shortcut
    $startMenuDir = [System.IO.Path]::Combine([Environment]::GetFolderPath('Programs'), 'NoteFlow')
    if (-not (Test-Path $startMenuDir)) { New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null }
    $startLnk = [System.IO.Path]::Combine($startMenuDir, 'NoteFlow.lnk')
    $sc2 = $wscript.CreateShortcut($startLnk)
    $sc2.TargetPath = $exeTarget
    $sc2.WorkingDirectory = $defaultDir
    $sc2.IconLocation = "$exeTarget,0"
    $sc2.Description = "NoteFlow"
    $sc2.Save()

    $progressBar.Value = 100
    $statusLbl.Text = "Installation Complete! Launching NoteFlow..."
    Start-Sleep -Milliseconds 800

    # Launch NoteFlow
    Start-Process -FilePath $exeTarget

    $form.Close()
  } catch {
    [System.Windows.Forms.MessageBox]::Show($_.Exception.Message, "Installation Error", "OK", "Error")
    $btnInstall.Enabled = $true
    $btnCancel.Enabled = $true
  }
})

[void]$form.ShowDialog()
`;

  fs.writeFileSync(setupScriptPath, psSetupScript, 'utf8');

  // Create NoteFlow-Installer.bat launcher
  const installerBatPath = path.join(releaseDir, 'NoteFlow-Setup.bat');
  const batContent = `@echo off
title NoteFlow Setup Wizard
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-wizard.ps1"
`;
  fs.writeFileSync(installerBatPath, batContent, 'utf8');

  console.log('✅ NoteFlow Setup Installer wizard created!');
  console.log(`📍 Setup Script: ${setupScriptPath}`);
  console.log(`📍 Setup Launcher: ${installerBatPath}`);
}

createInstaller().catch(console.error);
