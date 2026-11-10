# Työtunnit-sovelluksen asennus.
# 1) Asentaa Node.js:n, jos sitä ei ole (winget tai nodejs.org)
# 2) Kopioi sovelluksen kansioon %LOCALAPPDATA%\Tyotunnit
# 3) Luo pikakuvakkeet Käynnistä-valikkoon ja työpöydälle

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # nopeuttaa latauksia Windows PowerShellissä

$appName   = 'Työtunnit'
$sourceDir = $PSScriptRoot
$targetDir = Join-Path $env:LOCALAPPDATA 'Tyotunnit'
$minNodeMajor = 18

function Write-Step($text) {
    Write-Host ''
    Write-Host $text -ForegroundColor Cyan
}

function Find-Node {
    $candidates = @(
        "$env:ProgramFiles\nodejs\node.exe",
        "${env:ProgramFiles(x86)}\nodejs\node.exe",
        "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
    )
    $cmd = Get-Command node -ErrorAction SilentlyContinue
    if ($cmd) { $candidates = @($cmd.Source) + $candidates }

    foreach ($path in $candidates) {
        if ($path -and (Test-Path $path)) {
            try {
                $version = (& $path -v).Trim()          # esim. v22.11.0
                $major = [int]($version.TrimStart('v').Split('.')[0])
                if ($major -ge $minNodeMajor) { return @{ Path = $path; Version = $version } }
            } catch { }
        }
    }
    return $null
}

function Install-NodeWithWinget {
    $winget = Get-Command winget -ErrorAction SilentlyContinue
    if (-not $winget) { return }
    Write-Host 'Asennetaan Node.js (winget). Hyväksy Windowsin mahdollinen lupakysely.'
    try {
        & winget install --id OpenJS.NodeJS.LTS -e --silent --accept-source-agreements --accept-package-agreements
    } catch {
        Write-Host 'winget-asennus ei onnistunut, kokeillaan toista tapaa.'
    }
}

