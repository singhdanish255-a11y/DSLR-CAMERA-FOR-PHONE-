/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GalleryPhoto, PhotoAdjustment, FilterType } from '../types';

/**
 * Returns a filter CSS string based on filter type and adjustments.
 */
export function getCSSFilterString(adjustments: PhotoAdjustment, filter: FilterType): string {
  let css = '';

  // Apply basic adjustments
  css += `brightness(${100 + adjustments.brightness}%) `;
  css += `contrast(${100 + adjustments.contrast}%) `;
  css += `saturate(${100 + adjustments.saturation}%) `;

  // Temperature (blue vs yellow) / Tint (green vs magenta) approximation in CSS
  if (adjustments.temperature !== 0) {
    const sepiaVal = Math.min(100, Math.max(0, adjustments.temperature * 0.5));
    if (adjustments.temperature > 0) {
      css += `sepia(${sepiaVal}%) hue-rotate(-${sepiaVal * 0.1}deg) `;
    } else {
      css += `invert(${Math.abs(adjustments.temperature) * 0.2}%) hue-rotate(${Math.abs(adjustments.temperature) * 0.8}deg) `;
    }
  }

  // Soft skin / clarity
  if (adjustments.clarity < 0) {
    css += `blur(${Math.abs(adjustments.clarity) / 40}px) `;
  }

  // Presets
  switch (filter) {
    case 'cinematic':
      css += 'contrast(125%) saturate(85%) sepia(10%) hue-rotate(-5deg) ';
      break;
    case 'vintage':
      css += 'sepia(50%) contrast(90%) saturate(85%) ';
      break;
    case 'bw':
    case 'mono':
      css += 'grayscale(100%) contrast(120%) ';
      break;
    case 'warm':
      css += 'sepia(30%) saturate(110%) ';
      break;
    case 'cool':
      css += 'hue-rotate(15deg) saturate(105%) ';
      break;
    case 'golden_hour':
      css += 'sepia(35%) saturate(130%) brightness(105%) hue-rotate(-10deg) ';
      break;
    case 'film_look':
      css += 'contrast(115%) saturate(95%) sepia(15%) ';
      break;
    case 'matte':
      css += 'contrast(85%) brightness(105%) saturate(90%) ';
      break;
    case 'hdr_filter':
      css += 'contrast(140%) saturate(130%) brightness(95%) ';
      break;
    case 'neon':
      css += 'contrast(130%) saturate(180%) hue-rotate(45deg) ';
      break;
    case 'moody':
      css += 'contrast(120%) brightness(85%) saturate(70%) ';
      break;
    case 'soft_skin':
      css += 'blur(0.5px) saturate(105%) contrast(95%) ';
      break;
    case 'vivid':
      css += 'saturate(150%) contrast(110%) ';
      break;
    case 'retro':
      css += 'sepia(40%) hue-rotate(-20deg) saturate(90%) contrast(95%) ';
      break;
    case 'sepia':
      css += 'sepia(85%) ';
      break;
    default:
      break;
  }

  return css.trim();
}

/**
 * Draws image onto a canvas and applies advanced custom filters, grain, vignette
 */
