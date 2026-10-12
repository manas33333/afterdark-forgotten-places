'use client';
import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export function AtlasMap({ places, onSelect, center, onMapClick }: any) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Using an open-source style sheet that requires zero API keys and works instantly
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://demotiles.maplibre.org/style.json',
      center: center || [80.9462, 26.8467],
      zoom: 3, // Zoomed out slightly to ensure the layout loads broad boundaries immediately
      attributionControl: false
    });

    map.current.on('click', (e) => {
      if (onMapClick) {
        onMapClick({ coords: [e.lngLat.lng, e.lngLat.lat] });
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    places.forEach((p: any) => {
      const el = document.createElement('button');
      el.className = 'w-4 h-4 bg-[#c4d36b] rounded-full border border-[#10120d] transition-all hover:scale-125';
      el.addEventListener('click', () => onSelect && onSelect(p));

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [places, onSelect]);

  useEffect(() => {
    if (!map.current || !center) return;
    map.current.flyTo({ center, zoom: 11, duration: 900 });
  }, [center]);

  return (
    <div ref={mapContainer} className="h-full w-full bg-[#10120d]" aria-label="Atlas Interactive Map Workspace" />
  );
}
