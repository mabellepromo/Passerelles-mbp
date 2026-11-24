// src/lib/bilanBureau/markup.js
// Mise en forme minimale des textes rédigés du bilan « version bureau ».
// Le même découpage sert à l'écran et au PDF.
//
// Syntaxe (une ligne vide sépare deux blocs) :
//   ## Titre            sous-titre
//   - texte             puce
//   1. texte            liste numérotée
//   [ ] texte           case à cocher (liste de tâches)
//   | a | b |           ligne de tableau (la première ligne = en-tête ;
//                       une ligne |---|---| est ignorée)
//   > texte             encadré (note)
//   {{bloc:nom}}        tableau ou graphique CALCULÉ (seul sur sa ligne)
//   **gras**            dans n'importe quel texte
//   {{cle}}             valeur calculée (voir values.js)

const LIST_PATTERNS = [
  ['bullet', /^-\s+(.*)$/],
  ['numbered', /^\d+\.\s+(.*)$/],
  ['task', /^\[\s?\]\s+(.*)$/],
];

/** Découpe un texte en blocs : { type, text | items | rows | name }. */
export function parseMarkup(source) {
  const blocks = [];
  const lines = String(source ?? '').replace(/\r\n/g, '\n').split('\n');
  let para = [];
  const flushPara = () => {
    if (para.length) blocks.push({ type: 'p', text: para.join(' ') });
    para = [];
  };
  const last = () => blocks[blocks.length - 1];
  // Vrai si la ligne précédente était vide : une ligne vide termine une liste.
  let afterBlank = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushPara(); afterBlank = true; continue; }
    const wasAfterBlank = afterBlank;
    afterBlank = false;

    const bloc = line.match(/^\{\{\s*bloc:([a-z0-9_]+)\s*\}\}$/);
    if (bloc) { flushPara(); blocks.push({ type: 'block', name: bloc[1] }); continue; }

    if (line.startsWith('## ')) { flushPara(); blocks.push({ type: 'h', text: line.slice(3).trim() }); continue; }
    if (line.startsWith('> ')) { flushPara(); blocks.push({ type: 'note', text: line.slice(2).trim() }); continue; }

    if (line.startsWith('|')) {
      flushPara();
      const cells = line.replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
      if (cells.every((c) => /^:?-{2,}:?$/.test(c))) continue; // ligne de séparation
      if (last()?.type === 'table') last().rows.push(cells);
      else blocks.push({ type: 'table', rows: [cells] });
      continue;
    }

    const list = LIST_PATTERNS.find(([, re]) => re.test(line));
    if (list) {
      flushPara();
      const [type, re] = list;
      const text = line.match(re)[1];
      if (last()?.type === type) last().items.push(text);
      else blocks.push({ type, items: [text] });
      continue;
    }

    // Ligne de suite : rattachée à la puce précédente si elle la suit
    // directement (sans ligne vide entre les deux).
    if (!wasAfterBlank && !para.length && ['bullet', 'numbered', 'task'].includes(last()?.type)) {
      const items = last().items;
      items[items.length - 1] += ` ${line}`;
      continue;
    }
    para.push(line);
  }
  flushPara();
  return blocks;
}

/** Découpe « a **b** c » en segments [{ text, bold }]. */
export function splitBold(text) {
  const out = [];
  const re = /\*\*(.+?)\*\*/g;
  let i = 0;
  let mt;
  while ((mt = re.exec(text)) !== null) {
    if (mt.index > i) out.push({ text: text.slice(i, mt.index), bold: false });
    out.push({ text: mt[1], bold: true });
    i = mt.index + mt[0].length;
  }
  if (i < text.length) out.push({ text: text.slice(i), bold: false });
  return out;
}
