const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('landing page exposes a dedicated vertical arithmetic menu card', () => {
  const source = read('src/app/page.tsx');

  assert.match(source, /href:\s*"\/vertical"/);
  assert.match(source, /title:\s*"사칙 연산 \(세로셈\)"/);
  assert.match(source, /badge:\s*"세로셈 · 두 자리 수 덧셈"/);
});

test('vertical settings page uses mixed_addition and routes generation to /vertical/preview', () => {
  const source = read('src/app/vertical/page.tsx');

  assert.match(source, /"use client";/);
  assert.match(source, /const \[type\] = useState<CalcType>\("mixed_addition"\)/);
  assert.match(source, /사칙 연산 \(세로셈\)/);
  assert.match(source, /문제 생성 설정/);
  assert.match(source, /router\.push\(`\/vertical\/preview\?\$\{query\}`\)/);
});

test('vertical preview page renders mixed addition worksheets with dedicated title and back link', () => {
  const source = read('src/app/vertical/preview/page.tsx');

  assert.match(source, /MixedAdditionSheet/);
  assert.match(source, /세로셈 연습/);
  assert.match(source, /href="\/vertical"/);
  assert.match(source, /설정으로 돌아가기/);
});
