// API Server Client - Configurado para rodar localmente
const API_SERVER_URL = "http://localhost:3001";

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