import React from 'react';
import { ExportSettings } from '../types';
import { Download, FileDown, ShieldAlert, Award, FileCheck, HelpCircle } from 'lucide-react';

interface ExportPanelProps {
  settings: ExportSettings;
  setSettings: (settings: ExportSettings) => void;
  originalSizeBytes: number;
  estimatedSizeBytes: number | null;
  isExporting: boolean;
  onExport: () => void;
}

export default function ExportPanel({
  settings,
  setSettings,
  originalSizeBytes,
  estimatedSizeBytes,
  isExporting,
  onExport,
}: ExportPanelProps) {
  
  const handleQualityChange = (valStr: string) => {
    const q = parseFloat(valStr);
    setSettings({
      ...settings,
      quality: q,
    });
  };

  const handleFormatChange = (format: 'image/png' | 'image/jpeg' | 'image/webp') => {
    // autofix name extension
    let name = settings.customName;
    const parts = name.split('.');
    if (parts.length > 1) {
      parts.pop();
    }
    const baseName = parts.join('.');
    const ext = format === 'image/jpeg' ? 'jpg' : format === 'image/webp' ? 'webp' : 'png';
    
    setSettings({
      format,
      quality: settings.quality,
      customName: `${baseName}.${ext}`,
    });
  };

  const handleFileNameChange = (valStr: string) => {
    setSettings({
      ...settings,
      customName: valStr,
    });
  };

  // Human-readable bytes layout
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Savings computation
  const hasSavings = estimatedSizeBytes && estimatedSizeBytes < originalSizeBytes;
  const savingsPct = hasSavings 
    ? Math.round(((originalSizeBytes - (estimatedSizeBytes || 0)) / originalSizeBytes) * 100)
    : 0;

  return (
    <div className="space-y-5">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-sans">
          <Download className="w-4 h-4 text-blue-400" />
          Export Settings
        </h3>
        <span className="text-xs bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded-full font-semibold border border-emerald-900/40 font-mono">
          Ready to save
        </span>
      </div>

      {/* Target Name input */}
      <div className="space-y-1.5">
        <label htmlFor="export-filename" className="text-xs font-semibold text-slate-400 block font-mono">File Name</label>
        <input
          id="export-filename"
          type="text"
          value={settings.customName}
          onChange={(e) => handleFileNameChange(e.target.value)}
          placeholder="image_edit"
          className="w-full px-3 py-2 bg-slate-950 rounded-lg border border-slate-850 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-sans text-sm font-semibold text-slate-100 placeholder-slate-600"
        />
      </div>

      {/* Format Selection tabs */}
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-slate-400 block font-mono">Export Format</span>
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-850 rounded-xl text-xs font-semibold text-slate-400">
          {(['image/png', 'image/jpeg', 'image/webp'] as const).map((fmt) => {
            const label = fmt === 'image/jpeg' ? 'JPEG' : fmt === 'image/webp' ? 'WebP' : 'PNG';
            const isActive = settings.format === fmt;
            return (
              <button
                id={`format-tab-${label.toLowerCase()}`}
                key={fmt}
                onClick={() => handleFormatChange(fmt)}
                className={`py-2 rounded-lg transition-all ${
                  isActive 
                    ? 'bg-slate-850 text-blue-400 font-bold shadow-xs border border-slate-805' 
                    : 'hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conditional Quality compression slider */}
      {settings.format !== 'image/png' && (
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">Compression Quality</span>
            <span className="text-blue-400 font-mono font-bold">{Math.round(settings.quality * 100)}%</span>
          </div>
          <input
            id="export-quality-slider"
            type="range"
            min="0.1"
            max="1.0"
            step="0.05"
            value={settings.quality}
            onChange={(e) => handleQualityChange(e.target.value)}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 border border-slate-800"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>Extra Small (0.1)</span>
            <span>Balanced (0.75)</span>
            <span>Uncompressed (1.0)</span>
          </div>
        </div>
      )}

      {/* Live Estimated Sizing Breakout Card */}
      <div className="bg-slate-950 rounded-2xl p-4 border border-slate-850 space-y-3">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <FileDown className="w-3.5 h-3.5 text-blue-400" />
          Sizing & Weight Summary
        </h4>

        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Source metrics */}
          <div className="space-y-0.5">
            <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Original Weight</span>
            <span className="text-sm font-semibold text-slate-300 font-mono">{formatBytes(originalSizeBytes)}</span>
          </div>

          {/* Compressed target metrics */}
          <div className="space-y-0.5 border-l border-slate-800 pl-3">
            <span className="text-[10px] font-bold text-blue-400 block uppercase font-mono">Estimated Weight</span>
            <span className="text-sm font-bold text-blue-400 font-mono">
              {estimatedSizeBytes ? formatBytes(estimatedSizeBytes) : 'Calculating...'}
            </span>
          </div>
        </div>

        {/* Space savings ticker */}
        {estimatedSizeBytes && (
          <div className="mt-2 pt-2.5 border-t border-slate-800/80 flex items-center gap-2">
            {hasSavings ? (
              <>
                <div className="w-6 h-6 rounded-full bg-emerald-950/40 border border-emerald-900/35 flex items-center justify-center text-emerald-400 shrink-0">
                  <FileCheck className="w-3.5 h-3.5" />
                </div>
                <p className="text-xs text-emerald-300 font-medium leading-normal">
                  You saved <strong>{savingsPct}%</strong> of storage space ({formatBytes(originalSizeBytes - estimatedSizeBytes)} saved)!
                </p>
              </>
            ) : (
              <>
                <div className="w-6 h-6 rounded-full bg-amber-950/40 border border-amber-900/35 flex items-center justify-center text-amber-500 shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] text-amber-300 font-medium leading-normal">
                  Export settings yield no reduction. Consider changing formats to WebP or choosing a lower quality factor to compress.
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Master triggers */}
      <button
        id="btn-trigger-download"
        onClick={onExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-sm font-black cursor-pointer active:scale-[0.99] transition-all focus:outline-hidden shadow-lg shadow-blue-900/20 border border-blue-500"
      >
        <Download className="w-4 h-4" />
        {isExporting ? 'Optimizing & Rendering...' : `Download ${settings.format === 'image/jpeg' ? 'JPEG' : settings.format === 'image/webp' ? 'WebP' : 'PNG'}`}
      </button>

      {/* Browser notice */}
      <p className="text-[10px] text-slate-500 text-center leading-normal max-w-[240px] mx-auto font-mono">
        Your images are processed 100% locally in your client sandbox. No servers handle your media data.
      </p>
    </div>
  );
}
