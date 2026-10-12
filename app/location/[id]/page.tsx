import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowUpRight, MapPin, ShieldCheck, CalendarDays, Bookmark, Flag } from 'lucide-react';
import { demoPlaces } from '@/lib/data';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationPage({ params }: PageProps) {
  const { id } = await params;
  const place = demoPlaces.find((p) => p.id === id);

  if (!place) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#10120d] text-[#eee] p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-xs text-[#858a7d]">
          <Link href="/explore" className="hover:underline">INDEX</Link>
          <span>/</span>
          <span className="muted">{place.id}</span>
        </div>

        <div className="relative h-[300px] md:h-[450px] w-full border border-[#373b33] overflow-hidden">
          <img 
            src={place.cover_image || '/placeholder.jpg'} 
            alt={place.name} 
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute top-4 left-4 pill bg-[#10120d]/80 text-xs px-2.5 py-1 border border-[#373b33] text-[#c4d36b]">
            {place.category}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-8 pt-4">
          <div className="space-y-4">
            <h1 className="serif text-3xl md:text-5xl font-normal leading-tight text-[#f0f4eb]">
              {place.name}
            </h1>
            <div className="flex items-center gap-2 text-sm text-[#c4d36b]">
              <MapPin size={16} />
              <span>{place.city}</span>
            </div>
            <hr className="border-[#22261f]" />
            <p className="text-sm leading-relaxed text-[#c6cbbf] whitespace-pre-wrap">
              {place.description || 'No detailed field record logs provided for this archive entry yet.'}
            </p>
          </div>

          <div className="border border-[#373b33] p-4 rounded bg-[#131610] h-fit space-y-4 text-xs">
            <div className="flex items-center justify-between py-1 border-b border-[#22261f]">
              <span className="muted text-[#858a7d]">Status</span>
              <span className="text-[#c4d36b] flex items-center gap-1 font-mono">
                <ShieldCheck size={13} /> {place.status || 'Verified'}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#22261f]">
              <span className="muted text-[#858a7d]">Confidence</span>
              <span className="text-[#eee] font-mono">{place.confidence || 'Historical'}</span>
            </div>
            <div className="flex items-center justify-between py-1 border-b border-[#22261f]">
              <span className="muted text-[#858a7d]">Coordinates</span>
              <span className="text-[#eee] font-mono text-[10px]">{place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
