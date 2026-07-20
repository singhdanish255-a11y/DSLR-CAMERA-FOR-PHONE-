/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Camera, 
  FolderOpen, 
  Sliders, 
  Settings as SettingsIcon,
  Sparkles,
  Heart
} from 'lucide-react';
import { 
  CameraMode, 
  DSLRControls, 
  GalleryPhoto, 
  AppSettings 
} from './types';
import { generateSamplePhotos } from './lib/photoUtils';
import CameraView from './components/CameraView';
import GalleryView from './components/GalleryView';
import EditorView from './components/EditorView';
import SettingsView from './components/SettingsView';
import ManualControlsConsole from './components/ManualControlsConsole';

export default function App() {
  // 1. Core DSLR Controls State
  const [controls, setControls] = useState<DSLRControls>({
    iso: 'auto',
    shutterSpeed: 'auto',
    whiteBalance: 'auto',
    exposureComp: 0.0,
    focus: 'auto',
    zoom: 1.0,
    rawEnabled: false,
    gridType: '3x3',
    levelEnabled: true,
    peakingEnabled: false,
    zebraEnabled: false,
  });

  // 2. Core App Configuration settings
  const [settings, setSettings] = useState<AppSettings>({
    imageResolution: '12MP',
    videoResolution: '1080p',
    fps: 30,
    aspectRatio: '16:9',
    saveLocation: 'DSLR Pro Gallery',
    watermarkEnabled: false,
    watermarkText: 'Shot on DSLR Pro',
    shutterSound: true,
    theme: 'slate',
    language: 'en',
  });

  // 3. active Mode dial (Auto, Pro, portrait, night, food, sports, etc.)
  const [activeMode, setActiveMode] = useState<CameraMode>('auto');

  // 4. Photos Catalog Database State
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);

  // 5. Active Tab bottom navigation: 'camera' | 'gallery' | 'editor' | 'settings'
  const [activeTab, setActiveTab] = useState<'camera' | 'gallery' | 'editor' | 'settings'>('camera');

  // 6. Active photo file loaded inside the Photo Editor
  const [photoToEdit, setPhotoToEdit] = useState<GalleryPhoto | null>(null);

  // Initialize and load state
  useEffect(() => {
    // Attempt local storage fetch
    const storedPhotos = localStorage.getItem('dslr_pro_photos');
    const storedSettings = localStorage.getItem('dslr_pro_settings');
    const storedControls = localStorage.getItem('dslr_pro_controls');

    if (storedPhotos) {
      try {
        setPhotos(JSON.parse(storedPhotos));
      } catch (e) {
        setPhotos(generateSamplePhotos());
      }
    } else {
      // Seed initial beautiful catalog data so the gallery looks loaded right away!
      const initialSeed = generateSamplePhotos();
      setPhotos(initialSeed);
      localStorage.setItem('dslr_pro_photos', JSON.stringify(initialSeed));
    }

    if (storedSettings) {
      try { setSettings(JSON.parse(storedSettings)); } catch (e) {}
    }
    if (storedControls) {
      try { setControls(JSON.parse(storedControls)); } catch (e) {}
    }
  }, []);

  // Sync photo catalog database back to localstorage on edits
  const syncPhotos = (updatedPhotos: GalleryPhoto[]) => {
    setPhotos(updatedPhotos);
    localStorage.setItem('dslr_pro_photos', JSON.stringify(updatedPhotos));
  };

  // Capture callback: appends a new photo to our catalog and flashes brief confirmation
  const handlePhotoCaptured = (newPhoto: GalleryPhoto) => {
    // Support Watermark branding
    if (settings.watermarkEnabled && settings.watermarkText) {
      // (In real canvas captured image, we overlay watermark in canvas, simulated here)
      newPhoto.fileSize = `${newPhoto.fileSize} (Watermarked)`;
    }
    const updated = [newPhoto, ...photos];
    syncPhotos(updated);
  };

  // Gallery Callbacks
  const handleDeletePhoto = (id: string) => {
    const updated = photos.filter(p => p.id !== id);
    syncPhotos(updated);
  };

  const handleToggleFavorite = (id: string) => {
    const updated = photos.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p);
    syncPhotos(updated);
  };

  const handleRenamePhoto = (id: string, newAlbumName: string) => {
    const updated = photos.map(p => p.id === id ? { ...p, album: newAlbumName } : p);
    syncPhotos(updated);
  };

  // Opens any gallery photo in our built-in Photo Editor, switching tabs seamlessly
  const handleSendToEditor = (photo: GalleryPhoto) => {
    setPhotoToEdit(photo);
    setActiveTab('editor');
  };

  // Save edited photo back to catalog database
  const handleSaveEditedPhoto = (newPhoto: GalleryPhoto) => {
    // Prepend to catalog so it appears first in the Edits album
    const updated = [newPhoto, ...photos];
    syncPhotos(updated);
    setPhotoToEdit(null);
    setActiveTab('gallery'); // return to gallery to see the edited result!
  };

  // Sync App Settings
  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    localStorage.setItem('dslr_pro_settings', JSON.stringify(newSettings));
  };

  // Sync Hardware Controls
  const handleUpdateControls = (newControls: DSLRControls) => {
    setControls(newControls);
    localStorage.setItem('dslr_pro_controls', JSON.stringify(newControls));
  };

  // Dynamic Theme Styling Variables Matching user selected skins
  const getThemeClassNames = () => {
    switch (settings.theme) {
      case 'carbon':
        return 'bg-black text-zinc-100 selection:bg-zinc-800';
      case 'warm':
        return 'bg-[#050505] text-orange-50 selection:bg-orange-950/40';
      case 'light':
        return 'bg-zinc-50 text-zinc-900 selection:bg-zinc-200';
      case 'slate':
      default:
        return 'bg-[#050505] text-[#F0F0F0] selection:bg-zinc-800';
    }
  };

  const getCardThemeClasses = () => {
    if (settings.theme === 'light') {
      return 'bg-white border-zinc-200 text-zinc-800';
    }
    return 'bg-zinc-900/90 border-white/10 text-[#F0F0F0]';
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-0 md:p-4 bg-zinc-950/60 font-sans transition-colors duration-300 ${getThemeClassNames()}`}>
      
      {/* MOBILE DEVICE CONTAINER MOCKUP VIEWPORT */}
      <div 
        id="dslr-main-container"
        className="w-full max-w-[1100px] h-screen md:h-[860px] md:max-h-[92vh] md:rounded-3xl md:shadow-[0_0_80px_rgba(0,0,0,0.95)] md:border border-white/10 flex flex-col justify-between overflow-hidden relative"
        style={{
          backgroundColor: settings.theme === 'light' ? '#f4f4f5' : '#050505',
        }}
      >
        
        {/* VIEWPORT CONTENT HUB */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* CAMERA TAB */}
          {activeTab === 'camera' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <CameraView 
                controls={controls}
                setControls={handleUpdateControls}
                settings={settings}
                onPhotoCaptured={handlePhotoCaptured}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
              />
              {/* Manual tactile dials console bar drawn below viewfinder */}
              <ManualControlsConsole 
                controls={controls}
                setControls={handleUpdateControls}
                activeMode={activeMode}
                setActiveMode={setActiveMode}
              />
            </div>
          )}

          {/* GALLERY TAB */}
          {activeTab === 'gallery' && (
            <div className="flex-1 overflow-hidden">
              <GalleryView 
                photos={photos}
                onDeletePhoto={handleDeletePhoto}
                onToggleFavorite={handleToggleFavorite}
                onRenamePhoto={handleRenamePhoto}
                onSendToEditor={handleSendToEditor}
              />
            </div>
          )}

          {/* EDITOR TAB */}
          {activeTab === 'editor' && (
            <div className="flex-1 overflow-hidden">
              <EditorView 
                photoToEdit={photoToEdit}
                onSaveEditedPhoto={handleSaveEditedPhoto}
                onCancelEditing={() => {
                  setPhotoToEdit(null);
                  setActiveTab('gallery');
                }}
              />
            </div>
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-hidden">
              <SettingsView 
                settings={settings}
                setSettings={handleUpdateSettings}
                controls={controls}
                setControls={handleUpdateControls}
              />
            </div>
          )}
        </div>

        {/* BOTTOM GLOBAL GLASS NAVIGATION BAR */}
        <nav 
          id="dslr-global-navbar"
          className={`px-6 py-4 border-t flex items-center justify-around z-30 relative backdrop-blur-md ${
            settings.theme === 'light' 
              ? 'bg-white/95 border-zinc-200 text-zinc-500' 
              : 'bg-black/85 border-white/10 text-zinc-400'
          }`}
        >
          {/* CAMERA BUTTON */}
          <button
            id="nav-tab-camera"
            onClick={() => setActiveTab('camera')}
            className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${
              activeTab === 'camera' 
                ? 'text-orange-500 font-bold scale-110' 
                : 'hover:text-zinc-200'
            }`}
          >
            <Camera className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">Camera</span>
            {activeTab === 'camera' && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full absolute -bottom-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            )}
          </button>

          {/* GALLERY BUTTON */}
          <button
            id="nav-tab-gallery"
            onClick={() => setActiveTab('gallery')}
            className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${
              activeTab === 'gallery' 
                ? 'text-orange-500 font-bold scale-110' 
                : 'hover:text-zinc-200'
            }`}
          >
            <FolderOpen className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">Gallery</span>
            {photos.length > 0 && (
              <span className="absolute -top-1 right-2 bg-orange-500 text-zinc-950 text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-zinc-950">
                {photos.length}
              </span>
            )}
            {activeTab === 'gallery' && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full absolute -bottom-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            )}
          </button>

          {/* PRO PHOTO EDITOR BUTTON */}
          <button
            id="nav-tab-editor"
            onClick={() => setActiveTab('editor')}
            className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${
              activeTab === 'editor' 
                ? 'text-orange-500 font-bold scale-110' 
                : 'hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">Editor</span>
            {photoToEdit ? (
              <span className="absolute -top-1 -right-1 bg-green-500 text-black text-[7px] font-mono font-bold px-1 rounded-full uppercase border border-zinc-950 animate-pulse">
                Draft
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 bg-zinc-800 text-zinc-500 text-[8px] px-1 rounded-full border border-zinc-950">
                Idle
              </span>
            )}
            {activeTab === 'editor' && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full absolute -bottom-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            )}
          </button>

          {/* SETTINGS BUTTON */}
          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center space-y-1 transition-all duration-300 relative ${
              activeTab === 'settings' 
                ? 'text-orange-500 font-bold scale-110' 
                : 'hover:text-zinc-200'
            }`}
          >
            <SettingsIcon className="w-5.5 h-5.5" />
            <span className="text-[10px] tracking-wider uppercase font-semibold">Settings</span>
            {activeTab === 'settings' && (
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full absolute -bottom-2 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
            )}
          </button>
        </nav>

      </div>
    </div>
  );
}
