/** Texte für den Bau-Modus: wie ein Sneaker in der Fabrik entsteht. */
export interface BuildStep {
  title: string;
  text: string;
  tip: string;
}

export const BUILD_STEPS: BuildStep[] = [
  { title: "Leisten", text: "Alles beginnt mit dem Leisten, einer Fussform aus Kunststoff. Er bestimmt Passform, Grösse und Silhouette. Aus ihm entstehen die Schnittmuster. Hier zeigt das Futter seine Form.", tip: "Kleine Marken nutzen fast immer einen vorhandenen Leisten des Herstellers. Das spart Zeit und Geld." },
  { title: "Zuschnitt der Grundteile", text: "Seitenteil und Vorderblatt werden mit Stanzmessern aus dem Leder geschnitten. Die Kanten werden dünn geschliffen (Schärfen), damit Nähte flach liegen.", tip: "Wenige, grosse Teile sind günstiger. Jedes zusätzliche Teil bedeutet mehr Zuschnitt und mehr Nähte." },
  { title: "Overlays aufnähen", text: "Zehenkappe, Seitenband, Fersenkappe und Ösenleiste werden auf die Grundteile genäht. Die Ösen werden gestanzt und vernietet.", tip: "Overlays sind deine wichtigste Fläche für Zweitfarben und Materialmix." },
  { title: "Details anbringen", text: "Fersenlasche und Logo-Patch kommen dazu, solange der Schaft noch flach auf dem Tisch liegt. Auch Stickereien und Prägungen passieren jetzt.", tip: "Stickerei wirkt hochwertig, Druck ist günstiger, Prägung ist dezent und casual." },
  { title: "Futter und Zunge", text: "Futter und Schaumpolster werden eingenäht, die Zunge wird angesetzt. Damit ist der Schaft (Upper) fertig. Dieser Schritt heisst «Closing».", tip: "Eine Kontrastfarbe im Futter sieht man beim Anziehen. Ein Detail für Kenner." },
  { title: "Zwicken", text: "Vorder- und Hinterkappe werden eingesetzt, dann wird der Schaft straff über den Leisten gezogen und unten an eine Stoffsohle genäht (Strobel) oder auf eine Brandsohle geklebt.", tip: "Sehr steife oder dicke Materialien lassen sich schwer zwicken und werfen Falten." },
  { title: "Sohle anbringen", text: "Die Cupsole wird angeraut, geklebt und gepresst und anschliessend rundum vernäht. Danach wird der Leisten herausgezogen.", tip: "Eine vorhandene Sohle des Herstellers spart die teure Gussform." },
  { title: "Schnüren und Finish", text: "Einlegesohle rein, Schnürsenkel einziehen, Kleberreste entfernen, Qualitätskontrolle, Seidenpapier, Schachtel.", tip: "Einlegesohle, Senkel und Schachtel sind günstige Stellen für deinen Markenauftritt." },
];
