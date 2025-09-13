import { SingleCompressor } from '@/components/single-compressor';
import { BulkCompressor } from '@/components/bulk-compressor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Image as ImageIcon, Layers } from 'lucide-react';

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
         <Tabs defaultValue="single" className="w-full">
            <div className="container mx-auto px-4 pt-4">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="single">
                  <ImageIcon className="mr-2" />
                  Single Image
                </TabsTrigger>
                <TabsTrigger value="bulk">
                  <Layers className="mr-2" />
                  Bulk Images
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="single">
              <SingleCompressor />
            </TabsContent>
            <TabsContent value="bulk">
              <BulkCompressor />
            </TabsContent>
          </Tabs>
      </main>
    </div>
  );
}
