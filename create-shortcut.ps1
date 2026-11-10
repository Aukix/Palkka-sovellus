$currentDir = $PSScriptRoot
if (-not $currentDir) {
    $currentDir = (Get-Location).Path
}
$desktop = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$shortcutPath = Join-Path $desktop "Työtunnit.lnk"

$wscriptExe = Join-Path $env:SystemRoot "System32\wscript.exe"
$vbsPath = Join-Path $currentDir "start-app.vbs"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($shortcutPath)
$Shortcut.TargetPath = $wscriptExe
$Shortcut.Arguments = "`"$vbsPath`""
$Shortcut.WorkingDirectory = $currentDir
$Shortcut.Description = "Työtunnit - Työajan Seuranta"
$Shortcut.IconLocation = "shell32.dll,264"
$Shortcut.Save()

Write-Host "Pikakuvake luotu: $shortcutPath"
Write-Host "Kohde: $vbsPath"
