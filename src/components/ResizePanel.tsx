import React, { useEffect, useState } from 'react';
import { ResizeSettings, ImageState, CropArea } from '../types';
import { Minimize, Lock, Unlock, Zap, HelpCircle } from 'lucide-react';

interface ResizePanelProps {
  imageState: ImageState;
  crop: CropArea;
  settings: ResizeSettings;
  setSettings: (settings: ResizeSettings) => void;
  rotation: number;
}

export default function ResizePanel({
  imageState,
  crop,
  settings,
  setSettings,
  rotation,
}: ResizePanelProps) {
  // Compute size of cropped bounding box prior to scaling
  const isVertical = rotation === 90 || rotation === 270;
  
  // Crop dimension calculations in high-res pixels
  const baseCroppedW = Math.round(crop.width * (isVertical ? imageState.height : imageState.width));
  const baseCroppedH = Math.round(crop.height * (isVertical ? imageState.width : imageState.height));

  const cropAspectRatio = baseCroppedW / baseCroppedH;

  // React on crop variations to adjust dimensions to match percentage
  const [scalePercentage, setScalePercentage] = useState<number>(100);

  // Sync dimensions when base cropped size changes due to crop box adjustment
  useEffect(() => {
    const nextW = Math.round(baseCroppedW * (scalePercentage / 100));
    const nextH = Math.round(baseCroppedH * (scalePercentage / 100));
    setSettings({
      width: nextW,
      height: nextH,
      keepAspectRatio: settings.keepAspectRatio,
    });
  }, [crop, scalePercentage, rotation]);

  const handleWidthChange = (valStr: string) => {
    let w = parseInt(valStr) || 0;
    if (w < 1) w = 1;
    if (w > 12000) w = 12000; // sensible maximum

    let h = settings.height;
    if (settings.keepAspectRatio) {
      h = Math.round(w / cropAspectRatio);
    }
    
    // Reverse compute scale percentage for the slider UI representation
    const newPercent = Math.round((w / baseCroppedW) * 100);
    setScalePercentage(Math.max(1, Math.min(200, newPercent)));

    setSettings({
      width: w,
      height: h,
      keepAspectRatio: settings.keepAspectRatio,
    });
  };

  const handleHeightChange = (valStr: string) => {
    let h = parseInt(valStr) || 0;
    if (h < 1) h = 1;
    if (h > 12000) h = 12000;

    let w = settings.width;
    if (settings.keepAspectRatio) {
      w = Math.round(h * cropAspectRatio);
    }

    const newPercent = Math.round((h / baseCroppedH) * 100);
    setScalePercentage(Math.max(1, Math.min(200, newPercent)));

    setSettings({
      width: w,
      height: h,
      keepAspectRatio: settings.keepAspectRatio,
    });
  };

  const handlePercentSliderChange = (percent: number) => {
    setScalePercentage(percent);
    const w = Math.round(baseCroppedW * (percent / 100));
    const h = Math.round(baseCroppedH * (percent / 100));
    setSettings({
      width: w,
      height: h,
      keepAspectRatio: settings.keepAspectRatio,
    });
  };

  const toggleAspectLock = () => {
    const nextLockState = !settings.keepAspectRatio;
    let nextH = settings.height;
    if (nextLockState) {
      // snap back to exact aspect ratio matching crop
      nextH = Math.round(settings.width / cropAspectRatio);
    }
    setSettings({
      ...settings,
      height: nextH,
      keepAspectRatio: nextLockState,
    });
  };

  // Profile presets
  const presets = [
    { name: 'Full Size', scale: 100 },
    { name: '75%', scale: 75 },
    { name: '50% (Medium)', scale: 50 },
    { name: '25% (Web Thumbnail)', scale: 25 },
  ];

  return (
    <div className="space-y-5">
      {/* Segment Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5 font-sans">
          <Minimize className="w-4 h-4 text-blue-400" />
          Dimension Reducer & Scale
        </h3>
        <span className="text-xs text-slate-500 font-mono">
          Ratio: {cropAspectRatio.toFixed(2)}
        </span>
      </div>

      {/* Numerical inputs for px */}
      <div className="bg-slate-950 p-3.5 h-auto rounded-xl border border-slate-850">
        <div className="grid grid-cols-2 gap-3 items-end">
          {/* Target Width Input */}
          <div className="space-y-1">
            <label htmlFor="resize-width" className="text-xs font-semibold text-slate-400 block font-mono">Target Width (px)</label>
            <input
              id="resize-width"
              type="number"
              value={settings.width}
              onChange={(e) => handleWidthChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm font-medium text-slate-100"
            />
          </div>

          {/* Target Height Input */}
          <div className="space-y-1">
            <label htmlFor="resize-height" className="text-xs font-semibold text-slate-400 block font-mono">Target Height (px)</label>
            <input
              id="resize-height"
              type="number"
              value={settings.height}
              onChange={(e) => handleHeightChange(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono text-sm font-medium text-slate-100"
            />
          </div>
        </div>

        {/* Aspect Ratio Constraint Control button */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <button
            id="aspect-ratio-lock"
            onClick={toggleAspectLock}
            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
              settings.keepAspectRatio 
                ? 'bg-blue-950/40 border-blue-900/60 text-blue-400 hover:bg-blue-900/30 font-semibold' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            {settings.keepAspectRatio ? (
              <>
                <Lock className="w-3.5 h-3.5" /> Lock Aspect Ratio
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5" /> Unlock Aspect Ratio
              </>
            )}
          </button>
          
          <span className="text-[10px] text-slate-500 leading-tight block text-right max-w-[150px]">
            {settings.keepAspectRatio 
              ? 'Automatically adjusts alternative size to match crop bounds.' 
              : 'Stretches/squeezes original image into customized layout.'}
          </span>
        </div>
      </div>

      {/* Sliding Percentage bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-medium">
          <span className="text-slate-300 flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider">
            Quick Scaling percentage
          </span>
          <span className="text-blue-400 font-mono font-semibold">{scalePercentage}%</span>
        </div>
        
        <input
          id="scale-percent-slider"
          type="range"
          min="1"
          max="200"
          value={scalePercentage}
          onChange={(e) => handlePercentSliderChange(Number(e.target.value))}
          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 border border-slate-800"
        />
        
        <div className="flex justify-between text-[10px] text-slate-500 font-mono">
          <span>1%</span>
          <span>50%</span>
          <span>100% (Original)</span>
          <span>150%</span>
          <span>200% (Upscale)</span>
        </div>
      </div>

      {/* Preset Scale shortcut grids */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 font-mono">
          <Zap className="w-3.5 h-3.5 text-blue-400" /> Preset Scaling Modes
        </span>
        <div className="grid grid-cols-2 gap-2">
          {presets.map((preset) => (
            <button
              id={`preset-scale-${preset.scale}`}
              key={preset.scale}
              onClick={() => handlePercentSliderChange(preset.scale)}
              className={`px-3 py-2 text-xs font-bold border rounded-lg transition-all ${
                scalePercentage === preset.scale
                  ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-900/20'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Resize info note */}
      <div className="bg-blue-950/20 rounded-xl p-3 border border-blue-900/35 flex gap-2 text-xs text-blue-300">
        <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-semibold text-slate-200">Resizing Philosophy</p>
          <p className="text-blue-300/80 leading-relaxed text-[11px]">
            Size reductions scale your <strong>cropped grid area</strong>. This maintains maximum crisp resolution prior to compressing the final pixels.
          </p>
        </div>
      </div>
    </div>
  );
}
