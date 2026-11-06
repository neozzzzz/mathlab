const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

test('landing page exposes a 시간 3 menu card', () => {
  const source = read('src/app/page.tsx');
  assert.match(source, /href:\s*"\/time3"/);
  assert.match(source, /title:\s*"시간 3"/);
});

test('time3 settings page picks the number of sets and shows pages per set', () => {
  const source = read('src/app/time3/page.tsx');
  assert.match(source, /"use client";/);
  assert.match(source, /time3PagesPerSet\(\)/);
  assert.match(source, /TIME3_SET_OPTIONS/);
  assert.match(source, /encodeTime3Params/);
  assert.match(source, /router\.push\(`\/time3\/preview\?\$\{query\}`\)/);
});

test('time3 preview renders every problem kind and prints after paint', () => {
  const source = read('src/app/time3/preview/page.tsx');
  assert.match(source, /parseTime3Params/);
  assert.match(source, /generateTime3AllSets/);
  assert.match(source, /layoutTime3Set/);
  assert.match(source, /<AnalogClock/);
  assert.match(source, /mirror/);
  assert.match(source, /hideHands/);
  assert.match(source, /printAfterPaint\(\)/);
  assert.match(source, /href="\/time3"/);
  const kinds = [
    'describe', 'describe_before', 'describe_talk', 'compare_two', 'compare_clock_digital', 'order_three',
    'latest_clock', 'mirror_read', 'mirror_before', 'mirror_who', 'match_convert', 'find_wrong', 'sum_blanks',
    'compare_duration', 'clock_elapsed', 'until_clock', 'remaining', 'match_elapsed', 'draw_end',
    'draw_end_repeat', 'essay_arrival',
  ];
  for (const kind of kinds) assert.match(source, new RegExp(`case "${kind}":`), kind);
});
