// Lit un fichier d'édition (data/days/AAAA-MM-JJ.js ou index.js) et l'affiche en JSON. Utilisé par scripts/auto_edition.py.
// Usage : node scripts/day_tool.mjs <fichier> [day|index]
import fs from 'node:fs';
import vm from 'node:vm';

const [, , file, key = 'day'] = process.argv;
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
const w = sandbox.window;
const out = key === 'index' ? w.SCOOP_DAYS_INDEX : Object.values(w.SCOOP_DAYS || {})[0];
process.stdout.write(JSON.stringify(out));
