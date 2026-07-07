import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Flame, Moon, Compass, Sparkles } from 'lucide-react';
import { ImageState } from '../types';
import { generateDemoImage } from '../utils/imageEffects';

interface ImageUploaderProps {
  onImageLoaded: (image: ImageState) => void;
}

export default function ImageUploader({ onImageLoaded }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File loading handler
  const loadBlobFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload a valid image file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        onImageLoaded({
          src: dataUri,
          name: file.name,
          type: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
          sizeBytes: file.size,
        });
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  };

  // Drag handles
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      loadBlobFile(files[0]);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      loadBlobFile(files[0]);
    }
  };

  // Programmatic starter loader
  const handleLoadDemo = (type: 'sunset' | 'cosmic' | 'bauhaus') => {
    const demo = generateDemoImage(type);
    onImageLoaded({
      src: demo.src,
      name: demo.name,
      type: demo.type,
      width: 1200,
      height: 800,
      sizeBytes: demo.size,
    });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-10 px-4 md:py-16">
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-extrabold tracking-tight text-slate-100 md:text-4xl">
          High-Quality Image Studio & Compressor
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          An offline-first browser workspace to crop, resize, and apply custom filters to your images before exporting into lightweight, high-fidelity formats.
        </p>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        id="upload-dropzone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`w-full border-2 border-dashed rounded-2xl py-12 px-6 text-center cursor-pointer transition-all ${
          isDragging 
            ? 'border-blue-500 bg-blue-950/20 scale-[1.01] shadow-xl shadow-blue-950/10' 
            : 'border-slate-800/80 bg-slate-900/40 backdrop-blur-md hover:border-blue-500/80 hover:bg-slate-900/60 shadow-lg'
        }`}
      >
        <input
          id="file-input-raw"
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelectChange}
          accept="image/*"
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 rounded-xl bg-blue-950/40 border border-blue-900/55 flex items-center justify-center text-blue-400 transition-transform group-hover:scale-105">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">
              Drag and drop your image, or <span className="text-blue-400 hover:text-blue-300 underline underline-offset-4 font-bold">browse files</span>
            </p>
            <p className="text-xs text-slate-500">
              Supports PNG, JPEG, WebP, GIF, SVG, and RAW photo formats
            </p>
          </div>
        </div>
      </div>

      {/* Playable Programmatic Starters grid */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-1.5 font-mono">
            <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '4s' }} />
            Don't have an image? Try our stunning HD procedural designs:
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Preset Sunset */}
          <button
            id="demo-sunset-btn"
            onClick={() => handleLoadDemo('sunset')}
            className="flex items-center gap-3 p-3 bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl hover:border-orange-500/40 hover:bg-orange-950/10 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-950/50 border border-orange-900/40 flex items-center justify-center text-orange-400 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Warm Sunset</p>
              <p className="text-[10px] text-slate-400">Vibrant scenery gradients</p>
            </div>
          </button>

          {/* Preset Cosmic */}
          <button
            id="demo-cosmic-btn"
            onClick={() => handleLoadDemo('cosmic')}
            className="flex items-center gap-3 p-3 bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl hover:border-purple-500/40 hover:bg-purple-950/10 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-950/50 border border-purple-900/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Cosmic Space</p>
              <p className="text-[10px] text-slate-400">Deep glowing nebula dust</p>
            </div>
          </button>

          {/* Preset Bauhaus */}
          <button
            id="demo-bauhaus-btn"
            onClick={() => handleLoadDemo('bauhaus')}
            className="flex items-center gap-3 p-3 bg-slate-900/30 backdrop-blur-md border border-slate-800/80 rounded-xl hover:border-amber-500/40 hover:bg-amber-950/10 transition-all text-left group"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-950/50 border border-amber-900/40 flex items-center justify-center text-amber-500 group-hover:scale-105 transition-transform">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">Bauhaus Art</p>
              <p className="text-[10px] text-slate-400">Geometric clean retro poster</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