function Install-NodeFromWeb {
    Write-Host 'Ladataan Node.js-asennusohjelma osoitteesta nodejs.org...'
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    $arch = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $base = 'https://nodejs.org/dist/latest-v24.x/'

    $sums = (Invoke-WebRequest -Uri ($base + 'SHASUMS256.txt') -UseBasicParsing).Content
    if ($sums -is [byte[]]) { $sums = [Text.Encoding]::ASCII.GetString($sums) }
    $line = ($sums -split "`n") | Where-Object { $_ -match "node-v[\d\.]+-$arch\.msi" } | Select-Object -First 1
    if (-not $line) { throw 'Node.js-asennusohjelmaa ei löytynyt.' }
    $parts = $line.Trim() -split '\s+'
    $expectedHash = $parts[0]
    $fileName = $parts[1]

    $msi = Join-Path $env:TEMP $fileName
    Invoke-WebRequest -Uri ($base + $fileName) -OutFile $msi -UseBasicParsing

    $actualHash = (Get-FileHash -Path $msi -Algorithm SHA256).Hash
    if ($actualHash -ne $expectedHash.ToUpper()) {
        Remove-Item $msi -Force -ErrorAction SilentlyContinue
        throw 'Ladatun Node.js-asennusohjelman tarkistussumma ei täsmää.'
    }

    Write-Host 'Asennetaan Node.js. Hyväksy Windowsin lupakysely.'
    $proc = Start-Process -FilePath 'msiexec.exe' -ArgumentList "/i `"$msi`" /passive /norestart" -Wait -PassThru
    Remove-Item $msi -Force -ErrorAction SilentlyContinue
    if ($proc.ExitCode -ne 0 -and $proc.ExitCode -ne 3010) {
        throw "Node.js-asennus päättyi virhekoodiin $($proc.ExitCode)."
    }
}

function Copy-Folder($from, $to, [string[]]$excludeDirs = @()) {
    # robocopy yhdistää kansiot luotettavasti; paluukoodit 0-7 = onnistui
    $rcArgs = @($from, $to, '/E', '/R:2', '/W:1', '/NFL', '/NDL', '/NJH', '/NJS', '/NP')
    if ($excludeDirs.Count -gt 0) { $rcArgs += '/XD'; $rcArgs += $excludeDirs }
    & robocopy @rcArgs | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "Tiedostojen kopiointi epäonnistui (robocopy $LASTEXITCODE)." }
}

function New-Shortcut($path, $target, $arguments, $workDir, $icon, $description) {
    $shell = New-Object -ComObject WScript.Shell
    $sc = $shell.CreateShortcut($path)
    $sc.TargetPath = $target
    $sc.Arguments = $arguments
    $sc.WorkingDirectory = $workDir
    $sc.IconLocation = $icon
    $sc.Description = $description
    $sc.Save()
}

try {
    Write-Host '==========================================='
    Write-Host "  $appName - asennus"
    Write-Host '==========================================='

    if (-not (Test-Path (Join-Path $sourceDir 'server.cjs'))) {
        throw 'Sovelluksen tiedostoja ei löytynyt. Pura zip-tiedosto ensin kansioon ja aja Asenna.bat sieltä.'
    }

    # 1) Node.js
    Write-Step '1/3  Tarkistetaan Node.js...'
    $node = Find-Node
    if ($node) {
        Write-Host "Node.js on jo asennettu ($($node.Version))."
    } else {
        Install-NodeWithWinget
        $node = Find-Node
        if (-not $node) {
            Install-NodeFromWeb
            $node = Find-Node
        }
        if (-not $node) { throw 'Node.js:n asennus ei onnistunut. Asenna se käsin osoitteesta https://nodejs.org ja aja Asenna.bat uudelleen.' }
        Write-Host "Node.js asennettu ($($node.Version))." -ForegroundColor Green
    }

    # 2) Sovelluksen tiedostot
    Write-Step "2/3  Kopioidaan sovellus kansioon $targetDir ..."
    $sameDir = [IO.Path]::GetFullPath($sourceDir).TrimEnd('\') -ieq [IO.Path]::GetFullPath($targetDir).TrimEnd('\')
    if ($sameDir) {
        Write-Host 'Sovellus on jo asennuskansiossa.'
    } else {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        $oldDist = Join-Path $targetDir 'dist'
        if (Test-Path $oldDist) { Remove-Item -Path $oldDist -Recurse -Force }

        # Tallennetut tunnit (.browser-profile) eivät kuulu kopioon, ettei mitään ylikirjoiteta
        Copy-Folder $sourceDir $targetDir @((Join-Path $sourceDir '.browser-profile'), (Join-Path $sourceDir 'node_modules'))

        # Jos sovellusta on jo käytetty tästä kansiosta, siirretään tallennetut tunnit mukaan
        $oldProfile = Join-Path $sourceDir '.browser-profile'
        $newProfile = Join-Path $targetDir '.browser-profile'
        if ((Test-Path $oldProfile) -and -not (Test-Path $newProfile)) {
            Write-Host 'Siirretään aiemmin tallennetut tunnit...'
            Copy-Folder $oldProfile $newProfile
        }
        Write-Host 'Tiedostot kopioitu.'
    }

    # Poistetaan "ladattu internetistä" -merkintä, ettei Windows varoita joka käynnistyksellä
    Get-ChildItem -Path $targetDir -Recurse -File -Force |
        Where-Object { $_.FullName -notlike '*\.browser-profile\*' } |
        Unblock-File -ErrorAction SilentlyContinue

    # 3) Pikakuvakkeet
    Write-Step '3/3  Luodaan pikakuvakkeet...'
    $wscript = Join-Path $env:SystemRoot 'System32\wscript.exe'
    $vbs = Join-Path $targetDir 'start-app.vbs'
    $icon = Join-Path $targetDir 'tyotunnit.ico'
    $programs = [Environment]::GetFolderPath('Programs')
    $desktop = [Environment]::GetFolderPath('Desktop')

    New-Shortcut (Join-Path $programs "$appName.lnk") $wscript "`"$vbs`"" $targetDir $icon 'Työtuntien seuranta ja laskutus'
    New-Shortcut (Join-Path $desktop "$appName.lnk") $wscript "`"$vbs`"" $targetDir $icon 'Työtuntien seuranta ja laskutus'
    New-Shortcut (Join-Path $programs "Päivitä $appName.lnk") (Join-Path $targetDir 'paivita.bat') '' $targetDir $icon 'Päivitä Työtunnit uusimpaan versioon'
    Write-Host 'Pikakuvakkeet luotu: Käynnistä-valikko ja työpöytä.'

    Write-Host ''
    Write-Host '==========================================='  -ForegroundColor Green
    Write-Host '  Asennus valmis!' -ForegroundColor Green
    Write-Host '==========================================='  -ForegroundColor Green
    Write-Host "Avaa sovellus työpöydän tai Käynnistä-valikon kuvakkeesta '$appName'."
    Write-Host "Aloitusnäyttöön kiinnitys: Käynnistä-valikko > Kaikki sovellukset > $appName > hiiren oikea > Kiinnitä aloitusnäyttöön."
    Write-Host ''

    $answer = Read-Host 'Avataanko sovellus nyt? (K/e)'
    if ($answer -eq '' -or $answer -match '^[kKyY]') {
        Start-Process -FilePath $wscript -ArgumentList "`"$vbs`"" -WorkingDirectory $targetDir
    }
}
catch {
    Write-Host ''
    Write-Host ('Asennus epäonnistui: ' + $_.Exception.Message) -ForegroundColor Red
}
