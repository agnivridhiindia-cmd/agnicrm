// Generates base64 and patches docxService.js in one step
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const stampPath = path.join(root, 'public/assets/agreement/stamp.jpg');
const sigPath   = path.join(root, 'public/assets/agreement/signature.jpg');

const stampB64 = fs.readFileSync(stampPath).toString('base64');
const sigB64   = fs.readFileSync(sigPath).toString('base64');

console.log('Stamp b64 length:', stampB64.length, '| first 10:', stampB64.substring(0,10));
console.log('Sig   b64 length:', sigB64.length,   '| first 10:', sigB64.substring(0,10));

let src = fs.readFileSync(path.join(root, 'src/pages/Agreement/docxService.js'), 'utf8');

// Replace stamp block — find the const declaration line and replace through the closing backtick+semicolon
const stampMarker = '// Actual Agnivridhi India Private Limited stamp image (base64 embedded)';
const sealSvgMarker = '// Circular Company Seal Stamp SVG';

let stampStart = src.indexOf(stampMarker);
if (stampStart === -1) stampStart = src.indexOf(sealSvgMarker);
if (stampStart === -1) { console.error('ERROR: stamp marker not found'); process.exit(1); }

// Find next occurrence of the pattern: `;\n (closing the template literal)
const stampEnd = src.indexOf('`;\n', stampStart + 30) + 3;

const stampReplacement =
  '// Actual Agnivridhi India Private Limited stamp image (base64 embedded)\n' +
  'const sealStampSvg = `<img src="data:image/jpeg;base64,' + stampB64 + '" alt="Company Stamp" style="width:75px;height:75px;display:block;" />`;\n';

src = src.slice(0, stampStart) + stampReplacement + src.slice(stampEnd);
console.log('Stamp injected at position', stampStart);

// Replace signature block
const sigSvgMarker1 = '// Actual Rahul owner signature image (base64 embedded)';
const sigSvgMarker2 = '// Cursive Rahul Signature SVG';
let sigStart = src.indexOf(sigSvgMarker1);
if (sigStart === -1) sigStart = src.indexOf(sigSvgMarker2);
if (sigStart === -1) { console.error('ERROR: signature marker not found'); process.exit(1); }

const sigEnd = src.indexOf('`;\n', sigStart + 30) + 3;

const sigReplacement =
  '// Actual Rahul owner signature image (base64 embedded)\n' +
  'const rahulSignatureSvg = `<div style="position: relative; height: 50px;"><img src="data:image/jpeg;base64,' + sigB64 + '" alt="Signature" style="position: absolute; width: 160px; height: auto; top: -20px; left: 10px; transform: rotate(-5deg); mix-blend-mode: multiply; pointer-events: none;" /></div>`;\n';

src = src.slice(0, sigStart) + sigReplacement + src.slice(sigEnd);
console.log('Signature injected at position', sigStart);

fs.writeFileSync(path.join(root, 'src/pages/Agreement/docxService.js'), src, 'utf8');
console.log('Done. File size:', src.length, 'bytes');
