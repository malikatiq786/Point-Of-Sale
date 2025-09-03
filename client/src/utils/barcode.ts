// Barcode generation utilities

/**
 * Generate a unique barcode for products
 * Format: P + timestamp + random digits (13 digits total for EAN-13 compatibility)
 */
export const generateProductBarcode = (): string => {
  // Get current timestamp in milliseconds and convert to string
  const timestamp = Date.now().toString();
  
  // Take last 8 digits of timestamp for uniqueness
  const timestampPart = timestamp.slice(-8);
  
  // Generate 4 random digits
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Combine to create a 12-digit code (we'll add check digit for EAN-13)
  const baseCode = timestampPart + randomPart;
  
  // Calculate EAN-13 check digit
  const checkDigit = calculateEAN13CheckDigit(baseCode);
  
  return baseCode + checkDigit;
};

/**
 * Calculate EAN-13 check digit
 * @param code 12-digit code without check digit
 * @returns check digit (0-9)
 */
const calculateEAN13CheckDigit = (code: string): string => {
  let sum = 0;
  
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    if (i % 2 === 0) {
      sum += digit;
    } else {
      sum += digit * 3;
    }
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
};

/**
 * Validate if a barcode is in correct EAN-13 format
 * @param barcode 13-digit barcode string
 * @returns boolean indicating if barcode is valid
 */
export const validateEAN13Barcode = (barcode: string): boolean => {
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }
  
  const baseCode = barcode.slice(0, 12);
  const checkDigit = barcode.slice(12);
  const calculatedCheckDigit = calculateEAN13CheckDigit(baseCode);
  
  return checkDigit === calculatedCheckDigit;
};

/**
 * Format barcode for display (add spaces for readability)
 * @param barcode 13-digit barcode
 * @returns formatted barcode string
 */
export const formatBarcodeForDisplay = (barcode: string): string => {
  if (!barcode) {
    return '';
  }
  if (barcode.length === 13) {
    return `${barcode.slice(0, 1)} ${barcode.slice(1, 7)} ${barcode.slice(7, 13)}`;
  }
  return barcode;
};

/**
 * Generate multiple unique barcodes
 * @param count number of barcodes to generate
 * @returns array of unique barcodes
 */
export const generateMultipleBarcodes = (count: number): string[] => {
  const barcodes = new Set<string>();
  
  while (barcodes.size < count) {
    const barcode = generateProductBarcode();
    barcodes.add(barcode);
    
    // Small delay to ensure timestamp uniqueness
    if (barcodes.size < count) {
      // Use a counter to avoid infinite loops
      let attempts = 0;
      while (barcodes.has(generateProductBarcode()) && attempts < 100) {
        attempts++;
      }
    }
  }
  
  return Array.from(barcodes);
};