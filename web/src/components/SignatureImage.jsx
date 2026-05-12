import React from 'react';
import { normalizeSignature } from '@/utils/signatureUtils.js';

/**
 * SignatureImage component - Displays a signature image with guaranteed visibility
 * @param {Object} props
 * @param {string} props.signature - Signature value (base64 or URL)
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.alt] - Alt text for the image (default: "Assinatura")
 */
export default function SignatureImage({ signature, className = '', alt = 'Assinatura' }) {
  const normalizedSignature = normalizeSignature(signature);

  if (!normalizedSignature) {
    return null;
  }

  return (
    <img 
      src={normalizedSignature} 
      alt={alt}
      className={className}
      style={{
        maxWidth: '100%',
        maxHeight: '200px',
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        objectFit: 'contain'
      }}
    />
  );
}