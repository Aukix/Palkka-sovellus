# Työtunnit-sovellus: ohjeet kehitykseen

- Käyttöliittymä on React + Vite (`src/`). Käännetty versio `dist/` on versionhallinnassa, koska käyttäjät ajavat sovellusta ilman käännösvaihetta: aja aina `npm run build` ja commitoi `dist/` muutosten mukana.
- **Nosta `package.json`:n `version` (ja `package-lock.json`:n vastaavat kentät) jokaisessa muutoksessa, joka viedään main-haaraan.** Sovelluksen *Etsi päivityksiä* -toiminto vertaa paikallista versiota GitHubin main-haaran `package.json`-versioon; ilman nostoa käyttäjät eivät saa muutosta.
- `server.cjs` palvelee `dist`-kansion ja tarjoaa päivitysrajapinnan (`/api/...`, vaatii otsakkeen `X-Tyotunnit: 1`). Päivitys ei saa koskaan koskea kansioihin `.browser-profile` (käyttäjän tallennetut tunnit) eikä `varmuuskopiot`.
- Käyttäjän tiedot ovat selaimen localStoragessa (`tyotunnit_*`-avaimet). Älä muuta avainten nimiä tai tietomuotoa ilman siirtoa vanhasta muodosta.
- Kohdealusta on Windows 10/11 (Edge-sovellusikkuna, `.bat`/`.ps1`-skriptit). PowerShell-skriptit tallennetaan UTF-8 BOM -koodauksella ja CRLF-rivinvaihdoin.
