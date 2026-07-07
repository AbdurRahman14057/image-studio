import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  Plus, 
  Sparkles, 
  Download, 
  Move, 
  ZoomIn, 
  RotateCw, 
  ArrowLeftRight, 
  Grid, 
  Rows, 
  Columns, 
  Image as ImageIcon,
  Printer,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Palette
} from 'lucide-react';

interface CollageImage {
  id: string;
  src: string;
  name: string;
  width: number;
  height: number;
  sizeBytes: number;
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  caption?: string;
  captionColor?: string;
  captionSize?: number;
  captionBg?: boolean;
}

type CollageLayout = 
  | 'side-by-side' 
  | 'vertical-split' 
  | 'grid-4' 
  | 'triple-horizontal' 
  | 'triple-vertical' 
  | 'asymmetric-main' 
  | 'triple-stack-top'
  | 'vertical-combiner'
  | 'horizontal-combiner';

type AspectRatio = '1:1' | '4:3' | '16:9' | '9:16' | '2:3' | 'auto';

interface CollageWorkspaceProps {
  onBackToSingle: () => void;
}

const BG_COLOR_PRESETS = [
  { name: 'Sleek Black', value: '#090d16' },
  { name: 'Pure White', value: '#ffffff' },
  { name: 'Warm Cream', value: '#fcf8f2' },
  { name: 'Pastel Slate', value: '#1e293b' },
  { name: 'Royal Indigo', value: '#1e1b4b' },
  { name: 'Deep Crimson', value: '#450a0a' },
  { name: 'Sunset Orange', value: '#7c2d12' },
];

