const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const previewPath = path.join(__dirname, '..', 'src', 'app', 'vertical', 'preview', 'page.tsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getComponentBlock(source, componentName) {
  const match = source.match(new RegExp(`function ${componentName}\\([\\s\\S]*?\\n}\\n`));
  assert.ok(match, `${componentName} block should exist`);
  return match[0];
}

test('vertical preview: mixed-addition grid assigns each digit cell to its own column', () => {
  const source = getComponentBlock(read(previewPath), 'MixedAdditionSheet');

  assert.match(source, /gridTemplateColumns:\s*"12px 2\.2ch 2\.2ch"/);
  assert.match(source, /style=\{\{ \.\.\.digitCellStyle, gridRow: 1, gridColumn: 2 \+ idx \}\}/);
  assert.match(source, /style=\{\{ gridRow: 2, gridColumn: 1, textAlign: "center" \}\}>\+<\/span>/);
  assert.match(source, /style=\{\{ \.\.\.digitCellStyle, gridRow: 2, gridColumn: 2 \+ idx \}\}/);
  assert.match(source, /gridColumn: "1 \/ 4"/);
  assert.doesNotMatch(source, /gridColumn: "2 \/ span 3"/);
});

test('vertical preview: digit boxes and answer box can be toggled on/off', () => {
  const fullSource = read(previewPath);
  const sheet = getComponentBlock(fullSource, 'MixedAdditionSheet');

  assert.match(sheet, /showDigitBoxes: boolean;/);
  assert.match(sheet, /showAnswerBox: boolean;/);
  assert.match(sheet, /\.\.\.\(showDigitBoxes \? null : HIDDEN_BOX_BORDER\)/);
  assert.match(sheet, /style=\{showAnswerBox \? undefined : HIDDEN_BOX_BORDER\}/);
  assert.match(fullSource, /const HIDDEN_BOX_BORDER: React\.CSSProperties = \{ border: "1px solid transparent" \}/);
  assert.match(fullSource, /<BoxToggle label="숫자 네모" checked=\{showDigitBoxes\} onChange=\{setShowDigitBoxes\} \/>/);
  assert.match(fullSource, /<BoxToggle label="답 네모" checked=\{showAnswerBox\} onChange=\{setShowAnswerBox\} \/>/);
  assert.match(fullSource, /showDigitBoxes=\{showDigitBoxes\}/);
  assert.match(fullSource, /showAnswerBox=\{showAnswerBox\}/);
});
