import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
  type: "add" | "sub";
  operands: number[];
  range_min: number;
  range_max: number;
  problem_count: number;
  problems: any;
  created_at: string;
}

export async function saveWorksheet(data: {
  title: string;
  type: "add" | "sub";
  operands: number[];
  rangeMin: number;
  rangeMax: number;
  problemCount: number;
  problems: any;
}): Promise<{ shortCode: string } | { error: string }> {
  const shortCode = generateShortCode();

  const { error } = await supabase.from("worksheets").insert({
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
    .from("worksheets")
    .select("*")
    .eq("short_code", shortCode)
    .single();

  if (error || !data) return null;
  return data as WorksheetRow;
}
