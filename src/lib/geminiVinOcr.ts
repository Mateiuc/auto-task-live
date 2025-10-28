import { validateVin } from './vinDecoder';

export async function readVinWithGemini({
  base64Image,
  apiKey,
  signal,
}: {
  base64Image: string;
  apiKey: string;
  signal?: AbortSignal;
}): Promise<string | null> {
  if (!apiKey) return null;

  // Build the prompt: strict instruction to emit only the VIN string
  const prompt = [
    'You are given a photo of a vehicle VIN tag or windshield-etched VIN.',
    'Return ONLY the 17-character VIN in UPPERCASE, no extra text.',
    'VIN must match: 17 characters from A-H, J-N, P, R-Z, and digits 0-9 (no I, O, Q).',
    'If no valid VIN is visible, return exactly: NONE',
  ].join(' ');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${encodeURIComponent(apiKey)}`;

  // base64Image should NOT include "data:image/jpeg;base64," prefix
  const body = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inline_data: {
              mime_type: 'image/jpeg',
              data: base64Image,
            },
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 50,
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Gemini OCR error:', res.status, errorText);
      return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    // Extract first valid VIN
    const match = (text.match(/[A-HJ-NPR-Z0-9]{17}/g) || []).find(validateVin);
    return match || null;
  } catch (error) {
    console.error('Gemini OCR request failed:', error);
    return null;
  }
}
