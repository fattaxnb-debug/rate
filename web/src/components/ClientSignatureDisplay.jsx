import React from 'react';
import { normalizeSignature } from '@/utils/signatureUtils.js';

/**
 * ClientSignatureDisplay component - Displays a client signature image
 * @param {Object} props
 * @param {string} props.signature - Signature value (base64 or URL)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function ClientSignatureDisplay({ signature, className = '' }) {
  const normalizedSignature = normalizeSignature(signature);

  if (!normalizedSignature) {
    return (
      <div className="w-full h-32 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Sem assinatura</span>
      </div>
    );
  }

  return (
    <div className={`w-full bg-white rounded-lg border border-border p-4 flex items-center justify-center ${className}`}>
      <img 
        src={normalizedSignature} 
        alt="Assinatura do Cliente" 
        width="300"
        height="150"
        className="max-w-full max-h-32 object-contain"
        style={{ 
          display: 'block', 
          visibility: 'visible', 
          opacity: 1 
        }}
      />
    </div>
  );
}