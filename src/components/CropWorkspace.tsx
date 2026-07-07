import React, { useRef, useState, useEffect } from 'react';
import { CropArea, ImageState, ImageRotation, Adjustments } from '../types';
import { RotateCw, RotateCcw, FlipHorizontal, FlipVertical, Crop, Printer } from 'lucide-react';
import { renderFinalCanvas } from '../utils/imageEffects';
import { getCSSFilterString } from '../utils/imageEffects';

interface CropWorkspaceProps {
  imageState: ImageState;
  crop: CropArea;
  setCrop: (crop: CropArea) => void;
  aspectRatio: string; // 'free' | '1:1' | '16:9' | '4:3' | '3:2' | '21:9'
  setAspectRatio: (aspect: string) => void;
  rotation: ImageRotation;
  setRotation: React.Dispatch<React.SetStateAction<ImageRotation>>;
  flipH: boolean;
  setFlipH: (val: boolean) => void;
  flipV: boolean;
  setFlipV: (val: boolean) => void;
  adjustments: Adjustments;
  onApplyCrop: () => void;
}

export default function CropWorkspace({
  imageState,
  crop,
  setCrop,
  aspectRatio,
  setAspectRatio,
  rotation,
  setRotation,
  flipH,
  setFlipH,
  flipV,
  setFlipV,
  adjustments,
  onApplyCrop,
}: CropWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageBounds, setImageBounds] = useState({ left: 0, top: 0, width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState<string | null>(null);
  const dragStartRef = useRef<{ pointerX: number; pointerY: number; cropX: number; cropY: number; cropW: number; cropH: number }>({
    pointerX: 0,
    pointerY: 0,
    cropX: 0,
    cropY: 0,
    cropW: 0,
    cropH: 0,
  });

  const imgAr = imageState.width / imageState.height;

  // Track display dimensions of current image based on wrapper boundary fitting
  const updateImageDisplayBounds = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    
    // Size fitting math
    const contW = container.clientWidth;
    const contH = container.clientHeight;
    if (!contW || !contH) return;
    
    // Check if image is rotated vertically for aspect computations
    const isVertical = rotation === 90 || rotation === 270;
    const currentAr = isVertical ? (1 / imgAr) : imgAr;

    let displayW = contW;
    let displayH = contW / currentAr;

    if (displayH > contH) {
      displayH = contH;
      displayW = contH * currentAr;
    }

    const bounds = {
      left: (contW - displayW) / 2,
      top: (contH - displayH) / 2,
      width: displayW,
      height: displayH,
    };
    setImageBounds(bounds);
  };

  // Run calculation when image, containers, rotations, flip values change
  useEffect(() => {
    updateImageDisplayBounds();
    const resizeObserver = new ResizeObserver(() => {
      updateImageDisplayBounds();
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    return () => resizeObserver.disconnect();
  }, [imageState, rotation, flipH, flipV]);

  // Adjust crop state if locked aspect ratio changes
  useEffect(() => {
    if (aspectRatio === 'free') return;
    
    const targetAr = getTargetAspectRatioValue();
    const isVertical = rotation === 90 || rotation === 270;
    const actualImgAr = isVertical ? (1 / imgAr) : imgAr;
    const normRatio = targetAr / actualImgAr; // crop.w / crop.h should equal this normRatio

    let fitW = crop.width;
    let fitH = crop.width / normRatio;

    if (fitH > 1.0) {
      fitH = crop.height;
      fitW = crop.height * normRatio;
      if (fitW > 1.0) {
        fitW = 1.0;
        fitH = 1.0 / normRatio;
      }
    }

    // Centered crop update
    const nextX = Math.max(0, Math.min(1.0 - fitW, 0.5 - fitW / 2));
    const nextY = Math.max(0, Math.min(1.0 - fitH, 0.5 - fitH / 2));

    setCrop({
      x: nextX,
      y: nextY,
      width: fitW,
      height: fitH,
    });
  }, [aspectRatio, rotation, imageState]);

  const getTargetAspectRatioValue = (): number => {
    switch (aspectRatio) {
      case '1:1': return 1.0;
      case '16:9': return 16 / 9;
      case '4:3': return 4 / 3;
      case '3:2': return 3 / 2;
      case '21:9': return 21 / 9;
      default: return 1.0;
    }
  };

  // Pointer drag triggers
  const handlePointerDown = (e: React.PointerEvent, handle: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    
    setActiveHandle(handle);
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      cropX: crop.x,
      cropY: crop.y,
      cropW: crop.width,
      cropH: crop.height,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!activeHandle || !imageBounds.width || !imageBounds.height) return;
    e.preventDefault();

    const dx = (e.clientX - dragStartRef.current.pointerX) / imageBounds.width;
    const dy = (e.clientY - dragStartRef.current.pointerY) / imageBounds.height;
    
    const start = dragStartRef.current;
    let nextX = start.cropX;
    let nextY = start.cropY;
    let nextW = start.cropW;
    let nextH = start.cropH;

    const minSize = 0.05; // 5% minimum crop box dimension

    if (activeHandle === 'move') {
      nextX = Math.max(0, Math.min(1.0 - start.cropW, start.cropX + dx));
      nextY = Math.max(0, Math.min(1.0 - start.cropH, start.cropY + dy));
    } else {
      // Calculate individual edge edits
      if (activeHandle.includes('r')) {
        nextW = Math.max(minSize, Math.min(1.0 - start.cropX, start.cropW + dx));
      }
      if (activeHandle.includes('l')) {
        const potentialW = start.cropW - dx;
        if (potentialW >= minSize && start.cropX + dx >= 0) {
          nextX = start.cropX + dx;
          nextW = potentialW;
        }
      }
      if (activeHandle.includes('b')) {
        nextH = Math.max(minSize, Math.min(1.0 - start.cropY, start.cropH + dy));
      }
      if (activeHandle.includes('t')) {
        const potentialH = start.cropH - dy;
        if (potentialH >= minSize && start.cropY + dy >= 0) {
          nextY = start.cropY + dy;
          nextH = potentialH;
        }
      }

      // Enforce Locked Aspect Ratio Constraints
      if (aspectRatio !== 'free') {
        const targetAr = getTargetAspectRatioValue();
        const isVertical = rotation === 90 || rotation === 270;
        const actualImgAr = isVertical ? (1 / imgAr) : imgAr;
        const normRatio = targetAr / actualImgAr; // ideal W / H ratio

        // Lock adjust math based on which primary diagonal vector/handle is active
        if (activeHandle === 'r' || activeHandle === 'l') {
          // Adjust height depending on updated width
          nextH = nextW / normRatio;
          if (nextY + nextH > 1.0) {
            nextH = 1.0 - nextY;
            nextW = nextH * normRatio;
            if (activeHandle === 'l') nextX = start.cropX + (start.cropW - nextW);
          }
        } else if (activeHandle === 't' || activeHandle === 'b') {
          // Adjust width depending on updated height
          nextW = nextH * normRatio;
          if (nextX + nextW > 1.0) {
            nextW = 1.0 - nextX;
            nextH = nextW / normRatio;
            if (activeHandle === 't') nextY = start.cropY + (start.cropH - nextH);
          }
        } else {
          // Corner handles (tl, tr, bl, br) - fit bounding container
          const targetW = nextH * normRatio;
          const targetH = nextW / normRatio;

          // Pick the larger scale bound constraints
          if (nextW / start.cropW > nextH / start.cropH) {
            nextH = nextW / normRatio;
          } else {
            nextW = nextH * normRatio;
          }

          // Bound validation checks
          if (nextX + nextW > 1.0) {
            nextW = 1.0 - nextX;
            nextH = nextW / normRatio;
          }
          if (nextY + nextH > 1.0) {
            nextH = 1.0 - nextY;
            nextW = nextH * normRatio;
          }

          // Adjust X, Y offset again for inverse controls
          if (activeHandle.includes('l')) {
            nextX = start.cropX + (start.cropW - nextW);
          }
          if (activeHandle.includes('t')) {
            nextY = start.cropY + (start.cropH - nextH);
          }
        }
      }
    }

    setCrop({
      x: Math.max(0, Math.min(1.0, nextX)),
      y: Math.max(0, Math.min(1.0, nextY)),
      width: Math.max(minSize, Math.min(1.0 - nextX, nextW)),
      height: Math.max(minSize, Math.min(1.0 - nextY, nextH)),
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!activeHandle) return;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setActiveHandle(null);
  };

  // Preset rotation utilities
  const rotateClockwise = () => {
    setRotation(prev => ((prev + 90) % 360) as ImageRotation);
  };

  const rotateCounterClockwise = () => {
    setRotation(prev => ((prev + 270) % 360) as ImageRotation);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/20">
      {/* Dynamic Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-1 bg-slate-950/60 border border-slate-800 p-0.5 rounded-lg text-xs font-medium">
          <button
            id="aspect-free"
            onClick={() => setAspectRatio('free')}
            className={`px-2.5 py-1.5 rounded-md transition-colors ${aspectRatio === 'free' ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
          >
            Free
          </button>
          {['1:1', '16:9', '4:3', '3:2', '21:9'].map((ratio) => (
            <button
              id={`aspect-${ratio.replace(':', '-')}`}
              key={ratio}
              onClick={() => setAspectRatio(ratio)}
              className={`px-2.5 py-1.5 rounded-md transition-colors ${aspectRatio === ratio ? 'bg-slate-800 text-blue-400 font-semibold shadow-xs' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {ratio}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Rotate left */}
          <button
            id="rotate-ccw"
            onClick={rotateCounterClockwise}
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-800 active:scale-95 transition-all hover:text-slate-100"
            title="Rotate Left"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {/* Rotate right */}
          <button
            id="rotate-cw"
            onClick={rotateClockwise}
            className="p-2 text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-800 active:scale-95 transition-all hover:text-slate-100"
            title="Rotate Right"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          
          <div className="w-[1px] h-6 bg-slate-800 mx-1"></div>

          {/* Flip Horizontal */}
          <button
            id="flip-h"
            onClick={() => setFlipH(!flipH)}
            className={`p-2 rounded-lg border active:scale-95 transition-all ${flipH ? 'bg-blue-950/40 border-blue-900/60 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 border-slate-800'}`}
            title="Flip Horizontally"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          {/* Flip Vertical */}
          <button
            id="flip-v"
            onClick={() => setFlipV(!flipV)}
            className={`p-2 rounded-lg border active:scale-95 transition-all ${flipV ? 'bg-blue-950/40 border-blue-900/60 text-blue-400 font-semibold' : 'text-slate-300 hover:bg-slate-800 border-slate-800'}`}
            title="Flip Vertically"
          >
            <FlipVertical className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-slate-800 mx-1"></div>

          {/* Master Apply Crop button */}
          <button
            id="workspace-btn-apply-crop"
            onClick={onApplyCrop}
            disabled={crop.x === 0 && crop.y === 0 && crop.width === 1 && crop.height === 1 && rotation === 0 && !flipH && !flipV}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition-all shadow-md shadow-blue-950/10 hover:scale-[1.01] active:scale-[0.99]"
            title="Trim the image to the selected crop boundaries"
          >
            <Crop className="w-3.5 h-3.5" />
            <span className="font-sans">Apply Crop</span>
          </button>
          {/* Print current workspace view */}
          <button
            id="workspace-btn-print"
            onClick={async () => {
              try {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = async () => {
                  const tgtW = Math.round(crop.width * (rotation === 90 || rotation === 270 ? imageState.height : imageState.width));
                  const tgtH = Math.round(crop.height * (rotation === 90 || rotation === 270 ? imageState.width : imageState.height));
                  const canvas = await renderFinalCanvas(
                    img,
                    crop.x,
                    crop.y,
                    crop.width,
                    crop.height,
                    tgtW || 800,
                    tgtH || 600,
                    rotation,
                    flipH,
                    flipV,
                    adjustments
                  );

                  const dataUrl = canvas.toDataURL('image/png');
                  const w = window.open('about:blank');
                  if (w) {
                    w.document.write(`<html><head><title>Print Image</title></head><body style="margin:0"><img src="${dataUrl}" style="max-width:100%;height:auto;display:block;margin:0 auto"/></body></html>`);
                    w.document.close();
                    // Wait for image load then print
                    w.onload = () => { setTimeout(() => { w.print(); }, 100); };
                  } else {
                    alert('Unable to open print preview window.');
                  }
                };
                img.src = imageState.src;
              } catch (e) {
                console.error('Print failed', e);
                alert('Could not prepare print preview.');
              }
            }}
            className="ml-2 p-2 text-slate-300 hover:bg-slate-800 rounded-lg border border-slate-800 active:scale-95 transition-all"
            title="Print current view"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas / Editor Space */}
      <div 
        id="crop-canvas-container"
        ref={containerRef}
        className="relative flex-1 bg-slate-950/25 backdrop-blur-xs overflow-hidden min-h-[350px] p-6 flex items-center justify-center select-none cursor-default"
      >
        {/* Render actual image scaled */}
        {imageBounds.width > 0 && (
          <div
            id="crop-image-wrapper"
            style={{
              position: 'absolute',
              left: `${imageBounds.left}px`,
              top: `${imageBounds.top}px`,
              width: `${imageBounds.width}px`,
              height: `${imageBounds.height}px`,
            }}
          >
            {/* Display element with precise styling tags */}
            <img
              ref={imageRef}
              src={imageState.src}
              alt="Workspace image element"
              draggable={false}
              className="object-contain pointer-events-none transition-transform duration-100"
              style={{
                transform: `rotate(${rotation}deg) scale(${flipH ? -1 : 1}, ${flipV ? -1 : 1})`,
                width: rotation === 90 || rotation === 270 ? `${imageBounds.height}px` : '100%',
                height: rotation === 90 || rotation === 270 ? `${imageBounds.width}px` : '100%',
                position: rotation === 90 || rotation === 270 ? 'absolute' : 'relative',
                top: rotation === 90 || rotation === 270 ? `${(imageBounds.height - imageBounds.width) / 2}px` : 'auto',
                left: rotation === 90 || rotation === 270 ? `${(imageBounds.width - imageBounds.height) / 2}px` : 'auto',
                filter: getCSSFilterString(adjustments),
              }}
              onLoad={updateImageDisplayBounds}
            />

            {/* Real-time Warmth/Coolness Overlay */}
            {adjustments.warmth !== 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-100"
                style={{
                  backgroundColor: adjustments.warmth > 0 ? 'rgb(251, 146, 60)' : 'rgb(56, 189, 248)',
                  opacity: (Math.abs(adjustments.warmth) / 100) * 0.28,
                  mixBlendMode: 'color',
                }}
              />
            )}

            {/* Real-time Vignette Overlay */}
            {adjustments.vignette !== 0 && (
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-100"
                style={{
                  background: `radial-gradient(circle, rgba(255,255,255,1) ${Math.max(0, 100 - (adjustments.vignette / 100) * 85)}%, rgba(15,15,15,${0.1 + (adjustments.vignette / 100) * 0.9}) 100%)`,
                  mixBlendMode: 'multiply',
                }}
              />
            )}

            {/* Backdrop Dimming Layers */}
            {/* Top Dim */}
            <div 
              className="absolute bg-slate-950/75 pointer-events-none"
              style={{
                top: 0,
                left: 0,
                right: 0,
                height: `${crop.y * 100}%`,
              }}
            />
            {/* Bottom Dim */}
            <div 
              className="absolute bg-slate-950/75 pointer-events-none"
              style={{
                top: `${(crop.y + crop.height) * 100}%`,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
            {/* Left Dim */}
            <div 
              className="absolute bg-slate-950/75 pointer-events-none"
              style={{
                top: `${crop.y * 100}%`,
                left: 0,
                width: `${crop.x * 100}%`,
                height: `${crop.height * 100}%`,
              }}
            />
            {/* Right Dim */}
            <div 
              className="absolute bg-slate-950/75 pointer-events-none"
              style={{
                top: `${crop.y * 100}%`,
                left: `${(crop.x + crop.width) * 100}%`,
                right: 0,
                height: `${crop.height * 100}%`,
              }}
            />

            {/* Interactive Highlighted Selector Box */}
            <div
              id="crop-selection-box"
              className="absolute border border-blue-500 cursor-move active:cursor-grabbing focus:outline-hidden group shadow-[0_0_0_1.5px_rgba(2,6,17,0.8)]"
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.width * 100}%`,
                height: `${crop.height * 100}%`,
              }}
              onPointerDown={(e) => handlePointerDown(e, 'move')}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              {/* Overlay grid lines (Rule of Thirds) */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-40 pointer-events-none">
                <div className="border-r border-dashed border-blue-400 col-span-1 row-span-3"></div>
                <div className="border-r border-dashed border-blue-400 col-span-1 row-span-3"></div>
                <div className="border-b border-dashed border-blue-400 col-span-3 row-span-1 absolute w-full top-1/3"></div>
                <div className="border-b border-dashed border-blue-400 col-span-3 row-span-1 absolute w-full top-2/3"></div>
              </div>

              {/* Corner Handles (Elegant Figma Blue Dots) */}
              {/* TL */}
              <div
                id="handle-tl"
                className="absolute -top-1.5 -left-1.5 w-3.5 h-3.5 bg-slate-100 border-2 border-blue-500 rounded-full cursor-nwse-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'tl')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              {/* TR */}
              <div
                id="handle-tr"
                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-slate-100 border-2 border-blue-500 rounded-full cursor-nesw-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'tr')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              {/* BL */}
              <div
                id="handle-bl"
                className="absolute -bottom-1.5 -left-1.5 w-3.5 h-3.5 bg-slate-100 border-2 border-blue-500 rounded-full cursor-nesw-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'bl')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />
              {/* BR */}
              <div
                id="handle-br"
                className="absolute -bottom-1.5 -right-1.5 w-3.5 h-3.5 bg-slate-100 border-2 border-blue-500 rounded-full cursor-nwse-resize shadow-md"
                onPointerDown={(e) => handlePointerDown(e, 'br')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              />

              {/* Edge Handles to easily stretch */}
              {/* Top Side */}
              <div
                id="handle-t"
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-8 h-2 flex items-center justify-center cursor-ns-resize"
                onPointerDown={(e) => handlePointerDown(e, 't')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div className="w-5 h-1.5 bg-slate-100 border border-blue-500 rounded-xs shadow-sm"></div>
              </div>
              {/* Bottom Side */}
              <div
                id="handle-b"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1 w-8 h-2 flex items-center justify-center cursor-ns-resize"
                onPointerDown={(e) => handlePointerDown(e, 'b')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div className="w-5 h-1.5 bg-slate-100 border border-blue-500 rounded-xs shadow-sm"></div>
              </div>
              {/* Left Side */}
              <div
                id="handle-l"
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1 w-2 h-8 flex items-center justify-center cursor-ew-resize"
                onPointerDown={(e) => handlePointerDown(e, 'l')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div className="h-5 w-1.5 bg-slate-100 border border-blue-500 rounded-xs shadow-sm"></div>
              </div>
              {/* Right Side */}
              <div
                id="handle-r"
                className="absolute top-1/2 -translate-y-1/2 translate-x-1 w-2 h-8 flex items-center justify-center cursor-ew-resize"
                onPointerDown={(e) => handlePointerDown(e, 'r')}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <div className="h-5 w-1.5 bg-slate-100 border border-blue-500 rounded-xs shadow-sm"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Grid footer data sizing info */}
      <div className="bg-slate-950/40 border-t border-slate-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 text-blue-400 bg-blue-950/80 rounded-full animate-pulse"></span>
          <span>Source: {imageState.width} × {imageState.height} px</span>
        </div>
        <div>
          <span>Crop Box: {Math.round(crop.width * imageState.width)} × {Math.round(crop.height * imageState.height)} px</span>
        </div>
      </div>
    </div>
  );
}
