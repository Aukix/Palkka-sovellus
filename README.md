# ⏱️ Työtunnit & Laskutus - Työpöytäsovellus

Kevyt, moderni ja helppokäyttöinen työpöytäsovellus työtuntien, palkkasaatavien ja laskutuksen seurantaan. Sovellus toimii täysin paikallisesti tietokoneellasi ilman ulkoisia pilvipalveluita tai tilien luomista.

---

## ✨ Ominaisuudet

- **⏱️ Alkavan puolitunnin pyöristys (30 min)**: Laskee työtunnit automaattisesti alkavalle puolelle tunnille (`Math.ceil(minuutit / 30) * 0.5`). Esim. 8h 05min pyöristyy 8,5h.
- **🏢 Yrityskohtainen / Asiakaskohtainen hallinta**:
  - Lisää ja poista yrityksiä tai asiakkaita vapaasti.
  - Suodata työvuorot ja ansio valitun yrityksen mukaan.
  - Kuukauden kokonaistunnit ja kokonaisansio kaikista yrityksistä näkyvät aina yhteenvedossa.
- **💶 Vuorokohtainen tuntipalkka**: Aseta tuntipalkka (€/h) jokaiselle vuorolle erikseen tai käytä yleistä oletustuntipalkkaa.
- **🧾 Laskutustilanteen seuranta**:
  - Merkitse vuoro suoraan listasta yhdellä klikkauksella (`✅ Laskutettu` tai `⏳ Laskuttamatta`).
  - Suodata työvuorot laskutustilan mukaan.
  - Yhteenvedossa näet heti paljonko tunteja ja rahaa odottaa laskutusta ja kuukauden laskutusasteen (%).
- **🖊️ Työvuorojen muokkaus**: Muokkaa olemassa olevia työvuoroja kätevästi erillisessä ponnahdusikkunassa reaaliaikaisella live-laskennalla.
- **📊 Tulostettava kuukausiraportti**: Valmis A4-tuntikortti työnantajalle tai kirjanpitoon allekirjoituskentillä ja PDF-tulostuksella.
- **📁 Excel / CSV & JSON -vienti**: Tallenna tunnit suoraan Excel-yhteensopivana CSV-tiedostona tai ota täysi varmuuskopio JSON-muodossa.
- **🖥️ Tiivis työpöytänäkymä**: Kaikki toiminnot mahtuvat yhdelle ruudulle ilman ikkunan rullaamista alaspäin.
- **🚀 Automaattinen sammutus**: Kun suljet sovellusikkunan, taustapalvelin sammuu automaattisesti.

---

## 🛠️ Vaatimukset

- **Käyttöjärjestelmä**: Windows 10 tai Windows 11
- **Node.js**: Versio 18 tai uudempi ([Lataa Node.js](https://nodejs.org/))
- **Selain**: Microsoft Edge (tulee valmiiksi asennettuna Windowsissa)

---

## 🚀 Käyttöönotto ja Asennus

### 1. Lataa tai kloonaa projekti
```bash
git clone https://github.com/<kayttajatunnus>/palkka-sovellus.git
cd palkka-sovellus
```

### 2. Asenna riippuvuudet
```bash
npm install
```

### 3. Käännä tuotantoversio
```bash
npm run build
```

### 4. Käynnistä sovellus
Voit käynnistää sovelluksen millä tahansa seuraavista tavoista:
- Kaksoisklikkaamalla `start-app.bat` -tiedostoa.
- Tai komentoriviltä: `npm start`
- Tai äänettömästi ilman konsoli-ikkunaa kaksoisklikkaamalla `start-app.vbs`.

---

## 📌 Työpöydän pikakuvakkeen luominen

Voit luoda sovellukselle kätevän pikakuvakkeen suoraan Windowsin työpöydälle ajamalla PowerShellissä projektikansiossa:

```powershell
.\create-shortcut.ps1
```

Tämä luo työpöydälle `Työtunnit`-pikakuvakkeen, joka avaa sovelluksen suoraan omassa siistissä sovellusikkunassaan.

---

## 💻 Kehitys

Jos haluat kehittää tai muokata sovellusta reaaliaikaisella esikatselulla:

```bash
npm run dev
```

Avaa selain osoitteessa `http://localhost:5173/`.

---

## 📄 Lisenssi

MIT License. Vapaasti käytettävissä ja muokattavissa omiin tarpeisiin.
