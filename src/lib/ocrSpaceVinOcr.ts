import { validateVin, generateVinCandidates, validateVinStrict } from './vinDecoder';

export interface OcrResult {
  vin: string | null;
  rawText: string;
  candidates: Array<{ vin: string; valid: boolean; checksum: boolean }>;
}

interface OcrSpaceParams {
  base64Image: string;
  apiKey: string;
  signal?: AbortSignal;
  debug?: boolean;
}

interface OcrSpaceResponse {
  ParsedResults?: Array<{
    ParsedText: string;
  }>;
  OCRExitCode: number;
  IsErroredOnProcessing: boolean;
  ErrorMessage?: string[];
}

export const readVinWithOcrSpace = async ({ 
  base64Image, 
  apiKey,
  signal,
  debug = false
}: OcrSpaceParams): Promise<string | null | OcrResult> => {
  try {
    // OCR Space expects data URI format
    const imageDataUri = `data:image/jpeg;base64,${base64Image}`;
    
    // Create form-urlencoded body
    const formBody = new URLSearchParams({
      base64Image: imageDataUri,
      language: 'eng',
      isOverlayRequired: 'false',
      detectOrientation: 'true',
      scale: 'true'
    });

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody.toString(),
      signal,
    });

    if (!response.ok) {
      console.error('OCR Space API error:', response.status, response.statusText);
      return null;
    }

    const data: OcrSpaceResponse = await response.json();

    // Check for successful OCR
    if (data.OCRExitCode !== 1 || data.IsErroredOnProcessing) {
      console.error('OCR Space processing error:', data.ErrorMessage);
      return null;
    }

    // Extract text from parsed results
    const parsedText = data.ParsedResults?.[0]?.ParsedText || '';
    
    // Fix common OCR character recognition errors
    // Convert OCR misreads to valid VIN characters BEFORE filtering
    const cleanedText = parsedText
      .toUpperCase()
      .replace(/[OÖóòôõøØ]/g, '0')      // Letter O → Zero (O is invalid in VIN)
      .replace(/[IÏïîíìÌÍÎ]/g, '1')     // Letter I → One (I is invalid in VIN)
      .replace(/Q/g, '0')               // Q → Zero (Q is invalid in VIN)
      .replace(/[ÜúùûµÙÛ]/g, 'U')       // Ü → U
      .replace(/[ÄáàâãÅåÀÁÂÃ]/g, 'A')   // Ä → A
      .replace(/[ÉéèêëÈÊË]/g, 'E')      // É → E
      .replace(/[^A-HJ-NPR-Z0-9\s\r\n]/g, ''); // Keep line breaks, remove invalid chars
    
    // Split by lines and look for VIN on each line
    const lines = cleanedText.split(/[\r\n]+/);
    const rawCandidates: string[] = [];
    
    for (const line of lines) {
      // Remove ALL whitespace from this line only
      const cleanLine = line.replace(/\s+/g, '');
      
      // Check if this line is exactly 17 valid VIN characters
      if (cleanLine.length === 17 && /^[A-HJ-NPR-Z0-9]{17}$/.test(cleanLine)) {
        rawCandidates.push(cleanLine);
      }
    }
    const candidatesWithVariants: string[] = [];
    const candidateInfo: Array<{ vin: string; valid: boolean; checksum: boolean }> = [];

    for (const raw of rawCandidates) {
      const variants = generateVinCandidates(raw);
      for (const v of variants) {
        if (!candidatesWithVariants.includes(v)) {
          candidatesWithVariants.push(v);
          const valid = validateVin(v);
          const checksum = validateVinStrict(v);
          candidateInfo.push({ vin: v, valid, checksum });
        }
      }
    }

    // Find first candidate that passes strict validation
    const validVin = candidatesWithVariants.find(validateVinStrict) || null;

    if (debug) {
      return { vin: validVin, rawText: parsedText, candidates: candidateInfo };
    }
    return validVin;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('OCR Space request aborted');
    } else {
      console.error('OCR Space error:', error);
    }
    return null;
  }
};
