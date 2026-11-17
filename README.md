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
