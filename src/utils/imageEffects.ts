import { Adjustments } from '../types';

export function getCSSFilterString(adjustments: Adjustments): string {
  const {
    brightness,
    contrast,
    saturation,
    grayscale,
    sepia,
    blur,
    invert,
    hueRotate,
    exposure,
  } = adjustments;

  // Map sliders (-100..100) to standard CSS values
  const cssBrightness = 100 + brightness + (exposure * 0.5); // combine brightness and exposure exposure
  const cssContrast = 100 + contrast;
  const cssSaturate = 100 + saturation;
  
  return [
    `brightness(${Math.max(0, cssBrightness)}%)`,
    `contrast(${Math.max(0, cssContrast)}%)`,
    `saturate(${Math.max(0, cssSaturate)}%)`,
    `grayscale(${grayscale}%)`,
    `sepia(${sepia}%)`,
    blur > 0 ? `blur(${blur}px)` : '',
    `invert(${invert}%)`,
    `hue-rotate(${hueRotate}deg)`,
  ].filter(Boolean).join(' ');
}

export function drawWarmth(ctx: CanvasRenderingContext2D, width: number, height: number, warmth: number) {
  if (warmth === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'color';
  const opacity = (Math.abs(warmth) / 100) * 0.28;
  ctx.fillStyle = warmth > 0 
    ? `rgba(251, 146, 60, ${opacity})` // warm amber/orange
    : `rgba(56, 189, 248, ${opacity})`; // cool sky blue
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number, vignette: number) {
  if (vignette === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  
  const cx = width / 2;
  const cy = height / 2;
  const outerRadius = Math.sqrt(cx * cx + cy * cy);
  const innerRadius = outerRadius * Math.max(0, 1 - (vignette / 100) * 0.85);

  const grad = ctx.createRadialGradient(cx, cy, innerRadius, cx, cy, outerRadius);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(1, `rgba(15, 15, 15, ${0.1 + (vignette / 100) * 0.9})`);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

export function applySharpness(ctx: CanvasRenderingContext2D, width: number, height: number, sharpness: number) {
  if (sharpness === 0) return;
  const amount = sharpness / 100;
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const output = ctx.createImageData(width, height);
    const outData = output.data;
    
    const w = width;
    const h = height;
    
    // Copy border pixels directly to prevent black borders from kernel overflow
    for (let i = 0; i < data.length; i++) {
      outData[i] = data[i];
    }
    
    // Interior pixels 3x3 convolution
    for (let y = 1; y < h - 1; y++) {
      const rowOffset = y * w;
      const prevRowOffset = (y - 1) * w;
      const nextRowOffset = (y + 1) * w;
      
      for (let x = 1; x < w - 1; x++) {
        const idx = (rowOffset + x) * 4;
        
        for (let c = 0; c < 3; c++) { // RGB
          const center = data[idx + c];
          const top = data[prevRowOffset * 4 + x * 4 + c];
          const bottom = data[nextRowOffset * 4 + x * 4 + c];
          const left = data[idx - 4 + c];
          const right = data[idx + 4 + c];
          
          // Sharpen Kernel calculation
          let val = center * 5 - (top + bottom + left + right);
          val = center + amount * (val - center); // blend original with sharpened
          
          outData[idx + c] = Math.min(255, Math.max(0, val));
        }
        // Alpha inherits directly
        outData[idx + 3] = data[idx + 3];
      }
    }
    ctx.putImageData(output, 0, 0);
  } catch (e) {
    console.warn("Sharpness filter not applied - possible clean canvas violation (CORS):", e);
  }
}

/**
 * Draws the master canvas applying CSS filters, Custom Warmth composite,
 * Custom Vignette composite, and pixel-level Sharpening.
 */
export async function renderFinalCanvas(
  imageElement: HTMLImageElement,
  cropX: number,
  cropY: number,
  cropW: number,
  cropH: number,
  targetW: number,
  targetH: number,
  rotation: number,
  flipH: boolean,
  flipV: boolean,
  adjustments: Adjustments
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.save();
  
  // Set filters (CSS standard)
  ctx.filter = getCSSFilterString(adjustments);
  
  // Translate to center for flips and rotations
  ctx.translate(targetW / 2, targetH / 2);
  ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
  
  // Handle rotations
  if (rotation !== 0) {
    ctx.rotate((rotation * Math.PI) / 180);
  }

  // Draw scaled centered image depending on clockwise pivots
  if (rotation === 90 || rotation === 270) {
    ctx.drawImage(
      imageElement,
      cropX * imageElement.naturalWidth,
      cropY * imageElement.naturalHeight,
      cropW * imageElement.naturalWidth,
      cropH * imageElement.naturalHeight,
      -targetH / 2,
      -targetW / 2,
      targetH,
      targetW
    );
  } else {
    ctx.drawImage(
      imageElement,
      cropX * imageElement.naturalWidth,
      cropY * imageElement.naturalHeight,
      cropW * imageElement.naturalWidth,
      cropH * imageElement.naturalHeight,
      -targetW / 2,
      -targetH / 2,
      targetW,
      targetH
    );
  }
  
  ctx.restore();

  // Draw customized composite effects (warmth and vignette)
  drawWarmth(ctx, targetW, targetH, adjustments.warmth);
  drawVignette(ctx, targetW, targetH, adjustments.vignette);
  
  // Apply sharpening (pixel computation)
  if (adjustments.sharpness > 0) {
    applySharpness(ctx, targetW, targetH, adjustments.sharpness);
  }

  return canvas;
}

/**
 * Procedurally generates high-fidelity visual canvases as demo images.
 * This guarantees pristine visual options instantly playable offline.
 */
export function generateDemoImage(theme: 'sunset' | 'cosmic' | 'bauhaus'): { src: string; name: string; type: string; size: number } {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return { src: '', name: 'Empty', type: 'image/png', size: 0 };
  }

  const w = canvas.width;
  const h = canvas.height;

  if (theme === 'sunset') {
    // Elegant warm sunset scenery
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1e1b4b'); // indigo-950
    grad.addColorStop(0.3, '#4c1d95'); // violet-900
    grad.addColorStop(0.6, '#db2777'); // pink-600
    grad.addColorStop(0.8, '#ea580c'); // orange-600
    grad.addColorStop(1, '#facc15'); // yellow-400
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Glowing Sun
    const sunGrad = ctx.createRadialGradient(w/2, h * 0.65, 20, w/2, h * 0.65, 140);
    sunGrad.addColorStop(0, '#ffffff');
    sunGrad.addColorStop(0.4, '#fef08a'); // soft yellow
    sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(w/2, h * 0.65, 140, 0, Math.PI * 2);
    ctx.fill();

    // Distant soft mountains silhouettes
    ctx.fillStyle = '#2e1065'; // super dark purple
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.75);
    ctx.quadraticCurveTo(w * 0.25, h * 0.62, w * 0.5, h * 0.73);
    ctx.quadraticCurveTo(w * 0.78, h * 0.65, w, h * 0.78);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Foremost ocean wave lines
    ctx.fillStyle = '#17063a';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, h * 0.86);
    ctx.bezierCurveTo(w * 0.35, h * 0.79, w * 0.65, h * 0.94, w, h * 0.88);
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    // Geometric lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1;
    for (let i = 1; i <= 6; i++) {
      ctx.beginPath();
      ctx.arc(w/2, h * 0.65, 120 + i * 40, Math.PI, 0);
      ctx.stroke();
    }
  } else if (theme === 'cosmic') {
    // Cosmic Nebula
    ctx.fillStyle = '#090514';
    ctx.fillRect(0, 0, w, h);

    // Nebula dust puffs
    const colors = [
      'rgba(147, 51, 234, 0.22)', // violet-600
      'rgba(236, 72, 153, 0.16)', // pink-500
      'rgba(6, 182, 212, 0.18)',  // cyan-500
      'rgba(59, 130, 246, 0.14)'  // blue-500
    ];

    const centers = [
      { x: w * 0.3, y: h * 0.4, r: 280 },
      { x: w * 0.7, y: h * 0.5, r: 350 },
      { x: w * 0.45, y: h * 0.7, r: 240 },
      { x: w * 0.8, y: h * 0.25, r: 200 }
    ];

    centers.forEach((center, idx) => {
      const grad = ctx.createRadialGradient(center.x, center.y, 10, center.x, center.y, center.r);
      grad.addColorStop(0, colors[idx]);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center.x, center.y, center.r, 0, Math.PI * 2);
      ctx.fill();
    });

    // Seed twinkling stars
    for (let i = 0; i < 90; i++) {
      const sx = Math.sin(i * 12345.67) * 0.5 + 0.5;
      const sy = Math.cos(i * 98765.43) * 0.5 + 0.5;
      const r = 0.5 + (i % 3) * 0.7;
      const alpha = 0.4 + (i % 5) * 0.12;

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(sx * w, sy * h, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Special glowing stars with spikes
    const starCenters = [
      { x: w * 0.25, y: h * 0.3 },
      { x: w * 0.62, y: h * 0.65 },
      { x: w * 0.4, y: h * 0.2 }
    ];

    starCenters.forEach(star => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      // horizontal spike
      ctx.beginPath();
      ctx.moveTo(star.x - 14, star.y);
      ctx.lineTo(star.x + 14, star.y);
      ctx.stroke();
      // vertical spike
      ctx.beginPath();
      ctx.moveTo(star.x, star.y - 14);
      ctx.lineTo(star.x, star.y + 14);
      ctx.stroke();

      // soft glow
      const soft = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, 12);
      soft.addColorStop(0, 'rgba(255, 255, 255, 1)');
      soft.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = soft;
      ctx.beginPath();
      ctx.arc(star.x, star.y, 12, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // Bauhaus Retro Composition
    ctx.fillStyle = '#f5f2eb'; // Warm cream canvas
    ctx.fillRect(0, 0, w, h);

    // Soft architectural gridlines
    ctx.strokeStyle = 'rgba(20, 20, 20, 0.05)';
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    for (let x = 0; x < w; x += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSpacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Shapes: Terracotta red semi-circle
    ctx.fillStyle = '#dc2626'; // Red-600
    ctx.beginPath();
    ctx.arc(w * 0.35, h * 0.5, 160, Math.PI, 0);
    ctx.fill();

    // Mustard circle
    ctx.fillStyle = '#d97706'; // Amber-600
    ctx.beginPath();
    ctx.arc(w * 0.65, h*0.42, 110, 0, Math.PI * 2);
    ctx.fill();

    // Dark charcoal blocks
    ctx.fillStyle = '#1e293b'; // Slate-800
    ctx.fillRect(w * 0.15, h * 0.5, 340, 25);
    ctx.fillRect(w * 0.55, h * 0.6, 90, 160);
    
    // Abstract grid box
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.72, h * 0.22, 100, 100);

    // Black diagonal lines
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(w * 0.15, h * 0.3);
    ctx.lineTo(w * 0.85, h * 0.75);
    ctx.stroke();
  }

  // Watermark text inside the canvas just to show it is a high quality procedural file
  ctx.save();
  ctx.font = "bold 15px 'Courier New', monospace";
  ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
  if (theme === 'bauhaus') ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
  ctx.fillText("IMAGE_STUDIO_HD_SOURCE", 35, h - 35);
  ctx.restore();

  const dataUrl = canvas.toDataURL('image/png');
  // estimate size around 150-300kb
  const estimatedSize = Math.round((dataUrl.length - 22) * 3 / 4);

  return {
    src: dataUrl,
    name: `procedural-${theme}.png`,
    type: 'image/png',
    size: estimatedSize
  };
}
