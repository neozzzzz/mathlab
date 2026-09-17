const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const calcPagePath = path.join(__dirname, '..', 'src', 'app', 'calc', 'page.tsx');

const source = fs.readFileSync(calcPagePath, 'utf8');

test('calc page advanced arithmetic fixes count to 5', () => {
  assert.match(source, /setCount\(5\)/);
  assert.match(source, /count:\s*5/);
  assert.match(source, /5문제 고정/);
});

test('calc page uses renamed advanced arithmetic menu copy', () => {
  assert.match(source, /고급 사칙연산/);
  assert.doesNotMatch(source, /여러 가지 방법으로 덧셈 \(보정 덧셈\)/);
});

test('calc page sample preview copy matches advanced arithmetic example', () => {
  assert.match(source, /예시 \(고급 사칙연산 워크시트\)/);
  assert.match(source, /screenshotSampleRightRoundedB}\s*-\s*\[ \]/);
  assert.match(source, /bg-\[#ededed\]/);
});
