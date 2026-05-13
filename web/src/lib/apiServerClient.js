// API Server Client - Configurado para usar URL base dinâmica
import { API_BASE_URL } from '../config/api.js';

const API_SERVER_URL = API_BASE_URL;

const apiServerClient = {
    fetch: async (url, options = {}) => {
        const fullUrl = API_SERVER_URL + url;
        console.log("Chamando API:", fullUrl); // para debug
        
        return await window.fetch(fullUrl, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });
    }
};

export default apiServerClient;
export { apiServerClient };