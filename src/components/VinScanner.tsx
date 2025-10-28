import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Camera } from 'lucide-react';
import Tesseract from 'tesseract.js';
import { validateVin } from '@/lib/vinDecoder';

interface VinScannerProps {
  onVinDetected: (vin: string) => void;
  onClose: () => void;
}

const VinScanner: React.FC<VinScannerProps> = ({ onVinDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isFrameReady, setIsFrameReady] = useState(false);
  const [frameDimensions, setFrameDimensions] = useState({ 
    widthPercent: 80, 
    heightPx: 128 
  });

  useEffect(() => {
    startCamera();
    return () => {
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

  const captureAndScan = async () => {
    if (!videoRef.current || !canvasRef.current || isScanning) return;

    setIsScanning(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Calculate frame position and dimensions
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;
    const frameWidth = (videoWidth * frameDimensions.widthPercent) / 100;
    const frameHeight = frameDimensions.heightPx;
    const frameX = (videoWidth - frameWidth) / 2;
    const frameY = (videoHeight - frameHeight) / 2;

    // Set canvas to frame dimensions only (crop to scan area)
    canvas.width = frameWidth;
    canvas.height = frameHeight;
    
    // Draw only the cropped frame region
    context.drawImage(
      video,
      frameX, frameY, frameWidth, frameHeight, // Source coordinates
      0, 0, frameWidth, frameHeight            // Destination coordinates
    );

    try {
      const { data: { text } } = await Tesseract.recognize(canvas, 'eng');

      const vinMatch = text.match(/[A-HJ-NPR-Z0-9]{17}/g);
      
      if (vinMatch) {
        for (const potentialVin of vinMatch) {
          if (validateVin(potentialVin)) {
            onVinDetected(potentialVin);
            stopCamera();
            return;
          }
        }
      }
    } catch (error) {
      console.error('OCR error:', error);
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="relative w-full h-full">
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
              className="border-2 rounded-lg transition-colors border-primary/60"
              style={{
                width: `${frameDimensions.widthPercent}%`,
                height: `${frameDimensions.heightPx}px`
              }}
            />
          </div>
        </>
      )}

      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
        <Button
          onClick={captureAndScan}
          disabled={isScanning}
          size="lg"
          className="rounded-full h-16 w-16"
        >
          <Camera className="h-6 w-6" />
        </Button>
      </div>

      {isScanning && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-white text-lg">Scanning VIN...</div>
        </div>
      )}
    </div>
  );
};

export default VinScanner;
