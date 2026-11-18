# Sole Studio – Konzept

KI-gestütztes Designstudio für eine eigene Sneaker-Marke. Visuelle Fassung des Konzepts: https://claude.ai/artifact/6tyr6vw9DtdHTJWe2VqfM6

## Entscheidungen

| Thema | Entscheidung |
|---|---|
| Plattform | Web-App (PWA), später bei Bedarf mit Tauri als Desktop-App verpackbar |
| Nutzer | Nur die Markeninhaberin bzw. der Markeninhaber. Datenmodell trotzdem mit Besitzer pro Entwurf |
| Grundformen | Low-Top (Court, Cupsole) als Kernmodell, später ein Chunky-Modell |
| 3D-Modell | Eigenes, parametrisches Modell im Code: Leisten-Fläche, 13 getrennte Teile, Materialdicke, Nähte, Ösen, Cupsole |
| Materialien | Echte CC0-Scans (Poly Haven, ambientCG), in Graustufen aufbereitet und einfärbbar |
| Licht | CC0-Studio-HDRI, Kontaktschatten, Tone Mapping «Neutral» für farbtreue Darstellung |
| KI zuerst | Text zu Design-Änderungen, Varianten-Generator, Referenzbild-Analyse (Phase 3) |
| Geräte | Desktop und iPad (Maus, Touch, Apple Pencil) |
| Look | Dark Pro Studio, Creme-Akzent, neutral grauer Designbereich |
| Budget | Nahe 0 CHF: Gratis-Hosting, günstiges KI-Modell als Standard, Monatslimit |
| Stil | Streetwear, aber casual: Erdtöne, Ton-in-Ton, Materialmix |
| Lernen | Schuhbau statt App-Erklärung: Bau-Modus, Teile-Karten mit Bauwissen |

## Architektur

- **Next.js + TypeScript + Tailwind**, eine Client-Seite für das Studio (`src/components/studio`).
- **3D:** three.js über React Three Fiber und drei (`src/components/viewer`).
- **Design-Rezept** (`src/lib/shoe/types.ts`): Jeder Entwurf ist ein kleines JSON-Objekt (Sohlenhöhe, Farbe und Material pro Teil). Alle Werkzeuge ändern nur dieses Rezept. Daraus folgen Rückgängig, Verlauf, Vorlagen, Speichern und später KI und Tech Pack.
- **Geometrie** (`src/lib/shoe/geometry.ts`): Der Leisten ist eine parametrische Fläche (t entlang der Länge, s rund um den Fuss). Jedes Teil ist ein Ausschnitt davon, mit Versatz nach aussen und sichtbarer Kante. Form-Regler (z. B. Sohlenhöhe) bauen die Geometrie live neu.
- **Materialien** (`src/lib/shoe/materials.ts`): MeshPhysicalMaterial mit Albedo-, Normal- und Roughness-Karten. Wildleder und Nubuk mit Sheen, Mesh mit Alpha-Löchern.
- **Zustand** (`src/lib/store.ts`): zustand, Verlauf, Bau-Modus, Projekte im lokalen Speicher.
- **Assets:** `tools/fetch_assets.py` lädt und bereitet alle Scans auf. Quellen und Lizenzen: `public/materials/CREDITS.md`.

## Phasen

1. **Fundament und Designer** (umgesetzt): 3D-Low-Top mit 13 Teilen, echte Materialien, Studiolicht, Sohlenregler, 9 Vorlagen, Rückgängig/Wiederholen, lokal speichern, PNG-Export, Teile-Karten, Regel-Check, Bau-Modus mit Explosionsansicht, iPad-Layout.
   - **Ausbau Realismus und Produktion** (umgesetzt): Ambient Occlusion und Streiflicht, schlankere Spitze, Doppelnähte, Perforation, Logo-Text auf dem Patch, Fischgrat-Profil, Senkel-Enden mit Aglets, Rille in der Cupsole, Qualitätsschalter, automatisches Sichern des Entwurfs, Produktions-Check mit Kennzeichnungs-Vorschau, Produktions-Handbuch unter `/produktion` mit Kostenrechner und Checkliste.
   - **Modell-Baukasten** (umgesetzt): parametrischer Leisten mit Schafthöhe (Low/Mid/High), Spitzenbreite, -höhe und -form, Gesamtbreite, Zehenhub, vier Sohlentypen (Cupsole, vulkanisiert, Chunky, Runner) mit Sohlen-Überstand; 8 Modelle; Wunsch-Assistent (regelbasiert); Mockup-Szenen Studio, Strasse, Parkhaus, Stadt; Drehteller; Produktions-Check für Sohlentypen und Formen.
   - **Stilrichtungen und Modell-Editor** (umgesetzt): 10 Stilrichtungen, inspiriert von Terrace, Court-Klassikern, Skate-Panel-Lows, Retro-Basketball, Dior (B23, B27, B30), Numeris (Eclipse, Atelier), Campus, ASICS (Gel-Lyte III, Gel-Kayano 14), Converse Chuck Taylor (High und Low), Timberland 6-Inch und minimalistischen Luxus-Sneakern, ohne Logos oder geschützte Merkmale; Konstruktions-Editor (Zehenkappe als Kappe, T-Toe oder keine, Seitenband, Fersenkappe, Ösenleiste, Ösenzahl, Zunge, Kragenausschnitt, Shell Toe, Senkelbreite, geteilte Zunge, Stiefelschaft); Profilsohle mit vernähtem Rand; genarbtes Leder und Mohair-Senkel; «Meine Modelle» speichern, exportieren und importieren.
2. **Bibliothek, Sync und Moodboard:** Supabase-Login, Cloud-Speicher, Versionen und Vergleich, Moodboard mit Pipette, Mockup-Szenen (Studio, Strasse, Parkhaus), Röntgenblick, Bauweise wählen.
3. **KI-Assistent:** Text zu Design, 4 Varianten, Referenzbild-Analyse, Begründungen, Kostenanzeige und Monatslimit.
4. **Ausbau und Marke:** Chunky-Grundform, eigenes Logo, Brand-DNA, Kollektionen, KI-Feedback, Rendering-Video, feinere Details.
5. **Produktionsvorbereitung:** Tech Pack als PDF, technische Ansichten, Pantone-Näherung, Materialliste, GLB-Export, Hersteller-Checkliste.
6. **Später:** KI-Konzeptbilder, KI-Texturen, Pencil-Skizzen auf dem Schuh, AR, Kostenkalkulation.
