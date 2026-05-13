/**
 * Pure utility functions for signature normalization and validation
 * NO JSX, NO React dependencies - only pure JavaScript functions
 */

/**
 * Normalizes a signature value to a format ready for <img src={...}>
 * @param {string} value - Signature value (data URL, full URL, or base64 without prefix)
 * @returns {string} Normalized signature string
 */
export function normalizeSignature(value) {
  if (!value || typeof value !== 'string') return '';
  
  const trimmed = value.trim();
  
  // Already a data URL - return as-is
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  
  // Already a full URL - return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Base64 without prefix - add PNG prefix
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) {
    return `data:image/png;base64,${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Validates if a value is a valid signature
 * @param {string} value - Value to validate
 * @returns {boolean} True if valid signature
 */
export function isValidSignature(value) {
  if (!value || typeof value !== 'string') return false;
  
  const trimmed = value.trim();
  if (trimmed === '') return false;
  
  // Check if it's a data URL
  if (trimmed.startsWith('data:image/')) return true;
  
  // Check if it's a full URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  
  // Check if it's base64 without prefix (must be reasonably long)
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) return true;
  
  return false;
}

/**
 * Captures signature from canvas and returns PNG base64 with data URL prefix
 * @param {React.RefObject} canvasRef - Reference to SignatureCanvas
 * @returns {string} Base64 PNG string with data:image/png;base64, prefix
 */
export function captureSignatureAsPNG(canvasRef) {
  if (!canvasRef || !canvasRef.current) {
    return '';
  }

  try {
    // SignatureCanvas has getTrimmedCanvas() method
    const canvas = canvasRef.current.getTrimmedCanvas();
    if (!canvas) return '';
    
    // Convert to PNG data URL
    const dataUrl = canvas.toDataURL('image/png');
    return dataUrl;
  } catch (error) {
    console.error('Error capturing signature:', error);
    return '';
  }
}