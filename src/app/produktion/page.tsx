import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { BUILD_STEPS } from "@/lib/shoe/construction";
import { Checklist } from "./Checklist";
import { CostCalculator } from "./CostCalculator";

export const metadata: Metadata = {
  title: "Produktions-Handbuch · Sole Studio",
  description: "Wie Sneaker produziert werden und worauf du schon beim Entwerfen achten musst.",
};

const TOC: [string, string][] = [
  ["ablauf", "Der Weg zum fertigen Paar"],
  ["bau", "Wie ein Sneaker gebaut wird"],
  ["leisten", "Leisten, Passform und Grössen"],
  ["konstruktion", "Schnitt, Nähte und Konstruktion"],
  ["bauweisen", "Bauweisen und Sohlen"],
  ["materialien", "Materialien"],
  ["farben", "Farben und Farbfreigabe"],
  ["techpack", "Das Tech Pack"],
  ["muster", "Musterrunden"],
  ["kosten", "Kosten und Kalkulation"],
  ["hersteller", "Hersteller finden"],
  ["qualitaet", "Qualität und Tests"],
  ["recht", "Kennzeichnung und Recht"],
  ["checkliste", "Checkliste vor dem Tech Pack"],
  ["glossar", "Glossar"],
  ["quellen", "Quellen"],
];

function Sec({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 border-t border-line py-12">
      <span className="label">{eyebrow}</span>
      <h2 className="mt-2 font-display text-[clamp(24px,3vw,32px)] font-extrabold leading-tight [text-wrap:balance]">{title}</h2>
      <div className="mt-5 grid gap-5 text-[15px] leading-relaxed text-fg/90">{children}</div>
    </section>
  );
}

