export interface DecodedVIN {
  make: string;
  model: string;
  year: number;
  manufacturer: string;
  vehicleType: string;
  formatted?: string;
}

export const validateVin = (vin: string): boolean => {
  if (vin.length !== 17) return false;
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return false;
  return true;
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

      return decodedInfo;
    }
    return null;
  } catch (error) {
    console.error('VIN decode error:', error);
    return null;
  }
};
