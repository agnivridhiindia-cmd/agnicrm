const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const stampB64 = fs.readFileSync(path.join(root, 'public/assets/agreement/stamp_b64.txt'), 'utf8').trim();
const sigB64 = fs.readFileSync(path.join(root, 'public/assets/agreement/sig_b64.txt'), 'utf8').trim();

let src = fs.readFileSync(path.join(root, 'src/pages/Agreement/docxService.js'), 'utf8');

// ── Replace stamp SVG block ──────────────────────────────────────────────────
const stampStart = src.indexOf('// Circular Company Seal Stamp SVG');
const stampEnd = src.indexOf('\n`;\n', stampStart) + 4; // include the closing backtick+semicolon+newline
if (stampStart === -1 || stampEnd < stampStart) {
  console.error('ERROR: Could not find stamp SVG block');
  process.exit(1);
}
const stampReplacement =
  `// Actual Agnivridhi India Private Limited stamp image (base64 embedded for iframe srcDoc)\n` +
  `const sealStampSvg = \`<img src="data:image/jpeg;base64,${stampB64}" alt="Company Stamp" style="width:75px;height:75px;display:block;" />\`;\n`;

src = src.slice(0, stampStart) + stampReplacement + src.slice(stampEnd);

// ── Replace signature SVG block ──────────────────────────────────────────────
const sigStart = src.indexOf('// Cursive Rahul Signature SVG');
const sigEnd = src.indexOf('\n`;\n', sigStart) + 4;
if (sigStart === -1 || sigEnd < sigStart) {
  console.error('ERROR: Could not find signature SVG block');
  process.exit(1);
}
const sigReplacement =
  `// Actual Rahul owner signature image (base64 embedded for iframe srcDoc)\n` +
  `const rahulSignatureSvg = \`<img src="data:image/jpeg;base64,${sigB64}" alt="Signature" style="width:160px;height:65px;display:block;object-fit:contain;object-position:center;" />\`;\n`;

src = src.slice(0, sigStart) + sigReplacement + src.slice(sigEnd);

fs.writeFileSync(path.join(root, 'src/pages/Agreement/docxService.js'), src);
console.log('✓ Stamp replaced:', src.includes(stampB64.substring(0, 20)));
console.log('✓ Signature replaced:', src.includes(sigB64.substring(0, 20)));
console.log('✓ docxService.js updated successfully');
