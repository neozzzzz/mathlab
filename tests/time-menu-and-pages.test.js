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

test('time settings: 더 긴 시간 고르기 stays at max 20, 단위 바꾸기 options follow the chosen formats', () => {
  const source = read('src/app/time/page.tsx');

  assert.match(source, /time_compare: \[10, 16, 20\]/);
  assert.match(source, /mode === "time_convert" \? timeConvertCountOptions\(formats\) : COUNT_OPTIONS\[mode\]/);
  assert.match(source, /options=\{countOptionsFor\(mode, formats\)\.map/);
});

test('time settings: 60분 이용해 바꾸기 유형은 두 줄 문제라 한 장에 16문제까지', () => {
  const source = read('src/app/time/page.tsx');

  assert.match(source, /value: "time_split", label: "60분 이용해 바꾸기"/);
  assert.match(source, /time_split: \[10, 12, 16\]/);
});

test('time preview: 60분 이용해 바꾸기는 가운데 식과 답 줄을 같은 grid에 둔다', () => {
  const source = read('src/app/time/preview/page.tsx');

  assert.match(source, /time_split: \{ title: "1시간 = 60분 이용하기"/);
  assert.match(source, /gridTemplateColumns: SPLIT_COLUMNS\[problem\.direction\]/);
  assert.match(source, /<MinutesPart value=\{problem\.hours \* 60\} blank=\{problem\.blank === "hours"\} \/>/);
  assert.match(source, /<MinutesPart value=\{problem\.restMinutes\} blank=\{problem\.blank === "rest"\} \/>/);
  assert.match(source, /mode === "time_split" \? \(\s*<SplitColumns/);
});

test('time settings: 단위 바꾸기에서 네 가지 형식을 골라 섞을 수 있다', () => {
  const source = read('src/app/time/page.tsx');

  for (const label of ['바로 바꾸기', '더 긴 시간 고르기', '활동 시간 바꾸기', '문장 문제']) {
    assert.match(source, new RegExp(`label: "${label}"`));
  }
  assert.match(source, /mode === "time_convert" && \(/, '형식 선택은 단위 바꾸기에서만 보인다');
  assert.match(source, /encodeTimeParams\(\{ mode, formats, count, sheets, minMinutes, maxMinutes \}\)/);
});

test('time preview: 섞인 단위 바꾸기는 형식마다 안내가 붙은 구역으로 나눈다', () => {
  const source = read('src/app/time/preview/page.tsx');

  assert.match(source, /const groups = mode === "time_convert" \? groupByFormat\(problems\) : \[\]/);
  assert.match(source, /\{FORMAT_INSTRUCTION\[group\.format\]\}/);
  assert.match(source, /function ActivityRow/);
  assert.match(source, /function WordRow/);
  assert.match(source, /은 몇 분인가요\?/);
  assert.match(source, /분은 몇 시간 몇 분인가요\?/);
});
