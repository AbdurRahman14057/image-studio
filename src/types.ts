export interface ImageState {
  src: string;         // original object URL or Base64
  name: string;        // original file name
  type: string;        // mime type (e.g. image/png)
  width: number;       // original width in px
  height: number;      // original height in px
  sizeBytes: number;   // original size in bytes
}

export interface CropArea {
  x: number;      // fractional coordinates [0..1]
  y: number;      // fractional coordinates [0..1]
  width: number;  // fractional width [0..1]
  height: number; // fractional height [0..1]
}

export interface Adjustments {
  brightness: number;   // -100 to 100 (0 default)
  contrast: number;     // -100 to 100 (0 default)
  saturation: number;   // -100 to 100 (0 default)
  grayscale: number;    // 0 to 100 (0 default)
  sepia: number;        // 0 to 100 (0 default)
  blur: number;         // 0 to 20 (0 default, px)
  invert: number;       // 0 to 100 (0 default)
  hueRotate: number;    // 0 to 360 (0 default)
  sharpness: number;    // 0 to 100 (0 default)
  warmth: number;       // -100 to 100 (0 default, temperature)
  exposure: number;     // -100 to 100 (0 default)
  vignette: number;     // 0 to 100 (0 default)
}

export type ImageRotation = 0 | 90 | 180 | 270;

export interface ResizeSettings {
  width: number;
  height: number;
  keepAspectRatio: boolean;
}

export interface ExportSettings {
  format: 'image/png' | 'image/jpeg' | 'image/webp';
  quality: number; // 0.1 to 1.0
  customName: string;
}

export const INITIAL_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  grayscale: 0,
  sepia: 0,
  blur: 0,
  invert: 0,
  hueRotate: 0,
  sharpness: 0,
  warmth: 0,
  exposure: 0,
  vignette: 0,
};
