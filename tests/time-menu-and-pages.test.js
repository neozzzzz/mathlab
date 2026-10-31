const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

test('landing page exposes a time menu card', () => {
  const source = read('src/app/page.tsx');

  assert.match(source, /href:\s*"\/time"/);
  assert.match(source, /title:\s*"시간"/);
});

test('time settings page offers both problem types and min/max time, routing to /time/preview', () => {
  const source = read('src/app/time/page.tsx');

  assert.match(source, /"use client";/);
  assert.match(source, /"time_convert"/);
  assert.match(source, /"time_compare"/);
  assert.match(source, /최소 시간/);
  assert.match(source, /최대 시간/);
  assert.match(source, /encodeTimeParams/);
  assert.match(source, /router\.push\(`\/time\/preview\?\$\{query\}`\)/);
});

test('time preview page renders answer boxes and the circle instruction', () => {
  const source = read('src/app/time/preview/page.tsx');

  assert.match(source, /parseTimeParams/);
  assert.match(source, /generateTimeAllSheets/);
  assert.match(source, /더 긴 시간에 O 표 하세요/);
  assert.match(source, /href="\/time"/);
  assert.match(source, /설정으로 돌아가기/);
});

test('time preview: compare cells have no "( )" placeholder and convert rows share one fixed grid', () => {
  const source = read('src/app/time/preview/page.tsx');

  assert.doesNotMatch(source, /\(&nbsp;/, '비교 문제에는 ( ) 칸을 두지 않는다');
  assert.match(source, /const CONVERT_GRID[\s\S]*display: "grid"[\s\S]*gridTemplateColumns: "[^"]+"/);
  assert.match(source, /<div style=\{CONVERT_GRID\}>/);
});
