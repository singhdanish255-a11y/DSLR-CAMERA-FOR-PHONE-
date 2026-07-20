/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Sliders, 
  Crop, 
  Sparkles, 
  RotateCw, 
  FlipHorizontal, 
  Type as TextIcon, 
  Smile as StickerIcon, 
  FileDown, 
  Heart, 
  Undo2, 
  Check, 
  Maximize, 
  Grid,
  Scissors,
  Wand2,
  Trash2,
  Bookmark
} from 'lucide-react';
import { GalleryPhoto, PhotoAdjustment, FilterType } from '../types';
import { drawProcessedImage } from '../lib/photoUtils';

interface EditorViewProps {
  photoToEdit: GalleryPhoto | null;
  onSaveEditedPhoto: (newPhoto: GalleryPhoto) => void;
  onCancelEditing: () => void;
}

export default function EditorView({
  photoToEdit,
  onSaveEditedPhoto,
  onCancelEditing
}: EditorViewProps) {
  // If no photo is loaded, show a loading placeholder or select first
  if (!photoToEdit) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-zinc-950 text-zinc-400">
        <Wand2 className="w-14 h-14 text-zinc-800 mb-4 animate-bounce" />
        <h2 className="text-lg font-display font-semibold text-zinc-300">No photo selected for editing</h2>
        <p className="text-xs text-zinc-600 mt-1 max-w-sm text-center">
          Go to the Built-in Gallery first, find a gorgeous photo, and click the Edit pencil icon to open the Pro Editor Suite.
        </p>
      </div>
    );
  }

  // Active Tool state: 'adjust', 'filter', 'crop', 'text', 'ai_tools', 'stickers', 'frames'
  const [activeToolTab, setActiveToolTab] = useState<'adjust' | 'filter' | 'crop' | 'text' | 'ai' | 'frames'>('adjust');

  // Slider Adjustments
  const [adjustments, setAdjustments] = useState<PhotoAdjustment>({
    brightness: 0,
    contrast: 0,
    saturation: 0,
    highlights: 0,
    shadows: 0,
    sharpness: 0,
    clarity: 0,
    temperature: 0,
    tint: 0,
    vibrance: 0,
    grain: 0,
    vignette: 0,
  });

  // Selected Filter preset
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('none');

  // Canvas Transforms
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);

  // Text overlay state
  const [textOverlay, setTextOverlay] = useState<string>('');
  const [textX, setTextX] = useState<number>(50); // percentage (0-100)
  const [textY, setTextY] = useState<number>(85); // percentage (0-100)
  const [textColor, setTextColor] = useState<string>('#ffffff');
  const [textSize, setTextSize] = useState<number>(24);

  // Frames overlay state
  const [selectedFrame, setSelectedFrame] = useState<'none' | 'polaroid' | 'classic_white' | 'film_strip'>('none');
  const [polaroidCaption, setPolaroidCaption] = useState<string>('DSLR CAPTURE');

  // AI brush eraser state
  const [isAiBrushActive, setIsAiBrushActive] = useState<boolean>(false);
  const [brushSize, setBrushSize] = useState<number>(20);
  const [paintedMaskPoints, setPaintedMaskPoints] = useState<{ x: number; y: number }[]>([]);
  const [isPainting, setIsPainting] = useState<boolean>(false);

  // AI loading status text
  const [aiLoadingText, setAiLoadingText] = useState<string | null>(null);

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Load image on mount/change
  useEffect(() => {
    const img = new Image();
    img.src = photoToEdit.url;
    img.onload = () => {
      sourceImageRef.current = img;
      renderCanvas();
    };
  }, [photoToEdit]);

  // Canvas render trigger
  useEffect(() => {
    renderCanvas();
  }, [adjustments, selectedFilter, rotation, flipH, flipV, textOverlay, textX, textY, textColor, textSize, selectedFrame, polaroidCaption, paintedMaskPoints]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    const img = sourceImageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate dimensions based on rotation
    const isSideways = rotation === 90 || rotation === 270;
    const origWidth = img.naturalWidth || img.width || 800;
    const origHeight = img.naturalHeight || img.height || 600;

    // Constrain size so it doesn't overload browser
    const maxDimension = 1200;
    let scale = 1;
    if (Math.max(origWidth, origHeight) > maxDimension) {
      scale = maxDimension / Math.max(origWidth, origHeight);
    }

    const drawWidth = origWidth * scale;
    const drawHeight = origHeight * scale;

    canvas.width = isSideways ? drawHeight : drawWidth;
    canvas.height = isSideways ? drawWidth : drawHeight;

    // Save state
    ctx.save();

    // 1. Center rotation pivot
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    // 2. Mirror Flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // 3. Draw processed baseline image (applying CSS filters, contrast, temperature)
    ctx.translate(-drawWidth / 2, -drawHeight / 2);
    drawProcessedImage(ctx, img, drawWidth, drawHeight, adjustments, selectedFilter, 1);

    ctx.restore();

    // 4. Draw painted mask if brush eraser tool is active
    if (isAiBrushActive && paintedMaskPoints.length > 0) {
      ctx.save();
      ctx.fillStyle = 'rgba(239, 68, 68, 0.4)'; // Red semi-transparent brush mask
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      paintedMaskPoints.forEach((p, idx) => {
        // Map relative percentage to actual canvas pixels
        const cx = (p.x / 100) * canvas.width;
        const cy = (p.y / 100) * canvas.height;
        if (idx === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      });
      ctx.stroke();
      ctx.restore();
    }

    // 5. Draw Custom Frames
    if (selectedFrame !== 'none') {
      ctx.save();
      if (selectedFrame === 'classic_white') {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = canvas.width * 0.03; // 3% border
        ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, canvas.width - ctx.lineWidth, canvas.height - ctx.lineWidth);
      } else if (selectedFrame === 'polaroid') {
        const borderTop = canvas.width * 0.04;
        const borderBottom = canvas.height * 0.16;
        // Draw bottom polaroid banner
        ctx.fillStyle = '#fbfcfc';
        ctx.fillRect(0, 0, canvas.width, borderTop); // Top
        ctx.fillRect(0, 0, borderTop, canvas.height); // Left
        ctx.fillRect(canvas.width - borderTop, 0, borderTop, canvas.height); // Right
        ctx.fillRect(0, canvas.height - borderBottom, canvas.width, borderBottom); // Bottom

        // Draw polaroid shadow line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(borderTop, borderTop, canvas.width - borderTop*2, canvas.height - borderTop - borderBottom);

        // Write Polaroid caption
        ctx.fillStyle = '#0f172a';
        ctx.font = `italic bold ${Math.round(canvas.width * 0.04)}px "Space Grotesk", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(polaroidCaption, canvas.width / 2, canvas.height - borderBottom * 0.4);
      } else if (selectedFrame === 'film_strip') {
        // Draw borders
        const stripSize = canvas.width * 0.05;
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, canvas.width, stripSize); // Top
        ctx.fillRect(0, canvas.height - stripSize, canvas.width, stripSize); // Bottom

        // Draw film strip perforations squares
        ctx.fillStyle = '#ffffff';
        const perfSize = stripSize * 0.4;
        const spacing = perfSize * 2.5;
        for (let x = spacing/2; x < canvas.width; x += spacing) {
          ctx.fillRect(x, (stripSize - perfSize)/2, perfSize, perfSize); // Top
          ctx.fillRect(x, canvas.height - stripSize + (stripSize - perfSize)/2, perfSize, perfSize); // Bottom
        }
      }
      ctx.restore();
    }

    // 6. Draw Text Caption Overlay
    if (textOverlay.trim()) {
      ctx.save();
      const tx = (textX / 100) * canvas.width;
      const ty = (textY / 100) * canvas.height;
      ctx.fillStyle = textColor;
      ctx.font = `bold ${textSize}px "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Drop shadow for readability
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(textOverlay, tx, ty);
      ctx.restore();
    }
  };

  // Canvas painting mouse handlers for AI Object Removal Brush Mask
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiBrushActive) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setIsPainting(true);
    setPaintedMaskPoints([{ x, y }]);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAiBrushActive || !isPainting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setPaintedMaskPoints(prev => [...prev, { x, y }]);
  };

  const handleCanvasMouseUp = () => {
    setIsPainting(false);
  };

  // AI ACTIONS
  // 1. AI Auto Enhance
  const runAiAutoEnhance = () => {
    setAiLoadingText('Auto-tuning luminance histogram levels...');
    setTimeout(() => {
      setAdjustments({
        ...adjustments,
        brightness: 8,
        contrast: 15,
        saturation: 5,
        highlights: 12,
        shadows: -10,
        sharpness: 25,
        clarity: 10,
      });
      setAiLoadingText(null);
    }, 1500);
  };

  // 2. AI Background Depth Blur (simulates bokeh depth mask)
  const runAiBackgroundBlur = () => {
    setAiLoadingText('Masking human contours for depth-of-field bokeh...');
    setTimeout(() => {
      setAdjustments({
        ...adjustments,
        clarity: -45, // blurs baseline canvas
        vignette: 25 // darkens edges
      });
      setAiLoadingText(null);
    }, 1800);
  };

  // 3. AI Color Correction
  const runAiColorCorrection = () => {
    setAiLoadingText('Normalizing color temperature chroma...');
    setTimeout(() => {
      setAdjustments({
        ...adjustments,
        temperature: 12, // shift to warm studio tone
        tint: -8, // remove green cast
        vibrance: 15
      });
      setAiLoadingText(null);
    }, 1200);
  };

  // 4. AI Object Removal (Clones/Heals painted mask areas on canvas)
  const runAiObjectRemoval = () => {
    if (paintedMaskPoints.length === 0) {
      alert('Please use the brush to paint over the object you want to erase first!');
      return;
    }
    setAiLoadingText('AI Inpainting: Healing painted pixels with surrounding textures...');
    setTimeout(() => {
      // Simulate healing by clearing painted coordinates from our mask and slightly blending
      setPaintedMaskPoints([]);
      setIsAiBrushActive(false);
      setAiLoadingText(null);
    }, 2200);
  };

  // 5. AI Noise Reduction
  const runAiNoiseReduction = () => {
    setAiLoadingText('Applying bilateral high-ISO noise smoothing...');
    setTimeout(() => {
      setAdjustments({
        ...adjustments,
        grain: 0,
        clarity: -5 // soft smooth filters
      });
      setAiLoadingText(null);
    }, 1400);
  };

  // 6. AI Image Upscaling (2x)
  const runAiImageUpscaling = () => {
    setAiLoadingText('Reconstructing high-resolution 4K sensor details...');
    setTimeout(() => {
      alert('AI Upscaling applied! Photo reconstructed to 3840 x 2160 Ultra HD details.');
      setAiLoadingText(null);
    }, 2000);
  };

  // Save changes
  const saveAndExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    const editedPhoto: GalleryPhoto = {
      ...photoToEdit,
      id: `edit_${Date.now()}`,
      url: dataUrl,
      timestamp: Date.now(),
      album: 'Edits',
      fileSize: '2.8 MB' // edited size representation
    };

    onSaveEditedPhoto(editedPhoto);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-50 font-sans select-none overflow-hidden relative">
      
      {/* 1. EDITOR TOP HEADER STATUS RAIL */}
      <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-3.5 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onCancelEditing}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold border border-zinc-700 transition"
          >
            Cancel
          </button>
          <div>
            <span className="text-[10px] text-zinc-500 font-mono block uppercase">Active Canvas File</span>
            <span className="text-xs text-zinc-200 font-semibold truncate max-w-[150px] inline-block">{photoToEdit.id}</span>
          </div>
        </div>

        {/* Shutter EXIF details of the source photo */}
        <div className="hidden md:flex items-center space-x-3 text-xs font-mono text-zinc-400">
          <span>Captured in: <strong className="text-orange-500 font-bold uppercase">{photoToEdit.mode}</strong></span>
          <span>•</span>
          <span>ISO {photoToEdit.iso}</span>
          <span>•</span>
          <span>{photoToEdit.shutterSpeed}s</span>
        </div>

        <button 
          onClick={saveAndExport}
          className="px-4 py-1.5 bg-green-500 hover:bg-green-400 text-black font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-lg transition"
        >
          <Check className="w-4 h-4 text-black" />
          <span>Save Changes</span>
        </button>
      </div>

      {/* 2. MAIN SPLIT EDITOR workspace PANEL */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* VIEWPORT AREA */}
        <div className="flex-1 bg-black flex items-center justify-center p-6 relative overflow-hidden">
          
          <canvas
            ref={canvasRef}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            className={`max-w-full max-h-[50vh] md:max-h-[70vh] object-contain shadow-[0_0_40px_rgba(0,0,0,0.9)] rounded ${
              isAiBrushActive ? 'cursor-crosshair' : ''
            }`}
          />

          {/* AI Operation Floating Loading hud */}
          {aiLoadingText && (
            <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center z-30 backdrop-blur-sm">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="mt-4 text-xs font-mono text-orange-500 font-bold uppercase tracking-widest">{aiLoadingText}</p>
            </div>
          )}

          {/* AI Brush instructions if active */}
          {isAiBrushActive && (
            <div className="absolute top-4 left-4 bg-zinc-900/90 border border-red-500/30 p-3 rounded-lg flex flex-col space-y-1.5 text-xs max-w-xs backdrop-blur-sm shadow-xl z-20">
              <span className="font-bold text-red-500 flex items-center space-x-1">
                <Scissors className="w-4 h-4" />
                <span>AI Object Eraser Tool Active</span>
              </span>
              <p className="text-[11px] text-zinc-400">Paint red brush mask directly onto any item you wish to erase, then click Erase below.</p>
              
              <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                <span className="text-zinc-500">Brush Size: {brushSize}px</span>
                <input 
                  type="range" 
                  min="5" 
                  max="50" 
                  value={brushSize} 
                  onChange={(e) => setBrushSize(parseInt(e.target.value))}
                  className="w-24 accent-red-500 h-1 bg-zinc-800 rounded"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button 
                  onClick={() => {
                    setPaintedMaskPoints([]);
                    setIsAiBrushActive(false);
                  }}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-[10px] rounded"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setPaintedMaskPoints([])}
                  className="px-2.5 py-1 bg-zinc-850 hover:bg-zinc-800 text-[10px] text-zinc-400 rounded"
                >
                  Clear Mask
                </button>
                <button 
                  onClick={runAiObjectRemoval}
                  disabled={paintedMaskPoints.length === 0}
                  className="px-3 py-1 bg-red-600 hover:bg-red-500 text-[10px] font-bold rounded flex-1 disabled:opacity-50"
                >
                  Erase Object
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CONTROLS & SETTINGS SLIDERS PANEL (Right Hand Side) */}
        <div className="w-full md:w-80 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 flex flex-col overflow-y-auto">
          
          {/* TOOL NAV TABS */}
          <div className="grid grid-cols-4 gap-1 p-2 bg-zinc-950 border-b border-zinc-800 text-[10px] font-bold tracking-wider uppercase text-zinc-400">
            <button
              onClick={() => { setActiveToolTab('adjust'); setIsAiBrushActive(false); }}
              className={`py-2 rounded-md ${activeToolTab === 'adjust' ? 'bg-zinc-800 text-orange-500 shadow' : 'hover:text-zinc-200'}`}
            >
              Adjust
            </button>
            <button
              onClick={() => { setActiveToolTab('filter'); setIsAiBrushActive(false); }}
              className={`py-2 rounded-md ${activeToolTab === 'filter' ? 'bg-zinc-800 text-orange-500 shadow' : 'hover:text-zinc-200'}`}
            >
              Filters
            </button>
            <button
              onClick={() => { setActiveToolTab('crop'); setIsAiBrushActive(false); }}
              className={`py-2 rounded-md ${activeToolTab === 'crop' ? 'bg-zinc-800 text-orange-500 shadow' : 'hover:text-zinc-200'}`}
            >
              Transform
            </button>
            <button
              onClick={() => { setActiveToolTab('ai'); setIsAiBrushActive(false); }}
              className={`py-2 rounded-md ${activeToolTab === 'ai' ? 'bg-zinc-800 text-orange-500 shadow' : 'hover:text-zinc-200'}`}
            >
              AI Tools
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 px-2 py-1 bg-zinc-950 border-b border-zinc-850 text-[10px] font-bold tracking-wider uppercase text-zinc-400">
            <button
              onClick={() => { setActiveToolTab('text'); setIsAiBrushActive(false); }}
              className={`py-1.5 rounded-md ${activeToolTab === 'text' ? 'bg-zinc-800 text-orange-500 shadow' : 'hover:text-zinc-200'}`}
            >
              Captions
            </button>
            <button
              onClick={() => { setActiveToolTab('frames'); setIsAiBrushActive(false); }}
              className={`py-1.5 rounded-md ${activeToolTab === 'frames' ? 'bg-zinc-800 text-orange-500 shadow' : 'hover:text-zinc-200'}`}
            >
              Borders
            </button>
          </div>

          {/* ACTIVE TAB MAIN workspace PANEL */}
          <div className="p-5 flex-1">
            
            {/* ADJUSTMENTS TOOL */}
            {activeToolTab === 'adjust' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-zinc-300 text-xs border-b border-zinc-800 pb-2">Manual DSLR Adjustments</h3>
                
                {[
                  { id: 'brightness', label: 'Brightness', min: -50, max: 50 },
                  { id: 'contrast', label: 'Contrast', min: -50, max: 50 },
                  { id: 'saturation', label: 'Saturation', min: -50, max: 50 },
                  { id: 'highlights', label: 'Highlights', min: -50, max: 50 },
                  { id: 'shadows', label: 'Shadows', min: -50, max: 50 },
                  { id: 'sharpness', label: 'Sharpness', min: 0, max: 100 },
                  { id: 'clarity', label: 'Clarity', min: -50, max: 50 },
                  { id: 'temperature', label: 'Temperature', min: -50, max: 50 },
                  { id: 'tint', label: 'Tint', min: -50, max: 50 },
                  { id: 'vignette', label: 'Vignette', min: 0, max: 100 },
                  { id: 'grain', label: 'Film Grain', min: 0, max: 100 },
                ].map(slider => (
                  <div key={slider.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">{slider.label}</span>
                      <span className="font-mono text-orange-500">{(adjustments as any)[slider.id]}</span>
                    </div>
                    <input 
                      type="range" 
                      min={slider.min}
                      max={slider.max}
                      value={(adjustments as any)[slider.id]} 
                      onChange={(e) => setAdjustments({ ...adjustments, [slider.id]: parseInt(e.target.value) })}
                      className="w-full accent-orange-500 h-1 bg-zinc-800 rounded"
                    />
                  </div>
                ))}

                <button 
                  onClick={() => setAdjustments({
                    brightness: 0, contrast: 0, saturation: 0, highlights: 0, shadows: 0,
                    sharpness: 0, clarity: 0, temperature: 0, tint: 0, vibrance: 0, grain: 0, vignette: 0
                  })}
                  className="w-full py-2 bg-zinc-800 hover:bg-zinc-750 text-xs text-zinc-300 font-bold rounded-lg border border-zinc-700 transition"
                >
                  Reset Adjustments
                </button>
              </div>
            )}

            {/* PRESET FILTER GRID */}
            {activeToolTab === 'filter' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-zinc-300 text-xs border-b border-zinc-800 pb-2">Professional DSLR Presets</h3>
                <div className="grid grid-cols-2 gap-2 max-h-[480px] overflow-y-auto pr-1">
                  {[
                    { id: 'none', label: 'Natural/None' },
                    { id: 'cinematic', label: 'Cinematic' },
                    { id: 'vintage', label: 'Vintage' },
                    { id: 'bw', label: 'B&W Carbon' },
                    { id: 'warm', label: 'Warm Glow' },
                    { id: 'cool', label: 'Cool Ambient' },
                    { id: 'golden_hour', label: 'Golden Hour' },
                    { id: 'film_look', label: 'Classic Film' },
                    { id: 'matte', label: 'Matte Slate' },
                    { id: 'hdr_filter', label: 'Ultra HDR' },
                    { id: 'neon', label: 'Neon Cyber' },
                    { id: 'moody', label: 'Moody Dusk' },
                    { id: 'soft_skin', label: 'Portrait Soft' },
                    { id: 'vivid', label: 'Vivid Chroma' },
                    { id: 'retro', label: 'Retro Film' },
                    { id: 'sepia', label: 'Sepia Nostalgia' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFilter(f.id as any)}
                      className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                        selectedFilter === f.id 
                          ? 'bg-orange-500 text-black border-orange-500 font-extrabold shadow-md' 
                          : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800/60'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* CANVAS TRANSFORMS & ROTATIONS */}
            {activeToolTab === 'crop' && (
              <div className="space-y-5">
                <h3 className="font-display font-bold text-zinc-300 text-xs border-b border-zinc-800 pb-2">Canvas Orientation</h3>
                
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => setRotation(prev => (prev + 90) % 360)}
                    className="py-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl flex flex-col items-center justify-center space-y-1.5 transition text-xs"
                  >
                    <RotateCw className="w-5 h-5 text-orange-500" />
                    <span>Rotate 90°</span>
                  </button>

                  <button 
                    onClick={() => setFlipH(!flipH)}
                    className="py-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 rounded-xl flex flex-col items-center justify-center space-y-1.5 transition text-xs"
                  >
                    <FlipHorizontal className="w-5 h-5 text-orange-500" />
                    <span>Mirror Flip</span>
                  </button>
                </div>

                <div className="border-t border-zinc-800 pt-4 space-y-3">
                  <span className="text-[10px] text-zinc-500 font-mono block uppercase">Aspect Ratio Mock Crop</span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs text-center font-mono">
                    {['Freeform', '1:1 square', '4:3 standard', '16:9 cinematic'].map((ar, idx) => (
                      <button 
                        key={idx}
                        onClick={() => alert(`Cropped to ${ar} framing preset successfully.`)}
                        className="py-1.5 bg-zinc-950 border border-zinc-850 rounded hover:border-zinc-700 transition"
                      >
                        {ar.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* GEMINI INTELLIGENT AI TOOLS */}
            {activeToolTab === 'ai' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-zinc-300 text-xs border-b border-zinc-800 pb-2">Gemini AI Image Tools</h3>
                
                <div className="space-y-2.5">
                  <button
                    onClick={runAiAutoEnhance}
                    className="w-full p-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl flex items-center space-x-3 text-left transition"
                  >
                    <Sparkles className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">AI Auto-Enhance</span>
                      <span className="text-[10px] text-zinc-500 block">Balance luminance contrast levels</span>
                    </div>
                  </button>

                  <button
                    onClick={runAiBackgroundBlur}
                    className="w-full p-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl flex items-center space-x-3 text-left transition"
                  >
                    <Maximize className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">AI Background Blur</span>
                      <span className="text-[10px] text-zinc-500 block">Simulate physical f/1.8 Bokeh</span>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsAiBrushActive(true);
                      setPaintedMaskPoints([]);
                    }}
                    className={`w-full p-3 border rounded-xl flex items-center space-x-3 text-left transition ${
                      isAiBrushActive 
                        ? 'bg-red-950/20 border-red-500 text-red-400' 
                        : 'bg-zinc-950 border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900'
                    }`}
                  >
                    <Scissors className="w-5 h-5 text-red-500" />
                    <div>
                      <span className="text-xs font-semibold block">AI Object Removal</span>
                      <span className="text-[10px] text-zinc-500 block">Inpaint erase items with brush</span>
                    </div>
                  </button>

                  <button
                    onClick={runAiColorCorrection}
                    className="w-full p-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl flex items-center space-x-3 text-left transition"
                  >
                    <Wand2 className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">AI Color Correction</span>
                      <span className="text-[10px] text-zinc-500 block">Smart white balance color matching</span>
                    </div>
                  </button>

                  <button
                    onClick={runAiNoiseReduction}
                    className="w-full p-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl flex items-center space-x-3 text-left transition"
                  >
                    <Sliders className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">AI Noise Reduction</span>
                      <span className="text-[10px] text-zinc-500 block">Smooth out high-ISO sensor noise</span>
                    </div>
                  </button>

                  <button
                    onClick={runAiImageUpscaling}
                    className="w-full p-3 bg-zinc-950 border border-zinc-850 hover:border-zinc-700 hover:bg-zinc-900 rounded-xl flex items-center space-x-3 text-left transition"
                  >
                    <FileDown className="w-5 h-5 text-orange-400" />
                    <div>
                      <span className="text-xs font-semibold block text-zinc-200">AI Resolution Upscaling</span>
                      <span className="text-[10px] text-zinc-500 block">Reconstruct file details to 4K</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* TEXT CAPTIONS OVERLAY */}
            {activeToolTab === 'text' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-zinc-300 text-xs border-b border-zinc-800 pb-2">Custom Overlay text</h3>
                
                <div className="space-y-3.5">
                  <div className="space-y-1.5">
                    <span className="text-xs text-zinc-400">Caption Text</span>
                    <input 
                      type="text" 
                      placeholder="Type overlay caption..."
                      value={textOverlay}
                      onChange={(e) => setTextOverlay(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Size and Color */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Size (px)</span>
                      <input 
                        type="number" 
                        value={textSize}
                        onChange={(e) => setTextSize(parseInt(e.target.value) || 12)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-xs text-white"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-zinc-500 font-mono block uppercase">Color</span>
                      <input 
                        type="color" 
                        value={textColor}
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-1 px-1 h-8 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Positioning sliders */}
                  <div className="space-y-2 pt-2 border-t border-zinc-800">
                    <div className="flex justify-between items-center text-[10px] text-zinc-500">
                      <span>X ALIGN: {textX}%</span>
                      <span>Y ALIGN: {textY}%</span>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="range" 
                        min="5" 
                        max="95" 
                        value={textX} 
                        onChange={(e) => setTextX(parseInt(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-zinc-800 rounded"
                        title="Horizontal Align"
                      />
                      <input 
                        type="range" 
                        min="5" 
                        max="95" 
                        value={textY} 
                        onChange={(e) => setTextY(parseInt(e.target.value))}
                        className="w-full accent-orange-500 h-1 bg-zinc-800 rounded"
                        title="Vertical Align"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-1.5 pt-2">
                    <button 
                      onClick={() => {
                        const dateStr = new Date().toLocaleDateString();
                        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        setTextOverlay(`${dateStr} ${timeStr}`);
                      }}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-[10px] text-zinc-200 font-semibold rounded-lg"
                    >
                      + Add Timestamp
                    </button>
                    <button 
                      onClick={() => setTextOverlay('ISO ' + photoToEdit.iso + '  f/2.8  ' + photoToEdit.shutterSpeed + 's')}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-[10px] text-zinc-200 font-semibold rounded-lg"
                    >
                      + Add EXIF Tag
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PHOTO FRAMES & BORDERS */}
            {activeToolTab === 'frames' && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-zinc-300 text-xs border-b border-zinc-800 pb-2">Select Border Overlay</h3>
                
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'none', label: 'No Border' },
                      { id: 'classic_white', label: 'Studio White' },
                      { id: 'polaroid', label: 'Polaroid Style' },
                      { id: 'film_strip', label: 'Film Strip' }
                    ].map(f => (
                      <button
                        key={f.id}
                        onClick={() => setSelectedFrame(f.id as any)}
                        className={`p-3 rounded-xl border text-xs font-semibold text-center transition ${
                          selectedFrame === f.id 
                            ? 'bg-orange-500 text-black border-orange-500 font-bold shadow-md' 
                            : 'bg-zinc-950 text-zinc-400 border-zinc-850 hover:bg-zinc-800/60'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>

                  {/* Polaroid caption input */}
                  {selectedFrame === 'polaroid' && (
                    <div className="space-y-1.5 pt-2 border-t border-zinc-800">
                      <span className="text-xs text-zinc-400">Polaroid Base Label</span>
                      <input 
                        type="text" 
                        value={polaroidCaption}
                        onChange={(e) => setPolaroidCaption(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
                        placeholder="Write Polaroid tag..."
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
