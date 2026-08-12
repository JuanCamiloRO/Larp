import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export function usePrograms(userId, refreshKey = 0) {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    const { data, error: queryError } = await supabase
      .from("programs")
      .select(`
        id, name, description, is_public, created_at,
        program_routines (
          id, day_label, position,
          routines ( id, name, is_public )
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (queryError) {
      console.error("Failed to load programs:", queryError);
      setError("Could not load your programs.");
      setLoading(false);
      return;
    }

    const withSortedRoutines = (data || []).map((program) => ({
      ...program,
      program_routines: [...(program.program_routines || [])].sort(
        (a, b) => a.position - b.position
      ),
    }));

    setPrograms(withSortedRoutines);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  return { programs, loading, error, reload: load };
}

export async function fetchPublicPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      id, name, description, created_at, user_id,
      program_routines (
        id, day_label, position,
        routines ( id, name )
      )
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load public programs:", error);
    return { programs: [], error: "Could not load community programs." };
  }

  const withSortedRoutines = (data || []).map((program) => ({
    ...program,
    program_routines: [...(program.program_routines || [])].sort(
      (a, b) => a.position - b.position
    ),
  }));

  return { programs: withSortedRoutines, error: "" };
}