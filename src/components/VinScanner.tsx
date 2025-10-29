import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { validateVin } from '@/lib/vinDecoder';
import { readVinWithGemini } from '@/lib/geminiVinOcr';
import { readVinWithGrok } from '@/lib/grokVinOcr';
import { readVinWithOcrSpace } from '@/lib/ocrSpaceVinOcr';
import { useToast } from '@/hooks/use-toast';

interface VinScannerProps {
  onVinDetected: (vin: string) => void;
  onClose: () => void;
  googleApiKey?: string;
  grokApiKey?: string;
  ocrSpaceApiKey?: string;
  ocrProvider?: 'gemini' | 'grok' | 'ocrspace';
}

const VinScanner: React.FC<VinScannerProps> = ({ 
  onVinDetected, 
  onClose, 
  googleApiKey, 
  grokApiKey,
  ocrSpaceApiKey, 
  ocrProvider = 'gemini' 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);
  const scanningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [frameDimensions, setFrameDimensions] = useState({ 
    widthPercent: 80, 
    heightPx: 128 
  });
  const [scanColor, setScanColor] = useState(0);
  const { toast } = useToast();
  const warnedNoKeyRef = useRef(false);

  // Color palette for scanning animation
  const scanningColors = [
    'border-blue-500',
    'border-purple-500',
    'border-pink-500',
    'border-rose-500',
    'border-orange-500',
    'border-yellow-500',
    'border-green-500',
    'border-emerald-500',
    'border-teal-500',
    'border-cyan-500'
  ];

  useEffect(() => {
    startCamera();
    return () => {
      scanningRef.current = false;
      stopCamera();
    };
  }, []);

  // Helper function to calculate VIN-optimized frame dimensions
  const calculateFrameDimensions = (videoWidth: number, videoHeight: number) => {
    const VIN_CHARACTERS = 17;
    const CHAR_ASPECT_RATIO = 0.65;
    const CHAR_SPACING_FACTOR = 1.05;

    const guideWidth = videoWidth * 0.95;
    const charWidth = guideWidth / (VIN_CHARACTERS * CHAR_SPACING_FACTOR);
    const charHeight = charWidth / CHAR_ASPECT_RATIO;
    const guideHeight = charHeight * 0.8;

    return {
      widthPercent: 95,
      heightPx: Math.round(guideHeight)
    };
  };

  // Set frame dimensions immediately when video metadata loads
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleMetadataLoaded = () => {
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      if (videoWidth > 0 && videoHeight > 0) {
        const dimensions = calculateFrameDimensions(videoWidth, videoHeight);
        setFrameDimensions(dimensions);
        setIsFrameReady(true);
      }
    };

    video.addEventListener('loadedmetadata', handleMetadataLoaded);
    
    // If metadata already loaded, calculate immediately
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      handleMetadataLoaded();
    }

    return () => video.removeEventListener('loadedmetadata', handleMetadataLoaded);
  }, [stream]);

  // Color cycling effect during scanning
  useEffect(() => {
    if (!isScanning) return;
    
    const colorInterval = setInterval(() => {
      setScanColor(prev => (prev + 1) % scanningColors.length);
    }, 600);
    
    return () => clearInterval(colorInterval);
  }, [isScanning]);

  // Auto-start continuous OCR scan when frame is ready
  useEffect(() => {
    const hasApiKey = (ocrProvider === 'grok' && grokApiKey) || 
                     (ocrProvider === 'gemini' && googleApiKey) ||
                     (ocrProvider === 'ocrspace' && ocrSpaceApiKey);
    if (hasApiKey && isFrameReady && stream && !scanningRef.current) {
      startContinuousOcrScan();
    } else if (!hasApiKey && isFrameReady && stream && !warnedNoKeyRef.current) {
      warnedNoKeyRef.current = true;
      toast({
        title: 'OCR provider not configured',
        description: `Set an API key for ${ocrProvider.toUpperCase()} in Settings to enable VIN scanning.`,
        variant: 'destructive'
      });
    }
  }, [googleApiKey, grokApiKey, ocrSpaceApiKey, ocrProvider, isFrameReady, stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
    } catch (error) {
      console.error('Camera access error:', error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const startContinuousOcrScan = async () => {
    const hasApiKey = (ocrProvider === 'grok' && grokApiKey) || 
                     (ocrProvider === 'gemini' && googleApiKey) ||
                     (ocrProvider === 'ocrspace' && ocrSpaceApiKey);
    if (!videoRef.current || !canvasRef.current || !hasApiKey) return;

    setIsScanning(true);
    scanningRef.current = true;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    let attempts = 0;

    if (!context) {
      setIsScanning(false);
      return;
    }

    // Continuous scan loop
    while (scanningRef.current) {
      try {
        if (!containerRef.current || !guideRef.current) continue;
        attempts++;

        // Get DOM rectangles
        const containerRect = containerRef.current.getBoundingClientRect();
        const guideRect = guideRef.current.getBoundingClientRect();
        
        // Container dimensions
        const cw = containerRect.width;
        const ch = containerRect.height;
        
        // Video source dimensions
        const vsw = video.videoWidth;
        const vsh = video.videoHeight;
        
        // Calculate object-cover scale and offsets
        const scale = Math.max(cw / vsw, ch / vsh);
        const dw = vsw * scale; // displayed width
        const dh = vsh * scale; // displayed height
        const dx = Math.max(0, (dw - cw) / 2); // horizontal overflow
        const dy = Math.max(0, (dh - ch) / 2); // vertical overflow
        
        // Guide rectangle position relative to container
        const ox = guideRect.left - containerRect.left;
        const oy = guideRect.top - containerRect.top;
        const ow = guideRect.width;
        const oh = guideRect.height;
        
        // Map back to video source coordinates
        let sx = (ox + dx) / scale;
        let sy = (oy + dy) / scale;
        let sw = ow / scale;
        let sh = oh / scale;
        
        // Clamp to valid bounds
        sx = Math.max(0, Math.min(sx, vsw));
        sy = Math.max(0, Math.min(sy, vsh));
        sw = Math.min(sw, vsw - sx);
        sh = Math.min(sh, vsh - sy);
        
        // Round to integers
        sx = Math.round(sx);
        sy = Math.round(sy);
        sw = Math.round(sw);
        sh = Math.round(sh);

        console.log('[VIN Scan] attempt', attempts, 'provider', ocrProvider, {
          video: { w: vsw, h: vsh },
          display: { w: cw, h: ch, scale, dx, dy },
          crop: { sx, sy, sw, sh }
        });

        // Capture current frame (cropped to exact guide rectangle)
        canvas.width = sw;
        canvas.height = sh;
        context.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);

        // Convert to base64
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, '');

        // Call selected OCR provider with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        let vin: string | null = null;
        try {
          if (ocrProvider === 'grok' && grokApiKey) {
            vin = await readVinWithGrok({ base64Image: base64, apiKey: grokApiKey, signal: controller.signal });
          } else if (ocrProvider === 'ocrspace' && ocrSpaceApiKey) {
            vin = await readVinWithOcrSpace({ base64Image: base64, apiKey: ocrSpaceApiKey, signal: controller.signal });
          } else if (googleApiKey) {
            vin = await readVinWithGemini({ base64Image: base64, apiKey: googleApiKey, signal: controller.signal });
          }
        } finally {
          clearTimeout(timeoutId);
        }

        // If valid VIN found, stop scanning
        if (vin && validateVin(vin)) {
          onVinDetected(vin);
          stopCamera();
          scanningRef.current = false;
          setIsScanning(false);
          return;
        }

        // Periodic guidance toast
        if (attempts % 5 === 0) {
          toast({
            title: 'Still scanning…',
            description: 'No VIN detected yet. Tip: fill the frame, avoid glare, and align the VIN horizontally.',
          });
        }

        // Wait 1 second before next capture
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error('OCR error:', error);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsScanning(false);
  };

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute top-2 right-2 z-10">
        <Button
          variant="destructive"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {isFrameReady && (
        <>
          {/* Gradient blur overlay - focuses attention on VIN frame */}
          <div 
            className="absolute inset-0 pointer-events-none transition-all duration-300"
            style={{
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              maskImage: `radial-gradient(ellipse ${frameDimensions.widthPercent}% ${frameDimensions.heightPx + 40}px at center, transparent 0%, transparent 10%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,1) 100%)`,
              WebkitMaskImage: `radial-gradient(ellipse ${frameDimensions.widthPercent}% ${frameDimensions.heightPx + 40}px at center, transparent 0%, transparent 10%, rgba(0,0,0,0.3) 40%, rgba(0,0,0,1) 100%)`
            }}
          />

          {/* Visual guide frame */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div 
              ref={guideRef}
              className={`border-2 rounded-lg transition-colors duration-300 ${
                isScanning ? scanningColors[scanColor] : 'border-primary/60'
              }`}
              style={{
                width: `${frameDimensions.widthPercent}%`,
                height: `${frameDimensions.heightPx}px`
              }}
            />
          </div>
        </>

      )}

      {isScanning && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs px-2 py-1 rounded bg-background/70 backdrop-blur text-muted-foreground pointer-events-none">
          Scanning with {ocrProvider.toUpperCase()}…
        </div>
      )}

    </div>
  );
};

export default VinScanner;
