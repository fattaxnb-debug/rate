/**
 * Signature utility functions for consistent signature handling across the app
 * Pure utility functions only - no JSX or React imports
 */

import axios from 'axios';
import { API_BASE_URL } from '@/config/api.js';

/**
 * Normalizes a signature value to a format that can be used directly in <img src={}>
 * @param {string} value - Base64 string (with or without prefix) or URL
 * @returns {string} Normalized signature string
 */
export const normalizeSignature = (value) => {
  if (!value || typeof value !== 'string') return '';
  
  const trimmed = value.trim();
  
  // Already has data URI prefix
  if (trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  
  // Is a URL (http/https)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  
  // Is base64 without prefix - add PNG prefix
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed)) {
    return `data:image/png;base64,${trimmed}`;
  }
  
  return trimmed;
};

/**
 * Captures signature from canvas and returns optimized PNG base64
 * Crops empty borders and returns lightweight base64 string
 * @param {React.RefObject} canvasRef - Reference to SignatureCanvas
 * @returns {string} Base64 PNG string with data URI prefix
 */
export const captureSignatureAsPNG = (canvasRef) => {
  if (!canvasRef || !canvasRef.current) {
    return '';
  }

  const canvas = canvasRef.current.getCanvas();
  if (!canvas) return '';

  const ctx = canvas.getContext('2d');
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data, width, height } = imageData;

  // Find bounds of non-transparent pixels
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      
      // Check if pixel is not transparent (has been drawn on)
      if (alpha > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no signature found, return empty
  if (minX > maxX || minY > maxY) {
    return '';
  }

  // Add small padding
  const padding = 10;
  minX = Math.max(0, minX - padding);
  minY = Math.max(0, minY - padding);
  maxX = Math.min(width - 1, maxX + padding);
  maxY = Math.min(height - 1, maxY + padding);

  // Create cropped canvas
  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;
  const croppedCtx = croppedCanvas.getContext('2d');

  // Draw cropped signature
  croppedCtx.drawImage(
    canvas,
    minX, minY, croppedWidth, croppedHeight,
    0, 0, croppedWidth, croppedHeight
  );

  // Convert to PNG with compression
  return croppedCanvas.toDataURL('image/png', 0.8);
};

/**
 * Validates if a value is a valid signature
 * @param {string} value - Value to validate
 * @returns {boolean} True if valid signature
 */
export const isValidSignature = (value) => {
  if (!value || typeof value !== 'string') return false;
  
  const trimmed = value.trim();
  if (trimmed === '') return false;
  
  // Check if it's a data URI
  if (trimmed.startsWith('data:image/')) return true;
  
  // Check if it's a URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return true;
  
  // Check if it's base64 without prefix
  if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 50) return true;
  
  return false;
};

/**
 * Converts base64 data URI to Blob
 * @param {string} dataURI - Base64 data URI string
 * @returns {Blob} Blob object
 */
const dataURItoBlob = (dataURI) => {
  const byteString = atob(dataURI.split(',')[1]);
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  return new Blob([ab], { type: mimeString });
};

/**
 * Saves signature to report_photos collection
 * @param {string} reportId - Report ID
 * @param {string} base64Signature - Base64 signature string (with or without data URI prefix)
 * @returns {Promise<Object>} Created record
 */
export const saveSignatureToReportPhotos = async (reportId, base64Signature) => {
  if (!reportId || !base64Signature) {
    throw new Error('Report ID and signature are required');
  }

  // Normalize signature to ensure it has data URI prefix
  const normalizedSignature = normalizeSignature(base64Signature);
  
  // Convert base64 to blob
  const blob = dataURItoBlob(normalizedSignature);
  
  // Create FormData
  const formData = new FormData();
  formData.append('report_id', reportId);
  formData.append('photo_url', blob, 'client_signature.png');
  formData.append('photo_type', 'client_signature');
  formData.append('comment', 'Assinatura do Cliente');
  formData.append('sequence', 9999); // High sequence to appear last
  
  // Create record
  const token = localStorage.getItem('auth_token');
  const response = await axios.post(`${API_BASE_URL}/report-photos`, formData, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
};

/**
 * Loads signature from report_photos collection
 * @param {string} reportId - Report ID
 * @returns {Promise<string|null>} Base64 signature string or null if not found
 */
export const loadSignatureFromReportPhotos = async (reportId) => {
  if (!reportId) return null;

  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/report-photos?report_id=${reportId}&photo_type=client_signature`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const records = response.data.data || [];

    if (records.length === 0) return null;

    // Get the most recent signature
    const signatureRecord = records[0];
    
    // Return the photo URL directly from backend response
    return signatureRecord.photo_url;
  } catch (error) {
    console.error('Error loading signature from report_photos:', error);
    return null;
  }
};

/**
 * Loads all media (photos and signature) from report_photos collection
 * @param {string} reportId - Report ID
 * @returns {Promise<{photos: Array, signature: string|null}>} Object with photos array and signature
 */
export const loadAllMediaFromReportPhotos = async (reportId) => {
  if (!reportId) {
    return { photos: [], signature: null };
  }

  try {
    const token = localStorage.getItem('auth_token');
    const response = await axios.get(`${API_BASE_URL}/report-photos?report_id=${reportId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const records = response.data.data || [];

    const photos = [];
    let signature = null;

    records.forEach(record => {
      if (record.photo_type === 'client_signature') {
        // Get the most recent signature (in case there are multiple)
        if (!signature) {
          signature = record.photo_url;
        }
      } else {
        // Regular photo
        photos.push({
          id: record.id,
          url: record.photo_url,
          comment: record.comment || '',
          sequence: record.sequence || 0,
          photo_type: record.photo_type || 'photo'
        });
      }
    });

    return { photos, signature };
  } catch (error) {
    console.error('Error loading media from report_photos:', error);
    return { photos: [], signature: null };
  }
};