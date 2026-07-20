/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  Heart, 
  Trash2, 
  Edit3, 
  Share2, 
  Play, 
  X, 
  Maximize2, 
  Info, 
  Search, 
  FileImage,
  Star,
  Download,
  FolderOpen
} from 'lucide-react';
import { GalleryPhoto } from '../types';

interface GalleryViewProps {
  photos: GalleryPhoto[];
  onDeletePhoto: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onRenamePhoto: (id: string, newAlbumName: string) => void;
  onSendToEditor: (photo: GalleryPhoto) => void;
}

export default function GalleryView({
  photos,
  onDeletePhoto,
  onToggleFavorite,
  onRenamePhoto,
  onSendToEditor
}: GalleryViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'captures' | 'raw' | 'edits' | 'favorites'>('all');
  const [isSlideshowActive, setIsSlideshowActive] = useState<boolean>(false);
  const [slideshowIndex, setSlideshowIndex] = useState<number>(0);
  const [showMetadataPanel, setShowMetadataPanel] = useState<boolean>(false);
  const [renameInputId, setRenameInputId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');

  // Filtering photos based on Search Query and Categories
  const filteredPhotos = photos.filter(p => {
    // 1. Search Query
    const matchesSearch = p.album.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.mode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          new Date(p.timestamp).toLocaleDateString().includes(searchQuery);

    if (!matchesSearch) return false;

    // 2. Active Tab Filters
    if (activeFilter === 'all') return true;
    if (activeFilter === 'captures') return p.album === 'Captures';
    if (activeFilter === 'raw') return p.isRaw === true || p.album === 'RAW';
    if (activeFilter === 'edits') return p.album === 'Edits';
    if (activeFilter === 'favorites') return p.isFavorite === true;

    return true;
  });

  // Share simulation
  const handleShare = (photo: GalleryPhoto) => {
    try {
      if (navigator.share) {
        navigator.share({
          title: 'Captured with DSLR Pro Camera',
          text: `Check out my photo! ISO ${photo.iso}, ${photo.shutterSpeed}s, Mode: ${photo.mode}`,
          url: photo.url,
        });
      } else {
        navigator.clipboard.writeText(photo.url);
        alert('Photo URL copied to clipboard! (Sharing simulated)');
      }
    } catch (e) {
      alert('Photo URL copied to clipboard!');
    }
  };

  // Slideshow trigger
  const startSlideshow = () => {
    if (filteredPhotos.length === 0) return;
    setSlideshowIndex(0);
    setIsSlideshowActive(true);
    
    const interval = setInterval(() => {
      setSlideshowIndex(prev => {
        if (prev >= filteredPhotos.length - 1) {
          return 0; // Loop
        }
        return prev + 1;
      });
    }, 3000);

    (window as any).slideshowInterval = interval;
  };

  const stopSlideshow = () => {
    setIsSlideshowActive(false);
    if ((window as any).slideshowInterval) {
      clearInterval((window as any).slideshowInterval);
    }
  };

  const handleRenameSubmit = (id: string) => {
    if (renameValue.trim()) {
      onRenamePhoto(id, renameValue.trim());
    }
    setRenameInputId(null);
    setRenameValue('');
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-50 font-sans p-4 md:p-6 select-none overflow-y-auto">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-zinc-100 flex items-center space-x-2">
            <FolderOpen className="w-6 h-6 text-orange-500" />
            <span>Built-in DSLR Gallery</span>
          </h1>
          <p className="text-xs text-zinc-500 mt-1">Review captured sensor images and raw catalog records</p>
        </div>

        {/* Action button triggers */}
        <div className="flex items-center space-x-3">
          <button
            onClick={startSlideshow}
            disabled={filteredPhotos.length === 0}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold rounded-xl flex items-center space-x-2 transition disabled:opacity-50"
          >
            <Play className="w-4 h-4 text-orange-500" />
            <span>Play Slideshow</span>
          </button>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        
        {/* Category switcher */}
        <div className="flex bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/80 overflow-x-auto self-start">
          {[
            { id: 'all', label: 'All Catalog' },
            { id: 'captures', label: 'Captures' },
            { id: 'raw', label: 'RAW (DNG)' },
            { id: 'edits', label: 'Edits' },
            { id: 'favorites', label: 'Favorites ❤️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                activeFilter === tab.id 
                  ? 'bg-zinc-800 text-white shadow-md font-bold' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input Bar */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search album, mode or date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-1.5 pl-9 pr-4 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
          />
        </div>
      </div>

      {/* PHOTO GRID STAGE */}
      {filteredPhotos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 bg-zinc-900/10 rounded-2xl border border-dashed border-zinc-800/80">
          <FileImage className="w-12 h-12 text-zinc-700 mb-3 animate-pulse" />
          <span className="text-zinc-400 text-sm font-semibold">No media assets found</span>
          <p className="text-zinc-600 text-xs mt-1">Switch to the Camera view and snap some professional shots!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredPhotos.map((photo) => (
            <div 
              key={photo.id}
              className="bg-zinc-900/60 border border-zinc-900 rounded-xl overflow-hidden group hover:border-zinc-700/60 transition-all duration-300 relative"
            >
              {/* Photo Viewfinder frame */}
              <div 
                className="aspect-square relative overflow-hidden cursor-pointer bg-black"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img 
                  src={photo.url} 
                  alt="Captured DSLR" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />

                {/* RAW Indicator Badge */}
                {photo.isRaw && (
                  <span className="absolute top-2 left-2 text-[8px] font-mono bg-orange-500 text-zinc-950 px-1 py-0.5 rounded font-extrabold uppercase tracking-wide">
                    RAW
                  </span>
                )}

                {/* Favorite badge */}
                {photo.isFavorite && (
                  <span className="absolute top-2 right-2 p-1 bg-red-600/90 rounded-full text-white">
                    <Heart className="w-2.5 h-2.5 fill-white text-white" />
                  </span>
                )}

                {/* Hover Quick Action bar */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-between text-white">
                  <span className="text-[10px] font-mono text-zinc-300 uppercase tracking-widest">{photo.mode}</span>
                  <span className="text-[9px] font-mono bg-zinc-950/80 px-1.5 py-0.5 rounded text-orange-500">ISO {photo.iso}</span>
                </div>
              </div>

              {/* Bottom text catalog labels */}
              <div className="p-3 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  {renameInputId === photo.id ? (
                    <div className="flex items-center space-x-1 w-full">
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-xs text-white flex-1 focus:outline-none focus:border-orange-500"
                        placeholder="Album Name"
                      />
                      <button 
                        onClick={() => handleRenameSubmit(photo.id)}
                        className="p-1 bg-green-600 rounded text-black text-[10px] font-bold"
                      >
                        ✓
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-zinc-300 font-semibold truncate max-w-[120px]">{photo.album}</span>
                      <button
                        onClick={() => {
                          setRenameInputId(photo.id);
                          setRenameValue(photo.album);
                        }}
                        className="p-1 text-zinc-500 hover:text-zinc-200"
                        title="Rename Album/Tag"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-[9px] font-mono text-zinc-500 flex justify-between items-center border-t border-zinc-800/60 pt-2">
                  <span>{new Date(photo.timestamp).toLocaleDateString()}</span>
                  <span>{photo.fileSize}</span>
                </div>

                {/* Operations tools */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => onToggleFavorite(photo.id)}
                    className={`p-1.5 rounded-lg hover:bg-zinc-800 transition ${photo.isFavorite ? 'text-red-500' : 'text-zinc-500'}`}
                    title="Toggle Favorite"
                  >
                    <Heart className={`w-3.5 h-3.5 ${photo.isFavorite ? 'fill-red-500' : ''}`} />
                  </button>
                  <button
                    onClick={() => onSendToEditor(photo)}
                    className="p-1.5 rounded-lg text-orange-500 hover:bg-zinc-800 transition"
                    title="Edit in Photo Suite"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleShare(photo)}
                    className="p-1.5 rounded-lg text-blue-400 hover:bg-zinc-800 transition"
                    title="Share Asset"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeletePhoto(photo.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-zinc-800/80 transition"
                    title="Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. LIGHTBOX / FULL SCREEN PHOTO VIEWER DETAILED MODAL */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/98 z-50 flex flex-col md:flex-row overflow-hidden backdrop-blur-md">
          {/* Main Display Stage */}
          <div className="flex-1 relative flex items-center justify-center p-4">
            
            {/* Close button */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-6 left-6 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full border border-zinc-700 text-zinc-300 z-10 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Quick favorite tag */}
            <button 
              onClick={() => onToggleFavorite(selectedPhoto.id)}
              className="absolute top-6 right-6 p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full border border-zinc-700 z-10 transition"
            >
              <Heart className={`w-5 h-5 ${selectedPhoto.isFavorite ? 'fill-red-500 text-red-500' : 'text-zinc-300'}`} />
            </button>

            {/* Main Picture */}
            <img 
              src={selectedPhoto.url} 
              alt="Full Preview" 
              className="max-w-full max-h-[82vh] md:max-h-[90vh] object-contain shadow-[0_0_50px_rgba(0,0,0,0.8)] rounded-lg" 
              referrerPolicy="no-referrer"
            />
            
            {/* Quick toggle metadata panel trigger */}
            <button
              onClick={() => setShowMetadataPanel(!showMetadataPanel)}
              className="absolute bottom-6 p-2.5 bg-zinc-900/80 hover:bg-zinc-800 rounded-xl border border-zinc-800 text-xs font-semibold text-zinc-300 flex items-center space-x-1.5"
            >
              <Info className="w-4 h-4 text-orange-500" />
              <span>{showMetadataPanel ? 'Hide DSLR EXIF Metadata' : 'Show DSLR EXIF Metadata'}</span>
            </button>
          </div>

          {/* DSLR CAMERA EXIF METADATA INFO SIDEBAR PANEL */}
          {(showMetadataPanel || window.innerWidth > 768) && (
            <div className={`w-full md:w-80 bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col justify-between overflow-y-auto ${
              showMetadataPanel ? 'block' : 'hidden md:flex'
            }`}>
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <h3 className="font-display font-bold text-zinc-200">Sensor Metadata</h3>
                  <span className="text-[9px] font-mono bg-orange-500/15 text-orange-500 px-2 py-0.5 rounded font-extrabold uppercase tracking-wider">EXIF HUD</span>
                </div>

                {/* Metadata items list */}
                <div className="py-4 space-y-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Asset catalog ID</span>
                    <span className="font-mono text-zinc-300 truncate max-w-[150px]">{selectedPhoto.id}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Lens Mode</span>
                    <span className="font-semibold text-orange-500 uppercase">{selectedPhoto.mode.replace('_', ' ')}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Shutter Speed</span>
                    <span className="font-mono text-zinc-100 font-medium">{selectedPhoto.shutterSpeed} s</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">ISO Speed</span>
                    <span className="font-mono text-zinc-100 font-medium">ISO {selectedPhoto.iso}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">White Balance Preset</span>
                    <span className="font-mono text-zinc-100 font-medium uppercase">{selectedPhoto.whiteBalance}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Exposure Shift</span>
                    <span className="font-mono text-zinc-100 font-medium">{selectedPhoto.exposureComp} EV</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Dimensions</span>
                    <span className="font-mono text-zinc-300">{selectedPhoto.width} x {selectedPhoto.height} (UHD)</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">Record Date</span>
                    <span className="font-mono text-zinc-300">{new Date(selectedPhoto.timestamp).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">File Storage Size</span>
                    <span className="font-mono text-zinc-100 font-medium">{selectedPhoto.fileSize}</span>
                  </div>
                </div>
              </div>

              {/* Sidebar Quick controls */}
              <div className="pt-4 border-t border-zinc-800 space-y-3">
                <button
                  onClick={() => {
                    onSendToEditor(selectedPhoto);
                    setSelectedPhoto(null);
                  }}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition"
                >
                  <Edit3 className="w-4 h-4 text-zinc-950" />
                  <span>Open in Photo Suite Editor</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleShare(selectedPhoto)}
                    className="py-2.5 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl flex items-center justify-center space-x-1.5 border border-zinc-700"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                  <button
                    onClick={() => {
                      onDeletePhoto(selectedPhoto.id);
                      setSelectedPhoto(null);
                    }}
                    className="py-2.5 bg-red-950/20 hover:bg-red-900/40 text-xs font-semibold text-red-400 border border-red-900/30 rounded-xl flex items-center justify-center space-x-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SLIDESHOW FULL SCREEN SCREEN OVERLAY */}
      {isSlideshowActive && filteredPhotos.length > 0 && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between p-6">
          <div className="flex items-center justify-between text-zinc-500 text-xs z-10">
            <span className="font-mono uppercase text-orange-500 font-bold tracking-wider">DSLR SLIDESHOW PLAYBACK</span>
            <button 
              onClick={stopSlideshow}
              className="p-2 bg-zinc-900/80 hover:bg-zinc-800 rounded-full border border-zinc-800 text-zinc-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center relative p-4">
            <img 
              src={filteredPhotos[slideshowIndex].url} 
              alt="Slideshow Frame" 
              className="max-w-full max-h-[80vh] object-contain transition-all duration-700 ease-in-out shadow-2xl rounded" 
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Bottom title info and timer loop feedback indicator */}
          <div className="flex items-center justify-between font-mono z-10 text-xs border-t border-zinc-900 pt-4">
            <div className="text-left">
              <span className="text-zinc-500 text-[10px] uppercase block">Current Album</span>
              <span className="text-zinc-200 font-bold">{filteredPhotos[slideshowIndex].album}</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 text-[10px] uppercase block">Index catalog</span>
              <span className="text-zinc-200">{slideshowIndex + 1} of {filteredPhotos.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
