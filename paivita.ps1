# Päivittää Työtunnit-sovelluksen uusimpaan versioon GitHubista (main-haara).
# Tallennetut tunnit eivät muutu: ne ovat kansiossa .browser-profile, jota päivitys ei koske.

$ErrorActionPreference = 'Stop'
$appDir = $PSScriptRoot
$url = 'https://github.com/Aukix/Palkka-sovellus/archive/refs/heads/main.zip'
$tmp = Join-Path $env:TEMP ('tyotunnit-paivitys-' + [guid]::NewGuid().ToString())

try {
    New-Item -ItemType Directory -Path $tmp | Out-Null
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

    Write-Host 'Ladataan uusin versio GitHubista...'
    $zip = Join-Path $tmp 'paivitys.zip'
    Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing

    Write-Host 'Puretaan...'
    Expand-Archive -Path $zip -DestinationPath $tmp -Force
    $src = Get-ChildItem -Path $tmp -Directory | Select-Object -First 1
    if (-not $src -or -not (Test-Path (Join-Path $src.FullName 'server.cjs'))) {
        throw 'Ladattu paketti ei näytä sovellukselta.'
    }

    Write-Host 'Kopioidaan tiedostot...'
    # Vanha käännös poistetaan, ettei turhia tiedostoja kerry
    $dist = Join-Path $appDir 'dist'
    if (Test-Path $dist) { Remove-Item -Path $dist -Recurse -Force }
    Copy-Item -Path (Join-Path $src.FullName '*') -Destination $appDir -Recurse -Force

    Write-Host ''
    Write-Host 'Valmis! Sovellus on päivitetty uusimpaan versioon.' -ForegroundColor Green
    Write-Host 'Jos sovellus oli auki, sulje se ja käynnistä uudelleen.'
}
catch {
    Write-Host ''
    Write-Host ('Päivitys epäonnistui: ' + $_.Exception.Message) -ForegroundColor Red
    Write-Host 'Tarkista nettiyhteys ja yritä uudelleen.'
}
finally {
    if (Test-Path $tmp) { Remove-Item -Path $tmp -Recurse -Force -ErrorAction SilentlyContinue }
}
