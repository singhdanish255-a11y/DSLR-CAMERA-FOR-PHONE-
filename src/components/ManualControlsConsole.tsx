/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sliders, Camera, Grid, Eye, Compass, ShieldAlert, FileCode } from 'lucide-react';
import { DSLRControls, CameraMode } from '../types';

interface ManualControlsConsoleProps {
  controls: DSLRControls;
  setControls: (ctrls: DSLRControls) => void;
  activeMode: CameraMode;
  setActiveMode: (mode: CameraMode) => void;
}

export default function ManualControlsConsole({
  controls,
  setControls,
  activeMode,
  setActiveMode,
}: ManualControlsConsoleProps) {
  
  // Available mode dials
  const modeDials: { id: CameraMode; label: string; icon: string }[] = [
    { id: 'auto', label: 'AUTO Mode', icon: '📷' },
    { id: 'pro', label: 'PRO DSLR', icon: '⚙️' },
    { id: 'portrait', label: 'Portrait', icon: '👤' },
    { id: 'night', label: 'Night Shot', icon: '🌙' },
    { id: 'hdr', label: 'Smart HDR', icon: '🔆' },
    { id: 'panorama', label: 'Panorama', icon: '🏔️' },
    { id: 'macro', label: 'Macro Focal', icon: '🌸' },
    { id: 'food', label: 'Food Mode', icon: '🍔' },
    { id: 'landscape', label: 'Landscape', icon: '🏞️' },
    { id: 'sports', label: 'Sports Burst', icon: '🏃' },
    { id: 'long_exposure', label: 'Long Exp', icon: '⚡' },
    { id: 'time_lapse', label: 'Time-Lapse', icon: '⏳' },
    { id: 'slow_motion', label: 'Slow Mo', icon: '🐢' },
    { id: 'qr_scanner', label: 'QR Scanner', icon: '🔍' },
    { id: 'document_scanner', label: 'Doc Scan', icon: '📄' },
  ];

  const isoOptions: DSLRControls['iso'][] = ['auto', 100, 200, 400, 800, 1600, 3200, 6400];
  const shutterOptions: DSLRControls['shutterSpeed'][] = [
    'auto', '1/4000', '1/2000', '1/1000', '1/500', '1/250', '1/125', '1/60', '1/30', '1/15', '1/8', '1/4', '1/2', '1s', '2s', '4s', '8s'
  ];
  const wbOptions: DSLRControls['whiteBalance'][] = ['auto', 'daylight', 'cloudy', 'shade', 'tungsten', 'fluorescent'];

  return (
    <div id="dslr-manual-console" className="bg-[#050505] border-t border-white/10 p-5 space-y-4 text-zinc-350 font-sans select-none">
      
      {/* 1. SCROLLABLE DSLR PHYSICAL MODE DIAL */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">DSLR Main Mode Dial Wheel</span>
          <span className="text-xs text-orange-500 font-semibold uppercase">{activeMode.replace('_', ' ')} ACTIVE</span>
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {modeDials.map(dial => (
            <button
              key={dial.id}
              onClick={() => setActiveMode(dial.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center space-x-1.5 border ${
                activeMode === dial.id 
                  ? 'bg-orange-500 text-zinc-950 border-orange-500 font-extrabold shadow-[0_0_12px_rgba(249,115,22,0.3)] scale-105' 
                  : 'bg-zinc-900/60 text-zinc-400 border-white/5 hover:border-zinc-700'
              }`}
            >
              <span>{dial.icon}</span>
              <span>{dial.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. PRO CONTROLS: Only expanded if mode is 'pro' or 'auto' (the custom modes) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
        
        {/* ISO CLICK WHEEL */}
        <div className="bg-zinc-900/20 p-3 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">ISO Sensitivity</span>
            <span className="text-xs font-mono text-orange-500 font-semibold uppercase">{controls.iso === 'auto' ? 'Auto ISO' : `ISO ${controls.iso}`}</span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto py-1.5 scrollbar-none scroll-smooth">
            {isoOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setControls({ ...controls, iso: opt })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  controls.iso === opt 
                    ? 'bg-zinc-900 text-white border-orange-500/50 font-bold shadow' 
                    : 'bg-black text-zinc-500 border-white/5 hover:text-zinc-300'
                }`}
              >
                {opt === 'auto' ? 'AUTO' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* SHUTTER SPEED SPEED WHEEL */}
        <div className="bg-zinc-900/20 p-3 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Shutter Interval</span>
            <span className="text-xs font-mono text-orange-500 font-semibold uppercase">{controls.shutterSpeed === 'auto' ? 'Auto Sec' : `${controls.shutterSpeed}s`}</span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto py-1.5 scrollbar-none">
            {shutterOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setControls({ ...controls, shutterSpeed: opt })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  controls.shutterSpeed === opt 
                    ? 'bg-zinc-900 text-white border-orange-500/50 font-bold shadow' 
                    : 'bg-black text-zinc-500 border-white/5 hover:text-zinc-300'
                }`}
              >
                {opt === 'auto' ? 'AUTO' : opt}
              </button>
            ))}
          </div>
        </div>

        {/* WHITE BALANCE presets */}
        <div className="bg-zinc-900/20 p-3 rounded-2xl border border-white/5 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Chroma White Balance</span>
            <span className="text-xs font-mono text-orange-500 font-semibold uppercase">{controls.whiteBalance}</span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto py-1.5 scrollbar-none">
            {wbOptions.map(opt => (
              <button
                key={opt}
                onClick={() => setControls({ ...controls, whiteBalance: opt })}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
                  controls.whiteBalance === opt 
                    ? 'bg-zinc-900 text-white border-orange-500/50 font-bold shadow' 
                    : 'bg-black text-zinc-500 border-white/5 hover:text-zinc-300'
                }`}
              >
                {opt === 'auto' ? 'AUTO' : opt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* 3. HARDWARE TOGGLES: Focus Peaking, Zebra, RAW format, Leveler, Focus Slider */}
      <div className="bg-zinc-900/10 p-4 rounded-2xl border border-white/5 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        
        {/* Manual Focus slider */}
        <div className="md:col-span-2 space-y-1.5 border-r border-white/5 pr-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-400 font-medium">Manual Lens Focus</span>
            <span className="font-mono text-orange-500 font-semibold">
              {controls.focus === 'auto' ? 'Auto Autofocus' : `${controls.focus} mm`}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setControls({ ...controls, focus: controls.focus === 'auto' ? 50 : 'auto' })}
              className={`px-3 py-1 text-[10px] font-bold font-mono rounded border transition-all ${
                controls.focus === 'auto' 
                  ? 'bg-orange-500 text-zinc-950 border-orange-500' 
                  : 'bg-zinc-850 text-zinc-400 border-zinc-800 hover:text-zinc-200'
              }`}
            >
              AF LOCK
            </button>
            <input 
              type="range" 
              min="0" 
              max="100" 
              disabled={controls.focus === 'auto'}
              value={controls.focus === 'auto' ? 75 : controls.focus} 
              onChange={(e) => setControls({ ...controls, focus: parseInt(e.target.value) })}
              className="flex-1 accent-orange-500 h-1 bg-zinc-800 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        {/* HUD Overlay switches */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pl-2">
          
          {/* Level Toggle */}
          <button
            onClick={() => setControls({ ...controls, levelEnabled: !controls.levelEnabled })}
            className={`p-2.5 rounded-xl border flex flex-col items-center space-y-1 transition ${
              controls.levelEnabled ? 'bg-zinc-905 border-orange-500/50 text-white' : 'bg-black border-white/5 text-zinc-500'
            }`}
            title="Horizon Level Indicator"
          >
            <Compass className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-semibold">Virtual Level</span>
          </button>

          {/* Focus Peaking Toggle */}
          <button
            onClick={() => setControls({ ...controls, peakingEnabled: !controls.peakingEnabled })}
            className={`p-2.5 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
              controls.peakingEnabled ? 'bg-zinc-905 border-orange-500/50 text-white' : 'bg-black border-white/5 text-zinc-500'
            }`}
            title="Green high-contrast focus peaking"
          >
            <Eye className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-semibold">Peaking AF</span>
          </button>

          {/* Zebra Toggle */}
          <button
            onClick={() => setControls({ ...controls, zebraEnabled: !controls.zebraEnabled })}
            className={`p-2.5 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
              controls.zebraEnabled ? 'bg-zinc-905 border-orange-500/50 text-white' : 'bg-black border-white/5 text-zinc-500'
            }`}
            title="Overexposure hazard warnings"
          >
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-semibold">Zebra Exp</span>
          </button>

          {/* RAW Capture Toggle */}
          <button
            onClick={() => setControls({ ...controls, rawEnabled: !controls.rawEnabled })}
            className={`p-2.5 rounded-xl border flex flex-col items-center space-y-1 transition-all ${
              controls.rawEnabled ? 'bg-zinc-905 border-orange-500/50 text-white' : 'bg-black border-white/5 text-zinc-500'
            }`}
            title="Saves high-latitude uncompressed DNG file"
          >
            <FileCode className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-semibold">RAW DNG</span>
          </button>

        </div>

      </div>

    </div>
  );
}
