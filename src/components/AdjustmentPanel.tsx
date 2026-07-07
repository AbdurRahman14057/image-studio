import React from 'react';
import { Adjustments, INITIAL_ADJUSTMENTS } from '../types';
import { Sliders, Sun, Eye, Contrast, Image, Sparkles } from 'lucide-react';

interface AdjustmentPanelProps {
  adjustments: Adjustments;
  setAdjustments: React.Dispatch<React.SetStateAction<Adjustments>>;
}

interface FilterPreset {
  id: string;
  name: string;
  description: string;
  values: Partial<Adjustments>;
  avatarColor: string;
}

const PRESET_FILTERS: FilterPreset[] = [
  {
    id: 'original',
    name: 'Original',
    description: 'No filters applied',
    values: INITIAL_ADJUSTMENTS,
    avatarColor: 'bg-gray-200 border-gray-300',
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    description: 'Warm glowing amber light',
    values: {
      ...INITIAL_ADJUSTMENTS,
      brightness: 8,
      contrast: 10,
      saturation: 25,
      warmth: 45,
      exposure: 5,
      vignette: 8,
    },
    avatarColor: 'bg-amber-100 border-amber-300',
  },
  {
    id: 'vintage',
    name: 'Moody Vintage',
    description: 'Classic analog film aesthetic',
    values: {
      ...INITIAL_ADJUSTMENTS,
      brightness: -5,
      contrast: 15,
      saturation: -18,
      sepia: 40,
      warmth: 15,
      vignette: 25,
      sharpness: 10,
    },
    avatarColor: 'bg-rose-100 border-pink-300',
  },
  {
    id: 'teal-orange',
    name: 'Teal & Orange',
    description: 'Cinematic color grading',
    values: {
      ...INITIAL_ADJUSTMENTS,
      brightness: 2,
      contrast: 18,
      saturation: 15,
      warmth: -10,
      hueRotate: 5,
      vignette: 15,
      sharpness: 18,
    },
    avatarColor: 'bg-teal-100 border-cyan-300',
  },
  {
    id: 'noir',
    name: 'Classic Noir',
    description: 'High contrast black and white',
    values: {
      ...INITIAL_ADJUSTMENTS,
      grayscale: 100,
      contrast: 40,
      exposure: -5,
      vignette: 22,
      sharpness: 35,
    },
    avatarColor: 'bg-zinc-800 border-zinc-950',
  },
  {
    id: 'cyber',
    name: 'Cyberpunk',
    description: 'Neon pink and deep purple tones',
    values: {
      ...INITIAL_ADJUSTMENTS,
      contrast: 25,
      saturation: 50,
      hueRotate: 315,
      vignette: 12,
    },
    avatarColor: 'bg-fuchsia-100 border-fuchsia-400',
  },
  {
    id: 'glacier',
    name: 'Cool Glacier',
    description: 'Crisp cold blue hues',
    values: {
      ...INITIAL_ADJUSTMENTS,
      brightness: 5,
      contrast: 8,
      saturation: -12,
      warmth: -40,
      vignette: 5,
      sharpness: 20,
    },
    avatarColor: 'bg-sky-100 border-sky-300',
  },
];

