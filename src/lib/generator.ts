import {
  encodeMatchParams,
  generateMatchAllSheets,
  parseMatchParams,
  type MatchParams,
  type MatchProblem,
} from "@/lib/math-generator";

export type Problem = MatchProblem;
export type GeneratorParams = MatchParams;

export function generateSheet(params: GeneratorParams): Problem[] {
  return generateMatchAllSheets(params, encodeMatchParams(params))[0] ?? [];
}

export function generateAllSheets(params: GeneratorParams): Problem[][] {
  return generateMatchAllSheets(params, encodeMatchParams(params));
}

export function encodeParams(params: GeneratorParams): string {
  return encodeMatchParams(params);
}

export function decodeParams(search: string): GeneratorParams | null {
  return parseMatchParams(search);
}
