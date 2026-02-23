# Depth (MVP)

Werkende **Depth**-MVP (responsive web app) die je lokaal kan draaien.

## Features
- Matching op **kernwaarden (60%)** + **passies (25%)**
- **5 Depth Questions** (verplicht)
- **Foto’s unlocken pas na 5 berichten elk**
- Verificatie flows (MVP-simulatie)
- Basis anti-spam blokkering
- Locatievoorstellen per stad/gemeente

## Starten (1 commando)
1) Installeer **Node.js 20+**
2) Pak de ZIP uit
3) In Terminal:

```bash
cd depth
chmod +x run.sh
./run.sh
```

App: http://localhost:3000

## Demo login
- demo1@depth.local / password123

## Productie-notities
Voor productie heb je o.a. nodig: echte verificatieprovider, S3 storage, rate limiting, logging, audit trails, enz.
