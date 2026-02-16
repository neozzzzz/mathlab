export interface Problem {
  top: number[];
  op: number;
  bottom: number[];
  type: "add" | "sub";
}

export interface GeneratorParams {
  type: "add" | "sub";
  operands: number[];
  count: number;
  sheets: number;
  rangeMin: number;
  rangeMax: number;
}

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistinctNumbers(min: number, max: number, count: number): number[] {
  const size = max - min + 1;
  if (count >= size) {
    const all = Array.from({ length: size }, (_, i) => min + i);
    return shuffleInPlace(all).slice(0, count);
  }

  const picked = new Set<number>();
  while (picked.size < count) {
    const value = min + Math.floor(Math.random() * size);
    picked.add(value);
  }
  return Array.from(picked);
}

export function generateSheet(params: GeneratorParams): Problem[] {
  const { type, operands, count, rangeMin, rangeMax } = params;
  const problems: Problem[] = [];
  const used = new Set<string>();
  let attempts = 0;
  const valueCount = Math.min(3, rangeMax - rangeMin + 1);

  while (problems.length < count && attempts < 500) {
    attempts++;
    const op = operands[Math.floor(Math.random() * operands.length)];
    const tops = pickDistinctNumbers(rangeMin, rangeMax, valueCount);

    let valid = true;
    const bottoms = tops.map((n) => {
      const r = type === "sub" ? n - op : n + op;
      if (r < 0) valid = false;
      return r;
    });
    if (!valid) continue;

    const key = [...tops].sort((a, b) => a - b).join(",") + type + op;
    if (used.has(key)) continue;
    used.add(key);

    problems.push({ top: tops, op, bottom: shuffleInPlace([...bottoms]), type });
  }

  return problems;
}

export function generateAllSheets(params: GeneratorParams): Problem[][] {
  const result: Problem[][] = [];
  for (let i = 0; i < params.sheets; i++) {
    result.push(generateSheet(params));
  }
  return result;
}

export function encodeParams(params: GeneratorParams): string {
  return new URLSearchParams({
    t: params.type,
    o: params.operands.join(","),
    c: String(params.count),
    s: String(params.sheets),
    mn: String(params.rangeMin),
    mx: String(params.rangeMax),
  }).toString();
}

export function decodeParams(search: string): GeneratorParams | null {
  const MAX_COUNT = 100;
  const MAX_SHEETS = 10;
  const MIN_RANGE = 1;
  const MAX_RANGE = 9999;
  const p = new URLSearchParams(search);
  const t = p.get("t");
  const o = p.get("o");
  const c = p.get("c");
  const s = p.get("s");
  const mn = p.get("mn");
  const mx = p.get("mx");
  if (!t || !o || !c || !s || !mn || !mx) return null;

  if (t !== "add" && t !== "sub") return null;

  const count = Number(c);
  const sheets = Number(s);
  const rangeMin = Number(mn);
  const rangeMax = Number(mx);
  const operands = o
    .split(",")
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isInteger(n));

  const isRangeValid =
    Number.isInteger(rangeMin) &&
    Number.isInteger(rangeMax) &&
    rangeMin >= MIN_RANGE &&
    rangeMax <= MAX_RANGE &&
    rangeMin <= rangeMax;
  if (!isRangeValid) return null;

  if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) return null;
  if (!Number.isInteger(sheets) || sheets < 1 || sheets > MAX_SHEETS) return null;
  if (operands.length === 0) return null;

  return {
    type: t,
    operands,
    count,
    sheets,
    rangeMin,
    rangeMax,
  };
}
