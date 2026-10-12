'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, ArrowUpRight } from 'lucide-react';

const initial = [80.9462, 26.8467] as [number, number];

export default function Submit() {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Ruins');
  const [description, setDescription] = useState('');
  const [area, setArea] = useState('');
  const [lat, setLat] = useState('26.8467');
  const [lng, setLng] = useState('80.9462');
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!consent) {
      setError('Please confirm you have the right to share this information.');
      return;
    }
    setLoading(true);
    try {
      const { error: err } = await supabase.from('submissions').insert([{
        title,
        category,
        description,
        area,
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        status: 'pending',
        confidence: 'User submission'
      }]);
      if (err) throw err;
      setDone(true);
    } catch (err: any) {
      setError(err.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 min-h-[75vh] flex flex-col items-center justify-center text-center">
        <CheckCircle2 size={38} className="text-[#c4d36b]" />
        <p className="eyebrow mt-4">FIELD NOTE RECEIVED</p>
        <h1 className="serif text-3xl mt-2">Record queued for validation</h1>
        <p className="text-xs muted mt-2 max-w-sm">Thank you. The structural records and coordinates have been securely saved to the database index.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 md:px-10 py-12 md:py-20">
      <p className="eyebrow">COMMUNITY FIELDWORK / 02</p>
      <h1 className="serif text-5xl md:text-7xl mt-4 max-w-2xl font-normal tracking-tight text-[#f0f4eb]">Submit a record.</h1>
      
      <form onSubmit={submit} className="mt-12 max-w-2xl space-y-6">
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div>
          <label className="block text-xs muted mb-1">Location Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="field w-full" required />
        </div>
        <div>
          <label className="block text-xs muted mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="field w-full">
            {['Industrial heritage', 'Ruins', 'Old estates', 'Deserted villages', 'Railway structures', 'Historical sites'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs muted mb-1">Region / City</label>
          <input value={area} onChange={(e) => setArea(e.target.value)} className="field w-full" required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs muted mb-1">Latitude</label>
            <input value={lat} onChange={(e) => setLat(e.target.value)} className="field w-full" required />
          </div>
          <div>
            <label className="block text-xs muted mb-1">Longitude</label>
            <input value={lng} onChange={(e) => setLng(e.target.value)} className="field w-full" required />
          </div>
        </div>
        <div>
          <label className="block text-xs muted mb-1">Description / Condition Logs</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="field w-full min-h-[120px]" required />
        </div>
        <div className="flex items-start gap-3 pt-2">
          <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1" />
          <label htmlFor="consent" className="text-xs muted select-none cursor-pointer leading-relaxed">
            I verify these coordinates map out public access areas or documented historical sites. I hold the necessary rights to log this record.
          </label>
        </div>
        <button type="submit" disabled={loading} className="btn py-3 px-6 text-sm font-medium mt-4">
          {loading ? 'Submitting field entry...' : 'Transmit Record'} <ArrowUpRight size={14} />
        </button>
      </form>
    </div>
  );
}
