import React, { useState, useEffect } from 'react';
import { 
  ImageState, 
  CropArea, 
  Adjustments, 
  ResizeSettings, 
  ExportSettings, 
  INITIAL_ADJUSTMENTS 
} from './types';
import ImageUploader from './components/ImageUploader';
import CropWorkspace from './components/CropWorkspace';
import AdjustmentPanel from './components/AdjustmentPanel';
import ResizePanel from './components/ResizePanel';
import ExportPanel from './components/ExportPanel';
import { renderFinalCanvas } from './utils/imageEffects';
import { 
  Crop, 
  Sliders, 
  Minimize2, 
  Download, 
  FolderOpen, 
  RotateCcw, 
  Sparkles, 
  SlidersHorizontal,
  FileCheck2,
  Image as ImageIcon,
  Grid,
  Sun,
  Moon
} from 'lucide-react';
import CollageWorkspace from './components/CollageWorkspace';
import LiveBackground from './components/LiveBackground';

export default function App() {
  const [imageState, setImageState] = useState<ImageState | null>(null);
  const [studioMode, setStudioMode] = useState<'single' | 'collage'>('single');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixelscale-theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('pixelscale-theme', theme);
  }, [theme]);

  // Workspace settings states
  const [crop, setCrop] = useState<CropArea>({ x: 0, y: 0, width: 1, height: 1 });
  const [aspectRatio, setAspectRatio] = useState<string>('free');
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [adjustments, setAdjustments] = useState<Adjustments>(INITIAL_ADJUSTMENTS);

  // Resize and export settings states
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    width: 0,
    height: 0,
    keepAspectRatio: true,
  });
  const [exportSettings, setExportSettings] = useState<ExportSettings>({
    format: 'image/jpeg',
    quality: 0.85,
    customName: 'modified_image.jpg',
  });

  // Export sizes and execution flags
  const [estimatedSize, setEstimatedSize] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Responsive sidebar tab state
  const [activeTab, setActiveTab] = useState<'crop' | 'effects' | 'resize' | 'export'>('crop');

  // Load a brand new image
  const handleImageLoaded = (loaded: ImageState) => {
    setImageState(loaded);

    // Reset default parameters
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setAspectRatio('free');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAdjustments(INITIAL_ADJUSTMENTS);

    // Default sizing matches loaded raw dimensions
    setResizeSettings({
      width: loaded.width,
      height: loaded.height,
      keepAspectRatio: true,
    });

    // Default exports target JPeg compression format
    const baseName = loaded.name.split('.').slice(0, -1).join('.') || 'custom_image';
    setExportSettings({
      format: 'image/jpeg',
      quality: 0.85,
      customName: `${baseName}_reduced.jpg`,
    });
    setActiveTab('crop');
  };

  // Asynchronous debounced preview compilation for file weight estimation
  useEffect(() => {
    if (!imageState) return;

    const timer = setTimeout(() => {
      const img = new Image();
      img.onload = async () => {
        try {
          // Adjust physical widths in calculation for rotated horizontal offsets
          const targetW = resizeSettings.width > 0 ? resizeSettings.width : imageState.width;
          const targetH = resizeSettings.height > 0 ? resizeSettings.height : imageState.height;

          const canvas = await renderFinalCanvas(
            img,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            targetW,
            targetH,
            rotation,
            flipH,
            flipV,
            adjustments
          );

          canvas.toBlob(
            (blob) => {
              if (blob) {
                setEstimatedSize(blob.size);
              }
            },
            exportSettings.format,
            exportSettings.quality
          );
        } catch (e) {
          console.error("Internal draft computation failed:", e);
        }
      };
      img.src = imageState.src;
    }, 400); // Debounce slider events by 400ms

    return () => clearTimeout(timer);
  }, [
    imageState,
    crop,
    rotation,
    flipH,
    flipV,
    adjustments,
    resizeSettings.width,
    resizeSettings.height,
    exportSettings.format,
    exportSettings.quality,
  ]);

  // Master execution hook to download final compressed file
  const handleDownload = async () => {
    if (!imageState) return;
    setIsExporting(true);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          const targetW = resizeSettings.width;
          const targetH = resizeSettings.height;

          const canvas = await renderFinalCanvas(
            img,
            crop.x,
            crop.y,
            crop.width,
            crop.height,
            targetW,
            targetH,
            rotation,
            flipH,
            flipV,
            adjustments
          );

          const dataUrl = canvas.toDataURL(exportSettings.format, exportSettings.quality);

          // Invoke download programmatic pointer click flow
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = exportSettings.customName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (err) {
          console.error(err);
          alert('Could not render image. Please lower target resolution dimensions and try again.');
        } finally {
          setIsExporting(false);
        }
      };
      img.src = imageState.src;
    } catch (e) {
      console.error(e);
      setIsExporting(false);
    }
  };

  // Render cropped canvas and update source imageState
  const handleApplyCrop = async () => {
    if (!imageState) return;
    
    // Create new image helper
    const img = new Image();
    img.onload = async () => {
      try {
        const isVertical = rotation === 90 || rotation === 270;
        const srcW = isVertical ? imageState.height : imageState.width;
        const srcH = isVertical ? imageState.width : imageState.height;
        
        const targetW = Math.round(crop.width * srcW);
        const targetH = Math.round(crop.height * srcH);
        
        const canvas = await renderFinalCanvas(
          img,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          targetW,
          targetH,
          rotation,
          flipH,
          flipV,
          INITIAL_ADJUSTMENTS // Crop only, keeping visual filters dynamic
        );
        
        const croppedDataUrl = canvas.toDataURL(imageState.type);
        
        setImageState({
          src: croppedDataUrl,
          name: imageState.name,
          type: imageState.type,
          sizeBytes: Math.round((croppedDataUrl.length - 22) * 3 / 4),
          width: targetW,
          height: targetH,
        });
        
        // Reset variables
        setCrop({ x: 0, y: 0, width: 1, height: 1 });
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        
        // Reset resize sizes to new boundary
        setResizeSettings(prev => ({
          ...prev,
          width: targetW,
          height: targetH,
        }));
        
      } catch (err) {
        console.error("Cropping action failed:", err);
      }
    };
    img.src = imageState.src;
  };

  const handleResetAllControls = () => {
    if (!imageState) return;
    setCrop({ x: 0, y: 0, width: 1, height: 1 });
    setAspectRatio('free');
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAdjustments(INITIAL_ADJUSTMENTS);
    setResizeSettings({
      width: imageState.width,
      height: imageState.height,
      keepAspectRatio: true,
    });
  };

  const clearImage = () => {
    setImageState(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      <LiveBackground theme={theme} />
      {/* Top Application Header */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800/80 h-16 flex items-center shrink-0 px-4 md:px-8 shadow-md z-10 relative">
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-lg shadow-blue-900/20">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div className="hidden xs:block">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight leading-none mb-0.5">PixelScale <span className="text-blue-500 font-extrabold">Pro</span></h1>
              <span className="text-[10px] text-slate-500 font-mono leading-none">Studio v2.3</span>
            </div>
          </div>

          {/* Mode Selector Toggle */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-xl mx-2">
            <button
              id="mode-selector-single"
              onClick={() => setStudioMode('single')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                studioMode === 'single'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Single Editor</span>
              <span className="sm:hidden">Single</span>
            </button>
            <button
              id="mode-selector-collage"
              onClick={() => setStudioMode('collage')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                studioMode === 'collage'
                  ? 'bg-blue-600 text-white shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Collage & Combiner</span>
              <span className="sm:hidden">Collage</span>
            </button>
          </div>

          {/* Header Action buttons or information display */}
          <div className="flex items-center gap-2">
            <button
              id="theme-toggle"
              onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
              className="flex items-center justify-center p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-500" />
              )}
            </button>

            {studioMode === 'single' && imageState && (
              <div className="hidden lg:flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-405 max-w-xs">
                <span className="font-semibold text-slate-200 truncate block">{imageState.name}</span>
                <span className="text-slate-700">|</span>
                <span className="font-mono uppercase text-blue-400">{imageState.type.split('/')[1]}</span>
              </div>
            )}
            
            {studioMode === 'single' && imageState && (
              <>
                <button
                  id="reset-studio"
                  onClick={handleResetAllControls}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100 px-3 py-2 rounded-lg hover:bg-slate-800 font-medium transition-all"
                  title="Reset crop, rotate, and adjustment sliders back to zero"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden md:inline">Reset Controls</span>
                </button>
                <button
                  id="import-another"
                  onClick={clearImage}
                  className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-950/40 border border-blue-900/50 hover:bg-blue-900/30 px-3 py-2 rounded-lg font-semibold transition-all"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span>New Image</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Studio Workspace container */}
      <main className="flex-1 flex flex-col relative z-10">
        {studioMode === 'collage' ? (
          <CollageWorkspace onBackToSingle={() => setStudioMode('single')} />
        ) : !imageState ? (
          <div className="flex-1 flex items-center justify-center">
            <ImageUploader onImageLoaded={handleImageLoaded} />
          </div>
        ) : (
          <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60 bg-slate-950/80 backdrop-blur-md rounded-b-xl overflow-hidden border-x border-b border-slate-800/40 shadow-2xl">
            {/* Left Hand: Powerful Crop/View stage */}
            <div className="flex-1 flex flex-col bg-black/40 overflow-hidden lg:rounded-bl-xl">
              <CropWorkspace
                imageState={imageState}
                crop={crop}
                setCrop={setCrop}
                aspectRatio={aspectRatio}
                setAspectRatio={setAspectRatio}
                rotation={rotation}
                setRotation={setRotation}
                flipH={flipH}
                setFlipH={setFlipH}
                flipV={flipV}
                setFlipV={setFlipV}
                adjustments={adjustments}
                onApplyCrop={handleApplyCrop}
              />
            </div>

            {/* Right Hand: Stateful adjustment Sidebar panel */}
            <div className="w-full lg:w-96 bg-slate-900/55 shrink-0 flex flex-col h-auto lg:h-[calc(100vh-4rem)] overflow-y-auto border-l border-slate-800/60 backdrop-blur-md">
              {/* Tab Toggles structure */}
              <div id="side-tab-selectors" className="flex border-b border-slate-800/60 bg-slate-950/60">
                {/* Crop tab */}
                <button
                  id="tab-crop"
                  onClick={() => setActiveTab('crop')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'crop' 
                      ? 'border-blue-500 text-blue-400 bg-slate-900/65' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Crop className="w-4 h-4" />
                  <span>Crop Area</span>
                </button>

                {/* Effects tab */}
                <button
                  id="tab-effects"
                  onClick={() => setActiveTab('effects')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'effects' 
                      ? 'border-blue-500 text-blue-400 bg-slate-900/65' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Effects</span>
                </button>

                {/* Resize Tab */}
                <button
                  id="tab-resize"
                  onClick={() => setActiveTab('resize')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'resize' 
                      ? 'border-blue-500 text-blue-400 bg-slate-900/65' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>Resize</span>
                </button>

                {/* Save Tab */}
                <button
                  id="tab-export"
                  onClick={() => setActiveTab('export')}
                  className={`flex-1 py-3 text-xs font-bold border-b-2 flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'export' 
                      ? 'border-blue-500 text-blue-400 bg-slate-900/65' 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>Save</span>
                </button>
              </div>

              {/* Dynamic sidebar body based on active tab select */}
              <div className="p-6 flex-1 bg-slate-900 text-slate-200">
                {activeTab === 'crop' && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                      <Crop className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-semibold text-slate-100">Crop Composition</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Lock your ratio by picking presets <strong>(e.g. 16:9, 1:1)</strong>, or choose <strong>Free</strong> to drag borders independently. 
                      You can also use the flip and rotate controls inside the main window header.
                    </p>
                    <div className="bg-blue-950/20 rounded-xl p-4 border border-blue-900/35 text-xs text-blue-200 space-y-1">
                      <p className="font-semibold flex items-center gap-1.5 text-blue-400">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" /> 
                        Rule of Thirds Enabled
                      </p>
                      <p className="text-blue-300/80 leading-normal">
                        Align focal points with the intersecting gridlines to design cinematic compositions.
                      </p>
                    </div>

                    {/* Master Apply Crop Action button */}
                    <button
                      id="btn-apply-crop"
                      onClick={handleApplyCrop}
                      disabled={crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1 && rotation === 0 && !flipH && !flipV}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-850 disabled:text-slate-500 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-blue-950/25 border border-blue-500 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                      <Crop className="w-4 h-4" />
                      Apply & Crop Selection
                    </button>
                  </div>
                )}

                {activeTab === 'effects' && (
                  <AdjustmentPanel 
                    adjustments={adjustments} 
                    setAdjustments={setAdjustments} 
                  />
                )}

                {activeTab === 'resize' && (
                  <ResizePanel
                    imageState={imageState}
                    crop={crop}
                    settings={resizeSettings}
                    setSettings={setResizeSettings}
                    rotation={rotation}
                  />
                )}

                {activeTab === 'export' && (
                  <ExportPanel
                    settings={exportSettings}
                    setSettings={setExportSettings}
                    originalSizeBytes={imageState.sizeBytes}
                    estimatedSizeBytes={estimatedSize}
                    isExporting={isExporting}
                    onExport={handleDownload}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
