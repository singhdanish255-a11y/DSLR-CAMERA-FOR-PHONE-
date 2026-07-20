/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type CameraMode =
  | 'auto'
  | 'pro'
  | 'portrait'
  | 'night'
  | 'hdr'
  | 'panorama'
  | 'macro'
  | 'food'
  | 'landscape'
  | 'sports'
  | 'long_exposure'
  | 'time_lapse'
  | 'slow_motion'
  | 'hyperlapse'
  | 'burst'
  | 'qr_scanner'
  | 'document_scanner';

export interface DSLRControls {
  iso: 'auto' | 100 | 200 | 400 | 800 | 1600 | 3200 | 6400;
  shutterSpeed: 'auto' | '1/4000' | '1/2000' | '1/1000' | '1/500' | '1/250' | '1/125' | '1/60' | '1/30' | '1/15' | '1/8' | '1/4' | '1/2' | '1s' | '2s' | '4s' | '8s';
  whiteBalance: 'auto' | 'daylight' | 'cloudy' | 'shade' | 'tungsten' | 'fluorescent';
  exposureComp: number; // -3 to +3
  focus: 'auto' | number; // 'auto' or 0 to 100 manual focus
  zoom: number; // 1 to 10
  rawEnabled: boolean;
  gridType: '3x3' | 'golden' | 'diagonal' | 'none';
  levelEnabled: boolean;
  peakingEnabled: boolean;
  zebraEnabled: boolean;
}

export interface PhotoAdjustment {
  brightness: number;   // -100 to 100
  contrast: number;     // -100 to 100
  saturation: number;   // -100 to 100
  highlights: number;   // -100 to 100
  shadows: number;      // -100 to 100
  sharpness: number;    // 0 to 100
  clarity: number;      // -100 to 100
  temperature: number;  // -100 to 100 (blue to amber)
  tint: number;         // -100 to 100 (green to magenta)
  vibrance: number;     // -100 to 100
  grain: number;        // 0 to 100
  vignette: number;     // 0 to 100
}

export type FilterType =
  | 'none'
  | 'natural'
  | 'cinematic'
  | 'vintage'
  | 'bw'
  | 'warm'
  | 'cool'
  | 'golden_hour'
  | 'film_look'
  | 'matte'
  | 'hdr_filter'
  | 'neon'
  | 'moody'
  | 'soft_skin'
  | 'vivid'
  | 'classic'
  | 'retro'
  | 'sepia'
  | 'mono'
  | 'dynamic';

export interface GalleryPhoto {
  id: string;
  url: string; // Data URL or URL path
  timestamp: number;
  mode: CameraMode;
  iso: string | number;
  shutterSpeed: string;
  whiteBalance: string;
  exposureComp: string;
  isRaw: boolean;
  isFavorite: boolean;
  album: string; // 'Captures', 'RAW', 'Edits', 'Favorites' etc
  width: number;
  height: number;
  fileSize: string;
}

export interface AppSettings {
  imageResolution: '4K' | '12MP' | '8MP' | '5MP';
  videoResolution: '4K' | '1080p' | '720p';
  fps: 24 | 30 | 60;
  aspectRatio: '1:1' | '4:3' | '16:9' | 'full';
  saveLocation: 'Internal Storage' | 'Cloud Backup' | 'DSLR Pro Gallery';
  watermarkEnabled: boolean;
  watermarkText: string;
  shutterSound: boolean;
  theme: 'slate' | 'carbon' | 'warm' | 'light';
  language: 'en' | 'es' | 'de' | 'fr' | 'ja';
}
