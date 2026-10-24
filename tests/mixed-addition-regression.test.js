const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const calcPagePath = path.join(__dirname, '..', 'src', 'app', 'calc', 'page.tsx');
const previewPath = path.join(__dirname, '..', 'src', 'app', 'calc', 'preview', 'page.tsx');
const sharePath = path.join(__dirname, '..', 'src', 'app', 's', '[id]', 'page.tsx');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

test('calc page hides mixed-addition from the standard operation menu without duplicating mul/div headings', () => {
  const source = read(calcPagePath);
  const menuBlockMatch = source.match(/<label className="block text-sm font-bold mb-2">연산 유형<\/label>[\s\S]*?<\/div>\n\n\s*<label className="block text-sm font-bold mb-2">수 범위<\/label>/);

  assert.ok(menuBlockMatch, 'calc operation menu block should exist');
  const menuBlock = menuBlockMatch[0];
  const headingMatches = menuBlock.match(/곱하기\/나누기/g) ?? [];

  assert.doesNotMatch(menuBlock, /mixed_addition/);
  assert.doesNotMatch(menuBlock, /세로셈/);
  assert.equal(headingMatches.length, 1, '곱하기/나누기 heading should appear once inside the calc menu block');
});

test('preview routes mixed-addition worksheets to the dedicated sheet renderer', () => {
  const source = read(previewPath);
  assert.match(source, /function MixedAdditionSheet\(/);
  assert.match(source, /mixed_addition: "세로셈 연습"/);
  assert.match(source, /type === "mixed_addition" \? \(/);
  assert.match(source, /<MixedAdditionSheet/);
});

test('shared worksheet page uses the mixed-addition title and dedicated renderer', () => {
  const source = read(sharePath);
  assert.match(source, /ws\.type === "mixed_addition"/);
  assert.match(source, /"세로셈"/);
  assert.match(source, /function MixedAdditionSheet\(/);
  assert.match(source, /<MixedAdditionSheet/);
});
