import QRCode from 'qrcode';
import { customAlphabet } from 'nanoid';

// Generate unique certificate numbers
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 10);

/**
 * Generates a QR code for a certificate
 * @param url The verification URL for the certificate
 * @returns A base64 encoded string of the QR code
 */
export async function generateCertificate(url: string): Promise<string> {
  try {
    // Generate QR code as base64 string
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 200,
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate certificate QR code');
  }
}

/**
 * Generate a unique certificate number
 * Format: MEDEVENT-{YY}{MM}-{RANDOM_ID}
 */
export function generateCertificateNumber(): string {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2); // Last 2 digits of year
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Month with leading zero
  
  return `MEDEVENT-${year}${month}-${nanoid(6)}`;
}

/**
 * Validate a certificate number format
 * @param certificateNumber The certificate number to validate
 * @returns boolean indicating whether the format is valid
 */
export function validateCertificateNumber(certificateNumber: string): boolean {
  // Check certificate number format: MEDEVENT-YYMM-XXXXXX
  const certNumberRegex = /^MEDEVENT-\d{4}-[A-Z0-9]{6}$/;
  return certNumberRegex.test(certificateNumber);
}
