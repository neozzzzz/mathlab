const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function getBlock(source, name) {
  const match = source.match(new RegExp(`function ${name}\\([\\s\\S]*?\\n}\\n`));
  assert.ok(match, `${name} block should exist`);
  return match[0];
}

test('screenshot addition sheet reserves worksheet body height, uses a 1-column row-major grid, and removes extra number badge offset', () => {
  const source = read('src/app/calc/preview/page.tsx');
  const block = getBlock(source, 'ScreenshotAdditionSheet');

  assert.match(block, /const cols = 1/);
  assert.match(block, /const rows = Math\.ceil\(problems\.length \/ cols\)/);
  assert.match(block, /const idx = r \* cols \+ c/);
  assert.match(block, /gridHeightMm/);
  assert.match(block, /TOP_OFFSET_MM\s*=\s*4/);
  assert.match(block, /paddingTop:\s*`\$\{TOP_OFFSET_MM\}mm`/);
  assert.match(block, /marginBottom:\s*16/);
  assert.match(block, /gridTemplateRows:\s*`repeat\(\$\{rows\}, minmax\(0, 1fr\)\)`/);
  assert.match(block, /gridTemplateColumns:\s*"repeat\(1, minmax\(0, 1fr\)\)"/);
  assert.doesNotMatch(block, /mr-4/);
  assert.doesNotMatch(block, /self-start/);
});
