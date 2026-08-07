import { useRef, useState } from 'react';
import '../css/meal-scan.css';
import { supabase } from '../supabase';
import { ScanLine } from 'lucide-react';

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

function handleItemChange(index, field, value) {
    setMeal((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      ),
    }));
  }

  function handleRemoveItem(index) {
    setMeal((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

export default function MealScan({
  defaultMeal = '',
  onConfirm,
  onClose,
}) {
  const inputRef = useRef(null);

  const [imagePreview, setImagePreview] =
    useState('');
  const [selectedFile, setSelectedFile] =
    useState(null);
  const [meal, setMeal] = useState(null);
  const [mealType, setMealType] = useState(defaultMeal);
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
     if (!meal || !Array.isArray(meal.items) || meal.items.length === 0) {
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
      await onConfirm?.(meal, mealType);
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
              <ScanLine size={32} />

              <strong>Scan your meal</strong>

              <small>
                Take a photo or choose one from your
                library.
              </small>

              <small>Meal scan only provides a quick estimation and may not be 100% accurate.</small>
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
                  className="meal-scan-item meal-scan-item--editable"
                  key={`${item.name}-${index}`}
                >
                  <div className="meal-scan-item-header">
                    <strong>{item.name}</strong>

                    <button
                      type="button"
                      className="meal-scan-item-remove"
                      onClick={() => handleRemoveItem(index)}
                      disabled={saving}
                      aria-label={`Remove ${item.name}`}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="meal-scan-item-macros">
                    <label>
                      g
                      <input
                        type="number"
                        min="0"
                        value={item.grams}
                        onChange={(event) =>
                          handleItemChange(index, 'grams', Number(event.target.value))
                        }
                        disabled={saving}
                      />
                    </label>

                    <label>
                      kcal
                      <input
                        type="number"
                        min="0"
                        value={item.calories}
                        onChange={(event) =>
                          handleItemChange(index, 'calories', Number(event.target.value))
                        }
                        disabled={saving}
                      />
                    </label>

                    <label>
                      P
                      <input
                        type="number"
                        min="0"
                        value={item.protein ?? 0}
                        onChange={(event) =>
                          handleItemChange(index, 'protein', Number(event.target.value))
                        }
                        disabled={saving}
                      />
                    </label>

                    <label>
                      C
                      <input
                        type="number"
                        min="0"
                        value={item.carbs ?? 0}
                        onChange={(event) =>
                          handleItemChange(index, 'carbs', Number(event.target.value))
                        }
                        disabled={saving}
                      />
                    </label>

                    <label>
                      F
                      <input
                        type="number"
                        min="0"
                        value={item.fat ?? 0}
                        onChange={(event) =>
                          handleItemChange(index, 'fat', Number(event.target.value))
                        }
                        disabled={saving}
                      />
                    </label>
                  </div>
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