export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured' });
  }

  const { image, mimeType = 'image/jpeg' } = req.body || {};

  if (!image) {
    return res.status(400).json({ error: 'No meal image provided' });
  }

  const prompt = `Analyze this meal photo for a food diary. Return ONLY valid JSON with this shape:
{
  "mealName": "short name",
  "items": [
    {
      "name": "food name",
      "grams": number,
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number
    }
  ]
}

Estimate edible portions conservatively. Use grams for every item. Use numbers, not strings. Do not include markdown, explanations, or nutritional advice. If uncertain, still provide your best estimate.`;

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

  try {
    const response = await fetch('/api/meal-scan', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    image: base64,
    mimeType: image.type,
  }),
});

const rawResponse = await response.text();

let result;

try {
  result = rawResponse ? JSON.parse(rawResponse) : {};
} catch (parseError) {
  console.error('Meal scan returned invalid JSON:', {
    status: response.status,
    statusText: response.statusText,
    body: rawResponse,
  });

  throw new Error(
    `Meal scan server returned invalid response (${response.status})`
  );
}

if (!response.ok) {
  throw new Error(result.error || 'Meal scan failed');
}

const { payload } = result;

    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return res.status(502).json({ error: 'Gemini returned no meal data' });
    }

    const result = JSON.parse(text);
    const items = Array.isArray(result.items) ? result.items : [];

    return res.status(200).json({
      mealName: result.mealName || 'Scanned meal',
      items: items.map((item) => ({
        name: String(item.name || 'Unknown food'),
        grams: Number(item.grams) || 0,
        calories: Number(item.calories) || 0,
        protein: Number(item.protein) || 0,
        carbs: Number(item.carbs) || 0,
        fat: Number(item.fat) || 0,
      })),
    });
  } catch (error) {
    console.error('Meal scan server error:', error);
    return res.status(500).json({ error: 'Could not analyze meal image' });
  }
}