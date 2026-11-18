# Sole Studio

KI-gestütztes Sneaker-Designstudio für eine eigene Streetwear-Marke. Konzept und Phasenplan: [docs/KONZEPT.md](docs/KONZEPT.md).

## Starten

```bash
npm install
```

```bash
npm run dev
```

Danach http://localhost:3000 öffnen.

## KI-Foto (fotorealistische Bilder)

Der Button **KI-Foto** schickt eine Aufnahme der 3D-Ansicht und eine automatisch erzeugte Beschreibung an ein Bildmodell von Google Gemini («Nano Banana») und zeigt das fotorealistische Ergebnis.

1. In [Google AI Studio](https://aistudio.google.com) einen API-Schlüssel erstellen und die Abrechnung aktivieren (Bildmodelle haben kein Gratis-Kontingent; grob 4 bis 7 Rappen pro Bild).
2. `.env.example` nach `.env.local` kopieren und `GEMINI_API_KEY` eintragen.
3. Das Studio neu starten.

Der Schlüssel bleibt auf dem Server (`src/app/api/render/route.ts`) und wird nie an den Browser geschickt. Ein Monatslimit lässt sich im KI-Foto-Fenster einstellen.

## Material-Scans neu laden

Die aufbereiteten Texturen liegen bereits in `public/materials`. Neu laden (z. B. mit anderen Scans):

```bash
python3 -I tools/fetch_assets.py
```

Benötigt Python 3 mit Pillow. Quellen und Lizenzen (CC0): `public/materials/CREDITS.md`.

## Aufbau

- `src/lib/shoe/` – Design-Rezept, Katalog (Teile, Materialien, Vorlagen), 3D-Geometrie, Materialien, Bau-Schritte
- `src/components/viewer/` – 3D-Ansicht (React Three Fiber)
- `src/components/studio/` – Arbeitsoberfläche
- `src/lib/store.ts` – Zustand, Verlauf, Projekte
