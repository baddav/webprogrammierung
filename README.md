
# Pokedex (Docker + Node.js + MySQL + Vanilla Frontend)

Einfacher, funktionsfähiger Pokedex:
- **Backend**: Node.js + Express + MySQL (Docker)
- **Frontend**: Vanilla HTML/CSS/JS
- **Datenquelle**: [PokeAPI](https://pokeapi.co/)

## Voraussetzungen
Um dieses Projekt zu starten, müssen Docker und Docker Compose auf dem System installiert sein.
Beides kann kostenlos über die offizielle [Docker-Website](https://www.docker.com/) heruntergeladen werden.

Prüfen kannst du die Installation mit den Befehlen:
```bash
docker --version
docker compose version
```
Wenn beide Befehle funktionieren, ist dein System bereit.

## Start mit Docker

### Projekt bereitstellen
Kopiere oder klone den Projektordner, zum Beispiel `pokedex`.

### Container starten
Führe im Projektordner den folgenden Befehl aus:
```bash
docker compose up --build -d
```
Dadurch werden die MySQL-Datenbank und der Node.js-Server gestartet.
Warte nach dem Start etwa 20 bis 30 Sekunden, bis die Datenbank vollständig initialisiert ist.

### Datenbank befüllen (Seed ausführen)
Damit die Tabellen und die 151 Pokémon-Daten angelegt werden, führe folgenden Befehl aus:
```bash
docker compose exec api npm run seed
```
Dieser Befehl erstellt automatisch die Datenbankstruktur (Tabellen) und lädt die ersten 151 Pokémon sowie einige Fakten aus der PokeAPI.

### Webseite öffnen
Sobald alles läuft, öffne im Browser:
```
http://localhost:3000
```

### Logs ansehen
Um die Serverausgaben zu sehen, nutze:
```bash
docker compose logs -f api
docker compose logs -f db
```

### Container stoppen
Mit folgendem Befehl werden alle Container gestoppt:
```bash
docker compose down
```
Die Daten bleiben im Volume gespeichert.
Wenn du auch die gespeicherten Daten löschen möchtest, nutze:
```bash
docker compose down -v
```

## Hinweise
- Die API läuft auf Port **3000**.
- Die Datenbank (MySQL) läuft auf Port **3306**.
- Wenn einer der Ports bereits belegt ist, kannst du sie in der Datei `docker-compose.yml` anpassen.
