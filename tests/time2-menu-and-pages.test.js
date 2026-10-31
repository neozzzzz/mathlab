const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('landing page exposes a 시간 2 menu card', () => {
  const source = read('src/app/page.tsx');
  assert.match(source, /href:\s*"\/time2"/);
  assert.match(source, /title:\s*"시간 2"/);
});

test('time2 settings page offers the four formats and routes to /time2/preview', () => {
  const source = read('src/app/time2/page.tsx');
  assert.match(source, /"use client";/);
  for (const format of ['convert', 'schedule', 'clock', 'end']) {
    assert.match(source, new RegExp(`value: "${format}"`));
  }
  assert.match(source, /encodeTime2Params/);
  assert.match(source, /router\.push\(`\/time2\/preview\?\$\{query\}`\)/);
});

test('time2 preview renders clocks, timetable, answer boxes and prints after paint', () => {
  const source = read('src/app/time2/preview/page.tsx');
  assert.match(source, /parseTime2Params/);
  assert.match(source, /generateTime2AllSheets/);
  assert.match(source, /<AnalogClock/);
  assert.match(source, /체험 시간표/);
  assert.match(source, /시작한 시각/);
  assert.match(source, /끝난 시각/);
  assert.match(source, /printAfterPaint\(\)/);
  assert.match(source, /href="\/time2"/);
});
