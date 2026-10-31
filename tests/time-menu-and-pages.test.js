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
  assert.match(source, /const CONVERT_GRID[\s\S]*display: "grid"/);
  assert.match(source, /gridTemplateColumns: CONVERT_COLUMNS\[problem\.direction\]/);
});

test('time preview: convert sheet splits types into left/right columns and spreads rows over the page', () => {
  const source = read('src/app/time/preview/page.tsx');

  assert.match(source, /const left = problems\.filter\(\(p\) => p\.direction === "to_minutes"\)/);
  assert.match(source, /const right = problems\.filter\(\(p\) => p\.direction === "to_hours"\)/);
  assert.match(source, /gridTemplateRows: `repeat\(\$\{rows\}, minmax\(3\.2rem, 1fr\)\)`/);
  assert.match(source, /className="sheet bg-white mx-auto flex flex-col"/);
});

test('time preview: compare sheet also spreads rows over the page height', () => {
  const source = read('src/app/time/preview/page.tsx');

  assert.match(source, /const compareRows = Math\.max\(Math\.ceil\(problems\.length \/ 2\), 1\)/);
  assert.match(source, /gridTemplateRows: `repeat\(\$\{compareRows\}, minmax\(3\.6rem, 1fr\)\)`/);
});

test('time preview: compare times are shown without box borders', () => {
  const source = read('src/app/time/preview/page.tsx');
  const compareRow = source.slice(source.indexOf('function CompareRow'), source.indexOf('function TimeSheet'));

  assert.ok(compareRow.length > 0);
  assert.doesNotMatch(compareRow, /border/, '비교 문제의 시간에는 네모 칸을 두지 않는다');
});
