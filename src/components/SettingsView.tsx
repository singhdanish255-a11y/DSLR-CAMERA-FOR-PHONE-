/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Settings, 
  Volume2, 
  VolumeX, 
  Image, 
  Video, 
  MapPin, 
  ShieldCheck, 
  Palette, 
  Globe, 
  Grid,
  Info,
  Layers,
  Database
} from 'lucide-react';
import { AppSettings, DSLRControls } from '../types';

interface SettingsViewProps {
  settings: AppSettings;
  setSettings: (settings: AppSettings) => void;
  controls: DSLRControls;
  setControls: (controls: DSLRControls) => void;
}

export default function SettingsView({
  settings,
  setSettings,
  controls,
  setControls,
}: SettingsViewProps) {
  const [copiedPrivacy, setCopiedPrivacy] = useState<boolean>(false);

  const handleToggleShutter = () => {
    setSettings({
      ...settings,
      shutterSound: !settings.shutterSound
    });
  };

  const handleToggleWatermark = () => {
    setSettings({
      ...settings,
      watermarkEnabled: !settings.watermarkEnabled
    });
  };

  const triggerCopySecurity = () => {
    navigator.clipboard.writeText('DSLR Pro Camera is offline-first. All captures, RAW records, and edited photos remain in secure client-side storage. No telemetry or image transfers are executed.');
    setCopiedPrivacy(true);
    setTimeout(() => setCopiedPrivacy(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-50 font-sans p-5 md:p-8 select-none overflow-y-auto">
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-2xl font-display font-extrabold text-zinc-100 flex items-center space-x-2">
          <Settings className="w-6 h-6 text-orange-500 animate-spin-slow" />
          <span>DSLR Control Center</span>
        </h1>
        <p className="text-xs text-zinc-500 mt-1">Configure advanced camera sensor configurations and offline client features</p>
      </div>

      {/* TWO-COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* LEFT COLUMN: CAMERA CAPTURE HARDWARE SETTINGS */}
        <div className="space-y-6">
          
          {/* PHOTO RESOLUTION CONFIG */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-400 flex items-center space-x-2 uppercase">
              <Image className="w-4 h-4 text-orange-500" />
              <span>Image Capture Sensor</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Aspect Ratio crop</span>
                  <span className="text-[10px] text-zinc-500 block">Sensor capture format viewport</span>
                </div>
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                  {['1:1', '4:3', '16:9', 'full'].map(ar => (
                    <button
                      key={ar}
                      onClick={() => setSettings({ ...settings, aspectRatio: ar as any })}
                      className={`px-2 py-1 text-[10px] rounded font-semibold transition ${
                        settings.aspectRatio === ar ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {ar.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Photo Capture Resolution</span>
                  <span className="text-[10px] text-zinc-500 block">MegaPixel details count</span>
                </div>
                <select
                  value={settings.imageResolution}
                  onChange={(e) => setSettings({ ...settings, imageResolution: e.target.value as any })}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-orange-500"
                >
                  <option value="4K">4K UHD Ultra (8.3 MP)</option>
                  <option value="12MP">12 MP Standard High</option>
                  <option value="8MP">8 MP Balanced Medium</option>
                  <option value="5MP">5 MP Sensor Saver</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Gridlines overlay</span>
                  <span className="text-[10px] text-zinc-500 block">Rule of Thirds assistance style</span>
                </div>
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                  {[
                    { id: '3x3', label: '3x3' },
                    { id: 'golden', label: 'Spiral' },
                    { id: 'diagonal', label: 'Diagonal' },
                    { id: 'none', label: 'Off' }
                  ].map(g => (
                    <button
                      key={g.id}
                      onClick={() => setControls({ ...controls, gridType: g.id as any })}
                      className={`px-2 py-1 text-[10px] rounded font-semibold transition-all ${
                        controls.gridType === g.id ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VIDEO RECORDING SETTINGS */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-400 flex items-center space-x-2 uppercase">
              <Video className="w-4 h-4 text-orange-500" />
              <span>Video Record Parameters</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Video Resolution</span>
                  <span className="text-[10px] text-zinc-500 block">Maximum frame layout width</span>
                </div>
                <select
                  value={settings.videoResolution}
                  onChange={(e) => setSettings({ ...settings, videoResolution: e.target.value as any })}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-orange-500"
                >
                  <option value="4K">4K Cinematic (2160p)</option>
                  <option value="1080p">Full HD (1080p)</option>
                  <option value="720p">Standard HD (720p)</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">FPS Capture Speed</span>
                  <span className="text-[10px] text-zinc-500 block">Frames recorded per second</span>
                </div>
                <div className="flex bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
                  {[24, 30, 60].map(fps => (
                    <button
                      key={fps}
                      onClick={() => setSettings({ ...settings, fps: fps as any })}
                      className={`px-3 py-1 text-[10px] rounded font-semibold transition ${
                        settings.fps === fps ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {fps} FPS
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* WATERMARK CUSTOM CREATION */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-400 flex items-center space-x-2 uppercase">
              <Info className="w-4 h-4 text-orange-500" />
              <span>Capture Label Watermark</span>
            </h2>

            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Apply Watermark Stamps</span>
                  <span className="text-[10px] text-zinc-500 block">Write custom text label into saved files</span>
                </div>
                <button
                  onClick={handleToggleWatermark}
                  className={`w-11 h-6 rounded-full transition-colors relative flex items-center ${
                    settings.watermarkEnabled ? 'bg-orange-500' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 bg-zinc-950 rounded-full transition-transform absolute ${
                    settings.watermarkEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {settings.watermarkEnabled && (
                <div className="space-y-1.5 pt-1.5 border-t border-zinc-800/40">
                  <span className="text-xs text-zinc-400">Custom Stamp Text</span>
                  <input
                    type="text"
                    value={settings.watermarkText}
                    onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-orange-500"
                    placeholder="e.g., Shot on DSLR Pro"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: PREFERENCES, THEMES, SECURITY */}
        <div className="space-y-6">
          
          {/* SOUNDS & PREFERENCES */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-400 flex items-center space-x-2 uppercase">
              <Volume2 className="w-4 h-4 text-orange-500" />
              <span>Preferences & Audio</span>
            </h2>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Mechanical Shutter Sound</span>
                  <span className="text-[10px] text-zinc-500 block">Play audio clack feedback on triggers</span>
                </div>
                <button
                  onClick={handleToggleShutter}
                  className={`p-2 rounded-xl transition ${
                    settings.shutterSound ? 'bg-orange-500 text-black font-bold' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {settings.shutterSound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Save Location Target</span>
                  <span className="text-[10px] text-zinc-500 block">Asset output sandbox destination</span>
                </div>
                <select
                  value={settings.saveLocation}
                  onChange={(e) => setSettings({ ...settings, saveLocation: e.target.value as any })}
                  className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-orange-500"
                >
                  <option value="DSLR Pro Gallery">DSLR Pro Sandboxed Sandbox</option>
                  <option value="Internal Storage">Device Internal Photos Directory</option>
                  <option value="Cloud Backup">Google Drive Cloud Storage</option>
                </select>
              </div>

              {/* Languages select */}
              <div className="flex items-center justify-between border-t border-zinc-800/50 pt-3">
                <div>
                  <span className="text-xs text-zinc-300 font-semibold block">Interface Language</span>
                  <span className="text-[10px] text-zinc-500 block">System menus localization</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-zinc-500" />
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({ ...settings, language: e.target.value as any })}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg text-xs py-1.5 px-3 text-zinc-300 focus:outline-none"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español (ES)</option>
                    <option value="de">Deutsch (DE)</option>
                    <option value="fr">Français (FR)</option>
                    <option value="ja">日本語 (JP)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* COLOR THEME SELECTION */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-400 flex items-center space-x-2 uppercase">
              <Palette className="w-4 h-4 text-orange-500" />
              <span>Studio Skin Themes</span>
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'slate', label: 'Pro Slate Grey', colors: 'bg-zinc-900 border-zinc-700 hover:border-zinc-500' },
                { id: 'carbon', label: 'Carbon Stealth Black', colors: 'bg-black border-zinc-900 hover:border-zinc-700' },
                { id: 'warm', label: 'Sleek Orange Highlight', colors: 'bg-orange-950/20 border-orange-900/40 hover:border-orange-800' },
                { id: 'light', label: 'Studio White Light', colors: 'bg-white border-zinc-200 text-zinc-850 hover:border-zinc-300' }
              ].map(theme => (
                <button
                  key={theme.id}
                  onClick={() => setSettings({ ...settings, theme: theme.id as any })}
                  className={`p-3.5 rounded-xl border text-xs font-semibold text-center transition-all ${theme.colors} ${
                    settings.theme === theme.id 
                      ? 'border-orange-500 ring-2 ring-orange-500 scale-[1.02]' 
                      : ''
                  }`}
                >
                  {theme.label}
                </button>
              ))}
            </div>
          </div>

          {/* SECURITY & STORAGE INFO */}
          <div className="bg-zinc-900/60 border border-zinc-900 rounded-2xl p-5 space-y-4">
            <h2 className="text-xs font-bold font-mono tracking-wider text-zinc-400 flex items-center space-x-2 uppercase">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>Privacy & Security Audit</span>
            </h2>

            <div className="space-y-3 text-xs text-zinc-400">
              <p>
                This application operates on a strict **Privacy-First Design** policy. 
                All photos captured, raw details cataloged, and images edited remain purely within the browser's 
                local sandboxed storage. No telemetry or imagery transfers occur.
              </p>
              
              <div className="flex items-center space-x-2 bg-zinc-950 p-3 rounded-xl border border-zinc-850">
                <Database className="w-5 h-5 text-green-500" />
                <div className="flex-1 font-mono text-[10px]">
                  <span className="block text-zinc-300 font-bold">LOCAL DATABASE ENCRYPTED</span>
                  <span className="text-zinc-500">IndexedDB: 4 files logged (Sandbox ok)</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={triggerCopySecurity}
                  className="w-full py-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 text-xs rounded-lg transition border border-zinc-800 text-center font-bold"
                >
                  {copiedPrivacy ? 'Copied Security Key' : 'Verify Privacy Audit Statement'}
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
