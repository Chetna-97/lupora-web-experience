const API_URL = import.meta.env.VITE_API_URL;
const TOKEN_KEY = 'lupora_token';

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
