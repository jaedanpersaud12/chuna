import { createClient } from "@/utils/supabase/client";
import { STRING_COUNT, Tuning } from "./tunings";

export async function fetchCloudTunings(): Promise<Tuning[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_tunings")
    .select("name, notes")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).filter(
    (t): t is Tuning =>
      typeof t.name === "string" &&
      Array.isArray(t.notes) &&
      t.notes.length === STRING_COUNT
  );
}

export async function saveCloudTuning(
  userId: string,
  name: string,
  notes: number[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_tunings")
    .upsert(
      { user_id: userId, name, notes },
      { onConflict: "user_id,name" }
    );
  if (error) throw error;
}

export async function deleteCloudTuning(name: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("user_tunings").delete().eq("name", name);
  if (error) throw error;
}

export async function renameCloudTuning(
  oldName: string,
  newName: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_tunings")
    .update({ name: newName })
    .eq("name", oldName);
  if (error) throw error;
}
