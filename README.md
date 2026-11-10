# ⏱️ Työtunnit & Laskutus - Työpöytäsovellus

Kevyt, moderni ja helppokäyttöinen työpöytäsovellus työtuntien, palkkasaatavien ja laskutuksen seurantaan. Sovellus toimii täysin paikallisesti tietokoneellasi ilman ulkoisia pilvipalveluita tai tilien luomista.

---

## ✨ Ominaisuudet

- **⏱️ Alkavan puolitunnin pyöristys (30 min)**: Laskee työtunnit automaattisesti alkavalle puolelle tunnille (`Math.ceil(minuutit / 30) * 0.5`). Esim. 8h 05min pyöristyy 8,5h.
- **🏢 Yrityskohtainen / Asiakaskohtainen hallinta**:
  - Lisää ja poista yrityksiä tai asiakkaita vapaasti.
  - Suodata työvuorot ja ansio valitun yrityksen mukaan.
  - Kuukauden kokonaistunnit ja kokonaisansio kaikista yrityksistä näkyvät aina yhteenvedossa.
- **🍽️ Ruokatauko**: Täppä vähentää vuorosta 30 min ruokatauon ennen pyöristystä (oletuksena pois). Esim. 8h 20min − 30 min = 7h 50min → 8h.
- **💶 Vuorokohtainen tuntipalkka**: Aseta tuntipalkka (€/h) jokaiselle vuorolle erikseen tai käytä yleistä oletustuntipalkkaa.
- **🧾 Laskutustilanteen seuranta**:
  - Merkitse vuoro suoraan listasta yhdellä klikkauksella (`✅ Laskutettu` tai `⏳ Laskuttamatta`).
  - Suodata työvuorot laskutustilan mukaan.
  - Yhteenvedossa näet heti paljonko tunteja ja rahaa odottaa laskutusta ja kuukauden laskutusasteen (%).
- **🖊️ Työvuorojen muokkaus**: Muokkaa olemassa olevia työvuoroja kätevästi erillisessä ponnahdusikkunassa reaaliaikaisella live-laskennalla.
- **📊 Tulostettava kuukausiraportti**: Valmis A4-tuntikortti työnantajalle tai kirjanpitoon allekirjoituskentillä ja PDF-tulostuksella.
- **📅 Vuosiraportti kirjanpitoon ja laskutukseen**:
  - Koko vuoden tunnit, ansio ja laskutustilanne eriteltynä kuukausittain sekä asiakkaittain.
  - Verottomat summat, ALV ja verolliset summat (ALV-kanta valitaan asetuksista: 25,5 %, 24 %, 14 %, 10 % tai 0 %).
  - **Laskutusrivit** (esim. Invoicer.fi): yksi rivi per kuukausi, asiakas ja tuntihinta: kuvaus, määrä (h), à-hinta ja ALV %.
  - **Kirjanpito CSV**: sarakkeet A–F vastaavat Kirjanpitopohjan (toiminimi) kuukausivälilehtiä 01–12, joten rivit voi liittää suoraan pohjaan.
  - Suodatus yrityksen ja laskutustilan (kaikki / laskutetut / laskuttamatta) mukaan, tulostus ja PDF.
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

> Valmiiksi käännetty versio (`dist`-kansio) on mukana, joten pelkkään käyttöön riittää Node.js: siirry suoraan kohtaan 4. Vaiheet 2–3 tarvitaan vain, jos muokkaat koodia.

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

Sovellus aukeaa omaan Edge-ikkunaansa (tai Chromeen, jos Edgeä ei löydy). Jos kumpaakaan ei löydy, sovellus aukeaa oletusselaimeen osoitteessa `http://127.0.0.1:5173/`. Pidä silloin komentoikkuna auki käytön ajan.

---

## 📅 Vuosiraportin käyttö kirjanpidossa

1. Avaa **Vuosiraportti** yläpalkista ja valitse vuosi.
2. Tarkista asetuksista (⚙️) ALV-kanta. Tuntipalkka on aina veroton hinta.
3. **Laskutus**: Laskutusrivit-taulukosta näet jokaisen asiakkaan kuukauden tunnit ja à-hinnan laskulle (esim. Invoicer.fi).
4. **Kirjanpito**: Lataa *Kirjanpito CSV* ja avaa se Excelissä. Kopioi kuukauden rivien sarakkeet **A–F** ja liitä ne Kirjanpitopohjan saman kuukauden välilehdelle (01–12) ensimmäiselle vapaalle riville. Pohjan solussa F1 pitää olla *Verollinen summa (brutto)*.
5. Muuta päiväys laskun päiväykseksi (oletuksena kuukauden viimeinen päivä). Kirjanpitoon kirjataan vain lähetetyt laskut, joten käytä tarvittaessa suodatinta *Vain laskutetut*.

---

## 🔄 Päivittäminen uusimpaan versioon

Kaksoisklikkaa sovelluskansiossa `paivita.bat`. Se lataa uusimman version GitHubista (main-haara) ja korvaa sovelluksen tiedostot. Tallennetut tunnit ja asetukset säilyvät, koska ne ovat kansiossa `.browser-profile`, jota päivitys ei koske. Käynnistä sovellus päivityksen jälkeen uudelleen.

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
