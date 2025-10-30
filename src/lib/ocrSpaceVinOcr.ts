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
    // OCR often misreads VIN characters due to image quality/angle
    const cleanedText = parsedText
      .replace(/[ÜúùûµÙÛ]/g, 'U')       // Ü → U
      .replace(/[ÖóòôõøØ]/g, 'O')       // Ö → O
      .replace(/[ÄáàâãÅåÀÁÂÃ]/g, 'A')   // Ä → A
      .replace(/[ÉéèêëÈÊË]/g, 'E')      // É → E
      .replace(/[ÏïîíìÌÍÎ]/g, 'I')      // Ï → I
      .replace(/[^A-HJ-NPR-Z0-9\s]/g, '') // Remove any remaining invalid chars
      .replace(/\s+/g, '');              // Remove all whitespace
    
    // Extract all 17-char candidates from cleaned text
    const rawCandidates = cleanedText.match(/.{17}/g) || [];
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
