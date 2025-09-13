import { Compressor } from '@/components/compressor';
import { Image as ImageIcon } from 'lucide-react';

function Header() {
  return (
    <header className="border-b sticky top-0 bg-background/80 backdrop-blur-sm z-10">
      <div className="container mx-auto px-4 py-4 flex items-center gap-3">
        <ImageIcon className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">ImCompress</h1>
      </div>
    </header>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Compressor />
      </main>
    </div>
  );
}
