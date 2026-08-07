import { useState } from 'react';
import { Camera, LoaderCircle, ScanLine, X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import '../css/nutrition.css';

const MEAL_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snacks', label: 'Snacks' },
];

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MealScan({
  defaultMeal = 'lunch',
  onConfirm,
  onClose,
}) {
  const { user } = useAuth();
  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mealType, setMealType] = useState(defaultMeal);
  const [items, setItems] = useState([]);
  const [mealName, setMealName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function handleFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);

    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setItems([]);
    setMealName('');
    setError(null);
  }

  async function scanMeal() {
    if (!image || scanning) return;

    setScanning(true);
    setError(null);

    try {
      const base64 = await fileToBase64(image);
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
          parseError,
        });
        throw new Error(
          `Meal scan API returned an invalid response (${response.status})`
        );
      }

      if (!response.ok) {
        throw new Error(result.error || 'Meal scan failed');
      }

      setMealName(result.mealName || 'Scanned meal');
      setItems(Array.isArray(result.items) ? result.items : []);
    } catch (scanError) {
      console.error('Meal scan failed:', scanError);
      setError(scanError.message || 'Could not scan meal');
    } finally {
      setScanning(false);
    }
  }

  function updateItem(index, field, value) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: field === 'name' ? value : Number(value) || 0,
            }
          : item
      )
    );
  }

  function removeItem(index) {
    setItems((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveMeal() {
    if (!user || !items.length || saving) return;

    setSaving(true);
    setError(null);

    try {
      for (const item of items) {
        await onConfirm(
          {
            food_name: item.name,
            calories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            grams: item.grams,
          },
          mealType,
          item.grams
        );
      }

      onClose?.();
    } catch (saveError) {
      console.error('Saving scanned meal failed:', saveError);
      setError(saveError.message || 'Could not save meal');
    } finally {
      setSaving(false);
    }
  }

  const totals = items.reduce(
    (sum, item) => ({
      calories: sum.calories + (Number(item.calories) || 0),
      protein: sum.protein + (Number(item.protein) || 0),
      carbs: sum.carbs + (Number(item.carbs) || 0),
      fat: sum.fat + (Number(item.fat) || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div
      className="meal-scan-backdrop"
      onMouseDown={onClose}
      role="presentation"
    >
      <section
        className="meal-scan-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Scan meal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="meal-scan-header">
          <div>
            <span className="meal-scan-eyebrow">Nutrition</span>
            <h2>Scan a meal</h2>
          </div>

          <button
            type="button"
            className="meal-scan-close"
            onClick={onClose}
            aria-label="Close meal scan"
          >
            <X size={19} />
          </button>
        </header>

        <input
          id="meal-scan-input"
          className="meal-scan-file-input"
          type="file"
          accept="image/*"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.target.value = '';
          }}
        />

        {!image ? (
          <label htmlFor="meal-scan-input" className="meal-scan-picker">
  <Camera size={24} className="meal-scan-picker-camera" />

  <strong>Scan your meal</strong>

  <small>
    Take a photo or choose one from your library.
  </small>
</label>
        ) : (
          <div className="meal-scan-preview-wrap">
            <img
              src={previewUrl}
              alt="Meal preview"
              className="meal-scan-preview"
            />

            <label htmlFor="meal-scan-input" className="meal-scan-replace">
              <Camera size={15} />
              Choose another photo
            </label>
          </div>
        )}

        {image && !items.length && (
          <button
            type="button"
            className="meal-scan-primary"
            onClick={scanMeal}
            disabled={scanning}
          >
            {scanning ? (
              <>
                <LoaderCircle size={17} className="meal-scan-spinner" />
                Analyzing...
              </>
            ) : (
              <>
                <ScanLine size={17} />
                Scan meal
              </>
            )}
          </button>
        )}

        {items.length > 0 && (
          <div className="meal-scan-review">
            <label className="meal-scan-field">
              Meal type
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
              >
                {MEAL_OPTIONS.map((option) => (
                  <option value={option.value} key={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <input
              className="meal-scan-meal-name"
              value={mealName}
              onChange={(event) => setMealName(event.target.value)}
              aria-label="Meal name"
            />

            <div className="meal-scan-items">
              {items.map((item, index) => (
                <div className="meal-scan-item" key={`${item.name}-${index}`}>
                  <input
                    value={item.name}
                    onChange={(event) =>
                      updateItem(index, 'name', event.target.value)
                    }
                    aria-label="Food name"
                  />
                  <input
                    type="number"
                    value={item.grams}
                    onChange={(event) =>
                      updateItem(index, 'grams', event.target.value)
                    }
                    aria-label="Grams"
                  />
                  <span>g</span>
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    aria-label={`Remove ${item.name}`}
                  >
                    <X size={15} />
                  </button>
                  <small>
                    {Math.round(item.calories)} kcal · P {Math.round(item.protein)}g · C {Math.round(item.carbs)}g · F {Math.round(item.fat)}g
                  </small>
                </div>
              ))}
            </div>

            <div className="meal-scan-totals">
              <strong>{Math.round(totals.calories)} kcal</strong>
              <span>
                P {Math.round(totals.protein)}g · C {Math.round(totals.carbs)}g · F {Math.round(totals.fat)}g
              </span>
            </div>

            <button
              type="button"
              className="meal-scan-primary"
              onClick={saveMeal}
              disabled={saving || !items.length}
            >
              {saving ? 'Saving...' : 'Add to diary'}
            </button>
          </div>
        )}

        {error && <p className="meal-scan-error">{error}</p>}
      </section>
      <div style={{height: '100px'}}></div>
    </div>
  );
}