"use client";

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast"
import { cn, formatBytes } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Download, Loader2, X, Trash2, Copy, ArrowRight } from 'lucide-react';
import JSZip from 'jszip';

type ImageFile = {
  id: string;
  file: File;
  dataUrl: string;
  originalWidth: number;
  originalHeight: number;
  settings: {
    width: number;
    height: number;
    quality: number;
    format: 'jpeg' | 'png' | 'webp' | 'jpg';
  };
  processedDataUrl: string | null;
  processedSize: number | null;
  isProcessing: boolean;
};

export function BulkCompressor() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [globalSettings, setGlobalSettings] = useState({ quality: 80, format: 'jpeg' as 'jpeg' | 'png' | 'webp' | 'jpg' });

  const handleFilesChange = (files: FileList | null) => {
    if (!files) return;

    const newImages: ImageFile[] = [];
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast({
          variant: "destructive",
          title: "Invalid File Type",
          description: `Skipping '${file.name}'. Only JPG, PNG, and WEBP are supported.`,
        });
        continue;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          newImages.push({
            id: `${file.name}-${Date.now()}`,
            file,
            dataUrl: url,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            settings: {
              width: img.naturalWidth,
              height: img.naturalHeight,
              quality: globalSettings.quality,
              format: globalSettings.format,
            },
            processedDataUrl: null,
            processedSize: null,
            isProcessing: false,
          });
          if (newImages.length === files.length) {
            setImages(prev => [...prev, ...newImages]);
            processAllImages([...images, ...newImages]);
          }
        };
      };
      reader.readAsDataURL(file);
    }
  };
  
  const processImage = useCallback(async (image: ImageFile): Promise<Partial<ImageFile>> => {
    const { dataUrl, settings } = image;
    try {
      const img = new window.Image();
      img.src = dataUrl;
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });

      const canvas = document.createElement('canvas');
      canvas.width = settings.width;
      canvas.height = settings.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, settings.width, settings.height);

      const formatToUse = settings.format === 'jpg' ? 'jpeg' : settings.format;
      const mimeType = `image/${formatToUse}`;
      const quality = settings.format === 'png' ? undefined : settings.quality / 100;
      const resultDataUrl = canvas.toDataURL(mimeType, quality);
      const sizeInBytes = atob(resultDataUrl.split(',')[1]).length;
      
      return { processedDataUrl: resultDataUrl, processedSize: sizeInBytes };
    } catch (error) {
      console.error("Image processing failed for", image.file.name, error);
      return {};
    }
  }, []);

  const processAllImages = useCallback(async (currentImages: ImageFile[]) => {
      currentImages.forEach(async (image) => {
          if(!image.processedDataUrl) {
            handleImageUpdate(image.id, { isProcessing: true });
            const result = await processImage(image);
            handleImageUpdate(image.id, { ...result, isProcessing: false });
          }
      });
  }, [processImage]);


  const handleImageUpdate = (id: string, newProps: Partial<ImageFile> | { settings: Partial<ImageFile['settings']> }) => {
    setImages(prevImages => {
      const updatedImages = prevImages.map(img => {
        if (img.id === id) {
          if ('settings' in newProps) {
            return { ...img, settings: { ...img.settings, ...newProps.settings } };
          }
          return { ...img, ...newProps };
        }
        return img;
      });

      // After state update, re-process the specific image if settings changed
      const imageToProcess = updatedImages.find(img => img.id === id);
      if (imageToProcess && 'settings' in newProps) {
         (async () => {
            handleImageUpdate(id, { isProcessing: true });
            const result = await processImage(imageToProcess);
            handleImageUpdate(id, { ...result, isProcessing: false });
         })();
      }

      return updatedImages;
    });
  };

  const removeImage = (id: string) => {
    setImages(images.filter(image => image.id !== id));
  };
  
  const applyGlobalSettings = () => {
     setImages(prev => {
         const newImages = prev.map(img => ({
             ...img,
             settings: {
                 ...img.settings,
                 quality: globalSettings.quality,
                 format: globalSettings.format,
             }
         }));
         processAllImages(newImages);
         return newImages;
     });
     toast({ title: "Global Settings Applied", description: "All images have been updated." });
  };
  
  const handleDownloadAll = async () => {
    if (images.length === 0) return;
    setIsDownloading(true);

    const zip = new JSZip();
    images.forEach(image => {
      if (image.processedDataUrl) {
        const name = image.file.name.substring(0, image.file.name.lastIndexOf('.'));
        const formatToUse = image.settings.format === 'jpeg' ? 'jpg' : image.settings.format;
        const filename = `${name}_compressed.${formatToUse}`;
        const imgData = image.processedDataUrl.split(',')[1];
        zip.file(filename, imgData, { base64: true });
      }
    });

    try {
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = "ImCompress_bulk.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
        console.error("Failed to generate zip", error);
        toast({ variant: "destructive", title: "Download Error", description: "Could not create zip file." });
    } finally {
        setIsDownloading(false);
    }
  };

  const commonDragEvents = {
    onDragEnter: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); },
    onDragLeave: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); },
    onDragOver: (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); },
    onDrop: (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesChange(e.dataTransfer.files);
        e.dataTransfer.clearData();
      }
    },
  };

  const renderDropzone = () => (
    <div className="flex items-center justify-center w-full h-[calc(100vh-280px)]" {...commonDragEvents}>
      <Card
        className={cn(
          "w-full max-w-2xl text-center p-10 lg:p-16 border-2 border-dashed hover:border-primary transition-colors duration-300 cursor-pointer",
          isDragging && "border-primary bg-primary/10"
        )}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardHeader>
          <div className="mx-auto bg-secondary p-4 rounded-full w-fit">
            <UploadCloud className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="mt-4 text-2xl">Drop your images here</CardTitle>
          <CardDescription>or click to browse</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Supports PNG, JPG, WEBP</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            onChange={(e) => handleFilesChange(e.target.files)}
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderGlobalSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Global Settings</CardTitle>
        <CardDescription>Apply these settings to all images.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label>Format</Label>
            <Select value={globalSettings.format} onValueChange={(v: 'jpeg' | 'png' | 'webp' | 'jpg') => setGlobalSettings(s => ({ ...s, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Quality</Label>
                <span className="text-sm text-muted-foreground font-medium">{globalSettings.quality}</span>
            </div>
            <Slider
                min={1} max={100} step={1}
                value={[globalSettings.quality]}
                onValueChange={([v]) => setGlobalSettings(s => ({ ...s, quality: v }))}
                disabled={globalSettings.format === 'png'}
            />
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <Button className="w-full" onClick={applyGlobalSettings}>Apply to All</Button>
        <Button className="w-full bg-green-500 hover:bg-green-600 text-black" onClick={handleDownloadAll} disabled={isDownloading || images.length === 0}>
          {isDownloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Download All as ZIP
        </Button>
      </CardFooter>
    </Card>
  )

  const renderImageCard = (image: ImageFile) => (
    <Card key={image.id} className="overflow-hidden">
        <CardHeader className="flex-row items-start justify-between">
            <div>
                <CardTitle className="text-lg truncate w-48">{image.file.name}</CardTitle>
                <CardDescription>{image.originalWidth}x{image.originalHeight} &rarr; {image.settings.width}x{image.settings.height}</CardDescription>
            </div>
             <Button variant="ghost" size="icon" className="h-8 w-8 -mt-2 -mr-2 shrink-0" onClick={() => removeImage(image.id)}><X className="h-4 w-4" /></Button>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-4 items-center">
                <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center relative shrink-0">
                    <Image src={image.dataUrl} alt="Original" layout="fill" objectFit="contain" className="rounded-md" />
                </div>
                <div className="flex items-center justify-center text-muted-foreground"><ArrowRight /></div>
                <div className="w-24 h-24 bg-muted rounded-md flex items-center justify-center relative shrink-0">
                   {image.isProcessing ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : (
                       image.processedDataUrl ? <Image src={image.processedDataUrl} alt="Compressed" layout="fill" objectFit="contain" className="rounded-md" /> : null
                   )}
                </div>
            </div>
             <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Width" value={image.settings.width} onChange={e => handleImageUpdate(image.id, { settings: { width: parseInt(e.target.value) || 0 } })} />
                <Input type="number" placeholder="Height" value={image.settings.height} onChange={e => handleImageUpdate(image.id, { settings: { height: parseInt(e.target.value) || 0 } })}/>
            </div>
             <div className="space-y-2">
                <Select value={image.settings.format} onValueChange={(v: 'jpeg' | 'png' | 'webp' | 'jpg') => handleImageUpdate(image.id, { settings: { format: v }})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="jpeg">JPEG</SelectItem>
                        <SelectItem value="jpg">JPG</SelectItem>
                        <SelectItem value="png">PNG</SelectItem>
                        <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <Label>Quality</Label>
                    <span className="text-sm text-muted-foreground font-medium">{image.settings.quality}</span>
                </div>
                <Slider
                    min={1} max={100} step={1}
                    value={[image.settings.quality]}
                    onValueChange={([v]) => handleImageUpdate(image.id, { settings: { quality: v }})}
                    disabled={image.settings.format === 'png'}
                />
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 text-sm p-3 justify-between">
           <span>{formatBytes(image.file.size)}</span>
           <span className="font-medium">{image.processedSize ? formatBytes(image.processedSize) : '...'}</span>
        </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 lg:p-8" {...commonDragEvents}>
      {images.length === 0 ? (
        renderDropzone()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {images.map(renderImageCard)}
             <Card
                className={cn(
                  "w-full text-center p-10 border-2 border-dashed hover:border-primary transition-colors duration-300 cursor-pointer flex flex-col justify-center items-center min-h-[480px]",
                  isDragging && "border-primary bg-primary/10"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                 <div className="mx-auto bg-secondary p-3 rounded-full w-fit mb-4">
                    <UploadCloud className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Add more images</CardTitle>
             </Card>
          </div>
          <div className="lg:col-span-1 sticky top-24">
            {renderGlobalSettings()}
          </div>
        </div>
      )}
    </div>
  );
}