export default function AdjustmentPanel({ adjustments, setAdjustments }: AdjustmentPanelProps) {
  
  const handleSliderChange = (key: keyof Adjustments, value: number) => {
    setAdjustments(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyPreset = (preset: FilterPreset) => {
    setAdjustments({
      ...INITIAL_ADJUSTMENTS,
      ...preset.values,
    });
  };

  const handleReset = () => {
    setAdjustments(INITIAL_ADJUSTMENTS);
  };

  // Helper lists of sliders for easier layout rendering
  const lightSliders = [
    { label: 'Brightness', key: 'brightness' as const, min: -100, max: 100, unit: '%' },
    { label: 'Contrast', key: 'contrast' as const, min: -100, max: 100, unit: '%' },
    { label: 'Exposure', key: 'exposure' as const, min: -100, max: 100, unit: '%' },
    { label: 'Vignette', key: 'vignette' as const, min: 0, max: 100, unit: '%' },
  ];

  const colorSliders = [
    { label: 'Saturation', key: 'saturation' as const, min: -100, max: 100, unit: '%' },
    { label: 'Warmth / Temperature', key: 'warmth' as const, min: -100, max: 100, unit: 'K' },
    { label: 'Grayscale', key: 'grayscale' as const, min: 0, max: 100, unit: '%' },
    { label: 'Sepia', key: 'sepia' as const, min: 0, max: 100, unit: '%' },
    { label: 'Hue Rotate', key: 'hueRotate' as const, min: 0, max: 360, unit: '°' },
  ];

  const detailSliders = [
    { label: 'Sharpness (Convolution)', key: 'sharpness' as const, min: 0, max: 100, unit: '%' },
    { label: 'Soft Blur', key: 'blur' as const, min: 0, max: 20, unit: 'px' },
    { label: 'Invert Colors', key: 'invert' as const, min: 0, max: 100, unit: '%' },
  ];

  return (
    <div className="space-y-6">
      {/* Visual Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
          <Sliders className="w-4 h-4 text-blue-400" />
          Effects & Filters
        </h3>
        <button
          id="effect-reset"
          onClick={handleReset}
          className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:bg-slate-800 px-2.5 py-1.5 rounded-md transition-colors border border-blue-900/30 bg-blue-950/20"
        >
          Reset Effects
        </button>
      </div>

      {/* 1-Click Filter Presets (Horizontal Scroll List) */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          1-Click Filter Presets
        </h4>
        <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          {PRESET_FILTERS.map((preset) => (
            <button
              id={`preset-${preset.id}`}
              key={preset.id}
              onClick={() => applyPreset(preset)}
              className="flex-none w-[95px] p-2 bg-slate-950 rounded-lg border border-slate-800/80 hover:border-blue-500 hover:bg-slate-900 transition-all text-left group flex flex-col items-center text-center"
            >
              <div className={`w-9 h-9 rounded-full ${preset.avatarColor} border-2 mb-1.5 flex items-center justify-center transition-transform group-hover:scale-105`}>
                <Image className="w-4 h-4 text-slate-800 group-hover:text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-slate-200 truncate w-full">{preset.name}</span>
              <span className="text-[9px] text-slate-400 leading-tight truncate w-full">{preset.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Slicers breakdown: LIGHT & EXPOSURE */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Sun className="w-3.5 h-3.5 text-blue-400" />
          Light & Vignette
        </h4>
        <div className="grid grid-cols-1 gap-3.5">
          {lightSliders.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">{s.label}</span>
                <span className="text-slate-400 font-mono">
                  {adjustments[s.key] > 0 && s.min < 0 ? `+${adjustments[s.key]}` : adjustments[s.key]}
                  {s.unit}
                </span>
              </div>
              <input
                id={`slider-${s.key}`}
                type="range"
                min={s.min}
                max={s.max}
                value={adjustments[s.key]}
                onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 border border-slate-800"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slicers breakdown: COLOR GRADIENT */}
      <div className="space-y-4 pt-1">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Contrast className="w-3.5 h-3.5 text-blue-400" />
          Color Adjustments
        </h4>
        <div className="grid grid-cols-1 gap-3.5">
          {colorSliders.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">{s.label}</span>
                <span className="text-slate-400 font-mono">
                  {adjustments[s.key] > 0 && s.min < 0 ? `+${adjustments[s.key]}` : adjustments[s.key]}
                  {s.unit}
                </span>
              </div>
              <input
                id={`slider-${s.key}`}
                type="range"
                min={s.min}
                max={s.max}
                value={adjustments[s.key]}
                onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 border border-slate-800"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slicers breakdown: CRISP & DETAIL */}
      <div className="space-y-4 pt-1">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          Focus & Details
        </h4>
        <div className="grid grid-cols-1 gap-3.5">
          {detailSliders.map((s) => (
            <div key={s.key} className="space-y-1">
              <div className="flex justify-between text-xs font-medium">
                <span className="text-slate-300">{s.label}</span>
                <span className="text-slate-400 font-mono">
                  {adjustments[s.key]}
                  {s.unit}
                </span>
              </div>
              <input
                id={`slider-${s.key}`}
                type="range"
                min={s.min}
                max={s.max}
                step={s.key === 'blur' ? 0.5 : 1}
                value={adjustments[s.key]}
                onChange={(e) => handleSliderChange(s.key, Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 border border-slate-800"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
