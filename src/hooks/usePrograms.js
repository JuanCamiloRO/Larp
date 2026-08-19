import { useCallback, useEffect, useState } from "react";
import { supabase } from "../supabase";

export async function cloneProgramForUser(programId, userId) {
  // 1. Fetch the full source program with nested routines + exercises
  const { data: source, error: fetchError } = await supabase
    .from("programs")
    .select(`
      id, name, description,
      program_routines (
        day_label, position,
        routines ( id, name, routine_exercises ( * ) )
      )
    `)
    .eq("id", programId)
    .single();

  if (fetchError || !source) {
    console.error("Failed to load source program:", fetchError);
    return { program: null, error: "Could not load this program." };
  }

  // 2. Create the new program, owned by this user
  const { data: newProgram, error: programError } = await supabase
    .from("programs")
    .insert({
      user_id: userId,
      name: source.name,
      description: source.description,
      is_public: false, // clones start private; user can share their own copy later
      source_program_id: source.id,
    })
    .select()
    .single();

  if (programError) {
    console.error("Failed to create cloned program:", programError);
    return { program: null, error: "Could not add this program." };
  }

  // 3. Clone each routine + its exercises, then link into the new program
  const createdRoutineIds = [];

  try {
    const sortedSlots = [...(source.program_routines || [])].sort(
      (a, b) => a.position - b.position
    );

    for (const slot of sortedSlots) {
      const sourceRoutine = slot.routines;
      if (!sourceRoutine) continue; // original routine was deleted, skip the slot

      const { data: newRoutine, error: routineError } = await supabase
        .from("routines")
        .insert({
          user_id: userId,
          name: sourceRoutine.name,
          is_public: false,
          source_routine_id: sourceRoutine.id,
        })
        .select()
        .single();

      if (routineError) throw routineError;
      createdRoutineIds.push(newRoutine.id);

      const exerciseRows = (sourceRoutine.routine_exercises || []).map((ex) => {
        const { id, routine_id, ...rest } = ex; // drop old identity, keep the rest
        return { ...rest, routine_id: newRoutine.id };
      });

      if (exerciseRows.length) {
        const { error: exercisesError } = await supabase
          .from("routine_exercises")
          .insert(exerciseRows);
        if (exercisesError) throw exercisesError;
      }

      const { error: slotError } = await supabase
        .from("program_routines")
        .insert({
          program_id: newProgram.id,
          routine_id: newRoutine.id,
          day_label: slot.day_label,
          position: slot.position,
        });
      if (slotError) throw slotError;
    }
  } catch (cloneError) {
    console.error("Failed cloning program routines:", cloneError);
    // best-effort cleanup so we don't leave a half-built program + orphan routines behind
    await supabase.from("programs").delete().eq("id", newProgram.id);
    if (createdRoutineIds.length) {
      await supabase.from("routines").delete().in("id", createdRoutineIds);
    }
    return { program: null, error: "Could not fully copy this program. Please try again." };
  }

  return { program: newProgram, error: "" };
}

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

export async function fetchProgramById(programId) {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      id, user_id, name, description, is_public, created_at,
      program_routines (
        id, day_label, position,
        routines ( id, name, is_public, routine_exercises ( id, default_sets ) )
      )
    `)
    .eq("id", programId)
    .single();

  if (error) {
    console.error("Failed to load program:", error);
    return { program: null, error: "Could not load this program." };
  }

  const withSortedRoutines = {
    ...data,
    program_routines: [...(data.program_routines || [])].sort(
      (a, b) => a.position - b.position
    ),
  };

  return { program: withSortedRoutines, error: "" };
}

export async function fetchPublicPrograms() {
  const { data, error } = await supabase
    .from("programs")
    .select(`
      id, name, description, created_at, user_id,
      profiles ( id, username, name, avatar_url ),
      program_routines (
        id, day_label, position,
        routines ( id, name, routine_exercises ( id, default_sets ) )
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