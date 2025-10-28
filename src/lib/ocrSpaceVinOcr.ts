import { validateVin } from './vinDecoder';

interface OcrSpaceParams {
  base64Image: string;
  apiKey: string;
  signal?: AbortSignal;
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
  signal 
}: OcrSpaceParams): Promise<string | null> => {
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
    
    // Fix common OCR mistakes (I->1, O->0) in potential VIN text
    const cleanedText = parsedText
      .replace(/[IO]/g, (match) => match === 'I' ? '1' : '0')
      .replace(/[io]/g, (match) => match === 'i' ? '1' : '0');
    
    // Extract potential VIN using regex
    // Look for 17 consecutive alphanumeric characters (no I, O, Q)
    const vinPattern = /[A-HJ-NPR-Z0-9]{17}/g;
    const matches = cleanedText.match(vinPattern);
    
    if (matches) {
      for (const match of matches) {
        if (validateVin(match)) {
          console.log('Valid VIN found with OCR Space:', match);
          return match;
        }
      }
    }

    console.log('No valid VIN found in OCR Space text:', parsedText);
    return null;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('OCR Space request aborted');
    } else {
      console.error('OCR Space error:', error);
    }
    return null;
  }
};
