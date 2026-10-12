import type { Metadata } from 'next';
import './globals.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Header } from '@/components/header';
export const metadata: Metadata = { title: 'AFTERDARK — The Forgotten Places Atlas', description: 'Every forgotten place has a story. Discover, document, and research forgotten places responsibly.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body><Header/><main>{children}</main><footer className="border-t line px-6 md:px-12 py-8 flex flex-col md:flex-row gap-3 justify-between text-xs muted"><span>AFTERDARK © 2026 · THE FORGOTTEN PLACES ATLAS</span><span>Explore responsibly. A map record is not permission to enter.</span><span>Data contributors retain attribution.</span></footer></body></html> }
