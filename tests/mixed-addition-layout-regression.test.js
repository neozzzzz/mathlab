const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const previewPath = path.join(__dirname, '..', 'src', 'app', 'calc', 'preview', 'page.tsx');
const sharePath = path.join(__dirname, '..', 'src', 'app', 's', '[id]', 'page.tsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getComponentBlock(source, componentName) {
  const match = source.match(new RegExp(`function ${componentName}\\([\\s\\S]*?\\n}\\n`));
  assert.ok(match, `${componentName} block should exist`);
  return match[0];
}

for (const [name, filePath] of [
  ['preview', previewPath],
  ['share', sharePath],
]) {
  test(`${name}: mixed-addition vertical problems are laid out in a 3-column grid instead of a single stacked column`, () => {
    const source = getComponentBlock(read(filePath), 'MixedAdditionSheet');

    assert.match(source, /gridTemplateColumns:\s*"repeat\(3, minmax\(0, 1fr\)\)"/);
    assert.doesNotMatch(source, /<div className="space-y-4">/);
    assert.match(source, /className="flex items-start gap-3(?: min-w-0)?"/);
  });

  test(`${name}: top digits reuse the bottom-digit grid columns and do not render an extra answer line`, () => {
    const source = getComponentBlock(read(filePath), 'MixedAdditionSheet');

    assert.match(source, /gridTemplateColumns:\s*"12px 2\.2ch 2\.2ch"/);
    assert.match(source, /style=\{\{ \.\.\.digitCellStyle, gridRow: 1, gridColumn: 2 \+ idx \}\}/);
    assert.match(source, /style=\{\{ gridRow: 2, gridColumn: 1, textAlign: "center" \}\}>\+<\/span>/);
    assert.match(source, /style=\{\{ \.\.\.digitCellStyle, gridRow: 2, gridColumn: 2 \+ idx \}\}/);
    assert.match(source, /gridColumn: "1 \/ 4"/);
    assert.doesNotMatch(source, /inline-flex items-end border-b-2 border-gray-700/);
    assert.doesNotMatch(source, /gridRow:\s*4/);
  });
}
