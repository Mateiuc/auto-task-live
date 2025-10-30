import { validateVin, generateVinCandidates, validateVinStrict } from './vinDecoder';

export interface OcrResult {
  vin: string | null;
  rawText: string;
  candidates: Array<{ vin: string; valid: boolean; checksum: boolean }>;
}

export async function readVinWithGrok({
  base64Image,
  apiKey,
  signal,
  debug = false,
}: {
  base64Image: string;
  apiKey: string;
  signal?: AbortSignal;
  debug?: boolean;
}): Promise<string | null | OcrResult> {
  if (!apiKey) return null;

  // Build the prompt: strict instruction to emit only the VIN string
  const prompt = [
    'You are given a photo of a vehicle VIN tag or windshield-etched VIN.',
    'Return ONLY the 17-character VIN in UPPERCASE, no extra text.',
    'VIN must match: 17 characters from A-H, J-N, P, R-Z, and digits 0-9 (no I, O, Q).',
    'If no valid VIN is visible, return exactly: NONE',
  ].join(' ');

  const url = 'https://api.x.ai/v1/chat/completions';

  // Grok expects data URI format with prefix
  const imageDataUri = `data:image/jpeg;base64,${base64Image}`;

  const body = {
    model: 'grok-2-vision-1212',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: imageDataUri },
          },
        ],
      },
    ],
    temperature: 0.1,
    max_tokens: 50,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Grok OCR error:', res.status, errorText);
      return null;
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';

    // Extract all 17-char candidates
    const rawCandidates = text.match(/[A-HJ-NPR-Z0-9]{17}/g) || [];
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
      return { vin: validVin, rawText: text, candidates: candidateInfo };
    }
    return validVin;
  } catch (error) {
    console.error('Grok OCR request failed:', error);
    return null;
  }
}
