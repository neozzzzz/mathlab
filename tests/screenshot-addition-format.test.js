const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const previewPath = path.join(__dirname, '..', 'src', 'app', 'calc', 'preview', 'page.tsx');
const sharePath = path.join(__dirname, '..', 'src', 'app', 's', '[id]', 'page.tsx');
const generatorPath = path.join(__dirname, '..', 'src', 'lib', 'math-generator.ts');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function getComponentBlock(source, componentName) {
  const match = source.match(new RegExp(`function ${componentName}\\([\\s\\S]*?\\n}\\n`));
  assert.ok(match, `${componentName} block should exist`);
  return match[0];
}

for (const [name, filePath] of [
  ['preview', previewPath],
  ['share', sharePath],
]) {
  test(`${name}: screenshot worksheet uses textbook-style header and row layout`, () => {
    const source = getComponentBlock(read(filePath), 'ScreenshotAdditionSheet');
    assert.match(source, /text-sm mb-4 text-gray-400/);
    assert.match(source, /점수:&nbsp;&nbsp;&nbsp;&nbsp;\/ \{count\}/);
    assert.match(source, /bg-gray-200 text-gray-600 text-xs font-bold/);
    assert.match(source, /rounded-md border border-\[#b9b9b9\] bg-white/);
    assert.match(source, /min-w-\[34px\]/);
    assert.match(source, /gridTemplateColumns:\s*"repeat\(2, minmax\(0, 1fr\)\)"/);
    assert.match(source, /borderRight:\s*"1px dotted #c7c7c7"/);
    assert.match(source, /rounded-full bg-\[#ededed\]/);
    assert.match(source, /연산해 보세요/);
    assert.match(source, /\{p\.a\} \+ \{p\.b\}/);
    assert.match(source, /\{p\.leftRoundedA\}/);
    assert.match(source, /blankBox\(p\.leftCorrection/);
    assert.match(source, /blankBox\(p\.leftIntermediate/);
    assert.match(source, /\{p\.rightRoundedB\}/);
    assert.match(source, /blankBox\(p\.rightCorrection/);
    assert.match(source, /\{p\.rightIntermediate\}/);
    assert.match(source, /blankBox\(p\.answer/);
    assert.doesNotMatch(source, /여러 가지 방법으로 덧셈하기 \(2\)/);
    assert.doesNotMatch(source, /background:\s*\"#cfcfcf\"/);
  });

  test(`${name}: screenshot worksheet renders the actual three-line formulas from the worksheet reference`, () => {
    const source = getComponentBlock(read(filePath), 'ScreenshotAdditionSheet');
    assert.match(source, /\{p\.a\} \+ \{p\.b\}[\s\S]*\{p\.leftRoundedA\}[\s\S]*blankBox\(p\.leftCorrection[\s\S]*\{p\.b\}/);
    assert.match(source, /= [\s\S]*\{p\.leftRoundedA\}[\s\S]*blankBox\(p\.leftIntermediate/);
    assert.match(source, /blankBox\(p\.answer, `left-answer-\$\{number\}`\)/);
    assert.match(source, /\{p\.a\} \+ \{p\.b\}[\s\S]*\{p\.a\}[\s\S]*\{p\.rightRoundedB\}[\s\S]*blankBox\(p\.rightCorrection/);
    assert.match(source, /\{p\.rightIntermediate\}[\s\S]*blankBox\(p\.rightCorrection/);
    assert.match(source, /blankBox\(p\.answer, `right-answer-\$\{number\}`\)/);
  });

  test(`${name}: screenshot worksheet does not use old dashboard-like layout`, () => {
    const source = getComponentBlock(read(filePath), 'ScreenshotAdditionSheet');
    assert.doesNotMatch(source, /여러 가지 방법으로 덧셈하기 \(2\)/);
    assert.doesNotMatch(source, /background:\s*\"#cfcfcf\"/);
    assert.doesNotMatch(source, /String\.fromCharCode\(9311 \+ n\)/);
    assert.doesNotMatch(source, /fontSize: \"1\.125rem\"/);
  });
}

test('screenshot addition generator uses the worksheet arithmetic transformations from the workbook photo', () => {
  const source = read(generatorPath);
  assert.match(source, /const leftRoundedA = a - Math\.floor\(a \/ 10\)/);
  assert.match(source, /const leftCorrection = a - leftRoundedA/);
  assert.match(source, /const leftIntermediate = leftCorrection \+ b/);
  assert.match(source, /const rightRoundedB = roundUpToTens\(b\)/);
  assert.match(source, /const rightCorrection = rightRoundedB - b/);
  assert.match(source, /const rightIntermediate = a \+ rightRoundedB/);
});

test('calc preview standard worksheet layout matches calc3 spacing and typography', () => {
  const source = getComponentBlock(read(previewPath), 'CalcSheet');
  assert.match(source, /const cols = 3/);
  assert.match(source, /const rows = Math\.ceil\(problems\.length \/ cols\)/);
  assert.match(source, /height: `\$\{gridHeightMm\}mm`/);
  assert.match(source, /text-lg font-semibold tracking-wide/);
  assert.match(source, /bg-gray-200 text-gray-600 text-xs font-bold/);
});
