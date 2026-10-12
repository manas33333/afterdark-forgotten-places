'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Check, X, MessageSquareText, ShieldAlert, RefreshCw } from 'lucide-react';

type Submission = {
  id: string;
  title: string;
  category: string;
  description: string;
  area: string;
  status: string;
  created_at: string;
  latitude: number;
  longitude: number;
  confidence: string;
  submitted_by: string;
};

export default function Admin() {
  const [rows, setRows] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setRows(data || []);
    } catch (e: any) {
      setError(e.message || 'Sign in error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {loading && <p>Loading records...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {notice && <p className="text-green-500">{notice}</p>}
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.id} className="border p-4 rounded shadow-sm">
            <h3 className="font-semibold text-lg">{row.title}</h3>
            <p className="text-sm text-gray-400">{row.category} - {row.area}</p>
            <p className="mt-2 text-sm">{row.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
