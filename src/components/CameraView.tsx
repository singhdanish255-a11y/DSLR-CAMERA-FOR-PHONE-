/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Video, 
  Zap, 
  ZapOff, 
  Clock, 
  Grid, 
  Compass, 
  Eye, 
  Smile, 
  QrCode, 
  FileText, 
  Layers, 
  Sparkles, 
  Play, 
  Square, 
  Pause, 
  Volume2, 
  VolumeX, 
  Info,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sliders
} from 'lucide-react';
import { 
  CameraMode, 
  DSLRControls, 
  GalleryPhoto, 
  AppSettings 
} from '../types';
import { 
  getCSSFilterString, 
  drawProcessedImage, 
  calculateHistogram, 
  generateSamplePhotos 
} from '../lib/photoUtils';

interface CameraViewProps {
  controls: DSLRControls;
  setControls: (ctrls: DSLRControls) => void;
  settings: AppSettings;
  onPhotoCaptured: (photo: GalleryPhoto) => void;
  activeMode: CameraMode;
  setActiveMode: (mode: CameraMode) => void;
}

export default function CameraView({
  controls,
  setControls,
  settings,
  onPhotoCaptured,
  activeMode,
  setActiveMode,
}: CameraViewProps) {
  // Video streams
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasWebcam, setHasWebcam] = useState<boolean>(true);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isScanningQR, setIsScanningQR] = useState<boolean>(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);

  // States
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [videoTimer, setVideoTimer] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedTimer, setSelectedTimer] = useState<number>(0); // 0, 2, 5, 10s
  const [flashMode, setFlashMode] = useState<'auto' | 'on' | 'off'>('auto');
  const [activeLens, setActiveLens] = useState<'wide' | 'ultra' | 'tele'>('wide');
  const [isBursting, setIsBursting] = useState<boolean>(false);

  // Audio level fluctuation for video recording simulation
  const [audioLevel, setAudioLevel] = useState<number>(10);

  // Fallback scenic images when webcam is unavailable
  const samples = generateSamplePhotos();
  const [currentSampleIndex, setCurrentSampleIndex] = useState<number>(0);

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const visibleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const histogramCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const intervalRef = useRef<any>(null);
  const audioIntervalRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Level indicator state (simulated degrees of rotation)
  const [levelRotation, setLevelRotation] = useState<number>(1.2);
  const [isLeveling, setIsLeveling] = useState<boolean>(true);

  // AI scan / Scene enhancement state
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any>(null);

  // Start webcam stream
  const startCamera = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    try {
      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: true
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setHasWebcam(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.warn('Webcam permission denied or unavailable. Running in high-end Scenic Camera Simulator mode.');
      setHasWebcam(false);
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  // Handle level indicator simulation
  useEffect(() => {
    let dir = 0.15;
    const interval = setInterval(() => {
      setLevelRotation(prev => {
        let next = prev + dir * (Math.random() * 0.8 + 0.2);
        if (next > 4.5) {
          dir = -0.15;
        } else if (next < -4.5) {
          dir = 0.15;
        }
        // Micro adjustment to get perfect 0 occasionally
        if (Math.abs(next) < 0.3 && Math.random() < 0.2) {
          return 0;
        }
        return next;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Live video feed animation loop
  useEffect(() => {
    let animationFrameId: number;
    const processFrame = () => {
      const canvas = visibleCanvasRef.current;
      const video = videoRef.current;
      if (!canvas) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // 1. Core draw depending on stream
      if (hasWebcam && video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        drawFrame(ctx, video, canvas.width, canvas.height);
      } else {
        // Draw static sample representation with some simulated wave/noise
        canvas.width = 800;
        canvas.height = 600;
        const img = new Image();
        img.src = samples[currentSampleIndex].url;
        if (img.complete) {
          drawFrame(ctx, img, canvas.width, canvas.height);
        } else {
          img.onload = () => drawFrame(ctx, img, canvas.width, canvas.height);
        }
      }

      // 2. Refresh Histogram
      drawHistogram(canvas);

      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [hasWebcam, controls, activeMode, currentSampleIndex, activeLens]);

  // Render processed frames on Canvas
  const drawFrame = (ctx: CanvasRenderingContext2D, source: HTMLVideoElement | HTMLImageElement, width: number, height: number) => {
    // Generate Photo adjustments object
    const adj = {
      brightness: controls.exposureComp * 15,
      contrast: controls.iso === 'auto' ? 0 : (Number(controls.iso) > 800 ? 10 : 0),
      saturation: activeMode === 'food' ? 20 : activeMode === 'portrait' ? -5 : 0,
      highlights: 0,
      shadows: 0,
      sharpness: activeMode === 'sports' ? 25 : 0,
      clarity: activeMode === 'portrait' ? -15 : activeMode === 'macro' ? 15 : 0,
      temperature: controls.whiteBalance === 'shade' ? 20 : controls.whiteBalance === 'tungsten' ? -25 : 0,
      tint: 0,
      vibrance: 0,
      grain: controls.iso === 'auto' ? 0 : (Number(controls.iso) > 1600 ? 15 : 0),
      vignette: activeMode === 'portrait' ? 20 : 0,
    };

    // Simulated zoom factors
    let activeZoom = controls.zoom;
    if (activeLens === 'ultra') activeZoom = activeZoom * 0.5;
    if (activeLens === 'tele') activeZoom = activeZoom * 3.0;

    // Perform filter draw
    drawProcessedImage(ctx, source, width, height, adj, 'none', activeZoom);

    // Apply Focus Peaking highlight simulation (Edge detection overlay)
    if (controls.peakingEnabled) {
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        // Simple horizontal edge detection filter
        for (let y = 1; y < height - 1; y++) {
          for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const rightIdx = idx + 4;
            const downIdx = idx + width * 4;

            const val = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
            const rightVal = 0.299 * data[rightIdx] + 0.587 * data[rightIdx+1] + 0.114 * data[rightIdx+2];
            const downVal = 0.299 * data[downIdx] + 0.587 * data[downIdx+1] + 0.114 * data[downIdx+2];

            const edge = Math.abs(val - rightVal) + Math.abs(val - downVal);
            if (edge > 32) {
              // Highlight focus peak pixel in technical DSLR Green/Red
              data[idx] = 16;
              data[idx+1] = 230;
              data[idx+2] = 16;
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        // Handle CORS canvas taint quietly
      }
    }

    // Apply Zebra Exposure Warning simulation (hazard stripes for overexposed highlights)
    if (controls.zebraEnabled) {
      try {
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const stripeWidth = 8;
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const val = 0.299 * data[idx] + 0.587 * data[idx+1] + 0.114 * data[idx+2];
            if (val > 240) {
              // Draw black and yellow diagonal warning stripes
              if (Math.floor((x + y) / stripeWidth) % 2 === 0) {
                data[idx] = 0;
                data[idx+1] = 0;
                data[idx+2] = 0;
              } else {
                data[idx] = 250;
                data[idx+1] = 210;
                data[idx+2] = 0;
              }
            }
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } catch (err) {
        // Quiet fallback
      }
    }

    // Manual Focus blur simulation
    if (controls.focus !== 'auto') {
      const focusDiff = Math.abs((controls.focus as number) - 75); // Target focus at value 75
      if (focusDiff > 5) {
        ctx.save();
        ctx.globalAlpha = 1.0;
        ctx.filter = `blur(${Math.min(10, focusDiff / 8)}px)`;
        ctx.drawImage(visibleCanvasRef.current!, 0, 0, width, height);
        ctx.restore();
      }
    }

    // QR Code Scanner simulation overlay
    if (activeMode === 'qr_scanner' && isScanningQR) {
      ctx.strokeStyle = '#00ff3c';
      ctx.lineWidth = 4;
      const scanSize = Math.min(width, height) * 0.5;
      const sx = (width - scanSize) / 2;
      const sy = (height - scanSize) / 2;

      ctx.strokeRect(sx, sy, scanSize, scanSize);

      // Neon pulsing scan line
      const pulseY = sy + (scanSize * (0.5 + 0.5 * Math.sin(Date.now() / 200)));
      ctx.beginPath();
      ctx.moveTo(sx, pulseY);
      ctx.lineTo(sx + scanSize, pulseY);
      ctx.shadowColor = '#00ff3c';
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0; // Reset
    }

    // Document Scanner simulation overlay
    if (activeMode === 'document_scanner') {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';

      // Draw active bounding box tracking corners
      const border = 60;
      const offset = 15 * Math.sin(Date.now() / 200);
      const points = [
        { x: border + offset, y: border + offset },
        { x: width - border - offset, y: border + offset * 0.8 },
        { x: width - border + offset * 0.5, y: height - border - offset },
        { x: border - offset * 0.6, y: height - border + offset }
      ];

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      ctx.lineTo(points[1].x, points[1].y);
      ctx.lineTo(points[2].x, points[2].y);
      ctx.lineTo(points[3].x, points[3].y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Corner target corners
      ctx.fillStyle = '#3b82f6';
      points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 8, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  };

  // Draw RGB Histogram
  const drawHistogram = (sourceCanvas: HTMLCanvasElement) => {
    const histCanvas = histogramCanvasRef.current;
    if (!histCanvas) return;
    const ctx = histCanvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, histCanvas.width, histCanvas.height);

    const { r, g, b, l } = calculateHistogram(sourceCanvas);

    // Draw dark semi-transparent backdrop
    ctx.fillStyle = 'rgba(15, 15, 20, 0.55)';
    ctx.fillRect(0, 0, histCanvas.width, histCanvas.height);

    const maxVal = Math.max(...r, ...g, ...b, ...l, 1);
    const scaleY = (histCanvas.height - 4) / maxVal;
    const stepX = histCanvas.width / 256;

    // Draw Luminosity area
    ctx.beginPath();
    ctx.moveTo(0, histCanvas.height);
    for (let i = 0; i < 256; i++) {
      ctx.lineTo(i * stepX, histCanvas.height - l[i] * scaleY);
    }
    ctx.lineTo(histCanvas.width, histCanvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fill();

    // Draw individual R G B lines
    const channels = [
      { data: r, color: 'rgba(239, 68, 68, 0.7)' }, // Red
      { data: g, color: 'rgba(34, 197, 94, 0.7)' }, // Green
      { data: b, color: 'rgba(59, 130, 246, 0.7)' }  // Blue
    ];

    channels.forEach(ch => {
      ctx.beginPath();
      ctx.moveTo(0, histCanvas.height);
      for (let i = 0; i < 256; i++) {
        ctx.lineTo(i * stepX, histCanvas.height - ch.data[i] * scaleY);
      }
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  };

  // Sound generator (satisfying synthesized mechanical DSLR focal shutter click)
  const playShutterSound = () => {
    if (!settings.shutterSound) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      
      // Sound 1: Shutter initial click mirror flip up
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(320, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.05);
      gain1.gain.setValueAtTime(0.5, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.05);

      // Sound 2: Mechanical slide metal sound
      const bufferSize = ctx.sampleRate * 0.15; // 0.15 seconds
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 1500;
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.4, ctx.currentTime);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start();
      noise.stop(ctx.currentTime + 0.15);

    } catch (e) {
      console.warn("AudioContext shutter playback blocked or unsupported by context", e);
    }
  };

  // Simulate audio level variations for video recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel(Math.floor(5 + Math.random() * 45));
      }, 100);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Video recording timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setVideoTimer(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Trigger Burst capture
  const handleBurstCapture = () => {
    setIsBursting(true);
    let count = 0;
    const interval = setInterval(() => {
      triggerCapture('Burst Capture');
      count++;
      if (count >= 5) {
        clearInterval(interval);
        setIsBursting(false);
      }
    }, 180);
  };

  // Perform Gemini AI scene enhancement and detection
  const runAiDetection = async () => {
    setIsAiScanning(true);
    setAiResult(null);

    try {
      const canvas = visibleCanvasRef.current;
      if (!canvas) throw new Error('Viewfinder canvas unavailable');
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      // Call our server-side API! Keep API key fully hidden.
      const response = await fetch('/api/ai/analyze-scene', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/jpeg'
        }),
      });

      if (!response.ok) {
        throw new Error(`API returned error status ${response.status}`);
      }

      const data = await response.json();
      setAiResult(data);

      // Dynamically auto-tune DSLR controllers based on Gemini instructions!
      if (data && data.dslrSettings) {
        const dslr = data.dslrSettings;
        setControls({
          ...controls,
          iso: dslr.iso === 'auto' ? 'auto' : (Number(dslr.iso) as any),
          shutterSpeed: dslr.shutterSpeed as any,
          whiteBalance: dslr.whiteBalance.toLowerCase() as any,
          exposureComp: Number(dslr.exposureComp) || 0,
        });

        if (data.detectedScene) {
          setActiveMode(data.detectedScene.toLowerCase() as CameraMode);
        }
      }

    } catch (err) {
      console.error('Failed processing AI Scene analysis', err);
    } finally {
      setIsAiScanning(false);
    }
  };

  // Capture single photo and save to gallery
  const triggerCapture = (customAlbum?: string) => {
    playShutterSound();
    const canvas = visibleCanvasRef.current;
    if (!canvas) return;

    // Get capture URL
    const url = canvas.toDataURL('image/jpeg', 0.95);

    // Form EXIF description metadata
    const capPhoto: GalleryPhoto = {
      id: `capture_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      url: url,
      timestamp: Date.now(),
      mode: activeMode,
      iso: controls.iso,
      shutterSpeed: controls.shutterSpeed,
      whiteBalance: controls.whiteBalance,
      exposureComp: controls.exposureComp > 0 ? `+${controls.exposureComp.toFixed(1)}` : controls.exposureComp.toFixed(1),
      isRaw: controls.rawEnabled && (activeMode === 'pro' || activeMode === 'auto'),
      isFavorite: false,
      album: customAlbum || (activeMode === 'document_scanner' ? 'Documents' : controls.rawEnabled ? 'RAW' : 'Captures'),
      width: settings.imageResolution === '4K' ? 3840 : 1920,
      height: settings.imageResolution === '4K' ? 2160 : 1080,
      fileSize: controls.rawEnabled ? '14.2 MB (DNG)' : '2.1 MB'
    };

    onPhotoCaptured(capPhoto);
  };

  // Handle capture button press with countdown support
  const handleCapturePress = () => {
    if (activeMode === 'sports' || activeMode === 'burst') {
      handleBurstCapture();
      return;
    }

    if (selectedTimer > 0) {
      setCountdown(selectedTimer);
      const countInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev === null) {
            clearInterval(countInterval);
            return null;
          }
          if (prev <= 1) {
            clearInterval(countInterval);
            // Fire capture next frame
            setTimeout(() => {
              triggerCapture();
            }, 100);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      triggerCapture();
    }
  };

  // Video Actions
  const handleStartVideo = () => {
    setIsRecording(true);
    setIsPaused(false);
    setVideoTimer(0);
    playShutterSound();
  };

  const handlePauseVideo = () => {
    setIsPaused(!isPaused);
  };

  const handleStopVideo = () => {
    setIsRecording(false);
    playShutterSound();
    
    // Simulate saving a video file to gallery
    const capVideo: GalleryPhoto = {
      id: `video_${Date.now()}`,
      url: hasWebcam ? samples[2].url : samples[2].url, // mock representation
      timestamp: Date.now(),
      mode: 'auto',
      iso: controls.iso,
      shutterSpeed: '1/60',
      whiteBalance: controls.whiteBalance,
      exposureComp: '0.0',
      isRaw: false,
      isFavorite: false,
      album: 'Videos',
      width: settings.videoResolution === '4K' ? 3840 : 1920,
      height: settings.videoResolution === '4K' ? 2160 : 1080,
      fileSize: `${(videoTimer * 1.5).toFixed(1)} MB (MP4)`
    };
    onPhotoCaptured(capVideo);
  };

  const formatVideoTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle lenses
  const toggleLens = (lens: 'wide' | 'ultra' | 'tele') => {
    setActiveLens(lens);
  };

  // Toggle QR Scanning state
  useEffect(() => {
    if (activeMode === 'qr_scanner') {
      setIsScanningQR(true);
      setScannedResult(null);
      // Simulate scanning scan
      const timer = setTimeout(() => {
        setIsScanningQR(false);
        setScannedResult('https://ai.studio/build/dslr-pro-camera');
      }, 3500);
      return () => clearTimeout(timer);
    } else {
      setIsScanningQR(false);
      setScannedResult(null);
    }
  }, [activeMode]);

  return (
    <div id="dslr-viewport" className="flex flex-col h-full bg-[#050505] text-[#F0F0F0] font-sans select-none relative overflow-hidden">
      
      {/* 1. TOP BAR STATUS BAR */}
      <div id="dslr-topbar" className="bg-black/60 border-b border-white/10 px-5 py-3 flex items-center justify-between text-xs z-20 backdrop-blur-md">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.7)]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-display">DSLR PRO</span>
          <span className="text-white/20">|</span>
        </div>

        {/* Exposure/Shutter stats */}
        <div className="flex items-center space-x-3 font-mono text-[11px]">
          <span className="text-orange-500 font-bold px-1.5 py-0.5 bg-white/5 border border-white/10 rounded uppercase text-[10px]">
            {activeMode.replace('_', ' ')}
          </span>
          <span className="text-white/20">•</span>
          <span className="flex items-center text-zinc-300">
            F/2.8
          </span>
          <span className="text-white/20">•</span>
          <span className="text-zinc-300">
            SS: {controls.shutterSpeed}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-zinc-300">
            ISO: {controls.iso}
          </span>
          <span className="text-white/20">•</span>
          <span className="text-zinc-300">
            EV: {controls.exposureComp > 0 ? `+${controls.exposureComp}` : controls.exposureComp}
          </span>
        </div>

        {/* Level / PEAK / ZEBA Quick Status Badges */}
        <div className="hidden sm:flex items-center space-x-2">
          {controls.peakingEnabled && (
            <span className="text-[9px] bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
              PEAK
            </span>
          )}
          {controls.zebraEnabled && (
            <span className="text-[9px] bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
              ZEBRA
            </span>
          )}
          {controls.rawEnabled && (
            <span className="text-[9px] bg-orange-500/10 text-orange-500 border border-orange-500/20 px-1.5 py-0.5 rounded font-mono font-bold tracking-wider">
              RAW (DNG)
            </span>
          )}
          <span className="text-[10px] font-mono text-zinc-400 bg-white/5 px-2 py-0.5 rounded border border-white/5">
            999 RAW+F
          </span>
        </div>

        {/* Quick Toolbar actions */}
        <div className="flex items-center space-x-2">
          {/* Flash Toggle */}
          <button 
            id="btn-flash-toggle"
            onClick={() => setFlashMode(prev => prev === 'off' ? 'on' : prev === 'on' ? 'auto' : 'off')}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition ${flashMode !== 'off' ? 'text-orange-500' : 'text-zinc-400'}`}
            title="Flash Mode"
          >
            {flashMode === 'off' ? <ZapOff className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          </button>

          {/* Timer Selector */}
          <button 
            id="btn-timer-select"
            onClick={() => setSelectedTimer(prev => prev === 0 ? 2 : prev === 2 ? 5 : prev === 5 ? 10 : 0)}
            className={`p-1.5 rounded-lg hover:bg-white/10 transition flex items-center space-x-1 ${selectedTimer > 0 ? 'text-orange-500 font-bold' : 'text-zinc-400'}`}
            title="Self-timer delay"
          >
            <Clock className="w-4 h-4" />
            {selectedTimer > 0 && <span className="text-[10px] font-mono">{selectedTimer}s</span>}
          </button>

          {/* Facing Flip Camera */}
          <button 
            id="btn-camera-flip"
            onClick={() => setFacingMode(prev => prev === 'user' ? 'environment' : 'user')}
            className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition"
            title="Flip Lens"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. MAIN VIEWFINDER & LIVE STAGE */}
      <div id="dslr-viewfinder" className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
        
        {/* Hidden video element for streaming */}
        {hasWebcam && (
          <video 
            ref={videoRef}
            autoPlay 
            playsInline 
            muted 
            className="hidden"
          />
        )}

        {/* Main visible processing canvas */}
        <canvas 
          ref={visibleCanvasRef} 
          className="w-full h-full object-cover select-none pointer-events-none"
        />

        {/* Flash fire white overlay splash screen */}
        {flashMode === 'on' && (
          <div className="absolute inset-0 bg-white opacity-0 transition-opacity pointer-events-none" id="flash-overlay" />
        )}

        {/* Rule of Thirds Gridlines Overlay */}
        {controls.gridType !== 'none' && (
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-zinc-800/10">
            {/* Grid borders */}
            <div className="border-r border-b border-zinc-400/35 border-dashed" />
            <div className="border-r border-b border-zinc-400/35 border-dashed" />
            <div className="border-b border-zinc-400/35 border-dashed" />
            <div className="border-r border-b border-zinc-400/35 border-dashed" />
            <div className="border-r border-b border-zinc-400/35 border-dashed" />
            <div className="border-b border-zinc-400/35 border-dashed" />
            <div className="border-r border-zinc-400/35 border-dashed" />
            <div className="border-r border-zinc-400/35 border-dashed" />
            <div className="border-zinc-400/35 border-dashed" />

            {/* Simulated Golden Spiral overlay */}
            {controls.gridType === 'golden' && (
              <svg className="absolute inset-0 w-full h-full stroke-orange-500/40 fill-none stroke-[1px] opacity-80" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path d="M 0,0 L 61.8,0 L 61.8,100 M 0,38.2 L 100,38.2 M 100,100 L 100,38.2 L 61.8,38.2 L 61.8,61.8 L 76.4,61.8 L 76.4,100" />
                <path d="M0,0 Q61.8,0 61.8,38.2 Q61.8,100 100,100" />
              </svg>
            )}

            {/* Simulated Diagonal overlay */}
            {controls.gridType === 'diagonal' && (
              <svg className="absolute inset-0 w-full h-full stroke-zinc-300/30 fill-none stroke-[1.5px]" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100" y2="100" />
                <line x1="100" y1="0" x2="0" y2="100" />
              </svg>
            )}
          </div>
        )}

        {/* Dynamic Horizon Level Meter overlay */}
        {controls.levelEnabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              style={{ transform: `rotate(${levelRotation}deg)` }} 
              className={`w-64 h-[1.5px] border-t level-transition relative flex items-center justify-between ${
                Math.abs(levelRotation) < 0.4 ? 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'border-zinc-400/40'
              }`}
            >
              {/* Level Center indicators */}
              <div className={`w-3 h-3 border-2 rounded-full absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center ${
                Math.abs(levelRotation) < 0.4 ? 'border-green-500 bg-green-500/20' : 'border-zinc-300/35 bg-transparent'
              }`}>
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
              <div className="w-2 h-2 rounded-full bg-zinc-400/40 absolute -left-1" />
              <div className="w-2 h-2 rounded-full bg-zinc-400/40 absolute -right-1" />
            </div>
          </div>
        )}

        {/* Video Recording Controls & Timer HUD */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center space-x-3 bg-red-600/95 border border-red-500 text-white font-mono px-3 py-1.5 rounded-md shadow-lg backdrop-blur-sm z-10 text-xs tracking-wider font-bold">
            <div className={`w-2.5 h-2.5 bg-white rounded-full ${isPaused ? 'opacity-50' : 'animate-pulse'}`} />
            <span>RECORDING: {formatVideoTime(videoTimer)}</span>
            {isPaused && <span className="text-zinc-200 text-[10px]">(PAUSED)</span>}
          </div>
        )}

        {/* Simulated Audio levels meter */}
        {isRecording && (
          <div className="absolute right-4 top-4 flex flex-col space-y-1 bg-zinc-950/70 p-2 rounded border border-zinc-800 z-10 w-28">
            <div className="text-[9px] font-mono font-bold text-zinc-400 flex justify-between items-center">
              <span>AUDIO INPUT</span>
              <Volume2 className="w-3 h-3 text-red-500 animate-pulse" />
            </div>
            {/* Split bars indicator */}
            <div className="flex h-3 space-x-[2px] items-end bg-zinc-900 px-1 rounded">
              {Array.from({ length: 12 }).map((_, i) => (
                <div 
                  key={i} 
                  style={{ height: `${Math.min(100, Math.max(15, (audioLevel * (1 - (12 - i)*0.04) + (i % 2 === 0 ? 5 : -5))))}%` }} 
                  className={`w-1.5 rounded-t-sm transition-all duration-100 ${
                    i > 9 ? 'bg-red-500' : i > 7 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* QR Code Scanned Alert overlay */}
        {scannedResult && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 max-w-sm w-11/12 bg-zinc-950 border border-green-500 text-zinc-50 p-4 rounded-xl shadow-2xl z-20 flex flex-col space-y-2 backdrop-blur-md">
            <div className="flex items-center space-x-2 text-green-500 font-bold">
              <QrCode className="w-5 h-5" />
              <span>QR Code Scanned Successfully</span>
            </div>
            <p className="text-xs text-zinc-400 break-all bg-zinc-900 p-2 rounded font-mono select-text">{scannedResult}</p>
            <div className="flex space-x-2 pt-1 justify-end">
              <button 
                onClick={() => setScannedResult(null)} 
                className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-xs rounded-md border border-zinc-700 transition"
              >
                Clear
              </button>
              <a 
                href={scannedResult} 
                target="_blank" 
                rel="noreferrer" 
                className="px-3 py-1 bg-green-600 hover:bg-green-500 text-xs text-black font-bold rounded-md transition"
              >
                Open Link
              </a>
            </div>
          </div>
        )}

        {/* Live Countdown Clock overlay */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center font-display z-30 pointer-events-none">
            <div className="text-9xl text-orange-500 font-extrabold tracking-widest scale-110 duration-1000 transform animate-pulse bg-zinc-950/85 w-44 h-44 rounded-full flex items-center justify-center border-4 border-orange-500 shadow-[0_0_40px_rgba(249,115,22,0.5)]">
              {countdown}
            </div>
          </div>
        )}

        {/* Auto Focus tracking boxes overlay */}
        {aiResult && aiResult.faces && aiResult.faces.map((f: any, idx: number) => (
          <div 
            key={idx}
            style={{
              left: `${f.x - f.width / 2}%`,
              top: `${f.y - f.height / 2}%`,
              width: `${f.width}%`,
              height: `${f.height}%`,
            }}
            className="absolute border-2 border-green-400 flex flex-col justify-between p-1 shadow-[0_0_8px_rgba(74,222,128,0.4)] transition-all duration-300 z-10"
          >
            {/* Eye tracking marker */}
            <div className="flex justify-between items-center text-[8px] font-mono bg-green-500 text-black px-1 py-0.5 rounded-sm max-w-max">
              <span className="flex items-center space-x-1">
                <Smile className="w-2.5 h-2.5 inline" /> 
                <span>{f.smileStatus}</span>
              </span>
            </div>
            {/* Focus locked indicator */}
            <div className="self-end w-2.5 h-2.5 border-r-2 border-b-2 border-green-400" />
          </div>
        ))}

        {/* Gemini AI Scan Panel Loading HUD Overlay */}
        {isAiScanning && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20 backdrop-blur-md">
            <div className="relative w-20 h-20">
              <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-orange-400 animate-pulse" />
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-orange-400 tracking-wider">AI SENSOR ANALYZING SCENE...</p>
            <p className="text-xs text-zinc-400 mt-1">Requesting Gemini 3.5 deep vision analysis</p>
          </div>
        )}

        {/* Simulated Camera Sensor Histogram (Bottom Left HUD) */}
        <div className="absolute bottom-4 left-4 z-10 rounded border border-zinc-800/80 overflow-hidden shadow-2xl flex flex-col">
          <canvas 
            ref={histogramCanvasRef} 
            width={120} 
            height={60} 
            className="w-[120px] h-[60px]"
          />
          <div className="bg-zinc-950/85 px-1 py-0.5 text-[8px] text-center font-mono text-zinc-400 flex justify-between">
            <span>RGB HISTOGRAM</span>
            <span>LIVE</span>
          </div>
        </div>

        {/* Lens focal switcher slider (Right Edge HUD) */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/60 border border-white/10 rounded-2xl p-2 flex flex-col items-center space-y-4 z-10 backdrop-blur-md">
          <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest font-bold">LENS</span>
          <button 
            onClick={() => toggleLens('ultra')}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-xs font-mono font-bold transition-all border ${
              activeLens === 'ultra' ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.45)] scale-110' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>0.5x</span>
            <span className="text-[7px] opacity-70">ULTRA</span>
          </button>
          <button 
            onClick={() => toggleLens('wide')}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-xs font-mono font-bold transition-all border ${
              activeLens === 'wide' ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.45)] scale-110' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>1.0x</span>
            <span className="text-[7px] opacity-70">WIDE</span>
          </button>
          <button 
            onClick={() => toggleLens('tele')}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-xs font-mono font-bold transition-all border ${
              activeLens === 'tele' ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.45)] scale-110' : 'bg-white/5 text-zinc-400 border-white/10 hover:bg-white/10'
            }`}
          >
            <span>3.0x</span>
            <span className="text-[7px] opacity-70">TELE</span>
          </button>
        </div>

        {/* Switch Scenic simulator backdrop (Bottom Right HUD, only visible in browser simulator mode) */}
        {!hasWebcam && (
          <div className="absolute bottom-4 right-4 z-10 flex flex-col space-y-1 bg-zinc-950/85 p-2 rounded-lg border border-zinc-800 backdrop-blur-sm">
            <span className="text-[9px] font-mono text-zinc-500 uppercase">Simulator Backdrop</span>
            <div className="flex space-x-1.5">
              {samples.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSampleIndex(idx)}
                  className={`w-7 h-7 rounded border overflow-hidden transition-all relative ${
                    currentSampleIndex === idx ? 'border-amber-500 ring-1 ring-amber-500 scale-105' : 'border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  <img src={s.url} alt="Scene preview" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Burst Mode Rapid shutter count overlay indicator */}
        {isBursting && (
          <div className="absolute inset-0 bg-white/20 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-red-600 text-white font-mono px-4 py-2 rounded-xl text-lg font-bold tracking-widest animate-pulse flex items-center space-x-2">
              <Layers className="w-5 h-5 animate-spin" />
              <span>RAPID BURSTING...</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. GEMINI AI SCENE FEEDBACK REPORT CARDS (IF DETECTED) */}
      {aiResult && (
        <div id="ai-feedback-hud" className="bg-black/85 border-b border-white/10 p-3 flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4 items-center justify-between text-xs z-20">
          <div className="flex items-center space-x-3 w-full md:w-auto">
            <div className="bg-orange-500/10 border border-orange-500/30 p-2 rounded-lg text-orange-400">
              <Sparkles className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-zinc-100">Gemini Scene Assistant</span>
                <span className="text-[10px] font-mono text-zinc-500 px-1.5 py-0.2 bg-zinc-950 rounded">Conf: {Math.round(aiResult.confidence * 100)}%</span>
              </div>
              <p className="text-zinc-400 text-xs italic mt-0.5">{aiResult.visualDescription}</p>
            </div>
          </div>

          <div className="flex space-x-2 w-full md:w-auto justify-end">
            <div className="bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 text-left">
              <span className="text-[9px] font-mono text-zinc-500 block uppercase">Detected Mode</span>
              <span className="font-semibold text-orange-500 text-xs uppercase">{(aiResult.detectedScene || 'Auto').replace('_', ' ')}</span>
            </div>
            <div className="bg-zinc-950 px-3 py-1.5 rounded border border-zinc-800 text-left">
              <span className="text-[9px] font-mono text-zinc-500 block uppercase">Manual Recs</span>
              <span className="font-mono text-zinc-300 text-xs">{aiResult.dslrSettings?.shutterSpeed} @ ISO {aiResult.dslrSettings?.iso} ({aiResult.dslrSettings?.aperture})</span>
            </div>
            <button 
              onClick={() => setAiResult(null)}
              className="text-zinc-400 hover:text-white px-2 hover:bg-zinc-855 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* 4. EXPOSURE & ZOOM SLIDERS FLOATING CONTROLS PANEL */}
      <div id="dslr-controls-rails" className="px-4 py-3 bg-[#050505] border-b border-white/5 flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-6 items-center justify-between z-10">
        
        {/* Zoom Slider */}
        <div className="flex items-center space-x-3 w-full md:w-5/12">
          <span className="text-[10px] font-mono text-zinc-500 font-bold w-12 text-left uppercase">ZOOM</span>
          <button 
            onClick={() => setControls({ ...controls, zoom: Math.max(1, controls.zoom - 0.5) })}
            className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-300 font-bold hover:text-white transition"
          >
            -
          </button>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="0.1"
            value={controls.zoom} 
            onChange={(e) => setControls({ ...controls, zoom: parseFloat(e.target.value) })}
            className="flex-1 accent-orange-500 h-1 bg-zinc-850 rounded-lg cursor-pointer"
          />
          <button 
            onClick={() => setControls({ ...controls, zoom: Math.min(10, controls.zoom + 0.5) })}
            className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-300 font-bold hover:text-white transition"
          >
            +
          </button>
          <span className="text-xs font-mono text-orange-500 w-10 text-right font-semibold">{controls.zoom.toFixed(1)}x</span>
        </div>

        {/* Exposure Compensation EV Slider */}
        <div className="flex items-center space-x-3 w-full md:w-5/12">
          <span className="text-[10px] font-mono text-zinc-500 font-bold w-12 text-left uppercase">EXPOSURE</span>
          <button 
            onClick={() => setControls({ ...controls, exposureComp: Math.max(-3.0, controls.exposureComp - 0.3) })}
            className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-300 font-bold hover:text-white transition"
          >
            -
          </button>
          <input 
            type="range" 
            min="-3" 
            max="3" 
            step="0.3"
            value={controls.exposureComp} 
            onChange={(e) => setControls({ ...controls, exposureComp: parseFloat(e.target.value) })}
            className="flex-1 accent-orange-500 h-1 bg-zinc-850 rounded-lg cursor-pointer"
          />
          <button 
            onClick={() => setControls({ ...controls, exposureComp: Math.min(3.0, controls.exposureComp + 0.3) })}
            className="w-7 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full flex items-center justify-center text-zinc-300 font-bold hover:text-white transition"
          >
            +
          </button>
          <span className="text-xs font-mono text-orange-500 w-10 text-right font-semibold">
            {controls.exposureComp > 0 ? `+${controls.exposureComp.toFixed(1)}` : controls.exposureComp.toFixed(1)}
          </span>
        </div>

        {/* Core Gemini AI Assistant Launch Button */}
        <div className="w-full md:w-auto flex justify-end">
          <button
            id="btn-gemini-ai-detect"
            onClick={runAiDetection}
            disabled={isAiScanning}
            className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-950 bg-orange-500 hover:bg-orange-400 hover:scale-102 transition-all flex items-center space-x-2 border-none shadow-[0_0_15px_rgba(249,115,22,0.25)] w-full md:w-auto justify-center disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 animate-pulse text-zinc-950" />
            <span>Gemini AI Assist</span>
          </button>
        </div>
      </div>

      {/* 5. BOTTOM SHUTTER CONTROLS RAIL */}
      <div id="dslr-shutter-bar" className="bg-black/90 px-6 py-5 border-t border-white/10 flex items-center justify-between z-10">
        
        {/* Left Side: Lens Switch / Timer Select summary details */}
        <div className="flex items-center space-x-4">
          <div className="text-left font-mono">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">Image Resolution</span>
            <span className="text-xs text-zinc-300 font-semibold">{settings.imageResolution} Ultra HD</span>
          </div>
        </div>

        {/* Center: Major Photo / Video trigger buttons */}
        <div className="flex items-center space-x-8">
          
          {/* Dynamic capture switcher */}
          {activeMode === 'sports' || activeMode === 'burst' ? (
            <button 
              id="shutter-burst-trigger"
              onClick={handleCapturePress}
              disabled={isBursting}
              className="w-18 h-18 bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 border-4 border-zinc-850 rounded-full flex flex-col items-center justify-center shadow-2xl transition duration-150 disabled:opacity-50"
            >
              <Layers className="w-6 h-6 text-black" />
              <span className="text-[8px] font-bold font-sans">BURST</span>
            </button>
          ) : isRecording ? (
            <div className="flex items-center space-x-4">
              {/* Pause/Resume Video */}
              <button 
                id="btn-video-pause"
                onClick={handlePauseVideo}
                className="w-12 h-12 bg-zinc-900 hover:bg-zinc-800 active:scale-95 rounded-full flex items-center justify-center text-white transition border border-white/5"
              >
                {isPaused ? <Play className="w-5 h-5 text-green-400" /> : <Pause className="w-5 h-5 text-zinc-300" />}
              </button>
              {/* Stop recording */}
              <button 
                id="btn-video-stop"
                onClick={handleStopVideo}
                className="w-20 h-20 bg-red-600 hover:bg-red-500 active:scale-95 border-6 border-zinc-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] transition duration-150"
              >
                <Square className="w-8 h-8 text-white fill-white" />
              </button>
            </div>
          ) : activeMode === 'slow_motion' || activeMode === 'time_lapse' || activeMode === 'hyperlapse' ? (
            <button 
              id="shutter-video-trigger"
              onClick={handleStartVideo}
              className="w-18 h-18 bg-red-600 hover:bg-red-500 active:scale-95 border-4 border-zinc-850 rounded-full flex flex-col items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.3)] transition duration-150"
            >
              <Video className="w-6 h-6 text-white" />
              <span className="text-[8px] font-bold text-white tracking-widest">{activeMode === 'slow_motion' ? 'SLOW' : 'LAPSE'}</span>
            </button>
          ) : (
            <button 
              id="shutter-standard-trigger"
              onClick={handleCapturePress}
              className="w-20 h-20 bg-white hover:bg-zinc-200 active:scale-90 border-6 border-zinc-900 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.15)] transition duration-150 relative group"
            >
              {/* Inner ring */}
              <div className="w-14 h-14 bg-zinc-950 text-white rounded-full flex items-center justify-center group-hover:bg-zinc-900 transition">
                <Camera className="w-7 h-7 text-white" />
              </div>
            </button>
          )}
        </div>

        {/* Right Side: Mode Details display */}
        <div className="flex items-center space-x-3 font-mono">
          <div className="text-right">
            <span className="text-[9px] text-zinc-500 block uppercase font-bold">Lens Focal Preset</span>
            <span className="text-xs text-orange-500 font-semibold uppercase">{activeLens} Angle</span>
          </div>
        </div>
      </div>
    </div>
  );
}
