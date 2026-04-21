import { supabase } from "@/lib/supabase";

export async function getChurchNamesForAssociation(association: string): Promise<string[]> {
  if (!association) return [];

  const { data, error } = await supabase
    .from("ministers")
    .select("current_church_name")
    .eq("association", association)
    .not("current_church_name", "is", null)
    .order("current_church_name", { ascending: true });

  if (error) throw error;

  return Array.from(
    new Set(
      (data || [])
        .map((row) => row.current_church_name?.trim())
        .filter((name): name is string => Boolean(name))
    )
  ).sort((a, b) => a.localeCompare(b));
}
