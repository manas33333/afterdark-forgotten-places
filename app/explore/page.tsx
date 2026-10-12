'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, Map as MapIcon, List, LocateFixed, ArrowUpRight, LoaderCircle } from 'lucide-react';
import { AtlasMap } from '@/components/map';
import { demoPlaces, TypePlace } from '@/lib/data';

const cats = ['All categories', 'Industrial heritage', 'Ruins', 'Old estates', 'Deserted villages', 'Railway structures', 'Historical sites', 'Abandoned-looking architecture'];

export default function Explore() {
  const [places, setPlaces] = useState<TypePlace[]>(demoPlaces);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All categories');
  const [mode, setMode] = useState<'split' | 'list'>('split');
  const [radius, setRadius] = useState('25');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<TypePlace | null>(null);
  const [center, setCenter] = useState<[number, number]>([80.9462, 26.8467]);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetch('/api/locations')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d?.locations?.length) {
          setPlaces([...demoPlaces, ...d.locations]);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return places.filter((p) => {
      const matchCat = category === 'All categories' || p.category === category;
      const matchVer = !verified || p.confidence === 'Historical reference' || p.status === 'approved';
      const text = `${p.name} ${p.city} ${p.category} ${p.description || ''}`.toLowerCase();
      const matchQuery = text.includes(query.toLowerCase());
      return matchCat && matchVer && matchQuery;
    });
  }, [places, category, verified, query]);

  const selectPlace = useCallback((p: TypePlace) => {
    setSelected(p);
  }, []);

  function locate() {
    if (!navigator.geolocation) {
      setNotice('Location services are not available in this browser.');
      return;
    }
    setNotice('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCenter([pos.coords.longitude, pos.coords.latitude]);
        setNotice('Map centered on your location. Your coordinates are not saved.');
      },
      () => {
        setNotice('Location permission was declined or unavailable.');
      },
      { enableHighAccuracy: false, timeout: 8000 }
    );
  }

  return (
    <div className="h-[calc(100vh-70px)] min-h-[650px] flex flex-col">
      <div className="px-5 md:px-8 py-4 border-b line flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">FIELD INDEX / 01</p>
          <h1 className="serif text-3xl mt-1">Explore the atlas</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setMode(mode === 'split' ? 'list' : 'split')} className="btn btn-ghost py-2 px-3">
            {mode === 'split' ? 'List view' : 'Map view'}
          </button>
          <button onClick={locate} className="btn py-2 px-3">
            <LocateFixed size={15} /> My location
          </button>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className={`${mode === 'list' ? 'w-full' : 'w-full md:w-[410px]'} shrink-0 border-r line flex flex-col ${mode === 'list' ? '' : 'max-md:hidden'}`}>
          <div className="p-4 border-b line space-y-3">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-[#858a7d]" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search places, regions, records..." className="field pl-10" />
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="field">
                {cats.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button onClick={() => setVerified(!verified)} className={`btn border px-3 ${verified ? 'border-[#c4d36b] text-[#c4d36b]' : 'border-[#373b33] text-[#999e93]'}`}>
                <SlidersHorizontal size={17} />
              </button>
            </div>
            <div className="flex items-center gap-3 text-xs muted">
              <span>Radius</span>
              <select value={radius} onChange={(e) => setRadius(e.target.value)} className="bg-transparent border border-[#373b33] p-1.5 text-[#eee]">
                {['5', '10', '25', '50', '100'].map((r) => (
                  <option key={r} value={r}>{r} km</option>
                ))}
              </select>
              <span className="ml-auto">{filtered.length} records</span>
            </div>
          </div>

          <div className="overflow-y-auto p-4 space-y-3">
            {loading && (
              <div className="flex items-center gap-2 text-xs muted">
                <LoaderCircle size={14} className="animate-spin" />
                <span>Loading published records...</span>
              </div>
            )}
            {!filtered.length && !loading && (
              <div className="py-12 text-center">
                <p className="serif text-2xl">Nothing surfaced.</p>
                <p className="text-xs muted mt-2">Try a broader term or another category.</p>
              </div>
            )}
            {filtered.map((p) => (
              <button key={p.id} onClick={() => { setSelected(p); setCenter([p.longitude, p.latitude]); }} className={`w-full text-left card p-3 flex gap-3 hover:border-[#69734b] ${selected?.id === p.id ? 'border-[#c4d36b]' : ''}`}>
                <img src={p.cover_image || '/placeholder.jpg'} alt="" className="w-24 h-24 object-cover opacity-80 bg-[#222]" />
                <div className="min-w-0">
                  <span className="eyebrow text-[9px]">{p.category}</span>
                  <span className="block serif text-xl mt-1 truncate">{p.name}</span>
                  <span className="block text-xs muted mt-1">{p.city}</span>
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className={`${mode === 'list' ? 'hidden' : 'flex'} flex-1 relative min-w-0`}>
          <AtlasMap places={filtered} onSelect={selectPlace} center={center} />
          {selected && (
            <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[340px] card p-4 shadow-2xl bg-[#10120d] border border-[#373b33]">
              <button onClick={() => setSelected(null)} className="absolute top-3 right-3 text-xs muted">close</button>
              <p className="eyebrow">{selected.category}</p>
              <h3 className="serif text-2xl mt-2 mr-12">{selected.name}</h3>
              <p className="text-xs muted mt-1">{selected.city}</p>
              <Link href={`/location/${selected.id}`} className="btn mt-4 py-2 inline-flex items-center gap-2 border border-[#373b33] px-3 rounded">
                Open field record <ArrowUpRight size={14} />
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
