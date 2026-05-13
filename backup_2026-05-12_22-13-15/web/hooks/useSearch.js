import { useState, useMemo } from 'react';

export function useSearch(items = [], searchFields = []) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    
    if (!searchTerm || !searchTerm.trim() || !safeItems.length) {
      return safeItems;
    }
    
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return safeItems.filter(item => {
      return searchFields.some(field => {
        // Handle nested fields like 'expand.client_id.name'
        const value = field.split('.').reduce((obj, key) => obj?.[key], item);
        return String(value || '').toLowerCase().includes(lowercasedTerm);
      });
    });
  }, [items, searchTerm, searchFields]);

  return { searchTerm, setSearchTerm, filteredItems };
}