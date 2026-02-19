const API_URL = import.meta.env.VITE_API_URL;
const BASE = import.meta.env.BASE_URL; // '/' in dev, '/lupora-web-experience/' in prod
const TOKEN_KEY = 'lupora_token';

// Resolves a DB asset path (e.g. "/image.webp") to the correct URL for the current environment
export function assetUrl(path) {
    if (!path) return '';
    return `${BASE}${path.startsWith('/') ? path.slice(1) : path}`;
}

export async function cartFetch(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });
    if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
    }
    return response.json();
}