function Note({ children, tone = "accent" }: { children: ReactNode; tone?: "accent" | "warn" }) {
  return (
    <div className={`rounded-xl border p-4 text-[14px] leading-relaxed ${tone === "warn" ? "border-warn/40 bg-warn/[0.07]" : "border-accent/30 bg-accent/[0.06]"}`}>{children}</div>
  );
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[620px] border-collapse text-[13.5px]">
        <thead>
          <tr>{head.map((h) => <th key={h} className="border-b border-line bg-panel-2 px-3.5 py-2.5 text-left font-mono text-[10.5px] font-normal uppercase tracking-[0.08em] text-faint">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="align-top">
              {r.map((c, j) => <td key={j} className={`border-b border-line px-3.5 py-3 ${j === 0 ? "font-semibold text-fg" : "text-muted"}`}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Steps({ items }: { items: { title: string; text: ReactNode; meta?: string }[] }) {
  return (
    <ol className="grid gap-px overflow-hidden rounded-xl border border-line bg-line">
      {items.map((s, i) => (
        <li key={s.title} className="grid grid-cols-[34px_1fr] gap-3 bg-panel p-4">
          <span className="grid h-7 w-7 place-items-center rounded-full border border-accent/40 font-mono text-[12px] text-accent">{i + 1}</span>
          <div className="grid gap-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <b className="text-[15px] font-semibold">{s.title}</b>
              {s.meta && <span className="font-mono text-[11px] text-faint">{s.meta}</span>}
            </div>
            <div className="text-[14px] leading-relaxed text-muted">{s.text}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Bullets({ items }: { items: ReactNode[] }) {
  return (
    <ul className="grid gap-2 pl-5 text-[14.5px] [list-style:square] marker:text-accent/60">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

const DFM = [
  { title: "Wenige Teile, klare Nähte", text: "Jedes Teil braucht ein eigenes Stanzmesser pro Grösse und eigene Nähte. Weniger Teile = günstiger und robuster." },
  { title: "Overlays an Verschleisszonen", text: "Spitze, Seitenband und Ferse aus festem Material. Mesh oder Strick dort nur mit Overlay darüber." },
  { title: "Höchstens 3 Hauptfarben, wenige Material-Farb-Kombinationen", text: "Jede Kombination ist eine eigene Bestellung beim Lieferanten mit eigener Mindestmenge und eigener Farbfreigabe." },
  { title: "Vorhandene Sohle und vorhandenen Leisten nutzen", text: "Frag zuerst, was der Hersteller hat. Eine eigene Sohle braucht Gussformen, oft pro Grösse." },
  { title: "Nahtabstände und Überlappungen einplanen", text: "Overlays überlappen das darunterliegende Teil um einige Millimeter. Sehr schmale Streifen lassen sich schlecht nähen." },
  { title: "Keine spitzen Innenecken", text: "Spitze Ecken an Schnittteilen reissen ein und lassen sich schlecht nähen. Lieber mit kleinem Radius runden." },
  { title: "Bauweise passend zum Material", text: "EVA verträgt keine Vulkanisierung. Vulkanisierte Schuhe brauchen Metall-Leisten und eine spezialisierte Fabrik." },
  { title: "Pantone-Referenz für jede Farbe", text: "Für jedes Teil eine Pantone-Nummer (TCX für Textil) angeben und mit physischen Mustern prüfen, nicht am Bildschirm." },
  { title: "Logo-Methode festgelegt", text: "Prägung, Druck, Stickerei, gewebtes Etikett oder Gummi-Patch, mit Grösse und Position in Millimetern." },
  { title: "Grössenlauf begrenzt", text: "Für den Start wenige Grössen. Jede Grösse braucht Leisten, Stanzmesser und eventuell Sohlenformen." },
  { title: "Pflege und Imprägnierung", text: "Helles Wildleder und Nubuk ab Werk imprägnieren lassen und im Tech Pack vermerken." },
  { title: "Kennzeichnung und Etiketten geplant", text: "Materialangaben für Obermaterial, Futter und Laufsohle, Grösse, Herkunftsland und Pflegehinweis." },
  { title: "Markenrecht geprüft", text: "Keine geschützten Erkennungsmerkmale fremder Marken (Seitenlogos, typische Silhouetten-Details)." },
  { title: "Verpackung definiert", text: "Schachtel, Seidenpapier, Ersatzsenkel, Hangtag. Verpackung ist Teil der Kalkulation." },
];

const GLOSSARY: [string, string, string][] = [
  ["Aglet", "Aglet", "Kunststoff- oder Metallende am Schnürsenkel."],
  ["Brandsohle", "Insole Board", "Feste Innensohle, auf die der Schaft beim Zwicken geklebt wird."],
  ["Closing", "Closing", "Zusammennähen aller Schaftteile zum fertigen Obermaterial."],
  ["Cupsole", "Cupsole", "Vorgeformte Gummi-Wanne mit hohem Rand, wird angeklebt und meist vernäht."],
  ["Einlegesohle", "Sockliner", "Herausnehmbare Komfortsohle im Schuh."],
  ["Einstandspreis", "Landed Cost", "Fabrikpreis plus Fracht, Zoll, Verpackung und anteilige Einmalkosten."],
  ["FOB", "Free on Board", "Preis ab Fabrik bzw. Hafen, ohne Transport und Zoll."],
  ["Fersenkappe", "Heel Counter", "Sichtbares Overlay an der Ferse, darunter eine feste Hinterkappe."],
  ["Foxing", "Foxing Tape", "Gummiband rund um vulkanisierte Schuhe."],
  ["Grading", "Grading", "Ableiten aller Grössen aus dem Schnitt der Mustergrösse."],
  ["Hinterkappe", "Counter", "Unsichtbare Versteifung, die die Ferse in Form hält."],
  ["Lab Dip", "Lab Dip", "Farbmuster eines Lieferanten zur Freigabe einer Farbe."],
  ["Leisten", "Last", "Fussform, über die der Schuh gebaut wird."],
  ["MOQ", "Minimum Order Quantity", "Mindestbestellmenge, meist pro Modell und Farbe."],
  ["Overlay", "Overlay", "Aufgenähtes Teil über einem Grundteil."],
  ["Schaft", "Upper", "Das komplette Obermaterial ohne Sohle."],
  ["Schärfen", "Skiving", "Ausdünnen der Lederkanten, damit Nähte flach liegen."],
  ["Seitenteil", "Quarter", "Hinteres Seitenteil mit Ösenleiste."],
  ["Stanzmesser", "Cutting Die", "Formmesser zum Ausstanzen eines Teils, pro Teil und Grösse."],
  ["Strobel", "Strobel", "Stoffsohle, die beim Zwicken an den Schaft genäht wird."],
  ["Tech Pack", "Tech Pack", "Technische Beschreibung des Schuhs für den Hersteller."],
  ["Vorderblatt", "Vamp", "Vorderes Grundteil über dem Vorderfuss."],
  ["Vorderkappe", "Toe Puff", "Unsichtbare Versteifung, die die Spitze in Form hält."],
  ["Zehenkappe", "Toe Cap", "Sichtbares Overlay an der Spitze."],
  ["Zwicken", "Lasting", "Den Schaft straff über den Leisten ziehen und befestigen."],
  ["Zwischensohle", "Midsole", "Dämpfende Schicht zwischen Schaft und Laufsohle."],
];

const SOURCES: [string, string][] = [
  ["Shoemakers Academy: Kosten eines Sneakers, Stanzmesser, Leisten, Grading", "https://shoemakersacademy.com/how-much-does-it-cost-to-build-a-sneaker/"],
  ["Shoemakers Academy: Designer's Guide to Shoe Leather", "https://shoemakersacademy.com/shoe_leather"],
  ["Shoemakers Academy: Cold Cement vs. Vulcanized", "https://shoemakersacademy.com/cold-cement-vs-vulcanized-shoe-construction/"],
  ["Shoemakers Academy: Outsole Design und Werkzeugkosten", "https://shoemakersacademy.com/outsole-design-for-shoes/"],
  ["Shoemakers Academy: Spezifikationszeichnungen", "https://shoemakersacademy.com/?p=3650"],
  ["Techpacker: Tech Pack für Sneaker", "https://techpacker.com/blog/design/how-to-create-a-tech-pack-for-sneakers/"],
  ["Trailrun Footwear: Musterentwicklung, Zeitplan und Kosten", "https://www.trailrunfootwear.com/blog/shoe-sample-development-process"],
  ["Hoog Store: MOQ für Start-ups", "https://www.hoogstore.com/shoe-manufacturing-moq-explained-how-new-brands-should-plan-their-first-order"],
  ["Bona Shoes: Kleine Marken und OEM-Fabriken", "https://www.bonashoes.com/how-small-brands-can-work-with-sneaker-oem-factories/"],
  ["Your Next Store: Sneaker-Marke gründen", "https://yournextstore.com/blog/how-to-start-a-sneaker-brand"],
  ["EightX: Preisstrategie für Schuhmarken", "https://eightx.co/blog/footwear-brand-pricing-strategy"],
  ["EU: Kennzeichnung von Schuhen (Your Europe)", "https://europa.eu/youreurope/business/product-requirements/labels-markings/footwear-label/indexamp_de.htm"],
  ["Richtlinie 94/11/EG (Volltext)", "https://eur-lex.europa.eu/eli/dir/1994/11/2013-07-01/eng"],
  ["KPMG: Aufhebung der Schweizer Industriezölle 2024", "https://kpmg.com/ch/en/insights/taxes/abolition-swiss-import-duties.html"],
  ["IGE: Designschutz (Broschüre)", "https://www.ige.ch/fileadmin/user_upload/schuetzen/designs/d/Broschuere_Designschutz_DE.pdf"],
  ["Swissmem: Gebühren Markenschutz", "https://www.swissmem.ch/de/markenschutz-wird-guenstiger.html"],
  ["QIMA: Schuhprüfungen", "https://www.qima.com/testing/footwear"],
  ["Intertek: Footwear Testing", "https://www.intertek.com/footwear/"],
  ["X-Rite: Farbfreigabe für Bekleidung und Schuhe", "https://xrite.com/learning-color-education/using-our-solutions/accelerate-apparel-color-approvals"],
];

export default function ProduktionPage() {
  return (
    <div className="min-h-full bg-bg">
      <header className="sticky top-0 z-30 border-b border-line bg-panel-2/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center gap-4 px-[max(16px,env(safe-area-inset-left))] py-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-accent font-display text-[10px] font-black text-accent-ink">SS</span>
            <span className="font-display text-[14px] font-extrabold tracking-wide [font-stretch:125%]">SOLE STUDIO</span>
          </Link>
          <span className="text-[13px] text-muted">Produktions-Handbuch</span>
          <div className="flex-1" />
          <Link href="/" className="inline-flex min-h-9 items-center rounded-lg bg-accent px-3 text-[13px] font-semibold text-accent-ink">Zurück zum Studio</Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1180px] gap-10 px-[max(16px,env(safe-area-inset-left))] pr-[max(16px,env(safe-area-inset-right))] lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav aria-label="Inhalt" className="hidden lg:block">
          <ol className="sticky top-20 grid gap-0.5 py-12 text-[13px]">
            {TOC.map(([id, t]) => (
              <li key={id}><a href={`#${id}`} className="block rounded-md px-2.5 py-1.5 text-muted hover:bg-raise hover:text-fg">{t}</a></li>
            ))}
          </ol>
        </nav>

        <main className="min-w-0 max-w-[780px] pb-24">
          <div className="py-12">
            <span className="label">Grundlagen für Designer</span>
            <h1 className="mt-3 font-display text-[clamp(34px,5vw,54px)] font-black uppercase leading-[0.98] [font-stretch:125%]">Vom Entwurf<br /><span className="text-accent">zum fertigen Paar</span></h1>
            <p className="mt-5 max-w-[64ch] text-[16px] leading-relaxed text-muted">
              Wer weiss, wie ein Schuh produziert wird, entwirft Schuhe, die sich herstellen lassen, im Budget bleiben und lange halten. Dieses Handbuch erklärt die Grundlagen in der Reihenfolge, in der sie dir begegnen, mit konkreten Tipps für dein Design.
            </p>
            <Note tone="warn">
              <b>Zu den Zahlen:</b> Preise, Mengen und Zeiten stammen aus Branchenquellen (unten verlinkt) und schwanken stark je nach Hersteller, Land und Menge. Sie sind Orientierungswerte für deine Planung, keine Offerte. Verbindlich ist nur, was dir ein Hersteller schriftlich anbietet.
            </Note>
          </div>

          <Sec id="ablauf" eyebrow="Überblick" title="Der Weg zum fertigen Paar">
            <p>Für eine erste eigene Kollektion solltest du grob mit drei bis sechs Monaten rechnen. Am meisten Zeit kosten die Musterrunden.</p>
            <Steps
              items={[
                { title: "Entwurf", meta: "Im Studio", text: "Form, Teile, Materialien und Farben festlegen. Den Produktions-Check im Studio grün bekommen." },
                { title: "Tech Pack", meta: "1–2 Wochen", text: "Technische Ansichten, Materialliste, Farbcodes, Masse und Konstruktion. Das ist die Arbeitsgrundlage für den Hersteller." },
                { title: "Hersteller finden", meta: "2–6 Wochen", text: "Angebote einholen, Mindestmengen, Musterkosten und Lieferzeiten vergleichen." },
                { title: "Erstes Muster", meta: "ca. 2–6 Wochen", text: "Ein Prototyp in deiner Mustergrösse, oft noch mit Ersatzmaterialien. Eigene Sohlenformen brauchen zusätzlich etwa 30–45 Tage." },
                { title: "Korrekturen", meta: "meist 2–3 Runden", text: "Passform, Proportionen, Nähte und Details anpassen, bis ein Bestätigungsmuster freigegeben ist." },
                { title: "Farb- und Verkaufsmuster", meta: "2–4 Wochen", text: "Jede Farbvariante einmal in den echten Materialien, für Fotos und Vorverkauf." },
                { title: "Bestellung", meta: "Anzahlung oft 50 %", text: "Mengen pro Grösse festlegen. Üblich ist eine Anzahlung bei Bestellung und der Rest bei Versand." },
                { title: "Produktion, Kontrolle, Versand", meta: "ca. 4–9 Wochen", text: "Herstellung, Qualitätskontrolle vor dem Versand, Transport und Verzollung." },
              ]}
            />
          </Sec>

          <Sec id="bau" eyebrow="In der Fabrik" title="Wie ein Sneaker gebaut wird">
            <p>Diese acht Schritte siehst du im Studio auch im <Link href="/" className="text-accent underline underline-offset-2">Bau-Modus</Link> in 3D.</p>
            <Steps items={BUILD_STEPS.map((b) => ({ title: b.title, text: <>{b.text} <span className="text-fg/80">Für dein Design: {b.tip}</span></> }))} />
          </Sec>

          <Sec id="leisten" eyebrow="Passform" title="Leisten, Passform und Grössen">
            <p>Der <b>Leisten</b> ist die Fussform, über die der Schuh gebaut wird. Er bestimmt Passform, Zehenform, Risthöhe und die Silhouette. Darum gilt: Die Form deines Schuhs entsteht zuerst am Leisten, erst dann am Schnitt.</p>
            <Bullets
              items={[
                <>Für die Produktion braucht es einen Leisten <b>pro Grösse und pro Fuss</b>. Grosse Fabriken haben Hunderte davon.</>,
                <>Kleine Marken nutzen fast immer einen <b>vorhandenen Leisten</b> des Herstellers. Ein eigener Leisten kostet laut Branchenquellen einige hundert USD pro Grösse (z. B. ca. 200 USD für eine Kopie, bis ca. 750 USD für eine Neuentwicklung).</>,
                <>Ein EU-Grössenschritt entspricht <b>2/3 cm Leistenlänge</b> («Pariser Stich»). Die übrigen Grössen werden aus der Mustergrösse abgeleitet (<i>Grading</i>), heute meist am Computer.</>,
                <>Starte mit einem <b>begrenzten Grössenlauf</b>, zum Beispiel EU 40–45. Halbe Grössen und sehr kleine oder grosse Grössen erhöhen die Werkzeugkosten.</>,
                <>Lass das erste Muster von mehreren Personen anprobieren. Füsse wachsen nicht linear mit der Grösse, die Passform kann je nach Grösse unterschiedlich ausfallen.</>,
              ]}
            />
          </Sec>

          <Sec id="konstruktion" eyebrow="Schnitt" title="Schnitt, Nähte und Konstruktion">
            <p>Aus dem Leisten entsteht das <b>Schnittmuster</b>: jedes Teil deines Entwurfs als flache Form. Für jedes Teil und jede Grösse wird ein <b>Stanzmesser</b> gebaut. Laut Branchenquellen kostet ein Satz mehrere tausend USD. Bei kleinen Mengen wird das oft separat verrechnet.</p>
            <Table
              head={["Thema", "Was es ist", "Worauf du achtest"]}
              rows={[
                ["Überlappung", "Overlays liegen einige Millimeter auf dem Teil darunter und werden durch beide Lagen genäht.", "Genug Fläche für die Naht einplanen, sehr schmale Streifen vermeiden."],
                ["Schärfen", "Lederkanten werden dünn geschliffen, damit sie flach liegen.", "Bei dickem Leder oder Nubuk besonders wichtig, sonst entstehen Wülste."],
                ["Nahtreihen", "Einfach- oder Doppelnaht, Abstand zur Kante wenige Millimeter.", "Doppelnähte wirken hochwertig und halten besser, kosten aber Nähzeit."],
                ["Stichdichte", "Anzahl Stiche pro Länge.", "Zu wenige Stiche wirken billig, zu viele perforieren das Leder. Mit dem Hersteller festlegen."],
                ["Garn", "Farbe und Stärke des Nähgarns.", "Ton in Ton wirkt ruhig, Kontrastgarn betont die Linien. Garnfarbe ins Tech Pack."],
                ["Perforation", "Gestanzte Luftlöcher, z. B. auf der Zehenkappe.", "Braucht eigenes Werkzeug. In Glattleder sauberer als in Wildleder."],
                ["Kanten", "Geschnittene, gefärbte oder umgelegte Kanten.", "Umgelegte Kanten wirken edler, sind aber teurer."],
              ]}
            />
            <Note><b>Tipp:</b> Spitze Innenecken an Schnittteilen reissen ein. Runde Ecken mit kleinem Radius lassen sich besser stanzen und nähen.</Note>
          </Sec>

          <Sec id="bauweisen" eyebrow="Konstruktion" title="Bauweisen und Sohlen">
            <Table
              head={["Bauweise", "So funktioniert sie", "Für dein Design"]}
              rows={[
                ["Cupsole", "Vorgeformte Gummi-Wanne mit hohem Rand. Der Schaft wird hineingeklebt und meist rundum vernäht.", "Ideal für deinen Low-Top. Sehr haltbar. Viele Hersteller haben fertige Cupsoles, dann fallen keine Formkosten an."],
                ["Vulkanisiert", "Gummisohle und Gummiband (Foxing) werden unter Hitze mit dem Schaft verbunden.", "Flach und flexibel, typisch für Canvas- und Skate-Schuhe. Kein EVA möglich. Braucht Metall-Leisten und eine spezialisierte Fabrik."],
                ["Geklebt (Cemented)", "Zwischensohle aus EVA und Laufsohle aus Gummi werden auf den gezwickten Schaft geklebt.", "Für Runner und Chunky-Modelle. Freie Sohlenformen, aber eigene Formen werden schnell teuer."],
              ]}
            />
            <p>Beim <b>Zwicken</b> wird der Schaft entweder an eine Stoffsohle genäht (<b>Strobel</b>, flexibel, typisch für Sportschuhe) oder auf eine feste <b>Brandsohle</b> geklebt (stabiler, typisch für Court-Schuhe).</p>
            <Note tone="warn"><b>Kostentreiber Sohlenform:</b> Branchenquellen nennen für Sohlenformen grob 1500 bis 5000 USD, teils pro Grösse. Mehrteilige Sohlen mit Gummi, EVA und Kunststoffelementen können ein Vielfaches kosten. Darum: für den Start eine vorhandene Sohle nutzen und dich über Obermaterial, Farben und Details abheben.</Note>
          </Sec>

          <Sec id="materialien" eyebrow="Material" title="Materialien">
            <Table
              head={["Material", "Eigenschaften", "Worauf achten"]}
              rows={[
                ["Glattleder", "Für Sneaker meist um 1,2–1,6 mm. Vollnarbig: natürliche Oberfläche, hochwertig. Korrigierter Narben: angeschliffen und geprägt, gleichmässiger und günstiger.", "Gerbung (chromgegerbt oder vegetabil) und Herkunft angeben. Zertifikate wie LWG zeigen eine verantwortungsvolle Gerberei."],
                ["Wildleder (Suede)", "Spaltleder mit angerauter Oberfläche, meist 1,2–1,8 mm. Weicher, warmer Look.", "Empfindlich gegen Wasser und Schmutz, Imprägnierung einplanen. Farbe wirkt dunkler und satter als auf Glattleder."],
                ["Nubuk", "Angeschliffenes Narbenleder, fester als Wildleder, oft 1,8–2,2 mm.", "Edel, aber fleckempfindlich. Gut für monochrome Designs."],
                ["Canvas", "Baumwollgewebe, Gewicht in g/m² oder oz.", "Günstig und leicht zu verarbeiten. Ideal für vulkanisierte Schuhe."],
                ["Mesh und Strick", "Atmungsaktive Textilien.", "Brauchen Verstärkung dahinter und Overlays an Verschleisszonen."],
                ["Ripstop", "Reissfestes Gewebe mit Raster.", "Leicht und technisch. Gut für Zunge und Fersenlasche."],
                ["Synthetik / Mikrofaser", "Lederalternativen auf PU-Basis.", "Gleichmässig und oft günstiger. Haltbarkeit und Atmungsaktivität prüfen lassen."],
                ["Gummi", "Laufsohle und Cupsole. Härte in Shore A.", "Rutschfestigkeit und Abrieb testen. Bei dunklen Sohlen «non-marking» verlangen."],
                ["EVA", "Leichter Schaum für Zwischensohlen.", "Gut gedämpft, verträgt aber keine Vulkanisierung."],
              ]}
            />
            <Note><b>Wichtig für dein Budget:</b> Lieferanten haben eigene Mindestmengen pro Material und Farbe. Jede zusätzliche Material-Farb-Kombination in deinem Entwurf ist eine zusätzliche Bestellung. Der Produktions-Check im Studio zählt diese Kombinationen für dich.</Note>
          </Sec>

          <Sec id="farben" eyebrow="Farbe" title="Farben und Farbfreigabe">
            <Bullets
              items={[
                <>Bildschirmfarben sind nur eine Annäherung. Verbindlich sind <b>physische Farbreferenzen</b>, meist Pantone. Für Textilien und Leder wird häufig die Pantone-Reihe <b>TCX</b> (auf Baumwolle gefärbt) verwendet, TPX ist auf Papier gedruckt.</>,
                <>Jeder Lieferant färbt ein <b>Farbmuster (Lab Dip)</b>, das du freigibst. Das gilt pro Material: dieselbe Farbe sieht auf Glattleder, Wildleder, Canvas und Gummi unterschiedlich aus.</>,
                <>Farben werden unter <b>Normlicht</b> verglichen (z. B. D65), weil Farben unter Ladenlicht und Tageslicht anders wirken können.</>,
                <>Plane für die Farbfreigabe Zeit ein. Mehrere Wochen pro Runde sind nicht ungewöhnlich.</>,
                <>Darum hat das Studio einen <b>neutral grauen Designbereich</b>: Auf farbigem Hintergrund würdest du Farben falsch einschätzen.</>,
              ]}
            />
          </Sec>

          <Sec id="techpack" eyebrow="Dokumentation" title="Das Tech Pack">
            <p>Das Tech Pack ist die technische Beschreibung deines Schuhs. Je genauer es ist, desto weniger Musterrunden brauchst du. Es wird während der Musterphase mehrmals überarbeitet: Versionen sauber nummerieren.</p>
            <Table
              head={["Teil", "Inhalt"]}
              rows={[
                ["Ansichten", "Aussenseite (lateral), Innenseite (medial), Ferse, oben und Sohle, mit beschrifteten Teilen."],
                ["Materialliste (BOM)", "Für jedes Teil: Material, Dicke, Oberfläche, Lieferant falls bekannt, Farbe."],
                ["Farben", "Pantone-Nummer pro Teil, Garnfarbe, Farbe von Ösen und Senkeln."],
                ["Konstruktion", "Bauweise, Nahtarten, Doppelnähte, Kanten, Perforation, Verstärkungen."],
                ["Masse", "Für die Mustergrösse: Kragenhöhe, Sohlenhöhe, Positionen von Logos und Details in mm."],
                ["Branding", "Logo-Datei, Methode (Prägung, Druck, Stickerei), Grösse, Position, Farbe."],
                ["Etiketten und Verpackung", "Grössenetikett, Materialkennzeichnung, Schachtel, Seidenpapier, Hangtag."],
                ["Grössenlauf und Mengen", "Gewünschte Grössen und Menge pro Grösse."],
                ["Kostenblatt", "Material, Arbeit, Etiketten, Verpackung, damit Angebote vergleichbar werden."],
              ]}
            />
            <p className="text-muted">Im Studio ist ein automatisch erzeugtes Tech Pack als PDF für Phase 5 geplant.</p>
          </Sec>

          <Sec id="muster" eyebrow="Bemusterung" title="Musterrunden">
            <Steps
              items={[
                { title: "Prototyp (Proto)", text: "Erstes Muster zur Kontrolle von Form und Konstruktion. Oft mit Ersatzmaterialien." },
                { title: "Passform-Muster (Fit Sample)", text: "In mehreren Grössen, um die Passform über den Grössenlauf zu prüfen." },
                { title: "Bestätigungsmuster", text: "In echten Materialien und Farben. Wird von dir freigegeben und gilt als Referenz." },
                { title: "Verkaufsmuster (Salesman Sample)", text: "Für Fotos, Vorverkauf und Händler." },
                { title: "Vorserienmuster (Pre-Production)", text: "Aus der laufenden Produktion. Letzte Kontrolle vor der Serie." },
              ]}
            />
            <p>Branchenquellen nennen Musterkosten von grob <b>80 bis 500 USD pro Paar</b>, je nach Fabrik und Aufwand. Oft werden sie bei einer späteren Bestellung gutgeschrieben. Frag immer, was im Musterpreis enthalten ist und wie viele Korrekturrunden.</p>
          </Sec>

          <Sec id="kosten" eyebrow="Geld" title="Kosten und Kalkulation">
            <Table
              head={["Begriff", "Bedeutung", "Richtwerte aus Branchenquellen"]}
              rows={[
                ["Mindestmenge (MOQ)", "Kleinste Bestellung, meist pro Modell und Farbe.", "Häufig 300–500 Paar. Kleinere Hersteller ab ca. 50–200 Paar, teurer pro Paar."],
                ["FOB-Preis", "Preis pro Paar ab Fabrik, ohne Transport und Zoll.", "Hängt stark von Material, Menge und Land ab."],
                ["Werkzeuge", "Sohlenformen, Stanzmesser, Leisten.", "Sohlenform grob 1500–5000 USD, Stanzmesser-Satz einige tausend USD."],
                ["Einstandspreis", "FOB plus Fracht, Zoll, Verpackung und anteilige Einmalkosten.", "Grundlage für deinen Verkaufspreis."],
                ["Verkaufspreis", "Was der Kunde bezahlt.", "Mindestens 2× Einstandspreis, im Direktverkauf oft 2,5–3,3×."],
                ["Händlerpreis", "Was ein Händler dir bezahlt.", "Oft ca. 50 % des Verkaufspreises."],
              ]}
            />
            <Note>
              <b>Import in die Schweiz:</b> Seit dem 1. Januar 2024 erhebt die Schweiz keine Zölle mehr auf Industriegüter, dazu gehören auch Schuhe. Die Einfuhr-Mehrwertsteuer von 8,1 % fällt weiterhin an. Mit einer MWST-Registrierung kannst du sie als Vorsteuer zurückfordern. Beim Verkauf in die EU gelten dort eigene Zölle und Mehrwertsteuersätze.
            </Note>
            <h3 className="mt-2 font-display text-[19px] font-bold">Rechner: vom Fabrikpreis zum Verkaufspreis</h3>
            <CostCalculator />
          </Sec>

          <Sec id="hersteller" eyebrow="Partner" title="Hersteller finden">
            <Table
              head={["Region", "Stärken", "Zu beachten"]}
              rows={[
                ["Portugal", "Europäische Qualität, erfahrene Schuhindustrie, oft offen für kleinere Mengen.", "Teurer als Asien, dafür kurze Wege und einfachere Kommunikation."],
                ["Italien und Spanien", "Premium-Leder und Handwerk.", "Höhere Preise. Eher für hochwertige Kleinserien."],
                ["China", "Riesige Auswahl an Fabriken, Sohlen und Materialien, schnelle Muster.", "Qualität sehr unterschiedlich. Referenzen und Kontrollen sind besonders wichtig."],
                ["Vietnam und Indonesien", "Produzieren für grosse Sportmarken, hohe Qualität.", "Meist hohe Mindestmengen, für den Start oft schwer zugänglich."],
              ]}
            />
            <p><b>Diese Fragen stellst du jedem Hersteller:</b></p>
            <Bullets
              items={[
                "Wie hoch ist die Mindestmenge, pro Modell, pro Farbe oder pro Bestellung?",
                "Was kostet ein Muster, wie viele Korrekturen sind enthalten, wird es bei Bestellung gutgeschrieben?",
                "Welche Leisten und Sohlen habt ihr bereits, die ich nutzen kann?",
                "Wie lange dauern Muster und Produktion nach Freigabe?",
                "Welche Zahlungsbedingungen gelten (z. B. Anzahlung und Rest bei Versand)?",
                "Welche Zertifikate habt ihr (Sozialstandards, Leder-Herkunft, Chemikalien)?",
                "Wie läuft die Qualitätskontrolle, und darf ich eine unabhängige Prüfung beauftragen?",
                "Für welche Marken produziert ihr, und kann ich Referenzmuster sehen?",
              ]}
            />
            <Note tone="warn"><b>Vorsicht:</b> Viele Ratgeber im Internet stammen von Fabriken, die Kunden suchen. Vergleiche immer mehrere Angebote schriftlich und bezahle grössere Beträge erst nach freigegebenem Muster.</Note>
          </Sec>

          <Sec id="qualitaet" eyebrow="Kontrolle" title="Qualität und Tests">
            <Table
              head={["Prüfung", "Was sie zeigt"]}
              rows={[
                ["Sohlenhaftung", "Wie fest die Sohle am Schaft hält. Die wichtigste Prüfung bei geklebten Schuhen."],
                ["Biegeprüfung (Flex)", "Ob Sohle oder Obermaterial nach vielen Biegungen reissen."],
                ["Abrieb", "Wie schnell Laufsohle und Obermaterial verschleissen."],
                ["Farbechtheit", "Ob Farbe beim Reiben, bei Nässe, Schweiss oder Licht abfärbt oder verblasst."],
                ["Rutschfestigkeit", "Wie gut die Sohle auf glatten Böden greift."],
                ["Schadstoffe", "Ob verbotene Chemikalien enthalten sind. In der EU regelt das REACH."],
              ]}
            />
            <p>Vor dem Versand prüft idealerweise ein <b>unabhängiger Prüfdienst</b> eine Stichprobe nach vereinbarten Qualitätsstufen (AQL): Nähte, Klebstoffreste, Symmetrie links/rechts, Sohlenhaftung, Grössen, Etiketten und Verpackung.</p>
          </Sec>

          <Sec id="recht" eyebrow="Pflichten" title="Kennzeichnung und Recht">
            <h3 className="font-display text-[18px] font-bold">Materialkennzeichnung</h3>
            <p>In der EU schreibt die Richtlinie 94/11/EG eine Materialangabe für drei Teile vor: <b>Obermaterial</b>, <b>Futter und Decksohle</b> sowie <b>Laufsohle</b>. Angegeben wird das Material, das mindestens 80 % ausmacht (Fläche bzw. Volumen), sonst die zwei wichtigsten. Das geht mit Piktogrammen oder Text. Die Kategorien sind Leder, beschichtetes Leder, Textil und sonstige Materialien. Im Online-Verkauf sollten die Angaben ebenfalls stehen.</p>
            <p>Für die Schweiz habe ich keine eigene, gleichwertige Vorschrift gefunden. Wenn du auch in die EU verkaufst, brauchst du die Kennzeichnung ohnehin. Es ist sinnvoll, sie von Anfang an auf jedes Paar zu setzen. Prüfe die aktuelle Rechtslage vor dem Verkauf.</p>
            <h3 className="mt-2 font-display text-[18px] font-bold">Marke und Design schützen</h3>
            <Bullets
              items={[
                <>Eine <b>Marke</b> meldest du in der Schweiz beim Eidgenössischen Institut für Geistiges Eigentum (IGE) an. Laut aktuellen Quellen kostet die Hinterlegung rund CHF 450 (elektronisch teils günstiger). Der Schutz gilt 10 Jahre und kann verlängert werden.</>,
                <>Ein <b>Design</b> (die Gestalt deines Schuhs) kann beim IGE hinterlegt werden. Die Gebühren beginnen bei einigen hundert Franken. Aktuelle Gebühren direkt auf ige.ch prüfen.</>,
                <>Vor der Anmeldung prüfen, ob dein Markenname schon vergeben ist.</>,
                <>Fremde Erkennungsmerkmale wie typische Seitenlogos, Streifen oder markante Silhouetten-Details bekannter Marken sind tabu, auch leicht abgewandelt.</>,
              ]}
            />
            <h3 className="mt-2 font-display text-[18px] font-bold">Weitere Angaben auf dem Etikett</h3>
            <Bullets items={["Grösse (EU, oft zusätzlich UK und US)", "Herkunftsland («Made in …»)", "Artikelnummer und Produktionscharge für Reklamationen", "Pflegehinweise, besonders bei Wildleder und Nubuk"]} />
          </Sec>

          <Sec id="checkliste" eyebrow="Vor dem Tech Pack" title="Checkliste: Ist mein Entwurf produktionsreif?">
            <p>Hake ab, was dein aktueller Entwurf erfüllt. Der Stand wird in diesem Browser gespeichert.</p>
            <Checklist items={DFM} />
          </Sec>

          <Sec id="glossar" eyebrow="Begriffe" title="Glossar">
            <Table head={["Deutsch", "Englisch", "Bedeutung"]} rows={GLOSSARY.map(([de, en, t]) => [de, <span key="en" className="font-mono text-[12.5px]">{en}</span>, t])} />
          </Sec>

          <Sec id="quellen" eyebrow="Recherche" title="Quellen">
            <p className="text-muted">Viele Quellen stammen von Fabriken oder Dienstleistern mit eigenem Interesse. Die Zahlen sind deshalb als Bandbreiten angegeben.</p>
            <ul className="grid gap-1.5 text-[14px]">
              {SOURCES.map(([t, u]) => (
                <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-accent underline-offset-2 hover:underline">{t}</a></li>
              ))}
            </ul>
          </Sec>
        </main>
      </div>
    </div>
  );
}
