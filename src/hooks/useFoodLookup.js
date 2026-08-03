// hooks/useFoodLookup.js
// Calls our 'lookup-food' Edge Function, which handles caching against the
// 'foods' table AND the Open Food Facts request (with a proper User-Agent)
// entirely server-side. This hook no longer talks to Supabase or Open Food
// Facts directly -- it's a thin client for the one trusted endpoint.

import { useState } from 'react';
import { supabase } from '../supabase';

export function useFoodLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function lookupBarcode(barcode) {
    console.log('Sending to edge function:', barcode, typeof barcode);
    setLoading(true);
    setError(null);


    const { data, error: fnError } = await supabase.functions.invoke('lookup-food', {
      body: { barcode },
    });

    setLoading(false);

    if (fnError) {
      setError(fnError.message || 'Lookup failed');
      return null;
    }

    if (data?.error) {
      setError(data.error);
      return null;
    }

    return data.food;
  }

  return { lookupBarcode, loading, error };
}