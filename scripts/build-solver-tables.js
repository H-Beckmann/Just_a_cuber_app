/**
 * Precomputes the Kociemba solver tables and writes them into the app.
 *
 * Building them at runtime takes ~25s on a phone (Hermes has no JIT), while
 * parsing them back from JSON takes ~45ms. So they are built here, once, on a
 * machine with a JIT, and shipped with the app.
 *
 *   node scripts/build-solver-tables.js
 *
 * Re-run it only if cubejs is upgraded.
 */

const fs = require('fs');
const path = require('path');

const Cube = require('cubejs');

const OUT = path.join(__dirname, '..', 'src', 'lib', 'solverTables.js');

console.log('calculando as tabelas...');
let started = Date.now();
Cube.computeMoveTables();
console.log(`  moveTables ...... ${Date.now() - started} ms`);

started = Date.now();
Cube.computePruningTables();
console.log(`  pruningTables ... ${Date.now() - started} ms`);

const json = JSON.stringify({
  moveTables: Cube.moveTables,
  pruningTables: Cube.pruningTables,
});

// Only digits, brackets, commas and plain keys end up in there, so the JSON
// goes inside single quotes untouched. It is kept as a string on purpose: the
// engine stores it as-is and JSON.parse (native) is far quicker than building
// the same objects out of a literal.
if (json.includes("'") || json.includes('\\')) {
  throw new Error('A serializacao trouxe caracteres que precisam de escape.');
}

const header = `/**
 * GERADO POR scripts/build-solver-tables.js — não edite à mão.
 *
 * Tabelas do solver de duas fases (cubejs), prontas para uso. Veja o script
 * para saber por que elas são pré-calculadas.
 */
`;

fs.writeFileSync(OUT, `${header}module.exports = '${json}';\n`);

const mb = (fs.statSync(OUT).size / 1048576).toFixed(2);
console.log(
  `escrito ${path.relative(path.join(__dirname, '..'), OUT)} (${mb} MB)`,
);
