# 1. Terminate old running NoteFlow processes
Get-Process -Name "NoteFlow" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Milliseconds 300

# 2. Destination directory
$dest = Join-Path $env:LOCALAPPDATA "Programs\NoteFlow"
$source = "C:\Users\rohan\Documents\noteflow\release\win-unpacked"

if (Test-Path $dest) {
  Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force
  Copy-Item -Path "C:\Users\rohan\Documents\noteflow\build-assets\icon.ico" -Destination "$dest\app.ico" -Force
}

# 3. Update Shortcuts
$wscript = New-Object -ComObject WScript.Shell
$desktopLnk = Join-Path ([Environment]::GetFolderPath('Desktop')) 'NoteFlow.lnk'
$sc = $wscript.CreateShortcut($desktopLnk)
$sc.TargetPath = Join-Path $dest "NoteFlow.exe"
$sc.WorkingDirectory = $dest
$sc.IconLocation = "$dest\app.ico,0"
$sc.Description = "NoteFlow"
$sc.Save()

$startMenuDir = Join-Path ([Environment]::GetFolderPath('Programs')) 'NoteFlow'
if (-not (Test-Path $startMenuDir)) {
  New-Item -ItemType Directory -Path $startMenuDir -Force | Out-Null
}
$startLnk = Join-Path $startMenuDir 'NoteFlow.lnk'
$sc2 = $wscript.CreateShortcut($startLnk)
$sc2.TargetPath = Join-Path $dest "NoteFlow.exe"
$sc2.WorkingDirectory = $dest
$sc2.IconLocation = "$dest\app.ico,0"
$sc2.Description = "NoteFlow"
$sc2.Save()

# 4. Refresh Windows Shell / Icon Cache
ie4uinit.exe -show
Write-Host "✅ NoteFlow Desktop and Start Menu icons have been successfully refreshed with your new squircle logo!"
