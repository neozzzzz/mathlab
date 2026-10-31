const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const SRC = path.join(root, 'src');
const PRINT_HELPER = path.join(SRC, 'lib', 'print.ts');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(tsx?|jsx?)$/.test(entry.name) ? [full] : [];
  });
}

// 대화상자가 닫힐 때까지 메인 스레드를 막는 브라우저 API.
// 클릭 핸들러에서 부르면 대화상자에 머문 시간 전체가 INP 로 잡힌다(AF-1052, CLAUDE.md 참고).
const BLOCKING_CALL = /(?<![\w.])(?:window\.)?(print|alert|confirm|prompt)\(/g;

test('src never calls blocking dialog APIs directly (INP)', () => {
  const offenders = [];
  for (const file of sourceFiles(SRC)) {
    if (file === PRINT_HELPER) continue;
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const m of line.matchAll(BLOCKING_CALL)) {
        offenders.push(`${path.relative(root, file)}:${i + 1} ${m[0]}`);
      }
    });
  }
  assert.deepEqual(offenders, [], 'window.print() 대신 printAfterPaint(), alert/confirm/prompt 대신 화면 안 안내를 쓰세요');
});

test('printAfterPaint schedules print after a frame and a macrotask', () => {
  const source = read('src/lib/print.ts');
  assert.match(source, /requestAnimationFrame\(\(\) => \{\s*setTimeout\(\(\) => window\.print\(\), 0\);/);
});
