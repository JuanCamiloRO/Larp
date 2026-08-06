import { useEffect, useMemo, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';
import { ArrowLeft, Camera, Plus, Scale, X } from 'lucide-react';
import { supabase } from '../supabase';
import '../css/weight-progress.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

const RANGES = [7, 30, 90];

function formatDate(dateString) {
  return new Date(`${dateString}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function WeightChart({ entries, unit }) {
  const chartData = useMemo(() => ({
    labels: entries.map((entry) => formatDate(entry.recorded_on)),
    datasets: [{
      data: entries.map((entry) => Number(entry.weight)),
      borderColor: '#ff3b30',
      backgroundColor: (context) => {
        const { chart } = context;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(255, 59, 48, 0.18)';
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, 'rgba(255, 59, 48, 0.34)');
        gradient.addColorStop(1, 'rgba(255, 59, 48, 0)');
        return gradient;
      },
      fill: true,
      tension: 0.38,
      borderWidth: 2.5,
      pointRadius: entries.length === 1 ? 4 : 3,
      pointHoverRadius: 5,
      pointBackgroundColor: '#ff3b30',
      pointBorderColor: '#1c1c1e',
      pointBorderWidth: 2,
    }],
  }), [entries]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 380 },
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        backgroundColor: '#2c2c2e',
        titleColor: '#aeb2bb',
        bodyColor: '#fff',
        padding: 10,
        titleFont: { size: 11, weight: '700' },
        bodyFont: { size: 13, weight: '800' },
        callbacks: { label: (context) => `${context.parsed.y.toFixed(1)} ${unit}` },
      },
    },
    scales: {
      x: { grid: { display: false }, border: { display: false }, ticks: { color: '#8e8e93', font: { size: 10, weight: '600' }, maxTicksLimit: 4 } },
      y: { grid: { color: 'rgba(255, 255, 255, 0.07)', drawTicks: false }, border: { display: false }, ticks: { color: '#8e8e93', font: { size: 10, weight: '600' }, maxTicksLimit: 4, callback: (value) => `${value} ${unit}` }, grace: '4%' },
    },
  }), [unit]);

  if (!entries.length) return <div className="weight-progress-chart__empty">Log your first weight to see your trend.</div>;
  return <div className="weight-progress-chart"><Line data={chartData} options={options} /></div>;
}

function WeightHistory({ entries, unit, onClose, onViewImage }) {
  return <div className="weight-history-overlay" role="presentation">
    <header className="weight-history-header"><button className="weight-history-back" onClick={onClose}><ArrowLeft size={21} /></button><div><p>Weight history</p><h2>All entries</h2></div><span aria-hidden="true" /></header>
    <div className="weight-history-list">{!entries.length ? <p className="weight-history-empty">No weigh-ins yet.</p> : entries.slice().reverse().map((entry) => <div className="weight-history-entry" key={entry.id}><div><strong>{formatDate(entry.recorded_on)}</strong><div>{Number(entry.weight).toFixed(1)} {unit}</div></div>{entry.photo_url ? <img src={entry.photo_url} alt="Progress" onClick={() => onViewImage(entry.photo_url)} /> : <span />}</div>)}</div>
  </div>;
}

function WeightImageViewer({ src, onClose }) {
  return <div className="weight-image-overlay" role="dialog" aria-modal="true" aria-label="Progress photo" onClick={onClose}><img src={src} alt="Progress" onClick={(event) => event.stopPropagation()} /><button className="weight-image-overlay__close" onClick={onClose}><X size={22} /></button></div>;
}

function resizeAndCompressImage(file, maxWidth = 1200, quality = 0.75, format = 'image/webp') {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      try {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          if (!blob) {
            reject(new Error('Compression produced no blob'));
            return;
          }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: format });
          resolve(compressed);
        }, format, quality);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image load failed'));
    };
    img.src = url;
  });
}

async function uploadToR2(file, userId, pathPrefix) {
  const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
  const { data: { session } } = await supabase.auth.getSession();
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload-url`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, filename, contentType: file.type, pathPrefix }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to get upload URL');
  }

  const { uploadUrl, key } = await res.json();

  const putRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!putRes.ok) throw new Error('Upload to R2 failed');
  return { key };
}

