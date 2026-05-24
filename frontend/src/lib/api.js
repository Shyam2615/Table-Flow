import axios from 'axios';

const API = axios.create({
    baseURL: 'https://table-flow.onrender.com/api',
});

// Token provider — registered by AuthContext so the interceptor
// can always fetch a fresh Clerk session token.
let _tokenProvider = null;

/** Register a function that returns a fresh auth token (e.g. Clerk's getToken). */
export const setTokenProvider = (fn) => { _tokenProvider = fn; };

/** Manually get a fresh token (for explicit header injection). */
export const fetchAuthToken = async () => {
    try {
        if (_tokenProvider) {
            const token = await _tokenProvider();
            if (token) return token;
        }
    } catch { /* ignore */ }

    if (typeof window !== 'undefined' && window.__clerk_token) {
        return window.__clerk_token;
    }
    return null;
};

// Interceptor: auto-inject Bearer token on every request
API.interceptors.request.use(async (config) => {
    if (config.headers.Authorization) return config;

    // 1 — Try the live token provider (fresh Clerk session token)
    if (_tokenProvider) {
        try {
            const token = await _tokenProvider();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
                return config;
            }
        } catch { /* fall through */ }
    }

    // 2 — Fall back to the cached token on window
    if (typeof window !== 'undefined' && window.__clerk_token) {
        config.headers.Authorization = `Bearer ${window.__clerk_token}`;
    }

    return config;
});

export default API;
