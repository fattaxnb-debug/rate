import React from 'react';
import { normalizeSignature, isValidSignature } from '@/utils/signatureNormalizer.js';

/**
 * ClientSignatureImage - Displays a client signature image
 * Renders <img> if signature is valid, otherwise returns null
 * NO canvas, NO overlay, NO CSS hiding
 */
export default function ClientSignatureImage({ signature }) {
  // If signature is not valid, return null (no placeholder)
  if (!isValidSignature(signature)) {
    return null;
  }

  // Normalize signature to ensure it's ready for <img src={...}>
  const normalizedSignature = normalizeSignature(signature);

  return (
    <img 
      src={normalizedSignature} 
      alt="Assinatura do Cliente" 
      style={{
        maxWidth: '100%',
        maxHeight: '200px',
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        border: '1px solid #ddd',
        borderRadius: '4px'
      }}
    />
  );
}