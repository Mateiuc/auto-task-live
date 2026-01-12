import { createWorker } from 'tesseract.js';
import { generateVinCandidates, validateVin, validateVinStrict } from './vinDecoder';

export interface OcrResult {
  vin: string | null;
  rawText: string;
  candidates: Array<{ vin: string; valid: boolean; checksum: boolean }>;
}

interface TesseractParams {
  base64Image: string;
  signal?: AbortSignal;
  debug?: boolean;
}

// Clean text: normalize common OCR confusions and remove invalid VIN characters
const cleanText = (text: string): string => {
  return text
    .toUpperCase()
    .replace(/Ü/g, 'U')
    .replace(/Ö/g, 'O')
    .replace(/Ä/g, 'A')
    .replace(/[^A-HJ-NPR-Z0-9\s\n]/g, '') // Keep only valid VIN chars + whitespace
    .trim();
};

export const readVinWithTesseract = async ({
  base64Image,
  signal,
  debug = false
}: TesseractParams): Promise<string | null | OcrResult> => {
  let worker: Awaited<ReturnType<typeof createWorker>> | null = null;
  
  try {
    // Check for abort before starting
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    // Create worker with English language
    worker = await createWorker('eng', 1, {
      logger: () => {} // Suppress progress logs
    });

    // Check abort again after worker creation
    if (signal?.aborted) {
      throw new Error('Aborted');
    }

    // Recognize text from base64 image
    const imageData = `data:image/jpeg;base64,${base64Image}`;
    const { data: { text } } = await worker.recognize(imageData);

    // Clean and process the extracted text
    const cleanedText = cleanText(text);
    const lines = cleanedText.split(/[\n\s]+/).filter(line => line.length >= 17);

    // Extract potential VIN candidates
    const allCandidates: Array<{ vin: string; valid: boolean; checksum: boolean }> = [];
    
    for (const line of lines) {
      // Try to find 17-character sequences
      for (let i = 0; i <= line.length - 17; i++) {
        const potentialVin = line.substring(i, i + 17);
        
        // Generate candidates including OCR confusion corrections
        const candidates = generateVinCandidates(potentialVin);
        
        for (const candidate of candidates) {
          const isValid = validateVin(candidate);
          const hasChecksum = validateVinStrict(candidate);
          
          // Avoid duplicates
          if (!allCandidates.find(c => c.vin === candidate)) {
            allCandidates.push({
              vin: candidate,
              valid: isValid,
              checksum: hasChecksum
            });
          }
        }
      }
    }

    // Find best candidate (valid checksum preferred)
    const validVin = allCandidates.find(c => c.checksum)?.vin || 
                     allCandidates.find(c => c.valid)?.vin || 
                     null;

    if (debug) {
      return {
        vin: validVin,
        rawText: text,
        candidates: allCandidates
      };
    }

    return validVin;
    
  } catch (error) {
    if (error instanceof Error && error.message === 'Aborted') {
      console.log('[Tesseract] Scan aborted');
    } else {
      console.error('[Tesseract] OCR error:', error);
    }
    
    if (debug) {
      return {
        vin: null,
        rawText: '',
        candidates: []
      };
    }
    return null;
    
  } finally {
    // Always terminate the worker
    if (worker) {
      await worker.terminate();
    }
  }
};
