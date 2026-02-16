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

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function generateSheet(params: GeneratorParams): Problem[] {
  const { type, operands, count, rangeMin, rangeMax } = params;
  const problems: Problem[] = [];
  const used = new Set<string>();
  let attempts = 0;

  const range: number[] = [];
  for (let i = rangeMin; i <= rangeMax; i++) range.push(i);

  while (problems.length < count && attempts < 500) {
    attempts++;
    const op = operands[Math.floor(Math.random() * operands.length)];
    const tops = shuffle(range).slice(0, 3);

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

    problems.push({ top: tops, op, bottom: shuffle(bottoms), type });
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
  const p = new URLSearchParams(search);
  const t = p.get("t");
  const o = p.get("o");
  const c = p.get("c");
  const s = p.get("s");
  const mn = p.get("mn");
  const mx = p.get("mx");
  if (!t || !o || !c || !s || !mn || !mx) return null;
  return {
    type: t as "add" | "sub",
    operands: o.split(",").map(Number),
    count: Number(c),
    sheets: Number(s),
    rangeMin: Number(mn),
    rangeMax: Number(mx),
  };
}
