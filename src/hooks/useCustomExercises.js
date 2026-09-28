import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabase'

export default function useCustomExercises() {
  const [exercises, setExercises] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) {
        setExercises([])
        return
      }
      const { data, error: queryError } = await supabase
        .from('custom_exercises')
        .select('id, user_id, name, measurement_type')
        .eq('user_id', user.id)
        .order('name')
      if (queryError) throw queryError
      setExercises(data ?? [])
    } catch (cause) {
      setError(cause.message || 'No se pudieron cargar los ejercicios.')
      setExercises([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const createExercise = useCallback(async ({ name, measurementType }) => {
    const cleanName = name?.trim().replace(/\s+/g, ' ')
    if (!cleanName || cleanName.length > 80) throw new Error('El nombre debe tener entre 1 y 80 caracteres.')
    if (!['reps', 'time'].includes(measurementType)) throw new Error('Elige repeticiones o tiempo.')

    setSaving(true)
    setError(null)
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('Inicia sesión para crear ejercicios.')

      const { data: existing, error: searchError } = await supabase
        .from('exercises').select('id, name').ilike('name', cleanName)
        .limit(1)
      if (searchError) throw searchError
      if (existing?.length) throw new Error('Este ejercicio ya existe en el catálogo.')

      const { data, error: insertError } = await supabase
        .from('custom_exercises')
        .insert({ user_id: user.id, name: cleanName, measurement_type: measurementType })
        .select('id, user_id, name, measurement_type')
        .single()
      if (insertError) throw insertError
      setExercises((current) => [...current, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    } catch (cause) {
      setError(cause.message || 'No se pudo crear el ejercicio.')
      throw cause
    } finally {
      setSaving(false)
    }
  }, [])

  return { exercises, loading, saving, error, refresh, createExercise }
}