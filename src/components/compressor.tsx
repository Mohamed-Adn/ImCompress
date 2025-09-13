"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { suggestOptimalSettings } from '@/ai/flows/ai-optimal-settings';
import { useToast } from "@/hooks/use-toast"
import { cn, formatBytes } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Sparkles, Download, Loader2, Image as ImageIcon } from 'lucide-react';

type Settings = {
  width: number;
  height: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
};

export function Compressor() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);

  const [processedDataUrl, setProcessedDataUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState<number | null>(null);

  const [settings, setSettings] = useState<Settings>({ width: 0, height: 0, quality: 80, format: 'jpeg' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setOriginalFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setOriginalDataUrl(url);
        const img = new window.Image();
        img.src = url;
        img.onload = () => {
          setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
          setSettings(s => ({ ...s, width: img.naturalWidth, height: img.naturalHeight }));
        };
      };
      reader.readAsDataURL(file);
    } else if (file) {
      toast({
        variant: "destructive",
        title: "Invalid File",
        description: "Please upload a valid image file.",
      });
    }
  };

  const processImage = useCallback(async () => {
    if (!originalDataUrl || settings.width === 0 || settings.height === 0) return;

    setIsProcessing(true);
    try {
      const img = new window.Image();
      img.src = originalDataUrl;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement('canvas');
      canvas.width = settings.width;
      canvas.height = settings.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, settings.width, settings.height);

      const mimeType = `image/${settings.format}`;
      const quality = settings.format === 'png' ? undefined : settings.quality / 100;
      const resultDataUrl = canvas.toDataURL(mimeType, quality);

      setProcessedDataUrl(resultDataUrl);
      const sizeInBytes = atob(resultDataUrl.split(',')[1]).length;
      setProcessedSize(sizeInBytes);
    } catch (error) {
      console.error("Image processing failed:", error);
      toast({
        variant: "destructive",
        title: "Processing Error",
        description: "Could not process the image. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [originalDataUrl, settings, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      processImage();
    }, 500);
    return () => clearTimeout(timer);
  }, [processImage]);
  
  const handleAiSuggest = async () => {
    if (!originalDataUrl) return;
    setIsAiLoading(true);
    try {
      toast({ title: "AI is thinking...", description: "Generating optimal settings for your image." });
      const suggestions = await suggestOptimalSettings({ photoDataUri: originalDataUrl });
      setSettings({
        width: suggestions.width,
        height: suggestions.height,
        quality: suggestions.quality,
        format: suggestions.format.toLowerCase() as 'jpeg' | 'png' | 'webp',
      });
      toast({ title: "AI Suggestions Applied!", description: "The optimal settings have been loaded." });
    } catch (error) {
      console.error("AI suggestion failed:", error);
      toast({ variant: "destructive", title: "AI Error", description: "Failed to get suggestions. Please try again." });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleDownload = () => {
    if (!processedDataUrl || !originalFile) return;
    const link = document.createElement('a');
    link.href = processedDataUrl;
    const name = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
    link.download = `${name}_compressed.${settings.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        handleFileChange(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    },
  };

  const renderDropzone = () => (
    <div className="flex items-center justify-center w-full h-[calc(100vh-200px)]" {...commonDragEvents}>
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
          <CardTitle className="mt-4 text-2xl">Drop your image here</CardTitle>
          <CardDescription>or click to browse</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Supports PNG, JPG, WEBP</p>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/webp"
            onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
          />
        </CardContent>
      </Card>
    </div>
  );
  
  const renderImagePreview = (title: string, description: string, dataUrl: string | null, dimensions: { width: number; height: number } | null, size: number | null) => (
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-muted rounded-md flex items-center justify-center relative">
          {dataUrl ? (
            <Image src={dataUrl} alt={title} layout="fill" objectFit="contain" />
          ) : (
             isProcessing ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> : <ImageIcon className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
      </CardContent>
      <CardFooter className="bg-muted/50 text-sm p-3 justify-between">
          {dimensions ? <span>{dimensions.width} x {dimensions.height}</span> : <span>...</span>}
          {size !== null ? <span className="font-medium">{formatBytes(size)}</span> : <span>...</span>}
      </CardFooter>
    </Card>
  );

  const renderSettings = () => (
    <Card className="sticky top-24">
      <CardHeader>
        <CardTitle>Image Settings</CardTitle>
        <CardDescription>Adjust the settings to compress your image.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Button variant="outline" className="w-full" onClick={handleAiSuggest} disabled={isAiLoading}>
          {isAiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          AI Suggest Optimal Settings
        </Button>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="width">Width</Label>
            <Input id="width" type="number" value={settings.width} onChange={e => setSettings(s => ({ ...s, width: parseInt(e.target.value, 10) || 0 }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="height">Height</Label>
            <Input id="height" type="number" value={settings.height} onChange={e => setSettings(s => ({ ...s, height: parseInt(e.target.value, 10) || 0 }))} />
          </div>
        </div>
        <div className="space-y-2">
            <Label>Format</Label>
            <Select value={settings.format} onValueChange={(v: 'jpeg' | 'png' | 'webp') => setSettings(s => ({ ...s, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="quality">Quality</Label>
            <span className="text-sm text-muted-foreground font-medium">{settings.quality}</span>
          </div>
          <Slider
            id="quality"
            min={1}
            max={100}
            step={1}
            value={[settings.quality]}
            onValueChange={([v]) => setSettings(s => ({ ...s, quality: v }))}
            disabled={settings.format === 'png'}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-green-500 hover:bg-green-600 text-black" onClick={handleDownload} disabled={!processedDataUrl}>
          <Download className="mr-2 h-4 w-4" />
          Download Image
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="container mx-auto p-4 lg:p-8">
      {!originalFile ? (
        renderDropzone()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" {...commonDragEvents}>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {renderImagePreview("Original", "This is your uploaded image.", originalDataUrl, originalDimensions, originalFile.size)}
            {renderImagePreview("Compressed", "The result of your settings.", processedDataUrl, settings, processedSize)}
          </div>
          <div className="lg:col-span-1">
            {renderSettings()}
          </div>
        </div>
      )}
    </div>
  );
}
