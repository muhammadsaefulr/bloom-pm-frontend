import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

/**
 * Axios instance configured with credentials support for cookie-based authentication
 */
export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

/**
 * Request interceptor for adding auth tokens
 */
apiClient.interceptors.request.use(
    (config) => {
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for handling errors globally
 */
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                console.error('Unauthorized request');
            } else if (status === 403) {
                console.error('Forbidden');
            } else if (status === 404) {
                console.error('Resource not found');
            }

            error.message = data?.message || error.message;
        } else if (error.request) {
            error.message = 'No response from server';
        }

        return Promise.reject(error);
    }
);