async function getR2SignedUrl(key) {
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-signed-url`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to get signed URL');
  }

  const { signedUrl } = await res.json();
  return signedUrl;
}

export default function WeightProgress({ userId, unit = 'kg' }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [range, setRange] = useState(30);
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [weight, setWeight] = useState('');
  const [recordedOn, setRecordedOn] = useState(() => new Date().toISOString().slice(0, 10));
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState('');

  async function loadEntries() {
    if (!userId) return;
    setLoading(true);
    const { data, error: queryError } = await supabase.from('weight_entries').select('id, weight, recorded_on, photo_path').eq('user_id', userId).order('recorded_on');
    if (queryError) { console.error(queryError); setError('Could not load weight progress.'); setLoading(false); return; }

    const withUrls = await Promise.all((data || []).map(async (entry) => {
      if (!entry.photo_path) return { ...entry, photo_url: null };
      try {
        const signedUrl = await getR2SignedUrl(entry.photo_path);
        return { ...entry, photo_url: signedUrl };
      } catch (urlError) {
        console.error('Failed to get signed URL for photo:', urlError);
        return { ...entry, photo_url: null };
      }
    }));

    setEntries(withUrls);
    setLoading(false);
  }

  useEffect(() => { loadEntries(); }, [userId]);

  const visibleEntries = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (range - 1));
    return entries.filter((entry) => new Date(`${entry.recorded_on}T00:00:00`) >= start);
  }, [entries, range]);

  const latest = entries.at(-1);
  const first = visibleEntries[0];
  const change = latest && first ? Number(latest.weight) - Number(first.weight) : null;
  const latestPhoto = [...entries].reverse().find((entry) => entry.photo_url);

  async function saveEntry(event) {
    event.preventDefault();
    const numericWeight = Number(weight);
    if (!numericWeight || numericWeight <= 0) return setError('Enter a valid weight.');

    setSaving(true);
    setError('');
    const { data: entry, error: saveError } = await supabase.from('weight_entries').upsert({ user_id: userId, weight: numericWeight, recorded_on: recordedOn }, { onConflict: 'user_id,recorded_on' }).select().single();
    if (saveError) { console.error(saveError); setError('Could not save this weigh-in.'); setSaving(false); return; }

    if (photo) {
      let compressedPhoto = photo;
      try {
        compressedPhoto = await resizeAndCompressImage(photo, 1200, 0.75, 'image/webp');
      } catch (compressError) {
        console.error('Compression failed, using original photo:', compressError);
      }

      try {
        const { key } = await uploadToR2(compressedPhoto, userId, 'progress-photos');
        const { error: photoError } = await supabase.from('weight_entries').update({ photo_path: key }).eq('id', entry.id);
        if (photoError) throw photoError;
      } catch (uploadError) {
        console.error(uploadError);
        setError('Weight saved, but the photo could not upload.');
        setSaving(false);
        await loadEntries();
        return;
      }
    }

    setOpen(false);
    setWeight('');
    setPhoto(null);
    setSaving(false);
    await loadEntries();
  }

  return <section className="weight-progress" aria-label="Weight progress">
    <header className="weight-progress__header"><div><p>Body progress</p><h2>Weight trend</h2></div><button onClick={() => { setError(''); setOpen(true); }}><Plus size={18} /> Log weight</button></header>
    <div className="weight-progress__summary" onClick={() => setShowHistory(true)}><span className="weight-progress__icon"><Scale size={21} /></span><div><strong>{loading ? '—' : latest ? `${Number(latest.weight).toFixed(1)} ${unit}` : 'No weight yet'}</strong><small>{change === null ? 'Start tracking your progress' : `${change > 0 ? '+' : ''}${change.toFixed(1)} ${unit} in the selected range`}</small></div>{latestPhoto?.photo_url && <img src={latestPhoto.photo_url} alt="Latest progress" />}</div>
    <div className="weight-progress__ranges">{RANGES.map((days) => <button key={days} className={range === days ? 'weight-progress__range--active' : ''} onClick={() => setRange(days)}>{days}D</button>)}</div>
    <div className="weight-progress__chart-trigger" onClick={() => setShowHistory(true)}><WeightChart entries={visibleEntries} unit={unit} /></div>

    {open && <div className="weight-progress-overlay" role="presentation"><form className="weight-progress-form" onSubmit={saveEntry}><header><div><p>Check-in</p><h2>Log your weight</h2></div><button type="button" className="weight-progress-form__close" onClick={() => setOpen(false)}><X size={20} /></button></header><label>Weight ({unit})<input type="number" min="1" step="0.1" inputMode="decimal" value={weight} onChange={(event) => setWeight(event.target.value)} autoFocus /></label><label>Date<input type="date" value={recordedOn} onChange={(event) => setRecordedOn(event.target.value)} /></label><label className="weight-progress-form__photo"><Camera size={18} /><span>{photo ? photo.name : 'Add optional progress photo'}</span><input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></label>{error && <p className="weight-progress-form__error">{error}</p>}<button className="weight-progress-form__save" disabled={saving}>{saving ? 'Saving…' : 'Save check-in'}</button></form></div>}
    {showHistory && <WeightHistory entries={entries} unit={unit} onClose={() => setShowHistory(false)} onViewImage={setImageSrc} />}
    {imageSrc && <WeightImageViewer src={imageSrc} onClose={() => setImageSrc(null)} />}
  </section>;
}