const GRADIENT_PRESETS = [
  { name: 'Midnight Blue', value: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' },
  { name: 'Sunset Glow', value: 'linear-gradient(135deg, #ea580c 0%, #701a75 100%)' },
  { name: 'Aurora Borealis', value: 'linear-gradient(135deg, #115e59 0%, #1e1b4b 100%)' },
  { name: 'Neon Nebula', value: 'linear-gradient(135deg, #581c87 0%, #0369a1 100%)' },
  { name: 'Sweet Lavender', value: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)' },
];

const SAMPLE_TEMPLATES = [
  {
    type: 'sunset',
    name: 'Sunset Glow',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ea580c"/><stop offset="100%" stop-color="%23701a75"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/></svg>',
  },
  {
    type: 'cosmic',
    name: 'Nebula Sky',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><radialGradient id="g" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="%23581c87"/><stop offset="100%" stop-color="%23090d16"/></radialGradient></defs><rect width="800" height="600" fill="url(%23g)"/></svg>',
  },
  {
    type: 'retro',
    name: 'Ocean Mint',
    src: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230d9488"/><stop offset="100%" stop-color="%231e293b"/></linearGradient></defs><rect width="800" height="600" fill="url(%23g)"/></svg>',
  }
];

export default function CollageWorkspace({ onBackToSingle }: CollageWorkspaceProps) {
  const [images, setImages] = useState<CollageImage[]>([]);
  const [selectedSlotIdx, setSelectedSlotIdx] = useState<number | null>(null);
  
  // Design Properties
  const [layout, setLayout] = useState<CollageLayout>('side-by-side');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [gap, setGap] = useState<number>(10);
  const [outerMargin, setOuterMargin] = useState<number>(12);
  const [borderRadius, setBorderRadius] = useState<number>(8);
  const [bgType, setBgType] = useState<'color' | 'gradient'>('color');
  const [bgColor, setBgColor] = useState<string>('#090d16');
  const [bgGradient, setBgGradient] = useState<string>(GRADIENT_PRESETS[0].value);
  
  // Export Settings
  const [exportFormat, setExportFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/jpeg');
  const [exportQuality, setExportQuality] = useState<number>(0.9);
  const [exportName, setExportName] = useState<string>('collage_maker_export');
  const [isCompiling, setIsCompiling] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const appendFileInputRef = useRef<HTMLInputElement>(null);

  // Auto-set layout based on number of loaded images to helper templates
  useEffect(() => {
    if (images.length === 2 && (layout === 'grid-4' || layout === 'asymmetric-main')) {
      setLayout('side-by-side');
    } else if (images.length === 3 && layout === 'side-by-side') {
      setLayout('triple-horizontal');
    } else if (images.length === 4 && (layout === 'side-by-side' || layout === 'triple-horizontal')) {
      setLayout('grid-4');
    }
  }, [images.length]);

  // Load a batch of files
  const handleFilesLoaded = (files: FileList) => {
    const loadedImages: CollageImage[] = [];
    let processedCount = 0;

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUri = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          loadedImages.push({
            id: Math.random().toString(36).substr(2, 9),
            src: dataUri,
            name: file.name,
            width: img.naturalWidth,
            height: img.naturalHeight,
            sizeBytes: file.size,
            zoom: 1.0,
            panX: 0,
            panY: 0,
            rotation: 0,
            flipH: false,
            flipV: false
          });

          processedCount++;
          if (processedCount === files.length || processedCount + images.length >= 6) {
            setImages((prev) => [...prev, ...loadedImages].slice(0, 6));
            if (selectedSlotIdx === null) {
              setSelectedSlotIdx(0);
            }
          }
        };
        img.src = dataUri;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFilesLoaded(files);
    }
  };

  const handleAddSample = (template: typeof SAMPLE_TEMPLATES[0]) => {
    const img = new Image();
    img.onload = () => {
      setImages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          src: template.src,
          name: `${template.name}.png`,
          width: 800,
          height: 600,
          sizeBytes: 15000,
          zoom: 1.0,
          panX: 0,
          panY: 0,
          rotation: 0,
          flipH: false,
          flipV: false
        }
      ].slice(0, 6));
      if (selectedSlotIdx === null) {
        setSelectedSlotIdx(0);
      }
    };
    img.src = template.src;
  };

  const clearAllImages = () => {
    setImages([]);
    setSelectedSlotIdx(null);
  };

  // Move image forward/backward in layers
  const moveImage = (index: number, direction: 'prev' | 'next') => {
    if (direction === 'prev' && index === 0) return;
    if (direction === 'next' && index === images.length - 1) return;

    const targetIdx = direction === 'prev' ? index - 1 : index + 1;
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[targetIdx];
    reordered[targetIdx] = temp;

    setImages(reordered);
    setSelectedSlotIdx(targetIdx);
  };

  const deleteImage = (index: number) => {
    const updated = images.filter((_, idx) => idx !== index);
    setImages(updated);
    if (selectedSlotIdx === index) {
      setSelectedSlotIdx(updated.length > 0 ? 0 : null);
    } else if (selectedSlotIdx !== null && selectedSlotIdx > index) {
      setSelectedSlotIdx(selectedSlotIdx - 1);
    }
  };

  const updateSelectedSlot = (key: keyof CollageImage, value: any) => {
    if (selectedSlotIdx === null || !images[selectedSlotIdx]) return;
    setImages((prev) => {
      const copy = [...prev];
      copy[selectedSlotIdx] = {
        ...copy[selectedSlotIdx],
        [key]: value
      };
      return copy;
    });
  };

  const rotateSelectedSlot = () => {
    if (selectedSlotIdx === null || !images[selectedSlotIdx]) return;
    const currentRot = images[selectedSlotIdx].rotation;
    const nextRot = ((currentRot + 90) % 360) as any;
    updateSelectedSlot('rotation', nextRot);
  };

  const toggleFlipH = () => {
    if (selectedSlotIdx === null || !images[selectedSlotIdx]) return;
    updateSelectedSlot('flipH', !images[selectedSlotIdx].flipH);
  };

  const toggleFlipV = () => {
    if (selectedSlotIdx === null || !images[selectedSlotIdx]) return;
    updateSelectedSlot('flipV', !images[selectedSlotIdx].flipV);
  };

  // Helper function to return aspect CSS class
  const getAspectRatioStyle = () => {
    if (layout === 'vertical-combiner' || layout === 'horizontal-combiner') {
      return { aspectRatio: 'auto', minHeight: '400px' };
    }
    switch (aspectRatio) {
      case '1:1': return { aspectRatio: '1/1' };
      case '4:3': return { aspectRatio: '4/3' };
      case '16:9': return { aspectRatio: '16/9' };
      case '9:16': return { aspectRatio: '9/16' };
      case '2:3': return { aspectRatio: '2/3' };
      case 'auto':
      default:
        return { aspectRatio: '1/1' };
    }
  };

  // Return list of slots coordinates/sizes for rendering and building canvas
  const computeGridSlots = (canvasW: number, canvasH: number, totalSlots: number) => {
    const slots: { x: number; y: number; w: number; h: number }[] = [];
    const innerW = canvasW - outerMargin * 2;
    const innerH = canvasH - outerMargin * 2;
    const mX = outerMargin;
    const mY = outerMargin;

    if (layout === 'side-by-side') {
      const count = Math.min(totalSlots, 2);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else {
        const slotW = (innerW - gap) / 2;
        slots.push({ x: mX, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW, h: innerH });
      }
    } else if (layout === 'vertical-split') {
      const count = Math.min(totalSlots, 2);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else {
        const slotH = (innerH - gap) / 2;
        slots.push({ x: mX, y: mY, w: innerW, h: slotH });
        slots.push({ x: mX, y: mY + slotH + gap, w: innerW, h: slotH });
      }
    } else if (layout === 'grid-4') {
      const count = Math.min(totalSlots, 4);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else if (count === 2) {
        const slotW = (innerW - gap) / 2;
        slots.push({ x: mX, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW, h: innerH });
      } else if (count === 3) {
        const slotW = (innerW - gap) / 2;
        const slotH = (innerH - gap) / 2;
        slots.push({ x: mX, y: mY, w: slotW, h: slotH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW, h: slotH });
        slots.push({ x: mX, y: mY + slotH + gap, w: innerW, h: slotH });
      } else {
        const slotW = (innerW - gap) / 2;
        const slotH = (innerH - gap) / 2;
        slots.push({ x: mX, y: mY, w: slotW, h: slotH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW, h: slotH });
        slots.push({ x: mX, y: mY + slotH + gap, w: slotW, h: slotH });
        slots.push({ x: mX + slotW + gap, y: mY + slotH + gap, w: slotW, h: slotH });
      }
    } else if (layout === 'triple-horizontal') {
      const count = Math.min(totalSlots, 3);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else if (count === 2) {
        const slotW = (innerW - gap) / 2;
        slots.push({ x: mX, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW, h: innerH });
      } else {
        const slotW = (innerW - gap * 2) / 3;
        slots.push({ x: mX, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + (slotW + gap) * 2, y: mY, w: slotW, h: innerH });
      }
    } else if (layout === 'triple-vertical') {
      const count = Math.min(totalSlots, 3);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else if (count === 2) {
        const slotH = (innerH - gap) / 2;
        slots.push({ x: mX, y: mY, w: innerW, h: slotH });
        slots.push({ x: mX, y: mY + slotH + gap, w: innerW, h: slotH });
      } else {
        const slotH = (innerH - gap * 2) / 3;
        slots.push({ x: mX, y: mY, w: innerW, h: slotH });
        slots.push({ x: mX, y: mY + slotH + gap, w: innerW, h: slotH });
        slots.push({ x: mX, y: mY + (slotH + gap) * 2, w: innerW, h: slotH });
      }
    } else if (layout === 'asymmetric-main') {
      const count = Math.min(totalSlots, 3);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else if (count === 2) {
        const slotW = (innerW - gap) * 0.6;
        const slotW2 = (innerW - gap) * 0.4;
        slots.push({ x: mX, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW2, h: innerH });
      } else {
        const slotW = (innerW - gap) * 0.6;
        const slotW2 = (innerW - gap) * 0.4;
        const slotH2 = (innerH - gap) / 2;
        slots.push({ x: mX, y: mY, w: slotW, h: innerH });
        slots.push({ x: mX + slotW + gap, y: mY, w: slotW2, h: slotH2 });
        slots.push({ x: mX + slotW + gap, y: mY + slotH2 + gap, w: slotW2, h: slotH2 });
      }
    } else if (layout === 'triple-stack-top') {
      const count = Math.min(totalSlots, 3);
      if (count <= 1) {
        slots.push({ x: mX, y: mY, w: innerW, h: innerH });
      } else if (count === 2) {
        const slotH = (innerH - gap) / 2;
        slots.push({ x: mX, y: mY, w: innerW, h: slotH });
        slots.push({ x: mX, y: mY + slotH + gap, w: innerW, h: slotH });
      } else {
        const slotH1 = (innerH - gap) * 0.5;
        const slotH2 = (innerH - gap) * 0.5;
        const slotW2 = (innerW - gap) / 2;
        slots.push({ x: mX, y: mY, w: innerW, h: slotH1 });
        slots.push({ x: mX, y: mY + slotH1 + gap, w: slotW2, h: slotH2 });
        slots.push({ x: mX + slotW2 + gap, y: mY + slotH1 + gap, w: slotW2, h: slotH2 });
      }
    }

    return slots;
  };

  // Compile final canvas output on click Download
  const handleDownloadCollage = async (doDownload = true) => {
    if (images.length === 0) return;
    setIsCompiling(true);

    try {
      // Define a high-fidelity rendering scale base (e.g., width 1400px)
      const baseExportWidth = 1400;
      let canvasW = baseExportWidth;
      let canvasH = baseExportWidth;

      // Determine heights based on aspect ratio
      if (layout === 'vertical-combiner') {
        // Vertical combiner: images are loaded sequentially top-to-bottom.
        // We auto-resize each image so its width fits baseExportWidth.
        // Height is calculated dynamically based on scaled sizes of each loaded image.
        const totalGap = gap * (images.length - 1) + outerMargin * 2;
        let cumulativeHeight = totalGap;

        // Create virtual images to compute native scale math
        const imgPromises = images.map((item) => {
          return new Promise<{ img: HTMLImageElement; scaleH: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const usableWidth = baseExportWidth - outerMargin * 2;
              const isRotated = item.rotation === 90 || item.rotation === 270;
              const nativeW = isRotated ? img.naturalHeight : img.naturalWidth;
              const nativeH = isRotated ? img.naturalWidth : img.naturalHeight;
              
              const scaleFactor = usableWidth / nativeW;
              const finalH = nativeH * scaleFactor;
              resolve({ img, scaleH: finalH });
            };
            img.src = item.src;
          });
        });

        const loadedMeta = await Promise.all(imgPromises);
        loadedMeta.forEach((meta) => {
          cumulativeHeight += meta.scaleH;
        });

        canvasH = Math.round(cumulativeHeight);
      } else if (layout === 'horizontal-combiner') {
        // Horizontal combiner: images loaded side-by-side. Height is locked, width scales.
        const baseExportHeight = 1000;
        canvasH = baseExportHeight;
        const totalGap = gap * (images.length - 1) + outerMargin * 2;
        let cumulativeWidth = totalGap;

        const imgPromises = images.map((item) => {
          return new Promise<{ img: HTMLImageElement; scaleW: number }>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const usableHeight = baseExportHeight - outerMargin * 2;
              const isRotated = item.rotation === 90 || item.rotation === 270;
              const nativeW = isRotated ? img.naturalHeight : img.naturalWidth;
              const nativeH = isRotated ? img.naturalWidth : img.naturalHeight;

              const scaleFactor = usableHeight / nativeH;
              const finalW = nativeW * scaleFactor;
              resolve({ img, scaleW: finalW });
            };
            img.src = item.src;
          });
        });

        const loadedMeta = await Promise.all(imgPromises);
        loadedMeta.forEach((meta) => {
          cumulativeWidth += meta.scaleW;
        });

        canvasW = Math.round(cumulativeWidth);
      } else {
        // Preset Layout aspect ratios
        switch (aspectRatio) {
          case '1:1': canvasH = baseExportWidth; break;
          case '4:3': canvasH = Math.round(baseExportWidth / (4/3)); break;
          case '16:9': canvasH = Math.round(baseExportWidth / (16/9)); break;
          case '9:16': canvasH = Math.round(baseExportWidth / (9/16)); break;
          case '2:3': canvasH = Math.round(baseExportWidth / (2/3)); break;
          case 'auto':
          default:
            canvasH = baseExportWidth;
            break;
        }
      }

      // Prepare Canvas element
      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not instantiate canvas 2D contexts.');

      // Draw background fill
      if (bgType === 'color') {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvasW, canvasH);
      } else {
        // Simple linear gradient top-left to bottom-right
        const grad = ctx.createLinearGradient(0, 0, canvasW, canvasH);
        if (bgGradient.includes('#ea580c')) {
          grad.addColorStop(0, '#ea580c');
          grad.addColorStop(1, '#701a75');
        } else if (bgGradient.includes('#115e59')) {
          grad.addColorStop(0, '#115e59');
          grad.addColorStop(1, '#1e1b4b');
        } else if (bgGradient.includes('#581c87')) {
          grad.addColorStop(0, '#581c87');
          grad.addColorStop(1, '#0369a1');
        } else if (bgGradient.includes('#1e1b4b') && bgGradient.includes('#4c1d95')) {
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(1, '#4c1d95');
        } else {
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(1, '#1e1b4b');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvasW, canvasH);
      }

      // Perform rendering of sequential or grid slots
      if (layout === 'vertical-combiner') {
        // Draw Vertical stacks sequentially
        let currentY = outerMargin;
        const usableWidth = canvasW - outerMargin * 2;

        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          const img = await new Promise<HTMLImageElement>((resolve) => {
            const imgEl = new Image();
            imgEl.onload = () => resolve(imgEl);
            imgEl.src = item.src;
          });

          const isRotated = item.rotation === 90 || item.rotation === 270;
          const nativeW = isRotated ? img.naturalHeight : img.naturalWidth;
          const nativeH = isRotated ? img.naturalWidth : img.naturalHeight;

          const scaleFactor = usableWidth / nativeW;
          const drawW = usableWidth;
          const drawH = nativeH * scaleFactor;

          ctx.save();
          // Clip path for this segment slot
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(outerMargin, currentY, drawW, drawH, borderRadius);
            ctx.clip();
          } else {
            ctx.beginPath();
            ctx.rect(outerMargin, currentY, drawW, drawH);
            ctx.clip();
          }

          // Nested save to apply local image transform offsets
          ctx.save();
          const centerSlotX = outerMargin + drawW / 2 + (item.panX / 100) * drawW;
          const centerSlotY = currentY + drawH / 2 + (item.panY / 100) * drawH;
          const targetDrawW = drawW * item.zoom;
          const targetDrawH = drawH * item.zoom;

          ctx.translate(centerSlotX, centerSlotY);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);
          
          if (isRotated) {
            ctx.drawImage(img, -targetDrawH / 2, -targetDrawW / 2, targetDrawH, targetDrawW);
          } else {
            ctx.drawImage(img, -targetDrawW / 2, -targetDrawH / 2, targetDrawW, targetDrawH);
          }
          ctx.restore(); // restore to slot un-transformed coordinate space

          // Draw Caption text overlay
          if (item.caption) {
            const pad = Math.round(15 * (drawW / 400));
            const fontSize = Math.round((item.captionSize || 14) * (drawW / 400));
            ctx.font = `bold ${fontSize}px sans-serif`;
            
            const textWidth = ctx.measureText(item.caption).width;
            const rectW = textWidth + Math.round(16 * (drawW / 400));
            const rectH = fontSize + Math.round(10 * (drawW / 400));
            const rectX = outerMargin + pad;
            const rectY = currentY + drawH - pad - rectH;

            if (item.captionBg !== false) {
              ctx.fillStyle = 'rgba(0,0,0,0.65)';
              ctx.beginPath();
              ctx.roundRect(rectX, rectY, rectW, rectH, Math.round(4 * (drawW / 400)));
              ctx.fill();
            }

            ctx.fillStyle = item.captionColor || '#ffffff';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.caption, rectX + Math.round(8 * (drawW / 400)), rectY + rectH / 2);
          }

          ctx.restore(); // restore slot level clipping
          currentY += drawH + gap;
        }

      } else if (layout === 'horizontal-combiner') {
        // Draw Horizontal stack sequentially
        let currentX = outerMargin;
        const usableHeight = canvasH - outerMargin * 2;

        for (let i = 0; i < images.length; i++) {
          const item = images[i];
          const img = await new Promise<HTMLImageElement>((resolve) => {
            const imgEl = new Image();
            imgEl.onload = () => resolve(imgEl);
            imgEl.src = item.src;
          });

          const isRotated = item.rotation === 90 || item.rotation === 270;
          const nativeW = isRotated ? img.naturalHeight : img.naturalWidth;
          const nativeH = isRotated ? img.naturalWidth : img.naturalHeight;

          const scaleFactor = usableHeight / nativeH;
          const drawW = nativeW * scaleFactor;
          const drawH = usableHeight;

          ctx.save();
          // Clip path for rounded corners
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(currentX, outerMargin, drawW, drawH, borderRadius);
            ctx.clip();
          } else {
            ctx.beginPath();
            ctx.rect(currentX, outerMargin, drawW, drawH);
            ctx.clip();
          }

          ctx.save();
          const centerSlotX = currentX + drawW / 2 + (item.panX / 100) * drawW;
          const centerSlotY = outerMargin + drawH / 2 + (item.panY / 100) * drawH;
          const targetDrawW = drawW * item.zoom;
          const targetDrawH = drawH * item.zoom;

          ctx.translate(centerSlotX, centerSlotY);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

          if (isRotated) {
            ctx.drawImage(img, -targetDrawH / 2, -targetDrawW / 2, targetDrawH, targetDrawW);
          } else {
            ctx.drawImage(img, -targetDrawW / 2, -targetDrawH / 2, targetDrawW, targetDrawH);
          }
          ctx.restore();

          // Draw Caption text overlay
          if (item.caption) {
            const pad = Math.round(15 * (drawH / 400));
            const fontSize = Math.round((item.captionSize || 14) * (drawH / 400));
            ctx.font = `bold ${fontSize}px sans-serif`;
            
            const textWidth = ctx.measureText(item.caption).width;
            const rectW = textWidth + Math.round(16 * (drawH / 400));
            const rectH = fontSize + Math.round(10 * (drawH / 400));
            const rectX = currentX + pad;
            const rectY = outerMargin + drawH - pad - rectH;

            if (item.captionBg !== false) {
              ctx.fillStyle = 'rgba(0,0,0,0.65)';
              ctx.beginPath();
              ctx.roundRect(rectX, rectY, rectW, rectH, Math.round(4 * (drawH / 400)));
              ctx.fill();
            }

            ctx.fillStyle = item.captionColor || '#ffffff';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.caption, rectX + Math.round(8 * (drawH / 400)), rectY + rectH / 2);
          }

          ctx.restore();
          currentX += drawW + gap;
        }

      } else {
        // Grid layouts
        const slots = computeGridSlots(canvasW, canvasH, images.length);

        for (let idx = 0; idx < slots.length; idx++) {
          const item = images[idx];
          if (!item) continue;

          const img = await new Promise<HTMLImageElement>((resolve) => {
            const imgEl = new Image();
            imgEl.onload = () => resolve(imgEl);
            imgEl.src = item.src;
          });

          const slot = slots[idx];
          ctx.save();

          // Create Clip Path for the cell
          if (borderRadius > 0) {
            ctx.beginPath();
            ctx.roundRect(slot.x, slot.y, slot.w, slot.h, borderRadius);
            ctx.clip();
          } else {
            ctx.beginPath();
            ctx.rect(slot.x, slot.y, slot.w, slot.h);
            ctx.clip();
          }

          ctx.save();
          // Compute scale-to-cover metrics inside the target slot boundaries
          const isRotated = item.rotation === 90 || item.rotation === 270;
          const nativeW = isRotated ? img.naturalHeight : img.naturalWidth;
          const nativeH = isRotated ? img.naturalWidth : img.naturalHeight;

          const scaleToCover = Math.max(slot.w / nativeW, slot.h / nativeH);
          const baseDrawW = nativeW * scaleToCover;
          const baseDrawH = nativeH * scaleToCover;

          const targetDrawW = baseDrawW * item.zoom;
          const targetDrawH = baseDrawH * item.zoom;

          // Pan translation offsets
          const pxOffset = (item.panX / 100) * slot.w;
          const pyOffset = (item.panY / 100) * slot.h;

          const centerSlotX = slot.x + slot.w / 2 + pxOffset;
          const centerSlotY = slot.y + slot.h / 2 + pyOffset;

          ctx.translate(centerSlotX, centerSlotY);
          ctx.rotate((item.rotation * Math.PI) / 180);
          ctx.scale(item.flipH ? -1 : 1, item.flipV ? -1 : 1);

          if (isRotated) {
            ctx.drawImage(img, -targetDrawH / 2, -targetDrawW / 2, targetDrawH, targetDrawW);
          } else {
            ctx.drawImage(img, -targetDrawW / 2, -targetDrawH / 2, targetDrawW, targetDrawH);
          }
          ctx.restore();

          // Draw Caption text overlay
          if (item.caption) {
            const pad = Math.round(15 * (slot.h / 400));
            const fontSize = Math.round((item.captionSize || 14) * (slot.h / 400));
            ctx.font = `bold ${fontSize}px sans-serif`;
            
            const textWidth = ctx.measureText(item.caption).width;
            const rectW = textWidth + Math.round(16 * (slot.h / 400));
            const rectH = fontSize + Math.round(10 * (slot.h / 400));
            const rectX = slot.x + pad;
            const rectY = slot.y + slot.h - pad - rectH;

            if (item.captionBg !== false) {
              ctx.fillStyle = 'rgba(0,0,0,0.65)';
              ctx.beginPath();
              ctx.roundRect(rectX, rectY, rectW, rectH, Math.round(4 * (slot.h / 400)));
              ctx.fill();
            }

            ctx.fillStyle = item.captionColor || '#ffffff';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.caption, rectX + Math.round(8 * (slot.h / 400)), rectY + rectH / 2);
          }

          ctx.restore();
        }
      }

      // Create data URI from canvas
      const dataUri = canvas.toDataURL(exportFormat, exportQuality);
      if (doDownload) {
        const link = document.createElement('a');
        link.href = dataUri;
        const fileExt = exportFormat === 'image/png' ? 'png' : exportFormat === 'image/webp' ? 'webp' : 'jpg';
        link.download = `${exportName}.${fileExt}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        return dataUri;
      }

    } catch (err) {
      console.error('Collage assembly compiling error:', err);
      alert('Could not render collage. Please remove some heavy images or select a lower format quality and retry.');
    } finally {
      setIsCompiling(false);
    }
  };

    // Print compiled collage (opens preview then prints)
    const handlePrintCollage = async () => {
      if (images.length === 0) return;
      try {
        setIsCompiling(true);
        const dataUri = await handleDownloadCollage(false);
        if (dataUri) {
          const w = window.open('about:blank');
          if (w) {
            w.document.write(`<html><head><title>Print Collage</title></head><body style="margin:0"><img src="${dataUri}" style="max-width:100%;height:auto;display:block;margin:0 auto"/></body></html>`);
            w.document.close();
            w.onload = () => { setTimeout(() => { w.print(); }, 100); };
          } else {
            alert('Unable to open print preview window.');
          }
        }
      } catch (e) {
        console.error('Print collage failed', e);
        alert('Could not prepare print preview.');
      } finally {
        setIsCompiling(false);
      }
    };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60 bg-slate-950/80 backdrop-blur-md rounded-b-xl overflow-hidden border-x border-b border-slate-800/40 shadow-2xl">
      
      {/* Left Sidebar Control Customizer (Scrollable) */}
      <div className="w-full lg:w-96 bg-slate-900/55 shrink-0 flex flex-col h-auto lg:h-[calc(100vh-4rem)] overflow-y-auto backdrop-blur-md">
        
        {/* Header back tracker button */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <button
            onClick={onBackToSingle}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-all font-semibold"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Single Studio</span>
          </button>
          <span className="text-[10px] bg-blue-950/50 border border-blue-900/60 text-blue-400 font-bold uppercase font-mono px-2 py-0.5 rounded-md">
            Collage Workspace
          </span>
        </div>

        {/* Customizer Submodules */}
        <div className="p-5 space-y-6">
          
          {/* Section 1: Images List */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-400" />
                Uploaded Canvas Media ({images.length}/6)
              </span>
              {images.length > 0 && (
                <button
                  onClick={clearAllImages}
                  className="text-[10px] font-bold text-red-400 hover:text-red-300 transition-all font-sans"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* Micro thumbnail grid list */}
            {images.length === 0 ? (
              <div 
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => appendFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 hover:bg-slate-905/30 rounded-xl p-6 text-center cursor-pointer transition-all space-y-2 bg-slate-950/40"
              >
                <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
                  <Plus className="w-4 h-4" />
                </div>
                <div className="text-[11px] text-slate-400 font-medium">
                  Click to choose or Drag files here
                </div>
                <div className="text-[9px] text-slate-500 font-mono">
                  Up to 6 images (PNG, JPG, WebP)
                </div>
              </div>
            ) : (
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    onClick={() => setSelectedSlotIdx(idx)}
                    className={`flex items-center gap-2.5 p-2 rounded-lg border transition-all cursor-pointer ${
                      selectedSlotIdx === idx 
                        ? 'bg-blue-950/30 border-blue-900/60 ring-1 ring-blue-500/20' 
                        : 'bg-slate-950/40 border-slate-800 hover:bg-slate-850'
                    }`}
                  >
                    {/* Thumbnail box */}
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-black shrink-0 relative border border-slate-800">
                      <img src={img.src} className="w-full h-full object-cover" alt="Thumb" />
                      <div className="absolute bottom-0 right-0 bg-slate-900/90 text-[8px] px-1 font-mono text-slate-400 rounded-tl">
                        Slot {idx + 1}
                      </div>
                    </div>

                    {/* Metadata detail */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                        {img.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-mono mt-0.5">
                        {img.width}x{img.height} px
                      </p>
                    </div>

                    {/* Move layers triggers */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="Move layer backward"
                        disabled={idx === 0}
                        onClick={(e) => { e.stopPropagation(); moveImage(idx, 'prev'); }}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Move layer forward"
                        disabled={idx === images.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveImage(idx, 'next'); }}
                        className="p-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:pointer-events-none"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        title="Delete source image"
                        onClick={(e) => { e.stopPropagation(); deleteImage(idx); }}
                        className="p-1 rounded bg-slate-900 hover:bg-red-950/40 text-slate-500 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < 6 && (
                  <button
                    onClick={() => appendFileInputRef.current?.click()}
                    className="w-full py-2 bg-slate-950/50 hover:bg-slate-850 border border-dashed border-slate-800 hover:border-slate-700 text-xs font-bold text-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-all mt-1"
                  >
                    <Plus className="w-4 h-4 text-blue-400" />
                    <span>Append image ({images.length}/6)</span>
                  </button>
                )}
              </div>
            )}

            {/* Hidden Input handlers */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => e.target.files && handleFilesLoaded(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />
            <input
              type="file"
              ref={appendFileInputRef}
              onChange={(e) => e.target.files && handleFilesLoaded(e.target.files)}
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>

          {/* Section 2: Preset Layout Picker */}
          {images.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Grid className="w-4 h-4 text-blue-400" />
                Select Assembly Layout
              </span>

              {/* Combiners vs standard collage picker categories */}
              <div className="grid grid-cols-3 gap-1.5">
                {/* Side-by-Side (2 slots) */}
                <button
                  onClick={() => setLayout('side-by-side')}
                  disabled={images.length < 2}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 disabled:opacity-35 ${
                    layout === 'side-by-side' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <Columns className="w-4 h-4" />
                  <span className="text-[10px]">Columns 1:1</span>
                </button>

                {/* Vertical split (2 slots) */}
                <button
                  onClick={() => setLayout('vertical-split')}
                  disabled={images.length < 2}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 disabled:opacity-35 ${
                    layout === 'vertical-split' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <Rows className="w-4 h-4" />
                  <span className="text-[10px]">Rows 1:1</span>
                </button>

                {/* Grid 4 (up to 4 slots) */}
                <button
                  onClick={() => setLayout('grid-4')}
                  disabled={images.length < 2}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 disabled:opacity-35 ${
                    layout === 'grid-4' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <div className="grid grid-cols-2 gap-0.5 w-4 h-4 border border-current p-0.5">
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                    <div className="bg-current rounded-[1px]"></div>
                  </div>
                  <span className="text-[10px]">2x2 Grid</span>
                </button>

                {/* Triple Vertical Strips */}
                <button
                  onClick={() => setLayout('triple-horizontal')}
                  disabled={images.length < 3}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 disabled:opacity-35 ${
                    layout === 'triple-horizontal' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex gap-0.5 w-4 h-4 border border-current p-0.5">
                    <div className="bg-current w-1/3 h-full"></div>
                    <div className="bg-current w-1/3 h-full"></div>
                    <div className="bg-current w-1/3 h-full"></div>
                  </div>
                  <span className="text-[10px]">Triple Col</span>
                </button>

                {/* Asymmetric Left Main */}
                <button
                  onClick={() => setLayout('asymmetric-main')}
                  disabled={images.length < 3}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 disabled:opacity-35 ${
                    layout === 'asymmetric-main' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex gap-0.5 w-4 h-4 border border-current p-0.5">
                    <div className="bg-current w-2/3 h-full"></div>
                    <div className="flex flex-col gap-0.5 w-1/3 h-full">
                      <div className="bg-current h-1/2"></div>
                      <div className="bg-current h-1/2"></div>
                    </div>
                  </div>
                  <span className="text-[10px]">Cinematic Layout</span>
                </button>

                {/* Triple Stack Top Main */}
                <button
                  onClick={() => setLayout('triple-stack-top')}
                  disabled={images.length < 3}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 disabled:opacity-35 ${
                    layout === 'triple-stack-top' 
                      ? 'bg-blue-600 border-blue-500 text-white font-bold' 
                      : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 w-4 h-4 border border-current p-0.5">
                    <div className="bg-current h-1/2"></div>
                    <div className="flex gap-0.5 h-1/2">
                      <div className="bg-current w-1/2"></div>
                      <div className="bg-current w-1/2"></div>
                    </div>
                  </div>
                  <span className="text-[10px]">T-Stack 1-2</span>
                </button>

                {/* IMAGE COMBINER - Vertical sequential chain */}
                <button
                  onClick={() => setLayout('vertical-combiner')}
                  disabled={images.length < 2}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    layout === 'vertical-combiner' 
                      ? 'bg-teal-600 border-teal-500 text-white font-bold shadow-md' 
                      : 'bg-slate-950/50 border-slate-800 text-teal-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col gap-0.5 w-4 h-4 border border-current p-0.5 items-center">
                    <div className="bg-current w-3/4 h-[2px]"></div>
                    <div className="bg-current w-3/4 h-[2px]"></div>
                    <div className="bg-current w-3/4 h-[2px]"></div>
                  </div>
                  <span className="text-[10px]">Combine Vertical</span>
                </button>

                {/* IMAGE COMBINER - Horizontal sequential chain */}
                <button
                  onClick={() => setLayout('horizontal-combiner')}
                  disabled={images.length < 2}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    layout === 'horizontal-combiner' 
                      ? 'bg-teal-600 border-teal-500 text-white font-bold shadow-md' 
                      : 'bg-slate-950/50 border-slate-800 text-teal-400 hover:border-slate-750 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex gap-0.5 w-4 h-4 border border-current p-0.5 items-center">
                    <div className="bg-current w-[2px] h-3/4"></div>
                    <div className="bg-current w-[2px] h-3/4"></div>
                    <div className="bg-current w-[2px] h-3/4"></div>
                  </div>
                  <span className="text-[10px]">Combine Horiz</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 3: Aspect Ratio Picker (Hidden if using dynamically compiled stack combiners) */}
          {images.length > 0 && layout !== 'vertical-combiner' && layout !== 'horizontal-combiner' && (
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Canvas Dimension Preset
              </span>
              <div className="grid grid-cols-5 gap-1.5 text-center text-xs font-semibold">
                {(['1:1', '4:3', '16:9', '9:16', '2:3'] as AspectRatio[]).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 rounded-lg transition-all border ${
                      aspectRatio === ratio
                        ? 'bg-blue-600 border-blue-500 text-white font-bold'
                        : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Outer borders & corners spacers */}
          {images.length > 0 && (
            <div className="space-y-4 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                Collage Border styling
              </span>

              {/* Gaps spacer */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Image Grid Gap</span>
                  <span className="text-blue-400 font-bold">{gap}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  value={gap}
                  onChange={(e) => setGap(Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Outer boundary padding */}
              {layout !== 'vertical-combiner' && layout !== 'horizontal-combiner' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Outer Border Padding</span>
                    <span className="text-blue-400 font-bold">{outerMargin}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    value={outerMargin}
                    onChange={(e) => setOuterMargin(Number(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}

              {/* Corner Roundness slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Corner Rounded radius</span>
                  <span className="text-blue-400 font-bold">{borderRadius}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={borderRadius}
                  onChange={(e) => setBorderRadius(Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Color style tabs */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => setBgType('color')}
                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-all ${
                      bgType === 'color' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Solid Color
                  </button>
                  <button
                    onClick={() => setBgType('gradient')}
                    className={`text-[10px] uppercase font-bold px-2 py-1 rounded transition-all ${
                      bgType === 'gradient' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Soft Gradient
                  </button>
                </div>

                {bgType === 'color' ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex flex-wrap gap-1.5">
                      {BG_COLOR_PRESETS.map((p) => (
                        <button
                          key={p.value}
                          onClick={() => setBgColor(p.value)}
                          style={{ backgroundColor: p.value }}
                          className={`w-5 h-5 rounded-full border border-slate-700 hover:scale-110 active:scale-95 transition-transform shrink-0 relative flex items-center justify-center`}
                          title={p.name}
                        >
                          {bgColor === p.value && (
                            <Check className="w-3 h-3 text-slate-400 drop-shadow-md mix-blend-difference" />
                          )}
                        </button>
                      ))}
                      <div className="flex items-center gap-1 shrink-0 ml-auto">
                        <input
                          type="color"
                          value={bgColor}
                          onChange={(e) => setBgColor(e.target.value)}
                          className="w-5 h-5 rounded bg-transparent border-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-500 uppercase">{bgColor}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {GRADIENT_PRESETS.map((p) => (
                      <button
                        key={p.value}
                        onClick={() => setBgGradient(p.value)}
                        style={{ background: p.value }}
                        className={`h-6 rounded-lg border border-slate-700 relative hover:scale-[1.03] transition-all flex items-center justify-center`}
                        title={p.name}
                      >
                        {bgGradient === p.value && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white shadow-sm flex items-center justify-center">
                            <Check className="w-2 h-2 text-blue-600" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Section 5: Fine tuning offset zoom controls for individual image */}
          {images.length > 0 && selectedSlotIdx !== null && images[selectedSlotIdx] && (
            <div className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-blue-400" />
                  Align Slot {selectedSlotIdx + 1}
                </span>
                <span className="text-[9px] text-slate-500 truncate max-w-[120px]">
                  {images[selectedSlotIdx].name}
                </span>
              </div>

              {/* Zoom setting slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400 flex items-center gap-1"><ZoomIn className="w-3 h-3 text-slate-500" /> Slot Zoom</span>
                  <span className="text-blue-400 font-bold">{Math.round(images[selectedSlotIdx].zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.0"
                  step="0.05"
                  value={images[selectedSlotIdx].zoom}
                  onChange={(e) => updateSelectedSlot('zoom', Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Offset pan position X */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Horizontal Shift</span>
                  <span className="text-blue-400 font-bold">{images[selectedSlotIdx].panX}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={images[selectedSlotIdx].panX}
                  onChange={(e) => updateSelectedSlot('panX', Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Offset pan position Y */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Vertical Shift</span>
                  <span className="text-blue-400 font-bold">{images[selectedSlotIdx].panY}%</span>
                </div>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  value={images[selectedSlotIdx].panY}
                  onChange={(e) => updateSelectedSlot('panY', Number(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Rotation/Flip micro-adjust buttons */}
              <div className="flex gap-2 pt-1">
                {/* RotCw */}
                <button
                  onClick={rotateSelectedSlot}
                  className="flex-1 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all border border-slate-800"
                  title="Rotate Slot 90 Degrees"
                >
                  <RotateCw className="w-3 h-3 text-blue-400" />
                  <span>Rot 90°</span>
                </button>

                {/* Flip H */}
                <button
                  onClick={toggleFlipH}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                    images[selectedSlotIdx].flipH 
                      ? 'bg-blue-950/50 border-blue-900/60 text-blue-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Flip Horizontally"
                >
                  <ArrowLeftRight className="w-3 h-3" />
                  <span>Flip H</span>
                </button>

                {/* Flip V */}
                <button
                  onClick={toggleFlipV}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-all border ${
                    images[selectedSlotIdx].flipV 
                      ? 'bg-blue-950/50 border-blue-900/60 text-blue-400' 
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  title="Flip Vertically"
                >
                  <span className="inline-block transform rotate-90"><ArrowLeftRight className="w-3 h-3" /></span>
                  <span>Flip V</span>
                </button>
              </div>

              {/* Text Label Overlay input */}
              <div className="space-y-2 border-t border-slate-800 pt-3 mt-1">
                <span className="text-[11px] font-mono text-slate-400 block font-semibold uppercase tracking-wider">
                  Text Caption Overlay
                </span>
                <input
                  type="text"
                  value={images[selectedSlotIdx].caption || ''}
                  onChange={(e) => updateSelectedSlot('caption', e.target.value)}
                  placeholder="e.g. Before / After, caption, tag..."
                  className="w-full px-3 py-1.5 bg-slate-950 rounded-lg border border-slate-800 outline-hidden focus:border-blue-500 text-xs text-slate-200 placeholder-slate-600 focus:ring-1 focus:ring-blue-500"
                />
                
                {images[selectedSlotIdx].caption && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-slate-900 mt-1">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                      {/* Size input */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Size</span>
                        <input
                          type="number"
                          min="10"
                          max="32"
                          value={images[selectedSlotIdx].captionSize || 14}
                          onChange={(e) => updateSelectedSlot('captionSize', Number(e.target.value))}
                          className="w-10 px-1 py-0.5 bg-slate-950 border border-slate-800 rounded text-center text-xs font-mono text-blue-400"
                        />
                        <span className="text-slate-500">px</span>
                      </div>

                      {/* Color picker */}
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500">Color</span>
                        <input
                          type="color"
                          value={images[selectedSlotIdx].captionColor || '#ffffff'}
                          onChange={(e) => updateSelectedSlot('captionColor', e.target.value)}
                          className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0 shrink-0"
                        />
                        <span className="text-[10px] font-mono text-slate-400 uppercase">
                          {images[selectedSlotIdx].captionColor || '#ffffff'}
                        </span>
                      </div>
                    </div>

                    {/* Background label toggle */}
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">Background block</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={images[selectedSlotIdx].captionBg !== false}
                          onChange={(e) => updateSelectedSlot('captionBg', e.target.checked)}
                          className="rounded border-slate-800 bg-slate-950 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="text-slate-400 select-none">Dark Box</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section 6: Save & Download Collage panel */}
          {images.length > 0 && (
            <div className="space-y-4 pt-3 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-400" />
                Export Settings
              </span>

              {/* File name box */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 block font-mono">File Name</label>
                <input
                  type="text"
                  value={exportName}
                  onChange={(e) => setExportName(e.target.value)}
                  placeholder="custom_collage"
                  className="w-full px-3 py-2 bg-slate-950 rounded-lg border border-slate-850 outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs text-slate-100 placeholder-slate-600 font-sans"
                />
              </div>

              {/* format choice */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-400 block font-mono">Output Format</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-850 rounded-xl text-xs font-semibold text-slate-400">
                  {['image/png', 'image/jpeg', 'image/webp'].map((fmt) => {
                    const label = fmt === 'image/jpeg' ? 'JPEG' : fmt === 'image/webp' ? 'WebP' : 'PNG';
                    const isActive = exportFormat === fmt;
                    return (
                      <button
                        key={fmt}
                        onClick={() => setExportFormat(fmt as any)}
                        className={`py-1.5 rounded-lg transition-all text-xs ${
                          isActive 
                            ? 'bg-slate-850 text-blue-400 font-bold border border-slate-800' 
                            : 'hover:text-slate-200'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quality slider if not png */}
              {exportFormat !== 'image/png' && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold font-mono">
                    <span className="text-slate-400">Quality Factor</span>
                    <span className="text-blue-400">{Math.round(exportQuality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={exportQuality}
                    onChange={(e) => setExportQuality(Number(e.target.value))}
                    className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-blue-500"
                  />
                </div>
              )}

              {/* Download Action Trigger button */}
              <button
                id="btn-trigger-collage-download"
                onClick={handleDownloadCollage}
                disabled={isCompiling}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-lg shadow-blue-900/20 border border-blue-500 transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                {isCompiling ? 'Rendering Output...' : 'Compile & Save Collage'}
              </button>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handlePrintCollage}
                    disabled={isCompiling}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:bg-slate-850 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-all"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Print Collage</span>
                  </button>
                </div>
            </div>
          )}

        </div>
      </div>

      {/* Right Canvas stage layout workspace */}
      <div className="flex-1 flex flex-col bg-black/20 backdrop-blur-sm overflow-hidden lg:rounded-bl-xl items-center justify-center p-6 relative">
        
        {/* Background ambient grids */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.18),rgba(255,255,255,0))]" />
        
        {images.length === 0 ? (
          // Empty helper placeholder
          <div className="max-w-md w-full text-center space-y-6 z-10 px-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-950/40 border border-blue-900/50 flex items-center justify-center text-blue-400 mx-auto shadow-xl shadow-blue-950/20">
              <Sparkles className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100 font-sans">
                Drag and Drop Multiple Images
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Add up to 6 photos to mix custom layouts, side-by-side comparative views, or combine multiple images vertically or horizontally inside an offline high-fidelity canvas.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
              >
                <Upload className="w-4 h-4" />
                Upload Photos
              </button>
              
              <div className="text-[11px] text-slate-500 font-mono">or try procedural demo templates:</div>
            </div>

            {/* Quick Demo starters */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {SAMPLE_TEMPLATES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => handleAddSample(t)}
                  className="p-2 border border-slate-800 bg-slate-900/60 rounded-lg hover:border-slate-700 transition-all text-left"
                >
                  <div className="h-10 rounded overflow-hidden mb-1.5 relative border border-slate-800">
                    <img src={t.src} className="w-full h-full object-cover" alt={t.name} />
                  </div>
                  <p className="text-[10px] font-bold text-slate-200 truncate">{t.name}</p>
                </button>
              ))}
            </div>
          </div>
        ) : (
          // Active Canvas visualizer
          <div className="w-full flex-1 flex flex-col items-center justify-center max-h-[calc(100vh-8rem)]">
            
            {/* Real-time Stage layout */}
            <div 
              id="collage-preview-canvas"
              className="w-full max-w-2xl max-h-[85%] relative border border-slate-800 shadow-2xl transition-all duration-300 overflow-hidden rounded-xl flex items-center justify-center"
              style={{
                ...getAspectRatioStyle(),
                background: bgType === 'color' ? bgColor : bgGradient,
                padding: layout === 'vertical-combiner' || layout === 'horizontal-combiner' ? '0' : '0'
              }}
            >
              {layout === 'vertical-combiner' ? (
                // COMBINER PREVIEW - Vertical Stacking
                <div 
                  className="w-full flex flex-col h-full overflow-y-auto"
                  style={{
                    padding: `${outerMargin}px`,
                    gap: `${gap}px`
                  }}
                >
                  {images.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSlotIdx(idx)}
                      className={`relative overflow-hidden shrink-0 group ${
                        selectedSlotIdx === idx 
                          ? 'ring-2 ring-blue-500 z-10' 
                          : 'hover:ring-1 hover:ring-blue-900'
                      }`}
                      style={{
                        borderRadius: `${borderRadius}px`,
                        height: 'auto',
                        aspectRatio: `${item.rotation === 90 || item.rotation === 270 ? item.height / item.width : item.width / item.height}`,
                        maxHeight: '380px',
                      }}
                    >
                      {/* Interactive Slot controls */}
                      <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-blue-400 font-mono font-bold z-20 pointer-events-none uppercase">
                        Slot {idx + 1}
                      </div>

                      {/* Display image with pan & zoom and rotate CSS styling */}
                      <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src={item.src}
                          alt="preview"
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none transition-transform duration-100"
                          style={{
                            transform: `translate(${item.panX}%, ${item.panY}%) scale(${item.zoom}) rotate(${item.rotation}deg) scale(${item.flipH ? -1 : 1}, ${item.flipV ? -1 : 1})`,
                          }}
                        />
                      </div>

                      {/* Caption Text Overlay */}
                      {item.caption && (
                        <div 
                          className="absolute bottom-3 left-3 px-2.5 py-1 text-xs font-black rounded-md shadow-lg pointer-events-none z-20 flex items-center justify-center border"
                          style={{
                            color: item.captionColor || '#ffffff',
                            backgroundColor: item.captionBg !== false ? 'rgba(0,0,0,0.7)' : 'transparent',
                            fontSize: `${item.captionSize || 14}px`,
                            borderColor: item.captionBg !== false ? 'rgba(255,255,255,0.1)' : 'transparent',
                          }}
                        >
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : layout === 'horizontal-combiner' ? (
                // COMBINER PREVIEW - Horizontal Stacking
                <div 
                  className="h-full flex flex-row w-full overflow-x-auto"
                  style={{
                    padding: `${outerMargin}px`,
                    gap: `${gap}px`
                  }}
                >
                  {images.map((item, idx) => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedSlotIdx(idx)}
                      className={`relative overflow-hidden shrink-0 group h-full ${
                        selectedSlotIdx === idx 
                          ? 'ring-2 ring-blue-500 z-10' 
                          : 'hover:ring-1 hover:ring-blue-900'
                      }`}
                      style={{
                        borderRadius: `${borderRadius}px`,
                        width: 'auto',
                        aspectRatio: `${item.rotation === 90 || item.rotation === 270 ? item.height / item.width : item.width / item.height}`,
                      }}
                    >
                      {/* Interactive Slot controls */}
                      <div className="absolute top-2 right-2 bg-slate-900/80 px-2 py-1 rounded text-[10px] text-blue-400 font-mono font-bold z-20 pointer-events-none uppercase">
                        Slot {idx + 1}
                      </div>

                      {/* Display image with pan & zoom and rotate CSS styling */}
                      <div className="w-full h-full relative overflow-hidden bg-black flex items-center justify-center">
                        <img
                          src={item.src}
                          alt="preview"
                          draggable={false}
                          className="w-full h-full object-cover pointer-events-none transition-transform duration-100"
                          style={{
                            transform: `translate(${item.panX}%, ${item.panY}%) scale(${item.zoom}) rotate(${item.rotation}deg) scale(${item.flipH ? -1 : 1}, ${item.flipV ? -1 : 1})`,
                          }}
                        />
                      </div>

                      {/* Caption Text Overlay */}
                      {item.caption && (
                        <div 
                          className="absolute bottom-3 left-3 px-2.5 py-1 text-xs font-black rounded-md shadow-lg pointer-events-none z-20 flex items-center justify-center border"
                          style={{
                            color: item.captionColor || '#ffffff',
                            backgroundColor: item.captionBg !== false ? 'rgba(0,0,0,0.7)' : 'transparent',
                            fontSize: `${item.captionSize || 14}px`,
                            borderColor: item.captionBg !== false ? 'rgba(255,255,255,0.1)' : 'transparent',
                          }}
                        >
                          {item.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // COLLAGE PREVIEW - Preset Grid Positions
                <div className="absolute inset-0 relative w-full h-full">
                  {computeGridSlots(600, 600, images.length).map((slot, idx) => {
                    const item = images[idx];
                    if (!item) return null;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedSlotIdx(idx)}
                        className={`absolute overflow-hidden transition-all duration-300 cursor-pointer group ${
                          selectedSlotIdx === idx 
                            ? 'ring-2 ring-blue-500 z-10' 
                            : 'hover:ring-1 hover:ring-blue-900'
                        }`}
                        style={{
                          left: `${(slot.x / 600) * 100}%`,
                          top: `${(slot.y / 600) * 100}%`,
                          width: `${(slot.w / 600) * 100}%`,
                          height: `${(slot.h / 600) * 100}%`,
                          borderRadius: `${borderRadius}px`,
                        }}
                      >
                        {/* Interactive Slot tag */}
                        <div className="absolute top-2 right-2 bg-slate-900/80 px-1.5 py-0.5 rounded text-[8px] text-blue-400 font-mono font-bold z-20 pointer-events-none uppercase">
                          Slot {idx + 1}
                        </div>

                        {/* Rendering item image content */}
                        <div className="w-full h-full relative overflow-hidden bg-black/40 flex items-center justify-center">
                          <img
                            src={item.src}
                            alt="cell-preview"
                            draggable={false}
                            className="w-full h-full object-cover pointer-events-none transition-transform duration-100"
                            style={{
                              transform: `translate(${item.panX}%, ${item.panY}%) scale(${item.zoom}) rotate(${item.rotation}deg) scale(${item.flipH ? -1 : 1}, ${item.flipV ? -1 : 1})`,
                            }}
                          />
                        </div>

                        {/* Caption Text Overlay */}
                        {item.caption && (
                          <div 
                            className="absolute bottom-3 left-3 px-2.5 py-1 text-xs font-black rounded-md shadow-lg pointer-events-none z-20 flex items-center justify-center border"
                            style={{
                              color: item.captionColor || '#ffffff',
                              backgroundColor: item.captionBg !== false ? 'rgba(0,0,0,0.7)' : 'transparent',
                              fontSize: `${item.captionSize || 14}px`,
                              borderColor: item.captionBg !== false ? 'rgba(255,255,255,0.1)' : 'transparent',
                            }}
                          >
                            {item.caption}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick calibration helper instructions */}
            <p className="text-[10px] text-slate-500 font-mono mt-4 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-blue-500 shrink-0" />
              <span>Click on any layout photo slot above to zoom, rotate, flip, or drag position offsets in the sidebar controls.</span>
            </p>

          </div>
        )}
      </div>

    </div>
  );
}
