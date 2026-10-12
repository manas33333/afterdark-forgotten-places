'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface Place {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  category?: string;
}

interface AtlasMapProps {
  places: Place[];
  onSelect?: (place: Place) => void;
  center?: [number, number];
  onMapClick?: (data: { coords: [number, number] }) => void;
}

export function AtlasMap({ places, onSelect, center, onMapClick }: AtlasMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 1. Initialize Map instance
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Premium open-source dark vector theme matching the "Afterdark" aesthetic
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://cartocdn.com',
      center: center || [80.9462, 26.8467],
      zoom: 11,
      minZoom: 2,
      maxZoom: 18,
      attributionControl: false
    });

    // Wait for vector assets to completely paint before dismissing overlays
    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Handle surface selections
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

  // 2. Manage and render location point nodes dynamically
  useEffect(() => {
    if (!map.current) return;

    // Clear old visual instances safely
    markers.current.forEach((m) => m.remove());
    markers.current = [];

    if (!places || places.length === 0) return;

    places.forEach((p: Place) => {
      if (!p.longitude || !p.latitude) return;

      // Custom marker construction matching original architecture styles
      const el = document.createElement('button');
      el.className = 'w-4 h-4 bg-[#c4d36b] rounded-full border border-[#10120d] transition-all duration-200 hover:scale-150 cursor-pointer shadow-lg shadow-[#c4d36b]/20';
      el.setAttribute('aria-label', p.title || 'Location marker');
      
      el.addEventListener('click', (e) => {
        e.stopPropagation(); // Avoid triggering surface click handlers
        if (onSelect) onSelect(p);
      });

      // Pin new element node onto coordinate space
      const marker = new maplibregl.Marker({ 
        element: el,
        anchor: 'center'
      })
        .setLngLat([p.longitude, p.latitude])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [places, onSelect, mapLoaded]);

  // 3. Coordinate navigation changes smoothly
  useEffect(() => {
    if (!map.current || !center) return;
    
    map.current.flyTo({ 
      center, 
      zoom: 13, 
      duration: 1200,
      essential: true 
    });
  }, [center]);

  return (
    <div className="relative w-full h-full min-w-0 min-h-0 flex flex-1">
      {/* Dynamic inline loader layout overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#10120d] flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-[#c4d36b] rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-[#c4d36b] rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-[#c4d36b] rounded-full animate-bounce"></div>
          </div>
        </div>
      )}

      {/* Target surface canvas rendering space */}
      <div 
        ref={mapContainer} 
        className="h-full w-full bg-[#10120d]" 
        aria-label="Atlas Interactive Map Workspace" 
      />
    </div>
  );
}
