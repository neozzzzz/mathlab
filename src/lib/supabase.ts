import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type WorksheetType =
  | "add"
  | "sub"
  | "add_sub"
  | "mul"
  | "div"
  | "mul_div";

interface MatchProblem {
  top: number[];
  op: number;
  bottom: number[];
  type: "add" | "sub";
}

interface CalcProblem {
  a: number;
  b: number;
  type: WorksheetType;
  answer: number;
}

export type WorksheetProblems = MatchProblem[][] | CalcProblem[][];

function generateShortCode(len = 8): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < len; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

export interface WorksheetRow {
  id: string;
  short_code: string;
  title: string;
  type: WorksheetType;
  operands: number[];
  range_min: number;
  range_max: number;
  problem_count: number;
  problems: WorksheetProblems;
  created_at: string;
}

export async function saveWorksheet(data: {
  title: string;
  type: WorksheetType;
  operands: number[];
  rangeMin: number;
  rangeMax: number;
  problemCount: number;
  problems: WorksheetProblems;
}): Promise<{ shortCode: string } | { error: string }> {
  const shortCode = generateShortCode();

  const { error } = await supabase.from("mathlab_worksheets").insert({
    short_code: shortCode,
    title: data.title,
    type: data.type,
    operands: data.operands,
    range_min: data.rangeMin,
    range_max: data.rangeMax,
    problem_count: data.problemCount,
    problems: data.problems,
  });

  if (error) return { error: error.message };
  return { shortCode };
}

export async function getWorksheet(
  shortCode: string
): Promise<WorksheetRow | null> {
  const { data, error } = await supabase
    .from("mathlab_worksheets")
    .select("*")
    .eq("short_code", shortCode)
    .single();

  if (error || !data) return null;
  return data as WorksheetRow;
}
