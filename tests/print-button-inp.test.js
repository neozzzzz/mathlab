const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const PRINT_PAGES = [
  'src/app/preview/page.tsx',
  'src/app/calc/preview/page.tsx',
  'src/app/calc3/preview/page.tsx',
  'src/app/vertical/preview/page.tsx',
  'src/app/time/preview/page.tsx',
  'src/app/s/[id]/page.tsx',
];

// window.print() 는 대화상자가 닫힐 때까지 메인 스레드를 막는다.
// 클릭 핸들러에서 바로 부르면 그 시간이 INP 로 잡히므로 paint 이후로 미뤄야 한다.
test('print buttons defer window.print() until after the next paint', () => {
  for (const file of PRINT_PAGES) {
    const source = read(file);
    assert.doesNotMatch(source, /window\.print\(/, `${file} calls window.print() directly`);
    assert.match(source, /import \{ printAfterPaint \} from "@\/lib\/print";/, `${file} must import printAfterPaint`);
    assert.match(source, /printAfterPaint/, `${file} must use printAfterPaint`);
  }
});

test('printAfterPaint schedules print after a frame and a macrotask', () => {
  const source = read('src/lib/print.ts');
  assert.match(source, /requestAnimationFrame\(\(\) => \{\s*setTimeout\(\(\) => window\.print\(\), 0\);/);
});
