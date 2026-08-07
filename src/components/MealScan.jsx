import { useRef, useState } from 'react';
import { supabase } from '../supabase';
import '../css/meal-scan.css';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(new Error('Could not read image file'));
    };

    reader.readAsDataURL(file);
  });
}

export default function MealScan({
  onMealScanned,
  onClose,
}) {
  const inputRef = useRef(null);

  const [imagePreview, setImagePreview] =
    useState('');
  const [selectedFile, setSelectedFile] =
    useState(null);
  const [meal, setMeal] = useState(null);
  const [mealType, setMealType] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }

    setError('');
    setMeal(null);
    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleScan() {
    if (!selectedFile) {
      setError('Choose a meal photo first.');
      return;
    }

    setLoading(true);
    setError('');
    setMeal(null);

    try {
      const image = await fileToBase64(selectedFile);

      const {
        data,
        error: functionError,
      } = await supabase.functions.invoke(
        'meal-scan',
        {
          body: {
            image,
            mimeType:
              selectedFile.type || 'image/jpeg',
          },
        }
      );

      if (functionError) {
        throw new Error(
          functionError.message ||
            'Meal scan request failed'
        );
      }

      if (!data || !Array.isArray(data.items)) {
        throw new Error(
          'Meal scan returned an invalid result'
        );
      }

      setMeal(data);
    } catch (scanError) {
      console.error('Meal scan failed:', scanError);

      setError(
        scanError.message ||
          'Could not analyze this meal image.'
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToDiary() {
    if (!meal || !Array.isArray(meal.items)) {
      setError('There are no meal items to save.');
      return;
    }

  if (!mealType) {
    setError('Please choose a meal type.');
    return;
  }

    setSaving(true);
    setError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error(
          'You must be signed in to save a meal.'
        );
      }

      const totals = meal.items.reduce(
        (total, item) => ({
          calories:
            total.calories +
            Number(item?.calories || 0),
          protein:
            total.protein +
            Number(item?.protein || 0),
          carbs:
            total.carbs +
            Number(item?.carbs || 0),
          fat:
            total.fat + Number(item?.fat || 0),
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        }
      );

      const { error: insertError } =
        await supabase
          .from('food_logs')
          .insert({
            user_id: user.id,
            food_name:
              meal.mealName || 'Scanned meal',
            meal_type: mealType,
            grams: 1,
            calories: totals.calories,
            protein: totals.protein,
            carbs: totals.carbs,
            fat: totals.fat,
          });

      if (insertError) {
        throw insertError;
      }

      onMealScanned?.(meal);
      onClose?.();
    } catch (saveError) {
      console.error(
        'Could not add meal to diary:',
        saveError
      );

      setError(
        saveError.message ||
          'Could not add this meal to your diary.'
      );
    } finally {
      setSaving(false);
    }
  }

  const totalCalories = Array.isArray(meal?.items)
    ? meal.items.reduce(
        (total, item) =>
          total + Number(item?.calories || 0),
        0
      )
    : 0;

  return (
    <div className="meal-scan-backdrop">
      <section
        className="meal-scan-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="meal-scan-title"
      >
        <div className="meal-scan-header">
          <div>
            <p className="meal-scan-eyebrow">
              Food diary
            </p>

            <h2 id="meal-scan-title">
              Scan your meal
            </h2>
          </div>

          <button
            type="button"
            className="meal-scan-close"
            onClick={onClose}
            aria-label="Close meal scan"
          >
            ×
          </button>
        </div>

        <label
          htmlFor="meal-scan-input"
          className="meal-scan-picker"
        >
          {imagePreview ? (
            <img
              src={imagePreview}
              alt="Selected meal"
              className="meal-scan-preview"
            />
          ) : (
            <>
              <span
                className="meal-scan-camera"
                aria-hidden="true"
              >
                ◉
              </span>

              <strong>Scan your meal</strong>

              <small>
                Take a photo or choose one from your
                library.
              </small>
            </>
          )}
        </label>

        <div className="meal-scan-meal-type">
  <label htmlFor="meal-type">
    Meal type
  </label>

  <select
    id="meal-type"
    value={mealType}
    onChange={(event) => {
      setMealType(event.target.value);
      setError('');
    }}
    disabled={loading || saving}
  >
    <option value="">
      Choose meal type
    </option>

    <option value="breakfast">
      Breakfast
    </option>

    <option value="lunch">
      Lunch
    </option>

    <option value="dinner">
      Dinner
    </option>

    <option value="snack">
      Snack
    </option>
  </select>
</div>

        <input
          ref={inputRef}
          id="meal-scan-input"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="meal-scan-file-input"
        />

        {error && (
          <p className="meal-scan-error">
            {error}
          </p>
        )}

        {meal && (
          <div className="meal-scan-result">
            <h3>
              {meal.mealName || 'Scanned meal'}
            </h3>

            <div className="meal-scan-items">
              {meal.items.map((item, index) => (
                <div
                  className="meal-scan-item"
                  key={`${item.name}-${index}`}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <small>{item.grams} g</small>
                  </div>

                  <span>
                    {item.calories} kcal
                  </span>
                </div>
              ))}
            </div>

            <div className="meal-scan-total">
              <span>Total calories</span>

              <strong>
                {totalCalories} kcal
              </strong>
            </div>
          </div>
        )}

        <div className="meal-scan-actions">
          <button
            type="button"
            className="meal-scan-secondary"
            onClick={() =>
              inputRef.current?.click()
            }
            disabled={loading || saving}
          >
            {imagePreview
              ? 'Choose another photo'
              : 'Choose photo'}
          </button>

          <button
            type="button"
            className="meal-scan-primary"
            onClick={handleScan}
            disabled={
              !selectedFile || loading || saving
            }
          >
            {loading ? 'Analyzing…' : 'Scan meal'}
          </button>

          {meal && (
            <button
              type="button"
              className="meal-scan-add"
              onClick={handleAddToDiary}
              disabled={saving}
            >
              {saving
                ? 'Adding…'
                : 'Add to diary'}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}