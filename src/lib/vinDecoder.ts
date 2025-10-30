export interface DecodedVIN {
  make: string;
  model: string;
  year: number;
  manufacturer: string;
  vehicleType: string;
  formatted?: string;
}

// Basic VIN format check (soft validation)
export const validateVin = (vin: string): boolean => {
  if (vin.length !== 17) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
  return true;
};

// Normalize VIN: uppercase, remove spaces/dashes
export const normalizeVin = (vin: string): string => {
  return vin.toUpperCase().replace(/[\s\-]/g, '');
};

// ISO 3779 transliteration for check digit computation
const vinTransliteration: Record<string, number> = {
  'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8,
  'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'P': 7, 'R': 9,
  'S': 2, 'T': 3, 'U': 4, 'V': 5, 'W': 6, 'X': 7, 'Y': 8, 'Z': 9,
  '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9
};

const vinWeights = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

// Compute ISO 3779 check digit for position 9
export const computeCheckDigit = (vin: string): string | null => {
  if (vin.length !== 17) return null;
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const char = vin[i];
    const value = vinTransliteration[char];
    if (value === undefined) return null;
    sum += value * vinWeights[i];
  }
  
  const remainder = sum % 11;
  return remainder === 10 ? 'X' : remainder.toString();
};

// Strict VIN validation with check digit verification
export const validateVinStrict = (vin: string): boolean => {
  if (!validateVin(vin)) return false;
  
  const checkDigit = vin[8];
  const computed = computeCheckDigit(vin);
  
  return computed !== null && checkDigit === computed;
};

// Generate common OCR confusion candidates (conservative)
export const generateVinCandidates = (rawVin: string): string[] => {
  const normalized = normalizeVin(rawVin);
  if (normalized.length !== 17) return [normalized];
  
  const candidates = [normalized];
  const confusions: Record<string, string> = {
    'S': '5', '5': 'S',
    'B': '8', '8': 'B',
    'G': '6', '6': 'G',
    'Z': '2', '2': 'Z',
  };
  
  // Try single-character substitutions for common OCR errors
  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (confusions[char]) {
      const variant = normalized.substring(0, i) + confusions[char] + normalized.substring(i + 1);
      if (!candidates.includes(variant)) {
        candidates.push(variant);
      }
    }
  }
  
  return candidates;
};

export const decodeVin = async (vin: string): Promise<DecodedVIN | null> => {
  try {
    // Use NHTSA API for VIN decoding
    const response = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${vin}?format=json`
    );
    const data = await response.json();
    
    if (data.Results && data.Results[0]) {
      const result = data.Results[0];
      const decodedInfo: DecodedVIN = {
        make: result.Make || '',
        model: result.Model || '',
        year: parseInt(result.ModelYear) || new Date().getFullYear(),
        manufacturer: result.Manufacturer || '',
        vehicleType: result.VehicleType || '',
      };

      // Create formatted string from NHTSA data
      decodedInfo.formatted = `${decodedInfo.year} ${decodedInfo.make} ${decodedInfo.model}`.trim();

      // Flag suspicious decodes (mostly empty fields)
      const hasMinimalInfo = decodedInfo.make && decodedInfo.model && decodedInfo.year > 1900;
      if (!hasMinimalInfo) {
        console.warn('[VIN Decode] Suspicious: NHTSA returned mostly empty fields for', vin);
      }

      return decodedInfo;
    }
    return null;
  } catch (error) {
    console.error('VIN decode error:', error);
    return null;
  }
};