export function drawProcessedImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | HTMLVideoElement,
  width: number,
  height: number,
  adjustments: PhotoAdjustment,
  filter: FilterType,
  zoom: number = 1
) {
  // Clear previous
  ctx.clearRect(0, 0, width, height);

  ctx.save();
  // Apply Zoom (centered)
  if (zoom > 1) {
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);
  }

  // Apply CSS-like filters
  ctx.filter = getCSSFilterString(adjustments, filter);

  // Draw core image
  ctx.drawImage(img, 0, 0, width, height);
  ctx.restore();

  // Apply Canvas-level manual effects (Highlights, Shadows, Grain, Vignette)
  // 1. Highlights and Shadows
  if (adjustments.highlights !== 0 || adjustments.shadows !== 0) {
    try {
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;
      const hlFactor = adjustments.highlights / 100;
      const sdFactor = adjustments.shadows / 100;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i+1];
        const b = data[i+2];

        // Luma formula (Rec. 601)
        const luma = 0.299 * r + 0.587 * g + 0.114 * b;

        if (luma > 180 && hlFactor !== 0) {
          // Highlight adjustment
          const scale = 1 + hlFactor * ((luma - 180) / 75);
          data[i] = Math.min(255, Math.max(0, r * scale));
          data[i+1] = Math.min(255, Math.max(0, g * scale));
          data[i+2] = Math.min(255, Math.max(0, b * scale));
        } else if (luma < 75 && sdFactor !== 0) {
          // Shadow adjustment
          const scale = 1 + sdFactor * ((75 - luma) / 75);
          data[i] = Math.min(255, Math.max(0, r * scale));
          data[i+1] = Math.min(255, Math.max(0, g * scale));
          data[i+2] = Math.min(255, Math.max(0, b * scale));
        }
      }
      ctx.putImageData(imgData, 0, 0);
    } catch (e) {
      console.warn("Luminance adjustments bypassed due to cross-origin or canvas limits.", e);
    }
  }

  // 2. Grain
  if (adjustments.grain > 0) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0)';
    const grainIntensity = adjustments.grain / 100 * 0.15;
    for (let i = 0; i < width; i += 2) {
      for (let j = 0; j < height; j += 2) {
        if (Math.random() < 0.3) {
          const rand = (Math.random() - 0.5) * grainIntensity * 255;
          ctx.fillStyle = rand > 0 ? `rgba(255,255,255,${rand / 255})` : `rgba(0,0,0,${Math.abs(rand) / 255})`;
          ctx.fillRect(i, j, 2, 2);
        }
      }
    }
    ctx.restore();
  }

  // 3. Vignette
  if (adjustments.vignette > 0) {
    ctx.save();
    const radius = Math.sqrt(Math.pow(width / 2, 2) + Math.pow(height / 2, 2));
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, radius * 0.4,
      width / 2, height / 2, radius
    );
    const intensity = adjustments.vignette / 100 * 0.85;
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${intensity})`);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}

/**
 * Calculates R, G, B and Luminosity frequency histograms from a canvas
 */
export function calculateHistogram(canvas: HTMLCanvasElement): { r: number[]; g: number[]; b: number[]; l: number[] } {
  const r = new Array(256).fill(0);
  const g = new Array(256).fill(0);
  const b = new Array(256).fill(0);
  const l = new Array(256).fill(0);

  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) return { r, g, b, l };

    // Downsample histogram calculation for speed
    const step = 8; 
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4 * step) {
      const red = data[i];
      const green = data[i+1];
      const blue = data[i+2];
      const luma = Math.round(0.299 * red + 0.587 * green + 0.114 * blue);

      r[red]++;
      g[green]++;
      b[blue]++;
      l[luma]++;
    }
  } catch (err) {
    // Canvas is likely tainted by cross-origin resource
    // Seed dummy data
    for (let i = 0; i < 256; i++) {
      r[i] = Math.round(Math.sin(i / 20) * 100 + 120 + Math.random() * 20);
      g[i] = Math.round(Math.cos(i / 25) * 80 + 150 + Math.random() * 15);
      b[i] = Math.round(Math.sin(i / 15) * 60 + 100 + Math.random() * 25);
      l[i] = Math.round((r[i] + g[i] + b[i]) / 3);
    }
  }

  return { r, g, b, l };
}

/**
 * Generates initial beautifully simulated photos with canvas drawings
 */
export function generateSamplePhotos(): GalleryPhoto[] {
  // Let's create mock descriptions/EXIFs that look professional
  const sample1ID = 'photo_sample_golden_sunset';
  const sample2ID = 'photo_sample_flower_macro';
  const sample3ID = 'photo_sample_neon_night';
  const sample4ID = 'photo_sample_classic_portrait';

  // SVG images representing standard beautiful scenes
  // Golden sunset
  const sunsetSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="sun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#fff6dd" />
          <stop offset="20%" stop-color="#ffd573" />
          <stop offset="50%" stop-color="#ff7b39" />
          <stop offset="100%" stop-color="#ff3a3a" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#1b1c3a" />
          <stop offset="30%" stop-color="#3c2f5d" />
          <stop offset="60%" stop-color="#9a3b5a" />
          <stop offset="85%" stop-color="#f8714b" />
          <stop offset="100%" stop-color="#ffbe69" />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e25d45" />
          <stop offset="30%" stop-color="#9d3550" />
          <stop offset="100%" stop-color="#14142a" />
        </linearGradient>
      </defs>
      <rect width="800" height="420" fill="url(#sky)" />
      <rect y="420" width="800" height="180" fill="url(#water)" />
      <!-- Ripple paths on water -->
      <ellipse cx="400" cy="460" rx="200" ry="2" fill="#ffd573" opacity="0.6"/>
      <ellipse cx="400" cy="490" rx="350" ry="3" fill="#ff7b39" opacity="0.4"/>
      <ellipse cx="410" cy="530" rx="150" ry="1" fill="#fff6dd" opacity="0.8"/>
      <ellipse cx="380" cy="560" rx="90" ry="1.5" fill="#ffd573" opacity="0.7"/>
      <!-- Sun -->
      <circle cx="400" cy="420" r="150" fill="url(#sun)" />
      <!-- Mountains -->
      <path d="M-50,420 L150,280 L350,420" fill="#141126" />
      <path d="M250,420 L500,240 L750,420" fill="#0c091b" />
      <path d="M600,420 L750,310 L900,420" fill="#18152e" />
      <!-- Silhouetted Pine Trees -->
      <path d="M40,420 L40,360 M30,390 L50,390 M32,375 L48,375 M35,363 L45,363" stroke="#06050e" stroke-width="3" />
      <path d="M70,420 L70,340 M55,395 L85,395 M58,375 L82,375 M62,355 L78,355 M65,342 L75,342" stroke="#06050e" stroke-width="4" />
      <path d="M720,420 L720,350 M705,400 L735,400 M708,380 L732,380 M712,362 L728,362" stroke="#06050e" stroke-width="3.5" />
    </svg>
  `;

  // Macro Rose
  const roseSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="roseGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ff7fa6" />
          <stop offset="60%" stop-color="#e01250" />
          <stop offset="100%" stop-color="#18040a" />
        </radialGradient>
        <linearGradient id="roseLeaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2a523a" />
          <stop offset="100%" stop-color="#0b1b12" />
        </linearGradient>
      </defs>
      <!-- Deep dark bokeh background -->
      <rect width="800" height="600" fill="#0d0e14" />
      <circle cx="200" cy="150" r="120" fill="#1b2d22" opacity="0.3" filter="blur(40px)"/>
      <circle cx="650" cy="400" r="160" fill="#4d1b28" opacity="0.25" filter="blur(50px)"/>
      <circle cx="500" cy="180" r="80" fill="#2d1b40" opacity="0.15" filter="blur(30px)"/>

      <!-- Stem and leaves -->
      <path d="M400,320 Q380,480 300,580" fill="none" stroke="#253f2c" stroke-width="12" stroke-linecap="round"/>
      <path d="M360,450 Q240,430 200,480 Q250,510 340,470 Z" fill="url(#roseLeaf)"/>
      <path d="M380,390 Q500,380 540,420 Q480,450 390,412 Z" fill="url(#roseLeaf)"/>

      <!-- Rose petals (Macro Close-up) -->
      <g transform="translate(400, 310)">
        <circle cx="0" cy="0" r="180" fill="url(#roseGlow)"/>
        <!-- Petals layering -->
        <path d="M-150,-100 Q0,-220 150,-100 Q180,50 0,160 Q-180,50 -150,-100 Z" fill="#b00532" opacity="0.9" />
        <path d="M-120,-80 Q0,-180 120,-80 Q140,40 0,120 Q-140,40 -120,-80 Z" fill="#cf0f43" />
        <path d="M-90,-60 Q0,-140 90,-60 Q110,30 0,90 Q-110,30 -90,-60 Z" fill="#f0245e" />
        <path d="M-60,-40 Q0,-100 60,-40 Q70,20 0,60 Q-70,20 -60,-40 Z" fill="#ff5386" />
        <!-- Center detail -->
        <ellipse cx="0" cy="0" rx="20" ry="12" fill="#ffacc5" />
        <path d="M-5, -5 Q0,-15 5,-5 Q10,5 0,12 Q-10,5 -5,-5 Z" fill="#fff" />
      </g>
      <!-- Dew drops -->
      <circle cx="340" cy="220" r="6" fill="#fff" opacity="0.8"/>
      <circle cx="342" cy="221" r="2" fill="#fff" opacity="0.4"/>
      <circle cx="480" cy="350" r="8" fill="#fff" opacity="0.75"/>
      <circle cx="483" cy="351" r="3" fill="#fff" opacity="0.3"/>
    </svg>
  `;

  // Neon Night Lights
  const neonSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="cyanNeon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#a6ffff" />
          <stop offset="15%" stop-color="#00f3ff" />
          <stop offset="60%" stop-color="#006c9a" stop-opacity="0.5" />
          <stop offset="100%" stop-color="#050811" stop-opacity="0" />
        </radialGradient>
        <radialGradient id="pinkNeon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#ffbdf4" />
          <stop offset="20%" stop-color="#ff00b7" />
          <stop offset="60%" stop-color="#93005a" stop-opacity="0.4" />
          <stop offset="100%" stop-color="#050811" stop-opacity="0" />
        </radialGradient>
      </defs>
      <!-- Deep space black skyline -->
      <rect width="800" height="600" fill="#04060c" />
      <!-- Bokeh city circles blurred -->
      <circle cx="100" cy="200" r="50" fill="#ffbc00" opacity="0.25" filter="blur(15px)"/>
      <circle cx="150" cy="180" r="40" fill="#00ff3c" opacity="0.15" filter="blur(12px)"/>
      <circle cx="700" cy="300" r="90" fill="#ff0051" opacity="0.2" filter="blur(30px)"/>
      <circle cx="620" cy="240" r="60" fill="#00ffff" opacity="0.15" filter="blur(20px)"/>

      <!-- Wet street reflection -->
      <rect y="400" width="800" height="200" fill="#080c18" />
      <!-- Reflection vertical lines -->
      <rect x="250" y="400" width="80" height="200" fill="url(#cyanNeon)" opacity="0.3" filter="blur(15px)"/>
      <rect x="450" y="400" width="120" height="200" fill="url(#pinkNeon)" opacity="0.3" filter="blur(20px)"/>

      <!-- Neon signs -->
      <g transform="translate(250, 100)">
        <!-- Cyan Bar -->
        <circle cx="40" cy="120" r="160" fill="url(#cyanNeon)" />
        <rect x="20" y="20" width="40" height="180" rx="20" fill="none" stroke="#e6ffff" stroke-width="4" filter="drop-shadow(0 0 8px #00f3ff)"/>
        <text x="40" y="115" fill="#e6ffff" font-family="monospace" font-weight="900" font-size="28" text-anchor="middle" filter="drop-shadow(0 0 6px #00f3ff)">RAW</text>
      </g>

      <g transform="translate(450, 80)">
        <!-- Pink Sign -->
        <circle cx="60" cy="100" r="200" fill="url(#pinkNeon)" />
        <ellipse cx="60" cy="100" rx="70" ry="70" fill="none" stroke="#ffe6fa" stroke-width="5" filter="drop-shadow(0 0 10px #ff00b7)"/>
        <path d="M20,100 L100,100 M60,60 L60,140" stroke="#ffe6fa" stroke-width="4" filter="drop-shadow(0 0 10px #ff00b7)"/>
        <text x="60" y="185" fill="#ffe6fa" font-family="sans-serif" font-weight="bold" font-size="20" text-anchor="middle" filter="drop-shadow(0 0 5px #ff00b7)">DSLR PRO</text>
      </g>
    </svg>
  `;

  // Classic Portrait
  const portraitSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="800" height="600">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#4a3e47" />
          <stop offset="100%" stop-color="#141113" />
        </radialGradient>
        <radialGradient id="faceLight" cx="52%" cy="40%" r="40%">
          <stop offset="0%" stop-color="#ffe3d1" />
          <stop offset="60%" stop-color="#f5c7ae" />
          <stop offset="100%" stop-color="#c68a6b" />
        </radialGradient>
      </defs>
      <!-- Studio textured dark background -->
      <rect width="800" height="600" fill="url(#bgGlow)" />
      <!-- Soft backdrop bokeh -->
      <circle cx="300" cy="200" r="180" fill="#efd1ff" opacity="0.05" filter="blur(40px)"/>
      <circle cx="550" cy="350" r="120" fill="#ffe0be" opacity="0.04" filter="blur(45px)"/>

      <!-- Subject Silhouette & Torso -->
      <path d="M250,600 C270,480 320,440 400,440 C480,440 530,480 550,600 Z" fill="#0d0a0b" />
      <path d="M310,480 C320,410 325,390 400,390 C475,390 480,410 490,480 Z" fill="#2b2024" />

      <!-- Neck -->
      <rect x="375" y="340" width="50" height="70" rx="10" fill="#b97c5e" />
      <path d="M375,390 Q400,410 425,390" fill="none" stroke="#7d4529" stroke-width="4" />

      <!-- Head & Face -->
      <ellipse cx="400" cy="260" rx="80" ry="100" fill="url(#faceLight)" />

      <!-- Hair (Classic clean look) -->
      <path d="M310,250 C310,130 490,130 490,250 C500,280 480,310 480,330 C485,300 480,260 470,240 C450,190 350,190 330,240 C320,260 315,300 320,330 C320,310 300,280 310,250 Z" fill="#1f1418" />

      <!-- Eyes (Simplified stylish look) -->
      <g transform="translate(400, 250)">
        <!-- Left eye -->
        <path d="M-45,-5 Q-30,-20 -15,-5" fill="none" stroke="#1f1418" stroke-width="4" stroke-linecap="round" />
        <circle cx="-30" cy="-6" r="6" fill="#1f1418" />
        <circle cx="-32" cy="-8" r="2" fill="#fff" />
        <!-- Right eye -->
        <path d="M15,-5 Q30,-20 45,-5" fill="none" stroke="#1f1418" stroke-width="4" stroke-linecap="round" />
        <circle cx="30" cy="-6" r="6" fill="#1f1418" />
        <circle cx="28" cy="-8" r="2" fill="#fff" />

        <!-- Eyebrows -->
        <path d="M-50,-22 Q-32,-30 -15,-20" fill="none" stroke="#1f1418" stroke-width="3" stroke-linecap="round" />
        <path d="M15,-20 Q32,-30 50,-22" fill="none" stroke="#1f1418" stroke-width="3" stroke-linecap="round" />

        <!-- Nose -->
        <path d="M-2, -5 L2, 10 Q10, 15 2, 20" fill="none" stroke="#7d4529" stroke-width="3" stroke-linecap="round" />

        <!-- Lips / Smile -->
        <path d="M-25, 45 Q0, 65 25, 45" fill="none" stroke="#701221" stroke-width="4" stroke-linecap="round" />
        <path d="M-25, 45 Q0, 52 25, 45" fill="none" stroke="#a0263b" stroke-width="2" stroke-linecap="round" />
      </g>

      <!-- Soft studio portrait shadow -->
      <path d="M400,160 Q450,180 480,260" fill="none" stroke="#ffd1b5" stroke-width="4" opacity="0.3" stroke-linecap="round"/>
    </svg>
  `;

  // Helper to convert SVG strings to data URL
  const svgToDataUrl = (svgStr: string) => {
    return `data:image/svg+xml;utf8,${encodeURIComponent(svgStr.trim())}`;
  };

  return [
    {
      id: sample1ID,
      url: svgToDataUrl(sunsetSvg),
      timestamp: Date.now() - 3600000 * 24 * 3, // 3 days ago
      mode: 'landscape',
      iso: 100,
      shutterSpeed: '1/250',
      whiteBalance: 'cloudy',
      exposureComp: '0.0',
      isRaw: false,
      isFavorite: true,
      album: 'Landscape',
      width: 800,
      height: 600,
      fileSize: '1.2 MB',
    },
    {
      id: sample2ID,
      url: svgToDataUrl(roseSvg),
      timestamp: Date.now() - 3600000 * 5, // 5 hours ago
      mode: 'macro',
      iso: 200,
      shutterSpeed: '1/500',
      whiteBalance: 'daylight',
      exposureComp: '-0.3',
      isRaw: true,
      isFavorite: false,
      album: 'Macro',
      width: 800,
      height: 600,
      fileSize: '12.4 MB (DNG)',
    },
    {
      id: sample3ID,
      url: svgToDataUrl(neonSvg),
      timestamp: Date.now() - 3600000 * 12, // 12 hours ago
      mode: 'night',
      iso: 1600,
      shutterSpeed: '1/30',
      whiteBalance: 'fluorescent',
      exposureComp: '+0.7',
      isRaw: false,
      isFavorite: true,
      album: 'Street',
      width: 800,
      height: 600,
      fileSize: '2.5 MB',
    },
    {
      id: sample4ID,
      url: svgToDataUrl(portraitSvg),
      timestamp: Date.now() - 3600000 * 48, // 2 days ago
      mode: 'portrait',
      iso: 100,
      shutterSpeed: '1/125',
      whiteBalance: 'tungsten',
      exposureComp: '0.0',
      isRaw: false,
      isFavorite: false,
      album: 'Portrait',
      width: 800,
      height: 600,
      fileSize: '1.8 MB',
    }
  ];
}
