import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server Error' }, { status: 500 });
  }
}
